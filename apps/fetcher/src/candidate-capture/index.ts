import { randomUUID } from 'node:crypto';

import {
  defineFetcherResultSubmission,
  FetcherCandidateError,
  FETCHER_FAILURE_CATEGORY_TO_CODE,
  FETCHER_RESULT_VERSION,
  type FetcherFailureCategory,
  type FetcherResultSubmission,
} from '@contentos/core';
import type { FetcherSnapshotStore } from '@contentos/object-storage';

import { PublicUrlTransportError, type VerifiedFetchResponse } from '../public-url-transport/index.js';

import {
  decodeStrictUtf8,
  declaredCharsetIsUtf8,
  extractFetcherCandidate,
  FetcherCandidateExtractionError,
} from './candidate-extractor.js';

export interface FetcherSnapshotIdGenerator {
  generate(): string;
}

export interface FetcherCapturePreparer {
  prepare(input: {
    readonly taskId: string;
    readonly attemptNumber: number;
    readonly response: VerifiedFetchResponse;
  }): Promise<FetcherResultSubmission>;
}

export interface FetcherCapturePreparerDependencies {
  readonly snapshots: FetcherSnapshotStore;
  readonly snapshotIds?: FetcherSnapshotIdGenerator;
}

function signalFailure(response: VerifiedFetchResponse): PublicUrlTransportError | undefined {
  const reason = response.budget.signal.reason;
  return reason instanceof PublicUrlTransportError ? reason : undefined;
}

function deadlineExpired(response: VerifiedFetchResponse): boolean {
  return response.budget.remainingMs() <= 0 || signalFailure(response)?.category === 'timeout';
}

function budgetUnavailable(response: VerifiedFetchResponse): boolean {
  return response.budget.signal.aborted || response.budget.remainingMs() <= 0;
}

function requireBudget(response: VerifiedFetchResponse): void {
  if (response.budget.remainingMs() <= 0) throw new PublicUrlTransportError('timeout');
  if (response.budget.signal.aborted) {
    throw signalFailure(response) ?? new PublicUrlTransportError('fetch_failed');
  }
}

function failure(attemptNumber: number, category: FetcherFailureCategory): FetcherResultSubmission {
  return defineFetcherResultSubmission({
    resultVersion: FETCHER_RESULT_VERSION,
    attemptNumber,
    outcome: 'failed',
    category,
    code: FETCHER_FAILURE_CATEGORY_TO_CODE[category],
  });
}

function failureCategory(error: unknown): FetcherFailureCategory {
  if (error instanceof PublicUrlTransportError) return error.category;
  if (error instanceof FetcherCandidateExtractionError) return error.category;
  if (error instanceof FetcherCandidateError) {
    return error.category;
  }
  return 'fetch_failed';
}

function concatenate(chunks: readonly Uint8Array[]): Uint8Array {
  const byteSize = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const bytes = new Uint8Array(byteSize);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Creates the unregistered preparation boundary. It consumes an already
 * verified response exactly once but neither fetches URLs nor submits results.
 */
export function createFetcherCapturePreparer(dependencies: FetcherCapturePreparerDependencies): FetcherCapturePreparer {
  const snapshotIds = dependencies.snapshotIds ?? { generate: randomUUID };
  return {
    async prepare(input): Promise<FetcherResultSubmission> {
      let stored: { readonly snapshotId: string } | undefined;
      try {
        requireBudget(input.response);
        if (!declaredCharsetIsUtf8(input.response.declaredCharset)) {
          return failure(input.attemptNumber, 'unsupported_content');
        }

        const encodedChunks: Uint8Array[] = [];
        const decodedChunks: Uint8Array[] = [];
        let encodedByteSize = 0;
        let decodedByteSize = 0;
        const sizes = await input.response.consume({
          onEncoded: async (chunk) => {
            requireBudget(input.response);
            encodedByteSize += chunk.byteLength;
            if (encodedByteSize > 2_097_152) throw new PublicUrlTransportError('too_large');
            encodedChunks.push(chunk.slice());
          },
          onDecoded: async (chunk) => {
            requireBudget(input.response);
            decodedByteSize += chunk.byteLength;
            if (decodedByteSize > 8_388_608) throw new PublicUrlTransportError('too_large');
            decodedChunks.push(chunk.slice());
          },
        });
        requireBudget(input.response);
        if (
          sizes.encodedByteSize !== encodedByteSize ||
          sizes.decodedByteSize !== decodedByteSize ||
          encodedByteSize < 1 ||
          decodedByteSize < 1
        ) {
          return failure(input.attemptNumber, 'fetch_failed');
        }

        const decodedText = decodeStrictUtf8(decodedChunks);
        requireBudget(input.response);
        const candidate = extractFetcherCandidate(input.response.contentType, decodedText);
        requireBudget(input.response);
        const snapshotId = snapshotIds.generate();
        const bytes = concatenate(encodedChunks);
        const snapshot = await dependencies.snapshots.putImmutable({
          taskId: input.taskId,
          attemptNumber: input.attemptNumber,
          snapshotId,
          bytes,
          contentType: input.response.contentType,
          signal: input.response.budget.signal,
        });
        stored = { snapshotId };
        requireBudget(input.response);
        if (!(await dependencies.snapshots.readForIntegrity(snapshot, input.response.budget.signal))) {
          throw new Error('integrity_failed');
        }
        requireBudget(input.response);
        const result = defineFetcherResultSubmission({
          resultVersion: FETCHER_RESULT_VERSION,
          attemptNumber: input.attemptNumber,
          outcome: 'succeeded',
          snapshot: {
            snapshotId,
            storageKey: snapshot.storageKey,
            sha256: snapshot.sha256,
            byteSize: snapshot.byteSize,
            contentType: input.response.contentType,
            contentEncoding: input.response.contentEncoding,
          },
          capture: {
            finalUrl: input.response.finalUrl,
            redirects: input.response.redirects,
            responseStatus: input.response.responseStatus,
            encodedByteSize: sizes.encodedByteSize,
            decodedByteSize: sizes.decodedByteSize,
          },
          candidate,
        });
        requireBudget(input.response);
        return result;
      } catch (error) {
        const category = deadlineExpired(input.response)
          ? 'timeout'
          : error instanceof PublicUrlTransportError
            ? error.category
            : (signalFailure(input.response)?.category ?? failureCategory(error));
        if (stored !== undefined && !budgetUnavailable(input.response)) {
          try {
            await dependencies.snapshots.deleteForCompensation({
              taskId: input.taskId,
              attemptNumber: input.attemptNumber,
              snapshotId: stored.snapshotId,
              signal: input.response.budget.signal,
            });
          } catch {
            return failure(input.attemptNumber, 'fetch_failed');
          }
        }
        return failure(input.attemptNumber, category);
      }
    },
  };
}
