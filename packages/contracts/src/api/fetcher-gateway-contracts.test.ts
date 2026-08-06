import { describe, expect, it } from 'vitest';

import {
  FETCHER_GATEWAY_CLAIM_HEADER,
  FETCHER_GATEWAY_SECRET_HEADER,
  FETCHER_RESULT_CATEGORIES_DTO,
  FETCHER_RESULT_UNAVAILABLE,
  fetcherGatewayClaimResponseSchema,
  fetcherGatewayHeartbeatResponseSchema,
  fetcherGatewayResultResponseSchema,
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

  it('fixes the private Result DTO shape and keeps safe_code out of it', () => {
    expect(FETCHER_RESULT_UNAVAILABLE).toBe('FETCHER_RESULT_UNAVAILABLE');
    expect(fetcherGatewayResultResponseSchema).toMatchObject({
      additionalProperties: false,
      required: ['data'],
    });
    const data = fetcherGatewayResultResponseSchema.properties?.data;
    expect(data).toMatchObject({
      additionalProperties: false,
      required: ['taskId', 'attemptNumber', 'taskState', 'resultCategory', 'sourceId', 'duplicate'],
    });
    // The DTO must not carry safe_code, resultCode, URL, object key, or Claim.
    const serialized = JSON.stringify(fetcherGatewayResultResponseSchema);
    for (const forbidden of [
      'safeCode',
      'resultCode',
      'safe_code',
      'storageKey',
      'claim',
      'submittedUrl',
      'finalUrl',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    // The full ten-category classification surface is present exactly once each.
    expect(FETCHER_RESULT_CATEGORIES_DTO).toEqual([
      'success',
      'fetch_failed',
      'validation_blocked',
      'unsupported_content',
      'too_large',
      'timeout',
      'redirect_blocked',
      'extraction_failed',
      'package_archived',
      'source_role_limit',
      'object_integrity_failed',
    ]);
    const categorySchema = data?.properties?.resultCategory;
    expect(categorySchema?.enum).toEqual([...FETCHER_RESULT_CATEGORIES_DTO]);
  });
});
