# WORK PACKET — M2-WF-001

**Status:** Ready for implementation

**Purpose:** Durable planning-to-implementation handoff for the first accepted
Workflow persistence boundary

**Created:** 2026-08-01

## 1. Identification

- **Task ID:** `M2-WF-001`
- **Title:** Template, Instance, Node, and Event Persistence Foundation
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#53](https://github.com/JettxonHo/ContentOS/issues/53)
- **Branch:** `codex/m2-wf-001-template-instance-node-event`
- **Base commit:** `905a3572f09aa87d03be23a60cd8898e0019693b`
- **Executor Profile:** `BACKEND_GENERAL_EXECUTOR`
- **Owner:** one implementation agent, as the only repository writer
- **Reviewer:** independent review agent before publication
- **Dependencies:** accepted M2-DES-004; this Work Packet merged to `main`; no
  runtime dependency on M2-WF-002 or later M2 Work Items
- **Risk classification:** domain model, immutable catalog, PostgreSQL migration,
  repository boundary, and documentation

### Implementation entry condition

The implementation starts only from a clean, current `main` that already
contains this Work Packet. It creates or recreates
`codex/m2-wf-001-template-instance-node-event` from that `main` and records the
actual full base SHA in its Implementation Completion Report. There must be no
pre-existing staged, modified, or untracked repository files. This planning
branch contains only the Work Packet and is not an implementation baseline.

## 2. Goal

Persist the accepted immutable `content-package-dual-output/v1` Workflow
Template catalog and the neutral Workflow Instance, Node, and append-only Event
primitives. The result gives later M2 commands one verified PostgreSQL-backed
foundation, without making any Workflow action, URL capture, Task, Queue, or
Fetcher executable.

## 3. Authority and context

This packet implements only the first conditional item in §5 of the accepted
[M2-DES-004](m2-des-004-workflow-task-foundation.md). The human authority
approved its Option B on 2026-08-01. Later Accepted DEC governs an actual
conflict.

M1 and `M2-SRC-001`/`M2-SRC-002` already provide owner-scoped Content Packages
and manual Source capture. They intentionally create no Workflow Instance,
Workflow Node, Workflow Event, Task, Outbox record, Queue Job, URL Source
Reference, or URL Capture Request. Existing Packages must retain that history:
this migration seeds only the server-owned Template catalog and does not
backfill an Instance, Node, or Event for any Package.

The next Work Item, `M2-WF-002`, owns the first owner Command and the atomic
creation of an Instance, enabled Source-capture Node, URL Source Reference,
Capture Request, Task, Outbox record, and Event. This packet must leave those
objects and that transaction unimplemented rather than creating a partial
bootstrap path.

## 4. Canonical sources

### Accepted decisions

- DEC-126–DEC-128 — fixed versioned Template; separate Artifact, Node,
  Workflow, and Task state.
- DEC-133–DEC-135 — structured Commands, idempotency/concurrency, append-only
  Workflow Events without full event sourcing.
- DEC-169–DEC-173 — PostgreSQL structured truth; separated API/ORM/Domain
  models; explicit Commands; idempotency and optimistic concurrency.
- DEC-226–DEC-229 — PostgreSQL authority; Queue transport only; Transactional
  Outbox boundary.
- [M2-DES-002](m2-des-002-workflow-task-state-access.md) — API-owned Fetcher
  Task Gateway.
- [M2-DES-004](m2-des-004-workflow-task-foundation.md) — accepted Option B.

### Current-truth and governance

- `AGENTS.md`
- `docs/architecture/domain-overview.md`
- `docs/architecture/workflow-overview.md`
- `docs/architecture/technical-architecture.md`
- `docs/architecture/process-topology.md`
- `docs/architecture/repository-structure.md`
- `docs/security/security-baseline.md`
- `docs/quality/test-strategy.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-item-template.md`
- `docs/implementation/agent-collaboration-workflow.md`

## 5. In scope

1. Add framework-independent Workflow values, immutable Template definition
   validation, Instance/Node/Event states, and repository Ports in
   `@contentos/core`. Core must not import Drizzle, PostgreSQL, NestJS, Queue,
   or transport types.
2. Define exactly one server-owned, complete logical catalog entry:
   `content-package-dual-output/v1`. Its machine-readable definition must
   include the fixed Nodes, Gate classification, and dependency edges in §6.
3. Define a deterministic canonical serialization that sorts object keys
   recursively, preserves declared array order, and rejects unsupported JSON
   values. Define `definitionSha256` as lowercase SHA-256 of the UTF-8 bytes of
   that serialization. The Core catalog constant, persisted catalog rows, and
   a loaded catalog must agree exactly on this identity and hash.
4. Add the neutral `WorkflowInstance`, `WorkflowNode`, and `WorkflowEvent`
   Core types and repository Port. A repository may insert fixture instances,
   nodes, and append-only events for repository tests, but this packet exposes
   no Application Use Case, API route, or composition binding that can create
   them in product runtime.
5. Add an additive Drizzle schema, one reviewed generated SQL migration, and
   the corresponding Drizzle metadata. Seed the one catalog entry, its Nodes,
   and its edges in that migration.
6. Add a Drizzle Workflow repository adapter used directly by repository and
   migration tests. It validates loaded Template rows against the Core catalog,
   applies parameterized queries, preserves owner scope, and never becomes a
   generic graph repository.
7. Enforce catalog and Event immutability in PostgreSQL: ordinary `UPDATE` and
   `DELETE` against seeded Template/catalog rows and `workflow_events` must be
   rejected. The implementation may use narrowly named migration-owned
   triggers/functions for this purpose; it must not grant broader application
   credentials or disable migration tooling.
8. Add unit, repository, migration, concurrency, and regression tests stated
   below. Tests may create only per-test temporary rows in the isolated
   integration database; they must not create Product APIs or network work.
9. Update the Current-truth documentation only to describe the implemented
   persistence foundation accurately, while preserving the boundary that no
   Workflow Command, Task, Outbox, Queue, URL Source, Fetcher, UI, SSE, Agent,
   Research, Render, or Export behavior is available.

## 6. Fixed `v1` catalog contract

The following identifier, Node keys, Node kinds, Gate flags, and directed edges
are fixed by this packet. They are the persisted representation of the complete
logical skeleton accepted in M2-DES-004; they do not activate the later Nodes.

| Node key                     | Kind   | Human gate | Logical purpose                                                         |
| ---------------------------- | ------ | ---------- | ----------------------------------------------------------------------- |
| `source_capture`             | `work` | no         | Obtain a Source candidate.                                              |
| `source_review`              | `gate` | yes        | Review Source evidence.                                                 |
| `research`                   | `work` | no         | Produce Research candidate.                                             |
| `research_review`            | `gate` | yes        | Review Research.                                                        |
| `human_opinion`              | `work` | no         | Capture/interpret Human Opinion.                                        |
| `human_opinion_confirmation` | `gate` | yes        | Confirm Human Opinion, including the accepted research-based mode path. |
| `content_foundation`         | `work` | no         | Establish common content foundation.                                    |
| `blog`                       | `work` | no         | Produce Blog branch candidate.                                          |
| `blog_review`                | `gate` | yes        | Approve Blog branch.                                                    |
| `xiaohongshu`                | `work` | no         | Produce Xiaohongshu branch candidate.                                   |
| `xiaohongshu_review`         | `gate` | yes        | Approve Xiaohongshu branch.                                             |
| `design`                     | `work` | no         | Produce Design candidate from approved Xiaohongshu.                     |
| `design_review`              | `gate` | yes        | Approve Design.                                                         |
| `render`                     | `work` | no         | Produce Render from approved Design.                                    |
| `final_export_eligibility`   | `gate` | yes        | Join approved Blog and eligible Render for Export eligibility.          |

The complete edge set is:

```text
source_capture → source_review → research → research_review
  → human_opinion → human_opinion_confirmation → content_foundation
content_foundation → blog → blog_review
content_foundation → xiaohongshu → xiaohongshu_review → design → design_review → render
blog_review + render → final_export_eligibility
```

The static catalog validator must reject duplicate keys, an unknown edge end,
a self-edge, a duplicate edge, an empty catalog, a missing required `v1` Node,
or a different complete edge set. It must not infer a new Node or edge from a
Content Package mode or from persisted state.

The exact hash input is the UTF-8 canonical serialization of this object:

```json
{
  "templateId": "content-package-dual-output",
  "templateVersion": "v1",
  "nodes": [{ "ordinal": 1, "key": "source_capture", "kind": "work", "requiresHumanGate": false }],
  "edges": [{ "ordinal": 1, "from": "source_capture", "to": "source_review" }]
}
```

The illustration is structural, not a partial catalog: the real array contains
every §6 Node and edge exactly once. Node arrays use the table order above;
edge arrays use the order shown in the edge diagram, reading the Blog branch
before the Xiaohongshu branch and the final join last. Both arrays have
one-based contiguous ordinals. The canonical serializer recursively sorts
object keys, keeps those array orders, emits no whitespace, and rejects any
other value type. The loaded relational catalog is reconstructed in ascending
`ordinal` order for both arrays before its hash is checked.

## 7. Persistence contract

### 7.1 Template catalog

The additive schema owns these relational records:

- `workflow_templates`: `template_id`, `template_version`,
  `definition_sha256`, and seed timestamp. Its primary identity is
  `(template_id, template_version)` and it also has a unique composite key
  including `definition_sha256` for exact Instance binding.
- `workflow_template_nodes`: one seed row per §6 Node, keyed by Template
  identity plus `node_key`, with its immutable `kind` and `requires_human_gate`.
- `workflow_template_edges`: one seed row per §6 directed edge, with both ends
  constrained to Nodes of the same Template identity.

Both Node and edge tables persist their positive ordinal. Each ordinal is
unique within its Template and the seeded values must be one-based and
contiguous. The Core validator proves that the ordered relational reconstruction
and the static catalog produce the same hash; database row order is never used
as an implicit ordering rule.

The database must constrain non-empty bounded identifiers, a lowercase
64-character hex hash, legal Node kinds, and a `gate` kind only when
`requires_human_gate` is true. Seeded records are immutable through ordinary
application connections. The migration is the only catalog author for this
release; there is no mutable catalog API, generic Template Builder, selection
UI, or runtime seed/backfill path.

### 7.2 Instance and Node primitives

`workflow_instances` has an opaque UUID identity, owner/package identity,
exact `(template_id, template_version, definition_sha256)` binding, conceptual
Workflow lifecycle (`active`, `paused`, `completed`, `failed`, or `cancelled`),
positive `revision`, and timestamps. It references the existing composite
Content Package owner key and must use `RESTRICT` deletion behavior. It has a
unique constraint on `(content_package_id, template_id, template_version)`;
this makes duplicate v1 bootstrap impossible while allowing a future separately
reviewed Template Version to have its own Instance.

`workflow_nodes` has an opaque UUID identity, an Instance/owner binding, one
Template Node key, conceptual Node state (`not_ready`, `ready`, `running`,
`awaiting_human`, `completed`, `failed`, `skipped`, or `cancelled`), positive
revision, and timestamps. Its foreign keys must prevent a Node from naming a
Template/definition other than the one bound by its Instance. It has one Node
per `(workflow_instance_id, template_node_key)` and permits no state transition
policy in this packet.

No migration or existing API operation creates either row. The persistence
adapter supports test-fixture insertion only as a neutral primitive for the
subsequent owner Command. It must not be registered in `DatabaseService`,
`AppModule`, a Controller, or a Web client.

### 7.3 Append-only Event primitive

`workflow_events` has an opaque UUID identity, Instance/owner binding,
positive per-Instance `sequence`, bounded non-empty `event_type`, a JSON object
`payload`, occurrence timestamp, and nullable Node reference only when it
belongs to that same Instance. It has a unique constraint on
`(workflow_instance_id, sequence)`. The adapter may append an already validated
Event; it exposes no update, replacement, deletion, timeline API, notification,
or event-sourcing replay method.

The packet intentionally does not choose M2-WF-002's first business Event type,
Command result payload, Actor representation, pagination, SSE shape, or
notification mapping. Empty object payloads are allowed for neutral fixture
events; arbitrary external payload is not accepted because there is no external
boundary in scope.

## 8. Contracts and boundaries

| Boundary     | Required contract in this packet                                                                                                                 | Explicitly excluded                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Domain/Core  | Branded IDs, immutable Template definition/catalog validator, Template/Instance/Node/Event values, states, and `WorkflowRepository` Port.        | NestJS/Drizzle/Queue/API DTO types; generic Workflow engine.                         |
| Persistence  | Drizzle schema and adapter matching §7; migration-only catalog seed; parameterized owner-scoped lookups/inserts; database immutability rules.    | API composition, direct process writes, backfill.                                    |
| Migration    | One additive reviewed SQL migration and generated Drizzle metadata. No destructive SQL, data rewrite, or backfill.                               | Rollback migration, catalog edit, migration of existing Package history.             |
| API/OpenAPI  | No HTTP Contract changes.                                                                                                                        | Commands, Queries, DTOs, Controllers, OpenAPI paths.                                 |
| JSON Schema  | None: no persisted or cross-process untrusted payload is introduced.                                                                             | A generic Workflow payload Schema or Queue envelope.                                 |
| Queue/Outbox | None.                                                                                                                                            | Task, Outbox, BullMQ, Dispatcher, lease, retry, or reconciliation.                   |
| Error        | Core exposes bounded domain validation errors; adapter maps database violations only for repository tests. No public error code is added.        | HTTP error mapping or client-visible status.                                         |
| Security     | Owner/package FKs and scoped repository methods; immutable catalog/Event rows; no user content, Secret, network, object storage, or log payload. | Fetcher identity, Source evidence, authorization route behavior, telemetry pipeline. |

## 9. Allowed files and modules

### Allowed modules and files

- `packages/core/src/workflow/**` and `packages/core/src/index.ts`.
- `packages/database/src/schema.ts`, new `packages/database/src/workflow-repository.ts`,
  narrowly necessary `packages/database/src/index.ts` exports, and a test-only
  Workflow repository boundary if it follows the existing source-repository
  testing pattern.
- `migrations/**` only for one generated additive Workflow migration and its
  matching Drizzle metadata.
- `packages/testing/src/**` only for tests of this Work Packet's Core and
  isolated PostgreSQL repository/migration behavior.
- `docs/architecture/workflow-overview.md`,
  `docs/architecture/repository-structure.md`,
  `docs/implementation/roadmap.md`, and this Work Packet, only when the update
  accurately records the implemented boundary.

### Prohibited modules and files

- All `apps/**`, including API composition, Controllers, OpenAPI, Web, Worker,
  Fetcher, and Renderer.
- `packages/contracts/**`, `packages/config/**`, `packages/object-storage/**`,
  `package.json`, workspace configuration, lockfile, Compose, environment
  files, and dependency versions.
- Existing Content Package and Source Domain behavior except type-only imports
  of their existing IDs.
- `docs/decisions/**`, `docs/sessions/**`, `AGENTS.md`, `README.md`,
  `.github/**`, acceptance records, and Current-truth documents not explicitly
  allowlisted above.

### Generated files policy

`corepack pnpm db:generate` is the sole generator for the new migration SQL and
Drizzle metadata. Commit exactly the new generated migration and metadata that
correspond to the reviewed schema change; do not hand-edit existing generated
history. Verify a clean subsequent generation creates no diff. Do not commit
database data, `dist/`, logs, temporary credentials, container files, or test
artifacts.

## 10. Acceptance criteria

1. The persisted catalog contains exactly one immutable
   `content-package-dual-output/v1` Template whose Node and edge records match
   §6 and whose hash equals the Core canonical definition hash.
2. The catalog validator rejects every malformed catalog case named in §6;
   a loaded catalog with a changed hash, Node, edge, kind, or Gate flag fails
   closed before use.
3. An Instance binds one exact Template identity, version, and definition hash;
   a mismatched or unknown binding, cross-owner Package, non-positive revision,
   invalid lifecycle, or duplicate package/v1 Instance is rejected.
4. A Node cannot name a Node definition outside its Instance Template, cannot
   be duplicated for an Instance, and cannot carry an invalid state or revision.
   No automatic Node materialization or state advancement occurs.
5. An Event belongs to one Instance and, when present, a Node of that same
   Instance; duplicate/non-positive sequence, malformed payload shape, invalid
   type, or cross-Instance Node reference is rejected. Event rows can be
   appended but not updated or deleted through ordinary application connections.
6. Ordinary application connections cannot update or delete Template catalog
   rows. The migration can be rerun against an empty database and existing M1/
   M2 Source schema without creating, altering, or fabricating Package, Source,
   Instance, Node, or Event history.
7. Two concurrent attempts to insert the same Package/v1 Instance leave one
   committed Instance and one deterministic duplicate/conflict result; no
   secondary Node/Event is created as a side effect.
8. Existing M1 Content Package and Source protected routes, Source tests, and
   database migrations retain their behavior. The change introduces no HTTP
   path, OpenAPI change, Queue, Redis/BullMQ use, network fetch, storage write,
   user-visible Workflow UI, Agent, or Source evidence behavior.
9. The changed-file list stays within §9; no dependency, credential, local
   path, Secret, generated runtime artifact, container, or database residue is
   committed.
10. Documentation states only the persisted immutable catalog and neutral
    primitives; it does not claim that a Workflow Command, Task, Outbox,
    Dispatcher, Fetcher, Timeline/SSE, automatic transition, or URL capture is
    available.

## 11. Required tests and verification

### Required tests

- Core unit tests for canonical serialization/hash, exact v1 definition, all
  malformed catalog cases in §6, valid/invalid Instance/Node/Event values, and
  no framework/database import into Core.
- Isolated PostgreSQL repository tests for catalog seed/load parity,
  owner-scoped Package binding, all relational constraints in §10, catalog/Event
  update/delete rejection, and concurrent duplicate-Instance insertion.
- Migration tests from an empty database and a database migrated through the
  immediately previous supported schema. Assert no workflow rows are backfilled
  and existing Source rows remain readable.
- Regression coverage for existing Content Package and Source Core/repository/
  API behavior, including the existing Docker integration harness.
- Documentation/repository integrity tests and a forbidden-path/diff scan.

### Required commands

Run and report the actual result of:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm db:generate
git diff --check
git status --short --untracked-files=all
```

`db:generate` must be run after the intended migration is present and leave no
additional diff. If a test requires Docker or a migration database and cannot
be run, stop rather than claim equivalent static evidence.

## 12. Security, migration, and observability review

### Security

This packet accepts no user input, external input, credential, provider,
network, object-storage operation, browser input, or Queue message. Nevertheless,
the repository must preserve owner/package FKs, parameterized SQL, fail-closed
catalog validation, and database-level immutability. Do not log Template JSON
payloads, Event payloads, SQL errors, database URLs, test fixtures, or Secrets
as a shortcut for diagnostics. An opaque ID never replaces owner scope.

### Migration and compatibility

The migration is additive and forward-only. It creates and seeds catalog/
Workflow tables only. It performs no deletion, backfill, change to existing
table constraints, history rewrite, or automatic rollback. It must retain
existing Package and Source data and be safe to apply once through the project
migration runner. A rollback is not authorized; ordinary application clients
cannot mutate immutable rows, while future schema evolution requires a new
reviewed migration and, if it changes Template semantics, a new Decision Review.

### Observability

No new runtime observability pipeline is in scope. Repository tests may inspect
their isolated database rows. The future command/Event Contract owns audit and
correlation fields; this packet must not invent a telemetry, Timeline, or SSE
surface.

## 13. Documentation updates

- Update `docs/architecture/workflow-overview.md` only with the factual
  persistence boundary and inactive-execution disclaimer.
- Update `docs/architecture/repository-structure.md` only with the new Core and
  database Workflow module ownership.
- Update `docs/implementation/roadmap.md` to mark `M2-WF-001` In Review only
  after all implementation evidence is complete; keep M2 In Progress and M3
  not started.
- Do not change Accepted DEC, Session history, `AGENTS.md`, or product scope.

## 14. Non-goals

- Any callable owner Workflow Command, lazy bootstrap, expected-revision API,
  idempotency persistence, or Instance creation in a product request.
- URL Source Reference, URL Capture Request, Source Snapshot/evidence,
  approval, Task, Outbox, Dispatcher, BullMQ, service identity, claim, lease,
  retry, reconciliation, or public URL Fetcher.
- Timeline query, SSE, polling, Web Workflow UI, generic Workflow Builder,
  Template selection/upgrade/migration, Agent, Research, Human Opinion, Blog,
  Xiaohongshu, Design, Render, Export, or M3 work.
- New configuration, dependency, application process, provider, database,
  queue product, or microservice.

## 15. Destructive operations and Git permissions

No destructive operation is authorized. Do not remove Docker volumes, images,
containers, buckets, database data, migrations, or existing tracked files.
Test cleanup is limited to exact task-created rows in the isolated test
database and the existing harness-owned temporary runtime resources.

- Implementation Agent commit: no
- Implementation Agent push: no
- Implementation Agent Pull Request: no
- Implementation Agent merge: no
- Control/review agent publication: only after an independent `PASS` and the
  user's standing GitHub authorization.

## 16. Escalation conditions

Stop and return `HUMAN_DECISION_REQUIRED` if implementation requires:

- a change to the fixed v1 Node, Gate, or dependency definition in §6;
- an API, Queue, Outbox, Fetcher, Source-capture, Agent, or UI capability;
- a new dependency, provider, configuration, database, destructive operation,
  or migration that changes existing data semantics;
- a direct Core dependency on Drizzle, PostgreSQL, NestJS, BullMQ, or a
  transport type;
- a catalog/event mutation bypass or a weaker immutability guarantee;
- a changed Accepted DEC, Current-truth conflict, scope/security/workflow/
  architecture/release-gate change; or
- incomplete required migration or Docker-backed verification.

## 17. Completion report

Return the repository Implementation Completion Report with: Summary; Design
choices; Files changed; Migration; Commands run; Test results; an
Acceptance-Criteria evidence table; Security impact; Known limitations;
Incomplete items; Documentation updates; Possible new DEC; and Git status.
State the actual executor runtime and any read-only analysis help used. Do not
include Secrets, database URLs, local paths, raw SQL errors, or test-data
payloads.
