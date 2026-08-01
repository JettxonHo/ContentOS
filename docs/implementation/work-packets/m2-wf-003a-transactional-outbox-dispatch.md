# WORK PACKET — M2-WF-003A

**Status:** Completed

**Purpose:** Durable planning-to-implementation handoff for the first
PostgreSQL Transactional Outbox → BullMQ delivery boundary.

**Created:** 2026-08-02

## 1. Identification

- **Task ID:** `M2-WF-003A`
- **Title:** Transactional Outbox Dispatcher
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#65](https://github.com/JettxonHo/ContentOS/issues/65)
- **Branch:** `codex/m2-wf-003a-transactional-outbox-dispatch`
- **Base commit:** `1d207ec92efb1a3b034e65df65f63ae0fe9210e8`
- **Executor Profile:** `BACKEND_GENERAL_EXECUTOR`
- **Owner:** one implementation agent, as the only repository writer
- **Reviewer:** independent review agent before Git publication
- **Dependencies:** `M2-WF-002` merged through PR #60; `M2-DES-005` accepted
  through PR #64
- **Merged:** PR #69, squash-merged as `3211c29ef8e6a934e6473a4f92caf36d8593abc3`
- **Risk classification:** authoritative Outbox delivery ledger, PostgreSQL
  concurrency and migration, Redis/BullMQ transport, Worker lifecycle,
  recovery, temporary credentials, and Queue-payload confidentiality

### Implementation entry condition

Implementation starts only from a clean, current `main` that already contains
this Work Packet. Recreate
`codex/m2-wf-003a-transactional-outbox-dispatch` from that `main`, record its
full base SHA in the Completion Report, and keep one implementation agent as
the only repository writer. This planning branch is not an implementation
baseline.

## 2. Goal

Make the existing PostgreSQL-backed `pending` URL-capture Outbox record
reliably deliver its already-fixed minimum `fetcher-task/v1` payload to one
BullMQ queue. A Worker-owned Dispatcher records current-generation delivery
state durably, tolerates duplicate dispatch attempts and a Worker crash around
Queue acknowledgement, and recovers a missing current Job after Redis loss.

The result is delivery only. A Task remains authoritative and `queued`; no
Fetcher process, service identity, Claim, lease, result, Source evidence,
public URL retrieval, or Source transition exists after this Work Item.

## 3. Authority and context

This Work Packet implements the first item in §5 of accepted
[M2-DES-005](m2-des-005-fetcher-execution-gateway.md). Its Option B fixes the
following non-negotiable boundaries:

- the Worker owns Outbox dispatch and reconciliation inside the modular
  monolith; it is not a new service or independent state authority;
- PostgreSQL is authoritative; BullMQ is an at-least-once delivery transport;
- Fetcher Queue data is exactly the existing three-field `fetcher-task/v1`
  envelope and has no URL, claim, Secret, Object key, signed URL, or mutable
  Domain state; and
- a later claim/result boundary, public Fetcher, Source evidence, and UI
  remain separate Work Items.

`M2-WF-002` currently creates `workflow_tasks` in `queued` state and exactly
one `workflow_outbox_records` row in `pending` state. The record's JSON payload
is already constrained by Core and PostgreSQL to:

```json
{
  "taskId": "uuid",
  "taskKind": "url_capture",
  "envelopeVersion": "fetcher-task/v1"
}
```

It deliberately has no Redis client, BullMQ dependency, Worker configuration,
delivery ledger, Dispatcher, or recovery implementation. This Work Item makes
only that missing transport boundary executable.

The approved stack includes Redis and BullMQ. The only new package is the
official MIT-licensed `bullmq` **5.81.1**, pinned exactly in
`apps/worker/package.json` and `packages/testing/package.json`. The version was
verified against the package registry on 2026-08-02 and is compatible with the
project's Node.js 24.18.0 baseline. Do not add `ioredis`, `@nestjs/bullmq`, a
queue dashboard, another Queue package, or a second BullMQ version directly.

Later Accepted DEC governs an actual conflict. This Work Item does not modify
an Accepted DEC, select a provider, change the API-owned Fetcher Gateway, or
expand M2.

## 4. In scope

1. Add the existing workspace dependencies `@contentos/config`,
   `@contentos/core`, and `@contentos/database` plus the exact direct
   `bullmq@5.81.1` dependency to the Worker runtime. Add the same exact
   `bullmq@5.81.1` dependency to isolated integration tests, generating one
   reviewed lockfile update. No other external package is authorized.
2. Add framework-independent Core validation/types for the extended Outbox
   delivery ledger and the immutable Queue envelope. Core remains independent
   of BullMQ, Redis, Drizzle, NestJS, HTTP, and Fetcher transport.
3. Add an expand-and-contract PostgreSQL migration that extends the existing
   `workflow_outbox_records` state constraint and persists only current
   delivery-generation/attempt/lease/acknowledgement facts.
4. Add a PostgreSQL repository that atomically claims bounded eligible Outbox
   work for one Dispatcher, records Queue acknowledgement, returns a failed
   delivery to `pending`, and repairs stale dispatch ownership.
5. Replace the Worker skeleton with one configuration-validated, graceful
   Dispatcher loop that opens PostgreSQL and BullMQ, uses a typed transport
   adapter, and starts no Fetcher consumer.
6. Use one fixed Queue name, Job name, and job options:

   ```text
   Queue name: contentos-fetcher
   Job name: fetcher-task
   Job ID: fetcher-<taskId>-<deliveryGeneration>
   Job data: the exact existing fetcher-task/v1 envelope
   attempts: 1
   ```

   The Job ID must not use `:`. It is metadata, not Queue data. `attempts: 1`
   is a transport choice that prevents BullMQ from creating an automatic retry;
   it does not implement owner Retry or Fetcher retry semantics.

7. Implement bounded Dispatcher recovery for a stale dispatch lease and a
   missing current Job while its authoritative Task is still `queued`.
8. Add Core, configuration, repository/migration, Worker adapter, isolated
   Redis/PostgreSQL integration, Worker lifecycle, failure-path, redaction,
   and existing M1/M2 regression tests.
9. Synchronize only the Current-truth documentation listed in §14 after the
   implementation evidence is complete.

## 5. Out of scope

- `apps/fetcher/**`, any Fetcher Queue consumer, public URL/DNS/TCP/TLS/HTTP
  code, Object Storage access, request headers, Cookies, proxying,
  extraction, Raw Snapshot, Safe Display, or external-network test.
- Fetcher service Secret, API Gateway route, Claim, heartbeat, lease, result,
  cancellation, terminal Task state, owner Retry, Source evidence, Source
  Working Copy/Version/Approval, or generic Task API. Those are `M2-WF-003B`,
  `M2-WF-003C`, and `M2-SRC-003` work.
- Any `apps/api/**`, `apps/web/**`, or `apps/renderer/**` behavior; OpenAPI;
  browser UI; Timeline query; SSE; polling; Agent; M3; Render; Export; or
  publishing.
- `compose.yaml`, `.env.example`, Docker/CI/GitHub configuration, production
  deployment, a Secret Store, mTLS, a service mesh, a proxy, external identity
  provider, new database, new process, microservice, Queue dashboard, or
  unapproved dependency/provider.
- Rewriting Task state, Node state, Instance state, Source semantics, existing
  URL-capture Command idempotency, Template catalog, existing migrations, or
  Accepted DEC content.

## 6. Fixed contracts

### 6.1 Queue transport contract

The Queue adapter has no Domain mutation capability. Its one command is
conceptually:

```ts
publishFetcherTask({
  jobId: 'fetcher-<taskId>-<deliveryGeneration>',
  name: 'fetcher-task',
  data: {
    taskId,
    taskKind: 'url_capture',
    envelopeVersion: 'fetcher-task/v1',
  },
  attempts: 1,
});
```

It receives a validated Core Outbox delivery candidate. It must not accept a
caller-created data object, URL, owner ID, Source Reference ID, Capture Request
ID, Object key, claim, credential, retry policy, or arbitrary Job option.

BullMQ duplicate handling is deliberately an optimization, not authoritative
state: an existing unremoved Job with the same `jobId` is an acknowledged
delivery of the same current generation. PostgreSQL's matching Outbox state is
still updated only through the repository contract below. A Fetcher consumer
is not registered in this Work Item.

### 6.2 Core delivery values

Extend the existing URL-capture Outbox Core values, without changing the
Task's `queued` state or the immutable payload, with these exact states:

```text
Outbox state: pending | dispatching | dispatched
```

Each rehydrated record additionally has:

| Field                    | Invariant                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deliveryGeneration`     | positive safe integer; initial `1`; changes only in a later Task-requeue Work Item, not this Work Item                                                             |
| `dispatchAttemptCount`   | non-negative safe integer; increments when PostgreSQL grants Dispatcher ownership                                                                                  |
| `dispatchLeaseExpiresAt` | `null` except while `dispatching`; a valid timestamp. Repository grant sets it to `now + 30 seconds`; an expired value is recoverable, not invalid persisted data. |
| `lastDispatchAt`         | `null` until one successful BullMQ acknowledgement; then immutable historical timestamp for the current generation                                                 |
| `dispatchedAt`           | `null` until one successful BullMQ acknowledgement; then the same acknowledgement timestamp                                                                        |
| `updatedAt`              | valid timestamp not before `createdAt`; updated on every ledger transition                                                                                         |

The dispatcher lease is **30 seconds**. It exists only to recover an interrupted
Dispatcher operation, not to grant Fetcher execution ownership. A stale
`dispatching` record is eligible for the same current-generation Job ID; this
does not increment `deliveryGeneration` or create another Task.

The fixed transitions are:

```text
pending ──claim──> dispatching ──BullMQ add acknowledged──> dispatched
  ^                         │
  └──Queue add failure──────┘

expired dispatching ──claim same generation──> dispatching
queued Task + missing current Job ──reconcile──> pending
```

No state in this Work Item means complete, failed, cancelled, claimed, or
leased by Fetcher. `dispatched` means only that BullMQ acknowledged the latest
delivery generation; it never means the Task executed or URL capture occurred.

### 6.3 PostgreSQL persistence and concurrency contract

Add exactly one reviewed forward-only `0006_*.sql` migration and matching
Drizzle metadata. It may replace the `pending`-only Check constraint with the
three-state Check and add these columns to `workflow_outbox_records`:

```text
delivery_generation          integer not null default 1
dispatch_attempt_count       integer not null default 0
dispatch_lease_expires_at    timestamptz null
last_dispatch_at             timestamptz null
dispatched_at                timestamptz null
updated_at                   timestamptz not null
```

The migration must backfill no history and create no Task, Job, Event, Source,
Instance, Node, Request, or Outbox record. Existing `0005` rows retain their
identity, payload, owner/Package binding, Task binding, category, envelope
version, and `pending` meaning; their new values are `deliveryGeneration = 1`,
`dispatchAttemptCount = 0`, and null timestamps except a valid `updatedAt`
equal to their existing `createdAt`.

Database constraints and indexes must enforce at least:

- positive `delivery_generation` and non-negative `dispatch_attempt_count`;
- `pending` and `dispatched` have no dispatch lease; `dispatching` has one;
- `dispatched` has both acknowledgement timestamps; other states have neither;
- `last_dispatch_at` and `dispatched_at` are equal when present and no earlier
  than `created_at`;
- `updated_at >= created_at`; and
- a bounded index supports eligible `pending`, stale `dispatching`, and queued
  Task reconciliation without ownerless scans.

The repository uses parameterized Drizzle queries and PostgreSQL transaction
locking (`FOR UPDATE SKIP LOCKED` or an equivalent single-statement guarded
claim) to ensure concurrent Dispatchers obtain each Outbox record at most once
per active dispatch lease. It verifies the associated Task remains exact,
owner/Package-bound, kind `url_capture`, and state `queued` before any Queue
publication candidate is returned.

After a successful Queue add, acknowledgement updates only the matching
`dispatching` record, matching lease identity, and current generation. Queue
add failure normalizes to the safe code `queue_unavailable`, clears only that
matching dispatch lease, returns the record to `pending`, and persists no URL,
error body, Secret, claim, or Redis diagnostic. A stale Dispatcher cannot
acknowledge or reset a newer owner.

### 6.4 Worker configuration and lifecycle contract

Add a typed Worker configuration loader in `@contentos/config`.

| Input           | Classification | Rule                                                                                      |
| --------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | Secret         | Required PostgreSQL URL; validate scheme without echoing its value.                       |
| `REDIS_URL`     | Secret         | Required `redis:` or `rediss:` URL; validate scheme without echoing its value.            |
| `CONTENTOS_ENV` | Non-secret     | Reuse the existing bounded `development`, `test`, or `production` environment vocabulary. |

There are no optional Queue names, arbitrary retry counts, Dispatcher timings,
or user-controlled Redis options. The fixed timing/constants in §6.2 are
implementation-owned typed constants.

The Worker must:

1. fail closed with a sanitized configuration/dependency error before declaring
   readiness when required configuration, PostgreSQL, or Redis is unavailable;
2. log `process.started` only after both clients are ready and the immediate
   dispatch/reconciliation pass can safely begin;
3. run one bounded immediate pass followed by one 500 ms loop with a maximum
   batch of 10 Outbox candidates per pass;
4. prevent overlapping passes in the same process;
5. on `SIGINT`/`SIGTERM`, stop new passes, await a bounded in-flight pass,
   close BullMQ and PostgreSQL clients, log the existing safe
   `process.stopping` event, and exit zero on clean shutdown; and
6. emit only safe structured operational facts: service, event, opaque Task or
   Outbox ID, generation, attempt count, and a stable error code. It must never
   emit Queue payload beyond its allowed opaque fields, URL, Source data,
   Secret, Redis URL, credential, stack, or raw external error.

### 6.5 Recovery contract

The Worker is responsible for these delivery-only recovery cases:

| Condition                                                                     | Required recovery                                                                                                            | Forbidden effect                                                               |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Two Dispatchers see the same pending row                                      | One database lease holder publishes; the other sees no candidate.                                                            | Two Task rows, two Outbox records, changed payload, or a second generation.    |
| Worker crashes after `Queue.add` but before PostgreSQL acknowledgement        | After the 30-second dispatch lease expires, a new Dispatcher re-adds the same deterministic Job ID and records `dispatched`. | New Task/Outbox/Event/Source, a new generation, or a second distinct Job.      |
| Queue add fails                                                               | Matching ledger row returns to `pending` with safe failure classification. A later pass may retry delivery.                  | Terminal Task failure, automatic owner Retry, URL request, or leaked error.    |
| Redis loses the current Job while Task is `queued` and Outbox is `dispatched` | Reconciler resets only that current record to `pending`; the next pass republishes the same current-generation Job.          | State inference from Redis, Task success, a Fetcher claim, or changed payload. |
| Task no longer `queued`                                                       | Dispatcher does not publish or repair it.                                                                                    | Reopen/alter Task state or create a result.                                    |

M2-WF-003C, not this packet, will introduce a Fetcher execution lease,
Task requeue, a new delivery generation, and its append-only recovery Event.

## 7. Allowed files and modules

### Allowed modules

- `apps/worker/**`
- `packages/config/src/{index,worker-config,worker-config.test}.ts`
- `packages/core/src/{index,workflow/url-capture,workflow/url-capture.test}.ts`
- `packages/database/src/{index,runtime,schema,workflow-command-repository,workflow-dispatch-repository,workflow-repository-testing}.ts`
- `packages/testing/src/integration/**`
- `docs/architecture/{repository-structure,workflow-overview}.md`

### Allowed files

- `apps/worker/package.json`
- `packages/testing/package.json`
- root `pnpm-lock.yaml`
- one reviewed generated Drizzle migration `migrations/0006_*.sql`, its
  `migrations/meta/0006_snapshot.json`, and `_journal.json`
- Worker/Core/configuration/database/integration tests needed by §11
- `docs/implementation/roadmap.md`
- `AGENTS.md`
- `README.md`
- this Work Packet

### Prohibited modules and files

- `apps/api/**`, `apps/web/**`, `apps/fetcher/**`, `apps/renderer/**`
- `packages/contracts/**`, `packages/object-storage/**`, and existing
  `packages/core/src/source/**` behavior
- `compose.yaml`, `.env.example`, `.gitignore`, `.node-version`, root
  `package.json`, Docker/CI/GitHub configuration, Decision Register, Sessions,
  acceptance records, and unrelated Work Packets
- any API route, OpenAPI contract, Fetcher client/consumer, Secret config for
  service identity, Claim/lease/result type, Object Storage operation, URL
  fetch/parser, Browser/UI/SSE/Agent code, Redis `MONITOR`, Queue dashboard,
  or raw `ioredis` direct dependency

### Generated files policy

`0006` and its Drizzle metadata are generated from the reviewed Drizzle schema
with `corepack pnpm db:generate`, then committed only after SQL review. A second
generation must report no diff. `pnpm-lock.yaml` is committed only as the exact
result of adding `bullmq@5.81.1` to the two allowed manifests. No other
generated or build artifact is permitted.

## 8. Security, compatibility, and observability review

### Security

This item handles no new browser/user input and makes no public request. It
introduces process-scoped PostgreSQL/Redis Secret consumption in Worker only;
the values are validated but never logged, persisted, passed to Core, written
to Queue data, or emitted in diagnostics. The Worker receives no Fetcher
Gateway Secret, Owner Session, Object Storage credential, Model credential, or
general API capability.

The Queue payload remains fail-closed and exact. Database/Queue errors are
classified without serializing Redis error messages. Queue Job IDs, Outbox IDs,
and Task IDs are opaque operational metadata; full URLs, Capture Request IDs,
Source Reference IDs, claims, object keys, headers, bodies, signed URLs, and
Secrets are prohibited from Events, logs, traces, test diagnostics, and
documentation examples.

### Compatibility and migration

`0006` is forward-only and compatibility-preserving: it extends a constrained
Outbox state, adds delivery-ledger fields with safe defaults, and creates
supporting indexes. It does not backfill product records, alter Task/Node/
Instance/Source state, change the existing owner API contract, or migrate the
Queue payload. Existing `0005` URL-capture command idempotent replays must
rehydrate the extended Outbox record and return the original safe command
response unchanged.

No rollback migration is authorized. Runtime recovery is not database rollback:
it uses the durable ledger and deterministic Job ID to repeat delivery of the
same nonterminal Task safely.

### Observability

The Dispatcher emits bounded safe lifecycle/delivery records only. It adds no
browser Timeline, API projection, OpenTelemetry schema, metric backend, or
Workflow Event. PostgreSQL ledger fields are the authoritative delivery audit;
BullMQ status is transport evidence only. Any trace/log/error check must prove
the exclusions in the Security section.

## 9. Acceptance criteria

1. An existing valid `queued` URL-capture Task with one `pending` Outbox record
   is delivered to `contentos-fetcher` as exactly one `fetcher-task` BullMQ Job
   containing only the existing exact `fetcher-task/v1` data contract.
2. Successful Queue acknowledgement changes only the matching Outbox record to
   `dispatched`, preserves its Task/owner/Package/payload identity, records
   generation 1 and the required safe timestamps, and never changes Task,
   Node, Instance, Source, or Event state.
3. Two concurrent Dispatcher repository instances obtain only one active
   ownership lease for the same Outbox record. Duplicate Queue publication of
   the deterministic same Job ID produces no second Queue Job or Task effect.
4. A failed Queue add returns only the matching lease holder's Outbox record to
   `pending` with the stable safe error category. No raw Redis error, Secret,
   URL, Queue data extension, or terminal Task result is persisted or logged.
5. A crash-equivalent stale `dispatching` lease is recovered after 30 seconds
   by the same generation/Job ID and can reach `dispatched`; a stale owner
   cannot overwrite a newer attempt.
6. When Redis no longer contains a Job for a `queued` Task whose Outbox is
   `dispatched`, recovery changes only that Outbox record back to `pending` and
   republishes its same current-generation Job. A non-queued Task is never
   republished by this Work Item.
7. `0005 → 0006` upgrade and empty database migration tests prove the new
   checks/defaults/indexes, preserve all existing M1/M2 Source/Workflow rows,
   create no backfill, and reject invalid state/timestamp/attempt/generation
   combinations by named database constraint.
8. Worker startup with valid isolated PostgreSQL/Redis configuration performs
   bounded dispatch, emits safe readiness/lifecycle records, and exits cleanly
   on SIGTERM. Missing/malformed configuration or unreachable dependency fails
   non-zero without echoing Secret values.
9. Existing owner URL-capture API and its idempotent replay remain unchanged;
   no API route/OpenAPI response/Queue payload/ordinary log claims the Task was
   fetched, claimed, completed, captured as a Source, reviewed, or approved.
10. No Fetcher, Claim, heartbeat, Task lease/result, Source mutation, Object
    Storage, public network, UI/SSE, Agent, Compose, or unapproved dependency
    is introduced.
11. Required quality, dependency/lockfile, Secret, local-path, generated
    artifact, exact file-scope, whitespace, documentation-link, and repository
    checks pass with no owned runtime residue.

## 10. Required tests and verification

- Core unit tests for extended Outbox fail-closed rehydration, all three
  states, timestamp/lease invariants, and the exact immutable payload. Worker
  adapter tests own valid BullMQ Job-ID construction.
- Worker unit tests with a fake queue adapter for exact name/data/options,
  duplicate acknowledgement, queue failure normalization, non-overlapping
  passes, stale-dispatch recovery, and graceful shutdown.
- Worker configuration tests for valid URLs, missing/malformed PostgreSQL or
  Redis URLs, no Secret reflection, and exact environment vocabulary.
- PostgreSQL repository tests with two connections for active ownership,
  stale ownership recovery, acknowledgement fencing, queue failure reset,
  non-queued Task rejection, and named check/foreign-key violations.
- Isolated migration tests for empty `0006` install and `0005 → 0006` upgrade;
  verify no Source/Workflow backfill and second `db:generate` no-diff output.
- Docker integration tests using only the isolated smoke PostgreSQL/Redis:
  submit an existing owner URL-capture Command, start the Worker with temporary
  process-only environment, assert exact Queue data via the approved BullMQ
  client, assert persisted delivery state, then terminate/reclaim the exact
  Worker process. Test duplicate and Redis-loss recovery with zero owned
  residue.
- Existing Source, URL-capture, process lifecycle, integration harness, and
  browser regressions. Update the lifecycle fixture only to supply the Worker
  its temporary isolated PostgreSQL/Redis configuration; do not weaken its
  startup/shutdown assertions.
- Dependency review after installation: exact versions, license, one-version
  resolution, `pnpm audit`, and no direct `ioredis`/wrapper/dashboard package.

Run at least:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
corepack pnpm db:generate
corepack pnpm audit
git diff --check
```

The Completion Report must include the exact changed-file list, migration SQL
review, two `db:generate` results, dependency/audit result, failure-path exit
codes, safe redaction evidence, no Queue Job/Worker/temp credential residue,
and confirmation that `contentos-local` volumes were untouched.

## 11. Documentation updates

After implementation evidence is complete:

- update `docs/architecture/workflow-overview.md` with the limited durable
  Outbox-to-BullMQ delivery state and an explicit no-Fetcher/no-claim/no-result
  disclaimer;
- update `docs/architecture/repository-structure.md` with the bounded Worker,
  Core, configuration, database, and integration-test ownership;
- update `AGENTS.md` and `README.md` with the truthful Worker dispatcher
  capability, required process configuration, and the fact that Fetcher
  execution remains unavailable;
- update the M2 roadmap row to `Completed` only after implementation evidence
  is complete; and
- leave Accepted DEC and the Decision Register unchanged.

## 12. Completion boundary

The Work Item is complete only after every criterion has direct evidence and
independent review confirms the migration fencing, PostgreSQL authority,
Queue-envelope minimization, worker lifecycle, duplicate/crash/Redis-loss
recovery, Secret redaction, no-residue cleanup, and exact file boundary.

The Implementation Agent must not create a Commit, Push, Pull Request, merge,
or branch switch. After an independent `PASS`, the Review Agent may perform
those GitHub actions under the user's standing authorization. M2 remains In
Progress, `M2-WF-003B` and `M2-WF-003C` remain unstarted, and M3 remains not
started.
