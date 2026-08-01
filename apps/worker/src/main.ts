import { loadWorkerConfig, ConfigurationError } from '@contentos/config';
import { createWorkerDatabaseRuntime } from '@contentos/database';
import { pathToFileURL } from 'node:url';

import { OutboxDispatcher, type DispatcherLogger } from './dispatcher.js';
import { BullMQFetcherQueueTransport } from './fetcher-queue.js';

const SERVICE = 'worker' as const;
const POLL_INTERVAL_MS = 500;
const SHUTDOWN_PASS_TIMEOUT_MS = 10_000;

const logger: DispatcherLogger = {
  info(event, fields): void {
    console.log(JSON.stringify({ level: 'info', service: SERVICE, event, ...fields }));
  },
};

async function awaitInFlightPass(promise: Promise<unknown>): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      promise.then(
        () => undefined,
        () => undefined,
      ),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, SHUTDOWN_PASS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface WorkerCloseableResources {
  readonly queue?: { close(): Promise<void> };
  readonly database?: { close(): Promise<void> };
}

export async function closeWorkerResources(resources: WorkerCloseableResources): Promise<boolean> {
  let closeFailed = false;
  for (const resource of [resources.queue, resources.database]) {
    if (!resource) continue;
    try {
      await resource.close();
    } catch {
      closeFailed = true;
    }
  }
  return closeFailed;
}

type StartupErrorCode =
  'configuration_invalid' | 'database_unavailable' | 'redis_unavailable' | 'dependency_unavailable';

function startupErrorCode(error: unknown): StartupErrorCode {
  if (error instanceof ConfigurationError) return 'configuration_invalid';
  if (error && typeof error === 'object' && 'startupCode' in error) {
    const startupCode = (error as { startupCode?: unknown }).startupCode;
    if (startupCode === 'database_unavailable' || startupCode === 'redis_unavailable') return startupCode;
  }
  return 'dependency_unavailable';
}

function dependencyFailure(code: 'database_unavailable' | 'redis_unavailable'): Error {
  return Object.assign(new Error(code), { startupCode: code });
}

function dispatcherPhase(error: unknown): string {
  if (error && typeof error === 'object' && 'dispatcherPhase' in error) {
    const phase = (error as { dispatcherPhase?: unknown }).dispatcherPhase;
    if (phase === 'reconciliation' || phase === 'claim') return phase;
  }
  return 'unknown';
}

async function run(): Promise<void> {
  let database: ReturnType<typeof createWorkerDatabaseRuntime> | undefined;
  let queue: BullMQFetcherQueueTransport | undefined;
  let pollTimer: NodeJS.Timeout | undefined;
  let currentPass: Promise<unknown> | undefined;
  let stopRequested = false;
  let shutdownStarted: Promise<void> | undefined;
  let closeStarted: Promise<boolean> | undefined;
  let shutdownSignal: NodeJS.Signals | undefined;
  let processStarted = false;
  let resolveStartupFinished!: () => void;
  let startupFinished = false;
  const startupFinishedPromise = new Promise<void>((resolve) => {
    resolveStartupFinished = resolve;
  });
  let resolveShutdown!: () => void;
  const shutdownComplete = new Promise<void>((resolve) => {
    resolveShutdown = resolve;
  });

  const finishStartup = (): void => {
    if (startupFinished) return;
    startupFinished = true;
    resolveStartupFinished();
  };

  const closeResources = (): Promise<boolean> => {
    if (closeStarted) return closeStarted;
    closeStarted = (async () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = undefined;
      const inFlightPass = currentPass;
      currentPass = undefined;
      if (inFlightPass) await awaitInFlightPass(inFlightPass);
      const resources: WorkerCloseableResources = {
        ...(queue ? { queue } : {}),
        ...(database ? { database } : {}),
      };
      queue = undefined;
      database = undefined;
      return closeWorkerResources(resources);
    })();
    return closeStarted;
  };

  const requestShutdown = (signal: NodeJS.Signals): Promise<void> => {
    stopRequested = true;
    shutdownSignal ??= signal;
    if (shutdownStarted) return shutdownStarted;
    shutdownStarted = (async () => {
      await startupFinishedPromise;
      const closeFailed = await closeResources();
      if (closeFailed) {
        logger.info('process.shutdown_failed', { errorCode: 'resource_close_failed' });
        process.exitCode = 1;
      } else if (processStarted) {
        logger.info('process.stopping', { signal: shutdownSignal ?? signal });
      }
      resolveShutdown();
    })();
    return shutdownStarted;
  };

  process.once('SIGINT', () => {
    void requestShutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void requestShutdown('SIGTERM');
  });

  try {
    const config = loadWorkerConfig(process.env);
    database = createWorkerDatabaseRuntime(config.databaseUrl);
    queue = new BullMQFetcherQueueTransport(config.redisUrl);
    try {
      await database.ready();
    } catch {
      throw dependencyFailure('database_unavailable');
    }
    try {
      await queue.ready();
    } catch {
      throw dependencyFailure('redis_unavailable');
    }
    const dispatcher = new OutboxDispatcher(database.workflowDispatch, queue, { now: () => new Date() }, logger);
    currentPass = dispatcher.runPass();
    await currentPass;
    currentPass = undefined;
    finishStartup();
    if (stopRequested) {
      await requestShutdown(shutdownSignal ?? 'SIGTERM');
      return;
    }

    logger.info('process.started', {});
    processStarted = true;
    pollTimer = setInterval(() => {
      if (stopRequested || currentPass) return;
      currentPass = dispatcher
        .runPass()
        .catch((error: unknown) => {
          logger.info('dispatcher.unavailable', {
            errorCode: 'dependency_unavailable',
            phase: dispatcherPhase(error),
          });
        })
        .finally(() => {
          currentPass = undefined;
        });
    }, POLL_INTERVAL_MS);
    await shutdownComplete;
  } catch (error) {
    finishStartup();
    if (shutdownStarted) {
      await shutdownStarted;
    } else if (await closeResources()) {
      logger.info('process.shutdown_failed', { errorCode: 'resource_close_failed' });
    }
    logger.info('process.start_failed', { errorCode: startupErrorCode(error) });
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void run();
}
