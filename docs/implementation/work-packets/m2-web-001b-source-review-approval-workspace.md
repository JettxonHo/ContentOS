# M2-WEB-001B — Source Review and Approval Workspace

**Status:** In Review

**Issue:** [#120](https://github.com/JettxonHo/ContentOS/issues/120)

**Planning branch:** `codex/m2-web-001b-ready-design`

**Planning base:** `21c17993f16892413234da487b09084a5a744a8f`

**Target implementation branch:**
`codex/m2-web-001b-source-review-approval-workspace`

## Identification

- Work Item: `M2-WEB-001B`
- Title: Source Review and Approval Workspace
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `FRONTEND_VISUAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, High/XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Reasoning: High/XHigh requested
- Thread: assigned by the Orchestrator after this packet is Ready
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the
  runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, High/XHigh Review Agents
- Dependencies: `M2-WEB-001A`, `M2-WF-004B`, and `M2-SRC-004` are Completed
- Risk Classification: private owner content, revision-controlled editing,
  exact-Version human Approval, user-visible recovery, accessibility
- Blocking Design Question: None

This is one active-Workspace thin slice. It composes accepted Source and
Workflow APIs; it does not create Research readiness, a new Workflow command,
or an archived-Source policy.

## Goal

Let the authenticated owner select a formal Source in an active Content Package,
review and explicitly save its plain-text Working Copy, create and inspect an
immutable Version, approve the exact current Review Candidate through an
explicit human confirmation, and see the bounded safe Workflow Timeline recover
through the existing SSE-notification and Polling path.

The UI must preserve the distinction among mutable Working Copy, Latest Version,
Review Candidate, and current Approved Version. It must never present a mutable
draft, successful capture, or historical non-candidate Version as approved.

## Canonical sources

- [Canonical Decision Register](../../decisions/decisions.md)
- [MVP Scope](../../product/mvp-scope.md)
- [Domain Overview](../../architecture/domain-overview.md)
- [Artifact Versioning](../../architecture/artifact-versioning.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Technical Architecture](../../architecture/technical-architecture.md)
- [Process Topology](../../architecture/process-topology.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Data Classification](../../security/data-classification.md)
- [Security Baseline](../../security/security-baseline.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [Roadmap](../roadmap.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-WEB-001A Work Packet](m2-web-001a-source-intake-workspace.md)
- [M2-WF-004B Work Packet](m2-wf-004b-sse-notification-polling-recovery.md)
- [Issue #120](https://github.com/JettxonHo/ContentOS/issues/120)
- [AGENTS.md](../../../AGENTS.md)

Later Accepted DEC governs an actual conflict. This packet cannot modify an
Accepted DEC or broaden the accepted Source, Workflow, security, or MVP scope.

## Relevant decisions

- DEC-059–DEC-063 separate Source Reference, Raw Snapshot, normalized review
  content, immutable Version, and exact Approved Research input.
- DEC-066 keeps human Paste/Upload fallback visible after URL failure; this
  Work Item does not add Retry or removal.
- DEC-161, DEC-163, DEC-165, and DEC-167 keep Working Copy revision, immutable
  Version identity, four Head meanings, and append-only Approval distinct.
- DEC-169 keeps structured Source bodies in PostgreSQL and raw evidence in
  Object Storage; the browser does not fetch raw objects.
- DEC-171–DEC-173 separate public DTOs from persistence, distinguish Query,
  Working Copy edit, Version creation, and Approval commands, and require
  visible optimistic-concurrency conflicts.
- DEC-175 keeps stable errors, API versioning, Schema versioning, cursor
  conventions, and UTC timestamps.
- DEC-199 requires private-by-default owner scope and least privilege.
- DEC-207 requires Raw Source evidence and safe review content to remain
  separate; the UI renders normalized content only as text.
- DEC-226 keeps PostgreSQL authoritative; browser memory and SSE are not truth.
- DEC-234 keeps REST as the authoritative read path with SSE plus Polling
  recovery.
- DEC-245 makes exact Approval eligibility and revision rules deterministic.
- DEC-247 requires proportionate Contract, integration, concurrency, and
  browser evidence.
- DEC-259 makes unauthorized access, Approval bypass, owner crossover, and
  historical Version overwrite blocking defects.
- DEC-268 keeps the Source input boundary fixed to Public URL, Pasted Text,
  `.md`, and `.txt`.
- DEC-271–DEC-272 make human Approval and Working Copy/Version/Approval
  semantics part of the MVP core.
- DEC-273 keeps the desktop-first Package Workspace as the user-facing surface.
- DEC-280 requires Source Approval, Workflow Timeline, and recovery before the
  first Agent.
- DEC-287–DEC-293 require a bounded Ready Work Item, independent review,
  recoverability, and honest milestone status.

## Current truth

The repository already provides:

- the active Package Workspace and `M2-WEB-001A` Source intake surface;
- authenticated, owner-scoped Source detail, Working Copy read/edit, Version
  create/list/detail, and exact Review Candidate Approval routes;
- Working Copy revision and persisted checkpoint state, sequential immutable
  Versions, separated Head pointers, deterministic validation, and append-only
  Approval in PostgreSQL;
- owner-scoped Workflow projection, bounded Timeline REST reads, notification-
  only SSE, and the reusable five-second Polling recovery controller;
- Contract, repository, API integration, concurrency, migration, and OpenAPI
  coverage for the existing Source lifecycle; and
- an isolated Playwright browser harness with the active Source intake flow.

Source Approval currently updates the Source Approval record and approved Head;
it does not complete the Workflow `source_review` Node or append a Workflow
Timeline Event. This Work Item must preserve and state that boundary.

The in-review Web implementation now wraps the Source review/version/approval
routes and the Timeline route. Its additive Working Copy response exposes the
already persisted `checkpointedRevision`, so a refreshed browser can distinguish
an eligible revision from one already checkpointed. There is still no public
Approval-history read; `approvedVersionId` truthfully identifies only the current
approved Head.

## Design decisions fixed by this Work Item

### 1. Editing is explicit save, not autosave

The editor uses one explicit **Save Working Copy** command with the loaded
`expectedRevision`. Normal typing changes only browser draft state. A successful
save replaces the authoritative body/revision and clears dirty state. A `409
SOURCE_REVISION_CONFLICT` preserves the local draft, reports the conflict, and
requires an explicit **Reload authoritative copy** action before any overwrite.

This does not decide the autosave behavior of later Artifact editors.

### 2. Version eligibility uses existing checkpoint state

Add only this field to `SourceWorkingCopyResource` and its exact response Schema:

```ts
readonly checkpointedRevision: number | null;
```

Both GET and PATCH Working Copy responses map the existing Core/persistence
value. The browser enables **Create Version** only when:

```text
draft is clean
AND workingCopy.revision !== workingCopy.checkpointedRevision
AND no command is in flight
```

No database, Domain, hash, or Version semantics change. `baseVersionId` remains
internal because this UI does not need it.

### 3. Exact immutable review and current Head labels

The Source detail, Version list, and exact Version detail remain separate reads.
The review surface presents:

- mutable Working Copy revision and saved/unsaved state;
- immutable Version number, creation time, and plain-text body;
- separate **Latest**, **Review candidate**, and **Current approved** badges from
  the Source Head; and
- current checkpoint eligibility.

The UI does not claim historical Approval status because no Approval-history
query exists. It does not show content hashes, raw object keys, raw Snapshot
bodies, or validation success before the authoritative Approval succeeds.

### 4. Approval is an explicit two-step human action

Only the selected exact Version whose ID equals `reviewCandidateVersionId` may
show an enabled **Approve Version N** action. The action first opens an
accessible confirmation dialog naming the exact immutable Version number and
that it will become eligible for future Research. Only the confirmation button
sends the Approval command.

Successful Approval refreshes Source Head and Version presentation and reports
the exact Version number. `SOURCE_VERSION_NOT_ELIGIBLE` or
`SOURCE_ALREADY_APPROVED` triggers an authoritative refresh and safe conflict
copy; it never redirects Approval to another Version.

### 5. Unsaved drafts do not disappear silently

While the selected Source draft differs from its last loaded or saved body:

- other Source review buttons and Package section navigation are disabled with
  explanatory text;
- **Discard draft** explicitly restores the last authoritative body;
- closing the review surface requires the same explicit discard; and
- a `beforeunload` warning is active only while dirty.

Background Workflow recovery may refresh Source collection, URL intake, and
Timeline state, but it must not replace a dirty review draft.

### 6. Timeline is a safe REST projection; SSE only schedules refresh

Add a typed Web client method for:

```text
GET /v1/content-packages/:packageId/workflow/events?after=<sequence>&limit=20
```

The active Sources Workspace shows an independent Workflow Timeline panel. It
maps only the existing safe event union to fixed user-facing labels and times.
It never displays event payloads, URLs, Candidate bodies, Object keys, Claims,
Secrets, Headers, SQL, or raw errors.

Initial load starts at `after=0`. **Load more activity** follows `nextAfter`.
Each existing recovery projection compares its authoritative `latestSequence`
with the highest loaded Timeline sequence. Only a greater sequence (or an
explicit retry while stale) requests one coalesced page after the loaded maximum;
unchanged five-second Poll results do not create redundant Timeline requests.
Items deduplicate by sequence. When `latestSequence` is higher than the loaded
maximum, the panel visibly indicates more authoritative activity is available.
Timeline failure is isolated from Source intake/review failure and retains the
last confirmed items as stale until an explicit or recovery-driven retry
succeeds.

No second SSE connection or client-side Workflow truth is created.

## In scope

1. Add `checkpointedRevision` to the existing Working Copy response Contract,
   exact JSON Schema, controller mappings, and Contract/API integration tests.
2. Add typed Web API client methods for Source detail, Working Copy GET/PATCH,
   Version POST/list/detail, Approval POST, and Workflow Timeline GET.
3. Add a review action to each active formal Source card and compose one selected
   Source review surface inside the existing Sources Workspace.
4. Render the normalized Working Copy as an editable plain-text textarea and an
   immutable Version body as plain text only.
5. Implement explicit revision-controlled save, conflict preservation, explicit
   discard/reload, and dirty-navigation protection.
6. Implement checkpoint-aware Version creation, immutable Version history/detail,
   and distinct Latest/Review Candidate/Current Approved badges.
7. Implement the explicit exact-Version human Approval confirmation and safe
   refresh/error behavior.
8. Compose the bounded Workflow Timeline with independent loading/stale/error
   state, sequence deduplication, and load-more behavior.
9. Reuse the single existing `WorkflowRecoveryController` subscription to
   schedule Source-intake and Timeline authoritative REST refreshes without
   overwriting dirty review state.
10. Add proportionate unit, Contract, API integration, browser, accessibility,
    revision-conflict, owner-scope, Approval, refresh, and SSE-disconnect/Polling
    evidence.
11. Synchronize Current-truth, repository entry, quality, and roadmap documents;
    keep the Work Item `In Review` until merged and keep M2 `In Progress`.

## Out of scope

- autosave, rich text, rendered Markdown, HTML, syntax highlighting, content
  diff/compare, restore, fork, or AI editing;
- Approval-history query or historical Approval badges, Warning acknowledgement,
  validation-preview API, or an Approval bypass;
- approving a Working Copy, Latest Version by implication, historical
  non-candidate Version, successful capture, or URL intake record;
- Source delete/remove, replace, retry, preserve-for-later mutation, role/label
  edit, reordering, or Source-to-fallback linkage;
- Raw Snapshot body, raw HTML, extracted DOM, signed Object Storage access,
  object key, content hash display, or browser-side public URL fetch;
- changing archived Package Source collection/body/history behavior; archived
  Source commands remain unavailable under the existing server boundary;
- Workflow write commands, Retry/Pause/Cancel, Task mutation, a second Workflow
  store, treating SSE as state, transitioning the `source_review` Node, or
  inventing a Timeline Event for Source Approval;
- Research readiness, Frozen Input, Research execution, any Agent, Render,
  Export, publishing, M3 behavior, or M2 completion;
- database Schema, migration, Drizzle metadata, dependency, lockfile, package
  manifest, configuration, Queue, Worker, Fetcher, Renderer, Object Storage,
  Session, Authentication, or Accepted DEC changes; and
- a new digest/hash mechanism, generalized security framework, speculative
  defensive layer, or unrelated refactor.

## Allowed files

### Work Packet and Current-truth synchronization

- `docs/implementation/work-packets/m2-web-001b-source-review-approval-workspace.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/architecture/source-foundation.md`
- `docs/architecture/workflow-overview.md`
- `docs/architecture/process-topology.md`
- `docs/architecture/repository-structure.md`
- `docs/quality/browser-thin-slice.md`
- `docs/implementation/roadmap.md`

### Existing additive API Contract

- `packages/contracts/src/api/source-contracts.ts`
- `packages/contracts/src/api/source-contracts.test.ts`
- `apps/api/src/source/source.controller.ts`
- `packages/testing/src/integration/source.test.ts`
- `packages/testing/src/integration/api.test.ts`

`api.test.ts` may change only if the additive response field requires exact
OpenAPI evidence not already covered by the Source Contract integration test.

### Web

- `apps/web/lib/api-client.ts`
- `apps/web/lib/api-client.test.ts`
- `apps/web/components/workspace-client.tsx`
- `apps/web/components/source-intake-panel.tsx`
- new `apps/web/components/source-review-panel.tsx`
- new `apps/web/components/workflow-timeline-panel.tsx`
- new `apps/web/lib/source-review-view.ts`
- new `apps/web/lib/source-review-view.test.ts`
- new `apps/web/lib/workflow-timeline-view.ts`
- new `apps/web/lib/workflow-timeline-view.test.ts`
- `apps/web/app/styles.css`

The implementation may combine either new panel/view pair when that makes the
module deeper and the behavior easier to review. It may not create a generic
ownerless `shared`, `utils`, or state framework.

### Browser tests

- new `packages/testing/src/browser/m2-source-review-approval.spec.ts`
- `packages/testing/src/browser/m2-source-intake.spec.ts`
- `packages/testing/src/browser/m1-thin-slice.spec.ts`
- optional new `packages/testing/src/browser/source-review-fixtures.ts`

Existing browser files may change only for assertions or fixtures directly
affected by the new Source review buttons, dirty-state guard, or visible
Timeline composition.

## Prohibited files and modules

- `packages/database/src/schema.ts`, all other database/domain/repository files,
  `migrations/**`, `schemas/**`, and Drizzle metadata;
- `packages/core/**` and unrelated Contract/API controllers;
- package manifests, `pnpm-lock.yaml`, workspace configuration, Compose,
  `.env*`, and runtime configuration;
- `apps/web/lib/workflow-recovery.ts` and its tests;
- `apps/worker/**`, `apps/fetcher/**`, and `apps/renderer/**`;
- Queue, Gateway, transport/extraction, Object Storage, Research, Agent, Render,
  Export, Session, and Authentication modules;
- Decision Register, Accepted Decision files, and Session files; and
- any file not listed under Allowed files.

If a necessary change falls outside the allowlist, stop and return it to the
Orchestrator. Do not silently broaden the packet.

## Contracts

### Working Copy response

The existing `SourceWorkingCopyResource` is additively extended with exactly:

```ts
readonly checkpointedRevision: number | null;
```

The exact JSON Schema requires the field and allows an integer `>= 1` or null.
GET and PATCH responses both include it. No request, error, Source body, Schema
version, or persistence Contract changes.

### Web Source review client

The Web client wraps the existing protected routes and uses the existing DTOs:

```text
GET    /v1/content-packages/:packageId/sources/:sourceId
GET    /v1/content-packages/:packageId/sources/:sourceId/working-copy
PATCH  /v1/content-packages/:packageId/sources/:sourceId/working-copy
POST   /v1/content-packages/:packageId/sources/:sourceId/versions
GET    /v1/content-packages/:packageId/sources/:sourceId/versions
GET    /v1/content-packages/:packageId/sources/:sourceId/versions/:versionId
POST   /v1/content-packages/:packageId/sources/:sourceId/approval
```

Every path segment uses `encodeURIComponent`; JSON requests use the existing
client request boundary and credentials. No raw API error body is surfaced.

### Timeline client and presentation

The client returns the existing `WorkflowTimelinePageResponse`. Presentation
uses an exhaustive mapping of the existing event union:

- `url_capture_requested.v1` → URL capture requested;
- `fetcher_lease_expired.v1` → URL capture recovery scheduled;
- `url_capture_succeeded.v1` → URL Source captured;
- `url_capture_failed.v1` → safe fixed failure-category copy; and
- `workflow_event.v1` → Workflow updated.

Attempt number may be shown as an ordinary display value. Internal IDs, node
keys, payloads, URLs, claims, object keys, and raw failures are not shown.

### Error behavior

- `401` sends the browser to Login.
- `CONTENT_PACKAGE_NOT_FOUND` enters the existing unavailable Workspace state.
- `SOURCE_NOT_FOUND` closes the selected review, preserves the Package shell,
  refreshes the Source collection, and reports the Source is unavailable.
- `SOURCE_VERSION_NOT_FOUND` clears the selected Version detail, refreshes the
  exact Source/history, and reports the Version is unavailable.
- `SOURCE_REVISION_CONFLICT` preserves the unsaved draft and requires explicit
  reload/discard.
- `SOURCE_VERSION_ALREADY_EXISTS` refreshes checkpoint/Version state and reports
  that this exact revision was already checkpointed.
- `SOURCE_VERSION_NOT_ELIGIBLE` and `SOURCE_ALREADY_APPROVED` refresh exact Head
  state and report that the selected Version is no longer approvable.
- other `409`, `422`, network, and `500` failures use stable private copy and
  retain the last authoritative state where safe.

No UI error includes Source body, URL, raw response, hash, Header, SQL, stack,
Object key, claim, or credential.

## User interaction contract

### Source selection

- Active formal Source cards expose a **Review Source** button.
- One Source is selected at a time.
- Selection loads Source Head, Working Copy, and Version list independently of
  intake loading.
- A Source list refresh keeps the selected Source when it still exists.
- A disappeared Source closes review with safe copy; it does not make the whole
  Package unavailable.

### Working Copy

- The normalized body is shown in a labelled textarea.
- Typing marks the draft unsaved; it does not mutate the server.
- Save sends exactly the loaded revision.
- Successful save updates body, revision, checkpoint state, and timestamps.
- Dirty draft navigation is blocked until Save or explicit Discard.

### Version and Approval

- Create Version is unavailable for a dirty or already checkpointed revision.
- Successful Version creation selects the returned exact Version, reloads Head
  and history, and shows it as Latest and Review Candidate.
- Selecting a history item fetches its exact immutable body before display.
- Approval is enabled only for the exact Review Candidate and requires the
  accessible confirmation dialog.
- Refresh/reopen reconstructs current approved state from `approvedVersionId`;
  it does not invent historical Approval badges.

### Timeline and recovery

- Timeline has separate loading, stale, empty, and safe failure states.
- Events are ordered by ascending sequence and deduplicated by sequence.
- Load more uses only the server `nextAfter` cursor.
- Recovery notifications trigger authoritative REST refresh; they do not carry
  Timeline state.
- SSE disconnect falls back through the existing five-second Polling controller.
- A Timeline failure does not block Source edit/version/approval commands.

## Acceptance Criteria

1. An authenticated owner opens an active Package, selects a Pasted, uploaded,
   or successful URL Source, and sees only its normalized plain-text Working
   Copy plus safe capture metadata; no raw object or executable rendering occurs.
2. Editing changes only local draft state until explicit Save. Save uses the
   exact loaded revision; success advances the revision, while a concurrent
   edit conflict preserves the local draft and does not overwrite PostgreSQL.
3. GET/PATCH Working Copy responses contain exact persisted
   `checkpointedRevision`; Contract, OpenAPI/API integration, and Web behavior
   distinguish an eligible revision from an already checkpointed revision.
4. A clean eligible Working Copy creates one immutable Version. The refreshed
   browser shows exact Version number/body and separate Latest, Review Candidate,
   and Current Approved meanings. Duplicate clicks do not create an extra
   Version or misreport success.
5. Version history survives refresh and lets the owner select exact immutable
   bodies. Historical Version bodies are never edited, overwritten, or presented
   as the mutable Working Copy.
6. Only the exact current Review Candidate can enter the confirmation dialog and
   be approved. Approval succeeds only after explicit confirmation, survives
   refresh through the current approved Head, and never approves a stale,
   historical, mutable, or merely captured value.
7. Approval/revision conflicts, `401`, Package `404`, Source `404`, Version `404`,
   validation failures, and network failures follow the fixed safe behaviors
   without private-content leakage or unintended side effects.
8. Dirty drafts are not silently lost on Source change, section change, close,
   recovery refresh, or browser unload. Explicit Discard restores the last
   authoritative Working Copy.
9. The visible Timeline uses the existing safe REST Contract, bounded cursor
   loading, stable event labels, ascending deduplicated sequences, and independent
   stale/error state. It displays no private or internal payload fields.
10. URL capture activity becomes visible after authoritative refresh. When SSE
    disconnects, the existing five-second Polling path causes the same Timeline
    and Source-status recovery without making browser state authoritative.
11. Owner scope remains server enforced; another owner cannot read/edit/version/
    approve the Source or read its Workflow Timeline. Archived Packages expose
    no new Source review command or body/history access.
12. Existing M1 owner loop, M2 Source intake, URL Fetcher/Result, Source API,
    Workflow query/SSE, integration concurrency, and browser scenarios remain
    green. No dependency, Schema, migration, Queue, Worker, Fetcher, Renderer,
    Research, Agent, or M3 behavior changes.
13. Current-truth and English/Chinese repository status describe the exact
    available review/Version/Approval/Timeline UI while M2 remains `In Progress`.

## Required tests

### Unit and Contract

- exact `checkpointedRevision` DTO/Schema sync for GET/PATCH responses;
- Web client path encoding, method, body, and Timeline query tests;
- pure create-Version eligibility and distinct Head-badge derivation;
- Timeline safe-label exhaustiveness, ordering, cursor append, sequence
  deduplication, stale retention, and failure isolation;
- dirty-state guard, explicit discard, and conflict-state derivation where kept
  outside the React component.

### API integration

- GET and PATCH Working Copy return exact persisted checkpoint state before
  Version creation, after Version creation, and after a later edit;
- existing active/archived, owner-scope, revision conflict, immutable Version,
  Approval eligibility, rollback, and OpenAPI tests remain green;
- no new endpoint, table, migration, or approval-history behavior is claimed.

### Browser

At minimum, real Chromium proves:

1. Paste Source → open review → edit → explicit save → create Version → inspect
   exact immutable body → confirm Approval → refresh → current approved state.
2. A second authoritative Working Copy edit creates a revision conflict; the
   browser preserves the local draft until explicit reload/discard.
3. Two Versions remain selectable as immutable history while Head badges stay
   distinct; an already checkpointed revision cannot create another Version.
4. A successful URL capture Source opens the same normalized review path; no raw
   HTML or URL body is rendered as trusted DOM.
5. Timeline shows safe URL-capture activity and load-more/recovery behavior.
6. Forced SSE disconnect uses the existing five-second Polling path to recover
   newer authoritative Timeline/Source state.
7. Approval cancel performs no command; stale candidate/duplicate interaction
   does not create an extra Approval or display false success.
8. `401`, Package-unavailable, Source-unavailable, dirty navigation, keyboard
   focus, accessible dialog, error alert, and status announcement behavior.
9. Existing M1 and M2 Source-intake browser scenarios remain green.

### Repository and full gates

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm test:integration:concurrent`
- `corepack pnpm test:browser`
- `corepack pnpm db:generate` twice, both with no Schema change
- `git diff --check`
- exact allowlist, dependency/lockfile, Secret/local-path, generated-artifact,
  runtime-residue, and changed-file checks

If the process-identity test alone receives sandbox `EPERM`, rerun the exact
required command in the already authorized normal process environment and record
both results. Do not classify the sandbox failure as a product defect or claim a
pass without the successful rerun.

## Security review

- Source bodies are private untrusted content. Render Working Copy and Version
  body through React text/textarea behavior only; no `dangerouslySetInnerHTML`,
  Markdown renderer, remote resource, or browser public fetch.
- Authentication and owner scope remain server-side. Opaque Source/Version IDs
  never substitute for authorization.
- Human Approval remains a deliberate UI confirmation over one exact immutable
  Review Candidate. UI disablement is not the security boundary; the API remains
  authoritative.
- Do not log or expose Source body, URL, raw Snapshot, hash, validation summary,
  object key, claim, Secret, Header, SQL, stack, or raw server error.
- No new credential, network destination, provider, Object Storage access,
  upload boundary, or execution authority is introduced.
- No new hash or generalized defensive mechanism is permitted.

## Migration and compatibility review

- Database Schema and migration: none.
- Core Domain and persistence semantics: none.
- Public API: one additive required response field on the existing Working Copy
  resource. Existing request paths and errors remain unchanged.
- Queue/Event/Workflow contract: none.
- Configuration and dependencies: none.
- Compatibility sequence: API and Web ship in the same modular-monolith PR.
  Older internal consumers ignore the additive response field.
- Rollback: revert the one Work Item. No data rollback or backfill exists.

## Observability

Use the existing process/API logging and stable Web copy. This UI-only
composition adds no new logs, Metrics, Trace, Audit Event, or telemetry payload.
Command success/failure is visible to the owner in the current page; sensitive
body and infrastructure details remain absent.

## Documentation updates

When implementation is complete, synchronize only accepted behavior in:

- `AGENTS.md`;
- `README.md` and `README.zh-CN.md`;
- Source Foundation;
- Workflow Overview and Process Topology;
- Repository Structure;
- Browser Thin Slice;
- Roadmap; and
- this Work Packet, set to `In Review` before independent implementation review.

Do not mark M2 Completed. Do not start M2-QUAL-001, M2-GOV-005, or M3.

## Implementation plan

1. Extend the Working Copy response Contract and first add failing
   Contract/API integration evidence for checkpoint state.
2. Add typed Web client methods with failing unit tests for exact paths and
   payloads.
3. Add pure Source review and Timeline view logic with focused tests.
4. Compose Source selection, editor, dirty guard, Version history, and exact
   Approval dialog into the active Workspace.
5. Compose the independent Timeline panel into the existing single recovery
   subscription.
6. Add browser scenarios for the complete human loop, concurrency conflict,
   URL Candidate review, Timeline, and disconnect recovery.
7. Synchronize Current-truth and run all required gates.

The Implementation Agent may adjust internal component factoring inside the
allowlist, but not the public behavior, error contract, Source lifecycle, or
security boundary.

## In-review correction evidence

- Recovery draft adoption is baseline-aware: a clean refresh adopts new
  authoritative text only while the owner draft still equals the authoritative
  text captured at request start. Dirty-at-start drafts and typing that begins
  during the request are preserved. Focused Source/Timeline view tests cover
  this behavior, session fencing, and Timeline stale retention with successful
  retry.
- Source review commands synchronously defer and coalesce notification-driven
  recovery. The last handled refresh signal prevents duplicate reads, deferred
  recovery starts once after the command ends with the then-current draft
  baseline, and every successful Source/Head mutation invalidates a late
  recovery load before applying its response. Explicit command-owned reloads
  remain available.
- Real Chromium opens a stale Version 1 Approval confirmation, creates Version 2
  through the authenticated Source API, then confirms Version 1 and observes safe
  conflict copy, no false success, refreshed Head state, and the current Version 2
  Review Candidate action.
- Real Chromium follows a two-page Timeline `nextAfter` cursor through the actual
  **Load more activity** control and proves ascending, deduplicated, safe labels.
  The full browser gate passes 15 of 15 scenarios.
- Primary orchestration evidence records the unchanged Docker integration suite
  passing 26 files / 182 tests and the exact concurrent integration command
  passing on immediate rerun.

## Git and collaboration authority

- Start only from a clean implementation branch based on the merge commit that
  contains this Ready packet.
- One Implementation Agent owns writes.
- The Implementation Agent may commit, push, and open/update a **draft** PR only
  after completing the packet and recording a Completion Report.
- The Implementation Agent may not mark its PR ready, approve it, merge it, or
  mark the Work Item Completed.
- Independent `gpt-5.6-sol` Review Agents inspect the real diff across at least
  correctness/state/architecture/UX and security/API/tests/failure paths.
- The Orchestrator may mark ready and squash merge only after independent PASS,
  all required CI green, and no Human escalation condition.
- After merge, a separate minimal status-sync PR records Completed before the
  next dependent Work Item begins.

## Definition of Ready review

**Verdict:** `PASS`

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: High/XHigh
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/web001a_security_quality_review`
- Reviewed Branch: `codex/m2-web-001b-ready-design`
- Reviewed Base/HEAD: `21c17993f16892413234da487b09084a5a744a8f`
- Issue: `#120`
- Date: `2026-08-07`
- Blocking Design Question: None
- Possible new DEC: None

The independent read-only review confirmed that the thin slice, exact
`checkpointedRevision` response extension, explicit-save and dirty/conflict
behavior, exact Review Candidate Approval, current-approved-only presentation,
active-only boundary, single-controller Timeline recovery, allowlist, browser
fixtures, and proportionate security/tests are complete and feasible without a
database change. It also confirmed that the packet does not claim Approval
transitions `source_review` or appends a Timeline Event.

## Definition of Done

This Work Item is done only when all Acceptance Criteria and required checks
pass; the exact allowlist is respected; no Secret, unrelated edit, runtime
residue, generated artifact, schema/lockfile drift, or capability overclaim
exists; Current-truth is synchronized; independent reviews return `PASS`; all
required GitHub CI is green; and the authorized PR is merged.

## Completion report format

Return the repository [Implementation Completion Report](../templates/implementation-report-template.md), including:

- Summary and design choices;
- exact files changed;
- Contract compatibility and no-migration evidence;
- commands and tests actually run;
- Acceptance Criteria mapping;
- security and privacy impact;
- known limitations and incomplete items;
- documentation updates;
- possible new DEC; and
- exact Git status, branch, base, commit/PR state, and runtime residue.
