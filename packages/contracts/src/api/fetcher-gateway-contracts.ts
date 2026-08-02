import type { PortableJsonSchema } from './error-contract.js';

export const FETCHER_GATEWAY_SECRET_HEADER = 'x-contentos-fetcher-gateway-secret' as const;
export const FETCHER_GATEWAY_CLAIM_HEADER = 'x-contentos-fetcher-claim' as const;
export const FETCHER_GATEWAY_UNAUTHENTICATED = 'FETCHER_GATEWAY_UNAUTHENTICATED' as const;
export const INVALID_GATEWAY_REQUEST = 'INVALID_GATEWAY_REQUEST' as const;
export const FETCHER_TASK_UNAVAILABLE = 'FETCHER_TASK_UNAVAILABLE' as const;
export const FETCHER_CLAIM_UNAVAILABLE = 'FETCHER_CLAIM_UNAVAILABLE' as const;
export type FetcherGatewayErrorCode =
  | typeof FETCHER_GATEWAY_UNAUTHENTICATED
  | typeof INVALID_GATEWAY_REQUEST
  | typeof FETCHER_TASK_UNAVAILABLE
  | typeof FETCHER_CLAIM_UNAVAILABLE;

export interface FetcherGatewayClaimResource {
  readonly taskId: string;
  readonly taskKind: 'url_capture';
  readonly submittedUrl: string;
  readonly connectionPolicyVersion: 'public-url-connection/v1';
  readonly resourcePolicyVersion: 'public-url-resource/v1';
  readonly attemptNumber: number;
  readonly leaseExpiresAt: string;
  readonly claim: string;
}

export interface FetcherGatewayClaimResponse {
  readonly data: FetcherGatewayClaimResource;
}

export interface FetcherGatewayHeartbeatResource {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly leaseExpiresAt: string;
  readonly renewed: boolean;
}

export interface FetcherGatewayHeartbeatResponse {
  readonly data: FetcherGatewayHeartbeatResource;
}

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

const fetcherGatewayClaimResourceSchema: PortableJsonSchema = {
  type: 'object',
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
  properties: {
    taskId: { type: 'string', pattern: UUID_PATTERN },
    taskKind: { type: 'string', enum: ['url_capture'] },
    submittedUrl: { type: 'string', minLength: 1, maxLength: 2_048 },
    connectionPolicyVersion: { type: 'string', enum: ['public-url-connection/v1'] },
    resourcePolicyVersion: { type: 'string', enum: ['public-url-resource/v1'] },
    attemptNumber: { type: 'integer', minimum: 1 },
    leaseExpiresAt: { type: 'string', minLength: 1 },
    claim: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' },
  },
};

export const fetcherGatewayClaimResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
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
      properties: fetcherGatewayClaimResourceSchema.properties ?? {},
    },
  },
};

const fetcherGatewayHeartbeatResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['taskId', 'attemptNumber', 'leaseExpiresAt', 'renewed'],
  properties: {
    taskId: { type: 'string', pattern: UUID_PATTERN },
    attemptNumber: { type: 'integer', minimum: 1 },
    leaseExpiresAt: { type: 'string', minLength: 1 },
    renewed: { enum: [true, false] },
  },
};

export const fetcherGatewayHeartbeatResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['taskId', 'attemptNumber', 'leaseExpiresAt', 'renewed'],
      properties: fetcherGatewayHeartbeatResourceSchema.properties ?? {},
    },
  },
};

export function isFetcherGatewayBodyAbsent(body: unknown): body is undefined {
  return body === undefined;
}
