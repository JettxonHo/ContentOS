import { describe, expect, it } from 'vitest';

import {
  ACCEPTED_UPLOAD_DECLARED_MEDIA_TYPES,
  assertUploadLabel,
  UploadQuarantineError,
  validateUploadFile,
} from './upload.js';
import { UPLOAD_FILE_MAX_BYTES } from './source-values.js';

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('validateUploadFile', () => {
  it('accepts a plain .txt file and maps it to text/plain', () => {
    const result = validateUploadFile({
      fileName: 'notes.txt',
      declaredMediaType: 'text/plain',
      bytes: utf8('hello world'),
    });
    expect(result.extension).toBe('.txt');
    expect(result.contentType).toBe('text/plain; charset=utf-8');
    expect(result.text).toBe('hello world');
    expect(result.derivedLabel).toBe('notes');
  });

  it('accepts a plain .md file and maps it to text/markdown', () => {
    const result = validateUploadFile({
      fileName: 'draft.md',
      declaredMediaType: 'text/markdown',
      bytes: utf8('# Title\nbody'),
    });
    expect(result.extension).toBe('.md');
    expect(result.contentType).toBe('text/markdown; charset=utf-8');
    expect(result.text).toBe('# Title\nbody');
    expect(result.derivedLabel).toBe('draft');
  });

  it('accepts extensions case-insensitively', () => {
    const result = validateUploadFile({ fileName: 'NOTES.MD', declaredMediaType: null, bytes: utf8('x') });
    expect(result.extension).toBe('.md');
    expect(result.derivedLabel).toBe('NOTES');
  });

  it('accepts a missing declared media type and application/octet-stream', () => {
    expect(validateUploadFile({ fileName: 'a.txt', declaredMediaType: null, bytes: utf8('x') }).extension).toBe('.txt');
    expect(
      validateUploadFile({ fileName: 'a.md', declaredMediaType: 'application/octet-stream', bytes: utf8('x') })
        .extension,
    ).toBe('.md');
  });

  it('ignores declared media type parameters', () => {
    const result = validateUploadFile({
      fileName: 'a.txt',
      declaredMediaType: 'text/plain; charset=us-ascii',
      bytes: utf8('x'),
    });
    expect(result.extension).toBe('.txt');
  });

  it('accepts exactly the documented declared media type allowlist', () => {
    expect(ACCEPTED_UPLOAD_DECLARED_MEDIA_TYPES).toEqual(['text/plain', 'text/markdown', 'application/octet-stream']);
  });

  it('strips one leading UTF-8 BOM from the normalized text only', () => {
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8('body')]);
    const result = validateUploadFile({ fileName: 'bom.txt', declaredMediaType: null, bytes: withBom });
    expect(result.text).toBe('body');
  });

  it('preserves supplementary-plane scalar values', () => {
    const result = validateUploadFile({ fileName: 'emoji.md', declaredMediaType: null, bytes: utf8('poop 💩 ok') });
    expect(result.text).toBe('poop 💩 ok');
  });

  it('accepts the exact size bound', () => {
    const bytes = utf8('a'.repeat(UPLOAD_FILE_MAX_BYTES));
    expect(bytes.byteLength).toBe(UPLOAD_FILE_MAX_BYTES);
    const result = validateUploadFile({ fileName: 'max.txt', declaredMediaType: null, bytes });
    expect(result.text.length).toBe(UPLOAD_FILE_MAX_BYTES);
  });

  it('denies a stem-less dotfile name such as ".md"', () => {
    expect(() => validateUploadFile({ fileName: '.md', declaredMediaType: null, bytes: utf8('x') })).toThrow(
      UploadQuarantineError,
    );
  });

  it('truncates derived labels to 200 scalar values', () => {
    const longStem = 's'.repeat(250);
    const result = validateUploadFile({ fileName: `${longStem}.txt`, declaredMediaType: null, bytes: utf8('x') });
    expect(result.derivedLabel).toHaveLength(200);
  });

  const denialCases: ReadonlyArray<{
    readonly name: string;
    readonly fileName: unknown;
    readonly declaredMediaType?: string | null;
    readonly bytes?: Uint8Array;
    readonly reason: string;
  }> = [
    { name: 'executable extension', fileName: 'virus.exe', reason: 'upload-file-extension' },
    { name: 'html extension', fileName: 'page.html', reason: 'upload-file-extension' },
    { name: 'double extension ends disallowed', fileName: 'notes.md.exe', reason: 'upload-file-extension' },
    { name: 'missing extension', fileName: 'notes', reason: 'upload-file-extension' },
    { name: 'trailing dot', fileName: 'notes.', reason: 'upload-file-extension' },
    { name: 'forward slash', fileName: '../notes.txt', reason: 'upload-file-name' },
    { name: 'backslash', fileName: 'dir\\notes.txt', reason: 'upload-file-name' },
    { name: 'NUL in name', fileName: 'no\0tes.txt', reason: 'upload-file-name' },
    { name: 'control char in name', fileName: 'no\x01tes.txt', reason: 'upload-file-name' },
    { name: 'overlong name', fileName: `${'n'.repeat(252)}.txt`, reason: 'upload-file-name' },
    { name: 'empty name', fileName: '', reason: 'upload-file-name' },
    { name: 'non-string name', fileName: 42, reason: 'upload-file-name' },
    { name: 'lone surrogate name', fileName: 'bad\ud800.txt', reason: 'upload-file-name' },
  ];

  for (const testCase of denialCases) {
    it(`denies ${testCase.name} with ${testCase.reason}`, () => {
      try {
        validateUploadFile({
          fileName: testCase.fileName,
          declaredMediaType: testCase.declaredMediaType ?? null,
          bytes: testCase.bytes ?? utf8('x'),
        });
        expect.unreachable('expected a quarantine denial');
      } catch (error) {
        expect(error).toBeInstanceOf(UploadQuarantineError);
        expect((error as UploadQuarantineError).reason).toBe(testCase.reason);
      }
    });
  }

  it('denies inconsistent declared media types', () => {
    for (const declared of ['text/html', 'image/png', 'application/javascript']) {
      try {
        validateUploadFile({ fileName: 'a.md', declaredMediaType: declared, bytes: utf8('x') });
        expect.unreachable('expected a quarantine denial');
      } catch (error) {
        expect((error as UploadQuarantineError).reason).toBe('upload-media-type');
        expect((error as UploadQuarantineError).safeContext.extensionToken).toBe('md');
      }
    }
  });

  it('denies an oversized file with the exact byte count in safe context', () => {
    const bytes = utf8('a'.repeat(UPLOAD_FILE_MAX_BYTES + 1));
    try {
      validateUploadFile({ fileName: 'big.txt', declaredMediaType: null, bytes });
      expect.unreachable('expected a quarantine denial');
    } catch (error) {
      expect((error as UploadQuarantineError).reason).toBe('upload-file-size');
      expect((error as UploadQuarantineError).safeContext.byteSize).toBe(UPLOAD_FILE_MAX_BYTES + 1);
      expect((error as UploadQuarantineError).safeContext.extensionToken).toBe('txt');
    }
  });

  it('denies an empty file', () => {
    try {
      validateUploadFile({ fileName: 'empty.txt', declaredMediaType: null, bytes: new Uint8Array(0) });
      expect.unreachable('expected a quarantine denial');
    } catch (error) {
      expect((error as UploadQuarantineError).reason).toBe('upload-file-empty');
    }
  });

  it('denies a whitespace-only file', () => {
    try {
      validateUploadFile({ fileName: 'ws.txt', declaredMediaType: null, bytes: utf8('  \n\t ') });
      expect.unreachable('expected a quarantine denial');
    } catch (error) {
      expect((error as UploadQuarantineError).reason).toBe('upload-file-empty');
    }
  });

  it('denies invalid UTF-8 byte sequences', () => {
    try {
      validateUploadFile({ fileName: 'bad.txt', declaredMediaType: null, bytes: new Uint8Array([0xff, 0xfe, 0x41]) });
      expect.unreachable('expected a quarantine denial');
    } catch (error) {
      expect((error as UploadQuarantineError).reason).toBe('upload-encoding');
    }
  });

  it('denies NUL bytes in otherwise valid UTF-8', () => {
    try {
      validateUploadFile({ fileName: 'nul.txt', declaredMediaType: null, bytes: utf8('a\0b') });
      expect.unreachable('expected a quarantine denial');
    } catch (error) {
      expect((error as UploadQuarantineError).reason).toBe('upload-encoding');
    }
  });
});

describe('assertUploadLabel', () => {
  it('accepts null and valid labels', () => {
    expect(() => assertUploadLabel(null)).not.toThrow();
    expect(() => assertUploadLabel('my notes')).not.toThrow();
    expect(() => assertUploadLabel('x'.repeat(200))).not.toThrow();
  });

  it('denies overlong, NUL, and lone-surrogate labels', () => {
    for (const label of ['x'.repeat(201), 'bad\0label', 'bad\ud800label']) {
      try {
        assertUploadLabel(label);
        expect.unreachable('expected a quarantine denial');
      } catch (error) {
        expect((error as UploadQuarantineError).reason).toBe('upload-field-invalid');
      }
    }
  });
});
