import { describe, expect, it, vi } from 'vitest';

import { TimelineRefreshCoordinator, appendTimelinePage, timelineItemView } from './workflow-timeline-view';

describe('workflow Timeline view', () => {
  it('maps safe events and appends deduplicated ascending sequences', () => {
    const requested = {
      sequence: 2,
      nodeKey: 'private',
      occurredAt: '2026-08-07T00:00:00.000Z',
      kind: 'url_capture_requested.v1',
    } as const;
    const recovered = {
      sequence: 1,
      nodeKey: 'private',
      occurredAt: '2026-08-07T00:00:00.000Z',
      kind: 'fetcher_lease_expired.v1',
      attemptNumber: 2,
    } as const;
    expect(timelineItemView(requested).label).toBe('URL capture requested');
    expect(appendTimelinePage([requested], [requested, recovered])).toEqual([recovered, requested]);
  });

  it.each([
    ['validation_blocked', 'URL capture was blocked safely'],
    ['redirect_blocked', 'URL capture was blocked safely'],
    ['unsupported_content', 'URL capture found unsupported content'],
    ['too_large', 'URL capture exceeded the size limit'],
    ['timeout', 'URL capture timed out'],
    ['package_archived', 'URL capture stopped because the package is archived'],
    ['source_role_limit', 'URL capture could not add a Source'],
    ['object_integrity_failed', 'URL capture failed'],
    ['extraction_failed', 'URL capture failed'],
    ['fetch_failed', 'URL capture failed'],
  ] as const)('maps %s to fixed safe copy', (category, label) => {
    expect(
      timelineItemView({
        sequence: 1,
        nodeKey: 'private',
        occurredAt: '2026-08-07T00:00:00.000Z',
        kind: 'url_capture_failed.v1',
        failure: { category },
      }).label,
    ).toBe(label);
  });

  it('maps every accepted non-failure event kind to fixed safe copy', () => {
    const common = { sequence: 1, nodeKey: 'private', occurredAt: '2026-08-07T00:00:00.000Z' } as const;
    expect(timelineItemView({ ...common, kind: 'url_capture_requested.v1' }).label).toBe('URL capture requested');
    expect(timelineItemView({ ...common, kind: 'fetcher_lease_expired.v1', attemptNumber: 2 }).label).toBe(
      'URL capture recovery scheduled',
    );
    expect(timelineItemView({ ...common, kind: 'url_capture_succeeded.v1', sourceId: 'private' }).label).toBe(
      'URL Source captured',
    );
    expect(timelineItemView({ ...common, kind: 'workflow_event.v1', eventType: 'private' }).label).toBe(
      'Workflow updated',
    );
  });

  it('serializes refreshes and coalesces changes arriving during one in-flight request', async () => {
    const pending: ((value: string) => void)[] = [];
    const load = vi.fn(
      (_packageId: string, after: number) =>
        new Promise<string>((resolve) => {
          pending.push((value) => resolve(`${after}:${value}`));
        }),
    );
    const applied: string[] = [];
    let cursor = 0;
    const coordinator = new TimelineRefreshCoordinator(load, {
      onSuccess: (value) => applied.push(value),
      onFailure: vi.fn(),
      onLoading: vi.fn(),
    });
    coordinator.startSession('package-a', () => cursor);
    cursor = 4;
    coordinator.request(() => cursor);
    cursor = 7;
    coordinator.request(() => cursor);
    expect(load).toHaveBeenCalledTimes(1);
    pending.shift()?.('initial');
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(load).toHaveBeenLastCalledWith('package-a', 7);
    pending.shift()?.('recovered');
    await vi.waitFor(() => expect(applied).toEqual(['0:initial', '7:recovered']));
  });

  it('fences an old Package response from the next Package session', async () => {
    const pending = new Map<string, (value: string) => void>();
    const load = vi.fn(
      (packageId: string) =>
        new Promise<string>((resolve) => {
          pending.set(packageId, resolve);
        }),
    );
    const applied: string[] = [];
    const failures: unknown[] = [];
    const coordinator = new TimelineRefreshCoordinator(load, {
      onSuccess: (value) => applied.push(value),
      onFailure: (cause) => failures.push(cause),
      onLoading: vi.fn(),
    });
    coordinator.startSession('package-a', () => 0);
    coordinator.startSession('package-b', () => 0);
    pending.get('package-a')?.('stale');
    pending.get('package-b')?.('current');
    await vi.waitFor(() => expect(applied).toEqual(['current']));
    expect(failures).toEqual([]);
  });

  it('retains confirmed items after a failed refresh and appends the authoritative retry', async () => {
    const requested = {
      sequence: 1,
      nodeKey: 'source_capture',
      occurredAt: '2026-08-07T00:00:00.000Z',
      kind: 'url_capture_requested.v1',
    } as const;
    const succeeded = {
      sequence: 2,
      nodeKey: 'source_capture',
      occurredAt: '2026-08-07T00:00:01.000Z',
      kind: 'url_capture_succeeded.v1',
      attemptNumber: 1,
    } as const;
    let attempt = 0;
    const load = vi.fn(async () => {
      attempt += 1;
      if (attempt === 2) throw new Error('safe test failure');
      return attempt === 1 ? [requested] : [requested, succeeded];
    });
    let confirmed = [] as readonly (typeof requested | typeof succeeded)[];
    let stale = false;
    const coordinator = new TimelineRefreshCoordinator(load, {
      onSuccess: (items) => {
        confirmed = appendTimelinePage(confirmed, items);
        stale = false;
      },
      onFailure: () => {
        stale = true;
      },
      onLoading: vi.fn(),
    });

    coordinator.startSession('package-a', () => 0);
    await vi.waitFor(() => expect(confirmed).toEqual([requested]));
    coordinator.request(() => 1);
    await vi.waitFor(() => expect(stale).toBe(true));
    expect(confirmed).toEqual([requested]);
    coordinator.request(() => 1);
    await vi.waitFor(() => expect(confirmed).toEqual([requested, succeeded]));
    expect(stale).toBe(false);
  });
});
