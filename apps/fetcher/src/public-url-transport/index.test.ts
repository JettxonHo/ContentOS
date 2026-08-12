import { createServer, type Server as HttpServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { createConnection, createServer as createTcpServer, Socket, type Server as TcpServer } from 'node:net';
import { once } from 'node:events';
import { createSocket, type Socket as DatagramSocket } from 'node:dgram';
import { gzipSync } from 'node:zlib';
import { connect as connectTls, checkServerIdentity, type TLSSocket } from 'node:tls';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { createPublicUrlTransport, PublicUrlTransportError } from './index.js';
import {
  assertProxyPolicyForTesting,
  createPublicUrlTransportForTesting,
  resolveWithNodeResolverForTesting,
} from './test-support.js';

const servers: Array<Pick<HttpServer | TcpServer, 'close'>> = [];
const dnsServers: DatagramSocket[] = [];
const temporaryDirectories: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  await Promise.all(
    dnsServers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('PublicUrlTransport', () => {
  it('rejects a restricted IP literal before a connection can be attempted', async () => {
    const transport = createPublicUrlTransport();

    await expect(transport.fetch('http://127.0.0.1')).rejects.toMatchObject({
      category: 'validation_blocked',
      code: 'VALIDATION_BLOCKED',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('uses the reviewed public-address snapshot, including its allow override', async () => {
    const transport = createPublicUrlTransportForTesting({
      connector: {
        connect: async () => {
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch('http://192.0.0.8')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://192.0.0.9')).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://[2001:db8::1]')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://[2001:4860:4860::8888]')).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('rejects an alternate numeric spelling instead of normalizing it into a request', async () => {
    const transport = createPublicUrlTransportForTesting({
      connector: {
        connect: async () => {
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch('http://134744072')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('applies the reviewed IPv6 allow overrides while blocking mapped IPv6 input', async () => {
    const transport = createPublicUrlTransportForTesting({
      connector: {
        connect: async () => {
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch('http://[2001:1::1]')).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://[::ffff:8.8.8.8]')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it.each([
    ['192.0.0.9/32', 'http://192.0.0.9'],
    ['192.0.0.10/32', 'http://192.0.0.10'],
    ['2001:1::1/128', 'http://[2001:1::1]'],
    ['2001:1::2/128', 'http://[2001:1::2]'],
    ['2001:1::3/128', 'http://[2001:1::3]'],
    ['2001:3::/32', 'http://[2001:3:abcd::1]'],
    ['2001:4:112::/48', 'http://[2001:4:112:abcd::1]'],
    ['2001:20::/28', 'http://[2001:20:abcd::1]'],
    ['2001:30::/28', 'http://[2001:30:abcd::1]'],
  ])('allows the exact v1 public-address override %s', async (_policyEntry, url) => {
    const transport = createPublicUrlTransportForTesting({
      connector: {
        connect: async () => {
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch(url)).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('binds a selected public address while sending only controlled request identity', async () => {
    let receivedHost: string | undefined;
    let receivedUserAgent: string | undefined;
    const server = createServer((request, response) => {
      receivedHost = request.headers.host;
      receivedUserAgent = request.headers['user-agent'];
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('fixture response');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const fixturePort = (server.address() as { port: number }).port;
    const transport = fixtureTransport(fixturePort);

    const response = await transport.fetch('http://fixture.test');
    const encoded: Uint8Array[] = [];
    const decoded: Uint8Array[] = [];
    const sizes = await response.consume({
      onEncoded: async (chunk) => void encoded.push(chunk),
      onDecoded: async (chunk) => void decoded.push(chunk),
    });
    response.dispose();

    expect(receivedHost).toBe('fixture.test');
    expect(receivedUserAgent).toBe('ContentOS-Fetcher/1.0');
    expect(new TextDecoder().decode(Buffer.concat(decoded))).toBe('fixture response');
    expect(sizes).toEqual({ encodedByteSize: 16, decodedByteSize: 16 });
    expect(encoded).toHaveLength(1);
  });

  it('revalidates a relative redirect and preserves private redirect evidence', async () => {
    let requestCount = 0;
    const server = createServer((request, response) => {
      requestCount += 1;
      if (request.url === '/start') {
        response.writeHead(302, { location: '/final' });
        response.end();
        return;
      }
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('redirected');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    const response = await transport.fetch('http://fixture.test/start');
    const decoded: Uint8Array[] = [];
    await response.consume({
      onEncoded: async () => undefined,
      onDecoded: async (chunk) => void decoded.push(chunk),
    });
    response.dispose();

    expect(response.finalUrl).toBe('http://fixture.test/final');
    expect(response.redirects).toEqual([{ status: 302, url: 'http://fixture.test/final' }]);
    expect(requestCount).toBe(2);
    expect(new TextDecoder().decode(Buffer.concat(decoded))).toBe('redirected');
  });

  it('rejects mixed DNS evidence before invoking the numeric connector', async () => {
    let connected = false;
    const transport = createPublicUrlTransportForTesting({
      resolver: {
        resolve: async () => [
          { address: '8.8.8.8', family: 4 },
          { address: '127.0.0.1', family: 4 },
        ],
      },
      connector: {
        connect: async () => {
          connected = true;
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch('http://fixture.test')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    expect(connected).toBe(false);
  });

  it('normalizes a public resolver answer without relaxing numeric-host validation', async () => {
    const selections: string[] = [];
    const transport = createPublicUrlTransportForTesting({
      resolver: {
        resolve: async () => [{ address: '2001:4860:4860:0:0:0:0:8888', family: 6 }],
      },
      connector: {
        connect: async (selection) => {
          selections.push(selection.address);
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });

    await expect(transport.fetch('http://fixture.test')).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
    expect(selections).toEqual(['2001:4860:4860::8888']);
  });

  it('rejects the actual restricted peer of a real socket when it differs from selection', async () => {
    const server = createTcpServer();
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    let observedPeer: string | undefined;
    const transport = createPublicUrlTransportForTesting({
      resolver: {
        resolve: async () => [{ address: '8.8.8.8', family: 4 }],
      },
      connector: {
        connect: async () => {
          const socket = await connectLoopback((server.address() as { port: number }).port);
          observedPeer = socket.remoteAddress;
          return {
            socket,
            peer: { address: socket.remoteAddress as string, family: socket.remoteFamily === 'IPv4' ? 4 : 6 },
          };
        },
      },
    });

    await expect(transport.fetch('http://fixture.test')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    expect(observedPeer).toBe('127.0.0.1');
  });

  it('collects A and AAAA evidence through a local Node Resolver fixture', async () => {
    const dns = await startDnsFixture();
    const answers = await resolveWithNodeResolverForTesting([dns.origin], 'fixture.test');

    expect(answers).toEqual([
      { address: '8.8.8.8', family: 4 },
      { address: '2001:4860:4860::8888', family: 6 },
    ]);
    expect(dns.queryTypes.sort((left, right) => left - right)).toEqual([1, 28]);
  });

  it('accepts public DNS evidence when the other family determinately has no records', async () => {
    const dns = await startDnsFixture({ aaaa: 'enodata' });

    await expect(resolveWithNodeResolverForTesting([dns.origin], 'fixture.test')).resolves.toEqual([
      { address: '8.8.8.8', family: 4 },
    ]);
  });

  it('fails the complete DNS evidence when one family is indeterminate', async () => {
    const dns = await startDnsFixture({ aaaa: 'servfail' });

    await expect(resolveWithNodeResolverForTesting([dns.origin], 'fixture.test')).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('uses hostname SNI and native TLS identity over the selected numeric connection', async () => {
    let observedServername: string | false | undefined;
    const fixture = await startHttpsFixture((request, response) => {
      observedServername = (request.socket as TLSSocket & { servername?: string | false }).servername;
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('secure fixture');
    });
    const transport = createPublicUrlTransportForTesting({
      resolver: {
        resolve: async () => [{ address: '8.8.8.8', family: 4 }],
      },
      connector: {
        connect: async (selection) => ({ socket: await connectLoopback(fixture.port), peer: selection }),
      },
      tls: {
        wrap: async (connection, identity, hostname, budget) =>
          new Promise((resolve, reject) => {
            const socket = connectTls({
              socket: connection.socket,
              ca: fixture.certificate,
              rejectUnauthorized: true,
              checkServerIdentity: (_presented, certificate) => checkServerIdentity(identity, certificate),
              ...(hostname === null ? {} : { servername: hostname }),
            });
            const stop = (): void => {
              socket.destroy();
            };
            const cleanup = (): void => {
              socket.removeListener('secureConnect', onSecureConnect);
              socket.removeListener('error', onError);
              budget.signal.removeEventListener('abort', stop);
            };
            const onSecureConnect = (): void => {
              cleanup();
              resolve(socket);
            };
            const onError = (): void => {
              cleanup();
              reject(new PublicUrlTransportError('validation_blocked'));
            };
            budget.signal.addEventListener('abort', stop, { once: true });
            socket.once('secureConnect', onSecureConnect);
            socket.once('error', onError);
          }),
      },
    });

    const response = await transport.fetch('https://fixture.test');
    await response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined });
    response.dispose();

    expect(observedServername).toBe('fixture.test');
  });

  it('omits SNI and uses the literal IP as TLS identity for an IP-literal URL', async () => {
    let receivedIdentity: string | undefined;
    let receivedHostname: string | null | undefined;
    const transport = createPublicUrlTransportForTesting({
      connector: {
        connect: async (selection) => ({ socket: new Socket(), peer: selection }),
      },
      tls: {
        wrap: async (_connection, identity, hostname) => {
          receivedIdentity = identity;
          receivedHostname = hostname;
          throw new PublicUrlTransportError('validation_blocked');
        },
      },
    });

    await expect(transport.fetch('https://8.8.8.8')).rejects.toMatchObject({
      category: 'validation_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    expect(receivedIdentity).toBe('8.8.8.8');
    expect(receivedHostname).toBeNull();
  });

  it('classifies a reachable TLS reset as a redacted transport failure', async () => {
    const server = createTcpServer((socket) => socket.destroy());
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = (server.address() as { port: number }).port;
    const transport = fixtureTransport(port);

    await expect(transport.fetch('https://fixture.test')).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('classifies native certificate rejection as a redacted validation denial', async () => {
    const fixture = await startHttpsFixture((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('untrusted fixture');
    });
    const transport = fixtureTransport(fixture.port);

    await expect(transport.fetch('https://fixture.test')).rejects.toMatchObject({
      category: 'validation_blocked',
      code: 'VALIDATION_BLOCKED',
      message: 'VALIDATION_BLOCKED',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('streams gzip once to both bounded sinks and rejects a second consumption', async () => {
    const payload = Buffer.from('compressed fixture response');
    const encodedPayload = gzipSync(payload);
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'content-length': encodedPayload.byteLength,
      });
      response.end(encodedPayload);
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    const response = await transport.fetch('http://fixture.test');
    const decoded: Uint8Array[] = [];
    const sizes = await response.consume({
      onEncoded: async () => undefined,
      onDecoded: async (chunk) => void decoded.push(chunk),
    });

    expect(new TextDecoder().decode(Buffer.concat(decoded))).toBe(payload.toString());
    expect(sizes).toEqual({ encodedByteSize: encodedPayload.byteLength, decodedByteSize: payload.byteLength });
    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'fetch_failed' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('aborts decompression as soon as the fixed expansion ratio is exceeded', async () => {
    const encodedPayload = gzipSync(Buffer.alloc(1024, 'x'));
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'content-length': encodedPayload.byteLength,
      });
      response.end(encodedPayload);
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);
    const response = await transport.fetch('http://fixture.test');

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'too_large', code: 'TOO_LARGE' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('rejects a chunked encoded body as soon as it exceeds 2 MiB', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.write(Buffer.alloc(1024 * 1024, 'a'));
      response.end(Buffer.alloc(1024 * 1024 + 1, 'b'));
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test');

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'too_large', code: 'TOO_LARGE' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('rejects decoded content above 8 MiB while the expansion ratio remains below 20:1', async () => {
    const decodedPayload = decodedLimitFixture();
    const encodedPayload = gzipSync(decodedPayload);
    expect(encodedPayload.byteLength).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(decodedPayload.byteLength).toBeGreaterThan(8 * 1024 * 1024);
    expect(decodedPayload.byteLength).toBeLessThanOrEqual(encodedPayload.byteLength * 20);
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'content-length': encodedPayload.byteLength,
      });
      response.end(encodedPayload);
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test');

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'too_large', code: 'TOO_LARGE' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  }, 10_000);

  it('blocks a declared encoded body limit before accepting a response body', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': 2 * 1024 * 1024 + 1,
      });
      response.end();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    await expect(transport.fetch('http://fixture.test')).rejects.toMatchObject({
      category: 'too_large',
      code: 'TOO_LARGE',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('classifies raw header-byte overflow as a redacted fetch failure', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain', 'x-large': 'x'.repeat(16 * 1024) });
      response.end('headers');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    await expect(
      fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test'),
    ).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('rejects a redirect loop before a third request can be sent', async () => {
    let requestCount = 0;
    const server = createServer((_request, response) => {
      requestCount += 1;
      response.writeHead(301, { location: '/loop' });
      response.end();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    await expect(
      fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test/loop'),
    ).rejects.toMatchObject({
      category: 'redirect_blocked',
      code: 'REDIRECT_BLOCKED',
    } satisfies Partial<PublicUrlTransportError>);
    expect(requestCount).toBe(1);
  });

  it('treats dotted and undotted hostname forms as one redirect identity', async () => {
    let requestCount = 0;
    let receivedHost: string | undefined;
    const server = createServer((request, response) => {
      requestCount += 1;
      receivedHost = request.headers.host;
      response.writeHead(302, { location: 'http://fixture.test/loop' });
      response.end();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    await expect(
      fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test./loop'),
    ).rejects.toMatchObject({ category: 'redirect_blocked' } satisfies Partial<PublicUrlTransportError>);
    expect(receivedHost).toBe('fixture.test');
    expect(requestCount).toBe(1);
  });

  it('rejects a redirect to a restricted target before a second request', async () => {
    let requestCount = 0;
    const server = createServer((_request, response) => {
      requestCount += 1;
      response.writeHead(302, { location: 'http://127.0.0.1/private' });
      response.end();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    await expect(
      fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test/start'),
    ).rejects.toMatchObject({ category: 'redirect_blocked' } satisfies Partial<PublicUrlTransportError>);
    expect(requestCount).toBe(1);
  });

  it('rejects missing and ambiguous redirect locations', async () => {
    const server = createServer((request, response) => {
      if (request.url === '/ambiguous') {
        response.setHeader('location', ['/one', '/two']);
      }
      response.writeHead(302);
      response.end();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    await expect(transport.fetch('http://fixture.test/missing')).rejects.toMatchObject({
      category: 'redirect_blocked',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://fixture.test/ambiguous')).rejects.toMatchObject({
      category: 'redirect_blocked',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('accepts exactly five redirects and rejects a sixth', async () => {
    const requestCounts = { five: 0, six: 0 };
    const server = createServer((request, response) => {
      const match = request.url?.match(/^\/(five|six)\/(\d+)$/u);
      if (match === null || match === undefined) {
        response.writeHead(500);
        response.end();
        return;
      }
      const mode = match[1] as 'five' | 'six';
      const step = Number(match[2]);
      requestCounts[mode] += 1;
      const redirectCount = mode === 'five' ? 5 : 6;
      if (step < redirectCount) {
        response.writeHead(302, { location: `/${mode}/${step + 1}` });
        response.end();
        return;
      }
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('final');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    const accepted = await transport.fetch('http://fixture.test/five/0');
    await accepted.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined });
    accepted.dispose();
    await expect(transport.fetch('http://fixture.test/six/0')).rejects.toMatchObject({
      category: 'redirect_blocked',
    } satisfies Partial<PublicUrlTransportError>);

    expect(requestCounts).toEqual({ five: 6, six: 6 });
  });

  it('rejects a non-200 final response and an unsupported response representation', async () => {
    const server = createServer((request, response) => {
      if (request.url === '/status') {
        response.writeHead(418, { 'content-type': 'text/plain' });
        response.end('not accepted');
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json', 'content-encoding': 'gzip, br' });
      response.end('{"not":"text"}');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);

    await expect(transport.fetch('http://fixture.test/status')).rejects.toMatchObject({
      category: 'fetch_failed',
    } satisfies Partial<PublicUrlTransportError>);
    await expect(transport.fetch('http://fixture.test/unsupported')).rejects.toMatchObject({
      category: 'unsupported_content',
      code: 'UNSUPPORTED_CONTENT',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('releases an accepted response when metadata validation rejects it', async () => {
    let serverResponse: ServerResponse | undefined;
    let resolveClosed: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    const server = createServer((_request, response) => {
      serverResponse = response;
      response.once('close', () => resolveClosed?.());
      response.writeHead(200, { 'content-type': 'application/json' });
      response.flushHeaders();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    await expect(
      fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test'),
    ).rejects.toMatchObject({ category: 'unsupported_content' } satisfies Partial<PublicUrlTransportError>);
    const released = await Promise.race([
      closed.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 50)),
    ]);
    serverResponse?.destroy();

    expect(released).toBe(true);
  });

  it('rejects an empty final body and an excessive header-field count', async () => {
    const headers = Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`x-fixture-${index}`, 'x']));
    const server = createServer((request, response) => {
      if (request.url === '/empty') {
        response.writeHead(200, { 'content-type': 'text/plain', 'content-length': '0' });
        response.end();
        return;
      }
      response.writeHead(200, { ...headers, 'content-type': 'text/plain' });
      response.end('headers');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);
    const empty = await transport.fetch('http://fixture.test/empty');

    await expect(
      empty.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'fetch_failed' } satisfies Partial<PublicUrlTransportError>);
    empty.dispose();
    await expect(transport.fetch('http://fixture.test/headers')).rejects.toMatchObject({
      category: 'too_large',
      code: 'TOO_LARGE',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('rejects a valid compressed representation whose decoded body is empty', async () => {
    const encodedPayload = gzipSync(Buffer.alloc(0));
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/plain',
        'content-encoding': 'gzip',
        'content-length': encodedPayload.byteLength,
      });
      response.end(encodedPayload);
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test');

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('classifies malformed compressed content as a redacted fetch failure', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain', 'content-encoding': 'gzip' });
      response.end('not a gzip stream');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port).fetch('http://fixture.test');

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('allows unset and empty proxy configuration', () => {
    expect(() => assertProxyPolicyForTesting({})).not.toThrow();
    expect(() =>
      assertProxyPolicyForTesting({
        environment: { HTTP_PROXY: '', HTTPS_PROXY: '  ', NODE_USE_ENV_PROXY: '' },
      }),
    ).not.toThrow();
  });

  it('fails closed for a non-empty proxy variable or process flag', () => {
    expect(() =>
      assertProxyPolicyForTesting({ environment: { HTTP_PROXY: 'http://proxy.fixture.test:8080' } }),
    ).toThrowError(expect.objectContaining({ category: 'validation_blocked', message: 'VALIDATION_BLOCKED' }));
    expect(() => assertProxyPolicyForTesting({ execArgv: ['--use-env-proxy'] })).toThrowError(
      expect.objectContaining({ category: 'validation_blocked', message: 'VALIDATION_BLOCKED' }),
    );
  });

  it('fails closed when NODE_OPTIONS enables environment proxying', () => {
    expect(() =>
      assertProxyPolicyForTesting({ environment: { NODE_OPTIONS: '--trace-warnings "--use-env-proxy"' } }),
    ).toThrowError(expect.objectContaining({ category: 'validation_blocked', message: 'VALIDATION_BLOCKED' }));
  });

  it('normalizes Node option underscore aliases before proxy inspection', () => {
    expect(() => assertProxyPolicyForTesting({ execArgv: ['--use_env_proxy=true'] })).toThrowError(
      expect.objectContaining({ category: 'validation_blocked', message: 'VALIDATION_BLOCKED' }),
    );
    expect(() =>
      assertProxyPolicyForTesting({ environment: { NODE_OPTIONS: '--trace-warnings --use_env_proxy' } }),
    ).toThrowError(expect.objectContaining({ category: 'validation_blocked', message: 'VALIDATION_BLOCKED' }));
  });

  it('allows unrelated quoted Node option values containing the proxy-flag substring', () => {
    expect(() =>
      assertProxyPolicyForTesting({
        environment: {
          NODE_OPTIONS: '--require "/tmp/plugin --use-env-proxy.js" --conditions="feature--use-env-proxy"',
        },
      }),
    ).not.toThrow();
  });

  it('enforces the TCP deadline with an abort shared by the transport', async () => {
    const timers = new ManualTimers();
    const transport = createPublicUrlTransportForTesting({
      clock: { now: () => 0 },
      timers,
      connector: {
        connect: async () => await new Promise<never>(() => undefined),
      },
    });
    const fetch = transport.fetch('http://8.8.8.8');
    await waitForTimer(timers, 5_000);
    timers.fire(5_000);

    await expect(fetch).rejects.toMatchObject({
      category: 'timeout',
      code: 'TIMEOUT',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('enforces the non-extendable total Capture Budget while resolution is still pending', async () => {
    const timers = new ManualTimers();
    const transport = createPublicUrlTransportForTesting({
      clock: { now: () => 0 },
      timers,
      resolver: {
        resolve: async () => await new Promise<never>(() => undefined),
      },
      connector: {
        connect: async () => {
          throw new PublicUrlTransportError('fetch_failed');
        },
      },
    });
    const fetch = transport.fetch('http://fixture.test');
    await waitForTimer(timers, 30_000);
    timers.fire(30_000);

    await expect(fetch).rejects.toMatchObject({
      category: 'timeout',
      code: 'TIMEOUT',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('enforces the TLS deadline before an HTTPS request is sent', async () => {
    const timers = new ManualTimers();
    const transport = createPublicUrlTransportForTesting({
      clock: { now: () => 0 },
      timers,
      connector: {
        connect: async (selection) => ({ socket: new Socket(), peer: selection }),
      },
      tls: {
        wrap: async () => await new Promise<never>(() => undefined),
      },
    });
    const fetch = transport.fetch('https://8.8.8.8');
    await waitForTimer(timers, 5_000);
    timers.fire(5_000);

    await expect(fetch).rejects.toMatchObject({
      category: 'timeout',
      code: 'TIMEOUT',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('enforces the response-header deadline and destroys the preconnected request', async () => {
    const timers = new ManualTimers();
    const server = createServer(() => undefined);
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = createPublicUrlTransportForTesting({
      clock: { now: () => 0 },
      timers,
      resolver: { resolve: async () => [{ address: '8.8.8.8', family: 4 }] },
      connector: {
        connect: async (selection) => ({
          socket: await connectLoopback((server.address() as { port: number }).port),
          peer: selection,
        }),
      },
    });
    const fetch = transport.fetch('http://fixture.test');
    await waitForTimer(timers, 10_000);
    timers.fire(10_000);

    await expect(fetch).rejects.toMatchObject({
      category: 'timeout',
      code: 'TIMEOUT',
    } satisfies Partial<PublicUrlTransportError>);
  });

  it('enforces final-body inactivity after a 200 response is handed off', async () => {
    const timers = new ManualTimers();
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.flushHeaders();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = createPublicUrlTransportForTesting({
      clock: { now: () => 0 },
      timers,
      resolver: { resolve: async () => [{ address: '8.8.8.8', family: 4 }] },
      connector: {
        connect: async (selection) => ({
          socket: await connectLoopback((server.address() as { port: number }).port),
          peer: selection,
        }),
      },
    });
    const response = await transport.fetch('http://fixture.test');
    await waitForTimer(timers, 10_000);
    timers.fire(10_000);

    expect(response.budget.signal.aborted).toBe(true);
    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'timeout', code: 'TIMEOUT' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('preserves the total-budget timeout when it expires before body consumption', async () => {
    const timers = new ManualTimers();
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.flushHeaders();
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port, { timers }).fetch(
      'http://fixture.test',
    );
    await waitForTimer(timers, 30_000);
    timers.fire(30_000);

    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'timeout', code: 'TIMEOUT' } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
  });

  it('maps both sink failures to redacted stable failures and disposes idempotently', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('sink fixture');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const transport = fixtureTransport((server.address() as { port: number }).port);
    const response = await transport.fetch('http://fixture.test');

    await expect(
      response.consume({
        onEncoded: async () => {
          throw new Error('http://fixture.test/private?token=secret');
        },
        onDecoded: async () => undefined,
      }),
    ).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
    response.dispose();
    response.dispose();
    expect(response.budget.signal.aborted).toBe(true);

    const decodedFailure = await transport.fetch('http://fixture.test');
    await expect(
      decodedFailure.consume({
        onEncoded: async () => undefined,
        onDecoded: async () => {
          throw new Error('decoded private body and token=secret');
        },
      }),
    ).rejects.toMatchObject({
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
      message: 'FETCH_FAILED',
    } satisfies Partial<PublicUrlTransportError>);
    decodedFailure.dispose();
  });

  it('clears budget and inactivity timers when disposed before consumption', async () => {
    const timers = new ManualTimers();
    const server = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('dispose fixture');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fixtureTransport((server.address() as { port: number }).port, { timers }).fetch(
      'http://fixture.test',
    );
    expect(timers.has(10_000)).toBe(true);
    expect(timers.has(30_000)).toBe(true);

    response.dispose();

    expect(timers.has(10_000)).toBe(false);
    expect(timers.has(30_000)).toBe(false);
    await expect(
      response.consume({ onEncoded: async () => undefined, onDecoded: async () => undefined }),
    ).rejects.toMatchObject({ category: 'fetch_failed' } satisfies Partial<PublicUrlTransportError>);
  });
});

async function connectLoopback(port: number): Promise<Socket> {
  const socket = createConnection({ host: '127.0.0.1', port });
  await once(socket, 'connect');
  return socket;
}

function fixtureTransport(port: number, providers: Parameters<typeof createPublicUrlTransportForTesting>[0] = {}) {
  return createPublicUrlTransportForTesting({
    ...providers,
    resolver: {
      resolve: async () => [{ address: '8.8.8.8', family: 4 }],
    },
    connector: {
      connect: async (selection) => ({
        socket: await connectLoopback(port),
        peer: selection,
      }),
    },
  });
}

async function startDnsFixture(
  result: { readonly a?: 'answer' | 'enodata' | 'servfail'; readonly aaaa?: 'answer' | 'enodata' | 'servfail' } = {},
): Promise<{ origin: string; queryTypes: number[] }> {
  const server = createSocket('udp4');
  const queryTypes: number[] = [];
  dnsServers.push(server);
  server.on('message', (query, remote) => {
    const questionEnd = dnsQuestionEnd(query);
    const type = query.readUInt16BE(questionEnd - 4);
    queryTypes.push(type);
    const familyResult = type === 1 ? (result.a ?? 'answer') : (result.aaaa ?? 'answer');
    const flags = familyResult === 'servfail' ? Buffer.from([0x81, 0x82]) : Buffer.from([0x81, 0x80]);
    const answerCount = familyResult === 'answer' ? 1 : 0;
    const answer = type === 1 ? Buffer.from([8, 8, 8, 8]) : Buffer.from('20014860486000000000000000008888', 'hex');
    const header = Buffer.concat([
      query.subarray(0, 2),
      flags,
      Buffer.from([0x00, 0x01, 0x00, answerCount, 0x00, 0x00, 0x00, 0x00]),
      query.subarray(12, questionEnd),
    ]);
    const response =
      familyResult === 'answer'
        ? Buffer.concat([
            header,
            Buffer.from([
              0xc0,
              0x0c,
              type >> 8,
              type & 0xff,
              0x00,
              0x01,
              0x00,
              0x00,
              0x00,
              0x3c,
              0x00,
              answer.byteLength,
            ]),
            answer,
          ])
        : header;
    server.send(response, remote.port, remote.address);
  });
  server.bind(0, '127.0.0.1');
  await once(server, 'listening');
  const port = (server.address() as { port: number }).port;
  return { origin: `127.0.0.1:${port}`, queryTypes };
}

function dnsQuestionEnd(query: Buffer): number {
  let index = 12;
  while (query[index] !== 0) index += (query[index] ?? 0) + 1;
  return index + 5;
}

async function startHttpsFixture(
  handler: Parameters<typeof createHttpsServer>[1],
): Promise<{ certificate: Buffer; port: number }> {
  const directory = await mkdtemp(join(tmpdir(), 'contentos-fetcher-tls-'));
  temporaryDirectories.push(directory);
  const keyPath = join(directory, 'fixture.key');
  const certificatePath = join(directory, 'fixture.crt');
  await execFileAsync('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    keyPath,
    '-out',
    certificatePath,
    '-subj',
    '/CN=fixture.test',
    '-days',
    '1',
  ]);
  const [key, certificate] = await Promise.all([readFile(keyPath), readFile(certificatePath)]);
  const server = createHttpsServer({ key, cert: certificate }, handler);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { certificate, port: (server.address() as { port: number }).port };
}

function decodedLimitFixture(): Buffer {
  const payload = Buffer.alloc(9 * 1024 * 1024);
  let state = 0x12345678;
  for (let index = 0; index < payload.length; index += 8) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    payload[index] = state >>> 24;
  }
  return payload;
}

class ManualTimers {
  #timers: Array<{ delayMs: number; callback: () => void; cleared: boolean }> = [];

  set(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
    const timer = { delayMs, callback, cleared: false };
    this.#timers.push(timer);
    return timer as unknown as ReturnType<typeof setTimeout>;
  }

  clear(timer: ReturnType<typeof setTimeout>): void {
    (timer as unknown as { cleared: boolean }).cleared = true;
  }

  has(delayMs: number): boolean {
    return this.#timers.some((timer) => timer.delayMs === delayMs && !timer.cleared);
  }

  fire(delayMs: number): void {
    const timer = this.#timers.find((candidate) => candidate.delayMs === delayMs && !candidate.cleared);
    if (timer === undefined) throw new Error(`missing ${delayMs}ms timer`);
    timer.cleared = true;
    timer.callback();
  }
}

async function waitForTimer(timers: ManualTimers, delayMs: number): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (timers.has(delayMs)) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error(`timer ${delayMs}ms was not scheduled`);
}
