import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import {
  URL_CAPTURE_COMMAND_KIND,
  URL_CAPTURE_EVENT_TYPE,
  URL_CAPTURE_OUTBOX_CATEGORY,
  URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
  URL_CAPTURE_TASK_KIND,
  UrlCaptureDomainError,
  UrlCaptureService,
  canonicalUrlCaptureRequestSerialization,
  defineUrlCaptureEventPayload,
  rehydrateWorkflowOutboxRecord,
  rehydrateWorkflowTask,
  type UrlCaptureCommandRepository,
  type UrlCaptureIdGenerator,
  type UrlCaptureCommandResult,
  type WorkflowOutboxRecordState,
  type WorkflowTaskState,
} from './url-capture.js';

const ownerUserId = 'owner-1' as ContentPackageOwnerId;
const contentPackageId = 'package-1' as ContentPackageId;
const now = new Date('2026-08-01T00:00:00.000Z');

function ids(): UrlCaptureIdGenerator {
  let next = 1;
  return {
    generateWorkflowInstanceId: () => `instance-${next++}` as never,
    generateWorkflowNodeId: () => `node-${next++}` as never,
    generateUrlSourceReferenceId: () => `reference-${next++}` as never,
    generateUrlCaptureRequestId: () => `request-${next++}` as never,
    generateWorkflowTaskId: () => `task-${next++}` as never,
    generateWorkflowOutboxRecordId: () => `outbox-${next++}` as never,
    generateWorkflowEventId: () => `event-${next++}` as never,
  };
}

function repository(): { repository: UrlCaptureCommandRepository; get(): unknown } {
  let received: unknown;
  return {
    repository: {
      async submitUrlCapture(command) {
        const result: UrlCaptureCommandResult = {
          urlCaptureRequestId: command.urlCaptureRequest.id,
          contentPackageId: command.urlCaptureRequest.contentPackageId,
          sourceReferenceId: command.urlSourceReference.id,
          workflowInstanceId: command.workflowInstanceId,
          workflowNodeId: command.workflowNodeId,
          taskId: command.workflowTask.id,
          taskState: command.workflowTask.state,
          createdAt: command.urlCaptureRequest.createdAt,
        };
        received = command;
        return result;
      },
    },
    get: () => received,
  };
}

describe('URL capture Core Command', () => {
  it('validates the URL and idempotency key, creates exact initial values, and redacts durable payloads', async () => {
    const target = repository();
    const service = new UrlCaptureService(target.repository, ids(), { now: () => now });

    const result = await service.submit({
      contentPackageId,
      ownerUserId,
      expectedPackageRevision: 1,
      role: 'primary',
      submittedUrl: 'https://example.com/article?private=keep#section',
      idempotencyKey: 'A'.repeat(16),
    });

    expect(result).toEqual({
      urlCaptureRequestId: 'request-4',
      contentPackageId,
      sourceReferenceId: 'reference-3',
      workflowInstanceId: 'instance-1',
      workflowNodeId: 'node-2',
      taskId: 'task-5',
      taskState: 'queued',
      createdAt: now,
    });
    expect(target.get()).toMatchObject({
      urlSourceReference: {
        role: 'primary',
        submittedUrl: 'https://example.com/article?private=keep#section',
        createdAt: now,
      },
      workflowInstanceId: 'instance-1',
      workflowNodeId: 'node-2',
      workflowTask: { kind: URL_CAPTURE_TASK_KIND, state: 'queued' },
      workflowOutboxRecord: {
        category: URL_CAPTURE_OUTBOX_CATEGORY,
        envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
        state: 'pending',
        payload: {
          taskId: 'task-5',
          taskKind: URL_CAPTURE_TASK_KIND,
          envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
        },
      },
      workflowEvent: {
        eventType: URL_CAPTURE_EVENT_TYPE,
        payload: {
          captureRequestId: 'request-4',
          sourceReferenceId: 'reference-3',
          taskId: 'task-5',
        },
      },
    });
    const persistence = target.get() as {
      urlSourceReference: unknown;
      [key: string]: unknown;
    };
    const safePersistence = Object.fromEntries(
      Object.entries(persistence).filter(([key]) => key !== 'urlSourceReference'),
    );
    const serialized = JSON.stringify(safePersistence);
    expect(serialized).not.toContain('private=keep');
    expect(serialized).not.toContain('section');
  });

  it('uses the exact canonical fingerprint serialization and lower-case SHA-256', async () => {
    const request = {
      expectedPackageRevision: 1,
      role: 'supporting' as const,
      submittedUrl: 'https://example.com/a?b=1',
    };
    expect(canonicalUrlCaptureRequestSerialization(request)).toBe(
      '{"expectedPackageRevision":1,"role":"supporting","submittedUrl":"https://example.com/a?b=1"}',
    );
    const expected = createHash('sha256')
      .update('{"expectedPackageRevision":1,"role":"supporting","submittedUrl":"https://example.com/a?b=1"}')
      .digest('hex');
    const target = repository();
    await new UrlCaptureService(target.repository, ids(), { now: () => now }).submit({
      contentPackageId,
      ownerUserId,
      ...request,
      idempotencyKey: 'a'.repeat(16),
    });
    expect(target.get()).toBeDefined();
    expect(
      (target.get() as { urlCaptureRequest: { requestFingerprint: string } }).urlCaptureRequest.requestFingerprint,
    ).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects unsafe URL text and malformed idempotency keys before repository access', async () => {
    const calls: unknown[] = [];
    const repo: UrlCaptureCommandRepository = {
      async submitUrlCapture(command) {
        calls.push(command);
        throw new Error('must not be called');
      },
    };
    const service = new UrlCaptureService(repo, ids(), { now: () => now });
    const invalidUrls = [
      ' ftp://example.com',
      'ftp://example.com',
      'https://user:password@example.com',
      'https://example.com\u0001',
      'https://example.com\u007f',
      'https://example.com\ud800',
      'https://example.com ',
      'https://',
    ];
    for (const submittedUrl of invalidUrls) {
      await expect(
        service.submit({
          contentPackageId,
          ownerUserId,
          expectedPackageRevision: 1,
          role: 'primary',
          submittedUrl,
          idempotencyKey: 'A'.repeat(16),
        }),
      ).rejects.toEqual(new UrlCaptureDomainError('INVALID_URL_CAPTURE_COMMAND'));
    }
    for (const idempotencyKey of ['', 'short', 'A'.repeat(129), 'not base64url!']) {
      await expect(
        service.submit({
          contentPackageId,
          ownerUserId,
          expectedPackageRevision: 1,
          role: 'primary',
          submittedUrl: 'https://example.com',
          idempotencyKey,
        }),
      ).rejects.toEqual(new UrlCaptureDomainError('INVALID_URL_CAPTURE_COMMAND'));
    }
    expect(calls).toHaveLength(0);
  });

  it('rehydrates task and outbox values fail-closed and enforces the fixed envelope', () => {
    const task: WorkflowTaskState = {
      id: 'task-1' as never,
      workflowInstanceId: 'instance-1' as never,
      workflowNodeId: 'node-1' as never,
      urlCaptureRequestId: 'request-1' as never,
      contentPackageId,
      ownerUserId,
      kind: URL_CAPTURE_TASK_KIND,
      state: 'queued',
      createdAt: now,
      updatedAt: now,
    };
    expect(rehydrateWorkflowTask(task)).toEqual(task);
    expect(() => rehydrateWorkflowTask({ ...task, state: 'running' as never })).toThrow(UrlCaptureDomainError);

    const outbox: WorkflowOutboxRecordState = {
      id: 'outbox-1' as never,
      taskId: task.id,
      contentPackageId,
      ownerUserId,
      category: URL_CAPTURE_OUTBOX_CATEGORY,
      envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
      payload: {
        taskId: task.id,
        taskKind: URL_CAPTURE_TASK_KIND,
        envelopeVersion: URL_CAPTURE_OUTBOX_ENVELOPE_VERSION,
      },
      state: 'pending',
      createdAt: now,
      deliveryGeneration: 1,
      dispatchAttemptCount: 0,
      dispatchLeaseExpiresAt: null,
      lastDispatchAt: null,
      dispatchedAt: null,
      updatedAt: now,
    };
    expect(rehydrateWorkflowOutboxRecord(outbox)).toEqual(outbox);
    expect(() =>
      rehydrateWorkflowOutboxRecord({ ...outbox, payload: { taskId: task.id, submittedUrl: 'x' } as never }),
    ).toThrow(UrlCaptureDomainError);
    expect(defineUrlCaptureEventPayload('request-1' as never, 'reference-1' as never, task.id)).toEqual({
      captureRequestId: 'request-1',
      sourceReferenceId: 'reference-1',
      taskId: 'task-1',
    });
    expect(URL_CAPTURE_COMMAND_KIND).toBe('url_capture_request');
  });
});
