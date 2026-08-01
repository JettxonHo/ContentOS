# WORK PACKET — M2-WF-002

**Status:** Ready for implementation

**Purpose:** Durable planning-to-implementation handoff for the first
owner-scoped, atomic URL-capture Command

**Created:** 2026-08-01

## 1. Identification

- **Task ID:** `M2-WF-002`
- **Title:** Atomic URL-capture Command, Task, and Transactional Outbox
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#58](https://github.com/JettxonHo/ContentOS/issues/58)
- **Branch:** `codex/m2-wf-002-atomic-url-capture-command`
- **Base commit:** `4e81cb039a4c71e468ca361aaf0fc6604760af2c`
- **Executor Profile:** `BACKEND_GENERAL_EXECUTOR`
- **Owner:** one implementation agent, as the only repository writer
- **Reviewer:** independent review agent before publication
- **Dependencies:** `M2-WF-001` merged through PR #55; M2-DES-001 through
  M2-DES-004 accepted
- **Risk classification:** owner authorization, private URL reference, Core
  Command, PostgreSQL transaction/migration, API/OpenAPI contract, and Outbox
  foundation

### Implementation entry condition

Implementation starts only from a clean, current `main` that already contains
this Work Packet. Recreate
`codex/m2-wf-002-atomic-url-capture-command` from that `main`, record its full
base SHA in the Implementation Completion Report, and keep one implementation
agent as the sole repository writer. This planning branch is not an
implementation baseline.

## 2. Goal

Let the authenticated owner submit one structured public-URL capture Command
for an active Content Package. In one PostgreSQL transaction, it lazily creates
the fixed v1 Workflow Instance and enabled `source_capture` Node when absent,
then persists a private URL Source Reference, one immutable URL Capture
Request, a queued authoritative Task, one pending Transactional Outbox record,
and one append-only Workflow Event.

The command records a safe, durable request only. It does not dispatch a Queue
Job, retrieve a URL, create a `sources` row, write Object Storage, create a Raw
Snapshot, create review content or a Version, complete a Node, or create a
human Approval.

## 3. Authority and context

This Work Packet implements item 2 in §5 of accepted
[M2-DES-004](m2-des-004-workflow-task-foundation.md). Its accepted Option B
governs the Work Item split: the owner Command atomically creates the initial
Instance/Node, URL Source Reference, Capture Request, Task, Outbox record, and
Event. The later M2-DES-004 review takes precedence over the earlier
M2-DES-002 provisional Work Item naming where they differ: this item owns the
atomic Command and persistence; dispatch, claim, lease, and reconciliation
remain a separate later Work Item.

M2-WF-001 provides an immutable server-owned
`content-package-dual-output/v1` catalog and neutral Instance/Node/Event
primitives, but deliberately exposes no product runtime Command. M1 and
M2-SRC-001/M2-SRC-002 retain their manual Source capture behavior and create no
Workflow history. Existing Packages are eligible for lazy bootstrap; this
packet authorizes neither a bulk backfill nor synthetic Events for earlier
manual Sources.

Later Accepted DEC governs an actual conflict. This packet makes only the
bounded implementation choices explicitly left to the next Ready Work Item; it
does not alter an Accepted DEC, current MVP scope, technical stack, process
topology, or security boundary.

## 4. In scope

1. Add framework-independent Core values, validation, and one owner-scoped
   URL-capture Command Use Case. Core must remain independent of NestJS,
   Drizzle/PostgreSQL, BullMQ, HTTP, Object Storage, and Fetcher transport.
2. Add the protected API route and versioned TypeScript/OpenAPI contract:
   `POST /v1/content-packages/:packageId/url-capture-requests`.
3. Add an additive PostgreSQL migration for private URL Source References,
   immutable URL Capture Requests, authoritative Workflow Tasks, and pending
   Outbox records. Add the corresponding Drizzle schema and an atomic Command
   repository adapter.
4. Atomically create the exact initial v1 primitives, including the one
   `source_capture` Node in `ready` state, one `queued` URL-capture Task, one
   pending Outbox record, and one safe `url_capture_requested.v1` Event.
5. Enforce owner scope, active Package state, expected Package revision,
   current formal Source role capacity, idempotency, one initial URL-capture
   request per v1 `source_capture` Node, exact Template binding, and
   database-level ownership/binding/uniqueness invariants.
6. Define the v1 Queue-envelope _data contract_ as only `taskId`, task kind,
   category, and envelope version. Persist it through the Outbox record but do
   not instantiate BullMQ, a Dispatcher, a Worker, or a Fetcher client.
7. Add Core, contract, repository/migration, API integration, authorization,
   concurrency, transaction-rollback, secret/redaction, and regression tests.
8. Synchronize only the Current-truth documentation listed in §15 after the
   implementation evidence is complete.

## 5. Out of scope

- Outbox dispatch, BullMQ configuration or execution, Queue Job creation,
  delivery tracking, Fetcher service identity, claim, lease, heartbeat,
  result, retry, cancellation, reconciliation, or Worker recovery.
- URL normalization for network use, DNS, TCP/TLS/HTTP, proxy handling,
  redirects, resource limits, extraction, Object Storage writes, Raw
  Snapshots, Safe Display, or any public network request.
- A `sources` row, Source Working Copy, Version, Head, Approval, source
  promotion, source role-capacity transfer, or a change to existing
  pasted-text/upload capture behavior.
- Browser UI, Timeline query, SSE, polling, generic Task API, generic Workflow
  transition API, Workflow Builder, Template selection, Agent, Research, M3,
  Render, Export, or publishing.
- New dependency, configuration key, credential, Docker/Compose change,
  provider, proxy, service mesh, database, microservice, or Accepted DEC
  change.

## 6. Fixed contracts

### 6.1 Owner API Command

The protected normal-owner route is:

```text
POST /v1/content-packages/:packageId/url-capture-requests
Idempotency-Key: <16–128 character base64url token>
Content-Type: application/json
```

`packageId` is an opaque UUID path parameter. The request body has no
additional properties and is exactly:

```json
{
  "expectedPackageRevision": 1,
  "role": "primary",
  "submittedUrl": "https://example.com/article"
}
```

Rules:

- `expectedPackageRevision` is a safe integer of at least 1.
- `role` is exactly `primary` or `supporting`. The transaction rejects the
  Command when current formal `sources` already meet the existing `1 primary +
0–5 supporting` limit. A successful URL Source Reference is still immutable
  submitted-role intent, not a created `Source` or a consumed Source-capacity
  slot; M2-SRC-003 must re-evaluate capacity when it is eligible to create
  formal Source evidence.
- `submittedUrl` is private user input. It is well-formed Unicode scalar text,
  has no NUL/C0/C1 control character or leading/trailing whitespace, and is
  1–2048 UTF-8 bytes. It must parse as an absolute `http` or `https` URL with a
  hostname and no user-information component. The original accepted string,
  including a fragment or query, is preserved only in the private Source
  Reference; this Command performs no normalization, DNS, destination, port,
  redirect, TLS, or resource-policy decision.
- `Idempotency-Key` is mandatory, one string header value, ASCII base64url
  (`A–Z`, `a–z`, `0–9`, `_`, `-`), and 16–128 characters. It is scoped to
  owner, Package, and this Command kind. Its fingerprint is lowercase SHA-256
  of the Core canonical serialization of exactly
  `{ expectedPackageRevision, role, submittedUrl }`; it is never included in an
  Event, Outbox envelope, ordinary log, or browser response.

The success representation is safe to return to the owner and contains only:

```json
{
  "data": {
    "urlCaptureRequest": {
      "id": "uuid",
      "contentPackageId": "uuid",
      "sourceReferenceId": "uuid",
      "workflowInstanceId": "uuid",
      "workflowNodeId": "uuid",
      "taskId": "uuid",
      "taskState": "queued",
      "createdAt": "RFC 3339 timestamp"
    }
  }
}
```

The first accepted Command and an identical idempotent replay return this exact
representation with `201`; replay creates no row, Event, or timestamp. The
response, OpenAPI examples, `ApiHttpError`, logs, telemetry, Event payload, and
Outbox envelope must never contain `submittedUrl`, final URL, query string,
header, raw body, Object Storage key, signed URL, credential, or execution
claim.

Errors follow the existing API envelope. Invalid request/path/header input is
`422 INVALID_REQUEST`; owner-scoped missing Package is `404`; stale revision,
archived Package, existing initial URL Capture Request, or a mismatched reuse
of an Idempotency Key is `409` with a stable existing conflict code. No error
echoes the submitted URL or header value.

### 6.2 Core Command and state values

Core owns opaque branded IDs and fail-closed rehydration/validation for:

- `UrlSourceReference`: owner, Content Package, immutable role intent,
  private submitted URL, and creation time;
- `UrlCaptureRequest`: one immutable request bound to exactly one Source
  Reference and v1 `source_capture` Node;
- `WorkflowTask`: exact Instance/Node/Request binding, task kind
  `url_capture`, and initial state `queued`;
- `WorkflowOutboxRecord`: one Task binding, category `fetcher`, envelope
  version `fetcher-task/v1`, and initial state `pending`; and
- the safe Event payload `{ captureRequestId, sourceReferenceId, taskId }` for
  `url_capture_requested.v1`.

The Core Command accepts the owner identity, Package identity, expected
revision, role, submitted URL, and Idempotency Key. It creates all opaque IDs,
the exact v1 Template binding, and validated initial values. Its Repository
Port exposes one atomic `submitUrlCapture` operation; it does not expose
generic Task/Outbox mutation, Queue delivery, claim, result, Source mutation,
or a graph builder.

### 6.3 Atomic persistence contract

Migration `0005` is additive and forward-only. It creates precisely:

- `url_source_references`: UUID, owner/Package composite FK, immutable role,
  private accepted submitted URL, and timestamp;
- `url_capture_requests`: UUID, Source Reference and exact v1
  Instance/Node/owner binding, expected Package revision, Idempotency Key,
  SHA-256 request fingerprint, and timestamp;
- `workflow_tasks`: UUID, exact Instance/Node/owner/Capture Request binding,
  kind `url_capture`, initial `queued` state, and timestamps; and
- `workflow_outbox_records`: UUID, exact Task/owner/Package binding, category
  `fetcher`, envelope version `fetcher-task/v1`, safe payload
  `{ taskId, taskKind, envelopeVersion }`, initial `pending` state, and
  timestamp.

The migration must add PostgreSQL checks for bounded non-empty identifiers,
role, task kind/state, Outbox category/version/state, a lowercase 64-hex
fingerprint, and JSON-object payload. Composite foreign keys must prove the
owner/Package/Instance/Node/Request/Task relationships. Unique constraints
must enforce one URL Capture Request per `source_capture` Node, one request per
Source Reference, one Task per request, one Outbox record per Task, and one
Idempotency Key per owner/Package/Command kind.

The Core/adapter must verify that the persisted Outbox JSON exactly matches the
fixed safe envelope and that the Event payload is exactly the three opaque IDs.
It must never insert user URL text into either JSON field. The event sequence
is the next positive sequence under the Package-scoped atomic Command; for the
first lazy Instance it is 1.

The Drizzle adapter performs the entire Command in one PostgreSQL transaction:

1. return an existing matching idempotency result without new side effects, or
   reject a mismatched key;
2. lock and owner-scope the Content Package, require `active` lifecycle and
   exact expected revision;
3. reject a role that has no current formal Source capacity, load the fixed
   catalog, lazily create the exact v1 Instance if absent, and materialize only
   its `source_capture` Node in `ready` state;
4. reject a distinct URL-capture Command if that Node already has a request;
5. insert the URL Source Reference, Capture Request, queued Task, pending
   Outbox record, and append-only Event; then return the safe representation.

Any validation, authorization, conflict, database, or injected persistence
failure rolls back every new row from this Command. The migration seeds no
Instance, Node, Event, Source Reference, Capture Request, Task, or Outbox row
for existing Packages or Sources.

### 6.4 Explicitly deferred Source role capacity

An URL Source Reference is submitted-origin history, not a `sources` record or
captured Source evidence. The Command therefore checks the current formal
Source count but does not call `SourceService`, modify the existing `sources`
table constraints, reserve a role-capacity slot, or change pasted-text/upload
behavior. The one-request-per-`source_capture`-Node constraint bounds this
first command. M2-SRC-003 must re-check the existing `1 primary + 0–5
supporting` Source role limit when, and only when, a valid Gateway result is
eligible to create formal Source evidence. It must transfer or reject role
intent without creating two formal Sources.

This is deliberate: permanently claiming Source capacity before any fetch would
allow a failed or never-dispatched request to consume an MVP Source slot while
this packet has no retry, cancellation, removal, or result-promotion behavior.

## 7. Allowed files and modules

### Allowed modules

- `packages/core/src/workflow/**`
- `packages/database/src/{schema,workflow-repository,workflow-command-repository,workflow-repository-testing,runtime,index}.ts`
- `packages/contracts/src/api/**` and `packages/contracts/src/index.ts`
- `apps/api/src/{app.module,database.service,runtime.tokens}.ts`
- a new bounded `apps/api/src/url-capture/**` module and its tests
- `packages/testing/src/integration/**`

### Allowed files

- one reviewed generated Drizzle migration `migrations/0005_*.sql` and its
  corresponding `migrations/meta/0005_snapshot.json` and `_journal.json`
- Core, contract, database, API, and integration tests required by §10
- `docs/architecture/workflow-overview.md`
- `docs/architecture/repository-structure.md`
- `docs/implementation/roadmap.md`
- `AGENTS.md`
- this Work Packet

### Prohibited modules and files

- `apps/web/**`, `apps/worker/**`, `apps/fetcher/**`, and `apps/renderer/**`
- `packages/object-storage/**`, `packages/config/**`, and existing
  `packages/core/src/source/**` behavior
- existing Source API controllers/contracts except unchanged regression tests
- `compose.yaml`, `.env.example`, `.gitignore`, `.node-version`, package
  manifests, `pnpm-lock.yaml`, Docker/CI configuration, Decisions, Sessions,
  acceptance records, and GitHub workflow files
- any Fetcher HTTP/DNS/TLS code, BullMQ/Redis client, Queue consumer, new
  Secret/configuration, Object Storage operation, browser UI, or Agent code

### Generated files policy

`0005` and its Drizzle metadata are generated from the reviewed Drizzle schema
with `corepack pnpm db:generate`, then committed only after SQL review. The
generator must report no diff on a second run. No other generated file is
permitted.

## 8. Security, compatibility, and observability review

### Security

The task accepts a private user URL at the authenticated owner API boundary.
Contracts and Core validate structure before persistence; PostgreSQL queries
are parameterized; all reads/writes use owner/Package scope. The private
submitted URL may include a legitimate query string and is stored only in the
private Source Reference. It is excluded from response DTOs, OpenAPI examples,
Events, Outbox payloads, Queue contracts, normal logs, telemetry, diagnostics,
and error messages.

No public network, Fetcher identity, database credential, Object Storage,
external provider, secret, user Cookie forwarding, or Prompt/Model input is
introduced. A syntactic API denial is not a Fetcher security result and never
creates a Source, Snapshot, Version, Approval, Task, Outbox, or Event.

### Compatibility and migration

The migration is additive and does not alter existing Package/Source rows,
constraints, Raw Snapshots, Version history, approvals, catalog rows, or
Workflow Events. It creates no backfill or synthetic history. Existing API
routes retain their contracts; the one new protected route is additive. A
rollback migration is not authorized. Failed Commands rely on transaction
rollback rather than compensating writes because no Object Storage or external
side effect occurs.

### Observability

The safe append-only Event is the only new durable coordination evidence; it
contains opaque IDs only. There is no timeline/API projection, metric, trace,
or Queue observability in this packet. Existing API correlation IDs remain in
the standard error envelope, but no input URL or Idempotency Key may be logged.

## 9. Acceptance criteria

1. An authenticated owner can submit a valid Command for an active owned
   Package at its exact revision and receives one safe `201` representation.
2. One success atomically creates exactly one v1 Instance (when absent),
   `source_capture` Node (`ready`), URL Source Reference, Capture Request,
   queued Task, pending Outbox record, and `url_capture_requested.v1` Event.
   All exact owner/Package/Template/Node/Request/Task bindings hold.
3. The Outbox payload and Event payload match their exact safe schemas and
   contain no submitted URL, header key, body, Object Storage reference,
   credential, or execution claim.
4. The same Idempotency Key and exact logical Command return the stored result
   without new rows, Event, or timestamp. The same key with a different
   request fingerprint fails with its stable conflict code and no side effect.
5. Concurrent identical Commands produce one durable effect and deterministic
   replay; concurrent distinct initial Commands produce at most one durable
   effect and one stable conflict. Database constraints are asserted by name.
6. Missing/other-owner/archived Packages, stale revision, current formal Source
   role capacity, malformed body/path or Idempotency Key, URL with invalid
   scheme/host/user-info/control text, and a distinct request after the Node
   already has a Capture Request all fail closed with the specified error
   category and zero partial rows.
7. Transaction failure injected after each persistence stage leaves no partial
   Instance/Node/Reference/Request/Task/Outbox/Event record from that Command.
8. Existing Sources and Source APIs remain unchanged. This Command creates no
   `sources`, Raw Snapshot, Working Copy, Version, Head, Approval, Object
   Storage object, Queue Job, Dispatcher process, BullMQ connection, Fetcher
   request, or network side effect.
9. Empty-database and isolated `0004 → 0005` migration tests preserve existing
   M1/M2 Source rows and M2-WF-001 catalog/Event history, create no backfill,
   and enforce the new FK/CHECK/unique constraints.
10. The new OpenAPI contract exactly represents the request, safe response,
    authentication, and 404/409/422 errors. No response or documentation
    claims a URL was fetched, captured as a Source, reviewed, or approved.
11. Required quality, secret, local-path, generated-artifact, exact file-scope,
    whitespace, documentation-link, and repository checks pass.

## 10. Required tests and verification

- Core unit tests for URL/Idempotency validation, exact initial values,
  state/event/envelope rehydration, safe payload construction, and invalid
  values.
- Contract tests for strict request/response JSON Schema/Ajv parsing and no
  extra property acceptance.
- Database repository tests for atomic happy path, idempotency replay/mismatch,
  owner scope, active/revision/formal-role-capacity checks, node/request
  conflict, payload redaction, and named PostgreSQL constraints.
- Migration tests on isolated temporary PostgreSQL databases for empty install,
  `0004 → 0005` upgrade, no backfill, and new relational/JSON constraints.
- Two-connection concurrency tests for identical and distinct Commands.
- Transaction rollback tests that force failure at each insert boundary and
  assert no task-created residue.
- API integration tests for session authentication, owner scope, request/error
  mapping, OpenAPI, response redaction, and zero Source/Object/Queue/network
  side effect.
- Existing M1/M2 Source regression and full quality/integration test suites.

Required commands include:

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
git diff --check
```

The Implementation Completion Report must additionally show exact changed-file
scope, no dependency/lockfile/Compose/configuration delta, no runtime residue,
and a second `db:generate` with no schema diff.

## 11. Documentation updates

After implementation evidence is complete:

- update `docs/architecture/workflow-overview.md` with the limited owner
  Command/persistence boundary and explicit no-dispatch/no-fetch disclaimer;
- update `docs/architecture/repository-structure.md` with the bounded Core,
  database, contract, and API URL-capture module ownership;
- update `AGENTS.md` only with a truthful API capability statement that still
  says no dispatcher, Queue delivery, Fetcher, Source evidence, or UI exists;
- update the M2 roadmap to `In Review` only after evidence is complete;
- leave the Decision Register and all Accepted DEC unchanged.

## 12. Completion boundary

The Work Item is complete only when every acceptance criterion has direct
evidence and independent review confirms the atomicity, owner scope,
idempotency, private-URL redaction, exact file boundary, and no-Queue/no-Fetch
boundary. It may create a Commit, Push, Pull Request, and merge under the
user's standing GitHub authorization. M2 remains In Progress and M3 remains
not started after this Work Item.
