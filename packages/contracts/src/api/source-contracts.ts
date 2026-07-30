import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export const SOURCE_TYPES_DTO = ['pasted_text'] as const;
export const SOURCE_ROLES_DTO = ['primary', 'supporting'] as const;

export type SourceTypeDto = (typeof SOURCE_TYPES_DTO)[number];
export type SourceRoleDto = (typeof SOURCE_ROLES_DTO)[number];

export interface CreateSourceRequest {
  readonly sourceType: 'pasted_text';
  readonly role: 'primary' | 'supporting';
  readonly text: string;
  readonly label?: string;
}

export interface EditSourceWorkingCopyRequest {
  readonly expectedRevision: number;
  readonly body: { readonly text: string };
}

export interface CreateSourceVersionRequest {
  readonly expectedRevision: number;
}

export interface ApproveSourceVersionRequest {
  readonly versionId: string;
}

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
// Ajv compiles patterns with the Unicode flag. Supplementary-plane scalar
// values therefore match the negated range while NUL and lone surrogates do
// not. Core repeats this rule before any Object Storage write.
export const WELL_FORMED_SOURCE_TEXT_PATTERN = '^[^\\u0000\\uD800-\\uDFFF]+$';

export interface SourceListQuery {
  readonly limit: number;
  readonly cursor?: string;
}

export interface RawSnapshotResource {
  readonly sha256: string;
  readonly byteSize: number;
  readonly contentType: string;
  readonly capturedAt: string;
}

export interface SourceWorkingCopyResource {
  readonly revision: number;
  readonly schemaVersion: string;
  readonly body: { readonly text: string };
  readonly updatedAt: string;
}

export interface SourceVersionResource {
  readonly id: string;
  readonly versionNumber: number;
  readonly parentVersionId: string | null;
  readonly contentHash: string;
  readonly schemaVersion: string;
  readonly rawSnapshotId: string;
  readonly createdById: string;
  readonly createdAt: string;
}

export interface SourceResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly sourceType: SourceTypeDto;
  readonly role: SourceRoleDto;
  readonly label: string | null;
  readonly captureType: string;
  readonly createdAt: string;
  readonly workingCopy: {
    readonly revision: number;
    readonly schemaVersion: string;
    readonly updatedAt: string;
  };
  readonly rawSnapshot: RawSnapshotResource;
  readonly latestVersionId: string | null;
  readonly reviewCandidateVersionId: string | null;
  readonly approvedVersionId: string | null;
}

export interface SourceResponse {
  readonly data: { readonly source: SourceResource };
}

export interface SourceListItemResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly sourceType: SourceTypeDto;
  readonly role: SourceRoleDto;
  readonly label: string | null;
  readonly captureType: string;
  readonly createdAt: string;
}

export interface SourceListResponse {
  readonly data: {
    readonly items: readonly SourceListItemResource[];
    readonly nextCursor: string | null;
  };
}

export interface SourceWorkingCopyResponse {
  readonly data: { readonly workingCopy: SourceWorkingCopyResource; readonly rawSnapshot: RawSnapshotResource };
}

export interface SourceVersionResponse {
  readonly data: { readonly version: SourceVersionResource };
}

export interface SourceVersionDetailResource {
  readonly id: string;
  readonly versionNumber: number;
  readonly parentVersionId: string | null;
  readonly body: { readonly text: string };
  readonly contentHash: string;
  readonly schemaVersion: string;
  readonly rawSnapshotId: string;
  readonly createdById: string;
  readonly createdAt: string;
}

export interface SourceVersionDetailResponse {
  readonly data: { readonly version: SourceVersionDetailResource };
}

export interface SourceVersionListResponse {
  readonly data: { readonly items: readonly SourceVersionResource[] };
}

export interface SourceApprovalResponse {
  readonly data: {
    readonly approval: {
      readonly id: string;
      readonly approvedVersionId: string;
      readonly approvedById: string;
      readonly approvedAt: string;
      readonly validationSummary: string;
    };
    readonly head: {
      readonly approvedVersionId: string;
      readonly latestVersionId: string | null;
      readonly reviewCandidateVersionId: string | null;
    };
  };
}

export const createSourceRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sourceType', 'role', 'text'],
  properties: {
    sourceType: { type: 'string', enum: [...SOURCE_TYPES_DTO] },
    role: { type: 'string', enum: [...SOURCE_ROLES_DTO] },
    text: { type: 'string', minLength: 1, maxLength: 100_000, pattern: WELL_FORMED_SOURCE_TEXT_PATTERN },
    label: { type: 'string', minLength: 1, maxLength: 200, pattern: WELL_FORMED_SOURCE_TEXT_PATTERN },
  },
};

export const editSourceWorkingCopyRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision', 'body'],
  properties: {
    expectedRevision: { type: 'integer', minimum: 1 },
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['text'],
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 100_000, pattern: WELL_FORMED_SOURCE_TEXT_PATTERN },
      },
    },
  },
};

export const createSourceVersionRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision'],
  properties: {
    expectedRevision: { type: 'integer', minimum: 1 },
  },
};

export const approveSourceVersionRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['versionId'],
  properties: {
    versionId: { type: 'string', pattern: UUID_PATTERN },
  },
};

const rawSnapshotResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sha256', 'byteSize', 'contentType', 'capturedAt'],
  properties: {
    sha256: { type: 'string' },
    byteSize: { type: 'integer', minimum: 1 },
    contentType: { type: 'string' },
    capturedAt: { type: 'string' },
  },
};

const workingCopySummarySchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['revision', 'schemaVersion', 'updatedAt'],
  properties: {
    revision: { type: 'integer', minimum: 1 },
    schemaVersion: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const sourceResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'contentPackageId',
    'sourceType',
    'role',
    'label',
    'captureType',
    'createdAt',
    'workingCopy',
    'rawSnapshot',
    'latestVersionId',
    'reviewCandidateVersionId',
    'approvedVersionId',
  ],
  properties: {
    id: { type: 'string' },
    contentPackageId: { type: 'string' },
    sourceType: { type: 'string', enum: [...SOURCE_TYPES_DTO] },
    role: { type: 'string', enum: [...SOURCE_ROLES_DTO] },
    label: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    captureType: { type: 'string' },
    createdAt: { type: 'string' },
    workingCopy: workingCopySummarySchema,
    rawSnapshot: rawSnapshotResourceSchema,
    latestVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    reviewCandidateVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    approvedVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
};

export const sourceResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['source'],
      properties: { source: sourceResourceSchema },
    },
  },
};

const sourceListItemResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'contentPackageId', 'sourceType', 'role', 'label', 'captureType', 'createdAt'],
  properties: {
    id: { type: 'string' },
    contentPackageId: { type: 'string' },
    sourceType: { type: 'string', enum: [...SOURCE_TYPES_DTO] },
    role: { type: 'string', enum: [...SOURCE_ROLES_DTO] },
    label: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    captureType: { type: 'string' },
    createdAt: { type: 'string' },
  },
};

export const sourceListResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['items', 'nextCursor'],
      properties: {
        items: { type: 'array', items: sourceListItemResourceSchema },
        nextCursor: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      },
    },
  },
};

export const sourceWorkingCopyResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['workingCopy', 'rawSnapshot'],
      properties: {
        workingCopy: {
          type: 'object',
          additionalProperties: false,
          required: ['revision', 'schemaVersion', 'body', 'updatedAt'],
          properties: {
            revision: { type: 'integer', minimum: 1 },
            schemaVersion: { type: 'string' },
            body: {
              type: 'object',
              additionalProperties: false,
              required: ['text'],
              properties: {
                text: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100_000,
                  pattern: WELL_FORMED_SOURCE_TEXT_PATTERN,
                },
              },
            },
            updatedAt: { type: 'string' },
          },
        },
        rawSnapshot: rawSnapshotResourceSchema,
      },
    },
  },
};

export const sourceVersionResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'versionNumber',
    'parentVersionId',
    'contentHash',
    'schemaVersion',
    'rawSnapshotId',
    'createdById',
    'createdAt',
  ],
  properties: {
    id: { type: 'string' },
    versionNumber: { type: 'integer', minimum: 1 },
    parentVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    contentHash: { type: 'string' },
    schemaVersion: { type: 'string' },
    rawSnapshotId: { type: 'string' },
    createdById: { type: 'string' },
    createdAt: { type: 'string' },
  },
};

export const sourceVersionResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['version'],
      properties: { version: sourceVersionResourceSchema },
    },
  },
};

const sourceVersionDetailResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'versionNumber',
    'parentVersionId',
    'body',
    'contentHash',
    'schemaVersion',
    'rawSnapshotId',
    'createdById',
    'createdAt',
  ],
  properties: {
    id: { type: 'string' },
    versionNumber: { type: 'integer', minimum: 1 },
    parentVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['text'],
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 100_000, pattern: WELL_FORMED_SOURCE_TEXT_PATTERN },
      },
    },
    contentHash: { type: 'string' },
    schemaVersion: { type: 'string' },
    rawSnapshotId: { type: 'string' },
    createdById: { type: 'string' },
    createdAt: { type: 'string' },
  },
};

export const sourceVersionDetailResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['version'],
      properties: { version: sourceVersionDetailResourceSchema },
    },
  },
};

export const sourceVersionListResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['items'],
      properties: {
        items: { type: 'array', items: sourceVersionResourceSchema },
      },
    },
  },
};

export const sourceApprovalResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['approval', 'head'],
      properties: {
        approval: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'approvedVersionId', 'approvedById', 'approvedAt', 'validationSummary'],
          properties: {
            id: { type: 'string' },
            approvedVersionId: { type: 'string' },
            approvedById: { type: 'string' },
            approvedAt: { type: 'string' },
            validationSummary: { type: 'string' },
          },
        },
        head: {
          type: 'object',
          additionalProperties: false,
          required: ['approvedVersionId', 'latestVersionId', 'reviewCandidateVersionId'],
          properties: {
            approvedVersionId: { type: 'string' },
            latestVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            reviewCandidateVersionId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
      },
    },
  },
};

const sourceListQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: { type: 'string', pattern: '^[0-9]{1,2}$' },
    cursor: { type: 'string', minLength: 1, maxLength: 2_048 },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateCreate = ajv.compile<CreateSourceRequest>(
  createSourceRequestSchema,
) as ValidateFunction<CreateSourceRequest>;
const validateEdit = ajv.compile<EditSourceWorkingCopyRequest>(
  editSourceWorkingCopyRequestSchema,
) as ValidateFunction<EditSourceWorkingCopyRequest>;
const validateCreateVersion = ajv.compile<CreateSourceVersionRequest>(
  createSourceVersionRequestSchema,
) as ValidateFunction<CreateSourceVersionRequest>;
const validateApprove = ajv.compile<ApproveSourceVersionRequest>(
  approveSourceVersionRequestSchema,
) as ValidateFunction<ApproveSourceVersionRequest>;
const validateListQuery = ajv.compile<Record<string, string>>(sourceListQuerySchema);

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] };

function parse<T>(validator: ValidateFunction<T>, input: unknown): ParseResult<T> {
  return validator(input) ? { ok: true, value: input } : { ok: false, errors: safeErrors(validator.errors) };
}

export function parseCreateSourceRequest(input: unknown): ParseResult<CreateSourceRequest> {
  return parse(validateCreate, input);
}

export function parseEditSourceWorkingCopyRequest(input: unknown): ParseResult<EditSourceWorkingCopyRequest> {
  return parse(validateEdit, input);
}

export function parseCreateSourceVersionRequest(input: unknown): ParseResult<CreateSourceVersionRequest> {
  return parse(validateCreateVersion, input);
}

export function parseApproveSourceVersionRequest(input: unknown): ParseResult<ApproveSourceVersionRequest> {
  return parse(validateApprove, input);
}

export function parseSourceListQuery(input: unknown): ParseResult<SourceListQuery> {
  if (!validateListQuery(input)) {
    return { ok: false, errors: safeErrors(validateListQuery.errors) };
  }
  const raw = input as Record<string, string>;
  const limit = raw.limit === undefined ? 20 : Number.parseInt(raw.limit, 10);
  if (limit < 1 || limit > 50) {
    return { ok: false, errors: [{ path: '/limit', keyword: 'range' }] };
  }
  return {
    ok: true,
    value: {
      limit,
      ...(raw.cursor === undefined ? {} : { cursor: raw.cursor }),
    },
  };
}
