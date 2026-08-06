# M2-WF-004A — Workflow Projection and Timeline Query

**Status:** Completed

**Issue:** [#106](https://github.com/JettxonHo/ContentOS/issues/106)

**Implementation PR:** [#108](https://github.com/JettxonHo/ContentOS/pull/108)

**Merge commit:** `acdb971ffd8a1c8898666182ac017817f095e1b7`

**Planning branch:** `codex/m2-wf-004a-ready-design`

**Implementation branch:** `codex/m2-wf-004a-workflow-projection-timeline-query`

**Planning / Definition-of-Ready base:** `4bf60095de0e2ddc3d9c47f5b32e26deb8033942`

**Implementation base:** `d3322d130d517ef73f3f93961f4623d59b4b7383`

## Identification

- Work Item: `M2-WF-004A`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Risk Classification: private owner-scoped Workflow read API, event projection,
  pagination consistency, and user-content metadata disclosure

## Goal

Add two authenticated, owner-scoped, side-effect-free REST Queries that let a
caller read the current authoritative Workflow projection and a bounded
sequence-ordered Timeline for one Content Package. PostgreSQL remains the
Workflow truth; the response exposes only the state needed by the M2 Workspace
and later SSE recovery, without exposing raw event payloads, private Source
content, delivery internals, or legal Workflow Commands.

## Canonical sources

- [Canonical Decision Register](../../decisions/decisions.md)
- [Domain Overview](../../architecture/domain-overview.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Process Topology](../../architecture/process-topology.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Technical Architecture](../../architecture/technical-architecture.md)
- [Data Classification](../../security/data-classification.md)
- [Security Baseline](../../security/security-baseline.md)
- [Test Strategy](../../quality/test-strategy.md)
- [M2 Exit Criteria](../milestone-exit-criteria.md#12-m2-exit-criteria)
- [Roadmap](../roadmap.md)
- [M2-WF-001 — Workflow persistence foundation](m2-wf-001-template-instance-node-event-persistence.md)
- [M2-WF-002 — Atomic URL-capture command](m2-wf-002-atomic-url-capture-command.md)
- [M2-WF-003A — Transactional Outbox dispatch](m2-wf-003a-transactional-outbox-dispatch.md)
- [M2-WF-003B — Fetcher claim and lease](m2-wf-003b-fetcher-gateway-claim-lease.md)
- [M2-WF-003C — Lease and delivery reconciliation](m2-wf-003c-lease-delivery-reconciliation.md)
- [Issue #106](https://github.com/JettxonHo/ContentOS/issues/106)

Relevant Accepted Decisions: DEC-135, DEC-144, DEC-148, DEC-170, DEC-172,
DEC-199–DEC-200, DEC-216, DEC-224, DEC-226–DEC-227, DEC-229, DEC-234,
DEC-245, DEC-259, DEC-280, and DEC-287–DEC-292. A later Accepted Decision
governs an actual conflict.

DEC-148 defines a future Current Action and legal-Command projection, but that
policy is deliberately not inferred here. It requires a separate Ready Work
Item after legal Command semantics exist.

## Current truth and dependencies

- The fixed `content-package-dual-output/v1` catalog, Workflow Instance,
  materialized Nodes, append-only Events, URL-capture Task, Outbox dispatch,
  Claim/Heartbeat/Result, and lease reconciliation are implemented.
- PostgreSQL is authoritative. Redis/BullMQ delivery state and process memory
  are never substituted for a Workflow Query.
- One URL-capture Task currently belongs to the materialized `source_capture`
  Node. This bounded M2 relation is one-to-one; the public projection must not
  invent a general multi-Task Node model.
- Claim and Heartbeat changes do not append Timeline Events. A caller observes
  their current public Task state through the full Workflow projection.
- M2-WF-004B will add SSE notifications. Its notification is not a state
  response; after a notification or disconnect, callers use these REST Queries.
- Archive preserves private history. An authenticated Owner may read an
  archived Package's Workflow and Timeline; archive is not deletion or Purge.

## Design review and fixed choices

Three independent caller-, projection-, and Timeline-focused designs were
compared before freezing this packet. The selected design keeps one deep
read-only Port and two stable public DTOs.

### Selected alternatives

1. **Materialized Nodes only.** The projection returns existing
   `workflow_nodes` rows in template ordinal order. It does not synthesize all
   15 catalog Nodes or a pseudo `not_started` state. This avoids exposing later
   milestone stages as active runtime state.
2. **Archived owner-readable.** An owned archived Package returns `200`; an
   unknown or cross-owner Package returns the same `404`.
3. **Event high-water plus full projection.** Timeline pagination uses the
   immutable Event sequence. `latestSequence` is an Event high-water mark, not
   a general revision for Task-only changes. Polling the full projection
   recovers current Task state.
4. **Safe typed Timeline.** Known Events map to a minimal public union. Unknown
   or unmappable Events become `workflow_event.v1` while retaining sequence,
   Node key when safely resolvable, and occurrence time. Raw `event_type` and
   payload never cross the API.
5. **One statement per endpoint.** Each adapter method uses one parameterized,
   Package-rooted PostgreSQL statement or CTE so authorization, projection or
   page, and Event high-water come from one statement snapshot.

### Rejected alternatives

- A full 15-Node catalog with null or synthetic state was rejected because it
  creates a second runtime interpretation and prematurely exposes later work.
- Treating archive as not-found was rejected because it removes owner audit and
  history access without a deletion Decision.
- Returning raw Event payload, Task/Outbox/Claim identifiers, or a generic
  database-row DTO was rejected because the public caller does not need those
  details and they expose private transport state.
- Offset pagination, total counts, snapshot tokens, caches, materialized views,
  and a separate Timeline store were rejected as unnecessary for the bounded
  append-only sequence.
- Current Action, progress percentages, readiness, and available Commands were
  rejected because no accepted legal-Command policy is implemented yet.

No Blocking Design Question remains and no new DEC is required.

## Fixed internal Port

Core owns one provider-neutral Port with two methods. Exact TypeScript names
may follow repository naming conventions, but the method meanings and returned
fields are fixed:

```ts
export interface WorkflowQueryScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

export interface WorkflowTimelinePageScope extends WorkflowQueryScope {
  readonly after: number;
  readonly limit: number;
}

export interface WorkflowQueryPort {
  getProjection(scope: WorkflowQueryScope): Promise<WorkflowProjection | null>;
  listTimeline(scope: WorkflowTimelinePageScope): Promise<WorkflowTimelinePage>;
}
```

Both methods throw the existing
`ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND')` when no exact
owner-scoped Package exists. `getProjection()` returns `null` only when that
authorized Package exists but has no Workflow Instance. `listTimeline()` uses
the same not-found rule and returns its fixed null/empty page only for an
authorized Package without an Instance. The database adapter must preserve this
distinction inside each method's single Package-rooted statement.

The production adapter is one explicit-SQL PostgreSQL projection in
`@contentos/database`. `DatabaseRuntime` composes the Port, and the API exposes
it through a dedicated runtime token. No application service is added merely
to forward a read.

## Fixed public API contracts

Both routes require the existing authenticated session and server-side owner
authorization, are visible in OpenAPI, and perform no state mutation:

```text
GET /v1/content-packages/:packageId/workflow
GET /v1/content-packages/:packageId/workflow/events?after=&limit=
```

### Workflow projection

The exact top-level response wrapper is:

```ts
interface WorkflowProjectionResponse {
  readonly data: {
    readonly workflow: WorkflowProjectionResource | null;
  };
}
```

An existing Package with no Workflow Instance returns:

```json
{
  "data": {
    "workflow": null
  }
}
```

An existing Workflow returns exactly:

```ts
interface WorkflowProjectionResource {
  readonly instanceId: string;
  readonly templateId: 'content-package-dual-output';
  readonly templateVersion: 'v1';
  readonly lifecycle: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  readonly revision: number;
  readonly latestSequence: number;
  readonly nodes: readonly WorkflowNodeProjectionResource[];
}

interface WorkflowNodeProjectionResource {
  readonly key: string;
  readonly ordinal: number;
  readonly kind: 'work' | 'gate';
  readonly requiresHumanGate: boolean;
  readonly state:
    'not_ready' | 'ready' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  readonly revision: number;
  readonly updatedAt: string;
  readonly task: UrlCaptureTaskProjectionResource | null;
}

interface UrlCaptureTaskProjectionResourceBase {
  readonly kind: 'url_capture';
  readonly attemptNumber: number;
  readonly updatedAt: string;
}

type UrlCaptureTaskProjectionResource =
  | (UrlCaptureTaskProjectionResourceBase & {
      readonly state: 'queued' | 'running' | 'succeeded';
      readonly failure: null;
    })
  | (UrlCaptureTaskProjectionResourceBase & {
      readonly state: 'failed';
      readonly failure: WorkflowFailureResource;
    });

type WorkflowFailureResource =
  | { readonly category: 'fetch_failed'; readonly code: 'FETCH_FAILED' }
  | { readonly category: 'validation_blocked'; readonly code: 'VALIDATION_BLOCKED' }
  | { readonly category: 'unsupported_content'; readonly code: 'UNSUPPORTED_CONTENT' }
  | { readonly category: 'too_large'; readonly code: 'TOO_LARGE' }
  | { readonly category: 'timeout'; readonly code: 'TIMEOUT' }
  | { readonly category: 'redirect_blocked'; readonly code: 'REDIRECT_BLOCKED' }
  | { readonly category: 'extraction_failed'; readonly code: 'EXTRACTION_FAILED' }
  | { readonly category: 'package_archived'; readonly code: 'PACKAGE_ARCHIVED' }
  | { readonly category: 'source_role_limit'; readonly code: 'SOURCE_ROLE_LIMIT' }
  | { readonly category: 'object_integrity_failed'; readonly code: 'OBJECT_INTEGRITY_FAILED' };
```

Rules:

- `nodes` contains only materialized Nodes, ordered by fixed template ordinal.
- The current internal Task state `leased` maps to public `running`.
- Task `attemptNumber` comes from `workflow_tasks.claim_attempt_number`. It is
  `0` before the first successful Claim and otherwise denotes the current or
  most recent Claim attempt, including a re-queued Task after lease expiry.
- Terminal failure category/code come only from the existing terminal Result's
  `FetcherResultRecordedCategory` / `FetcherResultSafeCode` finite mapping shown
  above. A failed Task without that exact existing pair fails closed through the
  sanitized internal-error path. Non-failed states always have `failure: null`.
- `latestSequence` is `0` when the Instance has no Event and otherwise is the
  maximum append-only Event sequence.
- The response omits URL, Source/Task/Outbox/Claim/lease/internal IDs, Snapshot,
  Object key, raw payload, digest, owner, headers, SQL, provider details,
  Current Action, readiness, percentage, and legal Commands.

### Timeline query and page

Query parameters use an exact parser:

- `after`: optional decimal integer, default `0`, range `0..2147483647`;
- `limit`: optional decimal integer, default `20`, range `1..50`;
- unknown keys, duplicate values, non-string values, signs, whitespace,
  fractions, exponential forms, and overflow fail with `422 INVALID_REQUEST`.

The page response is exactly:

```ts
interface WorkflowTimelinePageResponse {
  readonly data: {
    readonly workflowInstanceId: string | null;
    readonly latestSequence: number;
    readonly items: readonly WorkflowTimelineItemResource[];
    readonly nextAfter: number | null;
  };
}
```

For an existing Package with no Instance it returns `workflowInstanceId: null`,
`latestSequence: 0`, `items: []`, and `nextAfter: null`.

The adapter reads `sequence > after` in ascending order with `limit + 1` rows.
It returns at most `limit` items. `nextAfter` is the last returned sequence only
when the extra row proves another item exists within the statement snapshot;
otherwise it is `null`. `after >= latestSequence` returns an empty page rather
than an error. A caught-up polling caller uses `latestSequence` as its next
`after` value.

Every Timeline item is one member of this literal-discriminated union. Every
member contains exactly the common fields shown in `WorkflowTimelineItemBase`:

```ts
interface WorkflowTimelineItemBase {
  readonly sequence: number;
  readonly nodeKey: string | null;
  readonly occurredAt: string;
}

type WorkflowTimelineItemResource =
  | (WorkflowTimelineItemBase & { readonly kind: 'url_capture_requested.v1' })
  | (WorkflowTimelineItemBase & {
      readonly kind: 'fetcher_lease_expired.v1';
      readonly attemptNumber: number;
    })
  | (WorkflowTimelineItemBase & {
      readonly kind: 'url_capture_succeeded.v1';
      readonly attemptNumber: number;
    })
  | (WorkflowTimelineItemBase & {
      readonly kind: 'url_capture_failed.v1';
      readonly attemptNumber: number;
      readonly failure: WorkflowFailureResource;
    })
  | (WorkflowTimelineItemBase & { readonly kind: 'workflow_event.v1' });
```

The fixed public discriminated variants are:

- `url_capture_requested.v1`: common fields only;
- `fetcher_lease_expired.v1`: common fields plus `attemptNumber`, mapping the
  existing persisted event of the same name and
  `payload.claimAttemptNumber → attemptNumber`;
- `url_capture_succeeded.v1`: common fields plus `attemptNumber`;
- `url_capture_failed.v1`: common fields plus `attemptNumber` and
  the exact finite `failure` pair above;
- `workflow_event.v1`: common fields only, used for an unknown event type or a
  known event whose bounded payload cannot be safely mapped.

Success/failure `attemptNumber` comes from the corresponding Event payload and
lease-expiry `attemptNumber` comes from `claimAttemptNumber`. These known
variants require a positive integer attempt. An invalid known payload maps to
the generic variant rather than partially exposing it.

The generic variant does not reveal the original event type or raw payload.
The projection wrapper, page wrapper, every nested resource, every failure
pair, and every Timeline union branch use `additionalProperties: false`.

### Errors and authorization

- Invalid Package IDs or Timeline query parameters: `422 INVALID_REQUEST`.
- Missing/invalid authentication: existing `401` contract.
- Unknown or cross-owner Package: existing indistinguishable
  `404 CONTENT_PACKAGE_NOT_FOUND`.
- Owned active or archived Package: readable as described above.
- Unexpected database or mapping failure: existing sanitized `500` contract.
- No error or log includes private content or persistence/transport details.

## In scope

1. Add the exact Core read-only Port and provider-neutral projection values.
2. Add exact API request/response contracts and deterministic Timeline query
   parsing.
3. Add one PostgreSQL explicit-SQL adapter with one owner-scoped statement per
   endpoint and no writes.
4. Compose the Port into `DatabaseRuntime` and the API through a dedicated
   token and one Controller.
5. Add both authenticated OpenAPI-visible routes and the fixed authorization,
   archive, empty, projection, Timeline, and cursor behavior.
6. Add focused mapper/contract tests and real PostgreSQL/API integration tests.
7. Synchronize Workflow/topology/repository Current-truth and M2 status without
   claiming SSE or Web UI availability.

## Out of scope

- Workflow Command, state transition, Node materialization, automatic action,
  Retry, Pause, Cancel, Current Action, legal Commands, or progress percentage;
- SSE, polling timers, Web UI, browser state, notification persistence, Redis,
  BullMQ, Queue consumer, Worker, Fetcher, Renderer, Agent, or Research;
- Source, Snapshot, Working Copy, Version, Approval, Task, Outbox, Claim, lease,
  Result, Event, or Package mutation;
- exposing raw Event payload/type, URL, Source body, Object key, Secret, Header,
  Claim, SQL, provider detail, internal delivery metadata, or a new hash;
- a second Workflow truth, cache, materialized view, table, index, Schema,
  migration, backfill, lock, dependency, package, configuration, or process;
- browser tests, concurrent harness runs, migration tests, deployment, M3, or a
  new DEC.

## Allowed and prohibited files

### Allowed files

- `packages/core/src/workflow/workflow-query.ts`
- `packages/core/src/workflow/workflow-query.test.ts`
- `packages/core/src/index.ts`
- `packages/contracts/src/api/workflow-query-contracts.ts`
- `packages/contracts/src/api/workflow-query-contracts.test.ts`
- `packages/contracts/src/index.ts`
- `packages/database/src/workflow-query-projection.ts`
- `packages/database/src/runtime.ts`
- `apps/api/src/workflow/workflow.controller.ts`
- `apps/api/src/database.service.ts`
- `apps/api/src/runtime.tokens.ts`
- `apps/api/src/app.module.ts`
- `packages/testing/src/integration/workflow-query-api.test.ts`
- `packages/testing/src/integration/api.test.ts`
- `docs/architecture/workflow-overview.md`
- `docs/architecture/process-topology.md`
- `docs/architecture/repository-structure.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-packets/m2-wf-004a-workflow-projection-timeline-query.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

No other file is implicitly allowed. If a required file is absent from this
list, stop and request a bounded Work Packet correction before editing it.

### Prohibited modules and generated files

- all `apps/web/**`, `apps/worker/**`, `apps/fetcher/**`, and `apps/renderer/**`;
- existing Workflow/Source/Task/Outbox/Fetcher write repositories or services;
- `schema.ts`, `migrations/**`, Drizzle metadata, package manifests,
  `pnpm-lock.yaml`, configuration, Compose, and `.github/**`;
- DEC, Session, Product scope, and Security policy files;
- generated SQL/snapshots, build outputs, logs, credentials, local paths, and
  runtime artifacts.

## Contract review

- Domain/Internal Interface: one read-only `WorkflowQueryPort` with two methods.
- API/OpenAPI: the two GET routes and exact DTOs above.
- JSON Schema: exact request/response schemas; no new persisted schema version.
- Database: existing tables/constraints only; one parameterized statement per
  endpoint and no write/lock.
- Queue/Event write Contract: unchanged. Existing Events are projected but not
  created, mutated, replayed, or treated as complete Event Sourcing.
- Error Contract: existing `INVALID_REQUEST`, authentication,
  `CONTENT_PACKAGE_NOT_FOUND`, and sanitized internal failure.
- Security Boundary: authenticated private owner-scoped read with bounded safe
  projection; raw content and infrastructure details remain private.
- Configuration/Observability: no new configuration, log, metric, or trace.

## Acceptance Criteria

1. An authenticated Owner can read an owned active or archived Package's
   Workflow projection; unknown and cross-owner Packages return the same `404`,
   and unauthenticated access returns `401`.
2. An existing Package without a Workflow returns the exact null/empty
   projection and Timeline shapes without creating state.
3. The projection returns only materialized Nodes in catalog ordinal order with
   exact lifecycle, revision, state, gate, timestamp, and bounded Task fields;
   it never synthesizes the full 15-Node catalog.
4. The current URL-capture Task maps `leased` to public `running`, exposes
   `claim_attempt_number` with the fixed zero/current semantics and only a
   valid existing terminal failure category/code pair when applicable, and
   exposes no internal Task, delivery, Claim, URL, Snapshot, or Object details.
5. Timeline maps the four known public variants exactly and safely maps an
   unknown or malformed Event to `workflow_event.v1` without losing its
   sequence or exposing original type/payload. The lease event preserves the
   existing `fetcher_lease_expired.v1` name and maps `claimAttemptNumber`;
   success/failure Events map their own `attemptNumber`.
6. Timeline defaults, bounds, rejection behavior, ascending pagination,
   `latestSequence`, `nextAfter`, caught-up empty page, and multi-page no-gap/
   no-duplicate behavior match the fixed contract.
7. Each endpoint uses one owner-scoped PostgreSQL statement snapshot, performs
   no write, and leaves Package/Workflow/Node/Task/Outbox/Event/Source counts
   and revisions unchanged on success and rejection paths.
8. OpenAPI documents exactly the two routes, query parameters, response DTOs,
   and `200/401/404/422/500` statuses without exposing the private Fetcher API.
9. Responses and ordinary API logs contain none of the seeded URL, Source body,
   Object key, Claim, Secret, raw Header, raw Event payload/type, SQL, database
   URL, or stack markers.
10. Existing Source/API/Workflow/Fetcher behavior and all required repository
    checks remain green; no Schema, migration, dependency, configuration,
    process, write path, SSE, UI, Agent, Research, or M3 behavior changes.

## Required tests

### Contract and unit tests

- exact response schemas reject additional fields;
- Timeline parser accepts omitted/default and valid boundary values and rejects
  unknown/duplicate/malformed/fractional/overflow values;
- Task mapping covers queued-before-first-Claim (`attemptNumber: 0`),
  queued-after-recovery, leased-to-running, succeeded, and failed, including
  the exact finite failure pair;
- Event mapping covers all four known variants, their exact attempt sources,
  the finite failure pair, and the generic safe fallback;
- mapper tests assert raw payload fields are not copied.

Tests must focus on reachable public boundaries and accepted mappings. Do not
manufacture repetitive impossible cases or add a generalized hash mechanism.

### Real PostgreSQL/API integration tests

Use the isolated Integration Harness:

1. Verify `401`, malformed Package/query `422`, missing/cross-owner `404`, and
   archived-owner `200`; compare relevant row counts/revisions before and after.
2. Verify an existing Package without an Instance returns the exact null and
   empty shapes.
3. Create a real v1 Instance with only materialized `source_capture` and
   `source_review` Nodes; verify catalog order and exact current Task public
   state/failure without synthetic Nodes.
4. Seed the four real known Event kinds plus an unknown Event; paginate with
   `limit=2` across pages, proving ascending order, no omission/duplication,
   stable high-water, `nextAfter`, and caught-up behavior.
5. Seed distinct private markers in submitted URL, Result/Object fields, Claim,
   and Event payload; assert responses and API logs contain neither their values
   nor prohibited field names.
6. Verify OpenAPI route/query/response/status contracts and existing API
   regressions.

No browser, concurrent, or migration test is required because this Work Item
adds no UI, concurrency contract, Schema, or migration.

### Required commands

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm db:generate` twice, both with no Schema change
- `git diff --check`
- allowed/prohibited file, dependency/lockfile, Secret/local-path/generated
  artifact, process/container, and isolated-harness residue checks

If the sandbox prevents Docker/process inspection, report the environmental
failure and rerun the same required command in an authorized host environment;
do not claim the sandbox result passed.

## Security review

- This task reads private Workflow state and bounded failure metadata but no
  Source body is required for the public caller.
- Authentication and server-side owner scope are mandatory. Cross-owner and
  unknown Packages are indistinguishable.
- Archive remains owner-readable history; no Purge or deletion semantics change.
- No Credential, network provider, Object Storage operation, external input,
  Prompt, or Agent boundary is added.
- Projection and mapping use allowlists. Raw Event payload/type, URL, content,
  Object key, Claim, lease, Secret, Header, SQL, database URL, and stack remain
  absent from responses and ordinary logs.
- Security testing stays proportionate: it covers the real HTTP/authorization/
  projection boundary and does not duplicate impossible internal cases.

## Migration and compatibility review

- Public API: additive two-route read Contract. OpenAPI must reflect it.
- Database: no Schema, migration, index, backfill, or data rewrite.
- Queue, Event persistence, Task, Workflow Command, JSON payload, and
  configuration Contracts: unchanged.
- Compatibility: existing clients are unaffected; new DTOs are exact and
  version their event `kind` literals.
- Rollback: remove the two routes, provider wiring, read adapter, contracts,
  tests, and documentation. No persisted data rollback is needed.

## Observability

No new log, metric, trace, or audit Event is required for a successful private
read. Existing request/error handling remains in force. Unexpected failures use
the sanitized API error path; no query parameter, private data, SQL, or raw
database error is newly logged.

## Documentation updates

- Workflow Overview: add authoritative projection and Timeline read boundary.
- Process Topology: add API-to-PostgreSQL read path and preserve future SSE
  boundary.
- Repository Structure: record Core Port, database adapter, API Controller, and
  Contract ownership.
- Roadmap, `AGENTS.md`, and English/Chinese README: mark `M2-WF-004A` accurately
  as In Review during implementation; do not claim SSE or Web UI.
- This Work Packet: planning, Ready-review, implementation, and completion
  evidence.
- Decision Register: unchanged. No new DEC is expected.

## Definition of Ready checklist

- Goal, scope, exclusions, contracts, errors, authorization, archive behavior,
  cursor semantics, event mapping, files, tests, security, compatibility, and
  documentation targets are fixed.
- `M2-WF-001` through `M2-WF-003C` and `M2-SRC-004` are completed.
- Existing database fixtures and the isolated API Integration Harness can
  create every required state.
- No Schema, dependency, configuration, external provider, or product decision
  is required.
- No Blocking Design Question remains.

Implementation may start only after an independent Definition-of-Ready review
records `PASS`, this packet is marked `Ready`, and its planning Pull Request is
merged.

## Definition of Done

Implementation, exact Contracts, owner authorization, archive and empty-state
behavior, Timeline pagination, safe mapping, errors, OpenAPI, integration
evidence, regression checks, documentation, and every Acceptance Criterion are
complete. The diff contains only allowed files, no required test is skipped or
misreported, no Secret/private marker or runtime artifact remains, independent
split-axis review passes, required CI is green, and the implementation is
reviewable and reversible as one Pull Request.

## Independent Definition-of-Ready review

**Verdict:** PASS

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: XHigh
- Actual Model / Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/wf004a_ready_review`
- Reviewed Base: `4bf60095de0e2ddc3d9c47f5b32e26deb8033942`
- Blocking Design Question: None
- Possible new DEC: None

The first review identified and bounded three contract gaps: the public lease
Event name, Package-not-found versus no-Instance semantics, and exact failure /
attempt typing. The packet now preserves the existing
`fetcher_lease_expired.v1` event, fixes the Port and response semantics, and
uses the existing finite failure mapping with explicit attempt sources. The
independent re-review confirmed that the Goal, contracts, existing database
feasibility, allowlist, tests, security, migration, and documentation boundaries
are sufficient for implementation.

## Implementation handoff

**Status at handoff:** In Review

- Logical Role: `IMPLEMENTATION_AGENT`
- Requested Model / Reasoning: `gpt-5.6-terra` / XHigh
- Actual Model / Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/wf004a_implementation`
- Implementation Base: `d3322d130d517ef73f3f93961f4623d59b4b7383`

The implementation adds the one Core read Port, exact REST schemas, explicit
PostgreSQL projection, dedicated API token/controller, and real integration
fixtures. It adds no schema, migration, dependency, process, Queue, SSE, UI,
or write path. Completion and publication evidence remain pending independent
review and required checks.

At implementation handoff, frozen installation, workspace resolution,
`pnpm check`, documentation/repository/Secret checks, two no-diff
`db:generate` runs, and the full isolated integration Harness passed. The
host Harness retained only the existing `pg@9` deprecation warning. A sandbox
Harness setup attempt was blocked by its process/Docker restrictions and
cleaned up; the same required command was rerun successfully on the host.

### Review correction round 1

The bounded review correction now binds both PostgreSQL projections to exact
`content-package-dual-output/v1`, makes the Task response a true discriminated
contract, adds exact Timeline query metadata to OpenAPI, and expands real
adapter/controller evidence for task states, fixed-template isolation, safe
Timeline pagination, owner/archive authorization, read-only behavior, strict
response schemas, and API-log redaction.

The first correction typecheck exposed a controller mapper that had not yet
preserved the new Task discrimination. The first focused Integration run then
exposed an invalid cleanup-fixture assumption about Source child-table columns.
Both were corrected at their roots; the focused rerun passed 8 tests. Final
`pnpm check` passed 46 files / 422 tests, and the tracked full Integration
Harness passed 24 files / 176 tests with owned cleanup complete. No schema,
migration, dependency, lockfile, configuration, or new hash mechanism was
introduced. At handoff, status remained In Review pending Git publication,
required CI, and merge.

## Independent implementation review

**Verdict:** PASS after Review Correction Round 1

Three independent `gpt-5.6-sol` XHigh review axes inspected the real diff and
performed no repository or Git writes:

- Persistence / correctness / state consistency —
  `/root/wf004a_review_persistence`;
- API / authorization / security / contract —
  `/root/wf004a_review_api_security`; and
- Test quality / failure paths / documentation / governance —
  `/root/wf004a_review_quality_governance`.

For every reviewer, Actual Model / Runtime Model Status remained
`UNVERIFIED_RUNTIME_MODEL`; the reviewed implementation base was
`d3322d130d517ef73f3f93961f4623d59b4b7383`.

The first review found exact-v1 isolation, Task state/failure discrimination,
OpenAPI query metadata, and integration-evidence gaps. Correction Round 1 fixed
the root causes and expanded focused evidence without changing the Work Item
scope. All three independent re-reviews returned `PASS`; no new P1/P2 defect,
Blocking Design Question, possible DEC, migration, dependency, or high-risk
escalation remains.

## Publication and completion evidence

PR #108 (`feat: add workflow projection and timeline queries`) passed all
three required CI jobs: Docker-independent quality, Integration smoke, and the
M1 browser thin slice. The first Browser attempt failed before repository
checkout because the GitHub Actions download service returned an external
service error; rerunning only that failed job passed. No project correction was
required for that infrastructure failure.

After independent split-axis review passed and required CI was green, PR #108
was squash-merged as
`acdb971ffd8a1c8898666182ac017817f095e1b7` (`feat: add workflow projection
and timeline queries (#108)`) on 2026-08-06. `M2-WF-004A` is Completed. M2
remains In Progress; SSE, Source Web workspace, and M2 exit acceptance remain
separate later Work Items.
