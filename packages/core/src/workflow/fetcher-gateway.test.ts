import { describe, expect, it } from 'vitest';

import type { ObjectStore, StoredObject } from '../source/object-store.js';
import { rehydrateReference } from '../source/source.js';
import type { SourceReferenceState } from '../source/source-values.js';

import {
  FETCHER_GATEWAY_CONNECTION_POLICY_VERSION,
  FETCHER_GATEWAY_RESOURCE_POLICY_VERSION,
  FETCHER_RESULT_VERSION,
  FETCHER_FAILURE_CATEGORY_TO_CODE,
  SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE,
  URL_CAPTURE_FAILED_EVENT_TYPE,
  URL_CAPTURE_SUCCEEDED_EVENT_TYPE,
  FetcherGatewayApplicationError,
  FetcherGatewayDomainError,
  FetcherGatewayService,
  FetcherResultInternalError,
  FetcherResultService,
  UrlCaptureResultPersistenceError,
  buildUrlCaptureStorageKey,
  canonicalFetcherResultSerialization,
  defineFetcherLeaseExpiredEventValue,
  defineFetcherGatewayClaimResponse,
  defineFetcherResultSubmission,
  defineUrlCaptureFailedEventPayload,
  defineUrlCaptureSucceededEventPayload,
  fetcherResultPayloadFingerprint,
  hashFetcherGatewayClaim,
  parseUrlCaptureStorageKey,
  type UrlCaptureResultPreflight,
  type UrlCaptureResultRecordCommand,
  type UrlCaptureResultRecordOutcome,
  type UrlCaptureResultReconciliation,
} from './fetcher-gateway.js';

const taskId = '00000000-0000-4000-8000-000000000001' as never;
const now = new Date('2026-08-02T00:00:00.000Z');
const opaqueClaim = 'A'.repeat(43);

describe('Fetcher Gateway Core contract', () => {
  it('defines the exact safe lease-expiry Event payload and rejects illegal values', () => {
    const value = defineFetcherLeaseExpiredEventValue({
      taskId,
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    });
    expect(value.eventType).toBe('fetcher_lease_expired.v1');
    expect(value.payload).toEqual({
      taskId,
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    });
    expect(Object.keys(value.payload)).toEqual([
      'taskId',
      'claimAttemptNumber',
      'previousDeliveryGeneration',
      'nextDeliveryGeneration',
    ]);
    const serialized = JSON.stringify(value.payload);
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain(opaqueClaim);
    expect(serialized).not.toContain('package');

    for (const invalid of [
      { taskId: '', claimAttemptNumber: 1, previousDeliveryGeneration: 1, nextDeliveryGeneration: 2 },
      { taskId, claimAttemptNumber: 0, previousDeliveryGeneration: 1, nextDeliveryGeneration: 2 },
      { taskId, claimAttemptNumber: 1, previousDeliveryGeneration: 0, nextDeliveryGeneration: 1 },
      { taskId, claimAttemptNumber: 1, previousDeliveryGeneration: 1, nextDeliveryGeneration: 3 },
      {
        taskId,
        claimAttemptNumber: Number.MAX_SAFE_INTEGER + 1,
        previousDeliveryGeneration: 1,
        nextDeliveryGeneration: 2,
      },
    ]) {
      expect(() => defineFetcherLeaseExpiredEventValue(invalid as never)).toThrow(
        new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT'),
      );
    }
  });

  it('hashes only the opaque claim and preserves the fixed policy identifiers', () => {
    expect(hashFetcherGatewayClaim(opaqueClaim)).toMatch(/^[0-9a-f]{64}$/);
    const response = defineFetcherGatewayClaimResponse({
      taskId,
      taskKind: 'url_capture',
      submittedUrl: 'https://example.com/article',
      connectionPolicyVersion: FETCHER_GATEWAY_CONNECTION_POLICY_VERSION,
      resourcePolicyVersion: FETCHER_GATEWAY_RESOURCE_POLICY_VERSION,
      attemptNumber: 1,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
      claim: opaqueClaim,
    });
    expect(response.connectionPolicyVersion).toBe('public-url-connection/v1');
    expect(response.resourcePolicyVersion).toBe('public-url-resource/v1');
    expect(JSON.stringify(response)).toContain(opaqueClaim);
  });

  it('returns generic unavailable errors for rejected claim and malformed heartbeat input', async () => {
    const repository = {
      claimTask: async (): Promise<null> => null,
      heartbeatTask: async (): Promise<null> => null,
    };
    const service = new FetcherGatewayService(repository, { generate: () => opaqueClaim }, { now: () => now });
    await expect(service.claim(taskId, 1)).rejects.toEqual(
      new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE'),
    );
    await expect(service.heartbeat(taskId, 'short')).rejects.toEqual(
      new FetcherGatewayApplicationError('FETCHER_CLAIM_UNAVAILABLE'),
    );
  });

  it('produces one bounded claim response from an eligible repository record', async () => {
    const repository = {
      claimTask: async (input: { claimHash: string; deliveryGeneration: number; now: Date }) => {
        expect(input.claimHash).toMatch(/^[0-9a-f]{64}$/);
        expect(input.deliveryGeneration).toBe(1);
        expect(input.now).toEqual(now);
        return {
          taskId,
          taskKind: 'url_capture' as const,
          submittedUrl: 'https://example.com/private',
          attemptNumber: 1,
          leaseExpiresAt: new Date(now.getTime() + 60_000),
        };
      },
      heartbeatTask: async (): Promise<null> => null,
    };
    const result = await new FetcherGatewayService(
      repository,
      { generate: () => opaqueClaim },
      { now: () => now },
    ).claim(taskId, 1);
    expect(result).toMatchObject({
      taskId,
      taskKind: 'url_capture',
      attemptNumber: 1,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
      claim: opaqueClaim,
    });
  });
});

describe('defineFetcherLeaseExpiredEventValue exact shape', () => {
  const validBase = {
    taskId,
    claimAttemptNumber: 2,
    previousDeliveryGeneration: 4,
    nextDeliveryGeneration: 5,
  };

  function expectInvalid(input: unknown): void {
    expect(() => defineFetcherLeaseExpiredEventValue(input)).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT'),
    );
  }

  it('accepts a plain object with exactly the four approved data fields', () => {
    const value = defineFetcherLeaseExpiredEventValue({ ...validBase });
    expect(Object.keys(value.payload)).toEqual([
      'taskId',
      'claimAttemptNumber',
      'previousDeliveryGeneration',
      'nextDeliveryGeneration',
    ]);
  });

  it('rejects null, arrays, primitives, functions, dates, and class instances', () => {
    expectInvalid(null);
    expectInvalid([taskId, 2, 4, 5]);
    expectInvalid('not-an-object');
    expectInvalid(42);
    expectInvalid(true);
    expectInvalid(Symbol('s'));
    expectInvalid(() => undefined);
    expectInvalid(new Date());
    expectInvalid(new (class Instance {})());
    expectInvalid(Object.create({}));
  });

  it('rejects any missing approved field', () => {
    expectInvalid({ taskId, claimAttemptNumber: 2, previousDeliveryGeneration: 4 });
    expectInvalid({ claimAttemptNumber: 2, previousDeliveryGeneration: 4, nextDeliveryGeneration: 5 });
  });

  it('rejects any extra string field, including sensitive identifiers', () => {
    expectInvalid({ ...validBase, extra: 'x' });
    expectInvalid({ ...validBase, claim: opaqueClaim });
    expectInvalid({ ...validBase, claimHash: 'abc' });
    expectInvalid({ ...validBase, submittedUrl: 'https://example.com/private' });
    expectInvalid({ ...validBase, ownerUserId: '00000000-0000-4000-8000-000000000099' });
    expectInvalid({ ...validBase, contentPackageId: '00000000-0000-4000-8000-000000000099' });
    expectInvalid({ ...validBase, sourceReferenceId: '00000000-0000-4000-8000-000000000099' });
    expectInvalid({ ...validBase, jobId: 'fetcher-task-1' });
    expectInvalid({ ...validBase, queueName: 'contentos-fetcher' });
  });

  it('rejects symbol keys', () => {
    expectInvalid({ ...validBase, [Symbol('leak')]: 'x' });
    const symbolForField: Record<string | symbol, unknown> = {
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    };
    symbolForField[Symbol('taskId')] = taskId;
    expectInvalid(symbolForField);
  });

  it('rejects accessor properties without invoking them', () => {
    const withAccessor: Record<string, unknown> = {
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    };
    Object.defineProperty(withAccessor, 'taskId', {
      get: () => taskId,
      enumerable: true,
      configurable: true,
    });
    expectInvalid(withAccessor);
  });

  it('never executes a hostile getter and returns the stable Domain Error', () => {
    let getterCalled = false;
    const hostile: Record<string, unknown> = {
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    };
    Object.defineProperty(hostile, 'taskId', {
      enumerable: true,
      configurable: true,
      get: () => {
        getterCalled = true;
        throw new Error('BOOM');
      },
    });
    expect(() => defineFetcherLeaseExpiredEventValue(hostile)).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT'),
    );
    expect(getterCalled).toBe(false);
  });

  it('reads legal descriptor values without triggering a Proxy get trap', () => {
    let getTrapCalled = false;
    const proxied = new Proxy(
      { ...validBase },
      {
        get: () => {
          getTrapCalled = true;
          throw new Error('TRAP_BOOM');
        },
      },
    );
    const value = defineFetcherLeaseExpiredEventValue(proxied);
    expect(getTrapCalled).toBe(false);
    expect(value.eventType).toBe('fetcher_lease_expired.v1');
    expect(value.payload).toEqual({
      taskId,
      claimAttemptNumber: 2,
      previousDeliveryGeneration: 4,
      nextDeliveryGeneration: 5,
    });
  });

  it('returns the stable Domain Error for a revoked Proxy without leaking TypeError', () => {
    const revocable = Proxy.revocable({ ...validBase }, {});
    revocable.revoke();
    expect(() => defineFetcherLeaseExpiredEventValue(revocable.proxy)).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_LEASE_EXPIRED_EVENT'),
    );
  });

  it('returns the stable Domain Error when a reflection trap throws', () => {
    const boom = (): never => {
      throw new Error('REFLECT_BOOM');
    };
    expectInvalid(new Proxy({ ...validBase }, { getPrototypeOf: boom }));
    expectInvalid(new Proxy({ ...validBase }, { ownKeys: boom }));
    expectInvalid(new Proxy({ ...validBase }, { getOwnPropertyDescriptor: boom }));
  });
});

// ---------------------------------------------------------------------------
// M2-SRC-003 — fetcher-result/v1 submission contract, service, key parser
// ---------------------------------------------------------------------------

const resultTaskId = '00000000-0000-4000-8000-000000000001';
const resultSnapshotId = '00000000-0000-4000-8000-0000000000aa';
const resultSourceReferenceId = '00000000-0000-4000-8000-0000000000bb' as never;
const resultClaim = 'B'.repeat(43);

function validSuccessSubmission(): Record<string, unknown> {
  return {
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber: 1,
    outcome: 'succeeded',
    snapshot: {
      snapshotId: resultSnapshotId,
      storageKey: buildUrlCaptureStorageKey({
        taskId: resultTaskId,
        attemptNumber: 1,
        snapshotId: resultSnapshotId,
      }),
      sha256: 'a'.repeat(64),
      byteSize: 1234,
      contentType: 'text/html',
      contentEncoding: 'identity',
    },
    capture: {
      finalUrl: 'https://example.com/final',
      redirects: [],
      responseStatus: 200,
      encodedByteSize: 1234,
      decodedByteSize: 5678,
    },
    candidate: {
      schemaVersion: 'source/normalized/v1',
      text: 'reviewable normalized text',
    },
  };
}

function validFailureSubmission(
  category: keyof typeof FETCHER_FAILURE_CATEGORY_TO_CODE = 'fetch_failed',
): Record<string, unknown> {
  return {
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber: 1,
    outcome: 'failed',
    category,
    code: FETCHER_FAILURE_CATEGORY_TO_CODE[category],
  };
}

function expectResultInvalid(input: unknown): void {
  expect(() => defineFetcherResultSubmission(input)).toThrow(new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'));
}

describe('fetcher-result/v1 submission exact shape', () => {
  it('accepts the exact success and failure shapes', () => {
    const success = defineFetcherResultSubmission(validSuccessSubmission());
    expect(success.outcome).toBe('succeeded');
    expect(success.attemptNumber).toBe(1);
    if (success.outcome === 'succeeded') {
      expect(success.snapshot.contentType).toBe('text/html');
      expect(success.capture.responseStatus).toBe(200);
      expect(success.candidate.text).toBe('reviewable normalized text');
    }
    const failure = defineFetcherResultSubmission(validFailureSubmission());
    expect(failure.outcome).toBe('failed');
    if (failure.outcome === 'failed') {
      expect(failure.category).toBe('fetch_failed');
      expect(failure.code).toBe('FETCH_FAILED');
    }
  });

  it('rejects null, arrays, primitives, and class instances', () => {
    expectResultInvalid(null);
    expectResultInvalid([validSuccessSubmission()]);
    expectResultInvalid('not-an-object');
    expectResultInvalid(42);
    expectResultInvalid(true);
    expectResultInvalid(undefined);
    expectResultInvalid(new (class Instance {})());
  });

  it('rejects missing and extra fields', () => {
    const missing = validSuccessSubmission();
    delete (missing as Record<string, unknown>).candidate;
    expectResultInvalid(missing);
    expectResultInvalid({ ...validSuccessSubmission(), extra: 'x' });
    const failure = validFailureSubmission();
    delete (failure as Record<string, unknown>).code;
    expectResultInvalid(failure);
    expectResultInvalid({ ...validFailureSubmission(), snapshot: {} });
  });

  it('rejects symbol keys at the top level and in nested records', () => {
    expectResultInvalid({ ...validSuccessSubmission(), [Symbol('leak')]: 'x' });
    const withSymbolSnapshot = validSuccessSubmission();
    (withSymbolSnapshot.snapshot as Record<string | symbol, unknown>)[Symbol('snap')] = 'x';
    expectResultInvalid(withSymbolSnapshot);
  });

  it('rejects accessor properties and never executes a hostile getter', () => {
    let getterCalled = false;
    const hostile = validSuccessSubmission();
    Object.defineProperty(hostile, 'attemptNumber', {
      enumerable: true,
      configurable: true,
      get: () => {
        getterCalled = true;
        return 1;
      },
    });
    expectResultInvalid(hostile);
    expect(getterCalled).toBe(false);
  });

  it('returns a stable rejection for revoked Proxies and throwing reflection traps', () => {
    const revocable = Proxy.revocable(validSuccessSubmission(), {});
    revocable.revoke();
    expectResultInvalid(revocable.proxy);
    const boom = (): never => {
      throw new Error('REFLECT_BOOM');
    };
    expectResultInvalid(new Proxy(validSuccessSubmission(), { getPrototypeOf: boom }));
    expectResultInvalid(new Proxy(validSuccessSubmission(), { ownKeys: boom }));
    expectResultInvalid(new Proxy(validSuccessSubmission(), { getOwnPropertyDescriptor: boom }));
  });

  it('reads legal values without triggering a Proxy get trap', () => {
    let getTrapCalled = false;
    const proxied = new Proxy(validSuccessSubmission(), {
      get: () => {
        getTrapCalled = true;
        throw new Error('TRAP_BOOM');
      },
    });
    const value = defineFetcherResultSubmission(proxied);
    expect(getTrapCalled).toBe(false);
    expect(value.outcome).toBe('succeeded');
  });
});

describe('fetcher-result/v1 field bounds', () => {
  it('enforces content type and encoding allowlists', () => {
    for (const contentType of ['text/html; charset=utf-8', 'application/json', 'image/png']) {
      const bad = validSuccessSubmission();
      (bad.snapshot as Record<string, unknown>).contentType = contentType;
      expectResultInvalid(bad);
    }
    const badEncoding = validSuccessSubmission();
    (badEncoding.snapshot as Record<string, unknown>).contentEncoding = 'zstd';
    expectResultInvalid(badEncoding);
  });

  it('enforces snapshot, decoded, and encoded byte bounds and their coupling', () => {
    for (const byteSize of [0, -1, 2_097_153]) {
      const bad = validSuccessSubmission();
      (bad.snapshot as Record<string, unknown>).byteSize = byteSize;
      expectResultInvalid(bad);
    }
    const mismatch = validSuccessSubmission();
    (mismatch.capture as Record<string, unknown>).encodedByteSize = 9999;
    expectResultInvalid(mismatch);
    for (const decodedByteSize of [0, 8_388_609]) {
      const bad = validSuccessSubmission();
      (bad.capture as Record<string, unknown>).decodedByteSize = decodedByteSize;
      expectResultInvalid(bad);
    }
  });

  it('enforces responseStatus, URL, redirect, and candidate rules', () => {
    const badStatus = validSuccessSubmission();
    (badStatus.capture as Record<string, unknown>).responseStatus = 301;
    expectResultInvalid(badStatus);
    for (const finalUrl of ['ftp://example.com', 'not a url', 'https://user:pass@example.com']) {
      const bad = validSuccessSubmission();
      (bad.capture as Record<string, unknown>).finalUrl = finalUrl;
      expectResultInvalid(bad);
    }
    const tooManyRedirects = validSuccessSubmission();
    (tooManyRedirects.capture as Record<string, unknown>).redirects = Array.from({ length: 6 }, () => ({
      status: 301,
      url: 'https://example.com/r',
    }));
    expectResultInvalid(tooManyRedirects);
    const badRedirectStatus = validSuccessSubmission();
    (badRedirectStatus.capture as Record<string, unknown>).redirects = [{ status: 200, url: 'https://example.com/r' }];
    expectResultInvalid(badRedirectStatus);
    const badSchema = validSuccessSubmission();
    (badSchema.candidate as Record<string, unknown>).schemaVersion = 'source/normalized/v2';
    expectResultInvalid(badSchema);
    const emptyText = validSuccessSubmission();
    (emptyText.candidate as Record<string, unknown>).text = '   ';
    expectResultInvalid(emptyText);
    const oversizedText = validSuccessSubmission();
    (oversizedText.candidate as Record<string, unknown>).text = 'x'.repeat(100_001);
    expectResultInvalid(oversizedText);
    const nulText = validSuccessSubmission();
    (nulText.candidate as Record<string, unknown>).text = 'ok' + String.fromCharCode(0) + 'x';
    expectResultInvalid(nulText);
  });
});

describe('fetcher-result/v1 classification enumeration', () => {
  it('accepts every Fetcher-supplied category with its exact code', () => {
    for (const [category, code] of Object.entries(FETCHER_FAILURE_CATEGORY_TO_CODE)) {
      const value = defineFetcherResultSubmission(validFailureSubmission(category as never));
      if (value.outcome !== 'failed') throw new Error('expected failure');
      expect(value.category).toBe(category);
      expect(value.code).toBe(code);
    }
  });

  it('rejects every category/code mismatch and arbitrary codes', () => {
    const mismatch = validFailureSubmission('fetch_failed');
    (mismatch as Record<string, unknown>).code = 'TIMEOUT';
    expectResultInvalid(mismatch);
    const arbitrary = validFailureSubmission('fetch_failed');
    (arbitrary as Record<string, unknown>).code = 'SOME_ARBITRARY_CODE';
    expectResultInvalid(arbitrary);
    const serverDerived = validFailureSubmission();
    (serverDerived as Record<string, unknown>).category = 'package_archived';
    (serverDerived as Record<string, unknown>).code = 'PACKAGE_ARCHIVED';
    expectResultInvalid(serverDerived);
    const unknownCategory = validFailureSubmission();
    (unknownCategory as Record<string, unknown>).category = 'not_a_category';
    expectResultInvalid(unknownCategory);
  });

  it('fixes the server-derived category to code mapping', () => {
    expect(SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE).toEqual({
      package_archived: 'PACKAGE_ARCHIVED',
      source_role_limit: 'SOURCE_ROLE_LIMIT',
      object_integrity_failed: 'OBJECT_INTEGRITY_FAILED',
    });
  });
});

describe('fetcher-result/v1 canonical fingerprint', () => {
  it('is a stable lowercase SHA-256 over the canonical serialization', () => {
    const submission = defineFetcherResultSubmission(validSuccessSubmission());
    const fingerprint = fetcherResultPayloadFingerprint(submission);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fetcherResultPayloadFingerprint(defineFetcherResultSubmission(validSuccessSubmission()))).toBe(fingerprint);
    const canonical = canonicalFetcherResultSerialization(submission);
    expect(canonical).toContain('"resultVersion":"fetcher-result/v1"');
    expect(canonical).not.toContain('undefined');
  });

  it('changes when any field changes', () => {
    const base = fetcherResultPayloadFingerprint(defineFetcherResultSubmission(validSuccessSubmission()));
    const changed = validSuccessSubmission();
    (changed.candidate as Record<string, unknown>).text = 'a different reviewable text';
    const changedFingerprint = fetcherResultPayloadFingerprint(defineFetcherResultSubmission(changed));
    expect(changedFingerprint).not.toBe(base);
  });
});

describe('parseUrlCaptureStorageKey exact parser', () => {
  const key = buildUrlCaptureStorageKey({ taskId: resultTaskId, attemptNumber: 3, snapshotId: resultSnapshotId });

  it('parses an exact valid task/attempt/snapshot key', () => {
    expect(key).toBe(`fetcher/url-capture/${resultTaskId}/3/raw/${resultSnapshotId}`);
    expect(parseUrlCaptureStorageKey(key)).toEqual({
      taskId: resultTaskId,
      attemptNumber: 3,
      snapshotId: resultSnapshotId,
    });
  });

  it('rejects wrong task, wrong attempt, and wrong snapshot bindings', () => {
    const otherTask = buildUrlCaptureStorageKey({
      taskId: '00000000-0000-4000-8000-000000000099',
      attemptNumber: 3,
      snapshotId: resultSnapshotId,
    });
    expect(parseUrlCaptureStorageKey(otherTask)).not.toEqual(expect.objectContaining({ taskId: resultTaskId }));
    expect(parseUrlCaptureStorageKey(otherTask)?.taskId).toBe('00000000-0000-4000-8000-000000000099');
  });

  it('rejects extra segments, dot segments, repeated separators, and empty segments', () => {
    expect(parseUrlCaptureStorageKey(`${key}/extra`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher/url-capture/./3/raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher/url-capture/../3/raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher//url-capture/${resultTaskId}/3/raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher/url-capture/${resultTaskId}//raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`${key}/`)).toBeNull();
  });

  it('rejects backslashes, control characters, and malformed UUIDs', () => {
    expect(parseUrlCaptureStorageKey(key.replace('/', '\\'))).toBeNull();
    expect(parseUrlCaptureStorageKey('fetcher/url-capture/x/3/raw/y')).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher/url-capture/${resultTaskId}/03/raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(`fetcher/url-capture/${resultTaskId}/0/raw/${resultSnapshotId}`)).toBeNull();
    expect(parseUrlCaptureStorageKey(123)).toBeNull();
    expect(parseUrlCaptureStorageKey(null)).toBeNull();
    expect(parseUrlCaptureStorageKey('')).toBeNull();
  });
});

describe('safe result event payloads', () => {
  it('builds the exact success event payload with no sensitive fields', () => {
    const payload = defineUrlCaptureSucceededEventPayload({
      taskId: resultTaskId as never,
      sourceReferenceId: resultSourceReferenceId,
      sourceId: resultTaskId,
      snapshotId: resultSnapshotId,
      attemptNumber: 1,
    });
    expect(payload).toEqual({
      taskId: resultTaskId,
      sourceReferenceId: resultSourceReferenceId,
      sourceId: resultTaskId,
      snapshotId: resultSnapshotId,
      attemptNumber: 1,
    });
    const serialized = JSON.stringify(payload);
    for (const forbidden of ['storageKey', 'claim', 'secret', 'https://', 'candidate', 'sha256']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(URL_CAPTURE_SUCCEEDED_EVENT_TYPE).toBe('url_capture_succeeded.v1');
  });

  it('builds the exact failure event payload from recorded category and safe code', () => {
    const payload = defineUrlCaptureFailedEventPayload({
      taskId: resultTaskId as never,
      sourceReferenceId: resultSourceReferenceId,
      attemptNumber: 1,
      category: 'object_integrity_failed',
      code: 'OBJECT_INTEGRITY_FAILED',
    });
    expect(payload).toEqual({
      taskId: resultTaskId,
      sourceReferenceId: resultSourceReferenceId,
      attemptNumber: 1,
      category: 'object_integrity_failed',
      code: 'OBJECT_INTEGRITY_FAILED',
    });
    expect(URL_CAPTURE_FAILED_EVENT_TYPE).toBe('url_capture_failed.v1');
  });

  it('rejects a mismatched failure event category/code', () => {
    expect(() =>
      defineUrlCaptureFailedEventPayload({
        taskId: resultTaskId as never,
        sourceReferenceId: resultSourceReferenceId,
        attemptNumber: 1,
        category: 'object_integrity_failed',
        code: 'FETCH_FAILED',
      }),
    ).toThrow(new FetcherGatewayDomainError('INVALID_URL_CAPTURE_RESULT_EVENT'));
  });
});

interface FakeObjectStore extends ObjectStore {
  readonly deleted: string[];
  integrityChecks: number;
}

function makeObjectStore(integrityResult: boolean | (() => boolean) = true): FakeObjectStore {
  const deleted: string[] = [];
  const store: FakeObjectStore = {
    deleted,
    integrityChecks: 0,
    async putImmutable(): Promise<StoredObject> {
      throw new Error('M2-SRC-003 does not write fetcher objects');
    },
    async readForIntegrity(): Promise<boolean> {
      store.integrityChecks += 1;
      return typeof integrityResult === 'function' ? integrityResult() : integrityResult;
    },
    async deleteForCompensation(storageKey: string): Promise<void> {
      deleted.push(storageKey);
    },
  };
  return store;
}

const resultIds = {
  generateResultId: () => '00000000-0000-4000-8000-000000000111',
  generateWorkingCopyId: () => '00000000-0000-4000-8000-000000000444',
  generateSourceReviewNodeId: () => '00000000-0000-4000-8000-000000000222' as never,
  generateResultEventId: () => '00000000-0000-4000-8000-000000000333' as never,
};
const resultClock = { now: () => new Date('2026-08-03T00:00:00.000Z') };
const successKey = buildUrlCaptureStorageKey({
  taskId: resultTaskId,
  attemptNumber: 1,
  snapshotId: resultSnapshotId,
});

type RecordResultFn = (command: UrlCaptureResultRecordCommand) => Promise<UrlCaptureResultRecordOutcome>;

function makeService(
  store: FakeObjectStore,
  recordResult: RecordResultFn,
  reconcileResult?: () => Promise<UrlCaptureResultReconciliation>,
  prepareResult?: () => Promise<UrlCaptureResultPreflight>,
): { service: FetcherResultService; commands: UrlCaptureResultRecordCommand[] } {
  const commands: UrlCaptureResultRecordCommand[] = [];
  const repository = {
    prepareResult: prepareResult ?? (async (): Promise<UrlCaptureResultPreflight> => ({ kind: 'eligible' })),
    recordResult: async (command: UrlCaptureResultRecordCommand) => {
      commands.push(command);
      return recordResult(command);
    },
    reconcileResult: reconcileResult ?? (async (): Promise<UrlCaptureResultReconciliation> => ({ outcome: 'UNKNOWN' })),
  };
  return { service: new FetcherResultService(repository, store, resultIds, resultClock), commands };
}

describe('FetcherResultService', () => {
  it('records a first successful result and returns the safe gateway outcome', async () => {
    const store = makeObjectStore(true);
    const { service, commands } = makeService(store, async (command) => ({
      kind: 'recorded',
      result: {
        taskId: command.taskId,
        attemptNumber: command.attemptNumber,
        recordedOutcome: 'succeeded',
        recordedCategory: null,
        safeCode: null,
        sourceId: resultSourceReferenceId,
      },
    }));
    const outcome = await service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission());
    expect(outcome).toEqual({
      taskId: resultTaskId,
      attemptNumber: 1,
      taskState: 'succeeded',
      resultCategory: 'success',
      sourceId: resultSourceReferenceId,
      duplicate: false,
    });
    expect(commands).toHaveLength(1);
    expect(commands[0]!.objectIntegrityVerified).toBe(true);
    expect(commands[0]!.claimHash).toBe(hashFetcherGatewayClaim(resultClaim));
    expect(commands[0]!.submittedPayloadSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(commands[0]!.submittedCategory).toBeNull();
    expect(store.deleted).toEqual([]);
  });

  it('records a server-derived integrity failure and compensates the object', async () => {
    const store = makeObjectStore(false);
    const { service } = makeService(store, async (command) => ({
      kind: 'recorded',
      result: {
        taskId: command.taskId,
        attemptNumber: command.attemptNumber,
        recordedOutcome: 'failed',
        recordedCategory: 'object_integrity_failed',
        safeCode: 'OBJECT_INTEGRITY_FAILED',
        sourceId: null,
      },
    }));
    const outcome = await service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission());
    expect(outcome.taskState).toBe('failed');
    expect(outcome.resultCategory).toBe('object_integrity_failed');
    expect(outcome.sourceId).toBeNull();
    expect(outcome.duplicate).toBe(false);
    expect(store.deleted).toEqual([successKey]);
  });

  it('records a Fetcher-reported failure without integrity read or compensation', async () => {
    const store = makeObjectStore(true);
    const { service, commands } = makeService(store, async (command) => ({
      kind: 'recorded',
      result: {
        taskId: command.taskId,
        attemptNumber: command.attemptNumber,
        recordedOutcome: 'failed',
        recordedCategory: 'fetch_failed',
        safeCode: 'FETCH_FAILED',
        sourceId: null,
      },
    }));
    const outcome = await service.submitResult(resultTaskId as never, resultClaim, validFailureSubmission());
    expect(outcome).toEqual({
      taskId: resultTaskId,
      attemptNumber: 1,
      taskState: 'failed',
      resultCategory: 'fetch_failed',
      sourceId: null,
      duplicate: false,
    });
    expect(store.integrityChecks).toBe(0);
    expect(store.deleted).toEqual([]);
    expect(commands[0]!.success).toBeNull();
    expect(commands[0]!.submittedCategory).toBe('fetch_failed');
  });

  it('returns the persisted result with duplicate=true for an exact preflight replay without reading the object', async () => {
    const store = makeObjectStore(true);
    const { service, commands } = makeService(
      store,
      async (command) => ({
        kind: 'recorded',
        result: {
          taskId: command.taskId,
          attemptNumber: command.attemptNumber,
          recordedOutcome: 'succeeded',
          recordedCategory: null,
          safeCode: null,
          sourceId: resultSourceReferenceId,
        },
      }),
      undefined,
      async () => ({
        kind: 'duplicate',
        result: {
          taskId: resultTaskId as never,
          attemptNumber: 1,
          recordedOutcome: 'succeeded',
          recordedCategory: null,
          safeCode: null,
          sourceId: resultSourceReferenceId,
        },
      }),
    );
    const outcome = await service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission());
    expect(outcome.duplicate).toBe(true);
    expect(outcome.taskState).toBe('succeeded');
    expect(outcome.sourceId).toBe(resultSourceReferenceId);
    expect(store.integrityChecks).toBe(0);
    expect(store.deleted).toEqual([]);
    expect(commands).toEqual([]);
  });

  it('throws FETCHER_RESULT_UNAVAILABLE from an ineligible preflight without reading the object', async () => {
    const store = makeObjectStore(true);
    const { service, commands } = makeService(
      store,
      async () => ({ kind: 'unavailable' }),
      undefined,
      async () => ({ kind: 'unavailable' }),
    );
    await expect(service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission())).rejects.toEqual(
      new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'),
    );
    expect(store.integrityChecks).toBe(0);
    expect(store.deleted).toEqual([]);
    expect(commands).toEqual([]);
  });

  it('rejects a storage key not bound to the route task id', async () => {
    const store = makeObjectStore(true);
    const { service } = makeService(store, async () => ({ kind: 'unavailable' }));
    const otherTask = '00000000-0000-4000-8000-000000000099';
    await expect(service.submitResult(otherTask as never, resultClaim, validSuccessSubmission())).rejects.toThrow(
      new FetcherGatewayDomainError('INVALID_URL_CAPTURE_STORAGE_KEY'),
    );
    expect(store.integrityChecks).toBe(0);
    expect(store.deleted).toEqual([]);
  });

  it('rejects a malformed claim before any repository access', async () => {
    const store = makeObjectStore(true);
    const { service, commands } = makeService(store, async () => ({ kind: 'unavailable' }));
    await expect(service.submitResult(resultTaskId as never, 'short-claim', validSuccessSubmission())).rejects.toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_GATEWAY_CLAIM'),
    );
    expect(commands).toEqual([]);
  });

  it('compensates and raises a stable internal error on NOT_COMMITTED', async () => {
    const store = makeObjectStore(true);
    const { service } = makeService(store, async () => {
      throw new UrlCaptureResultPersistenceError('NOT_COMMITTED', new Error('db'));
    });
    await expect(service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission())).rejects.toEqual(
      new FetcherResultInternalError('NOT_COMMITTED'),
    );
    expect(store.deleted).toEqual([successKey]);
  });

  it('returns the existing result as duplicate when COMMIT_UNKNOWN reconciles committed', async () => {
    const store = makeObjectStore(true);
    const { service } = makeService(
      store,
      async () => {
        throw new UrlCaptureResultPersistenceError('COMMIT_UNKNOWN', new Error('db'));
      },
      async () => ({
        outcome: 'COMMITTED',
        result: {
          taskId: resultTaskId as never,
          attemptNumber: 1,
          recordedOutcome: 'succeeded',
          recordedCategory: null,
          safeCode: null,
          sourceId: resultSourceReferenceId,
        },
      }),
    );
    const outcome = await service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission());
    expect(outcome.duplicate).toBe(true);
    expect(outcome.sourceId).toBe(resultSourceReferenceId);
    expect(store.deleted).toEqual([]);
  });

  it('compensates and raises a stable internal error when COMMIT_UNKNOWN reconciles absent', async () => {
    const store = makeObjectStore(true);
    const { service } = makeService(
      store,
      async () => {
        throw new UrlCaptureResultPersistenceError('COMMIT_UNKNOWN', new Error('db'));
      },
      async () => ({ outcome: 'ABSENT' }),
    );
    await expect(service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission())).rejects.toEqual(
      new FetcherResultInternalError('COMMIT_UNKNOWN'),
    );
    expect(store.deleted).toEqual([successKey]);
  });

  it('retains the object and never claims success when reconciliation is undetermined', async () => {
    const store = makeObjectStore(true);
    const { service } = makeService(
      store,
      async () => {
        throw new UrlCaptureResultPersistenceError('COMMIT_UNKNOWN', new Error('db'));
      },
      async () => ({ outcome: 'UNKNOWN' }),
    );
    await expect(service.submitResult(resultTaskId as never, resultClaim, validSuccessSubmission())).rejects.toEqual(
      new FetcherResultInternalError('RECONCILIATION_REQUIRED'),
    );
    expect(store.deleted).toEqual([]);
  });
});

describe('public_url Source domain compatibility (M2-SRC-003 correction)', () => {
  it('rehydrates an exact public_url Source Reference', () => {
    const reference: SourceReferenceState = {
      id: '40000000-0000-4000-8000-000000000001' as never,
      contentPackageId: '10000000-0000-4000-8000-000000000001' as never,
      ownerUserId: '00000000-0000-4000-8000-000000000001' as never,
      sourceType: 'public_url',
      role: 'primary',
      label: null,
      captureType: 'public_url',
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
    };
    const rehydrated = rehydrateReference(reference);
    expect(rehydrated.sourceType).toBe('public_url');
    expect(rehydrated.captureType).toBe('public_url');
    expect(rehydrated.role).toBe('primary');
  });
});

describe('redirect array Proxy/getter safety (M2-SRC-003 correction)', () => {
  function submissionWithRedirects(redirects: unknown): unknown {
    return {
      resultVersion: 'fetcher-result/v1',
      attemptNumber: 1,
      outcome: 'succeeded',
      snapshot: {
        snapshotId: resultSnapshotId,
        storageKey: successKey,
        sha256: 'a'.repeat(64),
        byteSize: 1234,
        contentType: 'text/html',
        contentEncoding: 'identity',
      },
      capture: {
        finalUrl: 'https://example.com/final',
        redirects,
        responseStatus: 200,
        encodedByteSize: 1234,
        decodedByteSize: 5678,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
    };
  }

  it('still accepts a normal dense redirects array', () => {
    const value = defineFetcherResultSubmission(
      submissionWithRedirects([
        { status: 301, url: 'https://example.com/a' },
        { status: 302, url: 'https://example.com/b' },
      ]),
    );
    expect(value.outcome).toBe('succeeded');
  });

  it('does not execute a Proxy length/index get trap', () => {
    let getTrapCalled = false;
    const proxied = new Proxy([{ status: 301, url: 'https://example.com/a' }], {
      get: () => {
        getTrapCalled = true;
        throw new Error('GET_TRAP');
      },
    });
    const value = defineFetcherResultSubmission(submissionWithRedirects(proxied));
    expect(getTrapCalled).toBe(false);
    expect(value.outcome).toBe('succeeded');
  });

  it('returns a stable INVALID_FETCHER_RESULT for a throwing ownKeys trap', () => {
    const proxied = new Proxy([], {
      ownKeys: () => {
        throw new Error('OWNKEYS_BOOM');
      },
    });
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(proxied))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });

  it('returns a stable INVALID_FETCHER_RESULT for a throwing descriptor trap', () => {
    const proxied = new Proxy([{ status: 301, url: 'https://example.com/a' }], {
      getOwnPropertyDescriptor: () => {
        throw new Error('DESCRIPTOR_BOOM');
      },
    });
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(proxied))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });

  it('rejects an index accessor without executing the getter', () => {
    let getterCalled = false;
    const arr: unknown[] = [];
    Object.defineProperty(arr, '0', {
      enumerable: true,
      configurable: true,
      get: () => {
        getterCalled = true;
        return { status: 301, url: 'https://example.com/a' };
      },
    });
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(arr))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
    expect(getterCalled).toBe(false);
  });

  it('rejects a length accessor descriptor', () => {
    const proxied = new Proxy([], {
      getOwnPropertyDescriptor: (target, prop) => {
        if (prop === 'length') {
          return { get: () => 0, configurable: true, enumerable: false };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
      },
    });
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(proxied))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });

  it('rejects a sparse array', () => {
    const sparse = new Array(1);
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(sparse))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });

  it('rejects an extra array property', () => {
    const arr: unknown[] = [{ status: 301, url: 'https://example.com/a' }];
    (arr as unknown as Record<string, unknown>).extra = 'x';
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(arr))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });

  it('rejects a Symbol property on the array', () => {
    const arr: unknown[] = [];
    (arr as unknown as Record<symbol, unknown>)[Symbol('leak')] = 'x';
    expect(() => defineFetcherResultSubmission(submissionWithRedirects(arr))).toThrow(
      new FetcherGatewayDomainError('INVALID_FETCHER_RESULT'),
    );
  });
});
