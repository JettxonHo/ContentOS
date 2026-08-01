import { and, eq, sql } from 'drizzle-orm';

import {
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  canonicalWorkflowSerialization,
  defineUrlCaptureEventPayload,
  defineUrlCaptureRequest,
  defineUrlSourceReference,
  defineWorkflowOutboxRecord,
  defineWorkflowNode,
  defineWorkflowTask,
  rehydrateWorkflowInstance,
  rehydrateWorkflowNode,
  rehydrateWorkflowEvent,
  rehydrateWorkflowOutboxRecord,
  rehydrateWorkflowTask,
  UrlCaptureApplicationError,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureCommandRepository,
  type UrlCaptureCommandResult,
  type UrlCapturePersistenceCommand,
  type UrlCaptureRequestState,
  type UrlSourceReferenceState,
  type WorkflowEventState,
  type WorkflowOutboxRecordState,
  type WorkflowInstanceId,
  type WorkflowNodeId,
  type WorkflowTaskId,
  type UrlCaptureRequestId,
  type UrlSourceReferenceId,
  type WorkflowTemplateId,
  type WorkflowTemplateVersion,
  WorkflowDomainError,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import {
  contentPackages,
  sources,
  urlCaptureRequests,
  urlSourceReferences,
  workflowEvents,
  workflowInstances,
  workflowNodes,
  workflowOutboxRecords,
  workflowTasks,
  workflowTemplates,
} from './schema.js';

export type UrlCapturePersistenceStage =
  | 'workflow_instance'
  | 'workflow_node'
  | 'url_source_reference'
  | 'url_capture_request'
  | 'workflow_task'
  | 'workflow_outbox'
  | 'workflow_event';

export interface WorkflowCommandRepositoryOptions {
  readonly afterStage?: (stage: UrlCapturePersistenceStage) => void | Promise<void>;
}

type WorkflowTransaction = Parameters<Parameters<DatabaseConnection['db']['transaction']>[0]>[0];
type UrlSourceReferenceRow = typeof urlSourceReferences.$inferSelect;
type UrlCaptureRequestRow = typeof urlCaptureRequests.$inferSelect;
type WorkflowTaskRow = typeof workflowTasks.$inferSelect;

const TEMPLATE_ID = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId as WorkflowTemplateId;
const TEMPLATE_VERSION = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion as WorkflowTemplateVersion;

function afterStage(options: WorkflowCommandRepositoryOptions, stage: UrlCapturePersistenceStage): Promise<void> {
  return Promise.resolve(options.afterStage?.(stage));
}

function asUrlSourceReference(row: UrlSourceReferenceRow): UrlSourceReferenceState {
  return defineUrlSourceReference({
    id: row.id as UrlSourceReferenceId,
    contentPackageId: row.contentPackageId as ContentPackageId,
    ownerUserId: row.ownerUserId as ContentPackageOwnerId,
    role: row.role as 'primary' | 'supporting',
    submittedUrl: row.submittedUrl,
    createdAt: row.createdAt,
  });
}

function asWorkflowInstance(row: typeof workflowInstances.$inferSelect) {
  return rehydrateWorkflowInstance(
    {
      id: row.id as WorkflowInstanceId,
      contentPackageId: row.contentPackageId as ContentPackageId,
      ownerUserId: row.ownerUserId as ContentPackageOwnerId,
      templateId: row.templateId as WorkflowTemplateId,
      templateVersion: row.templateVersion as WorkflowTemplateVersion,
      definitionSha256: row.definitionSha256,
      lifecycle: row.lifecycle as 'active' | 'paused' | 'completed' | 'failed' | 'cancelled',
      revision: row.revision,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  );
}

function asWorkflowNode(row: typeof workflowNodes.$inferSelect, instance: ReturnType<typeof asWorkflowInstance>) {
  return rehydrateWorkflowNode(
    {
      id: row.id as WorkflowNodeId,
      workflowInstanceId: row.workflowInstanceId as WorkflowInstanceId,
      contentPackageId: row.contentPackageId as ContentPackageId,
      ownerUserId: row.ownerUserId as ContentPackageOwnerId,
      templateId: row.templateId as WorkflowTemplateId,
      templateVersion: row.templateVersion as WorkflowTemplateVersion,
      templateNodeKey: row.templateNodeKey as never,
      state: row.state as
        'not_ready' | 'ready' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped' | 'cancelled',
      revision: row.revision,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    instance,
    CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  );
}

function resultFromRows(request: UrlCaptureRequestRow, task: WorkflowTaskRow): UrlCaptureCommandResult {
  const taskState = rehydrateWorkflowTask({
    id: task.id as WorkflowTaskId,
    workflowInstanceId: task.workflowInstanceId as WorkflowInstanceId,
    workflowNodeId: task.workflowNodeId as WorkflowNodeId,
    urlCaptureRequestId: task.urlCaptureRequestId as UrlCaptureRequestId,
    contentPackageId: task.contentPackageId as ContentPackageId,
    ownerUserId: task.ownerUserId as ContentPackageOwnerId,
    kind: task.kind as 'url_capture',
    state: task.state as 'queued',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
  return {
    urlCaptureRequestId: request.id as UrlCaptureRequestId,
    contentPackageId: request.contentPackageId as ContentPackageId,
    sourceReferenceId: request.sourceReferenceId as UrlSourceReferenceId,
    workflowInstanceId: request.workflowInstanceId as WorkflowInstanceId,
    workflowNodeId: request.workflowNodeId as WorkflowNodeId,
    taskId: taskState.id,
    taskState: taskState.state,
    createdAt: request.createdAt,
  };
}

async function findRequestResult(
  tx: WorkflowTransaction,
  request: UrlCaptureRequestRow,
): Promise<UrlCaptureCommandResult> {
  const [sourceReferenceRow] = await tx
    .select()
    .from(urlSourceReferences)
    .where(
      and(
        eq(urlSourceReferences.id, request.sourceReferenceId),
        eq(urlSourceReferences.contentPackageId, request.contentPackageId),
        eq(urlSourceReferences.ownerUserId, request.ownerUserId),
      ),
    )
    .limit(1);
  const [instanceRow] = await tx
    .select()
    .from(workflowInstances)
    .where(
      and(
        eq(workflowInstances.id, request.workflowInstanceId),
        eq(workflowInstances.contentPackageId, request.contentPackageId),
        eq(workflowInstances.ownerUserId, request.ownerUserId),
      ),
    )
    .limit(1);
  const [nodeRow] = await tx
    .select()
    .from(workflowNodes)
    .where(
      and(
        eq(workflowNodes.id, request.workflowNodeId),
        eq(workflowNodes.workflowInstanceId, request.workflowInstanceId),
        eq(workflowNodes.contentPackageId, request.contentPackageId),
        eq(workflowNodes.ownerUserId, request.ownerUserId),
      ),
    )
    .limit(1);
  const [task] = await tx
    .select()
    .from(workflowTasks)
    .where(
      and(
        eq(workflowTasks.urlCaptureRequestId, request.id),
        eq(workflowTasks.contentPackageId, request.contentPackageId),
        eq(workflowTasks.ownerUserId, request.ownerUserId),
      ),
    )
    .limit(1);
  const [outboxRow] = task
    ? await tx
        .select()
        .from(workflowOutboxRecords)
        .where(
          and(
            eq(workflowOutboxRecords.taskId, task.id),
            eq(workflowOutboxRecords.contentPackageId, request.contentPackageId),
            eq(workflowOutboxRecords.ownerUserId, request.ownerUserId),
          ),
        )
        .limit(1)
    : [];
  const [eventRow] = nodeRow
    ? await tx
        .select()
        .from(workflowEvents)
        .where(
          and(
            eq(workflowEvents.workflowNodeId, nodeRow.id),
            eq(workflowEvents.workflowInstanceId, request.workflowInstanceId),
            eq(workflowEvents.contentPackageId, request.contentPackageId),
            eq(workflowEvents.ownerUserId, request.ownerUserId),
            eq(workflowEvents.eventType, 'url_capture_requested.v1'),
          ),
        )
        .limit(1)
    : [];
  if (!sourceReferenceRow || !instanceRow || !nodeRow || !task || !outboxRow || !eventRow) {
    throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
  }
  const sourceReference = asUrlSourceReference(sourceReferenceRow);
  const requestState: UrlCaptureRequestState = defineUrlCaptureRequest(
    {
      id: request.id as UrlCaptureRequestId,
      sourceReferenceId: request.sourceReferenceId as UrlSourceReferenceId,
      workflowInstanceId: request.workflowInstanceId as WorkflowInstanceId,
      workflowNodeId: request.workflowNodeId as WorkflowNodeId,
      contentPackageId: request.contentPackageId as ContentPackageId,
      ownerUserId: request.ownerUserId as ContentPackageOwnerId,
      expectedPackageRevision: request.expectedPackageRevision,
      commandKind: request.commandKind as 'url_capture_request',
      idempotencyKey: request.idempotencyKey,
      requestFingerprint: request.requestFingerprint,
      createdAt: request.createdAt,
    },
    sourceReference,
  );
  const instance = asWorkflowInstance(instanceRow);
  const node = asWorkflowNode(nodeRow, instance);
  const taskState = rehydrateWorkflowTask({
    id: task.id as WorkflowTaskId,
    workflowInstanceId: task.workflowInstanceId as WorkflowInstanceId,
    workflowNodeId: task.workflowNodeId as WorkflowNodeId,
    urlCaptureRequestId: task.urlCaptureRequestId as UrlCaptureRequestId,
    contentPackageId: task.contentPackageId as ContentPackageId,
    ownerUserId: task.ownerUserId as ContentPackageOwnerId,
    kind: task.kind as 'url_capture',
    state: task.state as 'queued',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
  const outbox: WorkflowOutboxRecordState = rehydrateWorkflowOutboxRecord({
    id: outboxRow.id as never,
    taskId: outboxRow.taskId as WorkflowTaskId,
    contentPackageId: outboxRow.contentPackageId as ContentPackageId,
    ownerUserId: outboxRow.ownerUserId as ContentPackageOwnerId,
    category: outboxRow.category as 'fetcher',
    envelopeVersion: outboxRow.envelopeVersion as 'fetcher-task/v1',
    payload: outboxRow.payload as never,
    state: outboxRow.state as 'pending',
    createdAt: outboxRow.createdAt,
  });
  const expectedPayload = defineUrlCaptureEventPayload(requestState.id, sourceReference.id, taskState.id);
  const eventPayload = eventRow.payload as Record<string, unknown>;
  if (canonicalWorkflowSerialization(eventPayload) !== canonicalWorkflowSerialization(expectedPayload)) {
    throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
  }
  const event: WorkflowEventState = rehydrateWorkflowEvent(
    {
      id: eventRow.id as never,
      workflowInstanceId: eventRow.workflowInstanceId as WorkflowInstanceId,
      contentPackageId: eventRow.contentPackageId as ContentPackageId,
      ownerUserId: eventRow.ownerUserId as ContentPackageOwnerId,
      sequence: eventRow.sequence,
      eventType: eventRow.eventType,
      payload: eventPayload as never,
      occurredAt: eventRow.occurredAt,
      workflowNodeId: eventRow.workflowNodeId as WorkflowNodeId,
    },
    instance,
    node,
  );
  if (event.eventType !== 'url_capture_requested.v1' || event.workflowNodeId !== node.id) {
    throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
  }
  if (outbox.taskId !== taskState.id) throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
  return resultFromRows(request, task);
}

export class DrizzleWorkflowCommandRepository implements UrlCaptureCommandRepository {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly options: WorkflowCommandRepositoryOptions = {},
  ) {}

  async submitUrlCapture(input: UrlCapturePersistenceCommand): Promise<UrlCaptureCommandResult> {
    return this.connection.db.transaction(async (tx) => {
      const [packageRow] = await tx
        .select({ lifecycle: contentPackages.lifecycle, revision: contentPackages.revision })
        .from(contentPackages)
        .where(
          and(
            eq(contentPackages.id, input.urlCaptureRequest.contentPackageId),
            eq(contentPackages.ownerUserId, input.urlCaptureRequest.ownerUserId),
          ),
        )
        .for('update')
        .limit(1);
      if (!packageRow) throw new UrlCaptureApplicationError('CONTENT_PACKAGE_NOT_FOUND');

      const [existingRequest] = await tx
        .select()
        .from(urlCaptureRequests)
        .where(
          and(
            eq(urlCaptureRequests.contentPackageId, input.urlCaptureRequest.contentPackageId),
            eq(urlCaptureRequests.ownerUserId, input.urlCaptureRequest.ownerUserId),
            eq(urlCaptureRequests.commandKind, input.urlCaptureRequest.commandKind),
            eq(urlCaptureRequests.idempotencyKey, input.urlCaptureRequest.idempotencyKey),
          ),
        )
        .limit(1);
      if (existingRequest) {
        if (existingRequest.requestFingerprint !== input.urlCaptureRequest.requestFingerprint) {
          throw new UrlCaptureApplicationError('URL_CAPTURE_IDEMPOTENCY_CONFLICT');
        }
        return findRequestResult(tx, existingRequest);
      }

      if (packageRow.lifecycle !== 'active') throw new UrlCaptureApplicationError('PACKAGE_ARCHIVED');
      if (packageRow.revision !== input.urlCaptureRequest.expectedPackageRevision) {
        throw new UrlCaptureApplicationError('REVISION_CONFLICT');
      }

      const roleLimit = input.urlSourceReference.role === 'primary' ? 1 : 5;
      const [roleCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(sources)
        .where(
          and(
            eq(sources.contentPackageId, input.urlSourceReference.contentPackageId),
            eq(sources.ownerUserId, input.urlSourceReference.ownerUserId),
            eq(sources.role, input.urlSourceReference.role),
          ),
        );
      if ((roleCount?.count ?? 0) >= roleLimit) {
        throw new UrlCaptureApplicationError('SOURCE_ROLE_LIMIT_EXCEEDED');
      }

      const [templateRow] = await tx
        .select({ templateId: workflowTemplates.templateId })
        .from(workflowTemplates)
        .where(
          and(
            eq(workflowTemplates.templateId, TEMPLATE_ID),
            eq(workflowTemplates.templateVersion, TEMPLATE_VERSION),
            eq(workflowTemplates.definitionSha256, CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256),
          ),
        )
        .limit(1);
      if (!templateRow) throw new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE');

      const [instanceRow] = await tx
        .select()
        .from(workflowInstances)
        .where(
          and(
            eq(workflowInstances.contentPackageId, input.workflowInstance.contentPackageId),
            eq(workflowInstances.ownerUserId, input.workflowInstance.ownerUserId),
            eq(workflowInstances.templateId, TEMPLATE_ID),
            eq(workflowInstances.templateVersion, TEMPLATE_VERSION),
          ),
        )
        .limit(1);
      if (instanceRow && instanceRow.lifecycle !== 'active') {
        throw new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS');
      }
      const instance = instanceRow ? asWorkflowInstance(instanceRow) : input.workflowInstance;
      if (!instanceRow) {
        await tx.insert(workflowInstances).values({
          id: instance.id,
          contentPackageId: instance.contentPackageId,
          ownerUserId: instance.ownerUserId,
          templateId: instance.templateId,
          templateVersion: instance.templateVersion,
          definitionSha256: instance.definitionSha256,
          lifecycle: instance.lifecycle,
          revision: instance.revision,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        });
        await afterStage(this.options, 'workflow_instance');
      }

      const [nodeRow] = await tx
        .select()
        .from(workflowNodes)
        .where(
          and(
            eq(workflowNodes.workflowInstanceId, instance.id),
            eq(workflowNodes.contentPackageId, instance.contentPackageId),
            eq(workflowNodes.ownerUserId, instance.ownerUserId),
            eq(workflowNodes.templateNodeKey, 'source_capture'),
          ),
        )
        .limit(1);
      if (nodeRow && nodeRow.state !== 'ready') {
        throw new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS');
      }
      const node = nodeRow
        ? asWorkflowNode(nodeRow, instance)
        : defineWorkflowNode({
            id: input.workflowNode.id,
            workflowInstance: instance,
            template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
            templateNodeKey: 'source_capture' as never,
            state: 'ready',
            revision: 1,
            createdAt: input.workflowNode.createdAt,
            updatedAt: input.workflowNode.updatedAt,
          });
      if (!nodeRow) {
        await tx.insert(workflowNodes).values({
          id: node.id,
          workflowInstanceId: node.workflowInstanceId,
          contentPackageId: node.contentPackageId,
          ownerUserId: node.ownerUserId,
          templateId: node.templateId,
          templateVersion: node.templateVersion,
          templateNodeKey: node.templateNodeKey,
          state: node.state,
          revision: node.revision,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        });
        await afterStage(this.options, 'workflow_node');
      }

      const [nodeRequest] = await tx
        .select({ id: urlCaptureRequests.id })
        .from(urlCaptureRequests)
        .where(eq(urlCaptureRequests.workflowNodeId, node.id))
        .limit(1);
      if (nodeRequest) throw new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS');

      const sourceReference = defineUrlSourceReference(input.urlSourceReference);
      const request = defineUrlCaptureRequest(
        {
          ...input.urlCaptureRequest,
          workflowInstanceId: instance.id,
          workflowNodeId: node.id,
        },
        sourceReference,
      );
      const task = defineWorkflowTask(
        {
          ...input.workflowTask,
          workflowInstanceId: instance.id,
          workflowNodeId: node.id,
          urlCaptureRequestId: request.id,
          contentPackageId: instance.contentPackageId,
          ownerUserId: instance.ownerUserId,
        },
        request,
      );
      const outbox = defineWorkflowOutboxRecord(
        {
          ...input.workflowOutboxRecord,
          taskId: task.id,
          contentPackageId: instance.contentPackageId,
          ownerUserId: instance.ownerUserId,
          payload: {
            taskId: task.id,
            taskKind: 'url_capture',
            envelopeVersion: 'fetcher-task/v1',
          },
        },
        task,
      );
      const event = {
        ...input.workflowEvent,
        workflowInstanceId: instance.id,
        workflowNodeId: node.id,
        contentPackageId: instance.contentPackageId,
        ownerUserId: instance.ownerUserId,
        payload: defineUrlCaptureEventPayload(request.id, sourceReference.id, task.id),
      };
      if (event.eventType !== 'url_capture_requested.v1') throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');

      await tx.insert(urlSourceReferences).values({
        id: sourceReference.id,
        contentPackageId: sourceReference.contentPackageId,
        ownerUserId: sourceReference.ownerUserId,
        role: sourceReference.role,
        submittedUrl: sourceReference.submittedUrl,
        createdAt: sourceReference.createdAt,
      });
      await afterStage(this.options, 'url_source_reference');

      await tx.insert(urlCaptureRequests).values({
        id: request.id,
        sourceReferenceId: request.sourceReferenceId,
        workflowInstanceId: request.workflowInstanceId,
        workflowNodeId: request.workflowNodeId,
        contentPackageId: request.contentPackageId,
        ownerUserId: request.ownerUserId,
        expectedPackageRevision: request.expectedPackageRevision,
        commandKind: request.commandKind,
        idempotencyKey: request.idempotencyKey,
        requestFingerprint: request.requestFingerprint,
        createdAt: request.createdAt,
      });
      await afterStage(this.options, 'url_capture_request');

      await tx.insert(workflowTasks).values({
        id: task.id,
        workflowInstanceId: task.workflowInstanceId,
        workflowNodeId: task.workflowNodeId,
        urlCaptureRequestId: task.urlCaptureRequestId,
        contentPackageId: task.contentPackageId,
        ownerUserId: task.ownerUserId,
        kind: task.kind,
        state: task.state,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
      await afterStage(this.options, 'workflow_task');

      await tx.insert(workflowOutboxRecords).values({
        id: outbox.id,
        taskId: outbox.taskId,
        contentPackageId: outbox.contentPackageId,
        ownerUserId: outbox.ownerUserId,
        category: outbox.category,
        envelopeVersion: outbox.envelopeVersion,
        payload: outbox.payload as unknown as Record<string, unknown>,
        state: outbox.state,
        createdAt: outbox.createdAt,
      });
      await afterStage(this.options, 'workflow_outbox');

      const [sequenceRow] = await tx
        .select({ nextSequence: sql<number>`coalesce(max(${workflowEvents.sequence}), 0) + 1` })
        .from(workflowEvents)
        .where(
          and(
            eq(workflowEvents.workflowInstanceId, instance.id),
            eq(workflowEvents.contentPackageId, instance.contentPackageId),
            eq(workflowEvents.ownerUserId, instance.ownerUserId),
          ),
        );
      const sequence = Number(sequenceRow?.nextSequence ?? 1);
      await tx.insert(workflowEvents).values({
        id: event.id,
        workflowInstanceId: event.workflowInstanceId,
        contentPackageId: event.contentPackageId,
        ownerUserId: event.ownerUserId,
        sequence,
        eventType: event.eventType,
        payload: event.payload as unknown as Record<string, unknown>,
        occurredAt: event.occurredAt,
        workflowNodeId: event.workflowNodeId,
      });
      await afterStage(this.options, 'workflow_event');

      return {
        urlCaptureRequestId: request.id,
        contentPackageId: request.contentPackageId,
        sourceReferenceId: sourceReference.id,
        workflowInstanceId: instance.id,
        workflowNodeId: node.id,
        taskId: task.id,
        taskState: task.state,
        createdAt: request.createdAt,
      };
    });
  }
}
