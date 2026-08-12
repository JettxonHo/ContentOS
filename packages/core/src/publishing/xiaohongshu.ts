import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type { ApprovedBlogFoundation, BlogContentMode, OpinionVersionId } from './blog.js';
import { BlogError } from './blog.js';
import type { ResearchVersionId } from '../research/research.js';

export const XIAOHONGSHU_PROFILE_VERSION = 'xiaohongshu-profile/v1' as const;
const FIRST_PERSON = /(?:\b(?:I|me|my|mine|myself|we|us|our|ours|ourselves)\b|我|我们)/iu;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;
const USABLE_RESEARCH_STATES = new Set(['accepted', 'corrected']);

export type XiaohongshuArtifactId = string & { readonly __brand: 'XiaohongshuArtifactId' };
export type XiaohongshuVersionId = string & { readonly __brand: 'XiaohongshuVersionId' };
export type XiaohongshuWorkingCopyId = string & { readonly __brand: 'XiaohongshuWorkingCopyId' };
export type XiaohongshuApprovalId = string & { readonly __brand: 'XiaohongshuApprovalId' };
export type XiaohongshuRunId = string & { readonly __brand: 'XiaohongshuRunId' };

export interface PackagingPlanPage {
  readonly pageId: string;
  readonly purpose: string;
  readonly researchItemIds: readonly string[];
  readonly opinionVersionId: OpinionVersionId | null;
}
export interface PackagingPlan {
  readonly narrativePattern: 'problem_to_practice';
  readonly platformProfileVersion: typeof XIAOHONGSHU_PROFILE_VERSION;
  readonly pages: readonly PackagingPlanPage[];
}
export interface XiaohongshuPage {
  readonly id: string;
  readonly purpose: string;
  readonly heading: string;
  readonly content: string;
  readonly emphasis: 'headline' | 'body' | 'quote';
  readonly density: 'low' | 'medium';
  readonly visualBrief: string;
  readonly researchItemIds: readonly string[];
  readonly opinionVersionId: OpinionVersionId | null;
}
export interface XiaohongshuBody {
  readonly platformProfileVersion: typeof XIAOHONGSHU_PROFILE_VERSION;
  readonly contentMode: BlogContentMode;
  readonly platformTitleCandidates: readonly string[];
  readonly selectedPlatformTitle: string;
  readonly coverTitle: string;
  readonly coverSubtitle: string | null;
  readonly pages: readonly XiaohongshuPage[];
  readonly caption: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly publicReferences: readonly { readonly label: string; readonly sourceVersionId: string }[];
}
export interface XiaohongshuValidationSummary {
  readonly schemaVersion: 'xiaohongshu-validation/v1';
  readonly result: 'passed';
  readonly pageCount: 8;
  readonly contentMode: BlogContentMode;
  readonly warningAcknowledgements: readonly string[];
}
export interface XiaohongshuVersionState {
  readonly id: XiaohongshuVersionId;
  readonly versionNumber: number;
  readonly plan: PackagingPlan;
  readonly body: XiaohongshuBody;
  readonly researchVersionId: ResearchVersionId;
  readonly opinionVersionId: OpinionVersionId | null;
  readonly createdAt: Date;
}
export interface XiaohongshuState {
  readonly artifactId: XiaohongshuArtifactId;
  readonly packageId: ContentPackageId;
  readonly workingCopy: {
    readonly body: XiaohongshuBody;
    readonly revision: number;
    readonly checkpointedRevision: number | null;
  };
  readonly latestVersion: XiaohongshuVersionState;
  readonly approvedVersion: XiaohongshuVersionState | null;
  readonly approvedVersionId: XiaohongshuVersionId | null;
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly approvalValidationSummary: XiaohongshuValidationSummary | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number): string {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    Buffer.byteLength(value) > max ||
    value.includes('\0') ||
    LONE_SURROGATE.test(value)
  )
    throw new BlogError('INVALID_BLOG');
  return value;
}

export function xiaohongshuBoundToFoundation(
  body: XiaohongshuBody,
  plan: PackagingPlan,
  foundation: ApprovedBlogFoundation,
): boolean {
  const eligibleItems = new Set(
    foundation.researchBody.items.filter((item) => USABLE_RESEARCH_STATES.has(item.reviewState)).map((item) => item.id),
  );
  const expectedOpinion = body.contentMode === 'creator_led' ? foundation.opinionVersionId : null;
  const expectedMode = foundation.opinionVersionId ? 'creator_led' : 'research_based';
  const actualReferences = body.publicReferences.map((reference) => reference.sourceVersionId).sort();
  const expectedReferences = foundation.sourceInputs.map((source) => source.sourceVersionId).sort();
  return (
    body.contentMode === expectedMode &&
    JSON.stringify(actualReferences) === JSON.stringify(expectedReferences) &&
    plan.pages.every((planPage) => {
      const bodyPage = body.pages.find((page) => page.id === planPage.pageId);
      return (
        bodyPage !== undefined &&
        planPage.researchItemIds.every((id) => eligibleItems.has(id)) &&
        planPage.opinionVersionId === expectedOpinion &&
        JSON.stringify(bodyPage.researchItemIds) === JSON.stringify(planPage.researchItemIds) &&
        bodyPage.opinionVersionId === planPage.opinionVersionId
      );
    })
  );
}

function boundedPageContent(prefix: string, value: string, maxBytes = 780): string {
  let result = prefix;
  for (const character of value.trim()) {
    if (Buffer.byteLength(result + character) > maxBytes) break;
    result += character;
  }
  return result;
}

function nullableText(value: unknown, max: number): string | null {
  return value === null ? null : text(value, max);
}

export function validatePackagingPlan(value: unknown): PackagingPlan {
  if (
    !record(value) ||
    value.narrativePattern !== 'problem_to_practice' ||
    value.platformProfileVersion !== XIAOHONGSHU_PROFILE_VERSION ||
    !Array.isArray(value.pages) ||
    value.pages.length !== 8
  )
    throw new BlogError('INVALID_BLOG');
  const pages = value.pages.map((page): PackagingPlanPage => {
    if (!record(page) || !Array.isArray(page.researchItemIds) || page.researchItemIds.length < 1)
      throw new BlogError('INVALID_BLOG');
    return {
      pageId: text(page.pageId, 50),
      purpose: text(page.purpose, 100),
      researchItemIds: page.researchItemIds.map((id) => text(id, 100)),
      opinionVersionId: page.opinionVersionId === null ? null : (text(page.opinionVersionId, 100) as OpinionVersionId),
    };
  });
  if (
    new Set(pages.map((page) => page.pageId)).size !== 8 ||
    pages.some((page, index) => page.pageId !== `page-${index + 1}`)
  )
    throw new BlogError('INVALID_BLOG');
  return { narrativePattern: 'problem_to_practice', platformProfileVersion: XIAOHONGSHU_PROFILE_VERSION, pages };
}

export function validateXiaohongshuBody(value: unknown): XiaohongshuBody {
  if (
    !record(value) ||
    value.platformProfileVersion !== XIAOHONGSHU_PROFILE_VERSION ||
    (value.contentMode !== 'creator_led' && value.contentMode !== 'research_based') ||
    !Array.isArray(value.platformTitleCandidates) ||
    value.platformTitleCandidates.length !== 3 ||
    !Array.isArray(value.pages) ||
    value.pages.length !== 8 ||
    !Array.isArray(value.hashtags) ||
    value.hashtags.length < 3 ||
    value.hashtags.length > 8 ||
    !Array.isArray(value.publicReferences) ||
    value.publicReferences.length < 1
  )
    throw new BlogError('INVALID_BLOG');
  const titles = value.platformTitleCandidates.map((title) => text(title, 100));
  const pages = value.pages.map((page): XiaohongshuPage => {
    if (
      !record(page) ||
      !Array.isArray(page.researchItemIds) ||
      page.researchItemIds.length < 1 ||
      !['headline', 'body', 'quote'].includes(String(page.emphasis)) ||
      !['low', 'medium'].includes(String(page.density))
    )
      throw new BlogError('INVALID_BLOG');
    return {
      id: text(page.id, 50),
      purpose: text(page.purpose, 100),
      heading: text(page.heading, 100),
      content: text(page.content, 1_000),
      emphasis: page.emphasis as XiaohongshuPage['emphasis'],
      density: page.density as XiaohongshuPage['density'],
      visualBrief: text(page.visualBrief, 300),
      researchItemIds: page.researchItemIds.map((id) => text(id, 100)),
      opinionVersionId: page.opinionVersionId === null ? null : (text(page.opinionVersionId, 100) as OpinionVersionId),
    };
  });
  if (new Set(pages.map((page) => page.id)).size !== 8) throw new BlogError('INVALID_BLOG');
  const publicReferences = value.publicReferences.map((reference) => {
    if (!record(reference)) throw new BlogError('INVALID_BLOG');
    return { label: text(reference.label, 200), sourceVersionId: text(reference.sourceVersionId, 100) };
  });
  const body: XiaohongshuBody = {
    platformProfileVersion: XIAOHONGSHU_PROFILE_VERSION,
    contentMode: value.contentMode,
    platformTitleCandidates: titles,
    selectedPlatformTitle: text(value.selectedPlatformTitle, 100),
    coverTitle: text(value.coverTitle, 80),
    coverSubtitle: nullableText(value.coverSubtitle, 120),
    pages,
    caption: text(value.caption, 2_000),
    cta: text(value.cta, 200),
    hashtags: value.hashtags.map((tag) => text(tag, 50)),
    publicReferences,
  };
  if (!titles.includes(body.selectedPlatformTitle)) throw new BlogError('INVALID_BLOG');
  const combined = [
    body.selectedPlatformTitle,
    body.coverTitle,
    body.coverSubtitle ?? '',
    ...body.pages.flatMap((page) => [page.heading, page.content]),
    body.caption,
    body.cta,
  ].join('\n');
  if (body.contentMode === 'research_based' && FIRST_PERSON.test(combined)) throw new BlogError('INVALID_BLOG');
  if (body.contentMode === 'research_based' && body.pages.some((page) => page.opinionVersionId !== null))
    throw new BlogError('INVALID_BLOG');
  return body;
}

export function validateXiaohongshu(body: XiaohongshuBody, plan: PackagingPlan): XiaohongshuValidationSummary {
  const validated = validateXiaohongshuBody(body);
  const validatedPlan = validatePackagingPlan(plan);
  if (
    validated.pages.some(
      (page) => !validatedPlan.pages.some((entry) => entry.pageId === page.id && entry.purpose === page.purpose),
    )
  )
    throw new BlogError('INVALID_BLOG');
  const normalizedContents = validated.pages.map((page) => page.content.trim().replace(/\s+/gu, ''));
  if (new Set(normalizedContents).size !== validated.pages.length) throw new BlogError('INVALID_BLOG');
  if (validated.pages.some((page) => Buffer.byteLength(page.content) > (page.density === 'low' ? 400 : 800)))
    throw new BlogError('INVALID_BLOG');
  if (validated.pages.some((page) => validated.caption.includes(page.content))) throw new BlogError('INVALID_BLOG');
  return {
    schemaVersion: 'xiaohongshu-validation/v1',
    result: 'passed',
    pageCount: 8,
    contentMode: validated.contentMode,
    warningAcknowledgements: [],
  };
}

export class FakePackagingProvider {
  readonly alias = 'fake-packaging-v1';
  async generate(foundation: ApprovedBlogFoundation, mode: BlogContentMode): Promise<string> {
    const item = foundation.researchBody.items.find((candidate) => USABLE_RESEARCH_STATES.has(candidate.reviewState));
    if (!item) throw new BlogError('BLOG_PROVIDER_OUTPUT_INVALID');
    if (mode === 'creator_led' && (!foundation.opinionVersionId || !foundation.confirmedOpinion))
      throw new BlogError('CONFIRMED_OPINION_REQUIRED');
    const purposes = ['hook', 'context', 'evidence', 'meaning', 'perspective', 'practice', 'checklist', 'close'];
    const plan: PackagingPlan = {
      narrativePattern: 'problem_to_practice',
      platformProfileVersion: XIAOHONGSHU_PROFILE_VERSION,
      pages: purposes.map((purpose, index) => ({
        pageId: `page-${index + 1}`,
        purpose,
        researchItemIds: [item.id],
        opinionVersionId: mode === 'creator_led' ? foundation.opinionVersionId : null,
      })),
    };
    const contentByPurpose: Record<string, string> = {
      hook: '先看结论：可靠创作从核验事实开始。',
      context: boundedPageContent('背景依据：', item.text),
      evidence: boundedPageContent('核心证据：', item.evidence[0]?.snippet ?? item.text),
      meaning: '这意味着内容判断应保留来源与适用边界。',
      perspective:
        mode === 'creator_led'
          ? boundedPageContent('创作者判断：', foundation.confirmedOpinion!)
          : '基于资料可形成审慎判断，但不虚构个人经历。',
      practice: '实践步骤：先核对来源，再提炼判断，最后决定行动。',
      checklist: '检查清单：事实、来源、边界和下一步是否都清楚。',
      close: '收束：把可验证的信息转化为可复查的行动。',
    };
    const body: XiaohongshuBody = {
      platformProfileVersion: XIAOHONGSHU_PROFILE_VERSION,
      contentMode: mode,
      platformTitleCandidates: ['把证据变成行动', '读完这份证据之后', '8页讲清一个判断'],
      selectedPlatformTitle: '把证据变成行动',
      coverTitle: '把证据变成行动',
      coverSubtitle: '8页讲清事实、判断与下一步',
      pages: plan.pages.map((page, index) => ({
        id: page.pageId,
        purpose: page.purpose,
        heading: `${index + 1}. ${page.purpose}`,
        content: contentByPurpose[page.purpose]!,
        emphasis: index === 0 ? 'headline' : 'body',
        density: 'medium',
        visualBrief: 'Clear editorial card with one primary message.',
        researchItemIds: page.researchItemIds,
        opinionVersionId: page.opinionVersionId,
      })),
      caption: '八页内容分别呈现结论、背景、证据、意义与行动路径；完整依据请查看原始来源。',
      cta: '收藏并核对原始来源。',
      hashtags: ['#内容研究', '#证据', '#创作'],
      publicReferences: foundation.sourceInputs.map((source) => ({
        label: source.label ?? 'Source',
        sourceVersionId: source.sourceVersionId,
      })),
    };
    validateXiaohongshu(body, plan);
    return JSON.stringify({ plan, body });
  }
}

export interface PackagingProvider {
  readonly alias: string;
  generate(foundation: ApprovedBlogFoundation, mode: BlogContentMode): Promise<string>;
}

export interface XiaohongshuRepository {
  requireActivePackage(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<void>;
  foundation(
    packageId: ContentPackageId,
    ownerId: ContentPackageOwnerId,
    mode: BlogContentMode,
  ): Promise<ApprovedBlogFoundation>;
  xiaohongshu(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<XiaohongshuState | null>;
  create(input: {
    readonly requestId: string;
    readonly runId: XiaohongshuRunId;
    readonly artifactId: XiaohongshuArtifactId;
    readonly workingCopyId: XiaohongshuWorkingCopyId;
    readonly versionId: XiaohongshuVersionId;
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly plan: PackagingPlan;
    readonly body: XiaohongshuBody;
    readonly foundation: ApprovedBlogFoundation;
    readonly now: Date;
  }): Promise<XiaohongshuState>;
  update(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly body: XiaohongshuBody;
    readonly now: Date;
  }): Promise<XiaohongshuState>;
  checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly versionId: XiaohongshuVersionId;
    readonly now: Date;
  }): Promise<XiaohongshuState>;
  approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: XiaohongshuVersionId;
    readonly approvalId: XiaohongshuApprovalId;
    readonly now: Date;
  }): Promise<XiaohongshuState>;
}

export interface XiaohongshuIds {
  artifact(): XiaohongshuArtifactId;
  version(): XiaohongshuVersionId;
  workingCopy(): XiaohongshuWorkingCopyId;
  approval(): XiaohongshuApprovalId;
  run(): XiaohongshuRunId;
}

function immutableBodyEqual(left: XiaohongshuBody, right: XiaohongshuBody): boolean {
  const immutable = (body: XiaohongshuBody) => ({
    platformProfileVersion: body.platformProfileVersion,
    contentMode: body.contentMode,
    publicReferences: body.publicReferences,
    provenance: body.pages
      .map((page) => ({
        id: page.id,
        purpose: page.purpose,
        researchItemIds: page.researchItemIds,
        opinionVersionId: page.opinionVersionId,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
  return JSON.stringify(immutable(left)) === JSON.stringify(immutable(right));
}

export class XiaohongshuService {
  constructor(
    private readonly repository: XiaohongshuRepository,
    private readonly provider: PackagingProvider,
    private readonly ids: XiaohongshuIds,
    private readonly clock: { now(): Date },
  ) {}

  async state(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<XiaohongshuState> {
    await this.repository.requireActivePackage(packageId, ownerId);
    const state = await this.repository.xiaohongshu(packageId, ownerId);
    if (!state) throw new BlogError('BLOG_NOT_FOUND');
    return state;
  }

  async generate(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly requestId: string;
    readonly contentMode: BlogContentMode;
  }): Promise<XiaohongshuState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    const foundation = await this.repository.foundation(input.packageId, input.ownerId, input.contentMode);
    const rawOutput = await this.provider.generate(foundation, input.contentMode);
    let plan: PackagingPlan;
    let body: XiaohongshuBody;
    try {
      const parsed = JSON.parse(rawOutput) as { plan?: unknown; body?: unknown };
      plan = validatePackagingPlan(parsed.plan);
      body = validateXiaohongshuBody(parsed.body);
      validateXiaohongshu(body, plan);
      if (body.contentMode !== input.contentMode || !xiaohongshuBoundToFoundation(body, plan, foundation))
        throw new BlogError('BLOG_PROVIDER_OUTPUT_INVALID');
    } catch {
      throw new BlogError('BLOG_PROVIDER_OUTPUT_INVALID');
    }
    return this.repository.create({
      requestId: input.requestId,
      runId: this.ids.run(),
      artifactId: this.ids.artifact(),
      workingCopyId: this.ids.workingCopy(),
      versionId: this.ids.version(),
      packageId: input.packageId,
      ownerId: input.ownerId,
      providerAlias: this.provider.alias,
      rawOutput,
      plan,
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
  }): Promise<XiaohongshuState> {
    const state = await this.state(input.packageId, input.ownerId);
    const body = validateXiaohongshuBody(input.body);
    if (!immutableBodyEqual(body, state.workingCopy.body)) throw new BlogError('INVALID_BLOG');
    return this.repository.update({ ...input, body, now: this.clock.now() });
  }

  async checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
  }): Promise<XiaohongshuState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    return this.repository.checkpoint({ ...input, versionId: this.ids.version(), now: this.clock.now() });
  }

  async approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: XiaohongshuVersionId;
  }): Promise<XiaohongshuState> {
    await this.repository.requireActivePackage(input.packageId, input.ownerId);
    return this.repository.approve({ ...input, approvalId: this.ids.approval(), now: this.clock.now() });
  }

  async exportMarkdown(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<string> {
    const state = await this.state(packageId, ownerId);
    if (!state.approvedVersion || state.outdated) throw new BlogError('BLOG_EXPORT_NOT_ELIGIBLE');
    const body = state.approvedVersion.body;
    const pages = body.pages
      .map((page, index) => `## Page ${index + 1}: ${page.heading}\n\n${page.content}`)
      .join('\n\n');
    const references = body.publicReferences
      .map((reference) => `- ${reference.label} (${reference.sourceVersionId})`)
      .join('\n');
    return `---\ncontentosArtifactId: ${state.artifactId}\ncontentosVersionId: ${state.approvedVersion.id}\nplatformProfileVersion: ${body.platformProfileVersion}\n---\n\n# ${body.selectedPlatformTitle}\n\n${pages}\n\n## Caption\n\n${body.caption}\n\n${body.cta}\n\n${body.hashtags.join(' ')}\n\n## References\n\n${references}\n`;
  }

  async exportJson(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<string> {
    const state = await this.state(packageId, ownerId);
    if (!state.approvedVersion || state.outdated) throw new BlogError('BLOG_EXPORT_NOT_ELIGIBLE');
    return `${JSON.stringify(
      {
        artifactId: state.artifactId,
        versionId: state.approvedVersion.id,
        platformProfileVersion: state.approvedVersion.body.platformProfileVersion,
        body: state.approvedVersion.body,
      },
      null,
      2,
    )}\n`;
  }
}
