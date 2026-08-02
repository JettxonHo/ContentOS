# WORK PACKET — M2-WF-003B

**Status:** In Review

**Purpose:** Durable planning-to-implementation handoff for the private,
API-owned Fetcher Gateway Claim and bounded-heartbeat Lease boundary.

## 1. Identification

- **Task ID:** `M2-WF-003B`
- **Title:** Fetcher Gateway Claim and Bounded Lease
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#71](https://github.com/JettxonHo/ContentOS/issues/71)
- **Status:** In Review — implementation complete; awaiting independent review
- **Executor profile:** `BACKEND_GENERAL_EXECUTOR`
- **Reviewer:** independent review agent before Git publication
- **Dependencies:** `M2-WF-003A` completed through PR #69; `M2-DES-005`
  Option B accepted; the fixed Queue delivery contract is already deployed
- **Risk classification:** private service authentication, authoritative Task
  lease state, PostgreSQL concurrency and migration, Secret handling, and
  private API transport

## 2. Goal

Make one already-dispatched `url_capture` Task claimable only through a narrow
API-owned service Gateway. A correctly configured Fetcher service identity can
receive one opaque, time-bounded claim and keep it alive under a fixed
heartbeat policy. PostgreSQL remains the only Task authority.

This item establishes the Claim/Heartbeat boundary only. It deliberately does
not make the Fetcher consume Queue Jobs, retrieve a URL, write an object,
report a result, or promote Source evidence.

## 3. Authority and fixed decisions

This packet implements the already accepted direction; it does not reopen a
Decision Review.

| Authority                                                                                                                                                                      | Binding consequence                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-128, DEC-133–DEC-135, DEC-226, DEC-228–DEC-229, DEC-238, DEC-245, DEC-249, DEC-259                                                                                         | PostgreSQL is authoritative; Queue delivery can repeat; rejected, stale, or unauthenticated operations fail closed with no success effect.                          |
| DEC-221 and DEC-230–DEC-232                                                                                                                                                    | Fetcher has a distinct least-privilege identity, no general PostgreSQL credential, and no direct Domain write path.                                                 |
| [M2-DES-001](m2-des-001-public-url-fetcher-connection-binding.md) and [M2-DES-003](m2-des-003-fetcher-resource-policy.md)                                                      | No public request is authorised here. Their connection and resource-policy identifiers may be returned as private fixed metadata only.                              |
| [M2-DES-005](m2-des-005-fetcher-execution-gateway.md)                                                                                                                          | Option B is fixed: one scoped shared Gateway Secret, an opaque one-task claim stored only as a SHA-256 hash, and 60/20/120-second lease bounds.                     |
| [Workflow Overview](../../architecture/workflow-overview.md), [Source Fetcher](../../security/source-fetcher.md), and [Secret Management](../../security/secret-management.md) | API owns state transitions; Queue is delivery only; claims, URLs, bodies, object keys, and Secrets stay out of Queue data, Events, browser DTOs, and ordinary logs. |

Later Accepted DEC governs an actual conflict. A requirement to add a new
provider, identity system, public gateway, Fetcher result, Object Storage
operation, public URL request, or a change to the values below is a blocking
Decision Review, not an implementation choice.

## 4. Existing baseline

`M2-WF-002` atomically created an owner-scoped `queued` Task and its private
URL Reference/Request/Outbox/Event. `M2-WF-003A` delivers only the exact
three-field `fetcher-task/v1` envelope to BullMQ and records a durable
Outbox-ledger acknowledgement. It intentionally has no Fetcher consumer,
claim, execution lease, result, Source evidence, or public egress.

This item extends the authoritative Task state from `queued` to `leased` for
one successful private claim. The existing Worker keeps dispatching only
`queued` Tasks; it is not changed. Since this item does not activate a Queue
consumer, normal runtime behaviour cannot create a lease until the later,
explicitly authorised consumer/reconciliation work starts.

## 5. In scope

1. Add one private, API-owned Fetcher Gateway with exactly two non-browser
   operations: Claim and Heartbeat.
2. Add a Fetcher-only shared service Secret configuration contract for API and
   Fetcher, with fail-closed validation and no committed value.
3. Add an opaque one-task claim, SHA-256 hash-at-rest, and the fixed bounded
   PostgreSQL Task lease state described in §6.
4. Add typed Core, API-contract, repository, migration, and integration-test
   contracts needed to perform Claim and Heartbeat atomically.
5. Keep the Fetcher executable a configuration-validated lifecycle skeleton:
   it validates the same service identity material but does not consume
   BullMQ, call the Gateway, claim work, heartbeat, or make a public request.
6. Prove API authentication, owner/package/workflow state fencing,
   concurrency, stale/expired/early heartbeat rejection or idempotence,
   migration compatibility, redaction, and zero-residue cleanup.

## 6. Fixed contracts

### 6.1 Service configuration and authentication

The following names are exact:

| Process | Input                                  | Classification | Required rule                                                                                                                            |
| ------- | -------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| API     | `CONTENTOS_FETCHER_GATEWAY_SECRET`     | Secret         | Required URL-safe base64url token, 43–128 ASCII characters, matching `^[A-Za-z0-9_-]+$`; never echo it.                                  |
| Fetcher | `CONTENTOS_FETCHER_GATEWAY_SECRET`     | Secret         | Same validation and same injected value as API; the skeleton validates it but makes no request in this item.                             |
| Fetcher | `CONTENTOS_FETCHER_GATEWAY_API_ORIGIN` | Non-secret     | Required exact `http` or `https` origin whose hostname is literal `127.0.0.1`; no userinfo, path, query, fragment, or `localhost` alias. |
| Both    | `CONTENTOS_ENV`                        | Non-secret     | Reuse only `development`, `test`, or `production`.                                                                                       |

The API compares the supplied Secret using a constant-time comparison of
fixed-length SHA-256 digests. A missing, duplicate, malformed, or wrong
`x-contentos-fetcher-gateway-secret` header returns the same generic `401`
`FETCHER_GATEWAY_UNAUTHENTICATED` response. It never reads a Session Cookie as
fallback identity.

No production Secret Store, rotation protocol, TLS termination, mTLS,
identity provider, proxy, or network-topology change is selected by this
item. The loopback-only API-origin contract is intentionally conservative
until a future deployment Decision Review exists.

### 6.2 Private HTTP surface

The Gateway is part of the existing API modular monolith, not another service.
It is excluded from generated OpenAPI and never receives cookie authentication
or browser DTOs.

| Operation | Exact route                                      | Required headers                                | Request body | Successful response                                                                                                                                                                          |
| --------- | ------------------------------------------------ | ----------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claim     | `POST /internal/fetcher/tasks/:taskId/claim`     | `x-contentos-fetcher-gateway-secret`            | Absent       | `data.taskId`, `data.taskKind`, `data.submittedUrl`, `data.connectionPolicyVersion`, `data.resourcePolicyVersion`, `data.attemptNumber`, `data.leaseExpiresAt`, and one opaque `data.claim`. |
| Heartbeat | `POST /internal/fetcher/tasks/:taskId/heartbeat` | Gateway Secret plus `x-contentos-fetcher-claim` | Absent       | `data.taskId`, `data.attemptNumber`, `data.leaseExpiresAt`, and `data.renewed`.                                                                                                              |

The two fixed private policy identifiers are
`public-url-connection/v1` and `public-url-resource/v1`. They declare which
already accepted Fetcher policy the future process must apply; they do not
enable its implementation.

Both routes bypass the browser-origin guard only through a narrowly named
service-transport metadata marker. That marker may be used only by this
Gateway controller and only together with the Fetcher service guard. Existing
owner routes keep their normal Origin and Session protections. Any request
body, unexpected Content-Type, repeated required header, malformed UUID, or
unknown field is denied as `422 INVALID_GATEWAY_REQUEST` before a state write.

A valid service identity receives only generic conflict codes:

- Claim rejects unknown, wrong-kind, non-`queued`, non-`active`, archived,
  already-leased, missing/invalid-Outbox, or otherwise ineligible Tasks as
  `409 FETCHER_TASK_UNAVAILABLE`.
- Heartbeat rejects an unknown, wrong, expired, stale, or non-leased claim as
  `409 FETCHER_CLAIM_UNAVAILABLE`.

Neither response reveals the URL, owner, package, internal SQL condition, or
current workflow state on denial. The private `submittedUrl` is returned only
on a successful claim and must never enter an Event, Queue payload, ordinary
log, trace, error, test diagnostic, or browser response.

### 6.3 Claim and heartbeat lease state

`workflow_tasks` becomes the authoritative lease ledger. It gains exactly:

```text
state: queued | leased
claim_attempt_number: integer >= 0, initial 0
claim_hash: nullable 64-character lowercase SHA-256 hex
claimed_by: nullable literal fetcher
lease_started_at: nullable timestamptz
lease_expires_at: nullable timestamptz
lease_heartbeat_at: nullable timestamptz
```

The database and Core validation must jointly require:

```text
queued → every claim/lease field is null; attempt count may retain history
leased → claimed_by=fetcher, attempt count >= 1, hash and all timestamps exist
          lease_started_at <= lease_heartbeat_at < lease_expires_at
```

Claim uses a new `randomBytes(32)` base64url value, returns it once, and stores
only its SHA-256 hex digest. One transaction locks the exact Task and verifies:

- Task kind is `url_capture`, state is `queued`, and its Instance is `active`;
- its Node is `ready`, its Content Package is active, and all owner/package
  composite bindings remain exact;
- its URL Capture Request and private URL Reference remain exact;
- exactly one matching `fetcher-task/v1` Outbox record is `dispatched`, with
  the fixed category and unchanged exact three-field payload; and
- no prior lease exists.

Only then it increments `claimAttemptNumber`, sets `state=leased`, writes the
hash/category/timestamps, and returns the bounded private Claim response.
It creates no Source, Snapshot, Working Copy, Version, Approval, Result,
Workflow Event, Outbox record, Queue Job, or delivery generation.

The initial lease expires at `now + 60 seconds`. Heartbeat accepts only the
same authenticated service and unexpired current claim. At most one heartbeat
per 20 seconds may modify the row. An early or duplicate Heartbeat is
idempotent: it returns the existing expiry with `renewed=false` and changes no
timestamp or revision. An eligible Heartbeat sets `leaseHeartbeatAt=now` and
sets expiry to the earlier of `now + 60 seconds` and
`leaseStartedAt + 120 seconds`, returning `renewed=true`. If that candidate
cannot extend the existing expiry because the two-minute cap is reached, it is
rejected as `FETCHER_CLAIM_UNAVAILABLE` without a write. It cannot renew at or
after expiry, revive a stale claim, or change an Outbox record.

Lease expiry recovery, clearing a lease, returning a Task to `queued`,
incrementing delivery generation, and appending recovery evidence are
explicitly reserved for `M2-WF-003C`.

### 6.4 Core, persistence, and migration boundary

Core owns pure types, validation, rehydration, error vocabulary, and the
application use case. It receives injected Clock, ID/claim generator, and
repository ports; it must not import Nest, Drizzle, Fastify, BullMQ, or a
Secret value.

The database adapter owns one parameterized, transactional PostgreSQL Claim
and one parameterized, conditional Heartbeat. It must use row locking or an
equivalent guarded statement such that concurrent claims produce exactly one
leased Task and exactly one opaque claim outcome. It must not make Queue or
Object Storage calls.

Add one reviewed, forward-only `0007_*.sql` migration and matching Drizzle
metadata. Existing `0006` Task rows preserve identity, bindings, `queued`
meaning, and timestamps; they receive only safe `claimAttemptNumber = 0` and
null lease fields. The migration creates no Task, lease, Queue Job, Source,
Snapshot, Event, Outbox record, or historical result. It replaces the existing
Task-state check with the named `queued`/`leased` and lease-shape constraints,
and names every new Check or Foreign Key used by migration tests. A second
`db:generate` must be a no-op.

### 6.5 Observability and error boundary

No Claim or Heartbeat creates a Workflow Event in this item. The authoritative
row timestamps are the only new lease audit facts. API/Fastify diagnostics,
Core errors, repository errors, and Fetcher lifecycle logs may contain only a
stable safe code and opaque Task ID where necessary. They must exclude the
Gateway Secret, opaque claim, full URL, Package/owner IDs, Source Reference,
Capture Request, Outbox ID, Queue payload, Object key, raw header, raw SQL,
stack, and database URL.

## 7. Allowed files and modules

### Allowed modules

- `apps/api/src/{app.module,runtime.tokens}.ts`
- new `apps/api/src/fetcher-gateway/**`
- `apps/api/src/database.service.ts` — only exposes the Fetcher Gateway
  repository from the API's existing Database Runtime to the API-owned service
- `apps/api/src/http/api-exception.filter.ts` — only maps existing Core Gateway
  errors to stable, redacted HTTP errors
- `apps/api/src/http/trusted-origin.guard.ts` and only the new narrowly scoped
  service-transport metadata helper it requires
- `apps/fetcher/src/main.ts`
- `packages/config/src/{api-config,fetcher-config,index}.ts` and their tests
- `packages/core/src/{index,workflow/url-capture,workflow/fetcher-gateway}.ts`
  and their tests
- `packages/contracts/src/{index,api/fetcher-gateway-contracts}.ts` and tests
- `packages/database/src/{index,runtime,schema,workflow-command-repository,workflow-fetcher-gateway-repository,workflow-repository-testing}.ts`
- `packages/testing/src/integration/**` only for Gateway, migration, process,
  URL-capture regression, and test-environment fixtures

### Allowed files

- `.env.example` with placeholders only
- one migration `migrations/0007_*.sql`,
  `migrations/meta/0007_snapshot.json`, and `migrations/meta/_journal.json`
- the exact test files required by §10
- `docs/architecture/{process-topology,repository-structure,workflow-overview}.md`
- `docs/security/secret-management.md`
- `docs/implementation/roadmap.md`, `AGENTS.md`, `README.md`, and
  `README.zh-CN.md`
- this Work Packet

### Prohibited modules and files

- `apps/web/**`, `apps/worker/**`, and `apps/renderer/**`
- every Fetcher public-request/client/consumer module other than the existing
  configuration-validated lifecycle entry point
- `packages/object-storage/**`, `packages/core/src/source/**`, and existing
  Source capture/Approval behaviour
- `compose.yaml`, `pnpm-workspace.yaml`, root `package.json`, every package
  manifest, `pnpm-lock.yaml`, Docker/CI/GitHub configuration, `.gitignore`,
  `.node-version`, Decision Register, Sessions, acceptance records, and
  unrelated Work Packets
- any Queue payload change, BullMQ consumer, Worker reconciliation, result
  endpoint, Source mutation, Object Storage call, HTTP/DNS/TLS public fetch,
  parser, browser UI/SSE/Agent code, external Secret/IAM system, or new
  dependency

### Generated files policy

`0007` and its Drizzle metadata are generated from the reviewed Drizzle schema
with `corepack pnpm db:generate`, then committed only after SQL review. Run it
again after generation; the second run must produce no diff. No build output,
temporary credential, generated OpenAPI file, diagnostic, or fixture artifact
is commit-eligible.

## 8. Acceptance criteria

1. Only the exact private Claim and Heartbeat routes exist; both are excluded
   from `/openapi.json`, require the Fetcher Gateway Secret, never accept a
   Session as fallback identity, and cannot be used by a browser without that
   Secret.
2. Correct Claim authentication for one eligible dispatched `url_capture`
   Task atomically creates one `leased` Task with attempt 1 and returns the
   private URL, fixed policy identifiers, one opaque claim, and a 60-second
   expiry. PostgreSQL stores only the correct claim hash.
3. Missing, repeated, malformed, and wrong Gateway Secrets all receive the
   same generic unauthenticated response and make no persistence change.
4. Unknown/wrong-kind/non-queued/archived/non-active/non-ready/missing-Outbox
   Tasks, duplicate concurrent Claim, malformed route/body/header, and stale
   Queue eligibility all reject without adding or changing Task, Source,
   Event, Outbox, Queue, or delivery facts.
5. Only the exact unexpired opaque claim may Heartbeat its own leased Task.
   An early duplicate Heartbeat is read-only; valid 20-second cadence renews
   within the 120-second total cap; a cap-reached, expired, swapped, wrong, or
   late claim rejects with no effect.
6. The Fetcher process validates its exact local API origin and shared Secret,
   fails non-zero with a redacted configuration error when either is missing or
   malformed, and remains a non-consuming lifecycle skeleton on success.
7. Empty database and `0006 → 0007` migration tests prove safe defaults,
   named constraint rejection, no historical backfill, no Source/Outbox/Event
   mutation, and a no-diff second generation.
8. Existing owner URL-capture Command and its idempotent replay retain their
   current response and durable Outbox delivery boundary; Worker dispatch
   continues to select `queued` Tasks only.
9. API, Core, repository, configuration, process, Secret/local-path,
   documentation-link, generated-artifact, exact-file-scope, and whitespace
   verification pass with no owned container, process, Queue Job, temp
   credential, or local-volume residue.
10. No public URL request, Fetcher consumer, result, Source evidence, Object
    Storage operation, lease recovery, owner Retry, UI/SSE, Agent capability,
    dependency, or Accepted DEC change is introduced.

## 9. Required tests and verification

- Core unit tests for Task `queued`/`leased` rehydration, exact claim response
  shape, opaque-claim hash validation, illegal field combinations, and
  fail-closed policy identifier values.
- Configuration tests for API and Fetcher Secret/origin validation, malformed
  values, redaction, and no Secret reflection.
- Contract tests for exact private DTO/header/body rules and absence from the
  public OpenAPI document.
- API integration tests for valid Claim/Heartbeat; wrong/missing/duplicate
  Secret; absent/malformed body; denied owner Cookie; task-state/role/package/
  Instance/Node/Outbox eligibility; and no sensitive response/log evidence.
- PostgreSQL repository tests with two connections for one-winner Claim,
  claim-hash-only storage, conditional Heartbeat, early idempotence, expiry,
  cap, and named constraint failures.
- Isolated empty and `0006 → 0007` migration tests; verify no backfill and
  second `db:generate` no-diff output.
- Process-lifecycle test that starts the Fetcher skeleton with temporary
  configuration, proves it makes no Queue/API/public request, and reclaims it
  after SIGTERM. Configuration failure must be non-zero and redacted.
- Existing URL-capture, Dispatcher, Source, integration-harness, concurrent
  harness, browser, and workspace regressions.

Run at least:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
corepack pnpm db:generate
corepack pnpm audit
git diff --check
```

The Completion Report must include the migration SQL review, both generation
results, exact changed-file list, relevant failure-path exit codes, Secret and
claim redaction evidence, OpenAPI exclusion evidence, and zero-residue proof.

## 10. Security, compatibility, and documentation review

This item introduces one scoped service Secret and private capture input into
the API-to-Fetcher boundary. It does not introduce user-controlled external
input, public network egress, a provider credential, Object Storage write,
general database credential for Fetcher, or a browser capability. All tests
must keep generated Secrets and opaque claims outside the repository and
diagnostics.

The migration is additive/forward-only. It changes neither existing Source
semantics nor URL-capture API DTOs, Queue data, Outbox delivery generation, or
the Worker-owned Dispatcher. No rollback migration is authorised; durable
lease recovery is a later explicit Work Item.

After implementation evidence is complete, update the listed architecture and
Secret Current-truth documents, repository entry documents, and the M2 roadmap
truthfully. Mark this row `In Review` only after all acceptance evidence; mark
it `Completed` only after independent review and merge. Do not modify Accepted
DEC or the Decision Register.

## 11. Completion boundary

The Implementation Agent must read this packet and its listed authority,
modify only §7 files, and stop with a Completion Report. It must not commit,
push, create a Pull Request, merge, switch branches, or self-approve.

After an independent `PASS`, the Review Agent may perform Git publication
under the user's standing authorization. M2 remains In Progress;
`M2-WF-003C`, `M2-SRC-003`, `M2-FETCH-001`, and M3 remain unstarted.
