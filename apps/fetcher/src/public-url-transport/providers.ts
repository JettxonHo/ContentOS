import { Resolver } from 'node:dns/promises';
import { createConnection, type Socket } from 'node:net';
import { checkServerIdentity, connect, type PeerCertificate, type TLSSocket } from 'node:tls';

import { normalizePublicAddress, type PublicAddress } from './address-policy.js';
import type { InternalCaptureBudget, MonotonicClock, TimerScheduler } from './budget.js';
import { PublicUrlTransportError } from './errors.js';

export interface NumericConnection {
  readonly socket: Socket;
  readonly peer: PublicAddress;
}

export interface ResolverAdapter {
  resolve(hostname: string, budget: InternalCaptureBudget): Promise<readonly PublicAddress[]>;
}

export interface NumericConnectorAdapter {
  connect(
    selection: PublicAddress & { readonly port: number },
    budget: InternalCaptureBudget,
  ): Promise<NumericConnection>;
}

export interface TlsAdapter {
  wrap(
    connection: NumericConnection,
    identity: string,
    hostname: string | null,
    budget: InternalCaptureBudget,
  ): Promise<TLSSocket>;
}

export interface PublicUrlTransportTestProviders {
  readonly resolver?: ResolverAdapter;
  readonly connector?: NumericConnectorAdapter;
  readonly tls?: TlsAdapter;
  readonly clock?: MonotonicClock;
  readonly timers?: TimerScheduler;
}

export function createNodeResolverForTesting(servers: readonly string[]): ResolverAdapter {
  return createNodeResolver(servers);
}

export const productionResolver: ResolverAdapter = createNodeResolver();

function createNodeResolver(servers?: readonly string[]): ResolverAdapter {
  return {
    async resolve(hostname, budget) {
      const resolver = new Resolver();
      if (servers !== undefined) resolver.setServers([...servers]);
      const cancel = (): void => resolver.cancel();
      budget.signal.addEventListener('abort', cancel, { once: true });
      try {
        const answers = await Promise.allSettled([resolver.resolve4(hostname), resolver.resolve6(hostname)]);
        const records: PublicAddress[] = [];
        for (const [index, answer] of answers.entries()) {
          if (answer.status === 'rejected') {
            if (isNoDataError(answer.reason)) continue;
            throw new PublicUrlTransportError('fetch_failed');
          }
          const family: PublicAddress['family'] = index === 0 ? 4 : 6;
          records.push(...answer.value.map((address) => ({ address, family })));
        }
        if (records.length === 0) throw new PublicUrlTransportError('fetch_failed');
        return records;
      } finally {
        budget.signal.removeEventListener('abort', cancel);
      }
    },
  };
}

function isNoDataError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'ENODATA'
  );
}

export const productionConnector: NumericConnectorAdapter = {
  async connect(selection, budget) {
    return new Promise<NumericConnection>((resolve, reject) => {
      const socket = createConnection({ host: selection.address, port: selection.port, family: selection.family });
      const stop = (): void => {
        socket.destroy();
      };
      const cleanup = (): void => {
        socket.removeListener('connect', onConnect);
        socket.removeListener('error', onError);
        budget.signal.removeEventListener('abort', stop);
      };
      const onError = (): void => {
        cleanup();
        reject(budget.signal.aborted ? budget.signal.reason : new PublicUrlTransportError('fetch_failed'));
      };
      const onConnect = (): void => {
        const remoteAddress = socket.remoteAddress;
        const remoteFamily = socket.remoteFamily === 'IPv4' ? 4 : socket.remoteFamily === 'IPv6' ? 6 : null;
        cleanup();
        if (remoteAddress === undefined || remoteFamily === null) {
          socket.destroy();
          reject(new PublicUrlTransportError('validation_blocked'));
          return;
        }
        let peer: PublicAddress;
        try {
          peer = normalizePublicAddress({ address: remoteAddress, family: remoteFamily });
        } catch {
          socket.destroy();
          reject(new PublicUrlTransportError('validation_blocked'));
          return;
        }
        if (peer.family !== selection.family || peer.address !== selection.address) {
          socket.destroy();
          reject(new PublicUrlTransportError('validation_blocked'));
          return;
        }
        resolve({ socket, peer });
      };
      budget.signal.addEventListener('abort', stop, { once: true });
      socket.once('error', onError);
      socket.once('connect', onConnect);
    });
  },
};

export const productionTls: TlsAdapter = {
  async wrap(connection, identity, hostname, budget) {
    return new Promise<TLSSocket>((resolve, reject) => {
      const options = {
        socket: connection.socket,
        rejectUnauthorized: true,
        checkServerIdentity: (_presentedName: string, certificate: PeerCertificate) =>
          checkServerIdentity(identity, certificate),
        ...(hostname === null ? {} : { servername: hostname }),
      };
      const socket = connect(options);
      const stop = (): void => {
        socket.destroy();
      };
      const cleanup = (): void => {
        socket.removeListener('secureConnect', onSecureConnect);
        socket.removeListener('error', onError);
        budget.signal.removeEventListener('abort', stop);
      };
      const onError = (error: Error): void => {
        cleanup();
        if (budget.signal.aborted) {
          reject(budget.signal.reason);
          return;
        }
        reject(
          new PublicUrlTransportError(isTlsValidationError(error, socket) ? 'validation_blocked' : 'fetch_failed'),
        );
      };
      const onSecureConnect = (): void => {
        cleanup();
        if (!socket.authorized) {
          socket.destroy();
          reject(new PublicUrlTransportError('validation_blocked'));
          return;
        }
        resolve(socket);
      };
      budget.signal.addEventListener('abort', stop, { once: true });
      socket.once('error', onError);
      socket.once('secureConnect', onSecureConnect);
    });
  },
};

const TLS_VALIDATION_ERROR_CODES = new Set([
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'CERT_REJECTED',
  'CERT_UNTRUSTED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_FORMAT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'INVALID_CA',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

function isTlsValidationError(error: Error, socket: TLSSocket): boolean {
  const code = 'code' in error ? (error as Error & { readonly code?: unknown }).code : undefined;
  return (
    (typeof code === 'string' && TLS_VALIDATION_ERROR_CODES.has(code)) ||
    (socket.authorizationError !== null && socket.authorizationError !== undefined)
  );
}
