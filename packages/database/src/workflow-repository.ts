import { and, eq } from 'drizzle-orm';

import {
  assertWorkflowTemplateMatches,
  rehydrateWorkflowEvent,
  rehydrateWorkflowInstance,
  rehydrateWorkflowNode,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type WorkflowEventState,
  type WorkflowInstanceId,
  type WorkflowInstanceState,
  type WorkflowNodeId,
  type WorkflowNodeState,
  type WorkflowRepository,
  type WorkflowTemplate,
  type WorkflowTemplateEdgeRow,
  type WorkflowTemplateId,
  type WorkflowTemplateNodeRow,
  type WorkflowTemplateCatalogRow,
  type WorkflowTemplateVersion,
  reconstructWorkflowTemplate,
  WORKFLOW_TEMPLATE_CATALOG,
  WorkflowDomainError,
  type WorkflowEventPayload,
  type WorkflowNodeKey,
  type WorkflowNodeStateValue,
  type WorkflowInstanceLifecycle,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import {
  workflowEvents,
  workflowInstances,
  workflowNodes,
  workflowTemplateEdges,
  workflowTemplateNodes,
  workflowTemplates,
} from './schema.js';

type WorkflowTemplateRecord = typeof workflowTemplates.$inferSelect;
type WorkflowTemplateNodeRecord = typeof workflowTemplateNodes.$inferSelect;
type WorkflowTemplateEdgeRecord = typeof workflowTemplateEdges.$inferSelect;
type WorkflowInstanceRecord = typeof workflowInstances.$inferSelect;

function asTemplateRow(row: WorkflowTemplateRecord): WorkflowTemplateCatalogRow {
  return {
    templateId: row.templateId,
    templateVersion: row.templateVersion,
    definitionSha256: row.definitionSha256,
    seededAt: row.seededAt,
  };
}

function asNodeRow(row: WorkflowTemplateNodeRecord): WorkflowTemplateNodeRow {
  return {
    templateId: row.templateId,
    templateVersion: row.templateVersion,
    nodeKey: row.nodeKey,
    ordinal: row.ordinal,
    kind: row.kind,
    requiresHumanGate: row.requiresHumanGate,
  };
}

function asEdgeRow(row: WorkflowTemplateEdgeRecord): WorkflowTemplateEdgeRow {
  return {
    templateId: row.templateId,
    templateVersion: row.templateVersion,
    ordinal: row.ordinal,
    fromNodeKey: row.fromNodeKey,
    toNodeKey: row.toNodeKey,
  };
}

function templateForIdentity(templateId: string, templateVersion: string): WorkflowTemplate {
  const expected = WORKFLOW_TEMPLATE_CATALOG.find(
    (entry) => entry.definition.templateId === templateId && entry.definition.templateVersion === templateVersion,
  );
  if (!expected) {
    throw new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE');
  }
  return expected;
}

function assertKnownTemplate(templateId: string, templateVersion: string, definitionSha256: string): WorkflowTemplate {
  const expected = templateForIdentity(templateId, templateVersion);
  if (expected.definitionSha256 !== definitionSha256) throw new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE');
  return expected;
}

function toInstance(row: WorkflowInstanceRecord, template: WorkflowTemplate): WorkflowInstanceState {
  return rehydrateWorkflowInstance(
    {
      id: row.id as WorkflowInstanceId,
      contentPackageId: row.contentPackageId as ContentPackageId,
      ownerUserId: row.ownerUserId as ContentPackageOwnerId,
      templateId: row.templateId as WorkflowTemplateId,
      templateVersion: row.templateVersion as WorkflowTemplateVersion,
      definitionSha256: row.definitionSha256,
      lifecycle: row.lifecycle as WorkflowInstanceLifecycle,
      revision: row.revision,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    template,
  );
}

export class DrizzleWorkflowRepository implements WorkflowRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async loadCatalog(): Promise<readonly WorkflowTemplate[]> {
    const [templateRows, nodeRows, edgeRows] = await Promise.all([
      this.connection.db.select().from(workflowTemplates),
      this.connection.db.select().from(workflowTemplateNodes),
      this.connection.db.select().from(workflowTemplateEdges),
    ]);
    if (templateRows.length !== WORKFLOW_TEMPLATE_CATALOG.length) {
      throw new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE');
    }
    const catalog = templateRows.map((row) => {
      const template = reconstructWorkflowTemplate({
        template: asTemplateRow(row),
        nodes: nodeRows.map(asNodeRow),
        edges: edgeRows.map(asEdgeRow),
      });
      return assertWorkflowTemplateMatches(template);
    });
    if (catalog.length !== WORKFLOW_TEMPLATE_CATALOG.length) {
      throw new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE');
    }
    return catalog;
  }

  async findTemplate(
    templateId: WorkflowTemplateId,
    templateVersion: WorkflowTemplateVersion,
  ): Promise<WorkflowTemplate | null> {
    const [templateRow] = await this.connection.db
      .select()
      .from(workflowTemplates)
      .where(and(eq(workflowTemplates.templateId, templateId), eq(workflowTemplates.templateVersion, templateVersion)))
      .limit(1);
    if (!templateRow) return null;

    const [nodeRows, edgeRows] = await Promise.all([
      this.connection.db
        .select()
        .from(workflowTemplateNodes)
        .where(
          and(
            eq(workflowTemplateNodes.templateId, templateId),
            eq(workflowTemplateNodes.templateVersion, templateVersion),
          ),
        ),
      this.connection.db
        .select()
        .from(workflowTemplateEdges)
        .where(
          and(
            eq(workflowTemplateEdges.templateId, templateId),
            eq(workflowTemplateEdges.templateVersion, templateVersion),
          ),
        ),
    ]);
    const template = reconstructWorkflowTemplate({
      template: asTemplateRow(templateRow),
      nodes: nodeRows.map(asNodeRow),
      edges: edgeRows.map(asEdgeRow),
    });
    return assertWorkflowTemplateMatches(template);
  }

  async findInstanceByIdForOwner(
    instanceId: WorkflowInstanceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<WorkflowInstanceState | null> {
    const [row] = await this.connection.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.id, instanceId),
          eq(workflowInstances.contentPackageId, contentPackageId),
          eq(workflowInstances.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!row) return null;
    const template = assertKnownTemplate(row.templateId, row.templateVersion, row.definitionSha256);
    return toInstance(row, template);
  }

  async findInstanceForPackageOwner(
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    templateId: WorkflowTemplateId,
    templateVersion: WorkflowTemplateVersion,
  ): Promise<WorkflowInstanceState | null> {
    const [row] = await this.connection.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.contentPackageId, contentPackageId),
          eq(workflowInstances.ownerUserId, ownerUserId),
          eq(workflowInstances.templateId, templateId),
          eq(workflowInstances.templateVersion, templateVersion),
        ),
      )
      .limit(1);
    if (!row) return null;
    const template = assertKnownTemplate(row.templateId, row.templateVersion, row.definitionSha256);
    return toInstance(row, template);
  }

  async insertInstance(instance: WorkflowInstanceState): Promise<void> {
    const template = templateForIdentity(instance.templateId, instance.templateVersion);
    const validated = rehydrateWorkflowInstance(instance, template);
    await this.connection.db.insert(workflowInstances).values({
      id: validated.id,
      contentPackageId: validated.contentPackageId,
      ownerUserId: validated.ownerUserId,
      templateId: validated.templateId,
      templateVersion: validated.templateVersion,
      definitionSha256: validated.definitionSha256,
      lifecycle: validated.lifecycle,
      revision: validated.revision,
      createdAt: validated.createdAt,
      updatedAt: validated.updatedAt,
    });
  }

  async insertNode(node: WorkflowNodeState): Promise<void> {
    const instance = await this.findInstanceByIdForOwner(
      node.workflowInstanceId,
      node.contentPackageId,
      node.ownerUserId,
    );
    if (!instance) throw new WorkflowDomainError('INVALID_WORKFLOW_NODE');
    const template = assertKnownTemplate(instance.templateId, instance.templateVersion, instance.definitionSha256);
    const validated = rehydrateWorkflowNode(node, instance, template);
    await this.connection.db.insert(workflowNodes).values({
      id: validated.id,
      workflowInstanceId: validated.workflowInstanceId,
      contentPackageId: validated.contentPackageId,
      ownerUserId: validated.ownerUserId,
      templateId: validated.templateId,
      templateVersion: validated.templateVersion,
      templateNodeKey: validated.templateNodeKey,
      state: validated.state,
      revision: validated.revision,
      createdAt: validated.createdAt,
      updatedAt: validated.updatedAt,
    });
  }

  async appendEvent(event: WorkflowEventState): Promise<void> {
    const instance = await this.findInstanceByIdForOwner(
      event.workflowInstanceId,
      event.contentPackageId,
      event.ownerUserId,
    );
    if (!instance) throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
    let node: WorkflowNodeState | null = null;
    if (event.workflowNodeId !== null) {
      const [nodeRow] = await this.connection.db
        .select()
        .from(workflowNodes)
        .where(
          and(
            eq(workflowNodes.id, event.workflowNodeId),
            eq(workflowNodes.workflowInstanceId, event.workflowInstanceId),
            eq(workflowNodes.contentPackageId, event.contentPackageId),
            eq(workflowNodes.ownerUserId, event.ownerUserId),
          ),
        )
        .limit(1);
      if (!nodeRow) throw new WorkflowDomainError('INVALID_WORKFLOW_EVENT');
      const template = assertKnownTemplate(instance.templateId, instance.templateVersion, instance.definitionSha256);
      node = rehydrateWorkflowNode(
        {
          id: nodeRow.id as WorkflowNodeId,
          workflowInstanceId: nodeRow.workflowInstanceId as WorkflowInstanceId,
          contentPackageId: nodeRow.contentPackageId as ContentPackageId,
          ownerUserId: nodeRow.ownerUserId as ContentPackageOwnerId,
          templateId: nodeRow.templateId as WorkflowTemplateId,
          templateVersion: nodeRow.templateVersion as WorkflowTemplateVersion,
          templateNodeKey: nodeRow.templateNodeKey as WorkflowNodeKey,
          state: nodeRow.state as WorkflowNodeStateValue,
          revision: nodeRow.revision,
          createdAt: nodeRow.createdAt,
          updatedAt: nodeRow.updatedAt,
        },
        instance,
        template,
      );
    }
    const validated = rehydrateWorkflowEvent(event, instance, node);
    await this.connection.db.insert(workflowEvents).values({
      id: validated.id,
      workflowInstanceId: validated.workflowInstanceId,
      contentPackageId: validated.contentPackageId,
      ownerUserId: validated.ownerUserId,
      sequence: validated.sequence,
      eventType: validated.eventType,
      payload: validated.payload as WorkflowEventPayload,
      occurredAt: validated.occurredAt,
      workflowNodeId: validated.workflowNodeId,
    });
  }
}
