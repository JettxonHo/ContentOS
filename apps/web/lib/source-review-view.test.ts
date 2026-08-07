import { describe, expect, it } from 'vitest';

import {
  SourceReviewRecoveryGate,
  SourceReviewRequestFence,
  sourceReviewRefreshDraft,
  sourceReviewView,
} from './source-review-view';

describe('sourceReviewView', () => {
  it('keeps the mutable draft distinct from the checkpointed immutable Version state', () => {
    expect(
      sourceReviewView({ revision: 3, checkpointedRevision: 2, text: 'saved', draft: 'saved', busy: false }),
    ).toMatchObject({
      dirty: false,
      canCreateVersion: true,
      draftNavigationBlocked: false,
    });
    expect(
      sourceReviewView({ revision: 3, checkpointedRevision: 2, text: 'saved', draft: 'edited locally', busy: false }),
    ).toMatchObject({
      dirty: true,
      canCreateVersion: false,
      draftNavigationBlocked: true,
    });
    expect(
      sourceReviewView({ revision: 3, checkpointedRevision: 3, text: 'saved', draft: 'saved', busy: false }),
    ).toMatchObject({
      canCreateVersion: false,
    });
  });

  it('blocks every mutation after a revision conflict while retaining read-only Version review', () => {
    expect(
      sourceReviewView({
        revision: 3,
        checkpointedRevision: 2,
        text: 'saved',
        draft: 'local conflict',
        busy: false,
        revisionConflict: true,
        versionId: 'candidate',
        head: { latestVersionId: 'candidate', reviewCandidateVersionId: 'candidate', approvedVersionId: null },
      }),
    ).toMatchObject({
      canSaveWorkingCopy: false,
      canCreateVersion: false,
      canApproveVersion: false,
    });
  });

  it('derives independent Head badges for one exact immutable Version', () => {
    expect(
      sourceReviewView({
        revision: 1,
        checkpointedRevision: 1,
        text: 'saved',
        draft: 'saved',
        busy: false,
        versionId: 'candidate',
        head: { latestVersionId: 'latest', reviewCandidateVersionId: 'candidate', approvedVersionId: 'approved' },
      }).badges,
    ).toEqual(['Review candidate']);
  });

  it('does not offer Approval when the selected Review Candidate is already the approved Head', () => {
    expect(
      sourceReviewView({
        revision: 1,
        checkpointedRevision: 1,
        text: 'saved',
        draft: 'saved',
        busy: false,
        revisionConflict: false,
        versionId: 'same-head',
        head: {
          latestVersionId: 'same-head',
          reviewCandidateVersionId: 'same-head',
          approvedVersionId: 'same-head',
        },
      }),
    ).toMatchObject({
      badges: ['Latest', 'Review candidate', 'Current approved'],
      canApproveVersion: false,
    });
  });

  it('adopts a recovered authoritative body when refresh started clean and the owner did not type', () => {
    expect(
      sourceReviewRefreshDraft({
        draft: 'old authoritative',
        baselineAtRefreshStart: 'old authoritative',
        incomingText: 'new authoritative',
        dirtyAtRefreshStart: false,
      }),
    ).toBe('new authoritative');
  });

  it('preserves a draft that was dirty when authoritative recovery started', () => {
    expect(
      sourceReviewRefreshDraft({
        draft: 'local draft',
        baselineAtRefreshStart: 'old authoritative',
        incomingText: 'new authoritative',
        dirtyAtRefreshStart: true,
      }),
    ).toBe('local draft');
  });

  it('preserves owner typing that begins while a clean authoritative refresh is in flight', () => {
    expect(
      sourceReviewRefreshDraft({
        draft: 'new typing during refresh',
        baselineAtRefreshStart: 'old authoritative',
        incomingText: 'new authoritative',
        dirtyAtRefreshStart: false,
      }),
    ).toBe('new typing during refresh');
  });

  it('suppresses every continuation captured by an earlier Source review session', () => {
    const fence = new SourceReviewRequestFence();
    fence.beginSession();
    const initialLoad = fence.capture();
    const save = fence.capture();
    const versionSelection = fence.capture();
    const createVersion = fence.capture();
    const approval = fence.capture();
    fence.beginSession();

    for (const continuation of [initialLoad, save, versionSelection, createVersion, approval]) {
      expect(fence.isCurrent(continuation)).toBe(false);
    }
    expect(fence.isCurrent(fence.capture())).toBe(true);
  });

  it('lets only the newest load in the current session update authoritative review state', () => {
    const fence = new SourceReviewRequestFence();
    fence.beginSession();
    const first = fence.beginLoad();
    const second = fence.beginLoad();
    expect(fence.isLatestLoad(first)).toBe(false);
    expect(fence.isLatestLoad(second)).toBe(true);
    fence.invalidateLoads();
    expect(fence.isLatestLoad(second)).toBe(false);
    fence.dispose();
    expect(fence.isLatestLoad(second)).toBe(false);
  });

  it('invalidates a recovery load that starts after Save begins before committing the Save response', () => {
    const fence = new SourceReviewRequestFence();
    fence.beginSession();
    const save = fence.capture();
    const lateRecovery = fence.beginLoad();

    expect(fence.isLatestLoad(lateRecovery)).toBe(true);
    expect(fence.commitMutation(save)).toBe(true);
    expect(fence.isLatestLoad(lateRecovery)).toBe(false);
  });

  it('defers and coalesces refresh signals while a command is active', () => {
    const gate = new SourceReviewRecoveryGate();
    gate.beginSession(0);
    expect(gate.beginCommand()).toBe(true);

    expect(gate.requestRefresh(1)).toBe(false);
    expect(gate.requestRefresh(2)).toBe(false);
    expect(gate.endCommand()).toBe(true);
    expect(gate.endCommand()).toBe(false);
    expect(gate.requestRefresh(2)).toBe(false);
  });

  it('does not refetch an already handled signal after unrelated busy transitions', () => {
    const gate = new SourceReviewRecoveryGate();
    gate.beginSession(0);

    expect(gate.requestRefresh(1)).toBe(true);
    expect(gate.beginCommand()).toBe(true);
    expect(gate.endCommand()).toBe(false);
    expect(gate.requestRefresh(1)).toBe(false);
  });
});
