import { Agent as HttpAgent, request as requestHttp, type IncomingMessage, type RequestOptions } from 'node:http';
import { Agent as HttpsAgent, request as requestHttps } from 'node:https';
import type { Socket } from 'node:net';
import { PassThrough, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createBrotliDecompress, createInflate, createGunzip } from 'node:zlib';

import { normalizePublicAddress, type PublicAddress } from './address-policy.js';
import { createCaptureBudget, safeError, withinDeadline, type InternalCaptureBudget } from './budget.js';
import { PublicUrlTransportError } from './errors.js';
import {
  productionConnector,
  productionResolver,
  productionTls,
  type NumericConnection,
  type PublicUrlTransportTestProviders,
} from './providers.js';
import { normalizeHop, type NormalizedHop } from './url-policy.js';
import type { PublicUrlTransport, VerifiedFetchResponse } from './index.js';

const TCP_DEADLINE_MS = 5_000;
const TLS_DEADLINE_MS = 5_000;
const HEADER_DEADLINE_MS = 10_000;
const BODY_INACTIVITY_DEADLINE_MS = 10_000;
const MAX_HEADER_BYTES = 16 * 1024;
const MAX_HEADER_FIELDS = 100;
const MAX_ENCODED_BYTES = 2 * 1024 * 1024;
const MAX_DECODED_BYTES = 8 * 1024 * 1024;
const MAX_EXPANSION_RATIO = 20;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const USER_AGENT = 'ContentOS-Fetcher/1.0';

interface TransportProviders {
  readonly resolver: NonNullable<PublicUrlTransportTestProviders['resolver']>;
  readonly connector: NonNullable<PublicUrlTransportTestProviders['connector']>;
  readonly tls: NonNullable<PublicUrlTransportTestProviders['tls']>;
  readonly clock: PublicUrlTransportTestProviders['clock'];
  readonly timers: PublicUrlTransportTestProviders['timers'];
}

export function createProductionTransport(): PublicUrlTransport {
  return createTransport({}, true);
}

export function createTestTransport(overrides: PublicUrlTransportTestProviders): PublicUrlTransport {
  return createTransport(overrides, false);
}

function createTransport(
  overrides: PublicUrlTransportTestProviders,
  enforceProductionProxyPolicy: boolean,
): PublicUrlTransport {
  const providers: TransportProviders = {
    resolver: overrides.resolver ?? productionResolver,
    connector: overrides.connector ?? productionConnector,
    tls: overrides.tls ?? productionTls,
    clock: overrides.clock,
    timers: overrides.timers,
  };
  return {
    async fetch(submittedUrl: string): Promise<VerifiedFetchResponse> {
      if (enforceProductionProxyPolicy) assertProxyPolicy(process.env, process.execArgv);
      const initial = normalizeHop(submittedUrl, 'validation_blocked');
      const budget = createCaptureBudget(providers.clock, providers.timers);
      try {
        const seen = new Set<string>([initial.identity]);
        const redirects: { status: 301 | 302 | 303 | 307 | 308; url: string }[] = [];
        let hop = initial;
        while (true) {
          const outcome = await fetchHop(hop, budget, providers);
          if (outcome.kind === 'final') {
            return new VerifiedResponse(budget, outcome, redirects);
          }
          outcome.response.destroy();
          if (redirects.length >= MAX_REDIRECTS) {
            throw new PublicUrlTransportError('redirect_blocked');
          }
          let target: NormalizedHop;
          try {
            target = normalizeHop(new URL(outcome.location, hop.url).toString(), 'redirect_blocked');
          } catch {
            throw new PublicUrlTransportError('redirect_blocked');
          }
          if (seen.has(target.identity)) throw new PublicUrlTransportError('redirect_blocked');
          seen.add(target.identity);
          redirects.push({ status: outcome.status, url: target.identity });
          hop = target;
        }
      } catch (error) {
        const safe = safeError(error, budget);
        budget.abort(safe);
        budget.finish();
        throw safe;
      }
    },
  };
}

async function fetchHop(
  hop: NormalizedHop,
  budget: InternalCaptureBudget,
  providers: TransportProviders,
): Promise<FinalOutcome | RedirectOutcome> {
  let connection: NumericConnection | undefined;
  let transportSocket: Socket | undefined;
  let acceptedResponse: IncomingMessage | undefined;
  try {
    const selection = await selectAddress(hop, budget, providers);
    connection = await withinDeadline(budget, TCP_DEADLINE_MS, () =>
      providers.connector.connect({ ...selection, port: hop.port }, budget),
    );
    if (connection.peer.address !== selection.address || connection.peer.family !== selection.family) {
      throw new PublicUrlTransportError('validation_blocked');
    }
    transportSocket = connection.socket;
    if (hop.url.protocol === 'https:') {
      const establishedConnection = connection;
      transportSocket = await withinDeadline(budget, TLS_DEADLINE_MS, () =>
        providers.tls.wrap(establishedConnection, hop.hostname, hop.hostnameForTls, budget),
      );
    }
    const response = await requestResponse(hop, transportSocket, budget);
    acceptedResponse = response;
    connection = undefined;
    transportSocket = undefined;
    const headerFieldCount = response.rawHeaders.length / 2;
    if (headerFieldCount > MAX_HEADER_FIELDS) {
      response.destroy();
      throw new PublicUrlTransportError('too_large');
    }
    if (REDIRECT_STATUSES.has(response.statusCode ?? 0)) {
      const status = response.statusCode as 301 | 302 | 303 | 307 | 308;
      const locations = headerValues(response, 'location');
      if (locations.length !== 1 || locations[0]?.trim() === '') {
        response.destroy();
        throw new PublicUrlTransportError('redirect_blocked');
      }
      return { kind: 'redirect', response, status, location: locations[0] as string };
    }
    if (response.statusCode !== 200) {
      response.destroy();
      throw new PublicUrlTransportError('fetch_failed');
    }
    const contentType = parseContentType(response);
    const contentEncoding = parseContentEncoding(response);
    assertContentLength(response);
    return { kind: 'final', response, hop, contentType, contentEncoding };
  } catch (error) {
    acceptedResponse?.destroy();
    transportSocket?.destroy();
    connection?.socket.destroy();
    throw safeError(error, budget);
  }
}

async function selectAddress(
  hop: NormalizedHop,
  budget: InternalCaptureBudget,
  providers: TransportProviders,
): Promise<PublicAddress> {
  if (hop.literal !== null) return hop.literal;
  const answers = await withinDeadline(budget, budget.remainingMs(), () =>
    providers.resolver.resolve(hop.hostname, budget),
  );
  if (answers.length === 0) throw new PublicUrlTransportError('fetch_failed');
  const allowedAnswers = answers.map(normalizePublicAddress);
  return [...allowedAnswers].sort(compareAddress)[0] as PublicAddress;
}

function compareAddress(left: PublicAddress, right: PublicAddress): number {
  return left.family - right.family || left.address.localeCompare(right.address);
}

function requestResponse(hop: NormalizedHop, socket: Socket, budget: InternalCaptureBudget): Promise<IncomingMessage> {
  return withinDeadline(
    budget,
    HEADER_DEADLINE_MS,
    () =>
      new Promise<IncomingMessage>((resolve, reject) => {
        const agent =
          hop.url.protocol === 'https:'
            ? new HttpsAgent({ keepAlive: false, maxSockets: 1, maxFreeSockets: 0 })
            : new HttpAgent({ keepAlive: false, maxSockets: 1, maxFreeSockets: 0 });
        agent.createConnection = (_options, callback) => {
          callback?.(null, socket);
          return socket;
        };
        const options: RequestOptions = {
          protocol: hop.url.protocol,
          hostname: hop.hostname,
          port: hop.port,
          path: `${hop.url.pathname}${hop.url.search}`,
          method: 'GET',
          agent,
          maxHeaderSize: MAX_HEADER_BYTES,
          headers: { Host: hop.hostHeader, 'User-Agent': USER_AGENT },
          lookup: (_hostname, _options, callback) => callback(new Error('disabled lookup'), '', 0),
        };
        const request = (hop.url.protocol === 'https:' ? requestHttps : requestHttp)(options);
        const abort = (): void => {
          request.destroy();
        };
        const cleanup = (): void => {
          request.removeListener('response', onResponse);
          request.removeListener('error', onError);
          budget.signal.removeEventListener('abort', abort);
        };
        const onResponse = (response: IncomingMessage): void => {
          cleanup();
          response.once('close', () => agent.destroy());
          resolve(response);
        };
        const onError = (): void => {
          cleanup();
          agent.destroy();
          reject(budget.signal.aborted ? budget.signal.reason : new PublicUrlTransportError('fetch_failed'));
        };
        budget.signal.addEventListener('abort', abort, { once: true });
        request.once('response', onResponse);
        request.once('error', onError);
        request.end();
      }),
  );
}

function parseContentType(response: IncomingMessage): {
  readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
  readonly declaredCharset: string | null;
} {
  const values = headerValues(response, 'content-type');
  if (values.length !== 1) throw new PublicUrlTransportError('unsupported_content');
  const [mediaType = '', ...parameters] = values[0]?.split(';') ?? [];
  const contentType = mediaType.trim().toLowerCase();
  if (contentType !== 'text/html' && contentType !== 'text/plain' && contentType !== 'text/markdown') {
    throw new PublicUrlTransportError('unsupported_content');
  }
  const charsetValues = parameters
    .map((parameter) =>
      parameter
        .trim()
        .match(/^charset=(.+)$/iu)?.[1]
        ?.trim(),
    )
    .filter((value): value is string => value !== undefined && value !== '');
  if (charsetValues.length > 1) throw new PublicUrlTransportError('unsupported_content');
  return { contentType, declaredCharset: charsetValues[0] ?? null };
}

function parseContentEncoding(response: IncomingMessage): 'identity' | 'gzip' | 'deflate' | 'br' {
  const values = headerValues(response, 'content-encoding');
  if (values.length === 0) return 'identity';
  if (values.length !== 1) throw new PublicUrlTransportError('unsupported_content');
  const encoding = values[0]?.trim().toLowerCase();
  if (encoding === 'identity' || encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') return encoding;
  throw new PublicUrlTransportError('unsupported_content');
}

function assertContentLength(response: IncomingMessage): void {
  const values = headerValues(response, 'content-length');
  if (values.length === 0) return;
  if (values.length !== 1 || !/^(?:0|[1-9][0-9]*)$/u.test(values[0] ?? '')) {
    throw new PublicUrlTransportError('fetch_failed');
  }
  if (BigInt(values[0] as string) > BigInt(MAX_ENCODED_BYTES)) {
    throw new PublicUrlTransportError('too_large');
  }
}

function headerValues(response: IncomingMessage, target: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < response.rawHeaders.length; index += 2) {
    if (response.rawHeaders[index]?.toLowerCase() === target) values.push(response.rawHeaders[index + 1] ?? '');
  }
  return values;
}

export function assertProxyPolicy(
  environment: Readonly<Record<string, string | undefined>>,
  execArgv: readonly string[],
): void {
  const proxyVariables = [
    'HTTP_PROXY',
    'http_proxy',
    'HTTPS_PROXY',
    'https_proxy',
    'ALL_PROXY',
    'all_proxy',
    'NO_PROXY',
    'no_proxy',
    'NODE_USE_ENV_PROXY',
  ];
  if (
    proxyVariables.some((key) => {
      const value = environment[key];
      return value !== undefined && value.trim() !== '';
    }) ||
    execArgv.some(isUseEnvProxyOption) ||
    tokenizeNodeOptions(environment.NODE_OPTIONS).some(isUseEnvProxyOption)
  ) {
    throw new PublicUrlTransportError('validation_blocked');
  }
}

function isUseEnvProxyOption(token: string): boolean {
  const equalsIndex = token.indexOf('=');
  const optionName = (equalsIndex === -1 ? token : token.slice(0, equalsIndex)).replaceAll('_', '-');
  return optionName === '--use-env-proxy';
}

function tokenizeNodeOptions(serialized: string | undefined): string[] {
  if (serialized === undefined || serialized === '') return [];
  const tokens: string[] = [];
  let current = '';
  let tokenStarted = false;
  let quoted = false;
  let escaped = false;

  for (const character of serialized) {
    if (escaped) {
      current += character;
      tokenStarted = true;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      tokenStarted = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      tokenStarted = true;
      continue;
    }
    if (!quoted && isNodeOptionsWhitespace(character)) {
      if (tokenStarted) tokens.push(current);
      current = '';
      tokenStarted = false;
      continue;
    }
    current += character;
    tokenStarted = true;
  }

  if (escaped || quoted) throw new PublicUrlTransportError('validation_blocked');
  if (tokenStarted) tokens.push(current);
  return tokens;
}

function isNodeOptionsWhitespace(character: string): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r' ||
    character === '\f' ||
    character === '\v'
  );
}

interface FinalOutcome {
  readonly kind: 'final';
  readonly response: IncomingMessage;
  readonly hop: NormalizedHop;
  readonly contentType: {
    readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
    readonly declaredCharset: string | null;
  };
  readonly contentEncoding: 'identity' | 'gzip' | 'deflate' | 'br';
}

interface RedirectOutcome {
  readonly kind: 'redirect';
  readonly response: IncomingMessage;
  readonly status: 301 | 302 | 303 | 307 | 308;
  readonly location: string;
}

class VerifiedResponse implements VerifiedFetchResponse {
  readonly finalUrl: string;
  readonly responseStatus = 200 as const;
  readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
  readonly declaredCharset: string | null;
  readonly contentEncoding: 'identity' | 'gzip' | 'deflate' | 'br';
  readonly redirects: readonly { readonly status: 301 | 302 | 303 | 307 | 308; readonly url: string }[];

  #consumed = false;
  #disposed = false;
  #inactivityTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    readonly budget: InternalCaptureBudget,
    private readonly outcome: FinalOutcome,
    redirects: readonly { readonly status: 301 | 302 | 303 | 307 | 308; readonly url: string }[],
  ) {
    this.finalUrl = outcome.hop.identity;
    this.contentType = outcome.contentType.contentType;
    this.declaredCharset = outcome.contentType.declaredCharset;
    this.contentEncoding = outcome.contentEncoding;
    this.redirects = redirects;
    this.resetInactivityTimer();
    this.budget.signal.addEventListener('abort', () => this.releaseTransport(), { once: true });
  }

  async consume(sinks: {
    onEncoded(chunk: Uint8Array): Promise<void>;
    onDecoded(chunk: Uint8Array): Promise<void>;
  }): Promise<{ encodedByteSize: number; decodedByteSize: number }> {
    if (this.#consumed || this.#disposed) {
      throw new PublicUrlTransportError('fetch_failed');
    }
    if (this.budget.signal.aborted) throw safeError(undefined, this.budget);
    this.#consumed = true;
    let encodedByteSize = 0;
    let decodedByteSize = 0;
    const encoded = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        void (async (): Promise<void> => {
          this.resetInactivityTimer();
          encodedByteSize += chunk.byteLength;
          if (encodedByteSize > MAX_ENCODED_BYTES) throw new PublicUrlTransportError('too_large');
          await sinks.onEncoded(chunk);
          callback(null, chunk);
        })().catch((error: unknown) => callback(error as Error));
      },
    });
    const decoded = new Writable({
      write: (chunk: Buffer, _encoding, callback) => {
        void (async (): Promise<void> => {
          decodedByteSize += chunk.byteLength;
          if (
            decodedByteSize > MAX_DECODED_BYTES ||
            (encodedByteSize > 0 && decodedByteSize > encodedByteSize * MAX_EXPANSION_RATIO)
          ) {
            throw new PublicUrlTransportError('too_large');
          }
          await sinks.onDecoded(chunk);
          callback();
        })().catch((error: unknown) => callback(error as Error));
      },
    });
    try {
      const decoder = decoderFor(this.contentEncoding);
      await pipeline(this.outcome.response, encoded, decoder, decoded);
      if (encodedByteSize === 0 || decodedByteSize === 0) throw new PublicUrlTransportError('fetch_failed');
      this.clearInactivityTimer();
      this.releaseTransport();
      return { encodedByteSize, decodedByteSize };
    } catch (error) {
      const safe = safeError(error, this.budget);
      this.budget.abort(safe);
      this.releaseTransport();
      throw safe;
    }
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    if (!this.budget.signal.aborted) this.budget.abort(new PublicUrlTransportError('fetch_failed'));
    this.releaseTransport();
    this.budget.finish();
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.#inactivityTimer = this.budget.scheduler.set(
      () => {
        const error = new PublicUrlTransportError('timeout');
        this.budget.abort(error);
        this.releaseTransport();
      },
      Math.min(BODY_INACTIVITY_DEADLINE_MS, this.budget.remainingMs()),
    );
  }

  private clearInactivityTimer(): void {
    if (this.#inactivityTimer !== undefined) {
      this.budget.scheduler.clear(this.#inactivityTimer);
      this.#inactivityTimer = undefined;
    }
  }

  private releaseTransport(): void {
    this.clearInactivityTimer();
    this.outcome.response.destroy();
  }
}

function decoderFor(encoding: VerifiedFetchResponse['contentEncoding']): Transform {
  switch (encoding) {
    case 'identity':
      return new PassThrough();
    case 'gzip':
      return createGunzip();
    case 'deflate':
      return createInflate();
    case 'br':
      return createBrotliDecompress();
  }
}
