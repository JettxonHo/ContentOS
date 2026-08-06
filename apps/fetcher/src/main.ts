import { loadFetcherConfig, ConfigurationError } from '@contentos/config';
import { FetcherS3SnapshotStore } from '@contentos/object-storage';
import { pathToFileURL } from 'node:url';

import { FetcherGatewayClientError, NodeFetcherGatewayClient } from './fetcher-gateway-client.js';
import { createFetcherOrchestrator } from './fetcher-orchestrator.js';
import { createFetcherQueueConsumer, type FetcherQueueConsumer } from './fetcher-queue.js';
import { shutdownFetcherResources } from './fetcher-shutdown.js';
import { createPublicUrlTransport } from './public-url-transport/index.js';

const SERVICE = 'fetcher' as const;

function log(event: string, fields: Record<string, string> = {}): void {
  console.log(JSON.stringify({ level: 'info', service: SERVICE, event, ...fields }));
}

function safeConfigurationKey(error: unknown): string {
  if (error instanceof ConfigurationError) return error.key;
  return 'Fetcher configuration';
}

export async function run(): Promise<void> {
  let queue: FetcherQueueConsumer | undefined;
  let snapshots: FetcherS3SnapshotStore | undefined;
  let gateway: NodeFetcherGatewayClient | undefined;
  let shutdown: Promise<void> | undefined;
  let started = false;
  let resolveShutdownComplete!: () => void;
  const shutdownComplete = new Promise<void>((resolve) => {
    resolveShutdownComplete = resolve;
  });
  const requestShutdown = (signal: NodeJS.Signals): Promise<void> => {
    shutdown ??= (async () => {
      log('process.stopping', { signal });
      try {
        const outcome = await shutdownFetcherResources({ queue, gateway, snapshots });
        if (outcome !== 'clean') {
          log('process.shutdown_failed', { errorCode: outcome });
          process.exitCode = 1;
        }
      } catch {
        log('process.shutdown_failed', { errorCode: 'resource_close_failed' });
        process.exitCode = 1;
      } finally {
        resolveShutdownComplete();
      }
    })();
    return shutdown;
  };
  process.once('SIGINT', () => void requestShutdown('SIGINT'));
  process.once('SIGTERM', () => void requestShutdown('SIGTERM'));

  try {
    const config = loadFetcherConfig(process.env);
    snapshots = new FetcherS3SnapshotStore(config.snapshot);
    gateway = new NodeFetcherGatewayClient(config.apiOrigin, config.gatewaySecret);
    const orchestrator = createFetcherOrchestrator({
      gateway,
      transport: createPublicUrlTransport(),
      snapshots,
    });
    let unavailable = false;
    queue = createFetcherQueueConsumer(
      config.redisUrl,
      async (job) => {
        try {
          await orchestrator.process(job);
        } catch (error) {
          if (
            error instanceof FetcherGatewayClientError &&
            (error.kind === 'protocol' || error.kind === 'unknown_commit')
          ) {
            log('process.shutdown_failed', {
              errorCode: error.kind === 'unknown_commit' ? 'gateway_result_unknown_commit' : 'gateway_protocol_failure',
            });
            process.exitCode = 1;
            void requestShutdown('SIGTERM');
          }
          throw error;
        }
      },
      () => {
        unavailable = true;
        if (started) {
          log('process.shutdown_failed', { errorCode: 'redis_unavailable' });
          process.exitCode = 1;
          void requestShutdown('SIGTERM');
        }
      },
    );
    await queue.ready();
    if (unavailable) throw new Error('redis_unavailable');
    if (shutdown) {
      await shutdown;
      return;
    }
    started = true;
    log('process.started');
    // Both the signal handler and a later Queue error resolve this owned
    // completion signal. No polling timer is left alive after shutdown.
    await shutdownComplete;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      process.stderr.write(`Fetcher configuration invalid for ${safeConfigurationKey(error)}.\n`);
    } else {
      log('process.start_failed', { errorCode: 'dependency_unavailable' });
    }
    process.exitCode = 1;
    if (queue || gateway || snapshots) await requestShutdown('SIGTERM');
  } finally {
    if (started && shutdown) await shutdown;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void run();
}
