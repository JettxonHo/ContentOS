import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';
import { workflowFailureResourceSchema, type WorkflowFailureResource } from './workflow-query-contracts.js';

export const URL_CAPTURE_ROLES_DTO = ['primary', 'supporting'] as const;
export type UrlCaptureRoleDto = (typeof URL_CAPTURE_ROLES_DTO)[number];

export interface UrlCaptureRequest {
  readonly expectedPackageRevision: number;
  readonly role: UrlCaptureRoleDto;
  readonly submittedUrl: string;
}

export interface UrlCaptureRequestResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly sourceReferenceId: string;
  readonly workflowInstanceId: string;
  readonly workflowNodeId: string;
  readonly taskId: string;
  readonly taskState: 'queued';
  readonly createdAt: string;
}

export interface UrlCaptureRequestResponse {
  readonly data: { readonly urlCaptureRequest: UrlCaptureRequestResource };
}

export interface UrlCaptureIntakeBaseResource {
  readonly id: string;
  readonly role: UrlCaptureRoleDto;
  readonly submittedUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type UrlCaptureIntakeResource =
  | (UrlCaptureIntakeBaseResource & {
      readonly status: 'queued' | 'running';
      readonly failure: null;
      readonly sourceId: null;
    })
  | (UrlCaptureIntakeBaseResource & {
      readonly status: 'failed';
      readonly failure: WorkflowFailureResource;
      readonly sourceId: null;
    })
  | (UrlCaptureIntakeBaseResource & {
      readonly status: 'succeeded';
      readonly failure: null;
      readonly sourceId: string;
    });

export interface UrlCaptureIntakeCollectionResponse {
  readonly data: { readonly items: readonly UrlCaptureIntakeResource[] };
}

export const urlCaptureRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedPackageRevision', 'role', 'submittedUrl'],
  properties: {
    expectedPackageRevision: { type: 'integer', minimum: 1 },
    role: { type: 'string', enum: [...URL_CAPTURE_ROLES_DTO] },
    submittedUrl: { type: 'string', minLength: 1, maxLength: 2_048 },
  },
};

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

const urlCaptureRequestResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'contentPackageId',
    'sourceReferenceId',
    'workflowInstanceId',
    'workflowNodeId',
    'taskId',
    'taskState',
    'createdAt',
  ],
  properties: {
    id: { type: 'string', pattern: UUID_PATTERN },
    contentPackageId: { type: 'string', pattern: UUID_PATTERN },
    sourceReferenceId: { type: 'string', pattern: UUID_PATTERN },
    workflowInstanceId: { type: 'string', pattern: UUID_PATTERN },
    workflowNodeId: { type: 'string', pattern: UUID_PATTERN },
    taskId: { type: 'string', pattern: UUID_PATTERN },
    taskState: { type: 'string', enum: ['queued'] },
    createdAt: { type: 'string' },
  },
};

export const urlCaptureRequestResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['urlCaptureRequest'],
      properties: { urlCaptureRequest: urlCaptureRequestResourceSchema },
    },
  },
};

const urlCaptureIntakeBaseSchema: Record<string, PortableJsonSchema> = {
  id: { type: 'string', pattern: UUID_PATTERN },
  role: { type: 'string', enum: [...URL_CAPTURE_ROLES_DTO] },
  submittedUrl: { type: 'string', minLength: 1, maxLength: 2_048 },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' },
};

const urlCaptureIntakeResourceSchema: PortableJsonSchema = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'role', 'submittedUrl', 'createdAt', 'updatedAt', 'status', 'failure', 'sourceId'],
      properties: {
        ...urlCaptureIntakeBaseSchema,
        status: { type: 'string', enum: ['queued', 'running'] },
        failure: { type: 'null' },
        sourceId: { type: 'null' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'role', 'submittedUrl', 'createdAt', 'updatedAt', 'status', 'failure', 'sourceId'],
      properties: {
        ...urlCaptureIntakeBaseSchema,
        status: { type: 'string', enum: ['failed'] },
        failure: workflowFailureResourceSchema,
        sourceId: { type: 'null' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'role', 'submittedUrl', 'createdAt', 'updatedAt', 'status', 'failure', 'sourceId'],
      properties: {
        ...urlCaptureIntakeBaseSchema,
        status: { type: 'string', enum: ['succeeded'] },
        failure: { type: 'null' },
        sourceId: { type: 'string', pattern: UUID_PATTERN },
      },
    },
  ],
};

export const urlCaptureIntakeCollectionResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['items'],
      properties: { items: { type: 'array', maxItems: 1, items: urlCaptureIntakeResourceSchema } },
    },
  },
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateRequest = ajv.compile<UrlCaptureRequest>(urlCaptureRequestSchema) as ValidateFunction<UrlCaptureRequest>;

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

export function parseUrlCaptureRequest(
  input: unknown,
):
  | { readonly ok: true; readonly value: UrlCaptureRequest }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] } {
  if (validateRequest(input)) return { ok: true, value: input };
  return { ok: false, errors: safeErrors(validateRequest.errors) };
}
