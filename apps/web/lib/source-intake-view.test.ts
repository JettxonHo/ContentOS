import { describe, expect, it } from 'vitest';

import {
  intakeFailureCopy,
  reconcileUrlSubmission,
  SourceRefreshCoordinator,
  sourceIntakeView,
  sourceTypeLabel,
} from './source-intake-view.js';

const source = (
  id: string,
  role: 'primary' | 'supporting',
  sourceType: 'pasted_text' | 'uploaded_text' | 'public_url',
) => ({
  id,
  contentPackageId: 'package',
  role,
  sourceType,
  label: null,
  captureType: sourceType,
  createdAt: '2026-08-07T00:00:00.000Z',
});

describe('source intake view', () => {
  it('reserves queued URL capacity without representing it as a formal Source', () => {
    const view = sourceIntakeView(
      [source('support-1', 'supporting', 'pasted_text')],
      [
        {
          id: 'request',
          role: 'primary',
          submittedUrl: 'https://example.test',
          createdAt: 'now',
          updatedAt: 'now',
          status: 'queued',
          failure: null,
          sourceId: null,
        },
      ],
    );
    expect(view.primary).toEqual({ used: 1, limit: 1, available: false });
    expect(view.visibleSources).toHaveLength(1);
  });

  it('does not reserve failed URL capacity and derives bounded safe copy', () => {
    const intake = {
      id: 'request',
      role: 'supporting' as const,
      submittedUrl: 'https://example.test',
      createdAt: 'now',
      updatedAt: 'now',
      status: 'failed' as const,
      failure: { category: 'timeout' as const, code: 'TIMEOUT' as const },
      sourceId: null,
    };
    expect(sourceIntakeView([], [intake]).supporting.available).toBe(true);
    expect(intakeFailureCopy(intake)).toBe('This URL did not finish capturing in time.');
    expect(sourceTypeLabel(source('source', 'primary', 'uploaded_text'))).toBe('Uploaded text');
  });

  it('deduplicates success only when the exact formal Source is available', () => {
    const intake = {
      id: 'request',
      role: 'primary' as const,
      submittedUrl: 'https://example.test',
      createdAt: 'now',
      updatedAt: 'now',
      status: 'succeeded' as const,
      failure: null,
      sourceId: 'url-source',
    };
    expect(sourceIntakeView([source('url-source', 'primary', 'public_url')], [intake]).showIntakeActivity).toBe(false);
    expect(sourceIntakeView([source('other', 'primary', 'public_url')], [intake]).showIntakeActivity).toBe(true);
    expect(sourceIntakeView([], [intake]).showIntakeActivity).toBe(true);
    const archived = sourceIntakeView(null, [intake]);
    expect(archived.formalSourcesAvailable).toBe(false);
    expect(archived.showIntakeActivity).toBe(true);
  });

  it('tracks a fail-closed URL submission lock until an authoritative empty reconciliation', () => {
    expect(reconcileUrlSubmission('confirming', [])).toBe('idle');
    expect(reconcileUrlSubmission('confirming', [{ id: 'request' } as never])).toBe('confirmed');
    expect(reconcileUrlSubmission('confirmed', [])).toBe('idle');
    expect(reconcileUrlSubmission('confirmed', [{ id: 'request' } as never])).toBe('confirmed');
  });

  it('serializes overlapping refreshes, coalesces notices, and ignores completion after disposal', async () => {
    const resolvers: Array<(value: number) => void> = [];
    let loads = 0;
    const committed: number[] = [];
    const coordinator = new SourceRefreshCoordinator(
      () => {
        loads += 1;
        return new Promise<number>((resolve) => resolvers.push(resolve));
      },
      (value) => committed.push(value),
    );
    const first = coordinator.request();
    const second = coordinator.request();
    const third = coordinator.request();
    expect(loads).toBe(1);
    resolvers[0]?.(1);
    await Promise.resolve();
    expect(loads).toBe(2);
    resolvers[1]?.(2);
    await Promise.all([first, second, third]);
    expect(committed).toEqual([1, 2]);

    const disposed = coordinator.request();
    expect(loads).toBe(3);
    coordinator.dispose();
    resolvers[2]?.(3);
    await disposed;
    expect(committed).toEqual([1, 2]);
  });
});
