import {
  defineFetcherResultSubmission,
  FETCHER_FAILURE_CATEGORY_TO_CODE,
  FETCHER_RESULT_VERSION,
  type FetcherResultSubmission,
} from '@contentos/core';
import type { FetcherSnapshotStore } from '@contentos/object-storage';

import { createFetcherCapturePreparer, type FetcherCapturePreparer } from './candidate-capture/index.js';
import { FetcherGatewayClientError, type FetcherGatewayClient } from './fetcher-gateway-client.js';
import { fetcherJobContract } from './fetcher-queue.js';
import {
  PublicUrlTransportError,
  type PublicUrlTransport,
  type VerifiedFetchResponse,
} from './public-url-transport/index.js';

const HEARTBEAT_MS = 20_000;
const SNAPSHOT_COMPENSATION_TIMEOUT_MS = 5_000;

export class FetcherSnapshotCompensationError extends Error {
  constructor() {
    super('snapshot_compensation_failed');
    this.name = 'FetcherSnapshotCompensationError';
  }
}

export interface FetcherOrchestratorDependencies {
  readonly gateway: FetcherGatewayClient;
  readonly transport: PublicUrlTransport;
  readonly preparer: FetcherCapturePreparer;
  readonly snapshots: FetcherSnapshotStore;
  readonly timers?: {
    set(callback: () => void, delayMs: number): NodeJS.Timeout;
    clear(timer: NodeJS.Timeout): void;
  };
}

const defaultTimers = {
  set: (callback: () => void, delayMs: number): NodeJS.Timeout => setTimeout(callback, delayMs),
  clear: (timer: NodeJS.Timeout): void => clearTimeout(timer),
};

function failure(
  attemptNumber: number,
  category:
    | 'fetch_failed'
    | 'validation_blocked'
    | 'unsupported_content'
    | 'too_large'
    | 'timeout'
    | 'redirect_blocked'
    | 'extraction_failed',
): FetcherResultSubmission {
  return defineFetcherResultSubmission({
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber,
    outcome: 'failed',
    category,
    code: FETCHER_FAILURE_CATEGORY_TO_CODE[category],
  });
}

function transportFailure(error: unknown, attemptNumber: number): FetcherResultSubmission {
  if (error instanceof PublicUrlTransportError) return failure(attemptNumber, error.category);
  return failure(attemptNumber, 'fetch_failed');
}

function snapshotIdentity(
  result: FetcherResultSubmission,
): { readonly snapshotId: string; readonly attemptNumber: number } | undefined {
  return result.outcome === 'succeeded'
    ? { snapshotId: result.snapshot.snapshotId, attemptNumber: result.attemptNumber }
    : undefined;
}

/**
 * Fetcher-side execution coordinator. The API Claim remains the sole authority
 * to execute; Queue state merely schedules this bounded attempt.
 */
export class FetcherOrchestrator {
  constructor(private readonly dependencies: FetcherOrchestratorDependencies) {}

  async process(job: Parameters<typeof fetcherJobContract>[0]): Promise<void> {
    const contract = fetcherJobContract(job);
    const claimed = await this.dependencies.gateway.claim(contract.taskId, contract.deliveryGeneration);
    if (claimed.kind === 'unavailable') return;

    let heartbeatUnavailable = false;
    let heartbeatFailure: FetcherGatewayClientError | undefined;
    let heartbeatStopped = false;
    let heartbeatInFlight: Promise<void> | undefined;
    const scheduleHeartbeat = (): void => {
      if (heartbeatStopped || heartbeatInFlight || heartbeatUnavailable || heartbeatFailure) return;
      const current = (async (): Promise<void> => {
        try {
          heartbeatUnavailable =
            (await this.dependencies.gateway.heartbeat(
              contract.taskId,
              claimed.claim.claim,
              claimed.claim.attemptNumber,
            )) === 'unavailable';
        } catch (error) {
          if (error instanceof FetcherGatewayClientError && error.kind === 'transient') {
            // A transient Heartbeat outcome does not prove that the Claim was lost.
            return;
          }
          heartbeatFailure = new FetcherGatewayClientError('protocol');
        }
      })().finally(() => {
        if (heartbeatInFlight === current) heartbeatInFlight = undefined;
      });
      heartbeatInFlight = current;
    };
    const heartbeatTimer = setInterval(() => {
      scheduleHeartbeat();
    }, HEARTBEAT_MS);

    let response: VerifiedFetchResponse | undefined;
    let result: FetcherResultSubmission;
    try {
      response = await this.dependencies.transport.fetch(claimed.claim.submittedUrl);
      result = await this.dependencies.preparer.prepare({
        taskId: contract.taskId,
        attemptNumber: claimed.claim.attemptNumber,
        response,
      });
    } catch (error) {
      result = transportFailure(error, claimed.claim.attemptNumber);
    } finally {
      response?.dispose();
      clearInterval(heartbeatTimer);
      heartbeatStopped = true;
    }

    const finalHeartbeat = heartbeatInFlight;
    if (finalHeartbeat) await finalHeartbeat;
    if (heartbeatUnavailable || heartbeatFailure) {
      await this.compensateOnlyOwnedSnapshot(contract.taskId, result);
      if (heartbeatFailure) throw heartbeatFailure;
      return;
    }

    let first: Awaited<ReturnType<FetcherGatewayClient['submitResult']>> | undefined;
    try {
      first = await this.dependencies.gateway.submitResult(contract.taskId, claimed.claim.claim, result);
    } catch (error) {
      if (error instanceof FetcherGatewayClientError && error.kind === 'unknown_commit') throw error;
      if (!(error instanceof FetcherGatewayClientError) || error.kind !== 'transient') {
        await this.compensateOnlyOwnedSnapshot(contract.taskId, result);
        throw error instanceof FetcherGatewayClientError ? error : new FetcherGatewayClientError('protocol');
      }
    }

    if (first?.kind === 'accepted') return;
    if (first?.kind === 'rejected') {
      await this.compensateOnlyOwnedSnapshot(contract.taskId, result);
      return;
    }

    // One ambiguity-only retry with exactly the same Claim and immutable body.
    let second: Awaited<ReturnType<FetcherGatewayClient['submitResult']>>;
    try {
      second = await this.dependencies.gateway.submitResult(contract.taskId, claimed.claim.claim, result);
    } catch (error) {
      if (error instanceof FetcherGatewayClientError && error.kind === 'transient') {
        // Keep an owned Snapshot on an ambiguous terminal submission: API
        // idempotency or lease recovery is authoritative.
        throw error;
      }
      if (error instanceof FetcherGatewayClientError && error.kind === 'unknown_commit') throw error;
      await this.compensateOnlyOwnedSnapshot(contract.taskId, result);
      throw error instanceof FetcherGatewayClientError ? error : new FetcherGatewayClientError('protocol');
    }
    if (second.kind === 'rejected') await this.compensateOnlyOwnedSnapshot(contract.taskId, result);
  }

  private async compensateOnlyOwnedSnapshot(taskId: string, result: FetcherResultSubmission): Promise<void> {
    const snapshot = snapshotIdentity(result);
    if (!snapshot) return;
    const timers = this.dependencies.timers ?? defaultTimers;
    const controller = new AbortController();
    let timeout: NodeJS.Timeout | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timeout = timers.set(() => {
        controller.abort();
        reject(new FetcherSnapshotCompensationError());
      }, SNAPSHOT_COMPENSATION_TIMEOUT_MS);
    });
    try {
      await Promise.race([
        this.dependencies.snapshots.deleteForCompensation({
          taskId,
          attemptNumber: snapshot.attemptNumber,
          snapshotId: snapshot.snapshotId,
          signal: controller.signal,
        }),
        deadline,
      ]);
    } catch {
      throw new FetcherSnapshotCompensationError();
    } finally {
      if (timeout) timers.clear(timeout);
    }
  }
}

export function createFetcherOrchestrator(input: {
  readonly gateway: FetcherGatewayClient;
  readonly transport: PublicUrlTransport;
  readonly snapshots: FetcherSnapshotStore;
}): FetcherOrchestrator {
  return new FetcherOrchestrator({
    ...input,
    preparer: createFetcherCapturePreparer({ snapshots: input.snapshots }),
  });
}
