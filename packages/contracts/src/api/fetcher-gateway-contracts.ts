import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';

import type { PortableJsonSchema } from './error-contract.js';

export const FETCHER_GATEWAY_SECRET_HEADER = 'x-contentos-fetcher-gateway-secret' as const;
export const FETCHER_GATEWAY_CLAIM_HEADER = 'x-contentos-fetcher-claim' as const;
export const FETCHER_GATEWAY_DELIVERY_GENERATION_HEADER = 'x-contentos-fetcher-delivery-generation' as const;
export const FETCHER_GATEWAY_UNAUTHENTICATED = 'FETCHER_GATEWAY_UNAUTHENTICATED' as const;
export const INVALID_GATEWAY_REQUEST = 'INVALID_GATEWAY_REQUEST' as const;
export const FETCHER_TASK_UNAVAILABLE = 'FETCHER_TASK_UNAVAILABLE' as const;
export const FETCHER_CLAIM_UNAVAILABLE = 'FETCHER_CLAIM_UNAVAILABLE' as const;
export const FETCHER_RESULT_UNAVAILABLE = 'FETCHER_RESULT_UNAVAILABLE' as const;
export type FetcherGatewayErrorCode =
  | typeof FETCHER_GATEWAY_UNAUTHENTICATED
  | typeof INVALID_GATEWAY_REQUEST
  | typeof FETCHER_TASK_UNAVAILABLE
  | typeof FETCHER_CLAIM_UNAVAILABLE
  | typeof FETCHER_RESULT_UNAVAILABLE;

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

/**
 * Terminal Result DTO classification. `success` is the only non-failure value;
 * the remaining ten are the full failure category set (seven Fetcher-supplied
 * plus three server-derived). `safe_code` is never part of this DTO.
 */
export const FETCHER_RESULT_CATEGORIES_DTO = [
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
] as const;
export type FetcherResultCategoryDto = (typeof FETCHER_RESULT_CATEGORIES_DTO)[number];

export interface FetcherGatewayResultResource {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly taskState: 'succeeded' | 'failed';
  readonly resultCategory: FetcherResultCategoryDto;
  readonly sourceId: string | null;
  readonly duplicate: boolean;
}

export interface FetcherGatewayResultResponse {
  readonly data: FetcherGatewayResultResource;
}

export const fetcherGatewayResultResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['taskId', 'attemptNumber', 'taskState', 'resultCategory', 'sourceId', 'duplicate'],
      properties: {
        taskId: { type: 'string', pattern: UUID_PATTERN },
        attemptNumber: { type: 'integer', minimum: 1 },
        taskState: { type: 'string', enum: ['succeeded', 'failed'] },
        resultCategory: { type: 'string', enum: [...FETCHER_RESULT_CATEGORIES_DTO] },
        sourceId: { anyOf: [{ type: 'string', pattern: UUID_PATTERN }, { type: 'null' }] },
        duplicate: { enum: [true, false] },
      },
    },
  },
};

export class FetcherGatewayContractError extends Error {
  constructor() {
    super('invalid_fetcher_gateway_response');
    this.name = 'FetcherGatewayContractError';
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateClaim = ajv.compile<FetcherGatewayClaimResponse>(
  fetcherGatewayClaimResponseSchema,
) as ValidateFunction<FetcherGatewayClaimResponse>;
const validateHeartbeat = ajv.compile<FetcherGatewayHeartbeatResponse>(
  fetcherGatewayHeartbeatResponseSchema,
) as ValidateFunction<FetcherGatewayHeartbeatResponse>;
const validateResult = ajv.compile<FetcherGatewayResultResponse>(
  fetcherGatewayResultResponseSchema,
) as ValidateFunction<FetcherGatewayResultResponse>;

function parse<T>(value: unknown, validate: ValidateFunction<T>): T {
  if (!validate(value)) throw new FetcherGatewayContractError();
  return value;
}

export function parseFetcherGatewayClaimResponse(value: unknown): FetcherGatewayClaimResponse {
  return parse(value, validateClaim);
}

export function parseFetcherGatewayHeartbeatResponse(value: unknown): FetcherGatewayHeartbeatResponse {
  return parse(value, validateHeartbeat);
}

export function parseFetcherGatewayResultResponse(value: unknown): FetcherGatewayResultResponse {
  return parse(value, validateResult);
}

export function isFetcherGatewayBodyAbsent(body: unknown): body is undefined {
  return body === undefined;
}
