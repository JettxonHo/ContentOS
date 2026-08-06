import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createConnection, createServer, type Server, type Socket } from 'node:net';
import { join } from 'node:path';

import { buildFetcherTaskJobId, FETCHER_JOB_ATTEMPTS, FETCHER_JOB_NAME } from '@contentos/contracts';
import { Queue } from 'bullmq';
import { Client } from 'pg';
import { afterEach, describe, expect, it } from 'vitest';

import { readComposeCredentials, requireState } from './env.js';
import { cleanupOwnedFetcherQueue } from './harness.js';

interface LifecycleRecord {
  event?: string;
  service?: string;
}

const SERVICES = ['worker', 'fetcher', 'renderer'] as const;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

interface LineParser {
  push(chunk: string): void;
  flush(): void;
}

interface TcpProxy {
  readonly port: number;
  dropConnections(): void;
  close(): Promise<void>;
}

interface TcpProxyConnection {
  readonly client: Socket;
  readonly upstream: Socket;
}

async function startTcpProxy(targetPort: number): Promise<TcpProxy> {
  const connections = new Set<TcpProxyConnection>();
  const server: Server = createServer((client) => {
    const upstream = createConnection({ host: '127.0.0.1', port: targetPort });
    const connection = { client, upstream };
    connections.add(connection);
    const remove = (): void => {
      connections.delete(connection);
    };
    client.on('error', remove);
    upstream.on('error', remove);
    client.on('close', remove);
    upstream.on('close', remove);
    client.pipe(upstream);
    upstream.pipe(client);
  });
  server.on('error', () => undefined);
  await new Promise<void>((resolve, reject) => {
    const onListening = (): void => {
      server.off('error', onError);
      resolve();
    };
    const onError = (error: Error): void => {
      server.off('listening', onListening);
      reject(error);
    };
    server.once('listening', onListening);
    server.once('error', onError);
    server.listen(0, '127.0.0.1');
  });
  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    throw new Error('worker lifecycle proxy did not bind a port');
  }
  return {
    port: address.port,
    dropConnections(): void {
      for (const connection of connections) {
        connection.client.destroy();
        connection.upstream.destroy();
      }
    },
    async close(): Promise<void> {
      for (const connection of connections) {
        connection.client.destroy();
        connection.upstream.destroy();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

// Node stream chunks may split a single JSON record across two 'data' events,
// so buffer partial lines and parse only complete newline-terminated lines.
function createLineParser(emit: (record: LifecycleRecord) => void): LineParser {
  let buffer = '';
  const parseLine = (line: string): void => {
    const trimmed = line.trim();
    if (trimmed === '') {
      return;
    }
    try {
      emit(JSON.parse(trimmed) as LifecycleRecord);
    } catch {
      // ignore non-JSON lines (e.g. framework noise)
    }
  };
  return {
    push(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        parseLine(line);
      }
    },
    flush(): void {
      parseLine(buffer);
      buffer = '';
    },
  };
}

function quoteDatabase(database: string): string {
  if (!/^m2wf003a_[0-9a-f]{32}$/.test(database)) throw new Error('unexpected lifecycle database name');
  return `"${database}"`;
}

function workerDatabaseUrl(port: number, credentials: Record<string, string>): string {
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${port}/smoke_db`;
}

function workerRedisUrl(port: number, credentials: Record<string, string>): string {
  return `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${port}`;
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<number> {
  if (child.exitCode !== null) return child.exitCode;
  const exited = new Promise<number>((resolve) => {
    child.once('close', (code) => resolve(code ?? -1));
  });
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      exited,
      new Promise<number>((resolve) => {
        timer = setTimeout(() => {
          child.kill('SIGKILL');
          resolve(-1);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Send SIGTERM, wait up to timeoutMs, then escalate to SIGKILL. The escalation
// timer is always cleared, and the function returns only after the child has
// actually closed, so no process is left running.
async function terminate(child: ChildProcess, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const closed = new Promise<void>((resolve) => {
    child.once('close', () => resolve());
  });
  const escalation = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // already gone
      }
      resolve();
    }, timeoutMs);
  });
  try {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
    await Promise.race([closed, escalation]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
  if (child.exitCode === null && child.signalCode === null) {
    await closed;
  }
}

async function reclaim(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  // Give the process a short interval to finish its startup boundary before
  // signaling; this keeps the clean-shutdown assertion deterministic.
  await sleep(500);
  await terminate(child, 10_000);
}

// Spawned Workers open the `contentos-fetcher` BullMQ queue, and their
// production shutdown deliberately preserves queue data, so this isolated run
// owns the Redis cleanup. Verify no owned queue key survives any test here
// (redis.test.ts asserts the database holds zero keys).
afterEach(async () => {
  await cleanupOwnedFetcherQueue(requireState());
});

describe('process lifecycle', () => {
  for (const service of SERVICES) {
    it(`${service} emits process.started, then process.stopping on SIGTERM, and exits 0`, async () => {
      const state = requireState();
      const appDir = join(state.repoRoot, 'apps', service);
      const credentials = readComposeCredentials(state.envFile);
      const serviceEnv =
        service === 'worker'
          ? {
              ...process.env,
              CONTENTOS_ENV: 'test',
              DATABASE_URL: `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`,
              REDIS_URL: `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`,
            }
          : service === 'fetcher'
            ? {
                ...process.env,
                CONTENTOS_ENV: 'test',
                CONTENTOS_FETCHER_GATEWAY_SECRET: credentials.CONTENTOS_FETCHER_GATEWAY_SECRET,
                CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: state.apiOrigin,
                CONTENTOS_FETCHER_REDIS_URL: `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`,
                CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${state.ports.objectStorage}`,
                CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET: state.objectStorageBucket,
                CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY: credentials.OBJECT_STORAGE_ACCESS_KEY,
                CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY: credentials.OBJECT_STORAGE_SECRET_KEY,
              }
            : process.env;
      const child = spawn(process.execPath, [join(appDir, 'dist', 'main.js')], {
        cwd: appDir,
        env: serviceEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const records: LifecycleRecord[] = [];
      let stdout = '';
      let stderr = '';
      const parser = createLineParser((record) => {
        records.push(record);
      });

      let resolveStarted!: () => void;
      let rejectStarted!: (error: Error) => void;
      const started = new Promise<void>((resolve, reject) => {
        resolveStarted = resolve;
        rejectStarted = reject;
      });
      let startedTimer: NodeJS.Timeout | undefined = setTimeout(
        () =>
          rejectStarted(
            new Error(`${service} did not emit process.started within 15s\nstdout=${stdout}\nstderr=${stderr}`),
          ),
        15_000,
      );

      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk: string) => {
        stdout += chunk;
        parser.push(chunk);
        if (
          startedTimer &&
          records.some((record) => record.event === 'process.started' && record.service === service)
        ) {
          clearTimeout(startedTimer);
          startedTimer = undefined;
          resolveStarted();
        }
      });
      child.stderr?.on('data', (chunk: string) => {
        stderr += chunk;
      });

      const exitCode = new Promise<number>((resolve) => {
        child.once('close', (code) => resolve(code ?? -1));
      });

      try {
        await started;
        await reclaim(child);
        const code = await exitCode;

        const events = records.map((record) => record.event ?? '<none>');
        const diag = `${service} exit=${code} events=${JSON.stringify(events)} stdout=${stdout.trim()} stderr=${stderr.trim()}`;
        expect(
          records.some((record) => record.event === 'process.stopping' && record.service === service),
          diag,
        ).toBe(true);
        expect(code, diag).toBe(0);
      } finally {
        if (startedTimer) {
          clearTimeout(startedTimer);
        }
        // Guarantee no child is left running on any exit path (startup
        // timeout, SIGTERM timeout, parse failure, or assertion failure).
        if (child.exitCode === null && child.signalCode === null) {
          await reclaim(child);
        }
        parser.flush();
      }
    });
  }
});

describe('worker startup failure lifecycle', () => {
  it('fails the first dispatcher pass safely without process.started', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const database = `m2wf003a_${randomUUID().replaceAll('-', '')}`;
    const maintenance = new Client({
      host: '127.0.0.1',
      port: state.ports.postgres,
      user: 'smoke_user',
      password: credentials.POSTGRES_PASSWORD ?? '',
      database: 'postgres',
    });
    await maintenance.connect();
    try {
      await maintenance.query(`CREATE DATABASE ${quoteDatabase(database)}`);
    } finally {
      await maintenance.end();
    }

    const databaseUrl = `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/${database}`;
    const redisUrl = `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`;
    const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
      cwd: join(state.repoRoot, 'apps', 'worker'),
      env: {
        ...process.env,
        CONTENTOS_ENV: 'test',
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    try {
      const exitCode = await waitForExit(child, 15_000);
      const records = stdout
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as LifecycleRecord & { errorCode?: string });
      expect(exitCode).not.toBe(0);
      expect(records).toContainEqual({
        level: 'info',
        service: 'worker',
        event: 'process.start_failed',
        errorCode: 'dependency_unavailable',
      });
      expect(records.some((record) => record.event === 'process.started')).toBe(false);
      expect(`${stdout}\n${stderr}`).not.toContain(databaseUrl);
      expect(`${stdout}\n${stderr}`).not.toContain(credentials.POSTGRES_PASSWORD ?? '');
      expect(`${stdout}\n${stderr}`).not.toContain('stack');
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await new Promise<void>((resolve) => child.once('close', () => resolve()));
      }
      const cleanup = new Client({
        host: '127.0.0.1',
        port: state.ports.postgres,
        user: 'smoke_user',
        password: credentials.POSTGRES_PASSWORD ?? '',
        database: 'postgres',
      });
      try {
        await cleanup.connect();
        await cleanup.query(`DROP DATABASE ${quoteDatabase(database)}`);
      } finally {
        await cleanup.end();
      }
    }
  });

  it('survives an asynchronous Redis transport error without raw diagnostics and shuts down cleanly', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const redisProxy = await startTcpProxy(state.ports.redis);
    const databaseUrl = workerDatabaseUrl(state.ports.postgres, credentials);
    const redisUrl = workerRedisUrl(redisProxy.port, credentials);
    const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
      cwd: join(state.repoRoot, 'apps', 'worker'),
      env: {
        ...process.env,
        CONTENTOS_ENV: 'test',
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const records: LifecycleRecord[] = [];
    const parser = createLineParser((record) => records.push(record));
    let resolveStarted!: () => void;
    let rejectStarted!: (error: Error) => void;
    const started = new Promise<void>((resolve, reject) => {
      resolveStarted = resolve;
      rejectStarted = reject;
    });
    const timer = setTimeout(() => rejectStarted(new Error('worker did not start through the Redis proxy')), 15_000);
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
      parser.push(chunk);
      if (records.some((record) => record.event === 'process.started')) resolveStarted();
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    try {
      await started;
      clearTimeout(timer);
      redisProxy.dropConnections();
      await sleep(750);
      await terminate(child, 10_000);
      expect(child.exitCode).toBe(0);
      expect(records.some((record) => record.event === 'process.started')).toBe(true);
      expect(records.some((record) => record.event === 'process.stopping')).toBe(true);
      expect(`${stdout}\n${stderr}`).not.toContain(redisUrl);
      expect(`${stdout}\n${stderr}`).not.toContain(credentials.REDIS_PASSWORD ?? '');
      expect(`${stdout}\n${stderr}`).not.toContain('stack');
      expect(stderr).toBe('');
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) await terminate(child, 10_000);
      parser.flush();
      await redisProxy.close();
    }
  });

  it('survives an asynchronous PostgreSQL idle-client error without raw diagnostics and shuts down cleanly', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const databaseProxy = await startTcpProxy(state.ports.postgres);
    const databaseUrl = workerDatabaseUrl(databaseProxy.port, credentials);
    const redisUrl = workerRedisUrl(state.ports.redis, credentials);
    const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
      cwd: join(state.repoRoot, 'apps', 'worker'),
      env: {
        ...process.env,
        CONTENTOS_ENV: 'test',
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const records: LifecycleRecord[] = [];
    const parser = createLineParser((record) => records.push(record));
    let resolveStarted!: () => void;
    let rejectStarted!: (error: Error) => void;
    const started = new Promise<void>((resolve, reject) => {
      resolveStarted = resolve;
      rejectStarted = reject;
    });
    const timer = setTimeout(
      () => rejectStarted(new Error('worker did not start through the PostgreSQL proxy')),
      15_000,
    );
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
      parser.push(chunk);
      if (records.some((record) => record.event === 'process.started')) resolveStarted();
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    try {
      await started;
      clearTimeout(timer);
      databaseProxy.dropConnections();
      await sleep(750);
      await terminate(child, 10_000);
      expect(child.exitCode).toBe(0);
      expect(records.some((record) => record.event === 'process.started')).toBe(true);
      expect(records.some((record) => record.event === 'process.stopping')).toBe(true);
      expect(`${stdout}\n${stderr}`).not.toContain(databaseUrl);
      expect(`${stdout}\n${stderr}`).not.toContain(credentials.POSTGRES_PASSWORD ?? '');
      expect(`${stdout}\n${stderr}`).not.toContain('stack');
      expect(stderr).toBe('');
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) await terminate(child, 10_000);
      parser.flush();
      await databaseProxy.close();
    }
  });
});

describe('Fetcher startup configuration boundary', () => {
  it('fails non-zero with a redacted configuration error and no lifecycle start', async () => {
    const state = requireState();
    const marker = 'fetcher-secret-marker-must-not-appear';
    const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'fetcher', 'dist', 'main.js')], {
      cwd: join(state.repoRoot, 'apps', 'fetcher'),
      env: {
        ...process.env,
        CONTENTOS_ENV: 'test',
        CONTENTOS_FETCHER_GATEWAY_SECRET: marker,
        CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: 'http://localhost:3001',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });
    const code = await waitForExit(child, 15_000);
    expect(code).not.toBe(0);
    expect(stdout).not.toContain('process.started');
    expect(stderr).toContain('CONTENTOS_FETCHER_GATEWAY_SECRET');
    expect(stderr).not.toContain(marker);
  });

  it('exits non-zero on a private Gateway identity failure without logging sensitive details', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const secretMarker = 'P'.repeat(43);
    const responseMarker = 'gateway-private-response-marker';
    const gateway = createServer((socket) => {
      socket.once('data', () => {
        const body = JSON.stringify({ error: { code: 'FETCHER_GATEWAY_UNAUTHENTICATED', marker: responseMarker } });
        socket.end(
          `HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
        );
      });
    });
    await new Promise<void>((resolve, reject) => {
      gateway.once('error', reject);
      gateway.listen(0, '127.0.0.1', resolve);
    });
    const address = gateway.address();
    if (address === null || typeof address === 'string') throw new Error('gateway lifecycle fixture did not bind');
    const gatewayOrigin = `http://127.0.0.1:${address.port}`;
    const queue = new Queue('contentos-fetcher', {
      connection: {
        url: `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`,
      },
    });
    const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'fetcher', 'dist', 'main.js')], {
      cwd: join(state.repoRoot, 'apps', 'fetcher'),
      env: {
        ...process.env,
        CONTENTOS_ENV: 'test',
        CONTENTOS_FETCHER_GATEWAY_SECRET: secretMarker,
        CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: gatewayOrigin,
        CONTENTOS_FETCHER_REDIS_URL: `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`,
        CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${state.ports.objectStorage}`,
        CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET: state.objectStorageBucket,
        CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY: credentials.OBJECT_STORAGE_ACCESS_KEY,
        CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY: credentials.OBJECT_STORAGE_SECRET_KEY,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });
    try {
      const startedDeadline = Date.now() + 15_000;
      while (!stdout.includes('process.started') && Date.now() < startedDeadline) await sleep(50);
      expect(stdout).toContain('process.started');
      const taskId = randomUUID();
      await queue.add(
        FETCHER_JOB_NAME,
        { taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        {
          jobId: buildFetcherTaskJobId(taskId, 1),
          attempts: FETCHER_JOB_ATTEMPTS,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      const exitCode = await waitForExit(child, 15_000);
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain('gateway_protocol_failure');
      expect(stdout).toContain('process.stopping');
      expect(`${stdout}\n${stderr}`).not.toContain(secretMarker);
      expect(`${stdout}\n${stderr}`).not.toContain(responseMarker);
      expect(`${stdout}\n${stderr}`).not.toContain(gatewayOrigin);
      expect(`${stdout}\n${stderr}`).not.toContain('stack');
      expect(stderr).toBe('');
    } finally {
      if (child.exitCode === null && child.signalCode === null) await terminate(child, 10_000);
      await queue.close();
      await new Promise<void>((resolve) => gateway.close(() => resolve()));
    }
  });
});
