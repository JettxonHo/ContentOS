# ContentOS Workflow Overview

**Status:** Current Truth

**Scope:** MVP workflow coordination, state boundaries, Commands, Human Gates, recovery, and execution invariants

**Last Updated:** 2026-08-01

This document defines how ContentOS coordinates one Content Package through fixed, auditable, and recoverable Workflow behavior. It defines semantics and boundaries, not database tables, API endpoints, JSON Schemas, concrete enums, or implementation timing values.

Related current-truth documents:

- [Product Definition](../product/product-definition.md)
- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](domain-overview.md)
- [Artifact Versioning](artifact-versioning.md)
- [Technical Architecture](technical-architecture.md)
- [Process Topology](process-topology.md)
- [Agent Runtime](agent-runtime.md)
- [Rendering](rendering.md)

---

## 1. Workflow Purpose

Workflow coordinates the complete Content Package lifecycle from Source review through Research, Human Opinion, independent Blog and Xiaohongshu branches, Design, Render, and manual Export.

It exists to:

- Separate deterministic rules from LLM-assisted planning;
- Preserve explicit Human Review and Approval;
- Coordinate Artifacts, Tasks, Agent Runs, Render Jobs, and Human Gates without merging their lifecycles;
- Make legal next actions visible;
- Support Pause, Resume, Cancel, allowed Skip, Retry, and recovery;
- Preserve audit history and failure context;
- Prevent an Agent or Chat message from directly controlling formal Domain state.

Workflow is not a generic automation platform, an arbitrary Agent graph, or the canonical content store. Artifacts and their Versions remain owned by their Domain modules.

## 2. Orchestration Model

```text
Chief Editor
=
LLM Planner
+
Deterministic Executor
+
Workflow Policy
```

The three responsibilities remain separate:

| Responsibility | May do | Must not do |
|---|---|---|
| LLM Planner | Interpret the user's goal, explain current state, recommend legal next actions, and produce a Command Proposal | Mutate authoritative state, create Approval, invent Nodes, bypass a Gate, or invoke arbitrary tools |
| Deterministic Executor | Authenticate and authorize the Actor, validate a structured Command, enforce concurrency and idempotency, invoke owning Use Cases, create Tasks, and record results | Invent Workflow policy, infer permission from prose, or accept model output as authoritative state |
| Workflow Policy | Define prerequisites, legal transitions, Human Gates, retry and skip eligibility, branch dependencies, and completion conditions | Generate content, call models, or act as a mutable Workflow Instance |

The Chief Editor is a coordination layer, not a super-Agent with unrestricted Domain, database, network, filesystem, or tool access.

The MVP uses a fixed, versioned Workflow Template. The Planner operates only within that Template and its Workflow Policy. The MVP does not support an arbitrary dynamic Agent graph, user-defined Workflow Builder, autonomous loops, or Agent-created sub-Agents.

## 3. Workflow Template

A Workflow Template is an immutable, versioned definition of allowed coordination behavior. Conceptually it defines:

- **Workflow Template ID:** stable identity of one Workflow family;
- **Workflow Template Version:** exact immutable definition used by an Instance;
- **Node definitions:** named work, review, branch, and completion steps;
- **Allowed transitions:** legal state changes and their prerequisites;
- **Human Gates:** Nodes that require explicit user action;
- **Retry Policy:** which failure classes may retry and within what bounded policy;
- **Skip Policy:** which optional Nodes may be skipped and the resulting mode or dependency effect;
- **Branch dependencies:** fork, independence, join, and outdated relationships;
- **Completion conditions:** exact conditions under which a branch and the whole Instance are complete.

The Accepted initial family is `content-package-dual-output/v1`; this name identifies the required initial Template direction, not a complete Schema or implementation.

Changing a Template creates a new Template Version. It does not rewrite an existing Workflow Instance or its Event history.

The M2-WF-001 persistence foundation now stores this one fixed catalog, its
ordered Nodes and dependency edges, and neutral owner-scoped Workflow
Instance, Node, and append-only Event primitives in PostgreSQL. The catalog
definition is hash-checked and its catalog/Event rows are immutable through
ordinary application connections. This foundation has no Workflow Command,
bootstrap, automatic Node materialization or transition, Task, Outbox, Queue,
Timeline/SSE, URL Source, Fetcher, Agent, or user-visible Workflow behavior;
later execution remains inactive until its own Ready Work Item.

## 4. Workflow Instance

A Workflow Instance is one Content Package-specific enactment of one exact Workflow Template Version.

It:

- Belongs to one Content Package;
- Binds one exact Workflow Template ID and Version;
- Records the current execution context and branch progress;
- References Nodes, Tasks, Commands, Gates, Events, and relevant Artifact state without owning Artifact content;
- Can be Paused, Resumed, Cancelled, Completed, or Failed according to policy;
- Preserves append-only historical Events;
- Is never historically reinterpreted by editing its bound Template.

An Instance may derive current presentation state from its Nodes and dependencies, but it does not collapse all Artifact and execution state into one Package status.

## 5. State Separation

ContentOS keeps four state categories separate. They may be displayed together in the Workspace, but they must not be represented as one ambiguous `status` meaning.

### 5.1 Artifact State

Artifact State describes the lifecycle and eligibility of a Domain content object or Artifact family. Examples include:

- Working;
- Review Candidate;
- Approved;
- Outdated;
- Invalidated.

Artifact State says nothing by itself about whether an async Task is running or whether the whole Workflow is paused.

### 5.2 Node State

Node State describes execution progress for one Workflow step. Conceptual examples include:

- Not Ready;
- Ready;
- Running;
- Awaiting Human;
- Completed;
- Failed;
- Skipped;
- Cancelled.

A completed Node records completion under its actual prerequisites. It does not grant Approval to its output unless the applicable Human Gate created a valid Approval Record.

### 5.3 Task State

Task State describes operational work intended by Workflow. Conceptual examples include:

- Pending;
- Dispatched;
- Running;
- Succeeded;
- Failed;
- Cancelled.

Task State is authoritative in PostgreSQL. BullMQ Job state is a delivery representation and cannot replace it.

### 5.4 Workflow State

Workflow State describes the overall Workflow Instance lifecycle. Conceptual examples include:

- Active;
- Paused;
- Completed;
- Failed;
- Cancelled.

Workflow completion is derived from the fixed Template's required branch and Gate conditions. It is not inferred from the latest successful Queue Job or Agent response.

## 6. Current Action

Current Action is a derived, user-facing recommendation based on:

- Workflow Instance and Node state;
- Artifact Head, Version, Approval, and outdated state;
- Validation Results and Blocking Errors;
- Task eligibility and failure classification;
- the Actor's authorization;
- Workflow Policy.

It may recommend Human Review, Retry, Approve, Revise, Resume, resolve a dependency, or choose an allowed fallback.

Current Action is not independent business truth and is not stored or edited as a competing state machine. The UI presents legal actions returned by authoritative Queries and Use Cases; it does not invent a Domain transition from local state.

## 7. Workflow Command

A Workflow Command is a structured request to perform one authorized state-changing action. Its conceptual contract includes:

- **Command Type:** requested operation;
- **Target:** exact Entity, Artifact, Version, Gate, Node, Task, or Workflow target;
- **Expected Revision:** concurrency expectation where state-sensitive;
- **Idempotency Key:** stable duplicate-execution identity;
- **Actor:** authenticated human or authorized system Actor;
- **Input references:** exact Versions, records, and supporting values required by the operation;
- **Command Result:** accepted, rejected, duplicate, conflict, or other structured outcome plus created references and Events.

Chat and the Chief Editor Planner can produce only a Command Proposal. A Proposal must be converted to a typed Command and checked for:

- Authentication and authorization;
- Expected Revision and current target identity;
- Idempotency and duplicate effects;
- Workflow Policy and legal transition;
- Dependency and Artifact eligibility;
- Validation and Blocking Errors.

Natural-language text is never executed directly. Repeating an equivalent Command must return the prior result or another deterministic duplicate outcome without creating duplicate Tasks, Approvals, or Artifact Versions.

## 8. Human Gates

The MVP retains explicit human decisions at these boundaries:

| Human Gate | Human responsibility | Formal effect |
|---|---|---|
| Source Review | Confirm or correct normalized Source material and Source role | Authorizes exact Source Version use by Research |
| Research Review | Accept, correct, exclude, or mark uncertainty and evidence | May approve one exact Research Version |
| Human Opinion Confirmation | Confirm, correct, reject, skip, or stop interpreted opinion | Creates Confirmed Opinion statements or explicit Research-based Mode |
| Blog Approval | Review content, citations, provenance, and warnings | Approves one exact Blog Version |
| Xiaohongshu Approval | Review platform content, page structure, citations, and warnings | Approves one exact Xiaohongshu Version |
| Design Approval | Review one Design Version and required Assets | Approves exact Design and eligible Asset dependencies |
| Final Export Eligibility | Confirm the complete approved dependency set and final output | Authorizes creation or selection of the formal Export Package under policy |

AI does not create a human Approval, acknowledge a Warning on the user's behalf, or publish content. A Human Gate cannot use a normal “continue anyway” action to bypass a Blocking Error.

## 9. Branching

After an Approved Content Foundation exists, the Blog and Xiaohongshu branches may proceed in parallel.

- The branches share exact approved upstream Versions but do not depend on each other;
- Each branch owns independent Working Copies, Versions, validation, Tasks, Gates, Approval, and outdated state;
- Failure, Pause, or revision in one branch does not automatically cancel the other branch unless an explicit shared prerequisite becomes ineligible;
- A newer approved upstream Version propagates outdated state through the Dependency Graph to affected branch Artifacts;
- Formal Package completion requires both the approved Blog Export and approved Xiaohongshu Export required by the MVP;
- A Blog-only completion is an internal Milestone, not formal MVP completion.

The Xiaohongshu visual subflow begins only after an exact Xiaohongshu Version is Approved.

## 10. Task and Agent Run Relationship

The execution objects remain distinct:

- **Workflow Node:** one Template-defined coordination step;
- **Task:** authoritative request for specific asynchronous work;
- **Queue Job:** delivery envelope for an existing Task;
- **Agent Run:** one logical execution of an Agent Spec on a Frozen Input Snapshot;
- **Model Call Attempt:** one Provider invocation inside an Agent Run.

A Task may produce no Agent Run, such as some Fetch or Render work, or may have one or more Agent Runs across full retries. An Agent Run may have multiple Model Call Attempts for Provider retry, Fallback, Schema Repair, or Domain Regeneration.

```text
Workflow Node
└── Task
    ├── Queue Job delivery, possibly repeated
    └── Agent Run, when model-backed
        ├── Model Call Attempt
        └── Model Call Attempt
```

A Workflow Node is not a Queue Job, a Task is not an Agent Run, and a successful Model Call does not mean the Node or Workflow is complete.

## 11. Workflow Event Log

ContentOS maintains an append-only Workflow Event Log for important coordination history, including:

- Command receipt and Command Result;
- legal state changes;
- Gate entry and human decision;
- Task creation, cancellation, failure, and recovery;
- branch fork and completion;
- Pause, Resume, Cancel, and Skip;
- outdated propagation and selected recovery path.

The Event Log supports audit, Workspace Timeline, notification derivation, and recovery diagnosis. The MVP does not use full Event Sourcing: current authoritative state remains expressed by PostgreSQL-backed Domain, Artifact, Workflow, Node, Task, and execution objects.

## 12. Pause, Resume, Cancel and Skip

### Pause

Pause prevents new policy-defined pausable work from starting and stops automatic advancement. It does not delete Artifacts or imply that already irreversible external work can be undone. The precise treatment of in-flight work is an Open Implementation Decision.

### Resume

Resume re-evaluates the latest authoritative state, dependencies, leases, validation, and current Template policy before continuing legal work. It does not replay stale UI assumptions.

### Cancel

Cancel prevents future execution and Promotion under the cancelled scope while preserving history and existing Artifacts. A Late Result may be retained as execution evidence but cannot be promoted from a Cancelled or superseded Task.

### Skip

Skip is allowed only where the bound Workflow Template explicitly permits it. Human Opinion Skip records Research-based Mode and its downstream first-person restrictions. Skip does not fabricate a successful Artifact, Approval, or execution result.

## 13. Failure and Retry

Workflow uses stable failure categories so policy can choose the correct path:

| Failure category | Meaning | Typical path |
|---|---|---|
| Input Error | Missing, ineligible, unsupported, or malformed input | Correct input or return upstream |
| Deterministic Error | Domain, validation, contract, fit, or configuration rule failed | Correct the cause; do not blind retry |
| Transient Error | Temporary network, process, storage, or infrastructure failure | Bounded automatic retry where policy allows |
| Provider Error | Model Provider timeout, rate limit, unavailability, refusal, or filtering | Policy-specific retry, limited Fallback, or human action |
| Security Error | Authorization, SSRF, injection, Secret, unsafe file, or isolation violation | Block, record, and follow security handling |
| User-action-required Error | A human correction, choice, credential action, or review is required | Await explicit user action |

Only suitable Transient Errors receive automatic retry. Domain Validation failure is not solved by an infinite retry loop. Security Errors cannot be bypassed by switching Provider or asking an Agent to reinterpret the rule. Retry, Repair, and Fallback have explicit attempt and budget limits.

## 14. Concurrency and Idempotency

- State-sensitive Commands carry Expected Revision;
- Commands and Tasks carry stable idempotency identity;
- Queue delivery may repeat;
- Workers load authoritative PostgreSQL state and process idempotently;
- Leases and heartbeats support crash detection and recovery;
- Reconciliation may recreate a missing Queue Job without creating a second Task;
- The same Candidate cannot be promoted twice;
- duplicate effects do not create duplicate Artifact Versions or Approvals;
- a Late Result is rechecked against cancellation, supersession, dependencies, and Workflow eligibility before any Promotion;
- critical transitions use a bounded serialization mechanism whose implementation remains open.

## 15. Outdated Propagation

When an upstream Approved Version changes, the Dependency Graph identifies affected downstream Artifacts and marks their current eligibility as Outdated according to policy.

- Historical Versions and their original Dependency Snapshots remain unchanged;
- The system does not automatically overwrite or rewrite downstream content;
- The user may choose Regenerate, Revise, or retain historical work for reference;
- an old-input result may be retained but cannot silently become the current Review Candidate;
- Outdated does not mean Workflow failure, historical corruption, deletion, or automatic invalidation;
- Final Export cannot use a dependency set that current policy considers stale or ineligible.

## 16. Workflow Observability

The Workflow experience and operations layer expose high-level, redacted information for:

- Workflow Timeline;
- Node and Task progress;
- Current Action;
- Failure category and error code;
- retry, repair, and attempt counts;
- lease and heartbeat state;
- Correlation ID across Command, Task, Agent Run, Promotion, Render, and Export;
- visible Warning, acknowledgement requirement, and Blocking Error;
- branch progress and outdated propagation.

These requirements do not select a metrics backend or exact SSE Event Contract. Read APIs remain authoritative when events are missing or delayed.

## 17. Workflow Invariants

- A fixed, versioned Workflow Template controls allowed transitions.
- The LLM Planner proposes; the Deterministic Executor authorizes and executes.
- Chat text and model output do not directly mutate Workflow or Artifact state.
- Human Approval cannot be created or substituted by an Agent.
- A Blocking Error cannot be bypassed by ordinary acknowledgement.
- A Cancelled or superseded Task cannot promote a Late Result.
- A completed Node does not depend on an unapproved input where policy requires Approval.
- Final Export uses exact, current, legal, Approved dependencies.
- Duplicate Commands, Jobs, and Promotions do not create duplicate Artifact Versions, Tasks, or Approvals.
- Artifact, Node, Task, and Workflow state remain separate.
- Redis, BullMQ, SSE, and browser state are not Workflow authority.
- Template changes do not rewrite running or historical Instances.
- Skip never fabricates a successful Artifact.

## 18. Open Implementation Decisions

Accepted Decisions do not yet fix:

- Exact Node enum and internal names;
- Workflow Command Schema;
- Workflow Event type catalog;
- the precise boundary of Pause for in-flight work;
- lease duration and heartbeat interval;
- Reconciliation frequency;
- Workflow Projection implementation;
- SSE Event Contract.

These choices must preserve the semantics and invariants above. A change to Accepted Workflow, Human Gate, security, or MVP behavior requires Decision governance rather than silent implementation.

## 19. Decision Traceability

| Workflow area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Specialized Agents, Chief Editor, deterministic execution, and Human Review | DEC-009–DEC-012, DEC-023–DEC-025, DEC-038–DEC-039 | [Session-003](../sessions/session-003.md), [Session-006](../sessions/session-006.md), [Session-008](../sessions/session-008.md) |
| Fixed Template, state separation, Commands, concurrency, Events, recovery, and Promotion | DEC-125–DEC-139 | [Session-017](../sessions/session-017.md) |
| Artifact Versions, dependencies, late results, and eligibility | DEC-160–DEC-176, DEC-184–DEC-189 | [Artifact Versioning](artifact-versioning.md), [Session-019](../sessions/session-019.md), [Session-020](../sessions/session-020.md) |
| PostgreSQL authority, Queue delivery, Outbox, SSE, and Reconciliation | DEC-226, DEC-228–DEC-229, DEC-234, DEC-238 | [Session-022](../sessions/session-022.md) |
| Workflow, Queue, and release tests | DEC-244–DEC-250, DEC-259, DEC-261 | [Session-023](../sessions/session-023.md) |
| Final MVP Gates, implementation order, and recovery requirements | DEC-269–DEC-285, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
