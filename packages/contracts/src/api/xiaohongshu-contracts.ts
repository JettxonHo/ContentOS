import type { ContractValidationError } from './auth-contracts.js';
import type { BlogBodyDto, ContentModeDto } from './blog-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';
export {
  parseApproveBlogRequest as parseApproveXiaohongshuRequest,
  parseCheckpointBlogRequest as parseCheckpointXiaohongshuRequest,
  parseGenerateBlogRequest as parseGenerateXiaohongshuRequest,
  approveBlogRequestSchema as approveXiaohongshuRequestSchema,
  checkpointBlogRequestSchema as checkpointXiaohongshuRequestSchema,
  generateBlogRequestSchema as generateXiaohongshuRequestSchema,
} from './blog-contracts.js';

export interface XiaohongshuPageDto {
  readonly id: string;
  readonly purpose: string;
  readonly heading: string;
  readonly content: string;
  readonly emphasis: 'headline' | 'body' | 'quote';
  readonly density: 'low' | 'medium';
  readonly visualBrief: string;
  readonly researchItemIds: readonly string[];
  readonly opinionVersionId: string | null;
}
export interface XiaohongshuBodyDto {
  readonly platformProfileVersion: 'xiaohongshu-profile/v1';
  readonly contentMode: ContentModeDto;
  readonly platformTitleCandidates: readonly string[];
  readonly selectedPlatformTitle: string;
  readonly coverTitle: string;
  readonly coverSubtitle: string | null;
  readonly pages: readonly XiaohongshuPageDto[];
  readonly caption: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly publicReferences: BlogBodyDto['publicReferences'];
}
export interface XiaohongshuResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly workingCopy: {
    readonly revision: number;
    readonly checkpointedRevision: number | null;
    readonly body: XiaohongshuBodyDto;
  };
  readonly latestVersion: {
    readonly id: string;
    readonly versionNumber: number;
    readonly body: XiaohongshuBodyDto;
    readonly researchVersionId: string;
    readonly opinionVersionId: string | null;
    readonly createdAt: string;
  };
  readonly approvedVersionId: string | null;
  readonly approvalValidationSummary: {
    readonly schemaVersion: 'xiaohongshu-validation/v1';
    readonly result: 'passed';
    readonly pageCount: 8;
    readonly contentMode: ContentModeDto;
    readonly warningAcknowledgements: readonly string[];
  } | null;
}
export interface XiaohongshuResponse {
  readonly data: { readonly xiaohongshu: XiaohongshuResource };
}
export interface EditXiaohongshuRequest {
  readonly expectedRevision: number;
  readonly body: XiaohongshuBodyDto;
}

type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] };
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export function parseEditXiaohongshuRequest(value: unknown): Result<EditXiaohongshuRequest> {
  return object(value) &&
    Object.keys(value).length === 2 &&
    Number.isInteger(value.expectedRevision) &&
    Number(value.expectedRevision) >= 1 &&
    object(value.body)
    ? { ok: true, value: value as unknown as EditXiaohongshuRequest }
    : { ok: false, errors: [{ path: '/', keyword: 'schema' }] };
}
const text = (maxLength: number): PortableJsonSchema => ({ type: 'string', minLength: 1, maxLength });
const nullableText = (maxLength: number): PortableJsonSchema => ({ anyOf: [text(maxLength), { type: 'null' }] });
const pageSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'purpose',
    'heading',
    'content',
    'emphasis',
    'density',
    'visualBrief',
    'researchItemIds',
    'opinionVersionId',
  ],
  properties: {
    id: text(50),
    purpose: text(100),
    heading: text(100),
    content: text(1000),
    emphasis: { type: 'string', enum: ['headline', 'body', 'quote'] },
    density: { type: 'string', enum: ['low', 'medium'] },
    visualBrief: text(300),
    researchItemIds: { type: 'array', minItems: 1, maxItems: 50, items: text(100) },
    opinionVersionId: nullableText(100),
  },
};
const bodySchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'platformProfileVersion',
    'contentMode',
    'platformTitleCandidates',
    'selectedPlatformTitle',
    'coverTitle',
    'coverSubtitle',
    'pages',
    'caption',
    'cta',
    'hashtags',
    'publicReferences',
  ],
  properties: {
    platformProfileVersion: { type: 'string', enum: ['xiaohongshu-profile/v1'] },
    contentMode: { type: 'string', enum: ['creator_led', 'research_based'] },
    platformTitleCandidates: { type: 'array', minItems: 3, maxItems: 3, items: text(100) },
    selectedPlatformTitle: text(100),
    coverTitle: text(80),
    coverSubtitle: nullableText(120),
    pages: { type: 'array', minItems: 8, maxItems: 8, items: pageSchema },
    caption: text(2000),
    cta: text(200),
    hashtags: { type: 'array', minItems: 3, maxItems: 8, items: text(50) },
    publicReferences: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'sourceVersionId'],
        properties: { label: text(200), sourceVersionId: text(100) },
      },
    },
  },
};
export const editXiaohongshuRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision', 'body'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 }, body: bodySchema },
};
export const xiaohongshuResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['xiaohongshu'],
      properties: {
        xiaohongshu: {
          type: 'object',
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
            id: text(100),
            contentPackageId: text(100),
            outdated: { type: 'boolean' },
            reviewCandidateOutdated: { type: 'boolean' },
            workingCopy: { type: 'object' },
            latestVersion: { type: 'object' },
            approvedVersionId: nullableText(100),
            approvalValidationSummary: { anyOf: [{ type: 'object' }, { type: 'null' }] },
          },
        },
      },
    },
  },
};
