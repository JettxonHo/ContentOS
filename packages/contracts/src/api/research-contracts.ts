import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export type ResearchReviewStateDto = 'unreviewed' | 'accepted' | 'corrected' | 'excluded' | 'needs_verification';
export type ResearchItemKindDto = 'fact' | 'claim' | 'tension';

export interface ResearchEvidenceDto {
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly paragraphIndex: number;
  readonly snippet: string;
}

export interface ResearchItemDto {
  readonly id: string;
  readonly kind: ResearchItemKindDto;
  readonly text: string;
  readonly reviewState: ResearchReviewStateDto;
  readonly evidence: readonly ResearchEvidenceDto[];
}

export interface ResearchBodyDto {
  readonly summary: string;
  readonly items: readonly ResearchItemDto[];
  readonly openQuestions: readonly { readonly id: string; readonly text: string }[];
}

export interface GenerateResearchRequest {
  readonly requestId: string;
}

export interface EditResearchWorkingCopyRequest {
  readonly expectedRevision: number;
  readonly body: ResearchBodyDto;
}

export interface CheckpointResearchRequest {
  readonly expectedRevision: number;
}

export interface ApproveResearchRequest {
  readonly versionId: string;
}

export interface ResearchResource {
  readonly id: string;
  readonly contentPackageId: string;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly workingCopy: {
    readonly revision: number;
    readonly checkpointedRevision: number | null;
    readonly baseVersionId: string;
    readonly body: ResearchBodyDto;
    readonly updatedAt: string;
  };
  readonly latestVersion: {
    readonly id: string;
    readonly versionNumber: number;
    readonly body: ResearchBodyDto;
    readonly sourceInputs: readonly {
      readonly sourceId: string;
      readonly sourceVersionId: string;
      readonly role: 'primary' | 'supporting';
      readonly label: string | null;
    }[];
    readonly origin: 'generated' | 'user_checkpoint';
    readonly createdAt: string;
  };
  readonly approvedVersionId: string | null;
  readonly approval: {
    readonly id: string;
    readonly approvedVersionId: string;
    readonly approvedAt: string;
    readonly validationSummary: {
      readonly schemaVersion: 'research-validation/v1';
      readonly result: 'passed';
      readonly reviewedItemCount: number;
      readonly usableEvidenceBackedItemCount: number;
      readonly sourceInputCount: number;
      readonly warningAcknowledgements: readonly string[];
    };
  } | null;
}

export interface ResearchResponse {
  readonly data: { readonly research: ResearchResource };
}

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
const SAFE_TEXT_PATTERN = '^[^\\u0000\\uD800-\\uDFFF]+$';
const ITEM_ID_PATTERN = '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$';

const researchBodySchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'items', 'openQuestions'],
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 10_000, pattern: SAFE_TEXT_PATTERN },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'kind', 'text', 'reviewState', 'evidence'],
        properties: {
          id: { type: 'string', pattern: ITEM_ID_PATTERN },
          kind: { type: 'string', enum: ['fact', 'claim', 'tension'] },
          text: { type: 'string', minLength: 1, maxLength: 5_000, pattern: SAFE_TEXT_PATTERN },
          reviewState: {
            type: 'string',
            enum: ['unreviewed', 'accepted', 'corrected', 'excluded', 'needs_verification'],
          },
          evidence: {
            type: 'array',
            maxItems: 10,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['sourceId', 'sourceVersionId', 'paragraphIndex', 'snippet'],
              properties: {
                sourceId: { type: 'string', pattern: UUID_PATTERN },
                sourceVersionId: { type: 'string', pattern: UUID_PATTERN },
                paragraphIndex: { type: 'integer', minimum: 0 },
                snippet: { type: 'string', minLength: 1, maxLength: 2_000, pattern: SAFE_TEXT_PATTERN },
              },
            },
          },
        },
      },
    },
    openQuestions: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'text'],
        properties: {
          id: { type: 'string', pattern: ITEM_ID_PATTERN },
          text: { type: 'string', minLength: 1, maxLength: 2_000, pattern: SAFE_TEXT_PATTERN },
        },
      },
    },
  },
};

export const generateResearchRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['requestId'],
  properties: { requestId: { type: 'string', pattern: UUID_PATTERN } },
};

export const editResearchWorkingCopyRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision', 'body'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 }, body: researchBodySchema },
};

export const checkpointResearchRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expectedRevision'],
  properties: { expectedRevision: { type: 'integer', minimum: 1 } },
};

export const approveResearchRequestSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['versionId'],
  properties: { versionId: { type: 'string', pattern: UUID_PATTERN } },
};

export const researchResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['research'],
      properties: {
        research: {
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
            'approval',
          ],
          properties: {
            id: { type: 'string', pattern: UUID_PATTERN },
            contentPackageId: { type: 'string', pattern: UUID_PATTERN },
            outdated: { type: 'boolean' },
            reviewCandidateOutdated: { type: 'boolean' },
            workingCopy: {
              type: 'object',
              additionalProperties: false,
              required: ['revision', 'checkpointedRevision', 'baseVersionId', 'body', 'updatedAt'],
              properties: {
                revision: { type: 'integer', minimum: 1 },
                checkpointedRevision: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
                baseVersionId: { type: 'string', pattern: UUID_PATTERN },
                body: researchBodySchema,
                updatedAt: { type: 'string' },
              },
            },
            latestVersion: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'versionNumber', 'body', 'sourceInputs', 'origin', 'createdAt'],
              properties: {
                id: { type: 'string', pattern: UUID_PATTERN },
                versionNumber: { type: 'integer', minimum: 1 },
                body: researchBodySchema,
                sourceInputs: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 6,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceId', 'sourceVersionId', 'role', 'label'],
                    properties: {
                      sourceId: { type: 'string', pattern: UUID_PATTERN },
                      sourceVersionId: { type: 'string', pattern: UUID_PATTERN },
                      role: { type: 'string', enum: ['primary', 'supporting'] },
                      label: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    },
                  },
                },
                origin: { type: 'string', enum: ['generated', 'user_checkpoint'] },
                createdAt: { type: 'string' },
              },
            },
            approvedVersionId: { anyOf: [{ type: 'string', pattern: UUID_PATTERN }, { type: 'null' }] },
            approval: {
              anyOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['id', 'approvedVersionId', 'approvedAt', 'validationSummary'],
                  properties: {
                    id: { type: 'string', pattern: UUID_PATTERN },
                    approvedVersionId: { type: 'string', pattern: UUID_PATTERN },
                    approvedAt: { type: 'string' },
                    validationSummary: {
                      type: 'object',
                      additionalProperties: false,
                      required: [
                        'schemaVersion',
                        'result',
                        'reviewedItemCount',
                        'usableEvidenceBackedItemCount',
                        'sourceInputCount',
                        'warningAcknowledgements',
                      ],
                      properties: {
                        schemaVersion: { type: 'string', enum: ['research-validation/v1'] },
                        result: { type: 'string', enum: ['passed'] },
                        reviewedItemCount: { type: 'integer', minimum: 1 },
                        usableEvidenceBackedItemCount: { type: 'integer', minimum: 1 },
                        sourceInputCount: { type: 'integer', minimum: 1, maximum: 6 },
                        warningAcknowledgements: { type: 'array', maxItems: 0, items: { type: 'string' } },
                      },
                    },
                  },
                },
                { type: 'null' },
              ],
            },
          },
        },
      },
    },
  },
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateGenerate = ajv.compile<GenerateResearchRequest>(generateResearchRequestSchema);
const validateEdit = ajv.compile<EditResearchWorkingCopyRequest>(editResearchWorkingCopyRequestSchema);
const validateCheckpoint = ajv.compile<CheckpointResearchRequest>(checkpointResearchRequestSchema);
const validateApprove = ajv.compile<ApproveResearchRequest>(approveResearchRequestSchema);

type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] };

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

function parse<T>(validator: ValidateFunction<T>, input: unknown): ParseResult<T> {
  return validator(input) ? { ok: true, value: input } : { ok: false, errors: safeErrors(validator.errors) };
}

export const parseGenerateResearchRequest = (input: unknown): ParseResult<GenerateResearchRequest> =>
  parse(validateGenerate, input);
export const parseEditResearchWorkingCopyRequest = (input: unknown): ParseResult<EditResearchWorkingCopyRequest> =>
  parse(validateEdit, input);
export const parseCheckpointResearchRequest = (input: unknown): ParseResult<CheckpointResearchRequest> =>
  parse(validateCheckpoint, input);
export const parseApproveResearchRequest = (input: unknown): ParseResult<ApproveResearchRequest> =>
  parse(validateApprove, input);
