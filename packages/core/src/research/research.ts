import { createHash } from 'node:crypto';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type { SourceId, SourceVersionId } from '../source/source-values.js';

export const RESEARCH_SCHEMA_VERSION = 'research/v1' as const;
export const RESEARCH_ITEM_KINDS = ['fact', 'claim', 'tension'] as const;
export const RESEARCH_REVIEW_STATES = [
  'unreviewed',
  'accepted',
  'corrected',
  'excluded',
  'needs_verification',
] as const;

export type ResearchArtifactId = string & { readonly __brand: 'ResearchArtifactId' };
export type ResearchVersionId = string & { readonly __brand: 'ResearchVersionId' };
export type ResearchWorkingCopyId = string & { readonly __brand: 'ResearchWorkingCopyId' };
export type ResearchApprovalId = string & { readonly __brand: 'ResearchApprovalId' };
export type ResearchRunId = string & { readonly __brand: 'ResearchRunId' };
export type ResearchItemKind = (typeof RESEARCH_ITEM_KINDS)[number];
export type ResearchReviewState = (typeof RESEARCH_REVIEW_STATES)[number];

export interface ApprovedResearchSource {
  readonly sourceId: SourceId;
  readonly sourceVersionId: SourceVersionId;
  readonly role: 'primary' | 'supporting';
  readonly label: string | null;
  readonly text: string;
}

export interface ResearchEvidence {
  readonly sourceId: SourceId;
  readonly sourceVersionId: SourceVersionId;
  readonly paragraphIndex: number;
  readonly snippet: string;
}

export interface ResearchItem {
  readonly id: string;
  readonly kind: ResearchItemKind;
  readonly text: string;
  readonly reviewState: ResearchReviewState;
  readonly evidence: readonly ResearchEvidence[];
}

export interface ResearchQuestion {
  readonly id: string;
  readonly text: string;
}

export interface ResearchBody {
  readonly summary: string;
  readonly items: readonly ResearchItem[];
  readonly openQuestions: readonly ResearchQuestion[];
}

export interface ResearchVersionState {
  readonly id: ResearchVersionId;
  readonly researchId: ResearchArtifactId;
  readonly versionNumber: number;
  readonly parentVersionId: ResearchVersionId | null;
  readonly body: ResearchBody;
  readonly sourceInputs: readonly Omit<ApprovedResearchSource, 'text'>[];
  readonly origin: 'generated' | 'user_checkpoint';
  readonly contentHash: string;
  readonly createdById: string;
  readonly createdAt: Date;
}

export interface ResearchWorkingCopyState {
  readonly id: ResearchWorkingCopyId;
  readonly researchId: ResearchArtifactId;
  readonly body: ResearchBody;
  readonly revision: number;
  readonly checkpointedRevision: number | null;
  readonly baseVersionId: ResearchVersionId;
  readonly updatedAt: Date;
}

export interface ResearchHeadState {
  readonly researchId: ResearchArtifactId;
  readonly latestVersionId: ResearchVersionId;
  readonly reviewCandidateVersionId: ResearchVersionId;
  readonly approvedVersionId: ResearchVersionId | null;
}

export interface ResearchApprovalState {
  readonly id: ResearchApprovalId;
  readonly researchId: ResearchArtifactId;
  readonly approvedVersionId: ResearchVersionId;
  readonly approvedById: string;
  readonly approvedAt: Date;
  readonly validationSummary: ResearchValidationSummary;
}

export interface ResearchValidationSummary {
  readonly schemaVersion: 'research-validation/v1';
  readonly result: 'passed';
  readonly reviewedItemCount: number;
  readonly usableEvidenceBackedItemCount: number;
  readonly sourceInputCount: number;
  readonly warningAcknowledgements: readonly string[];
}

export interface ResearchState {
  readonly researchId: ResearchArtifactId;
  readonly contentPackageId: ContentPackageId;
  readonly workingCopy: ResearchWorkingCopyState;
  readonly head: ResearchHeadState;
  readonly latestVersion: ResearchVersionState;
  readonly approvedVersion: ResearchVersionState | null;
  readonly approval: ResearchApprovalState | null;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
}

export type ResearchErrorCode =
  | 'CONTENT_PACKAGE_NOT_FOUND'
  | 'PACKAGE_ARCHIVED'
  | 'APPROVED_SOURCE_REQUIRED'
  | 'RESEARCH_NOT_FOUND'
  | 'RESEARCH_REVISION_CONFLICT'
  | 'RESEARCH_VERSION_NOT_FOUND'
  | 'RESEARCH_VERSION_NOT_ELIGIBLE'
  | 'RESEARCH_ALREADY_APPROVED'
  | 'RESEARCH_VERSION_ALREADY_EXISTS'
  | 'RESEARCH_PROVIDER_OUTPUT_INVALID'
  | 'INVALID_RESEARCH';

export class ResearchError extends Error {
  constructor(readonly code: ResearchErrorCode) {
    super(code);
    this.name = 'ResearchError';
  }
}

const LONE_SURROGATE_PATTERN = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

function truncateCodePoints(value: string, max: number): string {
  return Array.from(value).slice(0, max).join('');
}

function requireText(value: unknown, max: number): string {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    Buffer.byteLength(value, 'utf8') > max ||
    value.includes('\0') ||
    LONE_SURROGATE_PATTERN.test(value)
  ) {
    throw new ResearchError('INVALID_RESEARCH');
  }
  return value;
}

function requireId(value: unknown): string {
  const id = requireText(value, 100);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(id)) throw new ResearchError('INVALID_RESEARCH');
  return id;
}

export function validateResearchBody(value: unknown): ResearchBody {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ResearchError('INVALID_RESEARCH');
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).sort().join(',') !== 'items,openQuestions,summary' ||
    !Array.isArray(input.items) ||
    !Array.isArray(input.openQuestions) ||
    input.items.length < 1 ||
    input.items.length > 50 ||
    input.openQuestions.length > 20
  ) {
    throw new ResearchError('INVALID_RESEARCH');
  }
  const ids = new Set<string>();
  const items = input.items.map((candidate): ResearchItem => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      throw new ResearchError('INVALID_RESEARCH');
    }
    const item = candidate as Record<string, unknown>;
    if (Object.keys(item).sort().join(',') !== 'evidence,id,kind,reviewState,text') {
      throw new ResearchError('INVALID_RESEARCH');
    }
    const id = requireId(item.id);
    if (ids.has(id)) throw new ResearchError('INVALID_RESEARCH');
    ids.add(id);
    if (!RESEARCH_ITEM_KINDS.includes(item.kind as ResearchItemKind)) throw new ResearchError('INVALID_RESEARCH');
    if (!RESEARCH_REVIEW_STATES.includes(item.reviewState as ResearchReviewState)) {
      throw new ResearchError('INVALID_RESEARCH');
    }
    if (!Array.isArray(item.evidence) || item.evidence.length > 10) throw new ResearchError('INVALID_RESEARCH');
    const evidence = item.evidence.map((candidateEvidence): ResearchEvidence => {
      if (typeof candidateEvidence !== 'object' || candidateEvidence === null || Array.isArray(candidateEvidence)) {
        throw new ResearchError('INVALID_RESEARCH');
      }
      const evidenceValue = candidateEvidence as Record<string, unknown>;
      if (Object.keys(evidenceValue).sort().join(',') !== 'paragraphIndex,snippet,sourceId,sourceVersionId') {
        throw new ResearchError('INVALID_RESEARCH');
      }
      if (!Number.isSafeInteger(evidenceValue.paragraphIndex) || Number(evidenceValue.paragraphIndex) < 0) {
        throw new ResearchError('INVALID_RESEARCH');
      }
      return {
        sourceId: requireText(evidenceValue.sourceId, 100) as SourceId,
        sourceVersionId: requireText(evidenceValue.sourceVersionId, 100) as SourceVersionId,
        paragraphIndex: Number(evidenceValue.paragraphIndex),
        snippet: requireText(evidenceValue.snippet, 2_000),
      };
    });
    return {
      id,
      kind: item.kind as ResearchItemKind,
      text: requireText(item.text, 5_000),
      reviewState: item.reviewState as ResearchReviewState,
      evidence,
    };
  });
  const openQuestions = input.openQuestions.map((candidate): ResearchQuestion => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      throw new ResearchError('INVALID_RESEARCH');
    }
    const question = candidate as Record<string, unknown>;
    if (Object.keys(question).sort().join(',') !== 'id,text') throw new ResearchError('INVALID_RESEARCH');
    const id = requireId(question.id);
    if (ids.has(id)) throw new ResearchError('INVALID_RESEARCH');
    ids.add(id);
    return { id, text: requireText(question.text, 2_000) };
  });
  return { summary: requireText(input.summary, 10_000), items, openQuestions };
}

export function researchContentHash(body: ResearchBody): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export function researchApprovalEligible(body: ResearchBody): boolean {
  return (
    body.items.every((item) => item.reviewState !== 'unreviewed') &&
    body.items.some(
      (item) => (item.reviewState === 'accepted' || item.reviewState === 'corrected') && item.evidence.length > 0,
    ) &&
    body.items.every((item) => !['accepted', 'corrected'].includes(item.reviewState) || item.evidence.length > 0)
  );
}

export function createResearchValidationSummary(
  body: ResearchBody,
  sources: readonly Omit<ApprovedResearchSource, 'text'>[],
): ResearchValidationSummary {
  if (!researchApprovalEligible(body) || !researchEvidenceBoundToSources(body, sources)) {
    throw new ResearchError('RESEARCH_VERSION_NOT_ELIGIBLE');
  }
  return {
    schemaVersion: 'research-validation/v1',
    result: 'passed',
    reviewedItemCount: body.items.length,
    usableEvidenceBackedItemCount: body.items.filter(
      (item) => (item.reviewState === 'accepted' || item.reviewState === 'corrected') && item.evidence.length > 0,
    ).length,
    sourceInputCount: sources.length,
    warningAcknowledgements: [],
  };
}

export function parseResearchValidationSummary(value: unknown): ResearchValidationSummary {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ResearchError('INVALID_RESEARCH');
  const summary = value as Record<string, unknown>;
  if (
    Object.keys(summary).sort().join(',') !==
      'result,reviewedItemCount,schemaVersion,sourceInputCount,usableEvidenceBackedItemCount,warningAcknowledgements' ||
    summary.schemaVersion !== 'research-validation/v1' ||
    summary.result !== 'passed' ||
    !Number.isSafeInteger(summary.reviewedItemCount) ||
    Number(summary.reviewedItemCount) < 1 ||
    !Number.isSafeInteger(summary.usableEvidenceBackedItemCount) ||
    Number(summary.usableEvidenceBackedItemCount) < 1 ||
    Number(summary.usableEvidenceBackedItemCount) > Number(summary.reviewedItemCount) ||
    !Number.isSafeInteger(summary.sourceInputCount) ||
    Number(summary.sourceInputCount) < 1 ||
    Number(summary.sourceInputCount) > 6 ||
    !Array.isArray(summary.warningAcknowledgements) ||
    summary.warningAcknowledgements.length !== 0
  ) {
    throw new ResearchError('INVALID_RESEARCH');
  }
  return {
    schemaVersion: 'research-validation/v1',
    result: 'passed',
    reviewedItemCount: Number(summary.reviewedItemCount),
    usableEvidenceBackedItemCount: Number(summary.usableEvidenceBackedItemCount),
    sourceInputCount: Number(summary.sourceInputCount),
    warningAcknowledgements: [],
  };
}

function sameEvidence(left: readonly ResearchEvidence[], right: readonly ResearchEvidence[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => {
      const candidate = right[index];
      return (
        candidate !== undefined &&
        entry.sourceId === candidate.sourceId &&
        entry.sourceVersionId === candidate.sourceVersionId &&
        entry.paragraphIndex === candidate.paragraphIndex &&
        entry.snippet === candidate.snippet
      );
    })
  );
}

export function researchReviewShapePreserved(current: ResearchBody, candidate: ResearchBody): boolean {
  return (
    current.items.length === candidate.items.length &&
    current.items.every((item, index) => {
      const next = candidate.items[index];
      return (
        next !== undefined &&
        item.id === next.id &&
        item.kind === next.kind &&
        sameEvidence(item.evidence, next.evidence)
      );
    })
  );
}

export function researchEvidenceBoundToSources(
  body: ResearchBody,
  sources: readonly Omit<ApprovedResearchSource, 'text'>[],
): boolean {
  const allowed = new Set(sources.map((source) => `${source.sourceId}:${source.sourceVersionId}`));
  return body.items.every((item) =>
    item.evidence.every((evidence) => allowed.has(`${evidence.sourceId}:${evidence.sourceVersionId}`)),
  );
}

export interface ResearchProvider {
  readonly alias: string;
  generate(sources: readonly ApprovedResearchSource[]): Promise<string>;
}

export class FakeResearchProvider implements ResearchProvider {
  readonly alias = 'fake-research/v1';

  async generate(sources: readonly ApprovedResearchSource[]): Promise<string> {
    const items = sources.map((source, index) => {
      const paragraphs = source.text
        .split(/\n\s*\n/u)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      const snippet = truncateCodePoints(paragraphs[0] ?? source.text.trim(), 500);
      return {
        id: `item-${index + 1}`,
        kind: index === 0 ? 'claim' : 'fact',
        text: snippet,
        reviewState: 'unreviewed',
        evidence: [
          {
            sourceId: source.sourceId,
            sourceVersionId: source.sourceVersionId,
            paragraphIndex: 0,
            snippet,
          },
        ],
      };
    });
    return JSON.stringify({
      summary: truncateCodePoints(items.map((item) => item.text).join(' '), 2_000),
      items,
      openQuestions: [{ id: 'question-1', text: 'Which conclusion should the final content emphasize?' }],
    });
  }
}

export interface ResearchIds {
  generateResearchId(): ResearchArtifactId;
  generateWorkingCopyId(): ResearchWorkingCopyId;
  generateVersionId(): ResearchVersionId;
  generateApprovalId(): ResearchApprovalId;
  generateRunId(): ResearchRunId;
}

export interface ResearchRepository {
  approvedSources(
    packageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly ApprovedResearchSource[]>;
  isPackageOwned(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean>;
  isPackageActive(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean>;
  find(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ResearchState | null>;
  createGenerated(input: {
    readonly requestId: string;
    readonly runId: ResearchRunId;
    readonly researchId: ResearchArtifactId;
    readonly workingCopyId: ResearchWorkingCopyId;
    readonly versionId: ResearchVersionId;
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly body: ResearchBody;
    readonly sources: readonly ApprovedResearchSource[];
    readonly now: Date;
  }): Promise<ResearchState>;
  recordFailedGeneration(input: {
    readonly requestId: string;
    readonly runId: ResearchRunId;
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly sources: readonly ApprovedResearchSource[];
    readonly now: Date;
  }): Promise<void>;
  updateWorkingCopy(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly body: ResearchBody;
    readonly expectedRevision: number;
    readonly now: Date;
  }): Promise<ResearchState>;
  checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly versionId: ResearchVersionId;
    readonly expectedRevision: number;
    readonly now: Date;
  }): Promise<ResearchState>;
  approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly versionId: ResearchVersionId;
    readonly approvalId: ResearchApprovalId;
    readonly now: Date;
  }): Promise<ResearchState>;
}

function sameSourceSet(
  left: readonly Omit<ApprovedResearchSource, 'text'>[],
  right: readonly ApprovedResearchSource[],
): boolean {
  return (
    left.length === right.length &&
    left.every((source, index) => {
      const candidate = right[index];
      return (
        candidate !== undefined &&
        source.sourceId === candidate.sourceId &&
        source.sourceVersionId === candidate.sourceVersionId &&
        source.role === candidate.role
      );
    })
  );
}

export class ResearchService {
  constructor(
    private readonly repository: ResearchRepository,
    private readonly provider: ResearchProvider,
    private readonly ids: ResearchIds,
    private readonly clock: { now(): Date },
  ) {}

  private async requirePackage(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<void> {
    if (!(await this.repository.isPackageOwned(packageId, ownerUserId)))
      throw new ResearchError('CONTENT_PACKAGE_NOT_FOUND');
    if (!(await this.repository.isPackageActive(packageId, ownerUserId))) throw new ResearchError('PACKAGE_ARCHIVED');
  }

  private async requireApprovedSources(
    packageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly ApprovedResearchSource[]> {
    const sources = await this.repository.approvedSources(packageId, ownerUserId);
    if (sources.filter((source) => source.role === 'primary').length !== 1 || sources.length > 6) {
      throw new ResearchError('APPROVED_SOURCE_REQUIRED');
    }
    return sources;
  }

  async get(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ResearchState> {
    await this.requirePackage(packageId, ownerUserId);
    const state = await this.repository.find(packageId, ownerUserId);
    if (!state) throw new ResearchError('RESEARCH_NOT_FOUND');
    return state;
  }

  async generate(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly requestId: string;
  }): Promise<ResearchState> {
    await this.requirePackage(input.packageId, input.ownerUserId);
    requireText(input.requestId, 100);
    const sources = await this.requireApprovedSources(input.packageId, input.ownerUserId);
    const rawOutput = await this.provider.generate(sources);
    let body: ResearchBody;
    try {
      body = validateResearchBody(JSON.parse(rawOutput) as unknown);
      if (!researchEvidenceBoundToSources(body, sources)) throw new ResearchError('INVALID_RESEARCH');
    } catch {
      await this.repository.recordFailedGeneration({
        requestId: input.requestId,
        runId: this.ids.generateRunId(),
        packageId: input.packageId,
        ownerUserId: input.ownerUserId,
        providerAlias: this.provider.alias,
        rawOutput,
        sources,
        now: this.clock.now(),
      });
      throw new ResearchError('RESEARCH_PROVIDER_OUTPUT_INVALID');
    }
    return this.repository.createGenerated({
      requestId: input.requestId,
      runId: this.ids.generateRunId(),
      researchId: this.ids.generateResearchId(),
      workingCopyId: this.ids.generateWorkingCopyId(),
      versionId: this.ids.generateVersionId(),
      packageId: input.packageId,
      ownerUserId: input.ownerUserId,
      providerAlias: this.provider.alias,
      rawOutput,
      body,
      sources,
      now: this.clock.now(),
    });
  }

  async updateWorkingCopy(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly body: unknown;
    readonly expectedRevision: number;
  }): Promise<ResearchState> {
    await this.requirePackage(input.packageId, input.ownerUserId);
    const state = await this.get(input.packageId, input.ownerUserId);
    const body = validateResearchBody(input.body);
    if (!researchReviewShapePreserved(state.workingCopy.body, body)) throw new ResearchError('INVALID_RESEARCH');
    return this.repository.updateWorkingCopy({
      packageId: input.packageId,
      ownerUserId: input.ownerUserId,
      body,
      expectedRevision: input.expectedRevision,
      now: this.clock.now(),
    });
  }

  async checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly expectedRevision: number;
  }): Promise<ResearchState> {
    await this.requirePackage(input.packageId, input.ownerUserId);
    return this.repository.checkpoint({
      packageId: input.packageId,
      ownerUserId: input.ownerUserId,
      versionId: this.ids.generateVersionId(),
      expectedRevision: input.expectedRevision,
      now: this.clock.now(),
    });
  }

  async approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly versionId: ResearchVersionId;
  }): Promise<ResearchState> {
    await this.requirePackage(input.packageId, input.ownerUserId);
    const state = await this.get(input.packageId, input.ownerUserId);
    const sources = await this.requireApprovedSources(input.packageId, input.ownerUserId);
    if (
      state.head.reviewCandidateVersionId !== input.versionId ||
      state.latestVersion.id !== input.versionId ||
      !sameSourceSet(state.latestVersion.sourceInputs, sources) ||
      !researchEvidenceBoundToSources(state.latestVersion.body, state.latestVersion.sourceInputs) ||
      !researchApprovalEligible(state.latestVersion.body)
    ) {
      throw new ResearchError('RESEARCH_VERSION_NOT_ELIGIBLE');
    }
    return this.repository.approve({
      packageId: input.packageId,
      ownerUserId: input.ownerUserId,
      versionId: input.versionId,
      approvalId: this.ids.generateApprovalId(),
      now: this.clock.now(),
    });
  }
}
