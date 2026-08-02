import { describe, expect, it } from 'vitest';

import {
  FETCHER_GATEWAY_CONNECTION_POLICY_VERSION,
  FETCHER_GATEWAY_RESOURCE_POLICY_VERSION,
  FetcherGatewayApplicationError,
  FetcherGatewayService,
  defineFetcherGatewayClaimResponse,
  hashFetcherGatewayClaim,
} from './fetcher-gateway.js';

const taskId = '00000000-0000-4000-8000-000000000001' as never;
const now = new Date('2026-08-02T00:00:00.000Z');
const opaqueClaim = 'A'.repeat(43);

describe('Fetcher Gateway Core contract', () => {
  it('hashes only the opaque claim and preserves the fixed policy identifiers', () => {
    expect(hashFetcherGatewayClaim(opaqueClaim)).toMatch(/^[0-9a-f]{64}$/);
    const response = defineFetcherGatewayClaimResponse({
      taskId,
      taskKind: 'url_capture',
      submittedUrl: 'https://example.com/article',
      connectionPolicyVersion: FETCHER_GATEWAY_CONNECTION_POLICY_VERSION,
      resourcePolicyVersion: FETCHER_GATEWAY_RESOURCE_POLICY_VERSION,
      attemptNumber: 1,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
      claim: opaqueClaim,
    });
    expect(response.connectionPolicyVersion).toBe('public-url-connection/v1');
    expect(response.resourcePolicyVersion).toBe('public-url-resource/v1');
    expect(JSON.stringify(response)).toContain(opaqueClaim);
  });

  it('returns generic unavailable errors for rejected claim and malformed heartbeat input', async () => {
    const repository = {
      claimTask: async (): Promise<null> => null,
      heartbeatTask: async (): Promise<null> => null,
    };
    const service = new FetcherGatewayService(repository, { generate: () => opaqueClaim }, { now: () => now });
    await expect(service.claim(taskId)).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_TASK_UNAVAILABLE'));
    await expect(service.heartbeat(taskId, 'short')).rejects.toEqual(
      new FetcherGatewayApplicationError('FETCHER_CLAIM_UNAVAILABLE'),
    );
  });

  it('produces one bounded claim response from an eligible repository record', async () => {
    const repository = {
      claimTask: async (input: { claimHash: string; now: Date }) => {
        expect(input.claimHash).toMatch(/^[0-9a-f]{64}$/);
        expect(input.now).toEqual(now);
        return {
          taskId,
          taskKind: 'url_capture' as const,
          submittedUrl: 'https://example.com/private',
          attemptNumber: 1,
          leaseExpiresAt: new Date(now.getTime() + 60_000),
        };
      },
      heartbeatTask: async (): Promise<null> => null,
    };
    const result = await new FetcherGatewayService(
      repository,
      { generate: () => opaqueClaim },
      { now: () => now },
    ).claim(taskId);
    expect(result).toMatchObject({
      taskId,
      taskKind: 'url_capture',
      attemptNumber: 1,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
      claim: opaqueClaim,
    });
  });
});
