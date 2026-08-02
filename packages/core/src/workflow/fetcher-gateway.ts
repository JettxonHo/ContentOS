import { createHash } from 'node:crypto';

import type { WorkflowEventId } from './workflow.js';
import type { WorkflowTaskId } from './url-capture.js';

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

export type FetcherGatewayApplicationErrorCode = 'FETCHER_TASK_UNAVAILABLE' | 'FETCHER_CLAIM_UNAVAILABLE';

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
  | 'INVALID_FETCHER_LEASE_EXPIRED_EVENT';

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
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
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

type LeaseExpiredEventShape = {
  readonly taskId: unknown;
  readonly claimAttemptNumber: unknown;
  readonly previousDeliveryGeneration: unknown;
  readonly nextDeliveryGeneration: unknown;
};

/**
 * Confirms `value` is a plain data object owning exactly the four approved
 * keys as data (non-accessor) properties. Only the prototype, key set, and
 * property descriptors are inspected; a getter is never invoked, so a hostile
 * accessor cannot execute user code or observe validation.
 */
function isLeaseExpiredEventShape(value: unknown): value is LeaseExpiredEventShape {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== null && proto !== Object.prototype) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== LEASE_EXPIRED_EVENT_KEYS.length) return false;
  for (const key of ownKeys) {
    if (typeof key !== 'string' || !LEASE_EXPIRED_EVENT_KEYS.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !('value' in descriptor)) return false;
  }
  return true;
}

export function defineFetcherLeaseExpiredEventValue(input: unknown): FetcherLeaseExpiredEventValue {
  if (!isLeaseExpiredEventShape(input)) {
    throw new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT');
  }
  const taskId = input.taskId;
  const claimAttemptNumber = input.claimAttemptNumber;
  const previousDeliveryGeneration = input.previousDeliveryGeneration;
  const nextDeliveryGeneration = input.nextDeliveryGeneration;
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

  async claim(taskId: WorkflowTaskId): Promise<FetcherGatewayClaimResponse> {
    if (!validTaskId(taskId)) throw new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE');
    const now = this.clock.now();
    if (!validDate(now)) throw new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE');
    const claim = this.claims.generate();
    const claimHash = hashFetcherGatewayClaim(claim);
    const record = await this.repository.claimTask({ taskId, claimHash, now: new Date(now.getTime()) });
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
