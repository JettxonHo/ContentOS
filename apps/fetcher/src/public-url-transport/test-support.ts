import type { PublicUrlTransport } from './index.js';
import { createCaptureBudget } from './budget.js';
import type { PublicAddress } from './address-policy.js';
import type { PublicUrlTransportTestProviders } from './providers.js';
import { createNodeResolverForTesting } from './providers.js';
import { assertProxyPolicy, createTestTransport } from './transport.js';

export { createNodeResolverForTesting };

export function createPublicUrlTransportForTesting(
  providers: PublicUrlTransportTestProviders = {},
): PublicUrlTransport {
  return createTestTransport(providers);
}

export function assertProxyPolicyForTesting(input: {
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly execArgv?: readonly string[];
}): void {
  assertProxyPolicy(input.environment ?? {}, input.execArgv ?? []);
}

export async function resolveWithNodeResolverForTesting(
  servers: readonly string[],
  hostname: string,
): Promise<readonly PublicAddress[]> {
  const budget = createCaptureBudget();
  try {
    return await createNodeResolverForTesting(servers).resolve(hostname, budget);
  } finally {
    budget.finish();
  }
}
