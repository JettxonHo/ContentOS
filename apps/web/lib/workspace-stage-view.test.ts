import { describe, expect, it } from 'vitest';

import type { BlogResource, ResearchResource, SourceResource, XiaohongshuResource } from '@contentos/contracts';

import { deriveCandidateAction, deriveWorkspaceStageProjection } from './workspace-stage-view';

const source = (overrides: Partial<SourceResource> = {}): SourceResource =>
  ({
    id: 'source',
    contentPackageId: 'package',
    sourceType: 'pasted_text',
    role: 'primary',
    label: 'Primary',
    captureType: 'manual',
    createdAt: '2026-08-14T00:00:00.000Z',
    workingCopy: { revision: 1, schemaVersion: 'source/v1', updatedAt: '2026-08-14T00:00:00.000Z' },
    rawSnapshot: {
      sha256: 'a'.repeat(64),
      byteSize: 1,
      contentType: 'text/plain',
      capturedAt: '2026-08-14T00:00:00.000Z',
    },
    latestVersionId: 'source-v1',
    reviewCandidateVersionId: 'source-v1',
    approvedVersionId: 'source-v1',
    ...overrides,
  }) as SourceResource;

const candidate = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'artifact',
    contentPackageId: 'package',
    outdated: false,
    reviewCandidateOutdated: false,
    workingCopy: { revision: 1, checkpointedRevision: 1, body: {} },
    latestVersion: { id: 'v1', body: { contentMode: 'research_based' } },
    approvedVersionId: null,
    approvalValidationSummary: null,
    ...overrides,
  }) as unknown as ResearchResource;

const base = () => ({
  lifecycle: 'active' as const,
  configuredMode: 'research_based' as const,
  requestedOutputs: ['blog', 'xiaohongshu'] as const,
  loading: false,
  readError: false,
  sources: [source()],
  research: candidate({ approvedVersionId: 'v1' }),
  opinion: null,
  blog: null,
  xiaohongshu: null,
});

describe('workspace stage projection', () => {
  it('distinguishes loading, read failure, and missing prerequisites', () => {
    expect(deriveWorkspaceStageProjection({ ...base(), loading: true }).research.status).toBe('loading');
    expect(deriveWorkspaceStageProjection({ ...base(), readError: true }).research.status).toBe('blocked');
    const missing = deriveWorkspaceStageProjection({ ...base(), sources: [], research: null });
    expect(missing.sources).toMatchObject({ status: 'ready', nextAction: '添加主资料' });
    expect(missing.research).toMatchObject({ status: 'blocked', nextAction: '批准主资料' });
  });

  it('shows an old outdated Approval with a fresh candidate as In review', () => {
    const research = candidate({ outdated: true, reviewCandidateOutdated: false, approvedVersionId: 'old-v1' });
    const result = deriveWorkspaceStageProjection({ ...base(), research });
    expect(result.research).toMatchObject({ status: 'in_review', label: '待审核' });
  });

  it('shows a stale current candidate as Outdated', () => {
    const research = candidate({ outdated: true, reviewCandidateOutdated: true, approvedVersionId: 'old-v1' });
    expect(deriveWorkspaceStageProjection({ ...base(), research }).research).toMatchObject({
      status: 'outdated',
      nextAction: '生成新版研究候选',
    });
  });

  it('routes stale Creator-led Opinion through re-interpretation', () => {
    const result = deriveWorkspaceStageProjection({
      ...base(),
      configuredMode: 'creator_led',
      opinion: {
        question: 'Question',
        rawResponse: 'Retained response',
        interpretation: 'Old interpretation',
        revision: 2,
        confirmedVersionId: 'opinion-v1',
        confirmedStatement: 'Old interpretation',
        researchVersionId: 'research-v0',
        outdated: true,
      },
    });
    expect(result['opinion-blog']).toMatchObject({
      status: 'outdated',
      nextAction: '基于当前研究重新解读',
    });
  });

  it('does not require Opinion in Research-based mode', () => {
    const result = deriveWorkspaceStageProjection({ ...base(), opinion: null, blog: null });
    expect(result['opinion-blog']).toMatchObject({ status: 'ready', nextAction: '生成文章候选' });
    expect(result.xiaohongshu).toMatchObject({ status: 'ready', nextAction: '生成小红书候选' });
  });

  it('requires an explicit content-mode choice when the package is deferred', () => {
    const result = deriveWorkspaceStageProjection({ ...base(), configuredMode: 'deferred' });
    expect(result['opinion-blog']).toMatchObject({
      status: 'ready',
      nextAction: '选择内容模式',
    });
  });

  it('shows a fresh XHS candidate as In review even while an older Approval is outdated', () => {
    const xiaohongshu = candidate({
      outdated: true,
      reviewCandidateOutdated: false,
      approvedVersionId: 'old-v1',
    }) as unknown as XiaohongshuResource;
    expect(deriveWorkspaceStageProjection({ ...base(), xiaohongshu }).xiaohongshu.status).toBe('in_review');
  });
});

describe('candidate next action', () => {
  it('uses save, checkpoint, approval, and export in order', () => {
    const resource = candidate() as unknown as BlogResource;
    expect(deriveCandidateAction({ resource, dirty: true, active: true, busy: false, noun: 'Blog' }).id).toBe('save');
    expect(
      deriveCandidateAction({
        resource: { ...resource, workingCopy: { ...resource.workingCopy, checkpointedRevision: null } },
        dirty: false,
        active: true,
        busy: false,
        noun: 'Blog',
      }).id,
    ).toBe('checkpoint');
    expect(deriveCandidateAction({ resource, dirty: false, active: true, busy: false, noun: 'Blog' }).id).toBe(
      'approve',
    );
    expect(
      deriveCandidateAction({
        resource: { ...resource, approvedVersionId: resource.latestVersion.id },
        dirty: false,
        active: true,
        busy: false,
        noun: 'Blog',
        exportLabel: 'Export article.md',
      }).id,
    ).toBe('export');
  });
});
