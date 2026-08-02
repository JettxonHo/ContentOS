import { describe, expect, it } from 'vitest';

import {
  FETCHER_GATEWAY_CLAIM_HEADER,
  FETCHER_GATEWAY_SECRET_HEADER,
  fetcherGatewayClaimResponseSchema,
  fetcherGatewayHeartbeatResponseSchema,
  isFetcherGatewayBodyAbsent,
} from './fetcher-gateway-contracts.js';

describe('Fetcher Gateway HTTP contracts', () => {
  it('keeps the private headers and body boundary exact', () => {
    expect(FETCHER_GATEWAY_SECRET_HEADER).toBe('x-contentos-fetcher-gateway-secret');
    expect(FETCHER_GATEWAY_CLAIM_HEADER).toBe('x-contentos-fetcher-claim');
    expect(isFetcherGatewayBodyAbsent(undefined)).toBe(true);
    expect(isFetcherGatewayBodyAbsent(null)).toBe(false);
    expect(isFetcherGatewayBodyAbsent({})).toBe(false);
  });

  it('requires exact Claim and Heartbeat response fields', () => {
    expect(fetcherGatewayClaimResponseSchema).toMatchObject({
      additionalProperties: false,
      required: ['data'],
    });
    expect(fetcherGatewayHeartbeatResponseSchema).toMatchObject({
      additionalProperties: false,
      required: ['data'],
    });
    expect(fetcherGatewayClaimResponseSchema.properties?.data).toMatchObject({
      additionalProperties: false,
      required: [
        'taskId',
        'taskKind',
        'submittedUrl',
        'connectionPolicyVersion',
        'resourcePolicyVersion',
        'attemptNumber',
        'leaseExpiresAt',
        'claim',
      ],
    });
    expect(fetcherGatewayHeartbeatResponseSchema.properties?.data).toMatchObject({
      additionalProperties: false,
      required: ['taskId', 'attemptNumber', 'leaseExpiresAt', 'renewed'],
    });
    expect(fetcherGatewayClaimResponseSchema.properties?.data?.properties).not.toHaveProperty('claim.claim');
    expect(fetcherGatewayHeartbeatResponseSchema.properties?.data?.properties).not.toHaveProperty('heartbeat');
    expect(JSON.stringify(fetcherGatewayClaimResponseSchema)).toContain('connectionPolicyVersion');
    expect(JSON.stringify(fetcherGatewayClaimResponseSchema)).toContain('resourcePolicyVersion');
    expect(JSON.stringify(fetcherGatewayClaimResponseSchema)).toContain('claim');
    expect(JSON.stringify(fetcherGatewayHeartbeatResponseSchema)).toContain('renewed');
  });
});
