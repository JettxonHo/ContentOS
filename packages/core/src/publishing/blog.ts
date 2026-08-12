import { createHash } from 'node:crypto';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type { ResearchBody, ResearchVersionId } from '../research/research.js';

export type BlogArtifactId = string & { readonly __brand: 'BlogArtifactId' };
export type BlogVersionId = string & { readonly __brand: 'BlogVersionId' };
export type BlogWorkingCopyId = string & { readonly __brand: 'BlogWorkingCopyId' };
export type BlogApprovalId = string & { readonly __brand: 'BlogApprovalId' };
export type BlogRunId = string & { readonly __brand: 'BlogRunId' };
export type OpinionArtifactId = string & { readonly __brand: 'OpinionArtifactId' };
export type OpinionVersionId = string & { readonly __brand: 'OpinionVersionId' };
export type BlogContentMode = 'creator_led' | 'research_based';

export const OPINION_QUESTION = 'What should readers understand, feel, or do after reading this?' as const;
const LONE_SURROGATE_PATTERN = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;
const FIRST_PERSON_PATTERN = /\b(?:I|me|my|mine|myself|we|us|our|ours|ourselves)\b/iu;

function text(value: unknown, max: number): string {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    Buffer.byteLength(value, 'utf8') > max ||
    value.includes('\0') ||
    LONE_SURROGATE_PATTERN.test(value)
  ) {
    throw new BlogError('INVALID_BLOG');
  }
  return value;
}

export interface OpinionState {
  readonly artifactId: OpinionArtifactId;
  readonly question: typeof OPINION_QUESTION;
  readonly rawResponse: string;
  readonly interpretation: string;
  readonly revision: number;
  readonly confirmedVersionId: OpinionVersionId | null;
  readonly confirmedStatement: string | null;
  readonly researchVersionId: ResearchVersionId;
  readonly outdated: boolean;
}

export interface BlogReference {
  readonly label: string;
  readonly sourceVersionId: string;
}

export interface BlogProvenance {
  readonly researchItemId: string;
  readonly sourceVersionIds: readonly string[];
  readonly opinionVersionId: OpinionVersionId | null;
}

export interface BlogBody {
  readonly title: string;
  readonly summary: string;
  readonly markdown: string;
  readonly contentMode: BlogContentMode;
  readonly publicReferences: readonly BlogReference[];
  readonly internalProvenance: readonly BlogProvenance[];
}

export interface BlogVersionState {
  readonly id: BlogVersionId;
  readonly versionNumber: number;
  readonly body: BlogBody;
  readonly researchVersionId: ResearchVersionId;
  readonly opinionVersionId: OpinionVersionId | null;
  readonly createdAt: Date;
}

export interface BlogState {
  readonly blogId: BlogArtifactId;
  readonly packageId: ContentPackageId;
  readonly workingCopy: {
    readonly body: BlogBody;
    readonly revision: number;
    readonly checkpointedRevision: number | null;
  };
  readonly latestVersion: BlogVersionState;
  readonly approvedVersion: BlogVersionState | null;
  readonly approvedVersionId: BlogVersionId | null;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly approvalValidationSummary: BlogValidationSummary | null;
}

export interface BlogValidationSummary {
  readonly schemaVersion: 'blog-validation/v1';
  readonly result: 'passed';
  readonly contentMode: BlogContentMode;
  readonly referenceCount: number;
  readonly provenanceCount: number;
  readonly warningAcknowledgements: readonly string[];
}

export interface ApprovedBlogFoundation {
  readonly researchVersionId: ResearchVersionId;
  readonly researchBody: ResearchBody;
  readonly sourceInputs: readonly { readonly sourceVersionId: string; readonly label: string | null }[];
  readonly opinionVersionId: OpinionVersionId | null;
  readonly confirmedOpinion: string | null;
}

export type BlogErrorCode =
  | 'CONTENT_PACKAGE_NOT_FOUND'
  | 'PACKAGE_ARCHIVED'
  | 'APPROVED_RESEARCH_REQUIRED'
  | 'CONFIRMED_OPINION_REQUIRED'
  | 'OPINION_NOT_FOUND'
  | 'OPINION_REVISION_CONFLICT'
  | 'BLOG_NOT_FOUND'
  | 'BLOG_REVISION_CONFLICT'
  | 'BLOG_VERSION_NOT_ELIGIBLE'
  | 'BLOG_PROVIDER_OUTPUT_INVALID'
  | 'BLOG_EXPORT_NOT_ELIGIBLE'
  | 'INVALID_BLOG';

export class BlogError extends Error {
  constructor(readonly code: BlogErrorCode) {
    super(code);
    this.name = 'BlogError';
  }
}

function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateBlogBody(value: unknown): BlogBody {
  if (!plain(value)) throw new BlogError('INVALID_BLOG');
  if (
    Object.keys(value).sort().join(',') !== 'contentMode,internalProvenance,markdown,publicReferences,summary,title' ||
    (value.contentMode !== 'creator_led' && value.contentMode !== 'research_based') ||
    !Array.isArray(value.publicReferences) ||
    value.publicReferences.length < 1 ||
    value.publicReferences.length > 6 ||
    !Array.isArray(value.internalProvenance) ||
    value.internalProvenance.length < 1 ||
    value.internalProvenance.length > 50
  ) {
    throw new BlogError('INVALID_BLOG');
  }
  const publicReferences = value.publicReferences.map((entry): BlogReference => {
    if (!plain(entry) || Object.keys(entry).sort().join(',') !== 'label,sourceVersionId') {
      throw new BlogError('INVALID_BLOG');
    }
    return { label: text(entry.label, 200), sourceVersionId: text(entry.sourceVersionId, 100) };
  });
  const internalProvenance = value.internalProvenance.map((entry): BlogProvenance => {
    if (
      !plain(entry) ||
      Object.keys(entry).sort().join(',') !== 'opinionVersionId,researchItemId,sourceVersionIds' ||
      !Array.isArray(entry.sourceVersionIds) ||
      entry.sourceVersionIds.length < 1 ||
      entry.sourceVersionIds.length > 6 ||
      (entry.opinionVersionId !== null && typeof entry.opinionVersionId !== 'string')
    ) {
      throw new BlogError('INVALID_BLOG');
    }
    return {
      researchItemId: text(entry.researchItemId, 100),
      sourceVersionIds: entry.sourceVersionIds.map((id) => text(id, 100)),
      opinionVersionId: entry.opinionVersionId as OpinionVersionId | null,
    };
  });
  const body = {
    title: text(value.title, 200),
    summary: text(value.summary, 1_000),
    markdown: text(value.markdown, 50_000),
    contentMode: value.contentMode,
    publicReferences,
    internalProvenance,
  } as BlogBody;
  if (
    body.contentMode === 'research_based' &&
    FIRST_PERSON_PATTERN.test(`${body.title}\n${body.summary}\n${body.markdown}`)
  ) {
    throw new BlogError('INVALID_BLOG');
  }
  if (body.contentMode === 'creator_led' && body.internalProvenance.some((entry) => entry.opinionVersionId === null)) {
    throw new BlogError('INVALID_BLOG');
  }
  return body;
}

export function validateBlog(body: BlogBody): BlogValidationSummary {
  validateBlogBody(body);
  if (!body.markdown.startsWith('# ') || !body.markdown.includes('\n## References\n')) {
    throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
  }
  return {
    schemaVersion: 'blog-validation/v1',
    result: 'passed',
    contentMode: body.contentMode,
    referenceCount: body.publicReferences.length,
    provenanceCount: body.internalProvenance.length,
    warningAcknowledgements: [],
  };
}

export function blogBoundToFoundation(body: BlogBody, foundation: ApprovedBlogFoundation): boolean {
  const sourceIds = new Set(foundation.sourceInputs.map((source) => source.sourceVersionId));
  const eligibleItems = new Map(
    foundation.researchBody.items
      .filter((item) => item.reviewState === 'accepted' || item.reviewState === 'corrected')
      .map((item) => [item.id, new Set<string>(item.evidence.map((entry) => entry.sourceVersionId))]),
  );
  return (
    body.publicReferences.length === sourceIds.size &&
    body.publicReferences.every((reference) => sourceIds.has(reference.sourceVersionId)) &&
    body.internalProvenance.every((entry) => {
      const evidence = eligibleItems.get(entry.researchItemId);
      return (
        evidence !== undefined &&
        entry.sourceVersionIds.every((sourceVersionId) => evidence.has(sourceVersionId)) &&
        (body.contentMode === 'creator_led'
          ? entry.opinionVersionId === foundation.opinionVersionId
          : entry.opinionVersionId === null)
      );
    })
  );
}

export interface BlogProvider {
  readonly alias: string;
  generate(foundation: ApprovedBlogFoundation, mode: BlogContentMode): Promise<string>;
}

export class FakeBlogProvider implements BlogProvider {
  readonly alias = 'fake-blog/v1';

  async generate(foundation: ApprovedBlogFoundation, mode: BlogContentMode): Promise<string> {
    const usable = foundation.researchBody.items.filter(
      (item) => (item.reviewState === 'accepted' || item.reviewState === 'corrected') && item.evidence.length > 0,
    );
    const title = mode === 'creator_led' ? 'What the evidence means in practice' : 'An evidence-based reading';
    const opinion = mode === 'creator_led' ? `\n\n## Creator perspective\n\n${foundation.confirmedOpinion}` : '';
    const sections = usable.map((item) => `## ${item.kind}\n\n${item.text}`).join('\n\n');
    const references = foundation.sourceInputs.map((source) => `- ${source.label ?? 'Approved Source'}`).join('\n');
    return JSON.stringify({
      title,
      summary: foundation.researchBody.summary,
      markdown: `# ${title}\n\n${foundation.researchBody.summary}\n\n${sections}${opinion}\n\n## References\n\n${references}`,
      contentMode: mode,
      publicReferences: foundation.sourceInputs.map((source) => ({
        label: source.label ?? 'Approved Source',
        sourceVersionId: source.sourceVersionId,
      })),
      internalProvenance: usable.map((item) => ({
        researchItemId: item.id,
        sourceVersionIds: [...new Set(item.evidence.map((entry) => entry.sourceVersionId))],
        opinionVersionId: mode === 'creator_led' ? foundation.opinionVersionId : null,
      })),
    });
  }
}

export interface BlogRepository {
  requireActivePackage(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<void>;
  foundation(
    packageId: ContentPackageId,
    ownerId: ContentPackageOwnerId,
    mode: BlogContentMode,
  ): Promise<ApprovedBlogFoundation>;
  opinion(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<OpinionState | null>;
  saveOpinionDraft(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly artifactId: OpinionArtifactId;
    readonly rawResponse: string;
    readonly interpretation: string;
    readonly researchVersionId: ResearchVersionId;
    readonly now: Date;
  }): Promise<OpinionState>;
  confirmOpinion(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: OpinionVersionId;
    readonly expectedRevision: number;
    readonly confirmedStatement: string;
    readonly now: Date;
  }): Promise<OpinionState>;
  blog(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<BlogState | null>;
  recordFailedBlog(input: {
    readonly requestId: string;
    readonly runId: BlogRunId;
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly now: Date;
  }): Promise<void>;
  createBlog(input: {
    readonly requestId: string;
    readonly runId: BlogRunId;
    readonly blogId: BlogArtifactId;
    readonly workingCopyId: BlogWorkingCopyId;
    readonly versionId: BlogVersionId;
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly body: BlogBody;
    readonly foundation: ApprovedBlogFoundation;
    readonly now: Date;
  }): Promise<BlogState>;
  updateBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly body: BlogBody;
    readonly now: Date;
  }): Promise<BlogState>;
  checkpointBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly versionId: BlogVersionId;
    readonly now: Date;
  }): Promise<BlogState>;
  approveBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: BlogVersionId;
    readonly approvalId: BlogApprovalId;
    readonly now: Date;
  }): Promise<BlogState>;
}

export interface BlogIds {
  blog(): BlogArtifactId;
  blogVersion(): BlogVersionId;
  blogWorkingCopy(): BlogWorkingCopyId;
  blogApproval(): BlogApprovalId;
  blogRun(): BlogRunId;
  opinion(): OpinionArtifactId;
  opinionVersion(): OpinionVersionId;
}

export class BlogService {
  constructor(
    private readonly repository: BlogRepository,
    private readonly provider: BlogProvider,
    private readonly ids: BlogIds,
    private readonly clock: { now(): Date },
  ) {}

  async opinion(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<OpinionState | null> {
    await this.repository.requireActivePackage(packageId, ownerId);
    return this.repository.opinion(packageId, ownerId);
  }

  async interpret(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly rawResponse: unknown;
  }): Promise<OpinionState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    const rawResponse = text(input.rawResponse, 10_000);
    const foundation = await this.repository.foundation(input.packageId, input.ownerId, 'research_based');
    return this.repository.saveOpinionDraft({
      packageId: input.packageId,
      ownerId: input.ownerId,
      artifactId: this.ids.opinion(),
      rawResponse,
      interpretation: rawResponse.trim(),
      researchVersionId: foundation.researchVersionId,
      now: this.clock.now(),
    });
  }

  async confirmOpinion(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly confirmedStatement: unknown;
  }): Promise<OpinionState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    return this.repository.confirmOpinion({
      packageId: input.packageId,
      ownerId: input.ownerId,
      versionId: this.ids.opinionVersion(),
      expectedRevision: input.expectedRevision,
      confirmedStatement: text(input.confirmedStatement, 10_000),
      now: this.clock.now(),
    });
  }

  async blog(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<BlogState> {
    await this.repository.requireActivePackage(packageId, ownerId);
    const state = await this.repository.blog(packageId, ownerId);
    if (!state) throw new BlogError('BLOG_NOT_FOUND');
    return state;
  }

  async generate(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly requestId: string;
    readonly contentMode: BlogContentMode;
  }): Promise<BlogState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    text(input.requestId, 100);
    const foundation = await this.repository.foundation(input.packageId, input.ownerId, input.contentMode);
    const rawOutput = await this.provider.generate(foundation, input.contentMode);
    let body: BlogBody;
    try {
      body = validateBlogBody(JSON.parse(rawOutput) as unknown);
      validateBlog(body);
      if (!blogBoundToFoundation(body, foundation)) throw new BlogError('BLOG_PROVIDER_OUTPUT_INVALID');
    } catch {
      await this.repository.recordFailedBlog({
        requestId: input.requestId,
        runId: this.ids.blogRun(),
        packageId: input.packageId,
        ownerId: input.ownerId,
        providerAlias: this.provider.alias,
        rawOutput,
        now: this.clock.now(),
      });
      throw new BlogError('BLOG_PROVIDER_OUTPUT_INVALID');
    }
    return this.repository.createBlog({
      requestId: input.requestId,
      runId: this.ids.blogRun(),
      blogId: this.ids.blog(),
      workingCopyId: this.ids.blogWorkingCopy(),
      versionId: this.ids.blogVersion(),
      packageId: input.packageId,
      ownerId: input.ownerId,
      providerAlias: this.provider.alias,
      rawOutput,
      body,
      foundation,
      now: this.clock.now(),
    });
  }

  async update(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly body: unknown;
  }): Promise<BlogState> {
    const state = await this.blog(input.packageId, input.ownerId);
    const body = validateBlogBody(input.body);
    if (
      JSON.stringify(body.internalProvenance) !== JSON.stringify(state.workingCopy.body.internalProvenance) ||
      JSON.stringify(body.publicReferences) !== JSON.stringify(state.workingCopy.body.publicReferences) ||
      body.contentMode !== state.workingCopy.body.contentMode
    )
      throw new BlogError('INVALID_BLOG');
    return this.repository.updateBlog({
      packageId: input.packageId,
      ownerId: input.ownerId,
      expectedRevision: input.expectedRevision,
      body,
      now: this.clock.now(),
    });
  }

  async checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
  }): Promise<BlogState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    return this.repository.checkpointBlog({ ...input, versionId: this.ids.blogVersion(), now: this.clock.now() });
  }

  async approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: BlogVersionId;
  }): Promise<BlogState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    return this.repository.approveBlog({ ...input, approvalId: this.ids.blogApproval(), now: this.clock.now() });
  }

  async exportMarkdown(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<string> {
    const state = await this.blog(packageId, ownerId);
    if (!state.approvedVersion || state.outdated) throw new BlogError('BLOG_EXPORT_NOT_ELIGIBLE');
    const markdown = state.approvedVersion.body.markdown.endsWith('\n')
      ? state.approvedVersion.body.markdown
      : `${state.approvedVersion.body.markdown}\n`;
    return `---\ncontentosArtifactId: ${state.blogId}\ncontentosVersionId: ${state.approvedVersion.id}\n---\n\n${markdown}`;
  }
}

export const blogContentHash = (body: BlogBody): string =>
  createHash('sha256').update(JSON.stringify(body)).digest('hex');
