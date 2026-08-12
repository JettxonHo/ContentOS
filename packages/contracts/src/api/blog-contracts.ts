import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export type ContentModeDto = 'creator_led' | 'research_based';

export interface BlogBodyDto {
  readonly title: string;
  readonly summary: string;
  readonly markdown: string;
  readonly contentMode: ContentModeDto;
  readonly publicReferences: readonly { readonly label: string; readonly sourceVersionId: string }[];
  readonly internalProvenance: readonly {
    readonly researchItemId: string;
    readonly sourceVersionIds: readonly string[];
    readonly opinionVersionId: string | null;
  }[];
}

export interface OpinionResource {
  readonly question: string;
  readonly rawResponse: string;
  readonly interpretation: string;
  readonly revision: number;
  readonly confirmedVersionId: string | null;
  readonly confirmedStatement: string | null;
  readonly researchVersionId: string;
  readonly outdated: boolean;
}

export interface BlogResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly workingCopy: {
    readonly revision: number;
    readonly checkpointedRevision: number | null;
    readonly body: BlogBodyDto;
  };
  readonly latestVersion: {
    readonly id: string;
    readonly versionNumber: number;
    readonly body: BlogBodyDto;
    readonly researchVersionId: string;
    readonly opinionVersionId: string | null;
    readonly createdAt: string;
  };
  readonly approvedVersionId: string | null;
  readonly approvalValidationSummary: {
    readonly schemaVersion: 'blog-validation/v1';
    readonly result: 'passed';
    readonly contentMode: ContentModeDto;
    readonly referenceCount: number;
    readonly provenanceCount: number;
    readonly warningAcknowledgements: readonly string[];
  } | null;
}

export interface OpinionResponse {
  readonly data: { readonly opinion: OpinionResource | null };
}
export interface BlogResponse {
  readonly data: { readonly blog: BlogResource };
}
export interface InterpretOpinionRequest {
  readonly rawResponse: string;
}
export interface ConfirmOpinionRequest {
  readonly expectedRevision: number;
  readonly confirmedStatement: string;
}
export interface GenerateBlogRequest {
  readonly requestId: string;
  readonly contentMode: ContentModeDto;
}
export interface EditBlogRequest {
  readonly expectedRevision: number;
  readonly body: BlogBodyDto;
}
export interface CheckpointBlogRequest {
  readonly expectedRevision: number;
}
export interface ApproveBlogRequest {
  readonly versionId: string;
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const nonempty = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim() !== '' && value.length <= max;
type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] };
const fail = (): Result<never> => ({ ok: false, errors: [{ path: '/', keyword: 'schema' }] });

export function parseInterpretOpinionRequest(value: unknown): Result<InterpretOpinionRequest> {
  return object(value) && Object.keys(value).length === 1 && nonempty(value.rawResponse, 10_000)
    ? { ok: true, value: value as unknown as InterpretOpinionRequest }
    : fail();
}
export function parseConfirmOpinionRequest(value: unknown): Result<ConfirmOpinionRequest> {
  return object(value) &&
    Object.keys(value).length === 2 &&
    Number.isInteger(value.expectedRevision) &&
    Number(value.expectedRevision) >= 1 &&
    nonempty(value.confirmedStatement, 10_000)
    ? { ok: true, value: value as unknown as ConfirmOpinionRequest }
    : fail();
}
export function parseGenerateBlogRequest(value: unknown): Result<GenerateBlogRequest> {
  return object(value) &&
    Object.keys(value).length === 2 &&
    uuid(value.requestId) &&
    (value.contentMode === 'creator_led' || value.contentMode === 'research_based')
    ? { ok: true, value: value as unknown as GenerateBlogRequest }
    : fail();
}
export function parseEditBlogRequest(value: unknown): Result<EditBlogRequest> {
  return object(value) &&
    Object.keys(value).length === 2 &&
    Number.isInteger(value.expectedRevision) &&
    Number(value.expectedRevision) >= 1 &&
    object(value.body)
    ? { ok: true, value: value as unknown as EditBlogRequest }
    : fail();
}
export function parseCheckpointBlogRequest(value: unknown): Result<CheckpointBlogRequest> {
  return object(value) &&
    Object.keys(value).length === 1 &&
    Number.isInteger(value.expectedRevision) &&
    Number(value.expectedRevision) >= 1
    ? { ok: true, value: value as unknown as CheckpointBlogRequest }
    : fail();
}
export function parseApproveBlogRequest(value: unknown): Result<ApproveBlogRequest> {
  return object(value) && Object.keys(value).length === 1 && uuid(value.versionId)
    ? { ok: true, value: value as unknown as ApproveBlogRequest }
    : fail();
}

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
const nullableUuid: PortableJsonSchema = { anyOf: [{ type: 'string', pattern: UUID_PATTERN }, { type: 'null' }] };
const blogBodySchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'markdown', 'contentMode', 'publicReferences', 'internalProvenance'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    summary: { type: 'string', minLength: 1, maxLength: 1000 },
    markdown: { type: 'string', minLength: 1, maxLength: 50_000 },
    contentMode: { type: 'string', enum: ['creator_led', 'research_based'] },
    publicReferences: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'sourceVersionId'],
        properties: {
          label: { type: 'string', minLength: 1, maxLength: 200 },
          sourceVersionId: { type: 'string', pattern: UUID_PATTERN },
        },
      },
    },
    internalProvenance: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['researchItemId', 'sourceVersionIds', 'opinionVersionId'],
        properties: {
          researchItemId: { type: 'string', minLength: 1, maxLength: 100 },
          sourceVersionIds: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: { type: 'string', pattern: UUID_PATTERN },
          },
          opinionVersionId: nullableUuid,
        },
      },
    },
  },
};
export const interpretOpinionRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['rawResponse'],
  properties: { rawResponse: { type: 'string', minLength: 1, maxLength: 10_000 } },
};
export const confirmOpinionRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision', 'confirmedStatement'],
  properties: {
    expectedRevision: { type: 'integer', minimum: 1 },
    confirmedStatement: { type: 'string', minLength: 1, maxLength: 10_000 },
  },
};
export const generateBlogRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['requestId', 'contentMode'],
  properties: {
    requestId: { type: 'string', pattern: UUID_PATTERN },
    contentMode: { type: 'string', enum: ['creator_led', 'research_based'] },
  },
};
export const editBlogRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision', 'body'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 }, body: blogBodySchema },
};
export const checkpointBlogRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 } },
};
export const approveBlogRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['versionId'],
  properties: { versionId: { type: 'string', pattern: UUID_PATTERN } },
};
const opinionResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'question',
    'rawResponse',
    'interpretation',
    'revision',
    'confirmedVersionId',
    'confirmedStatement',
    'researchVersionId',
    'outdated',
  ],
  properties: {
    question: { type: 'string' },
    rawResponse: { type: 'string' },
    interpretation: { type: 'string' },
    revision: { type: 'integer', minimum: 1 },
    confirmedVersionId: nullableUuid,
    confirmedStatement: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    researchVersionId: { type: 'string', pattern: UUID_PATTERN },
    outdated: { type: 'boolean' },
  },
};
export const opinionResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['opinion'],
      properties: { opinion: { anyOf: [opinionResourceSchema, { type: 'null' }] } },
    },
  },
};
const blogVersionSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'versionNumber', 'body', 'researchVersionId', 'opinionVersionId', 'createdAt'],
  properties: {
    id: { type: 'string', pattern: UUID_PATTERN },
    versionNumber: { type: 'integer', minimum: 1 },
    body: blogBodySchema,
    researchVersionId: { type: 'string', pattern: UUID_PATTERN },
    opinionVersionId: nullableUuid,
    createdAt: { type: 'string' },
  },
};
const validationSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'result', 'contentMode', 'referenceCount', 'provenanceCount', 'warningAcknowledgements'],
  properties: {
    schemaVersion: { type: 'string', enum: ['blog-validation/v1'] },
    result: { type: 'string', enum: ['passed'] },
    contentMode: { type: 'string', enum: ['creator_led', 'research_based'] },
    referenceCount: { type: 'integer', minimum: 1, maximum: 6 },
    provenanceCount: { type: 'integer', minimum: 1, maximum: 50 },
    warningAcknowledgements: { type: 'array', maxItems: 0, items: { type: 'string' } },
  },
};
export const blogResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['blog'],
      properties: {
        blog: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'contentPackageId',
            'outdated',
            'reviewCandidateOutdated',
            'workingCopy',
            'latestVersion',
            'approvedVersionId',
            'approvalValidationSummary',
          ],
          properties: {
            id: { type: 'string', pattern: UUID_PATTERN },
            contentPackageId: { type: 'string', pattern: UUID_PATTERN },
            outdated: { type: 'boolean' },
            reviewCandidateOutdated: { type: 'boolean' },
            workingCopy: {
              type: 'object',
              additionalProperties: false,
              required: ['revision', 'checkpointedRevision', 'body'],
              properties: {
                revision: { type: 'integer', minimum: 1 },
                checkpointedRevision: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
                body: blogBodySchema,
              },
            },
            latestVersion: blogVersionSchema,
            approvedVersionId: nullableUuid,
            approvalValidationSummary: { anyOf: [validationSchema, { type: 'null' }] },
          },
        },
      },
    },
  },
};
