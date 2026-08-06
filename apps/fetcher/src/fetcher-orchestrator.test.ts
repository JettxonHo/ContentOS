import { describe, expect, it, vi } from 'vitest';

import type { FetcherResultSubmission } from '@contentos/core';

import { FetcherGatewayClientError, NodeFetcherGatewayClient } from './fetcher-gateway-client.js';
import { FetcherOrchestrator, FetcherSnapshotCompensationError } from './fetcher-orchestrator.js';
import type { VerifiedFetchResponse } from './public-url-transport/index.js';

const taskId = '00000000-0000-4000-8000-000000000001';
const claim = 'A'.repeat(43);

function job() {
  return {
    id: `fetcher-${taskId}-1`,
    name: 'fetcher-task',
    data: { taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    opts: { attempts: 1, removeOnComplete: true, removeOnFail: true },
  };
}

const failed: FetcherResultSubmission = {
  resultVersion: 'fetcher-result/v1',
  attemptNumber: 1,
  outcome: 'failed',
  category: 'fetch_failed',
  code: 'FETCH_FAILED',
};

const succeeded: FetcherResultSubmission = {
  resultVersion: 'fetcher-result/v1',
  attemptNumber: 1,
  outcome: 'succeeded',
  snapshot: {
    snapshotId: '00000000-0000-4000-8000-000000000002',
    storageKey: `fetcher/url-capture/${taskId}/1/raw/00000000-0000-4000-8000-000000000002`,
    sha256: 'a'.repeat(64),
    byteSize: 1,
    contentType: 'text/plain',
    contentEncoding: 'identity',
  },
  capture: {
    finalUrl: 'https://example.test/article',
    redirects: [],
    responseStatus: 200,
    encodedByteSize: 1,
    decodedByteSize: 1,
  },
  candidate: { schemaVersion: 'source/normalized/v1', text: 'candidate' },
};

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function claimed() {
  return {
    kind: 'claimed' as const,
    claim: {
      taskId,
      taskKind: 'url_capture' as const,
      submittedUrl: 'https://example.test',
      connectionPolicyVersion: 'public-url-connection/v1' as const,
      resourcePolicyVersion: 'public-url-resource/v1' as const,
      attemptNumber: 1,
      leaseExpiresAt: '2026-08-06T00:01:00.000Z',
      claim,
    },
  };
}

function response(dispose: () => void): VerifiedFetchResponse {
  const controller = new AbortController();
  return {
    budget: {
      startedAtMonotonicMs: 0,
      absoluteDeadlineMonotonicMs: 30_000,
      signal: controller.signal,
      remainingMs: () => 30_000,
    },
    finalUrl: 'https://example.test',
    redirects: [],
    responseStatus: 200,
    contentType: 'text/plain',
    declaredCharset: null,
    contentEncoding: 'identity',
    consume: async () => ({ encodedByteSize: 1, decodedByteSize: 1 }),
    dispose,
  };
}

describe('Fetcher orchestration', () => {
  it('does not fetch after the API declines a stale or duplicate delivery', async () => {
    const transport = { fetch: vi.fn() };
    const gateway = {
      claim: vi.fn(async () => ({ kind: 'unavailable' as const })),
      heartbeat: vi.fn(),
      submitResult: vi.fn(),
    };
    const orchestrator = new FetcherOrchestrator({
      gateway,
      transport,
      preparer: { prepare: vi.fn() },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: vi.fn() },
    });
    await orchestrator.process(job());
    expect(transport.fetch).not.toHaveBeenCalled();
    expect(gateway.submitResult).not.toHaveBeenCalled();
  });

  it('disposes an accepted response and submits the prepared terminal Result', async () => {
    const dispose = vi.fn();
    const verifiedResponse = response(dispose);
    const gateway = {
      claim: vi.fn(async () => claimed()),
      heartbeat: vi.fn(async () => 'renewed' as const),
      submitResult: vi.fn(async () => ({ kind: 'accepted' as const })),
    };
    const orchestrator = new FetcherOrchestrator({
      gateway,
      transport: { fetch: vi.fn(async () => verifiedResponse) },
      preparer: { prepare: vi.fn(async () => failed) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: vi.fn() },
    });
    await orchestrator.process(job());
    expect(dispose).toHaveBeenCalledOnce();
    expect(gateway.submitResult).toHaveBeenCalledWith(taskId, claim, failed);
  });

  it('waits for the in-flight 20-second Heartbeat before deciding whether Result is allowed', async () => {
    vi.useFakeTimers();
    try {
      const heartbeat = deferred<'unavailable'>();
      const preparation = deferred<FetcherResultSubmission>();
      const gateway = {
        claim: vi.fn(async () => claimed()),
        heartbeat: vi.fn(async () => heartbeat.promise),
        submitResult: vi.fn(async () => ({ kind: 'accepted' as const })),
      };
      const orchestrator = new FetcherOrchestrator({
        gateway,
        transport: { fetch: vi.fn(async () => response(vi.fn())) },
        preparer: { prepare: vi.fn(async () => preparation.promise) },
        snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: vi.fn() },
      });
      const processing = orchestrator.process(job());
      await vi.advanceTimersByTimeAsync(19_999);
      expect(gateway.heartbeat).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(gateway.heartbeat).toHaveBeenCalledWith(taskId, claim, 1);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(gateway.heartbeat).toHaveBeenCalledTimes(1);
      preparation.resolve(failed);
      await Promise.resolve();
      expect(gateway.submitResult).not.toHaveBeenCalled();
      heartbeat.resolve('unavailable');
      await processing;
      expect(gateway.submitResult).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([new FetcherGatewayClientError('protocol'), new Error('fatal heartbeat marker')])(
    'blocks Result after a fatal in-flight Heartbeat failure',
    async (heartbeatError) => {
      vi.useFakeTimers();
      try {
        const preparation = deferred<FetcherResultSubmission>();
        const heartbeat = deferred<'renewed'>();
        const gateway = {
          claim: vi.fn(async () => claimed()),
          heartbeat: vi.fn(async () => heartbeat.promise),
          submitResult: vi.fn(),
        };
        const orchestrator = new FetcherOrchestrator({
          gateway,
          transport: { fetch: vi.fn(async () => response(vi.fn())) },
          preparer: { prepare: vi.fn(async () => preparation.promise) },
          snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: vi.fn() },
        });
        const processing = orchestrator.process(job());
        await vi.advanceTimersByTimeAsync(20_000);
        preparation.resolve(failed);
        heartbeat.reject(heartbeatError);
        await expect(processing).rejects.toEqual(new FetcherGatewayClientError('protocol'));
        expect(gateway.submitResult).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('retries only one ambiguous Result delivery and preserves evidence on ambiguity', async () => {
    const gateway = {
      claim: vi.fn(async () => claimed()),
      heartbeat: vi.fn(async () => 'renewed' as const),
      submitResult: vi.fn(async () => {
        throw new FetcherGatewayClientError('transient');
      }),
    };
    const cleanup = vi.fn();
    const orchestrator = new FetcherOrchestrator({
      gateway,
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => failed) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
    });
    await expect(orchestrator.process(job())).rejects.toEqual(new FetcherGatewayClientError('transient'));
    expect(gateway.submitResult).toHaveBeenCalledTimes(2);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('classifies an oversized HTTP 503 before its body and preserves the Snapshot after two exact attempts', async () => {
    const resultBodies: string[] = [];
    const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async (input) => {
      if (input.url.pathname.endsWith('/claim')) {
        return {
          statusCode: 200,
          body: new TextEncoder().encode(JSON.stringify({ data: claimed().claim })),
        };
      }
      resultBodies.push(input.body ?? '');
      return { statusCode: 503, body: new Uint8Array(16 * 1024 + 1) };
    });
    const cleanup = vi.fn();
    const orchestrator = new FetcherOrchestrator({
      gateway: client,
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => succeeded) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
    });
    try {
      await expect(orchestrator.process(job())).rejects.toEqual(new FetcherGatewayClientError('transient'));
      expect(resultBodies).toEqual([JSON.stringify(succeeded), JSON.stringify(succeeded)]);
      expect(cleanup).not.toHaveBeenCalled();
    } finally {
      client.close();
    }
  });

  it('preserves a successful Snapshot after an unknown Result commit and does not retry', async () => {
    const cleanup = vi.fn();
    const gateway = {
      claim: vi.fn(async () => claimed()),
      heartbeat: vi.fn(async () => 'renewed' as const),
      submitResult: vi.fn(async () => {
        throw new FetcherGatewayClientError('unknown_commit');
      }),
    };
    const orchestrator = new FetcherOrchestrator({
      gateway,
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => succeeded) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
    });
    await expect(orchestrator.process(job())).rejects.toEqual(new FetcherGatewayClientError('unknown_commit'));
    expect(gateway.submitResult).toHaveBeenCalledOnce();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it.each([
    { label: '409 rejection', response: { kind: 'rejected' as const }, error: undefined },
    { label: 'protocol failure', response: undefined, error: new FetcherGatewayClientError('protocol') },
  ])('compensates only its successful Snapshot after definitive $label', async ({ response: result, error }) => {
    const cleanup = vi.fn(async () => undefined);
    const gateway = {
      claim: vi.fn(async () => claimed()),
      heartbeat: vi.fn(async () => 'renewed' as const),
      submitResult: vi.fn(async () => {
        if (error) throw error;
        return result as { readonly kind: 'rejected' };
      }),
    };
    const orchestrator = new FetcherOrchestrator({
      gateway,
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => succeeded) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
    });
    if (error) await expect(orchestrator.process(job())).rejects.toEqual(error);
    else await orchestrator.process(job());
    expect(cleanup).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledWith({
      taskId,
      attemptNumber: 1,
      snapshotId: succeeded.snapshot.snapshotId,
      signal: expect.any(AbortSignal),
    });
  });

  it('fails the Job with one stable error when definitive compensation fails', async () => {
    const cleanup = vi.fn(async () => {
      throw new Error('object key and provider marker');
    });
    const orchestrator = new FetcherOrchestrator({
      gateway: {
        claim: vi.fn(async () => claimed()),
        heartbeat: vi.fn(async () => 'renewed' as const),
        submitResult: vi.fn(async () => ({ kind: 'rejected' as const })),
      },
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => succeeded) },
      snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
    });
    const error = await orchestrator.process(job()).catch((caught: unknown) => caught);
    expect(error).toEqual(new FetcherSnapshotCompensationError());
    expect(JSON.stringify(error)).not.toContain('object key');
  });

  it('bounds definitive compensation to a fresh five-second cleanup window', async () => {
    let deadline: (() => void) | undefined;
    const clear = vi.fn();
    const submitResult = vi.fn(async () => ({ kind: 'rejected' as const }));
    const cleanup = vi.fn(async () => new Promise<never>(() => undefined));
    const orchestrator = new FetcherOrchestrator({
      gateway: {
        claim: vi.fn(async () => claimed()),
        heartbeat: vi.fn(async () => 'renewed' as const),
        submitResult,
      },
      transport: { fetch: vi.fn(async () => response(vi.fn())) },
      preparer: { prepare: vi.fn(async () => succeeded) },
      snapshots: {
        putImmutable: vi.fn(),
        readForIntegrity: vi.fn(),
        deleteForCompensation: cleanup,
      },
      timers: {
        set(callback, delayMs) {
          expect(delayMs).toBe(5_000);
          deadline = callback;
          return 1 as unknown as NodeJS.Timeout;
        },
        clear,
      },
    });
    const processing = orchestrator.process(job());
    const rejection = expect(processing).rejects.toEqual(new FetcherSnapshotCompensationError());
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
    expect(submitResult).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(deadline).toBeTypeOf('function');
    deadline?.();
    await rejection;
    expect(clear).toHaveBeenCalledOnce();
  });

  it.each(['package_archived', 'source_role_limit', 'object_integrity_failed'])(
    'does not compensate after an accepted server-derived %s response',
    async () => {
      const cleanup = vi.fn();
      const orchestrator = new FetcherOrchestrator({
        gateway: {
          claim: vi.fn(async () => claimed()),
          heartbeat: vi.fn(async () => 'renewed' as const),
          submitResult: vi.fn(async () => ({ kind: 'accepted' as const })),
        },
        transport: { fetch: vi.fn(async () => response(vi.fn())) },
        preparer: { prepare: vi.fn(async () => succeeded) },
        snapshots: { putImmutable: vi.fn(), readForIntegrity: vi.fn(), deleteForCompensation: cleanup },
      });
      await orchestrator.process(job());
      expect(cleanup).not.toHaveBeenCalled();
    },
  );
});
