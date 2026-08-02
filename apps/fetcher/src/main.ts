interface FetcherConfigurationModule {
  loadFetcherConfig(env: NodeJS.ProcessEnv): { readonly gatewaySecret: string; readonly apiOrigin: string };
}

const SERVICE = 'fetcher' as const;
const CONFIGURATION_KEYS = new Set([
  'CONTENTOS_ENV',
  'CONTENTOS_FETCHER_GATEWAY_SECRET',
  'CONTENTOS_FETCHER_GATEWAY_API_ORIGIN',
]);

async function loadConfiguration(): Promise<void> {
  // The Fetcher package intentionally has no runtime dependency edge beyond
  // its existing skeleton boundary. The workspace build produces config first;
  // load the shared validator from that generated package artifact.
  const modulePath = new URL('../../../packages/config/dist/index.js', import.meta.url).href;
  const configuration = (await import(modulePath)) as FetcherConfigurationModule;
  configuration.loadFetcherConfig(process.env);
}

function safeConfigurationKey(error: unknown): string {
  if (error && typeof error === 'object' && 'key' in error) {
    const key = (error as { key?: unknown }).key;
    if (typeof key === 'string' && CONFIGURATION_KEYS.has(key)) return key;
  }
  return 'Fetcher configuration';
}

async function run(): Promise<void> {
  try {
    await loadConfiguration();
  } catch (error) {
    process.stderr.write(`Fetcher configuration invalid for ${safeConfigurationKey(error)}.\n`);
    process.exitCode = 1;
    return;
  }

  const keepAlive = setInterval((): void => undefined, 60_000);
  console.log(JSON.stringify({ level: 'info', service: SERVICE, event: 'process.started' }));

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(JSON.stringify({ level: 'info', service: SERVICE, event: 'process.stopping', signal }));
    clearInterval(keepAlive);
  };

  process.once('SIGINT', (): void => shutdown('SIGINT'));
  process.once('SIGTERM', (): void => shutdown('SIGTERM'));
}

void run();
