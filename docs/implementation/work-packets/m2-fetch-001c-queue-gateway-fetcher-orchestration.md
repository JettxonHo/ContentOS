# M2-FETCH-001C — Queue-to-Gateway Fetcher Orchestration

**Status:** In Review

**Issue:** [#98](https://github.com/JettxonHo/ContentOS/issues/98)

**Branch:** `codex/m2-fetch-001c-queue-gateway-orchestration`

**Base commit:** `121b66e111687519a621fcfe6d5b3119af7a1f67`

## Identification

- Work Item: `M2-FETCH-001C`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested
- Thread: `/root/fetch001c_implement`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Risk Classification: Queue consumption, private service authentication,
  controlled public egress, scoped Object Storage write, and authoritative
  Result submission

## Goal

Register the existing Fetcher transport and Candidate/Snapshot preparation
modules behind one bounded BullMQ consumer. For each current delivery, the
Fetcher validates the fixed Queue Job, obtains an API-owned Task claim,
performs at most one controlled capture, maintains the bounded lease, and
submits the existing exact `fetcher-result/v1` Result. PostgreSQL remains the
only Task and Workflow authority, and the Fetcher receives no database access.

## Canonical sources

- [M2-DES-001 — Public URL connection binding](m2-des-001-public-url-fetcher-connection-binding.md)
- [M2-DES-003 — Fetcher resource policy](m2-des-003-fetcher-resource-policy.md)
- [M2-DES-005 — Fetcher execution gateway](m2-des-005-fetcher-execution-gateway.md)
- [M2-DES-006 — Deterministic Candidate extraction](m2-des-006-fetcher-candidate-extraction.md)
- [M2-WF-003A — Transactional Outbox Dispatcher](m2-wf-003a-transactional-outbox-dispatch.md)
- [M2-WF-003B — Fetcher Gateway Claim and Bounded Lease](m2-wf-003b-fetcher-gateway-claim-lease.md)
- [M2-WF-003C — Lease and Delivery Reconciliation](m2-wf-003c-lease-delivery-reconciliation.md)
- [M2-SRC-003 — Result and Source evidence](m2-src-003-url-capture-result-source-evidence.md)
- [M2-FETCH-001A — Public Transport and Resource Policy](m2-fetch-001a-public-transport-and-resource-policy.md)
- [M2-FETCH-001B — Candidate Extraction and Scoped Snapshot Writer](m2-fetch-001b-candidate-extraction-scoped-snapshot-writer.md)
- [Source Fetcher Security Boundary](../../security/source-fetcher.md)
- [Process Topology](../../architecture/process-topology.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Secret Management](../../security/secret-management.md)
- [Issue #98](https://github.com/JettxonHo/ContentOS/issues/98)

Relevant Accepted Decisions: DEC-059–DEC-066, DEC-163, DEC-199,
DEC-207–DEC-209, DEC-221, DEC-226, DEC-228–DEC-232, DEC-238, DEC-245,
DEC-249, DEC-259, DEC-268, DEC-280, DEC-284–DEC-285, and DEC-287–DEC-293.
Later Accepted DEC governs an actual conflict.

## Current truth and dependencies

- `M2-WF-003A` publishes the exact three-field `fetcher-task/v1` envelope to
  BullMQ queue `contentos-fetcher`, Job name `fetcher-task`, deterministic Job
  ID `fetcher-<taskId>-<deliveryGeneration>`, and `attempts: 1`.
- `M2-WF-003B` exposes private API-owned Claim and Heartbeat routes with one
  Fetcher-only service Secret and one opaque Task claim. The initial lease is
  60 seconds, heartbeat cadence is 20 seconds, and the lease cannot extend
  beyond 120 seconds from its start.
- `M2-WF-003C` recovers an expired lease into the next durable delivery
  generation. PostgreSQL, not BullMQ state, decides recovery eligibility.
- `M2-SRC-003` exposes the private exact Result route and owns all terminal
  Task and Source-evidence mutation.
- `M2-FETCH-001A` supplies the one-shot 30-second public transport and
  `M2-FETCH-001B` supplies the bounded Candidate/Snapshot Result preparer.
- Those Fetcher modules are private and unregistered on the base commit.
- `bullmq@5.81.1` is already approved and locked in the repository, but is not
  yet a direct Fetcher dependency.

## In scope

1. Move the provider-neutral fixed Fetcher Queue constants, three-field data
   contract, deterministic Job ID builder/parser, and exact data validator to
   `@contentos/contracts` without creating a Core → Contracts dependency.
2. Keep the Worker producer on the same Queue/name/envelope/Job-ID/attempt
   contract and add explicit completed/failed Job removal so PostgreSQL-led
   missing-delivery and lease recovery can recreate eligible work.
3. Bind Claim to the Job's existing delivery generation through one exact
   private request header and an API-owned PostgreSQL comparison. The Queue
   payload remains unchanged.
4. Add exact response parsers for the existing private Claim, Heartbeat, and
   Result DTOs, returning stable validation failure rather than raw parser or
   provider details.
5. Add a Fetcher-private Gateway HTTP client using the existing Fetcher-only
   Secret and literal-loopback API origin.
6. Add a BullMQ consumer with concurrency one. It validates the complete Job
   contract before Claim and permits at most one active capture per Fetcher
   process.
7. Compose Claim → Heartbeat → 001A transport → 001B preparation → Result,
   always disposing an accepted `VerifiedFetchResponse`.
8. Register the existing Fetcher-only Object Storage identity and the new
   independent `CONTENTOS_FETCHER_REDIS_URL`. Never load `DATABASE_URL` or the
   Worker's `REDIS_URL`.
9. Add bounded startup, dependency failure, Queue error, graceful signal, and
   in-flight shutdown behavior with safe structured process events.
10. Add focused unit and integration evidence for success, Fetcher-supplied
    failure, stale/duplicate delivery, Redis loss, lease recovery, ambiguous
    Result delivery, cleanup ownership, and process lifecycle.

## Out of scope

- A new Queue, Task kind, Queue payload field, Result version, Candidate
  version, Source model, Workflow state, Event type, retry command, owner Retry,
  Pause/Cancel, Timeline, SSE, UI, Research, Agent, Renderer, or M3 behavior;
- any PostgreSQL credential or repository access in the Fetcher;
- any database Schema, migration, backfill, or persisted field;
- changes to the accepted DNS/address policy, numeric connection binding, TLS
  identity, redirect policy, 30-second Capture Budget, UTF-8 policy,
  `parse5@8.0.1` extraction, object-key family, or integrity contract;
- an automatic browser, proxy, crawler, alternate User-Agent, authenticated
  public capture, charset detector, Readability, DOM runtime, or subresource
  fetch;
- generic retry infrastructure, a new hash/digest/fingerprint, broad cleanup,
  object listing, garbage collection, or bucket administration;
- public Gateway/OpenAPI exposure, a general Task API, a second state
  authority, or a change to API-owned Source promotion; and
- unrelated dependency-advisory remediation tracked by Issue #95.

## Fixed contracts

### Queue contract ownership

`@contentos/contracts` owns provider-neutral values equivalent to:

```ts
const FETCHER_QUEUE_NAME = 'contentos-fetcher';
const FETCHER_JOB_NAME = 'fetcher-task';
const FETCHER_JOB_ATTEMPTS = 1;
const FETCHER_JOB_REMOVE_ON_COMPLETE = true;
const FETCHER_JOB_REMOVE_ON_FAIL = true;

interface FetcherTaskQueueData {
  taskId: string;
  taskKind: 'url_capture';
  envelopeVersion: 'fetcher-task/v1';
}
```

The provider-neutral contract also builds and parses exactly
`fetcher-<taskId>-<deliveryGeneration>`. The data object owns exactly the three
fields above. `deliveryGeneration` remains in the deterministic Job ID and the
PostgreSQL Outbox ledger; it is not added to the Queue payload.

The BullMQ-specific Worker publisher emits name, ID, data, `attempts`,
`removeOnComplete`, and `removeOnFail` against these constants. The Fetcher
consumer validates the same current contract and one explicit legacy profile:
both removal options absent. Core retains its existing authoritative Outbox
value and imports no Queue or Contracts package.

Completed and failed Jobs are removed by the accepted Job options. This is a
delivery-liveness rule, not Task truth:

- the Fetcher BullMQ Worker sets worker-level
  `removeOnComplete: { count: 0 }` and `removeOnFail: { count: 0 }`; these are
  the exact `bullmq@5.81.1` `KeepJobs` fallback for Jobs published before 001C,
  whose two per-Job removal options are both absent;
- a legacy Job with both options absent is otherwise held to the same exact
  name, ID, attempts, and three-field data contract, is never normalized by
  mutation, and is removed when it settles through the Worker defaults;
- after a terminal Result, PostgreSQL makes the Task ineligible, so a missing
  completed Job is not repaired;
- before Claim, a transient consumer/Gateway failure removes the failed Job,
  allowing the existing Worker to repair the still-queued current generation;
- after Claim, a failed Job does not reopen the leased Task; existing lease
  recovery alone may create the next generation.

### Delivery-generation Claim fence

Add the private header:

```text
x-contentos-fetcher-delivery-generation: <positive decimal integer>
```

Claim still has no body. The Fetcher derives the value only by parsing the
validated Job ID. The controller accepts exactly one canonical positive
PostgreSQL-integer value. Core passes it to the existing Claim repository, and
the repository requires the joined current Outbox row's
`delivery_generation` to match in the same locked transaction.

This closes the concrete stale-redelivery gap: an old generation Job cannot
obtain a new claim after lease recovery advances PostgreSQL to generation
`N+1`. It changes no Queue payload, Task state, lease timing, migration, or
ownership rule. Missing, malformed, or stale generation uses the existing safe
Gateway rejection path and has no state side effect.

### Gateway client contract

The client uses only the exact configured API origin and these private routes:

```text
POST /internal/fetcher/tasks/:taskId/claim
POST /internal/fetcher/tasks/:taskId/heartbeat
POST /internal/fetcher/tasks/:taskId/result
```

- Every call sends exactly one `x-contentos-fetcher-gateway-secret`.
- Claim sends the delivery-generation header and no body or Content-Type.
- Heartbeat sends exactly one opaque claim header and no body or Content-Type.
- Result sends exactly one opaque claim header and exact
  `Content-Type: application/json`; its body is the existing validated
  `fetcher-result/v1` value.
- Each local Gateway request has one fixed 5-second timeout. Every success or
  error response body is capped at 16 KiB before JSON parsing.
- A success response must pass the exact Contracts parser and match the
  requested Task and Claim attempt. A submitted failure must return the same
  Fetcher-supplied category. A submitted success may validly return either
  `success`/`succeeded` with a Source ID or one existing server-derived failure
  (`package_archived`, `source_role_limit`, or `object_integrity_failed`) with
  `failed` and no Source ID. The latter means the API already performed any
  required object compensation and must not trigger a second Fetcher delete.
- The client never logs or returns the Secret, opaque claim, submitted/final
  URL, Candidate body, object key, Headers, response body, or raw exception.

Status interpretation is fixed:

HTTP status classification precedes body-limit enforcement and parsing, so a
status `0` or any `5xx` remains transient regardless of response-body shape or
size.

| Response                                                | Fetcher meaning                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Claim `200`                                             | Begin this one claimed attempt.                                                                                      |
| Claim `409 FETCHER_TASK_UNAVAILABLE`                    | Authoritative no-op for stale, duplicate, terminal, or otherwise ineligible delivery; do not fetch.                  |
| Heartbeat `409 FETCHER_CLAIM_UNAVAILABLE`               | Claim is definitively unavailable; stop further promotion for this attempt.                                          |
| Result `409 FETCHER_RESULT_UNAVAILABLE`                 | Definitive rejection; compensate only the Snapshot owned by this Task/Attempt.                                       |
| Result `401` or unexpected `4xx`                        | Definitively not accepted and a stable protocol/identity failure; scoped compensation is allowed.                    |
| Result `200` with malformed, mismatched, or >16 KiB DTO | Unknown commit: the API may already have committed. Preserve the Snapshot, stop intake, and exit non-zero safely.    |
| Result network timeout, connection failure, or `5xx`    | Transient unknown commit; retry once with the exact body, then preserve the Snapshot if the outcome remains unknown. |

Malformed Claim or Heartbeat success responses remain stable protocol
failures. Error response content is never copied into logs or Queue failure
values.

### Capture orchestration

For one accepted Job:

```text
validate Job
→ Claim(taskId, deliveryGeneration)
→ start bounded Heartbeat cadence
→ fetch submittedUrl with M2-FETCH-001A
→ prepare Candidate/Snapshot/Result with M2-FETCH-001B
→ stop Heartbeat
→ submit exact Result
→ complete Job
```

Rules:

1. Concurrency is exactly one. Queue redelivery is only a trigger; successful
   API Claim is the sole execution authority.
2. A Claim rejection completes the delivery without fetching and without
   mutating Task state.
3. The first Heartbeat is sent no earlier than 20 seconds after Claim. Calls
   never overlap. The existing 60/20/120-second lease rules remain unchanged.
4. A transient Heartbeat transport failure does not itself prove lease loss;
   the Result route remains authoritative. A definitive `409` prevents Result
   submission for the attempt.
5. `PublicUrlTransportError` maps only to the existing corresponding
   Fetcher-supplied failure Result. No raw error becomes a Result code.
6. Once `fetch()` returns a `VerifiedFetchResponse`, the orchestrator calls
   `dispose()` in `finally`, whether preparation, Heartbeat, Result, or shutdown
   succeeds or fails.
7. Heartbeats stop before the first Result request. Result submission may be
   retried exactly once with the same claim and exact body only after an
   ambiguous network/`5xx` outcome; the existing API idempotency contract
   decides whether it committed. No other automatic retry is added.
8. Only an exact typed Result `409`, `401`, or unexpected `4xx` is definitively
   not accepted and may compensate a success Snapshot created by the same
   Task/Attempt, through the existing structured deletion port and a fresh
   independent 5-second cleanup signal. A valid HTTP `200` success or
   server-derived failure is accepted and never compensated again. A Result
   `200` whose body is malformed, mismatched, unparseable, or over 16 KiB is an
   unknown commit: preserve the Snapshot and fail safely because the API may
   already have committed. Network/timeout/`5xx` remains transient unknown,
   uses the one exact-body retry, and preserves the Snapshot if still unknown.
   No broad cleanup or listing is allowed.
9. A failure before a Snapshot exists has no Object Storage cleanup. A
   Fetcher-supplied failure Result is still submitted when the claim remains
   usable.
10. The Fetcher never sets Task state, infers Source success from BullMQ, or
    treats Queue completion as authoritative completion.

### Configuration and process lifecycle

The runtime loads exactly:

- `CONTENTOS_ENV`;
- `CONTENTOS_FETCHER_GATEWAY_SECRET`;
- `CONTENTOS_FETCHER_GATEWAY_API_ORIGIN`;
- `CONTENTOS_FETCHER_REDIS_URL` (`redis:` or `rediss:` only); and
- the existing six `CONTENTOS_FETCHER_OBJECT_STORAGE_*` values.

It does not read `DATABASE_URL`, `REDIS_URL`, or API Object Storage credential
names. Configuration failures name only the approved key, never its value.

Startup declares `process.started` only after configuration, Queue, and owned
provider initialization are usable. Queue error events are handled without an
unhandled EventEmitter error or raw provider logging. The concrete
`FetcherS3SnapshotStore` exposes one narrow `close()` lifecycle method that
destroys only its owned `S3Client`; the Candidate preparation port remains
unchanged.

On `SIGINT` or `SIGTERM`, the process:

1. stops accepting new Jobs;
2. logs one safe `process.stopping` event;
3. permits the single active attempt to finish within a fixed 40-second
   shutdown bound (the capture itself remains limited to 30 seconds);
4. closes BullMQ and owned provider resources; and
5. exits zero only when owned shutdown succeeds.

If the bound expires, intake remains stopped, BullMQ closure is forced, the
Job is left for the accepted stalled/lease recovery paths, and the process
exits non-zero with a stable safe code. No signal handler prints credentials,
URLs, Queue data, raw exceptions, or stacks.

## Error and observability contract

Ordinary structured logs may contain only:

- service `fetcher`;
- existing process lifecycle event;
- stable operational event/code;
- opaque Task ID, delivery generation, and attempt number where needed; and
- terminal Result category without Candidate or capture evidence.

Logs, traces, Queue failure reasons, and test reports must not contain the
Gateway Secret, opaque claim, Redis/Object Storage credential, database URL,
submitted/final URL, redirect evidence, Candidate text, Raw Snapshot bytes,
object key, request/response headers, SQL, raw exception, or stack.

No new metric, Trace backend, Audit Event, or generic diagnostic framework is
introduced. Tests inspect stable categories and state/resource effects.

## Allowed files and modules

### Allowed application and package modules

- `apps/fetcher/src/main.ts` and new Fetcher-owned Queue/Gateway/orchestration
  modules and their tests;
- `apps/fetcher/package.json`;
- `apps/worker/src/fetcher-queue.ts` and its focused test;
- `apps/worker/package.json` for the direct workspace Contracts edge;
- `apps/api/src/fetcher-gateway/fetcher-gateway.controller.ts` for the exact
  private generation header and focused API/integration tests;
- `packages/contracts/src/index.ts`, the existing Fetcher Gateway contract,
  one new provider-neutral Fetcher Queue contract module, and focused tests;
- `packages/config/src/index.ts`, Fetcher config/snapshot config, and focused
  tests;
- `packages/core/src/workflow/fetcher-gateway.ts` and its focused test;
- `packages/database/src/workflow-fetcher-gateway-repository.ts` and existing
  Fetcher Gateway repository test support/tests;
- `packages/object-storage/src/fetcher-snapshot-store.ts`, its focused test,
  and `packages/object-storage/src/index.ts` only if the owned `S3Client`
  lifecycle seam needs export synchronization;
- `packages/testing/src/integration/**` and `packages/testing/package.json`
  only if required by the accepted integration fixture;
- root `pnpm-lock.yaml`; and
- the documentation files listed below.

### Allowed documentation

- this Work Packet;
- `AGENTS.md`;
- `README.md` and `README.zh-CN.md`;
- `docs/architecture/process-topology.md`;
- `docs/architecture/repository-structure.md`;
- `docs/architecture/workflow-overview.md`;
- `docs/security/source-fetcher.md`;
- `docs/security/secret-management.md`;
- `docs/implementation/roadmap.md`; and
- focused quality documentation only if a real command or harness boundary
  changes.

### Prohibited files and modules

- migrations, Drizzle metadata, `packages/database/src/schema.ts`, Compose,
  `.env.example`, `.github/**`, Web, Renderer, Worker dispatcher/repository,
  Source repository/API behavior, Decision/Session files, and unrelated tests;
- changes to `apps/fetcher/src/public-url-transport/**` or
  `apps/fetcher/src/candidate-capture/**` except a narrowly reviewed export or
  testability seam required to compose their already accepted behavior; and
- new packages, processes, providers, service credentials, Queue categories,
  or dependencies other than direct Fetcher use of the already locked
  `bullmq@5.81.1` and the required workspace `@contentos/contracts` edge.

### Generated files policy

No database-generated file is expected. `pnpm-lock.yaml` may change only for
the direct Fetcher BullMQ/Contracts edges and the Worker workspace Contracts
edge. `db:generate` must report no Schema change twice. Build outputs,
coverage, caches, logs, temporary credentials, Queue state, buckets, and test
artifacts are never committed.

## Acceptance Criteria

1. The Queue contract exists in `@contentos/contracts`; Worker and Fetcher use
   the same Queue/name/data/ID/attempt/removal constants, the Fetcher accepts
   only the exact current profile plus the pre-001C both-options-absent legacy
   profile, and the Core remains provider independent.
2. A valid current-generation Job obtains exactly one Claim, performs one
   bounded capture, writes/verifies one scoped Snapshot, and submits one exact
   terminal Result through the private API.
3. Missing, malformed, extra-field, wrong-name, wrong-ID, wrong-attempt, or
   wrong-removal Job contracts fail before Claim. Representative contract
   boundaries are tested without enumerating impossible internal cases.
4. A stale generation, duplicate delivery, terminal Task, or otherwise
   ineligible Claim performs no public request, Snapshot write, Result
   submission, or authoritative mutation.
5. The generation fence is checked in the same locked Claim transaction;
   concurrent current/stale generation Claims produce at most one lease.
6. Heartbeat starts no earlier than the accepted cadence, never overlaps,
   cannot extend the accepted lease cap, and a definitive lost claim cannot
   promote a Result.
7. Transport/extraction/resource failures map to the existing exact failure
   Result. Successful preparation submits the exact success Result and Source
   evidence remains API-owned.
8. Every accepted response is disposed. A typed Result `409`, `401`, or
   unexpected `4xx` cleans only its own Task/Attempt Snapshot under a fresh
   5-second bound. A valid server-derived `200` is not double-compensated, and
   malformed, mismatched, unparseable, or oversized Result `200` is treated as
   unknown commit and preserves the object. Network/timeout/`5xx` ambiguity
   also preserves the object and relies on API idempotency/lease recovery.
9. Completed/failed Job removal cooperates with existing PostgreSQL-led
   missing-Job and lease recovery: a pre-existing Job without removal options
   settles under the Fetcher Worker defaults and is repairable; queued
   pre-Claim failure is repairable; leased failure waits for expiry; terminal
   Task is never reopened; and the next generation uses its deterministic new
   Job ID.
10. Fetcher startup requires only its own Gateway, Redis, and Object Storage
    settings; no `DATABASE_URL`, Worker `REDIS_URL`, or API credential fallback
    is read or required.
11. SIGTERM/SIGINT stops intake, handles the one active attempt within the
    bound or leaves it for accepted recovery, closes owned resources, and
    produces no residual Fetcher process, Queue fixture, object, container, or
    temporary credential.
12. Existing API, Source, Worker, migration, integration, browser, repository,
    and Secret checks remain green. No Schema, DEC, product-scope, public API,
    or M3 behavior changes.

## Required tests

### Static and unit

- Contracts: exact Queue constants/data/Job-ID parsing and exact Gateway
  response parsers.
- Worker: publisher uses the shared contract and exact removal options.
- Fetcher Queue adapter: current and exact legacy retention profiles,
  worker-level removal defaults, pre-Claim failure removal, and same-generation
  Dispatcher repair.
- Config: valid independent settings and safe rejection of missing/malformed
  Fetcher Redis/Object Storage settings; no fallback names.
- Gateway client: exact request method/path/headers/body, response validation,
  definitive rejection versus unknown-commit classification, fixed timeout,
  and redaction.
- Orchestrator: sequence, one-active scheduling, Heartbeat cadence, response
  disposal, success/failure Result, stale/duplicate no-op, definitive cleanup,
  malformed-success unknown-commit preservation, transient-unknown
  preservation, and one same-payload Result retry.
- Lifecycle: startup readiness, Queue/provider failure, signal shutdown, forced
  bounded shutdown, and safe logs.

### Repository and integration

- Claim repository generation match, stale generation no-op, and concurrent
  fencing with real PostgreSQL.
- Real BullMQ consumer against isolated Redis plus real private API and
  isolated S3-compatible storage, using the existing dependency-injected local
  HTTP/HTTPS/DNS transport fixtures. Production SSRF policy remains separately
  covered by 001A; tests do not weaken it or add a runtime bypass.
- End-to-end success and one Fetcher-supplied failure, exact Source evidence,
  duplicate/stale delivery, and two same-Task cross-component handoffs: a
  pre-Claim Gateway failure whose removed current Job is repaired by the
  Worker with the same generation/ID, and a post-Claim Result-delivery failure
  whose expired lease is recovered and dispatched as generation `N+1` while
  the old generation remains ineligible. Also cover Result idempotency, object
  cleanup ownership, and no PostgreSQL access by Fetcher.
- Upgrade compatibility fixture: a Job published with the pre-001C exact
  name/ID/data/attempt contract and both removal options absent is not rejected
  for that absence; it is processed or Claim-no-oped according to authoritative
  Task eligibility, settles under Worker removal defaults, and a still-queued
  Task is repairable with the same generation.
- Result response fixtures cover success, each existing server-derived failure
  class at the contract level, no double compensation after a valid `200`,
  preservation after malformed/mismatched/unparseable/oversized `200`,
  definitive `409`/`401`/unexpected-`4xx` cleanup with a fresh bound, and
  transient-unknown preservation.
- Process integration for real Fetcher startup/SIGTERM and safe malformed
  configuration/provider failure.

Run concurrent integration only for the delivery/lease race scenarios that
use it. Browser behavior does not change, but the existing browser suite still
runs as a required regression gate.

## Security review

- This Work Item activates controlled public egress and private user Source
  content handling already accepted by 001A/001B. It adds no destination or
  content policy.
- Service Secret and opaque claim remain private headers only. Redis and
  Object Storage credentials are Fetcher-scoped configuration and never enter
  Queue data, Results, logs, tests, or Git.
- The Fetcher receives Queue delivery, scoped Object Storage access, public
  egress, and the API Gateway only. It receives no PostgreSQL, user Session,
  general Source, Model Provider, Renderer, or Approval authority.
- Queue data remains three safe opaque fields. URL and Candidate data come only
  from the claim response and are never copied back into Queue state.
- Generation/claim/Result checks prevent stale delivery from becoming
  execution authority. This uses existing identifiers and claim integrity; no
  new generic hash mechanism is introduced.
- Tests focus on real trust boundaries and recovery. They must not expand into
  repetitive impossible-case hardening or a general security framework.

## Migration and compatibility review

- Database Schema/migration/backfill: none.
- Queue data: unchanged. Job retention options become explicit and shared;
  deployment remains compatible because PostgreSQL is authoritative and
  missing eligible Jobs are already repairable.
- Private API: Claim gains one required delivery-generation header. Worker
  publisher and Fetcher consumer ship in the same modular-monolith repository;
  no public client compatibility is promised. Existing Claim tests are updated
  atomically.
- Configuration: additive Fetcher-only Redis and existing Object Storage
  settings become runtime-required when the Fetcher process starts.
- Rollback: stop the Fetcher process and revert this Work Item. No persisted
  migration or data rollback is required; queued/leased Task recovery remains
  owned by existing Worker/API behavior.

## Documentation updates

After evidence passes, synchronize only accepted current behavior:

- Fetcher process topology and repository ownership;
- Workflow Queue → Claim → Result execution boundary;
- Source Fetcher runtime/configuration/security boundary;
- English and Chinese README runtime status;
- `AGENTS.md` current stage/commands; and
- Roadmap/this Work Packet as `In Review`.

Keep M2 `In Progress`. Do not mark `M2-FETCH-001` completed until 001C is
independently accepted and merged. Do not start M2-SRC-004, Web, Research,
Agent, or M3 behavior in this item.

No new DEC is expected. Return to Decision Review before changing the Queue
payload/version, public-network policy, Result/Candidate/object-key contract,
service identity, API ownership, lease timing, process topology, approved
dependency/version, or M2/MVP scope.

## Required verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- focused Contracts/Config/Core/Worker/Fetcher unit tests
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm test:integration:concurrent`
- `corepack pnpm test:browser`
- `corepack pnpm db:generate` twice with no Schema diff
- dependency fixed-version, license, unique resolution, lockfile delta, and
  official-registry audit with exact base/new path attribution
- `git diff --check`
- exact file scope, Secret/local-path/generated-artifact/`.DS_Store`, process,
  Queue/container/temp-directory, owned-object cleanup, and Git status checks

An inherited non-zero dependency audit must be reported accurately and tied to
Issue #95; it is not silently suppressed or remediated inside 001C. The direct
Fetcher `bullmq@5.81.1` edge must add no new version or advisory path relative
to the base lockfile.

## Git permissions

- Implementation Agent Commit: No
- Implementation Agent Push: No
- Implementation Agent Pull Request: No
- Implementation Agent Merge: No
- Orchestrator publication after independent `PASS` and green CI: Yes, under
  the approved bounded autonomous workflow

The Implementation Agent stops with an uncommitted Completion Report. The
Orchestrator performs review corrections, publication, and merge. The
implementer cannot approve its own work.

## Escalation conditions

Return `HUMAN_DECISION_REQUIRED` before changing a public product direction,
accepted protocol/version, service identity/authorization boundary, production
data/configuration, irreversible migration, technical stack, meaningful cost,
or release criterion. Ordinary implementation details, safe bug fixes,
fixture corrections, CI reruns, and bounded internal Claim fencing remain in
the approved autonomous flow.

Two correction rounds that leave the same substantive defect unresolved stop
further patching and return to root-cause and Work Packet review.

## Definition of Ready record

Independent Planning Review returned `READY` against the real packet, Issue
[#98](https://github.com/JettxonHo/ContentOS/issues/98), and repository state on
2026-08-06.

- Logical Role: `PLANNING_REVIEWER`
- Target Model: `gpt-5.6-sol`, XHigh
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested; actual runtime setting was not exposed
- Thread: `/root/fetch001c_ready_review`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`

The first review identified four bounded contract gaps: implementation-file
authorization, pre-001C Job-retention compatibility, owned S3 lifecycle and
compensation timing, and server-derived Result `200` semantics. The corrected
packet authorizes the exact required files, uses BullMQ 5.81.1 Worker
`KeepJobs { count: 0 }` fallbacks for the accepted legacy profile, closes the
owned S3 client, gives definitive compensation a fresh five-second bound,
caps Gateway bodies at 16 KiB, and prevents double compensation after a valid
server-derived response. Final review found no Blocking Design Question, new
DEC, migration, architecture change, or human product decision.
