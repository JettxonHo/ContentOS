import { Buffer } from 'node:buffer';

import {
  type PastedUploadSnapshotContentType,
  PASTED_TEXT_MAX_BYTES,
  UPLOAD_EXTENSION_CONTENT_TYPES,
  type UploadExtension,
  UPLOAD_FILE_MAX_BYTES,
} from './source-values.js';
import { isWellFormedUnicode } from './source.js';

/**
 * Stable quarantine-denial reasons. Surfaced to API clients as
 * `details[].keyword` on the shared `422 INVALID_REQUEST` envelope and used
 * as the audit category field. Adding a reason is an API contract change.
 */
export type UploadDenialReason =
  | 'upload-file-name'
  | 'upload-file-extension'
  | 'upload-media-type'
  | 'upload-file-size'
  | 'upload-encoding'
  | 'upload-file-empty'
  | 'upload-field-invalid';

/**
 * Raised by the request-scoped Upload Quarantine gate (DEC-208, Security
 * Baseline §9) before any Object Storage or database side effect. Carries
 * only safe diagnostic context: an allowlisted extension token and a byte
 * count — never filename text, body bytes, paths, or credentials.
 */
export class UploadQuarantineError extends Error {
  constructor(
    readonly reason: UploadDenialReason,
    readonly safeContext: {
      readonly extensionToken: 'md' | 'txt' | 'none';
      readonly byteSize: number;
    },
  ) {
    super(`UPLOAD_QUARANTINE_DENIED:${reason}`);
    this.name = 'UploadQuarantineError';
  }
}

const UPLOAD_EXTENSION_TOKENS: Record<UploadExtension, 'md' | 'txt'> = { '.md': 'md', '.txt': 'txt' };

const MAX_UPLOAD_FILE_NAME_BYTES = 255;
const MAX_UPLOAD_DECLARED_MEDIA_TYPE_LENGTH = 100;
const UPLOAD_LABEL_MAX_SCALARS = 200;

/**
 * Declared multipart Content-Type values accepted for either allowed
 * extension (extension/MIME consistency check, Security Baseline §9).
 * Browsers commonly send `application/octet-stream` for `.md`; anything
 * outside this set (e.g. `text/html`, `image/png`) is a quarantine denial.
 */
export const ACCEPTED_UPLOAD_DECLARED_MEDIA_TYPES = ['text/plain', 'text/markdown', 'application/octet-stream'];

export interface ValidatedUploadFile {
  readonly extension: UploadExtension;
  readonly contentType: PastedUploadSnapshotContentType;
  /** Decoded normalized text: strict UTF-8, one leading BOM stripped. */
  readonly text: string;
  /** Sanitized filename stem (≤200 scalar values) or null when empty. */
  readonly derivedLabel: string | null;
}

function deny(reason: UploadDenialReason, extensionToken: 'md' | 'txt' | 'none', byteSize: number): never {
  throw new UploadQuarantineError(reason, { extensionToken, byteSize });
}

function extensionTokenFor(extension: UploadExtension | null): 'md' | 'txt' | 'none' {
  return extension === null ? 'none' : UPLOAD_EXTENSION_TOKENS[extension];
}

function validateUploadFileName(fileName: unknown): { extension: UploadExtension; stem: string } {
  if (typeof fileName !== 'string' || !isWellFormedUnicode(fileName)) {
    deny('upload-file-name', 'none', 0);
  }
  if (Buffer.byteLength(fileName, 'utf8') < 1 || Buffer.byteLength(fileName, 'utf8') > MAX_UPLOAD_FILE_NAME_BYTES) {
    deny('upload-file-name', 'none', 0);
  }
  for (let index = 0; index < fileName.length; index += 1) {
    const codeUnit = fileName.charCodeAt(index);
    // Deny path separators and C0/C1 control characters (including NUL).
    if (
      codeUnit === 0x2f ||
      codeUnit === 0x5c ||
      codeUnit <= 0x1f ||
      codeUnit === 0x7f ||
      (codeUnit >= 0x80 && codeUnit <= 0x9f)
    ) {
      deny('upload-file-name', 'none', 0);
    }
  }
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    deny('upload-file-extension', 'none', 0);
  }
  const extension = fileName.slice(lastDot).toLowerCase() as UploadExtension;
  if (!Object.hasOwn(UPLOAD_EXTENSION_CONTENT_TYPES, extension)) {
    deny('upload-file-extension', 'none', 0);
  }
  return { extension, stem: fileName.slice(0, lastDot) };
}

function validateDeclaredMediaType(declaredMediaType: string | null, extension: UploadExtension): void {
  if (declaredMediaType === null || declaredMediaType.trim() === '') {
    return;
  }
  if (declaredMediaType.length > MAX_UPLOAD_DECLARED_MEDIA_TYPE_LENGTH) {
    deny('upload-media-type', extensionTokenFor(extension), 0);
  }
  const mediaType = declaredMediaType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!ACCEPTED_UPLOAD_DECLARED_MEDIA_TYPES.includes(mediaType)) {
    deny('upload-media-type', extensionTokenFor(extension), 0);
  }
}

function decodeUploadBytes(bytes: Uint8Array, extension: UploadExtension): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    deny('upload-encoding', extensionTokenFor(extension), bytes.byteLength);
  }
  // Strip one leading U+FEFF BOM from the normalized text only; the Raw
  // Snapshot preserves the exact original bytes.
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function deriveLabel(stem: string): string | null {
  const trimmed = stem.trim();
  if (trimmed === '') {
    return null;
  }
  const scalars = [...trimmed];
  if (scalars.length > UPLOAD_LABEL_MAX_SCALARS) {
    return scalars.slice(0, UPLOAD_LABEL_MAX_SCALARS).join('');
  }
  return trimmed;
}

/**
 * Asserts an explicit user-supplied label obeys the Source label rules
 * (well-formed Unicode, ≤200 scalar values). Throws a quarantine denial
 * instead of the generic domain error so the denial is audit-categorized.
 */
export function assertUploadLabel(label: string | null): void {
  if (label === null) {
    return;
  }
  if (typeof label !== 'string' || !isWellFormedUnicode(label) || [...label.trim()].length > UPLOAD_LABEL_MAX_SCALARS) {
    deny('upload-field-invalid', 'none', 0);
  }
}

/**
 * The request-scoped Upload Quarantine gate. Runs filename, extension,
 * declared-MIME, size, encoding, and content validation before any side
 * effect (DEC-208 ordering). Denied uploads create zero persisted state.
 *
 * Throws UploadQuarantineError on any denial.
 */
export function validateUploadFile(input: {
  readonly fileName: unknown;
  readonly declaredMediaType: string | null;
  readonly bytes: Uint8Array;
}): ValidatedUploadFile {
  const { extension, stem } = validateUploadFileName(input.fileName);
  validateDeclaredMediaType(input.declaredMediaType, extension);

  const byteSize = input.bytes instanceof Uint8Array ? input.bytes.byteLength : -1;
  if (byteSize > UPLOAD_FILE_MAX_BYTES) {
    deny('upload-file-size', extensionTokenFor(extension), byteSize);
  }
  if (byteSize < 1) {
    deny('upload-file-empty', extensionTokenFor(extension), 0);
  }

  const text = decodeUploadBytes(input.bytes, extension);
  if (!isWellFormedUnicode(text)) {
    deny('upload-encoding', extensionTokenFor(extension), byteSize);
  }
  if (text.trim() === '') {
    deny('upload-file-empty', extensionTokenFor(extension), byteSize);
  }
  if (Buffer.byteLength(text, 'utf8') > PASTED_TEXT_MAX_BYTES) {
    deny('upload-file-size', extensionTokenFor(extension), byteSize);
  }

  return {
    extension,
    contentType: UPLOAD_EXTENSION_CONTENT_TYPES[extension],
    text,
    derivedLabel: deriveLabel(stem),
  };
}

export { UPLOAD_FILE_MAX_BYTES };
