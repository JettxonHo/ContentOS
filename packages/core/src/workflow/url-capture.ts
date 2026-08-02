import { createHash } from 'node:crypto';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import {
  canonicalWorkflowSerialization,
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  defineWorkflowInstance,
  defineWorkflowNode,
  type WorkflowEventId,
  type WorkflowInstanceId,
  type WorkflowInstanceState,
  type WorkflowNodeId,
  type WorkflowNodeState,
} from './workflow.js';

export type UrlSourceReferenceId = string & { readonly __brand: 'UrlSourceReferenceId' };
export type UrlCaptureRequestId = string & { readonly __brand: 'UrlCaptureRequestId' };
export type WorkflowTaskId = string & { readonly __brand: 'WorkflowTaskId' };
export type WorkflowOutboxRecordId = string & { readonly __brand: 'WorkflowOutboxRecordId' };

export const URL_CAPTURE_COMMAND_KIND = 'url_capture_request' as const;
export const URL_CAPTURE_EVENT_TYPE = 'url_capture_requested.v1' as const;
export const URL_CAPTURE_TASK_KIND = 'url_capture' as const;
export const URL_CAPTURE_TASK_STATE = 'queued' as const;
export const URL_CAPTURE_TASK_STATE_VALUES = ['queued', 'leased'] as const;
export type UrlCaptureTaskState = (typeof URL_CAPTURE_TASK_STATE_VALUES)[number];
export const URL_CAPTURE_OUTBOX_CATEGORY = 'fetcher' as const;
export const URL_CAPTURE_OUTBOX_ENVELOPE_VERSION = 'fetcher-task/v1' as const;
export const URL_CAPTURE_OUTBOX_STATE = 'pending' as const;
export const URL_CAPTURE_OUTBOX_STATE_VALUES = ['pending', 'dispatching', 'dispatched'] as const;
export type WorkflowOutboxState = (typeof URL_CAPTURE_OUTBOX_STATE_VALUES)[number];
export const URL_CAPTURE_ROLE_VALUES = ['primary', 'supporting'] as const;
export type UrlCaptureRole = (typeof URL_CAPTURE_ROLE_VALUES)[number];

export interface UrlCaptureCommand {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expectedPackageRevision: number;
  readonly role: UrlCaptureRole;
  readonly submittedUrl: string;
  readonly idempotencyKey: string;
}

export interface UrlSourceReferenceState {
  readonly id: UrlSourceReferenceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly role: UrlCaptureRole;
  readonly submittedUrl: string;
  readonly createdAt: Date;
}

export interface UrlCaptureRequestState {
  readonly id: UrlCaptureRequestId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly workflowNodeId: WorkflowNodeId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expectedPackageRevision: number;
  readonly commandKind: typeof URL_CAPTURE_COMMAND_KIND;
  readonly idempotencyKey: string;
  readonly requestFingerprint: string;
  readonly createdAt: Date;
}

export interface WorkflowTaskState {
  readonly id: WorkflowTaskId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly workflowNodeId: WorkflowNodeId;
  readonly urlCaptureRequestId: UrlCaptureRequestId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly kind: typeof URL_CAPTURE_TASK_KIND;
  readonly state: UrlCaptureTaskState;
  /** Optional only for pre-003B in-memory Worker fixtures; persisted rows are explicit. */
  readonly claimAttemptNumber?: number;
  readonly claimHash?: string | null;
  readonly claimedBy?: 'fetcher' | null;
  readonly leaseStartedAt?: Date | null;
  readonly leaseExpiresAt?: Date | null;
  readonly leaseHeartbeatAt?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowOutboxPayload {
  readonly taskId: WorkflowTaskId;
  readonly taskKind: typeof URL_CAPTURE_TASK_KIND;
  readonly envelopeVersion: typeof URL_CAPTURE_OUTBOX_ENVELOPE_VERSION;
}

export interface WorkflowOutboxRecordState {
  readonly id: WorkflowOutboxRecordId;
  readonly taskId: WorkflowTaskId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly category: typeof URL_CAPTURE_OUTBOX_CATEGORY;
  readonly envelopeVersion: typeof URL_CAPTURE_OUTBOX_ENVELOPE_VERSION;
  readonly payload: WorkflowOutboxPayload;
  readonly state: WorkflowOutboxState;
  readonly createdAt: Date;
  readonly deliveryGeneration: number;
  readonly dispatchAttemptCount: number;
  readonly dispatchLeaseExpiresAt: Date | null;
  readonly lastDispatchAt: Date | null;
  readonly dispatchedAt: Date | null;
  readonly updatedAt: Date;
}

export interface WorkflowOutboxDeliveryCandidate {
  readonly outboxRecordId: WorkflowOutboxRecordId;
  readonly taskId: WorkflowTaskId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly payload: WorkflowOutboxPayload;
  readonly deliveryGeneration: number;
  readonly dispatchAttemptCount: number;
  readonly dispatchLeaseExpiresAt: Date;
}

export interface UrlCaptureEventDraft {
  readonly id: WorkflowEventId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly workflowNodeId: WorkflowNodeId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly eventType: typeof URL_CAPTURE_EVENT_TYPE;
  readonly payload: UrlCaptureEventPayload;
  readonly occurredAt: Date;
}

export interface UrlCaptureEventPayload {
  readonly captureRequestId: UrlCaptureRequestId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly taskId: WorkflowTaskId;
}

export interface UrlCaptureCommandResult {
  readonly urlCaptureRequestId: UrlCaptureRequestId;
  readonly contentPackageId: ContentPackageId;
  readonly sourceReferenceId: UrlSourceReferenceId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly workflowNodeId: WorkflowNodeId;
  readonly taskId: WorkflowTaskId;
  readonly taskState: typeof URL_CAPTURE_TASK_STATE;
  readonly createdAt: Date;
}

export interface UrlCapturePersistenceCommand {
  readonly workflowInstance: WorkflowInstanceState;
  readonly workflowNode: WorkflowNodeState;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly workflowNodeId: WorkflowNodeId;
  readonly urlSourceReference: UrlSourceReferenceState;
  readonly urlCaptureRequest: UrlCaptureRequestState;
  readonly workflowTask: WorkflowTaskState;
  readonly workflowOutboxRecord: WorkflowOutboxRecordState;
  readonly workflowEvent: UrlCaptureEventDraft;
}

export interface UrlCaptureCommandRepository {
  submitUrlCapture(command: UrlCapturePersistenceCommand): Promise<UrlCaptureCommandResult>;
}

export interface UrlCaptureIdGenerator {
  generateWorkflowInstanceId(): WorkflowInstanceId;
  generateWorkflowNodeId(): WorkflowNodeId;
  generateUrlSourceReferenceId(): UrlSourceReferenceId;
  generateUrlCaptureRequestId(): UrlCaptureRequestId;
  generateWorkflowTaskId(): WorkflowTaskId;
  generateWorkflowOutboxRecordId(): WorkflowOutboxRecordId;
  generateWorkflowEventId(): WorkflowEventId;
}

export interface UrlCaptureClock {
  now(): Date;
}

export type UrlCaptureDomainErrorCode =
  | 'INVALID_URL_CAPTURE_COMMAND'
  | 'INVALID_URL_SOURCE_REFERENCE'
  | 'INVALID_URL_CAPTURE_REQUEST'
  | 'INVALID_WORKFLOW_TASK'
  | 'INVALID_WORKFLOW_OUTBOX'
  | 'INVALID_URL_CAPTURE_EVENT';

export class UrlCaptureDomainError extends Error {
  constructor(readonly code: UrlCaptureDomainErrorCode) {
    super(code);
    this.name = 'UrlCaptureDomainError';
  }
}

export type UrlCaptureApplicationErrorCode =
  | 'CONTENT_PACKAGE_NOT_FOUND'
  | 'PACKAGE_ARCHIVED'
  | 'REVISION_CONFLICT'
  | 'SOURCE_ROLE_LIMIT_EXCEEDED'
  | 'URL_CAPTURE_IDEMPOTENCY_CONFLICT'
  | 'URL_CAPTURE_ALREADY_EXISTS';

export class UrlCaptureApplicationError extends Error {
  constructor(readonly code: UrlCaptureApplicationErrorCode) {
    super(code);
    this.name = 'UrlCaptureApplicationError';
  }
}

function invalid(code: UrlCaptureDomainErrorCode): never {
  throw new UrlCaptureDomainError(code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return actual.length === required.length && actual.every((key, index) => key === required[index]);
}

function boundedIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 128 && value.trim() === value;
}

function safePositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function safeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function validNullableDate(value: unknown): value is Date | null {
  return value === null || validDate(value);
}

function validTaskLeaseShape(input: WorkflowTaskState): boolean {
  const claimAttemptNumber = input.claimAttemptNumber ?? 0;
  const claimHash = input.claimHash ?? null;
  const claimedBy = input.claimedBy ?? null;
  const leaseStartedAt = input.leaseStartedAt ?? null;
  const leaseExpiresAt = input.leaseExpiresAt ?? null;
  const leaseHeartbeatAt = input.leaseHeartbeatAt ?? null;
  if (!safeNonNegativeInteger(claimAttemptNumber)) return false;
  if (input.state === 'queued') {
    return (
      claimHash === null &&
      claimedBy === null &&
      leaseStartedAt === null &&
      leaseExpiresAt === null &&
      leaseHeartbeatAt === null
    );
  }
  return (
    claimAttemptNumber >= 1 &&
    typeof claimHash === 'string' &&
    /^[0-9a-f]{64}$/.test(claimHash) &&
    claimedBy === 'fetcher' &&
    validDate(leaseStartedAt) &&
    validDate(leaseExpiresAt) &&
    validDate(leaseHeartbeatAt) &&
    leaseStartedAt.getTime() <= leaseHeartbeatAt.getTime() &&
    leaseHeartbeatAt.getTime() < leaseExpiresAt.getTime()
  );
}

function wellFormedScalarText(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return false;
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function validSubmittedUrl(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    !wellFormedScalarText(value) ||
    value.trim() !== value ||
    utf8ByteLength(value) < 1 ||
    utf8ByteLength(value) > 2048
  ) {
    return false;
  }
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

function validIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 16 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);
}

export function canonicalUrlCaptureRequestSerialization(
  input: Pick<UrlCaptureCommand, 'expectedPackageRevision' | 'role' | 'submittedUrl'>,
): string {
  return canonicalWorkflowSerialization({
    expectedPackageRevision: input.expectedPackageRevision,
    role: input.role,
    submittedUrl: input.submittedUrl,
  });
}

export function urlCaptureRequestFingerprint(
  input: Pick<UrlCaptureCommand, 'expectedPackageRevision' | 'role' | 'submittedUrl'>,
): string {
  return createHash('sha256').update(canonicalUrlCaptureRequestSerialization(input), 'utf8').digest('hex');
}

export function validateUrlCaptureCommand(command: UrlCaptureCommand): void {
  if (
    !isRecord(command) ||
    !boundedIdentity(command.contentPackageId) ||
    !boundedIdentity(command.ownerUserId) ||
    !safePositiveInteger(command.expectedPackageRevision) ||
    (command.role !== 'primary' && command.role !== 'supporting') ||
    !validSubmittedUrl(command.submittedUrl) ||
    !validIdempotencyKey(command.idempotencyKey)
  ) {
    invalid('INVALID_URL_CAPTURE_COMMAND');
  }
}

export function defineUrlSourceReference(input: UrlSourceReferenceState): UrlSourceReferenceState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.contentPackageId) ||
    !boundedIdentity(input.ownerUserId) ||
    (input.role !== 'primary' && input.role !== 'supporting') ||
    !validSubmittedUrl(input.submittedUrl) ||
    !validDate(input.createdAt)
  ) {
    invalid('INVALID_URL_SOURCE_REFERENCE');
  }
  return Object.freeze({ ...input, createdAt: new Date(input.createdAt.getTime()) });
}

export function defineUrlCaptureRequest(
  input: UrlCaptureRequestState,
  sourceReference: UrlSourceReferenceState,
): UrlCaptureRequestState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.sourceReferenceId) ||
    !boundedIdentity(input.workflowInstanceId) ||
    !boundedIdentity(input.workflowNodeId) ||
    !boundedIdentity(input.contentPackageId) ||
    !boundedIdentity(input.ownerUserId) ||
    input.sourceReferenceId !== sourceReference.id ||
    input.contentPackageId !== sourceReference.contentPackageId ||
    input.ownerUserId !== sourceReference.ownerUserId ||
    !safePositiveInteger(input.expectedPackageRevision) ||
    input.commandKind !== URL_CAPTURE_COMMAND_KIND ||
    !validIdempotencyKey(input.idempotencyKey) ||
    !/^[0-9a-f]{64}$/.test(input.requestFingerprint) ||
    !validDate(input.createdAt)
  ) {
    invalid('INVALID_URL_CAPTURE_REQUEST');
  }
  return Object.freeze({ ...input, createdAt: new Date(input.createdAt.getTime()) });
}

export function defineWorkflowTask(input: WorkflowTaskState, request: UrlCaptureRequestState): WorkflowTaskState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.workflowInstanceId) ||
    !boundedIdentity(input.workflowNodeId) ||
    !boundedIdentity(input.urlCaptureRequestId) ||
    input.urlCaptureRequestId !== request.id ||
    input.workflowInstanceId !== request.workflowInstanceId ||
    input.workflowNodeId !== request.workflowNodeId ||
    input.contentPackageId !== request.contentPackageId ||
    input.ownerUserId !== request.ownerUserId ||
    input.kind !== URL_CAPTURE_TASK_KIND ||
    !URL_CAPTURE_TASK_STATE_VALUES.includes(input.state) ||
    !validTaskLeaseShape(input) ||
    !validDate(input.createdAt) ||
    !validDate(input.updatedAt) ||
    input.updatedAt.getTime() < input.createdAt.getTime()
  ) {
    invalid('INVALID_WORKFLOW_TASK');
  }
  return Object.freeze({
    ...input,
    claimAttemptNumber: input.claimAttemptNumber ?? 0,
    claimHash: input.claimHash ?? null,
    claimedBy: input.claimedBy ?? null,
    leaseStartedAt: input.leaseStartedAt == null ? null : new Date(input.leaseStartedAt.getTime()),
    leaseExpiresAt: input.leaseExpiresAt == null ? null : new Date(input.leaseExpiresAt.getTime()),
    leaseHeartbeatAt: input.leaseHeartbeatAt == null ? null : new Date(input.leaseHeartbeatAt.getTime()),
    createdAt: new Date(input.createdAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

function expectedOutboxPayload(taskId: WorkflowTaskId): WorkflowOutboxPayload {
  return Object.freeze({
    taskId,
    taskKind: URL_CAPTURE_TASK_KIND,
    envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
  });
}

export function rehydrateWorkflowTask(input: WorkflowTaskState): WorkflowTaskState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.workflowInstanceId) ||
    !boundedIdentity(input.workflowNodeId) ||
    !boundedIdentity(input.urlCaptureRequestId) ||
    !boundedIdentity(input.contentPackageId) ||
    !boundedIdentity(input.ownerUserId) ||
    input.kind !== URL_CAPTURE_TASK_KIND ||
    !URL_CAPTURE_TASK_STATE_VALUES.includes(input.state) ||
    !validTaskLeaseShape(input) ||
    !validDate(input.createdAt) ||
    !validDate(input.updatedAt) ||
    input.updatedAt.getTime() < input.createdAt.getTime()
  ) {
    invalid('INVALID_WORKFLOW_TASK');
  }
  return Object.freeze({
    ...input,
    claimAttemptNumber: input.claimAttemptNumber ?? 0,
    claimHash: input.claimHash ?? null,
    claimedBy: input.claimedBy ?? null,
    leaseStartedAt: input.leaseStartedAt == null ? null : new Date(input.leaseStartedAt.getTime()),
    leaseExpiresAt: input.leaseExpiresAt == null ? null : new Date(input.leaseExpiresAt.getTime()),
    leaseHeartbeatAt: input.leaseHeartbeatAt == null ? null : new Date(input.leaseHeartbeatAt.getTime()),
    createdAt: new Date(input.createdAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

export function defineWorkflowOutboxRecord(
  input: WorkflowOutboxRecordState,
  task: WorkflowTaskState,
): WorkflowOutboxRecordState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.taskId) ||
    input.taskId !== task.id ||
    input.contentPackageId !== task.contentPackageId ||
    input.ownerUserId !== task.ownerUserId ||
    input.category !== URL_CAPTURE_OUTBOX_CATEGORY ||
    input.envelopeVersion !== URL_CAPTURE_OUTBOX_ENVELOPE_VERSION ||
    input.state !== URL_CAPTURE_OUTBOX_STATE ||
    !validDate(input.createdAt)
  ) {
    invalid('INVALID_WORKFLOW_OUTBOX');
  }
  const payload = rehydrateWorkflowOutboxRecord(input).payload;
  return Object.freeze({
    ...input,
    payload,
    createdAt: new Date(input.createdAt.getTime()),
    dispatchLeaseExpiresAt:
      input.dispatchLeaseExpiresAt === null ? null : new Date(input.dispatchLeaseExpiresAt.getTime()),
    lastDispatchAt: input.lastDispatchAt === null ? null : new Date(input.lastDispatchAt.getTime()),
    dispatchedAt: input.dispatchedAt === null ? null : new Date(input.dispatchedAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

export function rehydrateWorkflowOutboxRecord(input: WorkflowOutboxRecordState): WorkflowOutboxRecordState {
  if (
    !boundedIdentity(input.id) ||
    !boundedIdentity(input.taskId) ||
    !boundedIdentity(input.contentPackageId) ||
    !boundedIdentity(input.ownerUserId) ||
    input.category !== URL_CAPTURE_OUTBOX_CATEGORY ||
    input.envelopeVersion !== URL_CAPTURE_OUTBOX_ENVELOPE_VERSION ||
    !URL_CAPTURE_OUTBOX_STATE_VALUES.includes(input.state) ||
    !validDate(input.createdAt) ||
    !safePositiveInteger(input.deliveryGeneration) ||
    !safeNonNegativeInteger(input.dispatchAttemptCount) ||
    !validNullableDate(input.dispatchLeaseExpiresAt) ||
    !validNullableDate(input.lastDispatchAt) ||
    !validNullableDate(input.dispatchedAt) ||
    !validDate(input.updatedAt) ||
    input.updatedAt.getTime() < input.createdAt.getTime() ||
    (input.state === 'dispatching' ? input.dispatchLeaseExpiresAt === null : input.dispatchLeaseExpiresAt !== null) ||
    (input.state === 'dispatched'
      ? input.lastDispatchAt === null || input.dispatchedAt === null
      : input.lastDispatchAt !== null || input.dispatchedAt !== null) ||
    (input.lastDispatchAt === null && input.dispatchedAt === null
      ? false
      : input.lastDispatchAt === null ||
        input.dispatchedAt === null ||
        input.lastDispatchAt.getTime() !== input.dispatchedAt.getTime() ||
        input.lastDispatchAt.getTime() < input.createdAt.getTime()) ||
    !isRecord(input.payload) ||
    !hasExactKeys(input.payload, ['taskId', 'taskKind', 'envelopeVersion']) ||
    input.payload.taskId !== input.taskId ||
    input.payload.taskKind !== URL_CAPTURE_TASK_KIND ||
    input.payload.envelopeVersion !== URL_CAPTURE_OUTBOX_ENVELOPE_VERSION
  ) {
    invalid('INVALID_WORKFLOW_OUTBOX');
  }
  return Object.freeze({
    ...input,
    payload: expectedOutboxPayload(input.taskId),
    createdAt: new Date(input.createdAt.getTime()),
    dispatchLeaseExpiresAt:
      input.dispatchLeaseExpiresAt === null ? null : new Date(input.dispatchLeaseExpiresAt.getTime()),
    lastDispatchAt: input.lastDispatchAt === null ? null : new Date(input.lastDispatchAt.getTime()),
    dispatchedAt: input.dispatchedAt === null ? null : new Date(input.dispatchedAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

export function defineWorkflowOutboxDeliveryCandidate(
  record: WorkflowOutboxRecordState,
  task: WorkflowTaskState,
): WorkflowOutboxDeliveryCandidate {
  const outbox = rehydrateWorkflowOutboxRecord(record);
  const rehydratedTask = rehydrateWorkflowTask(task);
  if (
    outbox.taskId !== rehydratedTask.id ||
    outbox.contentPackageId !== rehydratedTask.contentPackageId ||
    outbox.ownerUserId !== rehydratedTask.ownerUserId ||
    rehydratedTask.state !== 'queued' ||
    outbox.state !== 'dispatching' ||
    outbox.dispatchLeaseExpiresAt === null
  ) {
    invalid('INVALID_WORKFLOW_OUTBOX');
  }
  return Object.freeze({
    outboxRecordId: outbox.id,
    taskId: rehydratedTask.id,
    contentPackageId: outbox.contentPackageId,
    ownerUserId: outbox.ownerUserId,
    payload: outbox.payload,
    deliveryGeneration: outbox.deliveryGeneration,
    dispatchAttemptCount: outbox.dispatchAttemptCount,
    dispatchLeaseExpiresAt: new Date(outbox.dispatchLeaseExpiresAt.getTime()),
  });
}

export function defineUrlCaptureEventPayload(
  captureRequestId: UrlCaptureRequestId,
  sourceReferenceId: UrlSourceReferenceId,
  taskId: WorkflowTaskId,
): UrlCaptureEventPayload {
  if (!boundedIdentity(captureRequestId) || !boundedIdentity(sourceReferenceId) || !boundedIdentity(taskId)) {
    invalid('INVALID_URL_CAPTURE_EVENT');
  }
  return Object.freeze({ captureRequestId, sourceReferenceId, taskId });
}

export class UrlCaptureService {
  constructor(
    private readonly repository: UrlCaptureCommandRepository,
    private readonly ids: UrlCaptureIdGenerator,
    private readonly clock: UrlCaptureClock,
  ) {}

  async submit(command: UrlCaptureCommand): Promise<UrlCaptureCommandResult> {
    validateUrlCaptureCommand(command);
    const createdAt = this.clock.now();
    if (!validDate(createdAt)) invalid('INVALID_URL_CAPTURE_COMMAND');
    const workflowInstanceId = this.ids.generateWorkflowInstanceId();
    const workflowNodeId = this.ids.generateWorkflowNodeId();
    const sourceReferenceId = this.ids.generateUrlSourceReferenceId();
    const urlCaptureRequestId = this.ids.generateUrlCaptureRequestId();
    const taskId = this.ids.generateWorkflowTaskId();
    const outboxRecordId = this.ids.generateWorkflowOutboxRecordId();
    const eventId = this.ids.generateWorkflowEventId();
    const template = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE;
    const instance = defineWorkflowInstance({
      id: workflowInstanceId,
      contentPackageId: command.contentPackageId,
      ownerUserId: command.ownerUserId,
      template,
      lifecycle: 'active',
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    });
    const node = defineWorkflowNode({
      id: workflowNodeId,
      workflowInstance: instance,
      template,
      templateNodeKey: 'source_capture' as never,
      state: 'ready',
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    });
    const sourceReference = defineUrlSourceReference({
      id: sourceReferenceId,
      contentPackageId: command.contentPackageId,
      ownerUserId: command.ownerUserId,
      role: command.role,
      submittedUrl: command.submittedUrl,
      createdAt,
    });
    const request = defineUrlCaptureRequest(
      {
        id: urlCaptureRequestId,
        sourceReferenceId,
        workflowInstanceId,
        workflowNodeId,
        contentPackageId: command.contentPackageId,
        ownerUserId: command.ownerUserId,
        expectedPackageRevision: command.expectedPackageRevision,
        commandKind: URL_CAPTURE_COMMAND_KIND,
        idempotencyKey: command.idempotencyKey,
        requestFingerprint: urlCaptureRequestFingerprint(command),
        createdAt,
      },
      sourceReference,
    );
    const task = defineWorkflowTask(
      {
        id: taskId,
        workflowInstanceId,
        workflowNodeId,
        urlCaptureRequestId,
        contentPackageId: command.contentPackageId,
        ownerUserId: command.ownerUserId,
        kind: URL_CAPTURE_TASK_KIND,
        state: URL_CAPTURE_TASK_STATE,
        claimAttemptNumber: 0,
        claimHash: null,
        claimedBy: null,
        leaseStartedAt: null,
        leaseExpiresAt: null,
        leaseHeartbeatAt: null,
        createdAt,
        updatedAt: createdAt,
      },
      request,
    );
    const outbox = defineWorkflowOutboxRecord(
      {
        id: outboxRecordId,
        taskId,
        contentPackageId: command.contentPackageId,
        ownerUserId: command.ownerUserId,
        category: URL_CAPTURE_OUTBOX_CATEGORY,
        envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
        payload: expectedOutboxPayload(taskId),
        state: URL_CAPTURE_OUTBOX_STATE,
        createdAt,
        deliveryGeneration: 1,
        dispatchAttemptCount: 0,
        dispatchLeaseExpiresAt: null,
        lastDispatchAt: null,
        dispatchedAt: null,
        updatedAt: createdAt,
      },
      task,
    );
    const event: UrlCaptureEventDraft = Object.freeze({
      id: eventId,
      workflowInstanceId,
      workflowNodeId,
      contentPackageId: command.contentPackageId,
      ownerUserId: command.ownerUserId,
      eventType: URL_CAPTURE_EVENT_TYPE,
      payload: defineUrlCaptureEventPayload(urlCaptureRequestId, sourceReferenceId, taskId),
      occurredAt: new Date(createdAt.getTime()),
    });
    return this.repository.submitUrlCapture({
      workflowInstance: instance,
      workflowNode: node,
      workflowInstanceId,
      workflowNodeId,
      urlSourceReference: sourceReference,
      urlCaptureRequest: request,
      workflowTask: task,
      workflowOutboxRecord: outbox,
      workflowEvent: event,
    });
  }
}
