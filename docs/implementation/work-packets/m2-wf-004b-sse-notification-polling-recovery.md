# M2-WF-004B — SSE Notification and Polling Recovery

**Status:** Ready

**Issue:** [#110](https://github.com/JettxonHo/ContentOS/issues/110)

**Planning branch:** `codex/m2-wf-004b-ready-design`

**Planning / Definition-of-Ready base:**
`adcde58d4567db8eb91d874f5344c868ea4babc6`

## Identification

- Work Item: `M2-WF-004B`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the
  runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Risk Classification: authenticated long-lived private read, owner scope,
  stream lifecycle, browser recovery, and private-metadata disclosure

## Goal

Add one authenticated, owner-scoped SSE endpoint that notifies a browser when
the existing public Workflow projection changes, plus one reusable browser
recovery controller that refreshes the authoritative REST projection and falls
back to five-second Polling after a stream failure.

PostgreSQL and the M2-WF-004A REST projection remain authoritative. The SSE
payload is only a bounded change notification. This Work Item does not compose
the controller into the current M1 Workspace or add visible Source/Workflow UI;
that production composition belongs to M2-WEB-001A/B.

## Design resolution

This packet fixes the following bounded implementation choices:

1. The current Workspace is not modified. M2-WF-004B delivers and tests a
   reusable browser recovery controller; later Web Work Items own visible UI
   composition.
2. The existing `WorkflowQueryPort.getProjection()` is reused for owner scope,
   exact `content-package-dual-output/v1` selection, and public-state
   observation. A second database projection is not added.
3. The API compares an internal deterministic serialization of the returned
   public projection. It is an equality-only in-memory marker, not a hash, is
   never emitted or logged, and causes a notification for Task-only projection
   changes even when the Event high-water is unchanged.
4. The endpoint uses the pinned NestJS SSE lifecycle. A transport-only named
   keepalive event is used instead of adding a manual Fastify raw-stream
   implementation solely to produce comment frames.
5. Authentication is enforced at connection time. The stream completes no
   later than the authenticated Session expiry and is disposed by the browser
   on logout/unmount. It does not retain the raw credential or re-query the
   Session every second.
6. On the first EventSource error or malformed application notification, the
   browser closes EventSource and begins non-overlapping authoritative REST
   Polling after five seconds. It does not run native reconnect and Polling in
   parallel.
7. `latestSequence` is an Event high-water, not a notification revision. Two
   notifications may legitimately carry the same sequence when a public Task
   field changes without a new Workflow Event.

These choices implement accepted architecture without changing product scope,
the public REST authority, or the approved technical stack. No new DEC is
required.

## In Scope

- Exact `workflow-notification/v1` application-event data Contract and parser.
- `GET /v1/content-packages/:packageId/workflow/stream` under the existing
  cookie Authentication Guard.
- Owner-scoped preflight before the stream is committed.
- Immediate current notification, including the owned no-Instance state.
- One-second non-overlapping observation of the existing public Workflow
  projection.
- Change detection across the complete returned public projection, including
  Task state, attempt, failure, and `updatedAt`.
- Transport-only keepalive every 15 seconds.
- Stream completion on client disconnect, Session expiry, API module shutdown,
  or sanitized post-connect observation failure.
- An explicit bounded `HEAD` handler for the stream path so Fastify's automatic
  GET-derived HEAD does not invoke a long-lived handler. The HEAD method is
  declared before the SSE GET method so pinned Fastify registers it before the
  automatic HEAD exposure for GET.
- Exact OpenAPI media-type and error documentation.
- Web API-client support for the authoritative Workflow projection.
- A reusable framework-independent browser recovery controller with
  credentialed EventSource, coalesced REST refresh, five-second Polling
  fallback, terminal authorization handling, and disposal.
- Unit, real API/PostgreSQL Integration, concurrent-harness regression, and
  real Chromium EventSource evidence.
- Current-truth and repository-status synchronization to `In Review` during
  implementation.

## Out of Scope

- Composing the recovery controller into `WorkspaceClient` or any visible UI.
- Source intake, Source review, Timeline rendering, or user-facing progress
  presentation.
- A notification database table, Redis Pub/Sub/Streams, BullMQ notification
  delivery, WebSocket, or shared in-process subscription hub.
- A replay ledger, `Last-Event-ID` replay, SSE state reconstruction, or treating
  connection-local SSE IDs as cursors.
- Workflow Commands, Events, Task mutation, Retry, Pause, Cancel, or owner
  actions.
- Changes to Source, Fetcher, Worker, Renderer, Object Storage, Research, Agent,
  or M3 behavior.
- Schema, migration, index, dependency, lockfile, runtime-configuration, Secret,
  or process-topology changes.
- Periodic Session credential revalidation or retention of the raw Session
  credential in the stream.
- A new checksum, digest, SHA, or generalized defensive validation mechanism.
- Changes to Accepted Decisions.

## Relevant Decisions

- DEC-135 — important Workflow actions use an append-only Event Log while
  ordinary domain state remains authoritative.
- DEC-176 — important domain changes use a same-transaction Outbox for reliable
  downstream propagation; this Work Item does not create another propagation
  store.
- DEC-199 — private by default, least privilege, and deny by default.
- DEC-200 — server-side Authentication, Authorization, and owner scope remain
  required in the single-user MVP.
- DEC-221 — the TypeScript modular monolith and isolated processes remain one
  system, not new microservices.
- DEC-224 — explicit REST, OpenAPI, and SSE Contracts belong to the NestJS +
  Fastify API boundary.
- DEC-234 — Workspace status uses SSE with Polling fallback; read APIs remain
  authoritative and the stream is not a state store.
- DEC-280 — M2 establishes SSE and Source Approval before the first Agent.

## Relevant Documents

- [Canonical Decision Register](../../decisions/decisions.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Technical Architecture](../../architecture/technical-architecture.md)
- [Process Topology](../../architecture/process-topology.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Authentication Foundation](../../security/authentication-foundation.md)
- [Security Baseline](../../security/security-baseline.md)
- [Data Classification](../../security/data-classification.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Roadmap](../roadmap.md)
- [Work Item Template](../work-item-template.md)
- [M2-WF-004A Work Packet](m2-wf-004a-workflow-projection-timeline-query.md)

## Dependencies and Preconditions

- M2-WF-004A is Completed through PR #108 and merge
  `acdb971ffd8a1c8898666182ac017817f095e1b7`.
- Its authoritative owner-scoped Workflow projection and Timeline REST routes
  are unchanged and passing.
- `rxjs@7.8.2` is already a direct API dependency through the approved NestJS
  stack; no dependency addition is needed.
- NestJS `11.1.28` supports a Promise of an Observable for SSE, disconnect
  unsubscription, and Observable teardown. Post-header Observable errors must
  be caught by ContentOS before Nest serializes an error message.
- Existing API CORS allows credentialed safe-method requests from the configured
  Web origin.
- No Blocking Design Question remains after the resolutions in this packet.

## Contracts

### Application notification

The only Workflow application event emitted by this stream is:

```text
event: workflow-notification/v1
data: {"workflowInstanceId":"<uuid-or-null>","latestSequence":7}
```

Its exact data value is:

```ts
interface WorkflowNotificationData {
  readonly workflowInstanceId: string | null;
  readonly latestSequence: number;
}
```

Rules:

- `latestSequence` is an integer greater than or equal to zero.
- A non-null `workflowInstanceId` must match the repository UUID form already
  used by Workflow identity values; an arbitrary string is invalid.
- An owned Package without the fixed v1 Workflow Instance emits
  `{ workflowInstanceId: null, latestSequence: 0 }` immediately.
- An owned Package with an Instance emits its current Instance ID and Event
  high-water immediately.
- The JSON data has no additional fields.
- A change to any field in the existing public Workflow projection emits a new
  notification, even when `latestSequence` remains unchanged.
- Notification data never contains a URL, Source/Candidate body, raw Event
  type/payload, Object key, Task/Outbox/Claim/lease ID, owner ID, Secret,
  Header, SQL, database URL, or provider detail.
- The notification is not persisted and cannot reconstruct Workflow state.

### Transport keepalive and connection-local IDs

Every 15 seconds the API emits a transport-only event:

```text
event: keepalive
data: {}
```

The browser controller ignores it. Any ID generated by the pinned NestJS SSE
transport is opaque and connection-local. The server ignores `Last-Event-ID`,
the browser does not use the ID as a cursor, and recovery always uses the
authoritative REST endpoints.

### Stream HTTP semantics

```text
GET /v1/content-packages/:packageId/workflow/stream
Cookie: contentos_session
Accept: text/event-stream
```

- malformed Package UUID → `422 INVALID_REQUEST` before stream commitment;
- absent, invalid, revoked, or expired Session at connection →
  `401 UNAUTHENTICATED`;
- missing and cross-owner Package → indistinguishable
  `404 CONTENT_PACKAGE_NOT_FOUND`;
- owned active or archived Package, with or without Workflow Instance →
  `200 text/event-stream`;
- preflight observation/database failure → sanitized `500` before commitment;
- post-connect observation failure → complete the stream without emitting the
  error, SQL, stack, or internal marker;
- Session expiry, API shutdown, or client disconnect → complete and release all
  owned scheduling/subscriptions;
- the explicit authenticated HEAD route performs the same owner preflight and
  returns bounded success without opening a stream; its controller method must
  be declared before the SSE GET so Fastify does not first create an automatic
  HEAD route, and it is excluded from OpenAPI.

The GET response preserves the pinned Nest SSE private/no-cache/no-store,
no-transform, and no-buffer headers. It has no request body or query parameter.

### Observation lifecycle

- Run one owner-scoped `getProjection()` preflight before returning the stream.
- Emit the initial notification immediately.
- Start observation on a one-second cadence after the initial load.
- Use non-overlapping semantics: if one read is still running, do not start or
  queue another read.
- Build the equality-only marker from a deterministic serialization of the
  returned public projection. The marker exists only in API process memory.
- Do not emit when the marker is unchanged.
- Catch every post-connect error and complete safely before it can reach Nest's
  default post-header SSE error serialization.
- Stop at Session expiry and module shutdown. The stream service implements
  `onModuleDestroy` and signals completion there, before Nest disposes the HTTP
  adapter; `onApplicationShutdown` is not used for this responsibility.
- Session-expiry scheduling must support the configured 30-day maximum without
  passing a delay greater than Node's `2_147_483_647ms` timer limit. Long
  deadlines are scheduled in bounded chunks and re-evaluate remaining time
  until expiry.
- Client disconnect/unsubscribe drops any late read result and prevents future
  notification writes.

### Browser recovery controller

The Web application receives one reusable module with a deep subscription
boundary. Exact internal class/function naming may follow repository style, but
the public listener value and behavior are fixed:

```ts
type WorkflowRecoveryNotice =
  | {
      readonly kind: 'projection';
      readonly response: WorkflowProjectionResponse;
    }
  | {
      readonly kind: 'terminal';
      readonly status: 401;
      readonly code: 'UNAUTHENTICATED';
    }
  | {
      readonly kind: 'terminal';
      readonly status: 404;
      readonly code: 'CONTENT_PACKAGE_NOT_FOUND';
    }
  | {
      readonly kind: 'terminal';
      readonly status: 422;
      readonly code: 'INVALID_REQUEST';
    };

subscribe(
  contentPackageId: string,
  listener: (notice: WorkflowRecoveryNotice) => void,
): () => void
```

- Perform one authoritative Workflow projection REST read before opening SSE.
  On success, publish the projection notice before opening EventSource.
- If the initial REST read returns `401`, `404`, or `422`, publish the exact
  terminal notice and stop without opening EventSource.
- If the initial REST read fails because of network transport or a server `5xx`,
  do not open EventSource; enter the first Poll after five seconds.
- Open the stream using `new EventSource(url, { withCredentials: true })`.
- Parse only the exact `workflow-notification/v1` data Contract.
- On each valid notification, schedule one full authoritative projection
  refresh. Coalesce multiple notifications so at most one read is in flight and
  at most one pending rerun remains.
- A successful notification-triggered refresh publishes the projection notice.
  Its `401`, `404`, or `422` response publishes the exact terminal notice and
  stops. A network or `5xx` failure closes EventSource and enters the first Poll
  after five seconds.
- Never use notification fields as the Workflow state.
- On the first EventSource error or malformed notification, close EventSource,
  disable native automatic reconnect for that subscription, and start Polling
  after exactly five seconds.
- Poll every five seconds, scheduling the next read only after the prior one
  settles so requests never overlap.
- A successful Poll refresh publishes the authoritative projection. A network
  or server `5xx` failure keeps recovery active and schedules the next Poll only
  after the failed request settles, without exposing raw error details.
- Polling REST `401`, `404`, or `422` publishes the exact terminal notice and
  stops the subscription.
- Disposal closes EventSource, clears Polling, and suppresses callbacks from
  late REST responses.
- The current `WorkspaceClient` does not instantiate this controller in this
  Work Item.

Timeline remains an independent authoritative M2-WF-004A read. Later Web work
may page it by its `after` cursor when rendering history; the notification and
recovery controller do not duplicate or infer Timeline items.

## Error and Security Boundary

- Authentication and owner Authorization run before private stream commitment.
- Active and archived owned Packages preserve the M2-WF-004A read semantics.
- Only the existing public Workflow projection influences change detection.
- The in-memory marker is not logged, returned, persisted, placed in a Queue, or
  exposed to the browser.
- No raw exception may enter a post-header SSE event. The safe failure behavior
  is stream completion followed by browser REST recovery.
- The stream owns no dedicated PostgreSQL client and adds no new Secret.
- EventSource sends only the existing HttpOnly Session cookie through the
  browser credential boundary.
- The browser module stores no credential and does not inspect the cookie.
- Tests use distinctive private markers to prove the SSE body, API logs, errors,
  and documentation do not expose private fields.
- Apply proportional validation: exact external Contract parsing and lifecycle
  cleanup are required; repetitive impossible internal cases and generic hash
  mechanisms are not.

## File Boundary

Implementation may modify only these product/test paths when required:

- `packages/contracts/src/api/workflow-notification-contracts.ts`
- `packages/contracts/src/api/workflow-notification-contracts.test.ts`
- `packages/contracts/src/index.ts`
- `apps/api/src/workflow/workflow-notification-stream.ts`
- `apps/api/src/workflow/workflow-notification-stream.test.ts`
- `apps/api/src/workflow/workflow.controller.ts`
- `apps/api/src/app.module.ts`
- `apps/web/lib/api-client.ts`
- `apps/web/lib/api-client.test.ts`
- `apps/web/lib/workflow-recovery.ts`
- `apps/web/lib/workflow-recovery.test.ts`
- `packages/testing/src/integration/workflow-notification-api.test.ts`
- `packages/testing/src/integration/api.test.ts`
- `packages/testing/src/browser/workflow-sse-recovery.spec.ts`

Documentation may modify only:

- `docs/architecture/workflow-overview.md`
- `docs/architecture/process-topology.md`
- `docs/architecture/repository-structure.md`
- `docs/security/authentication-foundation.md`
- `docs/quality/integration-smoke-harness.md`
- `docs/quality/browser-thin-slice.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-packets/m2-wf-004b-sse-notification-polling-recovery.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

Explicitly prohibited without a correction packet or new Decision Review:

- `apps/web/components/**` or other visible UI;
- `packages/core/**` and `packages/database/**`;
- Schema, migrations, Drizzle metadata, dependencies, manifests, lockfile,
  configuration, Compose, and CI;
- Worker, Fetcher, Renderer, Object Storage, Queue, or write repositories;
- Accepted Decisions and Session files.

## Acceptance Criteria

1. The exact credentialed GET stream returns the immediate current notification
   for active, archived, and no-Instance owned Packages; malformed,
   unauthenticated, missing, and cross-owner requests follow the fixed pre-header
   errors.
2. The application payload contains exactly `workflowInstanceId` and
   `latestSequence`; strict Contract tests reject malformed non-null UUIDs,
   wrong types, invalid sequence, or additional fields.
3. One-second observation is non-overlapping and emits only when the complete
   public projection changes. Event-backed and Task-only changes are both
   demonstrated, including same-sequence Task notification.
4. Keepalive is emitted every 15 seconds, is transport-only, and is ignored by
   the browser recovery controller.
5. Client disconnect, Session expiry, API shutdown, and post-connect failure
   terminate cleanly; post-header errors expose no private/internal text and no
   timer, query result, stream, or process residue remains. The shutdown signal
   runs in `onModuleDestroy`, and chunked expiry scheduling covers the configured
   30-day maximum without timer overflow.
6. The explicit HEAD request is bounded and does not open the long-lived GET
   stream; route-discovery evidence proves HEAD is registered before SSE GET.
7. OpenAPI documents exact GET path, cookie auth, `text/event-stream` success,
   JSON errors, and no body/query; the private transport keepalive does not
   become Workflow state.
8. The browser controller performs initial authoritative REST refresh, opens a
   credentialed EventSource, coalesces notification refresh, enters its first
   non-overlapping Poll at five seconds after failure, stops on terminal
   `401/404/422`, defines every initial/notification/Poll failure transition,
   and disposes all owned resources.
9. Real API/PostgreSQL and Chromium evidence proves owner scope, CORS/cookie
   delivery, exact notification parsing, read-only behavior, failure redaction,
   disconnect cleanup, and no impact on existing Workflow/Source behavior.
10. No visible Workspace behavior, Workflow write, Schema/migration, dependency,
    Queue, Redis, Agent, Research, new hash mechanism, or out-of-scope file is
    added; documentation states that production UI composition remains later.

## Tests

### Contract and unit

- Exact positive and negative notification data parser/schema tests, including
  repository UUID validation for non-null `workflowInstanceId`.
- Initial active/archived/no-Instance notification mapping.
- Projection marker equality, Event change, Task-only same-sequence change, and
  unchanged-state suppression.
- Fake-time one-second cadence, 15-second keepalive, non-overlap, expiry,
  `onModuleDestroy` shutdown, disconnect/finalize, late-result suppression, and
  sanitized error completion. Expiry evidence includes the configured 30-day
  maximum and the Node maximum-timer boundary.
- Browser controller initial REST read, credentialed EventSource options,
  exact notification parsing, exact projection/terminal listener values,
  coalesced single-flight refresh, every initial/notification/Poll REST failure
  transition, malformed/error fallback, first five-second Poll boundary,
  repeated non-overlapping Polling, terminal `401/404/422`, and disposal.

### Integration

- Real API, Session, PostgreSQL, owner/cross-owner/archive/no-Instance fixtures.
- Immediate and changed SSE frames through a real HTTP stream reader.
- Event-backed and Task-only projection changes with same high-water evidence.
- Exact SSE/cache/no-buffer/CORS headers and pre-header errors.
- Explicit bounded HEAD behavior, HEAD-before-GET route discovery, and exact
  OpenAPI content types.
- State snapshots before/after reads prove zero writes.
- Abort every reader in `finally`; verify no post-abort observation continues.
- API log/redaction checks use seeded private markers without printing them in
  the completion report.

### Browser and regression

- Real Chromium native EventSource with the HttpOnly Session cookie and
  configured cross-origin API boundary.
- Exact application event receipt and connection disposal without a test-only
  product route or visible UI composition.
- Existing M1 browser owner loop remains passing.
- Full unit, Integration, concurrent Integration, and browser commands pass
  with owned cleanup.

## Required Commands

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm test:integration:concurrent`
- `corepack pnpm test:browser`
- `corepack pnpm db:generate` twice; both must report no Schema change
- `git diff --check`
- allowed-file, dependency/lockfile, Secret/local-path, generated-artifact,
  process/container, open-stream, timer, and temporary-resource checks

No check may be skipped or converted to a pass. An external runner or sandbox
failure must be reported separately and rerun in an allowed environment.

## Migration, Dependency, and Compatibility Review

- Schema and migration: none expected or allowed.
- Dependency and lockfile: none expected or allowed.
- Existing REST projection/Timeline responses and errors remain unchanged.
- The new GET route is additive. The browser controller is not composed into
  the current UI, so existing Web behavior remains unchanged.
- Rollback removes the stream route/module, Contract, Web recovery module,
  tests, and documentation; no persisted data rollback is required.

## Observability

No success log, Event, metric, or persistent notification is required. Existing
request/error handling remains in force before stream commitment. A
post-connect observation failure completes the stream without serializing the
exception. If a fixed diagnostic is needed during implementation, it may record
only a stable non-private code and must not include the projection marker,
Package/Instance identity, SQL, stack, or original error.

## Documentation Updates

- Workflow Overview: notification-only SSE and REST-authority boundary.
- Process Topology: API process-local observation and browser recovery path.
- Repository Structure: Contract, API stream module, and Web recovery ownership.
- Authentication Foundation: connection-time auth, owner scope, Session-expiry
  completion, and browser disposal boundary.
- Integration/Browser harness docs: exact new evidence and cleanup ownership.
- Roadmap, `AGENTS.md`, and English/Chinese README: mark M2-WF-004B accurately
  as In Review during implementation; do not claim visible Workspace use.
- This Work Packet: planning, Ready review, implementation, review, CI, and
  completion evidence.
- Canonical Decision Register: unchanged.

## Git and Collaboration Authority

- Planning and implementation use separate branches from the latest
  `origin/main`.
- Exactly one Implementation Agent owns repository writes.
- The Implementation Agent may commit, push, and create a draft PR only after
  all required checks pass; it cannot approve or merge its own code.
- Independent Sol XHigh Review Agents inspect correctness/state consistency,
  API/auth/security, and test/failure/governance axes.
- The primary `ORCHESTRATOR_REVIEWER` resolves findings, requires CI green, and
  may squash merge under the approved bounded autonomous governance.
- Authentication/authorization expansion, raw-stream replacement, visible UI
  scope, Schema/migration, dependency, accepted-contract reduction, or lowered
  acceptance requires escalation before implementation.

## Definition of Ready Checklist

- Goal, exclusions, application data, transport keepalive, REST authority,
  observation marker, auth/owner semantics, chunked expiry deadline, shutdown
  hook, HEAD registration order, exact listener/failure transitions, browser
  recovery, files, tests, cleanup, and documentation targets are fixed.
- M2-WF-004A is Completed on the exact planning base.
- Existing query, API, Web client, Integration, and browser fixtures can provide
  the required evidence without a new dependency or Schema.
- The current Workspace remains unchanged; production UI composition is
  explicitly deferred.
- No Blocking Design Question remains.

Implementation may start only after an independent Definition-of-Ready review
records `PASS`, this packet is marked `Ready`, and its planning Pull Request is
merged.

## Definition of Done

Implementation, exact notification parsing, owner authorization, observation,
keepalive, lifecycle cleanup, browser recovery, errors, OpenAPI, Integration
and Chromium evidence, documentation, and every Acceptance Criterion are
complete. The diff contains only allowed files, no required test is skipped or
misreported, no Secret/private marker or runtime artifact remains, independent
split-axis review passes, required CI is green, and the change is reviewable and
reversible as one Pull Request.

## Independent Definition-of-Ready Review

**Verdict:** PASS after Review Correction Round 1

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: XHigh
- Actual Model / Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/wf004b_ready_review`
- Reviewed Base: `adcde58d4567db8eb91d874f5344c868ea4babc6`
- Blocking Design Question: None
- Possible new DEC: None

### Review correction round 1

The first independent review identified three readiness gaps. This correction
fixes the browser listener as a discriminated projection/terminal Contract and
defines initial, notification-triggered, and Polling REST failure transitions;
requires `onModuleDestroy`, HEAD-before-GET discovery, and chunked Session-expiry
deadlines that support the configured 30-day maximum; and makes the non-null
Workflow Instance repository UUID validation explicit. No implementation scope,
dependency, Schema, security mechanism, or Decision changed.

The independent re-review confirmed that the discriminated listener Contract,
all REST failure transitions, Nest/Fastify shutdown and route-order lifecycle,
chunked 30-day Session expiry, UUID validation, proportional security, tests,
file boundary, and no-migration/no-dependency boundary are implementation-ready.
