import { Agent as HttpAgent, request as httpRequest } from 'node:http';
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https';

import {
  FETCHER_GATEWAY_CLAIM_HEADER,
  FETCHER_GATEWAY_DELIVERY_GENERATION_HEADER,
  FETCHER_GATEWAY_SECRET_HEADER,
  FETCHER_CLAIM_UNAVAILABLE,
  FETCHER_RESULT_UNAVAILABLE,
  FETCHER_TASK_UNAVAILABLE,
  parseFetcherGatewayClaimResponse,
  parseFetcherGatewayHeartbeatResponse,
  parseFetcherGatewayResultResponse,
  type FetcherGatewayClaimResource,
} from '@contentos/contracts';
import type { FetcherResultSubmission } from '@contentos/core';

const GATEWAY_TIMEOUT_MS = 5_000;
const MAX_GATEWAY_BODY_BYTES = 16 * 1024;
const SERVER_DERIVED_FAILURE_CATEGORIES = new Set(['package_archived', 'source_role_limit', 'object_integrity_failed']);

export type GatewayFailureKind = 'protocol' | 'transient' | 'unknown_commit';

export class FetcherGatewayClientError extends Error {
  constructor(readonly kind: GatewayFailureKind) {
    super(
      kind === 'protocol'
        ? 'gateway_protocol_failure'
        : kind === 'unknown_commit'
          ? 'gateway_result_unknown_commit'
          : 'gateway_transient_failure',
    );
    this.name = 'FetcherGatewayClientError';
  }
}

export interface FetcherGatewayClient {
  claim(
    taskId: string,
    deliveryGeneration: number,
  ): Promise<
    { readonly kind: 'claimed'; readonly claim: FetcherGatewayClaimResource } | { readonly kind: 'unavailable' }
  >;
  heartbeat(taskId: string, claim: string, attemptNumber: number): Promise<'renewed' | 'unavailable'>;
  submitResult(
    taskId: string,
    claim: string,
    result: FetcherResultSubmission,
  ): Promise<{ readonly kind: 'accepted' } | { readonly kind: 'rejected' }>;
}

interface GatewayResponse {
  readonly statusCode: number;
  readonly body: Uint8Array;
  readonly bodyOverflow?: true;
}

export type GatewayRequester = (input: {
  readonly url: URL;
  readonly method: 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | undefined;
  readonly timeoutMs: number;
  readonly agent: HttpAgent | HttpsAgent;
}) => Promise<GatewayResponse>;

function defaultRequester(input: Parameters<GatewayRequester>[0]): Promise<GatewayResponse> {
  const requester = input.url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise<GatewayResponse>((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error: FetcherGatewayClientError): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const resolveOnce = (response: GatewayResponse): void => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const request = requester(
      input.url,
      { method: input.method, headers: input.headers, timeout: input.timeoutMs, agent: input.agent },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.byteLength;
          if (size > MAX_GATEWAY_BODY_BYTES) {
            resolveOnce({ statusCode: response.statusCode ?? 0, body: new Uint8Array(), bodyOverflow: true });
            response.destroy();
            request.destroy();
            return;
          }
          chunks.push(chunk);
        });
        response.once('end', () => {
          if (size > MAX_GATEWAY_BODY_BYTES) {
            rejectOnce(new FetcherGatewayClientError('protocol'));
            return;
          }
          resolveOnce({ statusCode: response.statusCode ?? 0, body: Buffer.concat(chunks) });
        });
        response.once('error', () => rejectOnce(new FetcherGatewayClientError('transient')));
      },
    );
    request.once('timeout', () => request.destroy(new Error('timeout')));
    request.once('error', () => rejectOnce(new FetcherGatewayClientError('transient')));
    if (input.body !== undefined) request.write(input.body);
    request.end();
  });
}

function parseJson(body: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new FetcherGatewayClientError('protocol');
  }
}

function requestHeaders(secret: string): Record<string, string> {
  return { [FETCHER_GATEWAY_SECRET_HEADER]: secret };
}

function hasExpectedConflictCode(body: Uint8Array, expectedCode: string): boolean {
  const value = parseJson(body);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const error = (value as Record<string, unknown>).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    !Array.isArray(error) &&
    (error as Record<string, unknown>).code === expectedCode
  );
}

/** Private client for the literal-loopback Fetcher Gateway only. */
export class NodeFetcherGatewayClient implements FetcherGatewayClient {
  private readonly origin: URL;
  private readonly httpAgent = new HttpAgent({ keepAlive: false, proxyEnv: {} });
  private readonly httpsAgent = new HttpsAgent({ keepAlive: false, proxyEnv: {} });

  constructor(
    origin: string,
    private readonly secret: string,
    private readonly requester: GatewayRequester = defaultRequester,
  ) {
    this.origin = new URL(origin);
  }

  async claim(
    taskId: string,
    deliveryGeneration: number,
  ): Promise<
    { readonly kind: 'claimed'; readonly claim: FetcherGatewayClaimResource } | { readonly kind: 'unavailable' }
  > {
    const response = await this.send(`/internal/fetcher/tasks/${taskId}/claim`, {
      ...requestHeaders(this.secret),
      [FETCHER_GATEWAY_DELIVERY_GENERATION_HEADER]: String(deliveryGeneration),
    });
    if (this.classifyStatus(response, FETCHER_TASK_UNAVAILABLE) === 'conflict') return { kind: 'unavailable' };
    this.requireBodyWithinLimit(response, 'protocol');
    const parsed = this.parseResponse(() => parseFetcherGatewayClaimResponse(parseJson(response.body))).data;
    if (parsed.taskId !== taskId) throw new FetcherGatewayClientError('protocol');
    return { kind: 'claimed', claim: parsed };
  }

  async heartbeat(taskId: string, claim: string, attemptNumber: number): Promise<'renewed' | 'unavailable'> {
    const response = await this.send(`/internal/fetcher/tasks/${taskId}/heartbeat`, {
      ...requestHeaders(this.secret),
      [FETCHER_GATEWAY_CLAIM_HEADER]: claim,
    });
    if (this.classifyStatus(response, FETCHER_CLAIM_UNAVAILABLE) === 'conflict') return 'unavailable';
    this.requireBodyWithinLimit(response, 'protocol');
    const parsed = this.parseResponse(() => parseFetcherGatewayHeartbeatResponse(parseJson(response.body))).data;
    if (parsed.taskId !== taskId || parsed.attemptNumber !== attemptNumber) {
      throw new FetcherGatewayClientError('protocol');
    }
    return 'renewed';
  }

  async submitResult(
    taskId: string,
    claim: string,
    result: FetcherResultSubmission,
  ): Promise<{ readonly kind: 'accepted' } | { readonly kind: 'rejected' }> {
    const body = JSON.stringify(result);
    const response = await this.send(
      `/internal/fetcher/tasks/${taskId}/result`,
      {
        ...requestHeaders(this.secret),
        [FETCHER_GATEWAY_CLAIM_HEADER]: claim,
        'content-type': 'application/json',
        'content-length': String(Buffer.byteLength(body, 'utf8')),
      },
      body,
    );
    if (this.classifyStatus(response, FETCHER_RESULT_UNAVAILABLE) === 'conflict') return { kind: 'rejected' };
    this.requireBodyWithinLimit(response, 'unknown_commit');
    const parsed = this.parseResultResponse(() => parseFetcherGatewayResultResponse(parseJson(response.body))).data;
    if (parsed.taskId !== taskId || parsed.attemptNumber !== result.attemptNumber) {
      throw new FetcherGatewayClientError('unknown_commit');
    }
    if (result.outcome === 'failed') {
      if (parsed.resultCategory !== result.category || parsed.taskState !== 'failed' || parsed.sourceId !== null) {
        throw new FetcherGatewayClientError('unknown_commit');
      }
    } else if (
      (parsed.resultCategory === 'success' && (parsed.taskState !== 'succeeded' || parsed.sourceId === null)) ||
      (parsed.resultCategory !== 'success' &&
        (!SERVER_DERIVED_FAILURE_CATEGORIES.has(parsed.resultCategory) ||
          parsed.taskState !== 'failed' ||
          parsed.sourceId !== null))
    ) {
      throw new FetcherGatewayClientError('unknown_commit');
    }
    return { kind: 'accepted' };
  }

  close(): void {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
  }

  private async send(path: string, headers: Readonly<Record<string, string>>, body?: string): Promise<GatewayResponse> {
    let url: URL;
    try {
      url = new URL(path, this.origin);
    } catch {
      throw new FetcherGatewayClientError('protocol');
    }
    try {
      return await this.requester({
        url,
        method: 'POST',
        headers,
        body,
        timeoutMs: GATEWAY_TIMEOUT_MS,
        agent: url.protocol === 'https:' ? this.httpsAgent : this.httpAgent,
      });
    } catch (error) {
      if (error instanceof FetcherGatewayClientError) throw error;
      throw new FetcherGatewayClientError('transient');
    }
  }

  private classifyStatus(response: GatewayResponse, expectedConflictCode: string): 'success' | 'conflict' {
    if (response.statusCode === 0 || (response.statusCode >= 500 && response.statusCode <= 599)) {
      throw new FetcherGatewayClientError('transient');
    }
    if (response.statusCode === 200) return 'success';
    if (response.statusCode === 409) {
      this.requireBodyWithinLimit(response, 'protocol');
      this.requireConflictCode(response.body, expectedConflictCode);
      return 'conflict';
    }
    throw new FetcherGatewayClientError('protocol');
  }

  private requireBodyWithinLimit(response: GatewayResponse, failureKind: 'protocol' | 'unknown_commit'): void {
    if (response.bodyOverflow || response.body.byteLength > MAX_GATEWAY_BODY_BYTES) {
      throw new FetcherGatewayClientError(failureKind);
    }
  }

  private parseResponse<T>(parse: () => T): T {
    try {
      return parse();
    } catch (error) {
      if (error instanceof FetcherGatewayClientError) throw error;
      throw new FetcherGatewayClientError('protocol');
    }
  }

  private parseResultResponse<T>(parse: () => T): T {
    try {
      return parse();
    } catch {
      throw new FetcherGatewayClientError('unknown_commit');
    }
  }

  private requireConflictCode(body: Uint8Array, expectedCode: string): void {
    try {
      if (!hasExpectedConflictCode(body, expectedCode)) throw new FetcherGatewayClientError('protocol');
    } catch (error) {
      if (error instanceof FetcherGatewayClientError) throw error;
      throw new FetcherGatewayClientError('protocol');
    }
  }
}
