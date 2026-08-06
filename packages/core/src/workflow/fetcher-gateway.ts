import { createHash } from 'node:crypto';

import type { ObjectStore, StoredObject } from '../source/object-store.js';
import { isWellFormedUnicode } from '../source/source.js';
import {
  PASTED_TEXT_MAX_BYTES,
  URL_SNAPSHOT_CONTENT_TYPES,
  type UrlSnapshotContentType,
} from '../source/source-values.js';

import { canonicalWorkflowSerialization, type WorkflowEventId, type WorkflowNodeId } from './workflow.js';
import type { UrlSourceReferenceId, WorkflowTaskId } from './url-capture.js';

export const FETCHER_GATEWAY_CONNECTION_POLICY_VERSION = 'public-url-connection/v1' as const;
export const FETCHER_GATEWAY_RESOURCE_POLICY_VERSION = 'public-url-resource/v1' as const;
export const FETCHER_GATEWAY_TASK_KIND = 'url_capture' as const;
export const FETCHER_GATEWAY_CLAIMED_BY = 'fetcher' as const;
export const FETCHER_GATEWAY_INITIAL_LEASE_MS = 60_000;
export const FETCHER_GATEWAY_HEARTBEAT_CADENCE_MS = 20_000;
export const FETCHER_GATEWAY_MAX_LEASE_MS = 120_000;
export const FETCHER_GATEWAY_CLAIM_BYTES = 32;
export const FETCHER_GATEWAY_CLAIM_LENGTH = 43;
export const FETCHER_LEASE_EXPIRED_EVENT_TYPE = 'fetcher_lease_expired.v1' as const;

export interface FetcherLeaseExpiredEventPayload {
  readonly taskId: WorkflowTaskId;
  readonly claimAttemptNumber: number;
  readonly previousDeliveryGeneration: number;
  readonly nextDeliveryGeneration: number;
}

export interface FetcherLeaseExpiredEventValue {
  readonly eventType: typeof FETCHER_LEASE_EXPIRED_EVENT_TYPE;
  readonly payload: FetcherLeaseExpiredEventPayload;
}

export interface FetcherLeaseRecoveryCandidate {
  readonly taskId: WorkflowTaskId;
  readonly claimAttemptNumber: number;
  readonly deliveryGeneration: number;
}

export interface FetcherLeaseRecoveryRequest {
  readonly candidate: FetcherLeaseRecoveryCandidate;
  readonly eventId: WorkflowEventId;
  readonly recoveredAt: Date;
}

export interface FetcherGatewayClaimRecord {
  readonly taskId: WorkflowTaskId;
  readonly taskKind: typeof FETCHER_GATEWAY_TASK_KIND;
  readonly submittedUrl: string;
  readonly attemptNumber: number;
  readonly leaseExpiresAt: Date;
}

export interface FetcherGatewayHeartbeatRecord {
  readonly taskId: WorkflowTaskId;
  readonly attemptNumber: number;
  readonly leaseExpiresAt: Date;
  readonly renewed: boolean;
}

export interface FetcherGatewayClaimRepository {
  claimTask(input: {
    readonly taskId: WorkflowTaskId;
    readonly deliveryGeneration: number;
    readonly claimHash: string;
    readonly now: Date;
  }): Promise<FetcherGatewayClaimRecord | null>;
  heartbeatTask(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly now: Date;
  }): Promise<FetcherGatewayHeartbeatRecord | null>;
}

export interface FetcherGatewayClaimGenerator {
  generate(): string;
}

export interface FetcherGatewayClock {
  now(): Date;
}

export interface FetcherGatewayClaimResponse {
  readonly taskId: WorkflowTaskId;
  readonly taskKind: typeof FETCHER_GATEWAY_TASK_KIND;
  readonly submittedUrl: string;
  readonly connectionPolicyVersion: typeof FETCHER_GATEWAY_CONNECTION_POLICY_VERSION;
  readonly resourcePolicyVersion: typeof FETCHER_GATEWAY_RESOURCE_POLICY_VERSION;
  readonly attemptNumber: number;
  readonly leaseExpiresAt: Date;
  readonly claim: string;
}

export interface FetcherGatewayHeartbeatResponse {
  readonly taskId: WorkflowTaskId;
  readonly attemptNumber: number;
  readonly leaseExpiresAt: Date;
  readonly renewed: boolean;
}

export type FetcherGatewayApplicationErrorCode =
  'FETCHER_TASK_UNAVAILABLE' | 'FETCHER_CLAIM_UNAVAILABLE' | 'FETCHER_RESULT_UNAVAILABLE';

export class FetcherGatewayApplicationError extends Error {
  constructor(readonly code: FetcherGatewayApplicationErrorCode) {
    super(code);
    this.name = 'FetcherGatewayApplicationError';
  }
}

export type FetcherGatewayDomainErrorCode =
  | 'INVALID_FETCHER_GATEWAY_CLAIM'
  | 'INVALID_FETCHER_GATEWAY_HEARTBEAT'
  | 'INVALID_FETCHER_GATEWAY_POLICY'
  | 'INVALID_FETCHER_LEASE_EXPIRED_EVENT'
  | 'INVALID_FETCHER_RESULT'
  | 'INVALID_URL_CAPTURE_STORAGE_KEY'
  | 'INVALID_URL_CAPTURE_RESULT_EVENT';

export class FetcherGatewayDomainError extends Error {
  constructor(readonly code: FetcherGatewayDomainErrorCode) {
    super(code);
    this.name = 'FetcherGatewayDomainError';
  }
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function validTaskId(value: unknown): value is WorkflowTaskId {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && value.trim() === value;
}

function validGeneration(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 2_147_483_647;
}

function validOpaqueClaim(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function validAttemptNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

const LEASE_EXPIRED_EVENT_KEYS: readonly string[] = [
  'taskId',
  'claimAttemptNumber',
  'previousDeliveryGeneration',
  'nextDeliveryGeneration',
];

interface LeaseExpiredEventFields {
  readonly taskId: unknown;
  readonly claimAttemptNumber: unknown;
  readonly previousDeliveryGeneration: unknown;
  readonly nextDeliveryGeneration: unknown;
}

/**
 * Validates that `value` is a plain data object owning exactly the four
 * approved keys as data (non-accessor) properties, and returns the four values
 * read from their property descriptors. The value is never read through the
 * object's `get` trap, so a hostile getter or Proxy `get` trap cannot execute.
 * All reflection is guarded: a revoked Proxy, or a Proxy whose
 * `getPrototypeOf`/`ownKeys`/`getOwnPropertyDescriptor` traps throw, yields
 * `undefined` (a stable rejection) rather than leaking a native error.
 */
function extractLeaseExpiredEventFields(value: unknown): LeaseExpiredEventFields | undefined {
  try {
    if (typeof value !== 'object' || value === null) return undefined;
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && proto !== Object.prototype) return undefined;
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== LEASE_EXPIRED_EVENT_KEYS.length) return undefined;
    const fields: Record<string, unknown> = {};
    for (const key of ownKeys) {
      if (typeof key !== 'string' || !LEASE_EXPIRED_EVENT_KEYS.includes(key)) return undefined;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !('value' in descriptor)) return undefined;
      fields[key] = descriptor.value;
    }
    return {
      taskId: fields.taskId,
      claimAttemptNumber: fields.claimAttemptNumber,
      previousDeliveryGeneration: fields.previousDeliveryGeneration,
      nextDeliveryGeneration: fields.nextDeliveryGeneration,
    };
  } catch {
    return undefined;
  }
}

export function defineFetcherLeaseExpiredEventValue(input: unknown): FetcherLeaseExpiredEventValue {
  const fields = extractLeaseExpiredEventFields(input);
  if (fields === undefined) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT');
  }
  const taskId = fields.taskId;
  const claimAttemptNumber = fields.claimAttemptNumber;
  const previousDeliveryGeneration = fields.previousDeliveryGeneration;
  const nextDeliveryGeneration = fields.nextDeliveryGeneration;
  if (
    !validTaskId(taskId) ||
    !validAttemptNumber(claimAttemptNumber) ||
    !validGeneration(previousDeliveryGeneration) ||
    !validGeneration(nextDeliveryGeneration) ||
    nextDeliveryGeneration !== previousDeliveryGeneration + 1
  ) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT');
  }
  const payload: FetcherLeaseExpiredEventPayload = Object.freeze({
    taskId,
    claimAttemptNumber,
    previousDeliveryGeneration,
    nextDeliveryGeneration,
  });
  return Object.freeze({
    eventType: FETCHER_LEASE_EXPIRED_EVENT_TYPE,
    payload,
  });
}

function validClaimResponse(input: FetcherGatewayClaimResponse): boolean {
  return (
    validTaskId(input.taskId) &&
    input.taskKind === FETCHER_GATEWAY_TASK_KIND &&
    typeof input.submittedUrl === 'string' &&
    input.submittedUrl.length > 0 &&
    input.submittedUrl.length <= 2048 &&
    validAttemptNumber(input.attemptNumber) &&
    validDate(input.leaseExpiresAt) &&
    validOpaqueClaim(input.claim)
  );
}

function validHeartbeatResponse(input: FetcherGatewayHeartbeatResponse): boolean {
  return (
    validTaskId(input.taskId) &&
    validAttemptNumber(input.attemptNumber) &&
    validDate(input.leaseExpiresAt) &&
    typeof input.renewed === 'boolean'
  );
}

export function hashFetcherGatewayClaim(claim: string): string {
  if (!validOpaqueClaim(claim)) throw new FetcherGatewayDomainError('INVALID_FETCHER_GATEWAY_CLAIM');
  return createHash('sha256').update(claim, 'utf8').digest('hex');
}

export function defineFetcherGatewayClaimResponse(input: FetcherGatewayClaimResponse): FetcherGatewayClaimResponse {
  if (!validClaimResponse(input) || input.leaseExpiresAt.getTime() <= 0) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_GATEWAY_CLAIM');
  }
  if (
    input.connectionPolicyVersion !== FETCHER_GATEWAY_CONNECTION_POLICY_VERSION ||
    input.resourcePolicyVersion !== FETCHER_GATEWAY_RESOURCE_POLICY_VERSION
  ) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_GATEWAY_POLICY');
  }
  return Object.freeze({ ...input, leaseExpiresAt: new Date(input.leaseExpiresAt.getTime()) });
}

export function defineFetcherGatewayHeartbeatResponse(
  input: FetcherGatewayHeartbeatResponse,
): FetcherGatewayHeartbeatResponse {
  if (!validHeartbeatResponse(input) || input.leaseExpiresAt.getTime() <= 0) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_GATEWAY_HEARTBEAT');
  }
  return Object.freeze({ ...input, leaseExpiresAt: new Date(input.leaseExpiresAt.getTime()) });
}

export class FetcherGatewayService {
  constructor(
    private readonly repository: FetcherGatewayClaimRepository,
    private readonly claims: FetcherGatewayClaimGenerator,
    private readonly clock: FetcherGatewayClock,
  ) {}

  async claim(taskId: WorkflowTaskId, deliveryGeneration: number): Promise<FetcherGatewayClaimResponse> {
    if (!validTaskId(taskId) || !validGeneration(deliveryGeneration)) {
      throw new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE');
    }
    const now = this.clock.now();
    if (!validDate(now)) throw new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE');
    const claim = this.claims.generate();
    const claimHash = hashFetcherGatewayClaim(claim);
    const record = await this.repository.claimTask({
      taskId,
      deliveryGeneration,
      claimHash,
      now: new Date(now.getTime()),
    });
    if (record === null) throw new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE');
    return defineFetcherGatewayClaimResponse({
      taskId: record.taskId,
      taskKind: record.taskKind,
      submittedUrl: record.submittedUrl,
      connectionPolicyVersion: FETCHER_GATEWAY_CONNECTION_POLICY_VERSION,
      resourcePolicyVersion: FETCHER_GATEWAY_RESOURCE_POLICY_VERSION,
      attemptNumber: record.attemptNumber,
      leaseExpiresAt: record.leaseExpiresAt,
      claim,
    });
  }

  async heartbeat(taskId: WorkflowTaskId, claim: string): Promise<FetcherGatewayHeartbeatResponse> {
    if (!validTaskId(taskId) || !validOpaqueClaim(claim)) {
      throw new FetcherGatewayApplicationError('FETCHER_CLAIM_UNAVAILABLE');
    }
    const now = this.clock.now();
    if (!validDate(now)) throw new FetcherGatewayApplicationError('FETCHER_CLAIM_UNAVAILABLE');
    const record = await this.repository.heartbeatTask({
      taskId,
      claimHash: hashFetcherGatewayClaim(claim),
      now: new Date(now.getTime()),
    });
    if (record === null) throw new FetcherGatewayApplicationError('FETCHER_CLAIM_UNAVAILABLE');
    return defineFetcherGatewayHeartbeatResponse(record);
  }
}

// ---------------------------------------------------------------------------
// M2-SRC-003 — URL-capture Result Contract and Source Evidence Boundary
// ---------------------------------------------------------------------------

export const FETCHER_RESULT_VERSION = 'fetcher-result/v1' as const;

export const URL_CAPTURE_SUCCEEDED_EVENT_TYPE = 'url_capture_succeeded.v1' as const;
export const URL_CAPTURE_FAILED_EVENT_TYPE = 'url_capture_failed.v1' as const;

/** Fixed encoded Raw Snapshot byte bound for a successful URL capture (2 MiB). */
export const FETCHER_RESULT_SNAPSHOT_MAX_BYTES = 2_097_152;
/** Fixed decoded body byte bound for a successful URL capture (8 MiB). */
export const FETCHER_RESULT_DECODED_MAX_BYTES = 8_388_608;
/** Candidate Domain limit — unchanged from the Normalized Source rule. */
export const FETCHER_RESULT_CANDIDATE_MAX_BYTES = PASTED_TEXT_MAX_BYTES;
export const FETCHER_RESULT_REDIRECT_MAX_COUNT = 5;
export const FETCHER_RESULT_URL_MAX_BYTES = 2_048;
export const FETCHER_RESULT_STORAGE_KEY_MAX_LENGTH = 512;

/** Exact one-to-one Fetcher-supplied failure mapping. */
export const FETCHER_FAILURE_CATEGORY_TO_CODE = {
  fetch_failed: 'FETCH_FAILED',
  validation_blocked: 'VALIDATION_BLOCKED',
  unsupported_content: 'UNSUPPORTED_CONTENT',
  too_large: 'TOO_LARGE',
  timeout: 'TIMEOUT',
  redirect_blocked: 'REDIRECT_BLOCKED',
  extraction_failed: 'EXTRACTION_FAILED',
} as const;

/** Server-derived failure mapping — produced only by API/Core. */
export const SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE = {
  package_archived: 'PACKAGE_ARCHIVED',
  source_role_limit: 'SOURCE_ROLE_LIMIT',
  object_integrity_failed: 'OBJECT_INTEGRITY_FAILED',
} as const;

export type FetcherFailureCategory = keyof typeof FETCHER_FAILURE_CATEGORY_TO_CODE;
export type FetcherFailureSafeCode = (typeof FETCHER_FAILURE_CATEGORY_TO_CODE)[FetcherFailureCategory];
export type ServerDerivedFailureCategory = keyof typeof SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE;
export type ServerDerivedFailureSafeCode =
  (typeof SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE)[ServerDerivedFailureCategory];
export type FetcherResultRecordedCategory = FetcherFailureCategory | ServerDerivedFailureCategory;
export type FetcherResultSafeCode = FetcherFailureSafeCode | ServerDerivedFailureSafeCode;

const FETCHER_FAILURE_CATEGORY_SET = new Set<string>(Object.keys(FETCHER_FAILURE_CATEGORY_TO_CODE));
const URL_SNAPSHOT_CONTENT_TYPE_SET = new Set<string>(URL_SNAPSHOT_CONTENT_TYPES);
const RESULT_CONTENT_ENCODINGS = ['identity', 'gzip', 'deflate', 'br'] as const;
export type FetcherResultContentEncoding = (typeof RESULT_CONTENT_ENCODINGS)[number];
const RESULT_CONTENT_ENCODING_SET = new Set<string>(RESULT_CONTENT_ENCODINGS);
const RESULT_REDIRECT_STATUSES = [301, 302, 303, 307, 308] as const;

const RESULT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FetcherResultRedirectStatus = (typeof RESULT_REDIRECT_STATUSES)[number];

export interface FetcherResultRedirectSubmission {
  readonly status: FetcherResultRedirectStatus;
  readonly url: string;
}

export interface FetcherResultSnapshotSubmission {
  readonly snapshotId: string;
  readonly storageKey: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly contentType: UrlSnapshotContentType;
  readonly contentEncoding: FetcherResultContentEncoding;
}

export interface FetcherResultCaptureSubmission {
  readonly finalUrl: string;
  readonly redirects: readonly FetcherResultRedirectSubmission[];
  readonly responseStatus: 200;
  readonly encodedByteSize: number;
  readonly decodedByteSize: number;
}

export interface FetcherResultCandidateSubmission {
  readonly schemaVersion: 'source/normalized/v1';
  readonly text: string;
}

export interface FetcherResultSuccessSubmission {
  readonly resultVersion: typeof FETCHER_RESULT_VERSION;
  readonly attemptNumber: number;
  readonly outcome: 'succeeded';
  readonly snapshot: FetcherResultSnapshotSubmission;
  readonly capture: FetcherResultCaptureSubmission;
  readonly candidate: FetcherResultCandidateSubmission;
}

export interface FetcherResultFailureSubmission {
  readonly resultVersion: typeof FETCHER_RESULT_VERSION;
  readonly attemptNumber: number;
  readonly outcome: 'failed';
  readonly category: FetcherFailureCategory;
  readonly code: FetcherFailureSafeCode;
}

export type FetcherResultSubmission = FetcherResultSuccessSubmission | FetcherResultFailureSubmission;

function resultInvalid(): never {
  throw new FetcherGatewayDomainError('INVALID_FETCHER_RESULT');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  try {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  } catch {
    return false;
  }
}

/**
 * Reads the own properties of a plain record as data (non-accessor) values via
 * their property descriptors, so a hostile getter or Proxy `get` trap cannot
 * execute. Symbol keys, accessor properties, Class instances, and throwing
 * Proxy reflection traps all yield `undefined` (a stable rejection).
 */
function extractResultRecord(value: unknown): Record<string, unknown> | undefined {
  try {
    if (!isPlainRecord(value)) return undefined;
    if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const ownKeys = Reflect.ownKeys(value);
    const record = Object.create(null) as Record<string, unknown>;
    for (const key of ownKeys) {
      if (typeof key !== 'string') return undefined;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !('value' in descriptor)) return undefined;
      record[key] = descriptor.value;
    }
    return record;
  } catch {
    return undefined;
  }
}

function hasExactly(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(record);
  if (actual.length !== keys.length) return false;
  for (const key of keys) {
    if (!(key in record)) return false;
  }
  return true;
}

function validResultAttempt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function validResultUuid(value: unknown): value is string {
  return typeof value === 'string' && RESULT_UUID_PATTERN.test(value);
}

function validResultSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

function validResultByteSize(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= max;
}

/** Validates an absolute http/https URL bounded to 2048 UTF-8 bytes. */
function validResultUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 1 || !isWellFormedUnicode(value)) return false;
  let byteLength: number;
  try {
    byteLength = new TextEncoder().encode(value).byteLength;
  } catch {
    return false;
  }
  if (byteLength < 1 || byteLength > FETCHER_RESULT_URL_MAX_BYTES) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.length > 0 &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
}

function validCandidateText(value: unknown): value is string {
  if (typeof value !== 'string' || !isWellFormedUnicode(value)) return false;
  if (value.trim().length === 0) return false;
  const byteLength = Buffer.byteLength(value, 'utf8');
  return byteLength >= 1 && byteLength <= FETCHER_RESULT_CANDIDATE_MAX_BYTES;
}

function extractRedirects(value: unknown): readonly FetcherResultRedirectSubmission[] | undefined {
  try {
    if (!Array.isArray(value)) return undefined;
    const ownKeys = Reflect.ownKeys(value);
    // `length` must be an own data descriptor holding a safe integer 0..max.
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (lengthDescriptor === undefined || !('value' in lengthDescriptor)) return undefined;
    const length = lengthDescriptor.value;
    if (
      typeof length !== 'number' ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > FETCHER_RESULT_REDIRECT_MAX_COUNT
    ) {
      return undefined;
    }
    // Own keys must be exactly the dense indices 0..length-1 plus `length`;
    // this rejects sparse arrays, Symbol keys, and extra string properties.
    if (ownKeys.length !== length + 1) return undefined;
    const expectedKeys = new Set<string>(['length']);
    for (let index = 0; index < length; index += 1) expectedKeys.add(String(index));
    for (const key of ownKeys) {
      if (typeof key !== 'string' || !expectedKeys.has(key)) return undefined;
    }
    // Read every element through its data descriptor only — never via `get`,
    // so an index accessor or Proxy `get` trap cannot execute.
    const redirects: FetcherResultRedirectSubmission[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !('value' in descriptor)) return undefined;
      const item = extractResultRecord(descriptor.value);
      if (item === undefined || !hasExactly(item, ['status', 'url'])) return undefined;
      const status = item.status;
      const url = item.url;
      if (
        typeof status !== 'number' ||
        !(RESULT_REDIRECT_STATUSES as readonly number[]).includes(status) ||
        !validResultUrl(url)
      ) {
        return undefined;
      }
      redirects.push({ status: status as FetcherResultRedirectStatus, url });
    }
    return Object.freeze(redirects);
  } catch {
    return undefined;
  }
}

function extractSuccessSubmission(top: Record<string, unknown>): FetcherResultSuccessSubmission {
  if (!hasExactly(top, ['resultVersion', 'attemptNumber', 'outcome', 'snapshot', 'capture', 'candidate'])) {
    resultInvalid();
  }
  const attemptNumber = top.attemptNumber;
  if (top.resultVersion !== FETCHER_RESULT_VERSION || !validResultAttempt(attemptNumber)) resultInvalid();

  const snapshot = extractResultRecord(top.snapshot);
  if (
    snapshot === undefined ||
    !hasExactly(snapshot, ['snapshotId', 'storageKey', 'sha256', 'byteSize', 'contentType', 'contentEncoding'])
  ) {
    resultInvalid();
  }
  const snapshotId = snapshot.snapshotId;
  const storageKey = snapshot.storageKey;
  const sha256 = snapshot.sha256;
  const byteSize = snapshot.byteSize;
  const contentType = snapshot.contentType;
  const contentEncoding = snapshot.contentEncoding;
  if (
    !validResultUuid(snapshotId) ||
    typeof storageKey !== 'string' ||
    storageKey.length < 1 ||
    storageKey.length > FETCHER_RESULT_STORAGE_KEY_MAX_LENGTH ||
    !validResultSha256(sha256) ||
    !validResultByteSize(byteSize, FETCHER_RESULT_SNAPSHOT_MAX_BYTES) ||
    typeof contentType !== 'string' ||
    !URL_SNAPSHOT_CONTENT_TYPE_SET.has(contentType) ||
    typeof contentEncoding !== 'string' ||
    !RESULT_CONTENT_ENCODING_SET.has(contentEncoding)
  ) {
    resultInvalid();
  }

  const capture = extractResultRecord(top.capture);
  if (
    capture === undefined ||
    !hasExactly(capture, ['finalUrl', 'redirects', 'responseStatus', 'encodedByteSize', 'decodedByteSize'])
  ) {
    resultInvalid();
  }
  const finalUrl = capture.finalUrl;
  const redirects = extractRedirects(capture.redirects);
  const responseStatus = capture.responseStatus;
  const encodedByteSize = capture.encodedByteSize;
  const decodedByteSize = capture.decodedByteSize;
  if (
    !validResultUrl(finalUrl) ||
    redirects === undefined ||
    responseStatus !== 200 ||
    !validResultByteSize(encodedByteSize, FETCHER_RESULT_SNAPSHOT_MAX_BYTES) ||
    encodedByteSize !== byteSize ||
    !validResultByteSize(decodedByteSize, FETCHER_RESULT_DECODED_MAX_BYTES)
  ) {
    resultInvalid();
  }

  const candidate = extractResultRecord(top.candidate);
  if (candidate === undefined || !hasExactly(candidate, ['schemaVersion', 'text'])) resultInvalid();
  const candidateText = candidate.text;
  if (candidate.schemaVersion !== 'source/normalized/v1' || !validCandidateText(candidateText)) resultInvalid();

  return Object.freeze({
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber,
    outcome: 'succeeded',
    snapshot: Object.freeze({
      snapshotId,
      storageKey,
      sha256,
      byteSize,
      contentType: contentType as UrlSnapshotContentType,
      contentEncoding: contentEncoding as FetcherResultContentEncoding,
    }),
    capture: Object.freeze({
      finalUrl,
      redirects,
      responseStatus: 200,
      encodedByteSize,
      decodedByteSize,
    }),
    candidate: Object.freeze({
      schemaVersion: 'source/normalized/v1',
      text: candidateText,
    }),
  });
}

function extractFailureSubmission(top: Record<string, unknown>): FetcherResultFailureSubmission {
  if (!hasExactly(top, ['resultVersion', 'attemptNumber', 'outcome', 'category', 'code'])) resultInvalid();
  const attemptNumber = top.attemptNumber;
  const category = top.category;
  const code = top.code;
  if (top.resultVersion !== FETCHER_RESULT_VERSION || !validResultAttempt(attemptNumber)) resultInvalid();
  if (typeof category !== 'string' || !FETCHER_FAILURE_CATEGORY_SET.has(category)) resultInvalid();
  const expectedCode = FETCHER_FAILURE_CATEGORY_TO_CODE[category as FetcherFailureCategory];
  if (code !== expectedCode) resultInvalid();
  return Object.freeze({
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber,
    outcome: 'failed',
    category: category as FetcherFailureCategory,
    code: expectedCode,
  });
}

/**
 * Validates that `value` is an exact-shape `fetcher-result/v1` submission.
 * Extra/missing fields, non-objects, arrays, Class instances, Symbol keys,
 * accessor properties, throwing Proxy traps, and getter execution are all
 * rejected with a stable `INVALID_FETCHER_RESULT` domain error.
 */
export function defineFetcherResultSubmission(value: unknown): FetcherResultSubmission {
  const top = extractResultRecord(value);
  if (top === undefined) resultInvalid();
  const outcome = top.outcome;
  if (outcome === 'succeeded') return extractSuccessSubmission(top);
  if (outcome === 'failed') return extractFailureSubmission(top);
  resultInvalid();
}

/**
 * Canonical, deterministic serialization of a validated submission. Because the
 * submission has already been exact-shape extracted (no getters, Symbols, or
 * Proxies), this serialization is total and stable.
 */
export function canonicalFetcherResultSerialization(submission: FetcherResultSubmission): string {
  return canonicalWorkflowSerialization(submission);
}

/** Lowercase SHA-256 fingerprint of the canonical submitted Payload. */
export function fetcherResultPayloadFingerprint(submission: FetcherResultSubmission): string {
  return createHash('sha256').update(canonicalFetcherResultSerialization(submission), 'utf8').digest('hex');
}

// --- Task-scoped Object Storage key family ---------------------------------

export interface UrlCaptureStorageKeyParts {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly snapshotId: string;
}

export function buildUrlCaptureStorageKey(input: {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly snapshotId: string;
}): string {
  return `fetcher/url-capture/${input.taskId}/${input.attemptNumber}/raw/${input.snapshotId}`;
}

/**
 * Reconstructs the fixed `public_url` key field-by-field. A prefix/substring
 * check is never sufficient: the key must split into exactly six segments and
 * each bound field is validated independently. Returns `null` for any wrong
 * task/attempt/snapshot shape, extra or empty segment, repeated separator,
 * `.`, `..`, backslash, control character, or malformed UUID.
 */
export function parseUrlCaptureStorageKey(key: unknown): UrlCaptureStorageKeyParts | null {
  if (typeof key !== 'string' || key.length < 1 || key.length > FETCHER_RESULT_STORAGE_KEY_MAX_LENGTH) {
    return null;
  }
  for (let index = 0; index < key.length; index += 1) {
    const code = key.charCodeAt(index);
    // Reject control characters and backslash; the forward slash separator is
    // handled by the segment split below.
    if (code <= 0x1f || code === 0x7f || code === 0x5c) return null;
  }
  const segments = key.split('/');
  if (segments.length !== 6) return null;
  const [family, scope, taskId, attemptSegment, raw, snapshotId] = segments;
  if (family !== 'fetcher' || scope !== 'url-capture' || raw !== 'raw') return null;
  if (!validResultUuid(taskId) || !validResultUuid(snapshotId)) return null;
  if (taskId === '.' || taskId === '..' || snapshotId === '.' || snapshotId === '..') return null;
  if (typeof attemptSegment !== 'string' || !/^[1-9][0-9]{0,9}$/.test(attemptSegment)) return null;
  const attemptNumber = Number(attemptSegment);
  if (!Number.isSafeInteger(attemptNumber) || attemptNumber < 1) return null;
  return { taskId, attemptNumber, snapshotId };
}

// --- Safe Result Events ----------------------------------------------------

export interface UrlCaptureSucceededEventPayload {
  readonly taskId: WorkflowTaskId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly sourceId: string;
  readonly snapshotId: string;
  readonly attemptNumber: number;
}

export interface UrlCaptureFailedEventPayload {
  readonly taskId: WorkflowTaskId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly attemptNumber: number;
  readonly category: FetcherResultRecordedCategory;
  readonly code: FetcherResultSafeCode;
}

function validEventIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 128 && value.trim() === value;
}

const SERVER_DERIVED_CATEGORY_SET = new Set<string>(Object.keys(SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE));

function validRecordedCategory(value: unknown): value is FetcherResultRecordedCategory {
  return (
    typeof value === 'string' && (FETCHER_FAILURE_CATEGORY_SET.has(value) || SERVER_DERIVED_CATEGORY_SET.has(value))
  );
}

function safeCodeForCategory(category: FetcherResultRecordedCategory): FetcherResultSafeCode {
  if (category in FETCHER_FAILURE_CATEGORY_TO_CODE) {
    return FETCHER_FAILURE_CATEGORY_TO_CODE[category as FetcherFailureCategory];
  }
  return SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE[category as ServerDerivedFailureCategory];
}

/** Exact success Event payload. No URL, object key, Claim, Secret, or body. */
export function defineUrlCaptureSucceededEventPayload(input: {
  readonly taskId: WorkflowTaskId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly sourceId: string;
  readonly snapshotId: string;
  readonly attemptNumber: number;
}): UrlCaptureSucceededEventPayload {
  if (
    !validEventIdentity(input.taskId) ||
    !validEventIdentity(input.sourceReferenceId) ||
    !validEventIdentity(input.sourceId) ||
    !validEventIdentity(input.snapshotId) ||
    !validResultAttempt(input.attemptNumber)
  ) {
    throw new FetcherGatewayDomainError('INVALID_URL_CAPTURE_RESULT_EVENT');
  }
  return Object.freeze({
    taskId: input.taskId,
    sourceReferenceId: input.sourceReferenceId,
    sourceId: input.sourceId,
    snapshotId: input.snapshotId,
    attemptNumber: input.attemptNumber,
  });
}

/** Exact failure Event payload using the recorded category and safe code. */
export function defineUrlCaptureFailedEventPayload(input: {
  readonly taskId: WorkflowTaskId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly attemptNumber: number;
  readonly category: FetcherResultRecordedCategory;
  readonly code: FetcherResultSafeCode;
}): UrlCaptureFailedEventPayload {
  if (
    !validEventIdentity(input.taskId) ||
    !validEventIdentity(input.sourceReferenceId) ||
    !validResultAttempt(input.attemptNumber) ||
    !validRecordedCategory(input.category) ||
    input.code !== safeCodeForCategory(input.category)
  ) {
    throw new FetcherGatewayDomainError('INVALID_URL_CAPTURE_RESULT_EVENT');
  }
  return Object.freeze({
    taskId: input.taskId,
    sourceReferenceId: input.sourceReferenceId,
    attemptNumber: input.attemptNumber,
    category: input.category,
    code: input.code,
  });
}

// --- Result persistence Port and use case ----------------------------------

export interface FetcherResultSuccessEvidence {
  readonly snapshot: FetcherResultSnapshotSubmission;
  readonly capture: FetcherResultCaptureSubmission;
  readonly candidate: FetcherResultCandidateSubmission;
}

export interface UrlCaptureResultRecordCommand {
  readonly taskId: WorkflowTaskId;
  readonly claimHash: string;
  readonly attemptNumber: number;
  readonly submittedPayloadSha256: string;
  readonly submittedOutcome: 'succeeded' | 'failed';
  readonly submittedCategory: FetcherFailureCategory | null;
  readonly objectIntegrityVerified: boolean;
  readonly success: FetcherResultSuccessEvidence | null;
  readonly resultId: string;
  readonly workingCopyId: string;
  readonly sourceReviewNodeId: WorkflowNodeId;
  readonly eventId: WorkflowEventId;
}

/**
 * The durable, safe projection of a recorded Result. `safe_code` is persisted
 * and available here for private reconciliation, but is never part of the
 * Gateway HTTP DTO.
 */
export interface UrlCaptureResultRecord {
  readonly taskId: WorkflowTaskId;
  readonly attemptNumber: number;
  readonly recordedOutcome: 'succeeded' | 'failed';
  readonly recordedCategory: FetcherResultRecordedCategory | null;
  readonly safeCode: FetcherResultSafeCode | null;
  readonly sourceId: string | null;
}

export type UrlCaptureResultRecordOutcome =
  | { readonly kind: 'recorded'; readonly result: UrlCaptureResultRecord }
  | { readonly kind: 'duplicate'; readonly result: UrlCaptureResultRecord }
  | { readonly kind: 'unavailable' };

export class UrlCaptureResultPersistenceError extends Error {
  constructor(
    readonly outcome: 'NOT_COMMITTED' | 'COMMIT_UNKNOWN',
    readonly originalCause: unknown,
  ) {
    super('URL_CAPTURE_RESULT_PERSISTENCE_ERROR');
    this.name = 'UrlCaptureResultPersistenceError';
  }
}

export type UrlCaptureResultReconciliation =
  | { readonly outcome: 'COMMITTED'; readonly result: UrlCaptureResultRecord }
  | { readonly outcome: 'ABSENT' }
  | { readonly outcome: 'UNKNOWN' };

/**
 * Read-only preflight decision taken before any Object Storage access. The
 * preflight is never an authorization cache: `recordResult` re-locks and
 * re-checks every condition inside its own transaction.
 *
 * `unavailable` is returned only for a real business rejection (unknown Task,
 * wrong Claim/Attempt, expired Lease, non-ready Node, mismatched Result). An
 * infrastructure fault (connection, query, transaction, or rollback failure)
 * is reported as `prepare_failed` so the gateway maps it to a stable internal
 * 500 rather than masquerading as a 409 `FETCHER_RESULT_UNAVAILABLE`.
 */
export type UrlCaptureResultPreflight =
  | { readonly kind: 'duplicate'; readonly result: UrlCaptureResultRecord }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'eligible' }
  | { readonly kind: 'prepare_failed' };

export interface UrlCaptureResultRepository {
  prepareResult(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly attemptNumber: number;
    readonly submittedPayloadSha256: string;
    readonly acceptedAt: Date;
  }): Promise<UrlCaptureResultPreflight>;
  recordResult(command: UrlCaptureResultRecordCommand): Promise<UrlCaptureResultRecordOutcome>;
  reconcileResult(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly attemptNumber: number;
    readonly submittedPayloadSha256: string;
  }): Promise<UrlCaptureResultReconciliation>;
}

export interface FetcherResultIds {
  generateResultId(): string;
  generateWorkingCopyId(): string;
  generateSourceReviewNodeId(): WorkflowNodeId;
  generateResultEventId(): WorkflowEventId;
}

/** Internal, non-DTO failure used for stable 500 responses after write faults. */
export class FetcherResultInternalError extends Error {
  constructor(readonly reason: 'NOT_COMMITTED' | 'COMMIT_UNKNOWN' | 'RECONCILIATION_REQUIRED' | 'PREPARE_FAILED') {
    super('FETCHER_RESULT_INTERNAL_ERROR');
    this.name = 'FetcherResultInternalError';
  }
}

/** The safe Gateway outcome the service returns to the API layer. */
export interface FetcherResultGatewayOutcome {
  readonly taskId: WorkflowTaskId;
  readonly attemptNumber: number;
  readonly taskState: 'succeeded' | 'failed';
  readonly resultCategory: 'success' | FetcherResultRecordedCategory;
  readonly sourceId: string | null;
  readonly duplicate: boolean;
}

export class FetcherResultService {
  constructor(
    private readonly repository: UrlCaptureResultRepository,
    private readonly objectStore: ObjectStore,
    private readonly ids: FetcherResultIds,
    private readonly clock: FetcherGatewayClock,
  ) {}

  async submitResult(taskId: WorkflowTaskId, claim: string, body: unknown): Promise<FetcherResultGatewayOutcome> {
    if (!validTaskId(taskId)) throw new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE');
    // 1. Validate the exact-shape Result body (throws INVALID_FETCHER_RESULT).
    const submission = defineFetcherResultSubmission(body);
    // 2. Compute claimHash and the canonical submitted Payload fingerprint.
    const claimHash = hashFetcherGatewayClaim(claim);
    const submittedPayloadSha256 = fetcherResultPayloadFingerprint(submission);

    // 3. Preflight in PostgreSQL BEFORE any Object Storage access. The
    //    preflight returns duplicate/eligible/unavailable and is never an
    //    authorization cache: recordResult re-locks and re-checks everything.
    const acceptedAt = this.clock.now();
    if (!validDate(acceptedAt)) throw new FetcherResultInternalError('COMMIT_UNKNOWN');
    const preflight = await this.repository.prepareResult({
      taskId,
      claimHash,
      attemptNumber: submission.attemptNumber,
      submittedPayloadSha256,
      acceptedAt: new Date(acceptedAt.getTime()),
    });
    if (preflight.kind === 'duplicate') {
      return this.toGatewayOutcome(preflight.result, true);
    }
    if (preflight.kind === 'prepare_failed') {
      // A preflight infrastructure fault must never be reported as a business
      // 409; surface a stable private internal error instead.
      throw new FetcherResultInternalError('PREPARE_FAILED');
    }
    if (preflight.kind === 'unavailable') {
      throw new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE');
    }

    // 4. Only an eligible success submission binds and integrity-verifies the
    //    task-scoped object. Failure submissions and replays never read it.
    let taskScopedKey: string | null = null;
    let objectIntegrityVerified = false;
    if (submission.outcome === 'succeeded') {
      const parts = parseUrlCaptureStorageKey(submission.snapshot.storageKey);
      if (
        parts === null ||
        parts.taskId !== taskId ||
        parts.attemptNumber !== submission.attemptNumber ||
        parts.snapshotId !== submission.snapshot.snapshotId
      ) {
        throw new FetcherGatewayDomainError('INVALID_URL_CAPTURE_STORAGE_KEY');
      }
      taskScopedKey = submission.snapshot.storageKey;
      const expected: StoredObject = {
        storageKey: submission.snapshot.storageKey,
        sha256: submission.snapshot.sha256,
        byteSize: submission.snapshot.byteSize,
        contentType: submission.snapshot.contentType,
      };
      objectIntegrityVerified = await this.objectStore.readForIntegrity(expected).catch(() => false);
    }

    // 5. Persist the authoritative Result transaction. It re-locks the Task and
    //    re-validates every condition, so a race between preflight and record is
    //    resolved as duplicate (exact match) or unavailable (mismatch).
    const command: UrlCaptureResultRecordCommand = {
      taskId,
      claimHash,
      attemptNumber: submission.attemptNumber,
      submittedPayloadSha256,
      submittedOutcome: submission.outcome,
      submittedCategory: submission.outcome === 'failed' ? submission.category : null,
      objectIntegrityVerified,
      success:
        submission.outcome === 'succeeded'
          ? {
              snapshot: submission.snapshot,
              capture: submission.capture,
              candidate: submission.candidate,
            }
          : null,
      resultId: this.ids.generateResultId(),
      workingCopyId: this.ids.generateWorkingCopyId(),
      sourceReviewNodeId: this.ids.generateSourceReviewNodeId(),
      eventId: this.ids.generateResultEventId(),
    };

    let outcome: UrlCaptureResultRecordOutcome;
    try {
      outcome = await this.repository.recordResult(command);
    } catch (error) {
      if (error instanceof UrlCaptureResultPersistenceError) {
        return this.recoverFromPersistenceError(error, {
          taskId,
          claimHash,
          attemptNumber: submission.attemptNumber,
          submittedPayloadSha256,
          taskScopedKey,
        });
      }
      throw error;
    }

    if (outcome.kind === 'unavailable') {
      throw new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE');
    }

    // 5. A recorded server-derived failure must compensate the task-scoped object.
    if (submission.outcome === 'succeeded' && outcome.result.recordedOutcome === 'failed') {
      await this.compensate(taskScopedKey);
    }
    return this.toGatewayOutcome(outcome.result, outcome.kind === 'duplicate');
  }

  private async recoverFromPersistenceError(
    error: UrlCaptureResultPersistenceError,
    context: {
      readonly taskId: WorkflowTaskId;
      readonly claimHash: string;
      readonly attemptNumber: number;
      readonly submittedPayloadSha256: string;
      readonly taskScopedKey: string | null;
    },
  ): Promise<FetcherResultGatewayOutcome> {
    if (error.outcome === 'COMMIT_UNKNOWN') {
      const reconciliation = await this.repository
        .reconcileResult({
          taskId: context.taskId,
          claimHash: context.claimHash,
          attemptNumber: context.attemptNumber,
          submittedPayloadSha256: context.submittedPayloadSha256,
        })
        .catch((): UrlCaptureResultReconciliation => ({ outcome: 'UNKNOWN' }));
      if (reconciliation.outcome === 'COMMITTED') {
        return this.toGatewayOutcome(reconciliation.result, true);
      }
      if (reconciliation.outcome === 'ABSENT') {
        await this.compensate(context.taskScopedKey);
        throw new FetcherResultInternalError('COMMIT_UNKNOWN');
      }
      // Undetermined: retain the immutable object and never claim success.
      throw new FetcherResultInternalError('RECONCILIATION_REQUIRED');
    }
    await this.compensate(context.taskScopedKey);
    throw new FetcherResultInternalError('NOT_COMMITTED');
  }

  private toGatewayOutcome(result: UrlCaptureResultRecord, duplicate: boolean): FetcherResultGatewayOutcome {
    return Object.freeze({
      taskId: result.taskId,
      attemptNumber: result.attemptNumber,
      taskState: result.recordedOutcome,
      resultCategory: result.recordedOutcome === 'succeeded' ? 'success' : (result.recordedCategory as never),
      sourceId: result.sourceId,
      duplicate,
    });
  }

  private async compensate(storageKey: string | null): Promise<void> {
    if (storageKey === null) return;
    try {
      await this.objectStore.deleteForCompensation(storageKey);
    } catch {
      // Bounded compensation: the recorded Result is the durable truth. A failed
      // compensating delete may orphan the task-scoped object but creates no Source.
    }
  }
}
