import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export const CONTENT_PACKAGE_MODES = ['deferred', 'creator_led', 'research_based'] as const;
export const CONTENT_PACKAGE_OUTPUTS = ['blog', 'xiaohongshu'] as const;
export const CONTENT_PACKAGE_LIFECYCLES = ['active', 'archived'] as const;
export const CONTENT_PACKAGE_LIST_FILTERS = ['active', 'archived', 'all'] as const;

export type ContentPackageModeDto = (typeof CONTENT_PACKAGE_MODES)[number];
export type ContentPackageOutputDto = (typeof CONTENT_PACKAGE_OUTPUTS)[number];
export type ContentPackageLifecycleDto = (typeof CONTENT_PACKAGE_LIFECYCLES)[number];
export type ContentPackageListFilterDto = (typeof CONTENT_PACKAGE_LIST_FILTERS)[number];

export interface CreateContentPackageRequest {
  readonly title: string;
  readonly description?: string | null;
  readonly contentMode?: ContentPackageModeDto;
  readonly requestedOutputs: readonly ContentPackageOutputDto[];
}

export interface UpdateContentPackageRequest {
  readonly expectedRevision: number;
  readonly title?: string;
  readonly description?: string | null;
  readonly contentMode?: ContentPackageModeDto;
  readonly requestedOutputs?: readonly ContentPackageOutputDto[];
}

export interface ArchiveContentPackageRequest {
  readonly expectedRevision: number;
}

export interface ContentPackageResource {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly contentMode: ContentPackageModeDto;
  readonly requestedOutputs: readonly ContentPackageOutputDto[];
  readonly lifecycle: ContentPackageLifecycleDto;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface ContentPackageResponse {
  readonly data: { readonly contentPackage: ContentPackageResource };
}

export interface ContentPackageListResponse {
  readonly data: {
    readonly items: readonly ContentPackageResource[];
    readonly nextCursor: string | null;
  };
}

export interface ContentPackageListQuery {
  readonly status: ContentPackageListFilterDto;
  readonly limit: number;
  readonly cursor?: string;
}

const nullableDescriptionSchema: PortableJsonSchema = {
  anyOf: [{ type: 'string', maxLength: 2_000 }, { type: 'null' }],
};

const requestedOutputsSchema: PortableJsonSchema = {
  type: 'array',
  minItems: 1,
  maxItems: 2,
  uniqueItems: true,
  items: { type: 'string', enum: [...CONTENT_PACKAGE_OUTPUTS] },
};

export const createContentPackageRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'requestedOutputs'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: nullableDescriptionSchema,
    contentMode: { type: 'string', enum: [...CONTENT_PACKAGE_MODES] },
    requestedOutputs: requestedOutputsSchema,
  },
};

export const updateContentPackageRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision'],
  minProperties: 2,
  properties: {
    expectedRevision: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: nullableDescriptionSchema,
    contentMode: { type: 'string', enum: [...CONTENT_PACKAGE_MODES] },
    requestedOutputs: requestedOutputsSchema,
  },
};

export const archiveContentPackageRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 } },
};

const contentPackageResourceSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'title',
    'description',
    'contentMode',
    'requestedOutputs',
    'lifecycle',
    'revision',
    'createdAt',
    'updatedAt',
    'archivedAt',
  ],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: nullableDescriptionSchema,
    contentMode: { type: 'string', enum: [...CONTENT_PACKAGE_MODES] },
    requestedOutputs: requestedOutputsSchema,
    lifecycle: { type: 'string', enum: [...CONTENT_PACKAGE_LIFECYCLES] },
    revision: { type: 'integer', minimum: 1 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    archivedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
};

export const contentPackageResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['contentPackage'],
      properties: { contentPackage: contentPackageResourceSchema },
    },
  },
};

export const contentPackageListResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['items', 'nextCursor'],
      properties: {
        items: { type: 'array', items: contentPackageResourceSchema },
        nextCursor: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      },
    },
  },
};

const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: CONTENT_PACKAGE_LIST_FILTERS },
    limit: { type: 'string', pattern: '^[0-9]{1,2}$' },
    cursor: { type: 'string', minLength: 1, maxLength: 2_048 },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateCreate = ajv.compile<CreateContentPackageRequest>(
  createContentPackageRequestSchema,
) as ValidateFunction<CreateContentPackageRequest>;
const validateUpdate = ajv.compile<UpdateContentPackageRequest>(
  updateContentPackageRequestSchema,
) as ValidateFunction<UpdateContentPackageRequest>;
const validateArchive = ajv.compile<ArchiveContentPackageRequest>(
  archiveContentPackageRequestSchema,
) as ValidateFunction<ArchiveContentPackageRequest>;
const validateList = ajv.compile<Record<string, string>>(listQuerySchema);

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] };

function parse<T>(validator: ValidateFunction<T>, input: unknown): ParseResult<T> {
  return validator(input) ? { ok: true, value: input } : { ok: false, errors: safeErrors(validator.errors) };
}

export function parseCreateContentPackageRequest(input: unknown): ParseResult<CreateContentPackageRequest> {
  return parse(validateCreate, input);
}

export function parseUpdateContentPackageRequest(input: unknown): ParseResult<UpdateContentPackageRequest> {
  return parse(validateUpdate, input);
}

export function parseArchiveContentPackageRequest(input: unknown): ParseResult<ArchiveContentPackageRequest> {
  return parse(validateArchive, input);
}

export function parseContentPackageListQuery(input: unknown): ParseResult<ContentPackageListQuery> {
  if (!validateList(input)) {
    return { ok: false, errors: safeErrors(validateList.errors) };
  }
  const raw = input as Record<string, string>;
  const limit = raw.limit === undefined ? 20 : Number.parseInt(raw.limit, 10);
  if (limit < 1 || limit > 50) {
    return { ok: false, errors: [{ path: '/limit', keyword: 'range' }] };
  }
  return {
    ok: true,
    value: {
      status: (raw.status ?? 'active') as ContentPackageListFilterDto,
      limit,
      ...(raw.cursor === undefined ? {} : { cursor: raw.cursor }),
    },
  };
}
