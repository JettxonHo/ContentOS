import { Inject, Injectable, Optional, type MessageEvent, type OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';

import type {
  WorkflowNotificationData,
  WorkflowProjectionResource,
  WorkflowTaskProjectionResource,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageOwnerId,
  WorkflowProjection,
  WorkflowQueryPort,
  WorkflowTaskProjection,
} from '@contentos/core';

import { WORKFLOW_QUERY } from '../runtime.tokens.js';

export const MAX_TIMEOUT_MS = 2_147_483_647;
export const WORKFLOW_NOTIFICATION_EVENT = 'workflow-notification/v1';
export const WORKFLOW_KEEPALIVE_EVENT = 'keepalive';

export interface WorkflowNotificationStreamScope {
  readonly packageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expiresAt: Date;
}

interface WorkflowNotificationStreamTiming {
  readonly observationIntervalMs?: number;
  readonly keepaliveIntervalMs?: number;
}

function taskResource(value: WorkflowTaskProjection): WorkflowTaskProjectionResource {
  const base = {
    kind: value.kind,
    attemptNumber: value.attemptNumber,
    updatedAt: value.updatedAt.toISOString(),
  };
  return value.state === 'failed'
    ? { ...base, state: value.state, failure: value.failure }
    : { ...base, state: value.state, failure: null };
}

export function toWorkflowProjectionResource(value: WorkflowProjection): WorkflowProjectionResource {
  return {
    instanceId: value.instanceId,
    templateId: value.templateId,
    templateVersion: value.templateVersion,
    lifecycle: value.lifecycle,
    revision: value.revision,
    latestSequence: value.latestSequence,
    nodes: value.nodes.map((node) => ({
      key: node.key,
      ordinal: node.ordinal,
      kind: node.kind,
      requiresHumanGate: node.requiresHumanGate,
      state: node.state,
      revision: node.revision,
      updatedAt: node.updatedAt.toISOString(),
      task: node.task === null ? null : taskResource(node.task),
    })),
  };
}

export function toWorkflowNotificationData(value: WorkflowProjection | null): WorkflowNotificationData {
  return value === null
    ? { workflowInstanceId: null, latestSequence: 0 }
    : { workflowInstanceId: value.instanceId, latestSequence: value.latestSequence };
}

function marker(value: WorkflowProjection | null): string {
  return JSON.stringify(value === null ? null : toWorkflowProjectionResource(value));
}

@Injectable()
export class WorkflowNotificationStream implements OnModuleDestroy {
  private readonly activeClosers = new Set<() => void>();
  private destroyed = false;

  constructor(
    @Inject(WORKFLOW_QUERY)
    private readonly workflowQuery: WorkflowQueryPort,
    @Optional()
    private readonly timing: WorkflowNotificationStreamTiming = {},
  ) {}

  async preflight(
    scope: Pick<WorkflowNotificationStreamScope, 'packageId' | 'ownerUserId'>,
  ): Promise<WorkflowProjection | null> {
    this.assertNotDestroyed();
    const projection = await this.workflowQuery.getProjection({
      contentPackageId: scope.packageId,
      ownerUserId: scope.ownerUserId,
    });
    this.assertNotDestroyed();
    return projection;
  }

  async open(scope: WorkflowNotificationStreamScope): Promise<Observable<MessageEvent>> {
    if (this.destroyed) {
      return new Observable<MessageEvent>((subscriber) => subscriber.complete());
    }
    let initial: WorkflowProjection | null;
    try {
      initial = await this.preflight(scope);
    } catch (error) {
      if (this.destroyed) return new Observable<MessageEvent>((subscriber) => subscriber.complete());
      throw error;
    }
    if (this.destroyed || scope.expiresAt.getTime() <= Date.now()) {
      return new Observable<MessageEvent>((subscriber) => subscriber.complete());
    }
    const initialMarker = marker(initial);
    const initialNotification = toWorkflowNotificationData(initial);

    return new Observable<MessageEvent>((subscriber) => {
      if (this.destroyed || scope.expiresAt.getTime() <= Date.now()) {
        subscriber.complete();
        return;
      }
      let closed = false;
      let inFlight = false;
      let lastMarker = initialMarker;
      const timers: {
        expiry?: ReturnType<typeof setTimeout>;
        observation?: ReturnType<typeof setInterval>;
        keepalive?: ReturnType<typeof setInterval>;
      } = {};

      const expired = (): boolean => scope.expiresAt.getTime() <= Date.now();

      const close = (): void => {
        if (closed) return;
        closed = true;
        if (timers.observation !== undefined) clearInterval(timers.observation);
        if (timers.keepalive !== undefined) clearInterval(timers.keepalive);
        if (timers.expiry !== undefined) clearTimeout(timers.expiry);
        this.activeClosers.delete(close);
        if (!subscriber.closed) subscriber.complete();
      };

      const scheduleExpiry = (): void => {
        if (closed) return;
        const remaining = scope.expiresAt.getTime() - Date.now();
        if (remaining <= 0) {
          close();
          return;
        }
        timers.expiry = setTimeout(scheduleExpiry, Math.min(remaining, MAX_TIMEOUT_MS));
      };

      const observe = async (): Promise<void> => {
        if (closed || inFlight) return;
        if (this.destroyed || expired()) {
          close();
          return;
        }
        inFlight = true;
        try {
          const next = await this.preflight(scope);
          if (closed) return;
          if (this.destroyed || expired()) {
            close();
            return;
          }
          const nextMarker = marker(next);
          if (nextMarker !== lastMarker) {
            lastMarker = nextMarker;
            subscriber.next({ type: WORKFLOW_NOTIFICATION_EVENT, data: toWorkflowNotificationData(next) });
          }
        } catch {
          close();
        } finally {
          inFlight = false;
        }
      };

      this.activeClosers.add(close);
      scheduleExpiry();
      if (closed) return close;
      subscriber.next({ type: WORKFLOW_NOTIFICATION_EVENT, data: initialNotification });
      if (subscriber.closed || this.destroyed || expired()) {
        close();
        return close;
      }
      timers.observation = setInterval(() => void observe(), this.timing.observationIntervalMs ?? 1_000);
      timers.keepalive = setInterval(() => {
        if (closed) return;
        if (this.destroyed || expired()) {
          close();
          return;
        }
        subscriber.next({ type: WORKFLOW_KEEPALIVE_EVENT, data: {} });
      }, this.timing.keepaliveIntervalMs ?? 15_000);

      return close;
    });
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    for (const close of [...this.activeClosers]) close();
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) throw new Error('workflow_notification_stream_destroyed');
  }
}
