# WORK PACKET — M2-WF-003C

**Status:** Completed

**Purpose:** Durable planning-to-implementation handoff for bounded recovery
of expired Fetcher leases and the next current-generation Queue delivery.

**Created:** 2026-08-02

## 1. Identification

- **Task ID:** `M2-WF-003C`
- **Title:** Lease and Delivery Reconciliation
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#75](https://github.com/JettxonHo/ContentOS/issues/75)
- **Branch:** `codex/m2-wf-003c-lease-delivery-reconciliation`
- **Base commit:** `c3a38f83f9205317431e915ec2969db8554c8e8b`
- **Status:** Completed
- **Implementation PR:** [#77](https://github.com/JettxonHo/ContentOS/pull/77)
- **Merge commit:** `ed428b1c12eb6e2ce01d964d56c05a09a3ba87d1`
- **Independent Review:** Passed
- **GitHub CI:** Passed
- **Executor profile:** `BACKEND_GENERAL_EXECUTOR`
- **Owner:** one implementation agent as the only repository writer
- **Reviewer:** independent review agent before Git publication
- **Dependencies:** `M2-WF-003A` completed through PR #69; `M2-WF-003B`
  completed through PR #73; [M2-DES-005](m2-des-005-fetcher-execution-gateway.md)
  Option B accepted
- **Risk classification:** authoritative Task and Outbox state, lease fencing,
  PostgreSQL concurrency, immutable workflow evidence, Redis/BullMQ delivery,
  and Worker recovery

### Implementation entry condition

Start only from a clean, current `main` containing this Work Packet. Create
`codex/m2-wf-003c-lease-delivery-reconciliation` from that `main`, record the
full base SHA in the Completion Report, and keep one implementation agent as
the only repository writer. This planning branch is not an implementation
baseline.

## 2. Goal

When a Fetcher claim expires, the Worker atomically makes the still-eligible
Task claimable again by returning it to `queued`, issuing the next immutable
delivery generation, and recording one safe append-only recovery Event. The
existing Dispatcher then delivers only that next generation through the
existing fixed BullMQ envelope. PostgreSQL remains authoritative; neither a
Redis Job nor a late Fetcher operation can establish success or revive the
expired claim.

## 3. Authority and context

This packet implements item 3 in §5 and the delivery/reconciliation model in
§4.3 of accepted [M2-DES-005](m2-des-005-fetcher-execution-gateway.md). It
does not reopen a Decision Review.

| Authority                                                                                                                                                                      | Binding consequence                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-128, DEC-133–DEC-135, DEC-176, DEC-226, DEC-228–DEC-229, DEC-238, and DEC-249                                                                                              | PostgreSQL is the only Task truth; recovery is transactional, fenced, and append-only evidence is preserved.                                                            |
| DEC-221 and DEC-230–DEC-232                                                                                                                                                    | The Worker performs bounded system reconciliation; Fetcher has no PostgreSQL credential or direct state write authority.                                                |
| [M2-DES-003](m2-des-003-fetcher-resource-policy.md)                                                                                                                            | Lease expiry is system recovery, never an owner Retry and never authority for another public request.                                                                   |
| [M2-DES-005](m2-des-005-fetcher-execution-gateway.md)                                                                                                                          | Expiry clears the claim, requeues exactly one existing Task, advances the delivery generation, returns its exact Outbox record to `pending`, and appends safe evidence. |
| [Workflow Overview](../../architecture/workflow-overview.md), [Source Fetcher](../../security/source-fetcher.md), and [Secret Management](../../security/secret-management.md) | Queue data, Events, logs, and errors exclude Secrets, opaque claims, URLs, bodies, object keys, and credentials.                                                        |

`M2-WF-003A` made the Worker deliver only the fixed three-field
`fetcher-task/v1` envelope. `M2-WF-003B` made one such delivered Task privately
claimable for a bounded 60/20/120-second lease. It deliberately left lease
expiry recovery unimplemented. This packet closes only that recovery gap.

Later Accepted DEC governs an actual conflict. A requirement to add a Fetcher
consumer, public request, result, Source evidence, Object Storage operation,
owner Retry, terminal Task state, API route, provider, or dependency is a
blocking Decision Review, not an implementation detail.

## 4. In scope

1. Extend the existing Worker reconciliation pass to inspect at most ten
   expired `leased` `url_capture` Tasks per pass before normal missing-Job
   reconciliation and dispatch.
2. Add a parameterized, per-Task PostgreSQL transaction that verifies the
   exact owner/package/instance/node/request/Outbox binding and atomically:

   - changes only an expired `leased` Task to `queued`;
   - retains `claim_attempt_number`, clears the claim hash, claimant, and all
     lease timestamps;
   - changes its one exact `dispatched` Fetcher Outbox record to `pending`;
   - increments that record's `delivery_generation` by exactly one;
   - clears the acknowledgement timestamps while retaining dispatch history;
   - updates both mutable rows at the one recovery timestamp; and
   - appends exactly one immutable `fetcher_lease_expired.v1` Event.

3. Define the Core recovery-event value and exact safe Event payload:

   ```json
   {
     "taskId": "uuid",
     "claimAttemptNumber": 1,
     "previousDeliveryGeneration": 1,
     "nextDeliveryGeneration": 2
   }
   ```

   The Event attaches to the exact existing Instance and `source_capture`
   Node. Its Event ID is generated by the Worker, its sequence is allocated
   transactionally while the exact Instance row is locked, and its
   `occurredAt` is the recovery timestamp. No claim, URL, owner/package ID,
   Source Reference, request ID, Queue payload, Object key, error, or raw
   timestamp from the abandoned Fetcher is included in the payload.

4. Preserve the existing 30-second Dispatcher lease and its current missing
   Job reconciliation. After an expiry transaction commits, the normal
   Dispatcher may publish only `fetcher-<taskId>-<nextGeneration>` with the
   unchanged three-field envelope and `attempts: 1`.
5. Add Core, repository, Worker, migration-compatibility, integration,
   concurrency, crash/rollback, queue-contract, lifecycle, redaction, and
   existing M1/M2 regression tests required by §10.
6. Synchronize only the Current-truth documentation listed in §14 after the
   implementation evidence is complete.

## 5. Fixed recovery contract

### 5.1 Eligibility and atomicity

At `now`, recovery is eligible only when one exact Task is:

- `kind = url_capture`, `state = leased`, and `lease_expires_at <= now`;
- structurally bound to its existing owner, active Content Package, active
  Workflow Instance, ready `source_capture` Node, URL Capture Request, and URL
  Reference; and
- bound to exactly one `fetcher-task/v1` Outbox record whose category, exact
  three-field payload, owner/package binding, state `dispatched`, and current
  delivery generation remain valid.

The transaction locks the Task before changing it. It also locks the exact
Instance while allocating the next Event sequence. Concurrent recovery
workers use row locking with `SKIP LOCKED` or an equivalent guarded update, so
one expired lease has at most one successful recovery transaction and one
recovery Event. A non-expired lease, wrong Outbox state, malformed envelope,
missing binding, stale generation, archived-or-ineligible future state, or
already-recovered Task returns no success effect.

A concurrent valid Heartbeat that obtains the Task lock before expiry recovery
may extend the still-valid lease; recovery then observes no expired eligible
row. If expiry recovery commits first, the same old opaque claim has no row to
match and the existing Heartbeat boundary returns
`FETCHER_CLAIM_UNAVAILABLE`. Neither operation may overwrite the other.

### 5.2 Generation and Queue semantics

The recovery transition changes exactly one existing Outbox record; it never
creates another Task or Outbox record. `delivery_generation` advances by one,
and the previous Job ID is never reused.

An old BullMQ Job may remain present after recovery. It is only a transport
artifact: it cannot mutate PostgreSQL, grant a claim, create a Source, or
authorise public egress. A later Fetcher capability must successfully Claim
the Task before it can act, so old and new Jobs cannot create two active
leases. This item must not delete Jobs, inspect a Job as Task completion, or
infer success from Queue state.

The Dispatcher's existing missing-Job repair remains restricted to the current
generation of a `queued` Task. It must not reset a new generation using an old
record snapshot, and it must not requeue a `leased` Task.

### 5.3 Safe failure and observability

All database writes, including the Event, commit or roll back together.
Database, Queue, and Worker failures leave no partial recovery state. The
Worker logs stable recovery result codes plus opaque Task/Outbox IDs,
generation, and attempt number only. It never logs a Gateway Secret, opaque
claim or hash, submitted URL, request/reference ID, Queue payload, raw SQL,
database URL, stack, or underlying transport error.

The existing bounded Worker loop remains a 500 ms poll and must retain its
current fail-closed startup, Queue/database asynchronous-failure handling, and
SIGTERM cleanup behavior. Recovery does not add a new process, timer, HTTP
surface, credential, or configuration key.

## 6. Out of scope

- Fetcher Queue consumption, Claim/Heartbeat client calls, public URL/DNS/TCP/
  TLS/HTTP behavior, redirects, extraction, Raw Snapshot, Object Storage,
  result submission, Source evidence, Source Version/Approval, or public
  network tests.
- Any API, OpenAPI, browser, Web, Renderer, SSE, polling UI, Agent, M3,
  Render, Export, or publishing behavior.
- Owner Retry, cancellation, terminal Task outcomes, failure classification,
  task-result API, manual recovery command, or re-lease of a terminal Task.
- New dependency, direct `ioredis` dependency, provider, Redis topology,
  Queue name/job name/envelope/options change, service Secret/identity change,
  Docker/CI/deployment change, database, microservice, or Accepted DEC change.
- Existing migration edits, new migration, Drizzle schema/metadata change,
  backfill, historical Event rewrite, `workflow_events` trigger bypass, or
  modification of `contentos-local` volumes.

## 7. Allowed and prohibited files

### Allowed modules

- `apps/worker/src/{dispatcher,main}.ts` and their unit tests;
- `apps/worker/src/fetcher-queue.ts` and tests, only to preserve exact
  current-generation reconciliation behavior;
- `packages/core/src/{index,workflow/url-capture,workflow/fetcher-gateway}.ts`
  and their unit tests;
- `packages/database/src/{index,runtime,workflow-dispatch-repository,
workflow-repository-testing}.ts` and database tests; and
- `packages/testing/src/integration/**` only for lease recovery, dispatch,
  Worker lifecycle, migration compatibility, and existing URL-capture
  regression evidence.

### Allowed files

- exact implementation and test files required by §10;
- `docs/architecture/{process-topology,repository-structure,workflow-overview}.md`;
- `docs/security/source-fetcher.md` only if its current recovery boundary
  needs a factual synchronization;
- `docs/implementation/roadmap.md`, `AGENTS.md`, `README.md`,
  `README.zh-CN.md`, and this Work Packet.

### Prohibited modules and files

- all `apps/api/**`, `apps/fetcher/**`, `apps/web/**`, and `apps/renderer/**`;
- source repositories/services, Object Storage adapters, Contracts/OpenAPI,
  configuration packages, Compose, `.env.example`, CI/GitHub configuration,
  package manifests, `pnpm-lock.yaml`, all accepted DEC and Session files; and
- every existing migration, `migrations/meta/**`, Drizzle schema, and generated
  database metadata.

### Generated-files policy

No generated artifact is authorised. `corepack pnpm db:generate` must report
no schema change; a generated migration, snapshot, or lockfile change is a
scope failure.

## 8. Contracts

| Boundary      | Fixed contract                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain        | Core validates `fetcher_lease_expired.v1` with exactly the four safe payload fields in §4. It preserves Task and Outbox validators; Core imports no Drizzle, BullMQ, NestJS, Fastify, or Fetcher runtime.                 |
| Persistence   | One parameterized transactional recovery per eligible Task. The database remains the sole authority for lease expiry, exact bindings, Outbox generation, and Event sequence.                                              |
| Queue         | Queue name `contentos-fetcher`, Job name `fetcher-task`, Job ID `fetcher-<taskId>-<generation>`, immutable three-field `fetcher-task/v1` data, and `attempts: 1` are unchanged. Generation remains metadata, not payload. |
| Event         | One immutable `fetcher_lease_expired.v1` Event per successful recovery, using the existing append-only trigger and unique Instance sequence. No Event is written on denial or rollback.                                   |
| Configuration | No new configuration or Secret. Existing Worker `CONTENTOS_ENV`, `DATABASE_URL`, and `REDIS_URL` behavior is unchanged.                                                                                                   |
| API           | No route, DTO, OpenAPI operation, browser response, or Error Contract is added or changed. Existing late Claim/Heartbeat denial behavior is preserved.                                                                    |
| Migration     | No migration or schema change. Current `0007` Task lease and `0006` Outbox ledger constraints are exercised as-is; `db:generate` must be a no-op.                                                                         |
| Security      | Recovery is a bounded Worker system action. It uses no Fetcher Secret or opaque claim value, makes no network request, and does not inspect or mutate Source/Object Storage data.                                         |

## 9. Acceptance criteria

1. An exact expired leased Task recovers once: its claim fields are null,
   `state` is `queued`, its attempt number is retained, its exact Outbox is
   `pending` at generation `N + 1`, and old acknowledgement timestamps are
   null.
2. The same transaction appends exactly one immutable
   `fetcher_lease_expired.v1` Event with the exact safe payload, correct Node,
   and the next per-Instance sequence; no Event is appended on a no-op.
3. A non-expired lease, malformed/missing or non-dispatched Outbox, stale
   binding, non-`url_capture` Task, or already-queued Task produces no write,
   Event, Queue action, or claimed-generation change.
4. Concurrent recovery calls yield exactly one successful transition and one
   Event. A concurrent Heartbeat and recovery follow the lock order in §5.1:
   exactly one legal state wins and an old claim cannot revive the Task.
5. Recovery failure at every injected transactional stage rolls back Task,
   Outbox, and Event together. No test bypasses immutable Event triggers.
6. The Worker recovers at most ten expired leases per pass before its existing
   reconciliation/dispatch work, then publishes only the next-generation Job
   under the unchanged Queue contract. An old Job cannot acknowledge, reset,
   or create a second current delivery.
7. Existing missing-current-Job repair and stale Dispatcher lease recovery
   remain correct for a `queued` Task; they never touch a `leased` Task.
8. Worker startup, Queue/database asynchronous failure, SIGTERM, and failure
   logging remain fail-closed and redacted. Recovery logs and Event payloads
   contain none of the prohibited data in §5.3.
9. Empty-database and `0007` migration compatibility tests pass with no
   backfill, no new migration, and no schema/Drizzle metadata difference.
10. All existing URL-capture, Gateway Claim/Heartbeat, M1 browser, and
    integration smoke regressions remain passing. The final diff contains no
    forbidden file, dependency, Secret, local absolute path, generated
    artifact, temporary resource, or unrelated refactor.

## 10. Required tests and verification

- Core unit tests for the exact recovery Event value, safe payload, invalid
  shape, and no claim/URL leakage.
- Repository/PostgreSQL integration tests for every criterion in §9.1–§9.5,
  including two-connection recovery fencing, Event sequence allocation, and
  named existing constraints.
- Worker unit and isolated PostgreSQL/Redis integration tests for bounded
  ordering, next-generation Job ID/data/name/`attempts`, old-job isolation,
  missing-current-Job repair, Queue loss, process startup failure, asynchronous
  Queue/database failure, SIGTERM, and redaction.
- Existing migration compatibility tests from an empty database and an
  isolated `0007` baseline; run `corepack pnpm db:generate` twice and prove no
  diff.
- Run `corepack pnpm install --frozen-lockfile`, `workspace:check`,
  `typecheck`, `test`, `test:integration`, `test:integration:concurrent`,
  `test:browser`, `check`, `check:docs`, `repository:check`, `check:secrets`,
  `db:generate`, and `git diff --check`.
- Prove owned test cleanup: no `contentos-smoke-*` project, temporary
  credential directory, Worker process, Queue Job, container, or network is
  left behind. Do not inspect, remove, or modify `contentos-local` volumes.

## 11. Security and compatibility review

This task handles no new user input, Secret, provider, Object Storage, or
public network integration. Its security-sensitive effect is a Worker-owned
automatic state transition after a bounded lease expiry. Required controls are
row-level fencing, exact structural bindings, transaction-wide rollback,
append-only evidence, unchanged owner/API boundaries, capped batch work,
current-generation Job IDs, and redaction.

No database, API, Queue payload, Artifact Version, Agent Spec, Prompt,
configuration, or migration contract changes. There is no backfill or rollback
procedure: the approved change uses existing mutable Task/Outbox fields and
the existing append-only Event table. If implementation discovers a necessary
schema/migration/API/Fetcher change, it must stop with
`HUMAN_DECISION_REQUIRED`.

## 12. Observability

The Worker may emit `lease.recovered`, `lease.recovery_unavailable`, and the
existing Dispatcher event names with safe IDs, generation, attempt, and stable
error code only. Metrics, traces, a correlation mechanism, dashboards, and an
API timeline are out of scope. The persisted recovery Event is the sole new
workflow audit evidence.

## 13. Documentation updates

On successful implementation, update only the allowed Current-truth documents
to state that bounded lease/delivery recovery exists while preserving the
explicit absence of Fetcher execution, results, Source evidence, Object
Storage writes, and public network behavior. Update the Roadmap and repository
entry documents from Ready/In Progress to the evidence-backed final status.
No DEC, Session, or Decision Register modification is expected.

## 14. Definition of Ready

The Goal, dependencies, one atomic state transition, Queue/Event/security
contracts, exact file boundaries, non-migration policy, fixtures, required
tests, cleanup rules, documentation targets, and independent review boundary
are defined. No blocking design question remains. Implementation evidence is
present; the Work Item is Completed (independent review passed, published
through PR #77).
