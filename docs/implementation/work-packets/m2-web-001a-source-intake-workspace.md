# M2-WEB-001A — Source Intake Workspace

**Status:** Completed

**Issue:** [#116](https://github.com/JettxonHo/ContentOS/issues/116)

**Planning branch:** `codex/m2-web-001a-ready-work-item`

**Planning base:** `fae900f13e985483f189f5c7dae7348948f43265`

**Target implementation branch:**
`codex/m2-web-001a-source-intake-workspace`

## Identification

- Work Item: `M2-WEB-001A`
- Title: Source Intake Workspace
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `FRONTEND_VISUAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Reasoning: XHigh requested
- Thread: assigned by the Orchestrator after this packet is Ready
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the
  runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Dependencies: M2-DES-007 and M2-WF-004B are Completed
- Risk Classification: private owner content, file input, user-visible async
  state, public REST Contract, accessibility, and browser recovery composition
- Blocking Design Question: None after Human approval of M2-DES-007 Option A

The profile reflects the user-visible outcome. This is one thin vertical slice,
so the same writer also implements the bounded Core read port, database
projection, REST Contract, and tests required by the UI. It is not permission
for unrelated backend refactoring.

## Goal

Let the authenticated owner use the existing Content Package Workspace to see
formal Sources, create Pasted Text and `.md`/`.txt` Sources, submit the one fixed
v1 public URL capture, and recover its authoritative progress or safe failure
after refresh or SSE disconnect. A failed URL may guide the owner into an
independent Paste or Upload fallback without being represented as a Source or
silently retried.

## Canonical sources

- [Canonical Decision Register](../../decisions/decisions.md)
- [Product Definition](../../product/product-definition.md)
- [MVP Scope](../../product/mvp-scope.md)
- [Domain Overview](../../architecture/domain-overview.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Technical Architecture](../../architecture/technical-architecture.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Source Fetcher Security Boundary](../../security/source-fetcher.md)
- [Data Classification](../../security/data-classification.md)
- [Security Baseline](../../security/security-baseline.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Roadmap](../roadmap.md)
- [Work Item Template](../work-item-template.md)
- [M2-DES-007 — Durable Owner-visible URL Intake Projection](m2-des-007-durable-url-intake-projection.md)
- [M2-WF-004B — SSE Notification and Polling Recovery](m2-wf-004b-sse-notification-polling-recovery.md)
- [Issue #116](https://github.com/JettxonHo/ContentOS/issues/116)
- [AGENTS.md](../../../AGENTS.md)

Later Accepted DEC governs an actual conflict. This packet cannot modify an
Accepted DEC or broaden the accepted Source, Workflow, security, or MVP scope.

## Relevant decisions

- DEC-059–DEC-060 keep Source Reference, immutable Raw Snapshot, extracted
  content, and Normalized Source Version distinct.
- DEC-061, DEC-062, and later DEC-268 fix the MVP inputs to public URL, Pasted
  Text, `.md`, and `.txt`, with one Primary and zero to five Supporting Sources.
- DEC-063 keeps unapproved Source material out of Research input.
- DEC-066 requires a visible human fallback after URL capture failure without
  automatically bypassing access restrictions.
- DEC-199–DEC-200 require private-by-default data, Authentication,
  Authorization, and server-enforced owner scope.
- DEC-207–DEC-208 separate raw evidence from safe review and apply the existing
  upload allowlist and quarantine boundary.
- DEC-224 fixes NestJS + Fastify REST/OpenAPI and separates API DTOs from
  database and Domain rows.
- DEC-234 keeps REST reads authoritative while SSE uses Polling fallback.
- DEC-273 makes the Package Workspace the core desktop-first interface.
- DEC-280 places Source, Workflow, Queue, recovery, SSE, and Approval
  foundations before the first Agent.
- DEC-287–DEC-292 require bounded, independently reviewable, Ready Work Items
  with explicit contracts and review gates.
- DEC-293 requires refresh and delivery failures not to corrupt authoritative
  state.

## Current truth

The repository already provides:

- one authenticated Package Workspace route, metadata editor, archive flow, and
  existing visual system;
- protected Source commands for Pasted Text and multipart `.md`/`.txt` upload;
- owner-scoped formal Source collection reads for active Packages;
- the idempotent URL capture command and complete Queue-to-Fetcher-to-Result
  runtime;
- one fixed v1 URL capture request per Package Workflow;
- authoritative Workflow projection, Timeline, SSE notification, and reusable
  five-second Polling recovery controller; and
- all persistence facts needed for the accepted URL intake read without a new
  table or migration.

The existing Source collection contains only formal Sources. A pending or
failed URL capture is deliberately not a Source. The generic Workflow
projection omits the submitted URL. M2-DES-007 therefore accepts one bounded
owner-visible URL intake read so the Workspace can reconstruct progress and
failure after refresh.

## In scope

1. Add the provider-neutral Core query port and exact four-state URL intake
   projection accepted by M2-DES-007.
2. Add the exact API DTO and JSON Schema for the zero-or-one URL intake
   collection, reusing the existing safe Workflow failure union and Schema.
3. Add one read-only PostgreSQL adapter over existing Package, request,
   reference, Task, Result, and Source rows; no data mutation or new index.
4. Add authenticated `GET
/v1/content-packages/:packageId/url-capture-requests` beside the existing
   POST route, including exact OpenAPI documentation.
5. Extend the typed Web API client with formal Source list, pasted-text create,
   multipart upload, URL submit, and URL intake list methods.
6. Compose a Source Intake section into the existing `/packages/:id`
   Workspace, preserving Package details and the disabled Research stage.
7. Show formal Source roles, input type, label, created time, and capacity from
   the existing Source list Contract without inventing Approval or review
   status.
8. Provide one inline, accessible URL / Paste text / Upload `.md` or `.txt`
   composer using the existing server Commands and validation boundaries.
9. Show queued, running, failed, and succeeded URL intake state using safe,
   owner-facing language; never expose Queue, lease, attempt, Result, Object
   Storage, or provider details.
10. Compose the existing `WorkflowRecoveryController` while the Sources section
    is active. Each authoritative projection notice coalesces one refresh of
    formal Source and URL intake REST reads. The existing controller remains
    unchanged.
11. Preserve a failed URL intake after an independent Paste/Upload fallback
    Source is created.
12. Add proportionate unit, Contract, database/API Integration, OpenAPI, and
    Chromium tests plus Current-truth/status documentation.

## Out of scope

- Source Working Copy body reads or editing, autosave, or Source revision
  conflicts;
- immutable Source Version create/list/detail/compare/restore;
- Approval, validation summary, exact Approved Version Gate, or Approval status
  presentation;
- URL Candidate body, Raw Snapshot, provenance, diff, history, or Object
  Storage access;
- Workflow Timeline UI;
- URL Retry, Preserve-for-later, Remove/Delete, role/label mutation, or Source
  replacement/linkage semantics;
- treating a queued or failed URL intake as a formal Source;
- opening archived formal Source collection/body reads;
- Research readiness, Frozen Input, Research Agent, other Agent, Render,
  Export, or publishing behavior;
- Source input in the New Package form, Settings, full mobile editing, or a
  Dashboard redesign;
- browser-side URL fetching, raw HTML rendering, signed object URLs, or a
  Source security bypass;
- Schema, migration, backfill, dependency, configuration, Queue, Worker,
  Fetcher, Renderer, Object Storage, Session, or Accepted DEC changes; and
- a new digest, hash, generalized redaction layer, or speculative defensive
  mechanism.

## Allowed files

### Planning and repository guidance

- `docs/implementation/work-packets/m2-web-001a-source-intake-workspace.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/architecture/source-foundation.md`
- `docs/architecture/workflow-overview.md`
- `docs/architecture/repository-structure.md`
- `docs/quality/browser-thin-slice.md`
- `docs/implementation/roadmap.md`

### Core and Contracts

- new `packages/core/src/workflow/url-capture-intake.ts`
- new `packages/core/src/workflow/url-capture-intake.test.ts`
- `packages/core/src/index.ts`
- `packages/contracts/src/api/url-capture-contracts.ts`
- `packages/contracts/src/api/url-capture-contracts.test.ts`
- `packages/contracts/src/api/workflow-query-contracts.ts`

The only allowed change to `workflow-query-contracts.ts` is exporting its
existing exact safe failure Schema for reuse. Its failure union and behavior
must not change.

### Database and API

- new `packages/database/src/url-capture-intake-projection.ts`
- `packages/database/src/runtime.ts`
- `apps/api/src/url-capture/url-capture.controller.ts`
- `apps/api/src/database.service.ts`
- `apps/api/src/runtime.tokens.ts`
- `apps/api/src/app.module.ts`

### Web

- `apps/web/components/workspace-client.tsx`
- new `apps/web/components/source-intake-panel.tsx`
- new `apps/web/lib/source-intake-view.ts`
- new `apps/web/lib/source-intake-view.test.ts`
- `apps/web/lib/api-client.ts`
- `apps/web/lib/api-client.test.ts`
- `apps/web/app/styles.css`

### Integration and browser tests

- new `packages/testing/src/integration/url-capture-intake-api.test.ts`
- `packages/testing/src/integration/api.test.ts`
- new `packages/testing/src/browser/m2-source-intake.spec.ts`
- optional new `packages/testing/src/browser/source-intake-fixtures.ts`
- `packages/testing/src/browser/m1-thin-slice.spec.ts`

`m1-thin-slice.spec.ts` may change only where the old “Sources planned for M2”
assertion or new section navigation makes the existing M1 scenario obsolete.

## Forbidden files and modules

- `packages/database/src/schema.ts`, `migrations/**`, `schemas/**`, and generated
  Drizzle metadata;
- all package manifests, `pnpm-lock.yaml`, workspace configuration, Compose,
  `.env*`, and runtime configuration;
- Source repository/service/controller behavior and existing Source DTO shapes;
- `apps/worker/**`, `apps/fetcher/**`, `apps/renderer/**`;
- Queue, Fetcher transport/extraction, Gateway Claim/Heartbeat/Result, Object
  Storage, Session, Dashboard, and Content Package persistence modules;
- `apps/web/lib/workflow-recovery.ts` and its tests;
- Decision Register, Accepted Decision files, and Session files; and
- any file not listed under Allowed files.

If one necessary change falls outside the allowlist, stop and return it for
Orchestrator review. Do not silently broaden the packet.

## Contracts

### URL intake query port

Core defines one read-only port accepting only the Package and owner scope:

```ts
interface UrlCaptureIntakeQueryScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

interface UrlCaptureIntakeQueryPort {
  list(scope: UrlCaptureIntakeQueryScope): Promise<readonly UrlCaptureIntake[]>;
}
```

The Domain-facing projection uses branded IDs and `Date` values. It is not a
database row or API DTO. A missing/cross-owner Package reuses the existing
`ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND')` mapping; this
Work Item does not add a second not-found error vocabulary.

### Public REST read

```text
GET /v1/content-packages/:packageId/url-capture-requests
Cookie: contentos_session
```

There is no request body, query parameter, `Idempotency-Key`, or Fetcher Secret
Header. The response is:

```ts
interface UrlCaptureIntakeBaseResource {
  readonly id: string;
  readonly role: 'primary' | 'supporting';
  readonly submittedUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type UrlCaptureIntakeResource = UrlCaptureIntakeBaseResource &
  (
    | { readonly status: 'queued' | 'running'; readonly failure: null; readonly sourceId: null }
    | { readonly status: 'failed'; readonly failure: WorkflowFailureResource; readonly sourceId: null }
    | { readonly status: 'succeeded'; readonly failure: null; readonly sourceId: string }
  );

interface UrlCaptureIntakeCollectionResponse {
  readonly data: { readonly items: readonly UrlCaptureIntakeResource[] };
}
```

Every object uses `additionalProperties: false`. The current fixed v1 returns
zero or one item, ordered by request `created_at`, then request ID. No
pagination or future Retry abstraction is introduced.

### State and binding rules

- persisted `queued` maps to `queued`; `leased` maps to owner-facing `running`;
- queued/running requires no terminal Result and returns null failure/source;
- failed requires one exactly bound failed Result, its existing valid
  category/code pair, and null Source;
- succeeded requires one exactly bound succeeded Result and a formal Source
  whose ID, owner, Package, and Source Reference binding match;
- Package with no URL request returns `items: []`;
- an existing request with a missing/inconsistent reference, Task, Result, or
  terminal Source binding fails closed through the sanitized internal-error
  boundary; and
- the read creates no row, Event, object, log payload, or browser-only truth.

### Authorization and HTTP errors

- absent, invalid, revoked, or expired Session → `401 UNAUTHENTICATED`;
- malformed Package UUID → `422 INVALID_REQUEST`;
- missing and cross-owner Package → indistinguishable
  `404 CONTENT_PACKAGE_NOT_FOUND`;
- owned active or archived Package → `200` with zero or one item;
- inconsistent persistence or database failure → sanitized
  `500 INTERNAL_ERROR` with no URL or database detail.

The existing formal Source list remains active-Package-only. This read-only
intake endpoint does not change that behavior.

### Existing Source commands

- Pasted Text uses the exact existing JSON Contract:
  `{ sourceType: 'pasted_text', role, text, label? }`.
- Upload uses the existing multipart route with one `file`, `role`, and optional
  `label`. Browser code passes `FormData` and must not set `Content-Type`; the
  browser provides the multipart boundary.
- URL submit uses the existing request body and one browser-generated
  `crypto.randomUUID()` Idempotency-Key for that explicit submission. The UI
  blocks double-submit and does not automatically retry an ambiguous network
  failure; it refreshes the authoritative URL intake read first.
- Once the authoritative intake collection contains an item in any state, this
  Work Item disables URL submission and never issues another URL-capture POST.
  The submitted URL becomes read-only activity/history; replacement and Retry
  remain out of scope.
- Server validation, revision, role-capacity, quarantine, idempotency, and
  owner rules remain authoritative.

### Web view model and composition

The pure Source intake view model owns only display derivation:

- one Primary slot and zero to five Supporting slots;
- formal capacity plus queued/running URL role reservation for preventing a
  predictable UI conflict; a failed intake consumes no formal slot;
- safe labels for Source input kinds and accepted URL failure categories;
- succeeded URL intake deduplication against its exact formal Source ID; and
- no mutation, fetch, Session, Workflow, or persistence authority.

`WorkspaceClient` retains Package/session/archive ownership and selects one of:

- `Sources` — default for an active Package;
- `Package details` — default for an archived Package; or
- disabled `Research & creation` — visibly unavailable.

Use native labelled buttons with `aria-pressed` rather than a partial ARIA tab
implementation.

### Source intake user states

- Initial load keeps the Package header visible and marks the Sources section
  busy.
- Active empty state shows Primary `0/1`, Supporting `0/5`, and a clear add
  Source action.
- Initial read failure does not render a false empty list and offers an
  authoritative status reload, not a URL-capture Retry.
- Background refresh failure preserves the last rendered state but says it
  cannot confirm the latest Source status.
- Archived Package disables every intake command. It may show URL intake
  history, but it does not call the existing archived-blocked formal Source
  list or claim that list is empty.
- `queued` is “Waiting to capture”; `running` is “Capturing”. The submitted URL
  is escaped plain text, not an anchor or raw HTML.
- `failed` shows bounded copy for the existing safe category. For an active
  Package, Paste/Upload fallback actions are available only through the normal
  role-capacity rules. An archived Package shows historical failure evidence
  without fallback actions. It never offers “continue”, a transport bypass, or
  URL Retry.
- `succeeded` is represented once by the correlated formal `public_url` Source
  card; the URL intake activity card is not duplicated.
- Fallback selects Paste or Upload, focuses the content/file input, and creates
  an independent formal Source. It preselects the failed intake role only when
  that role currently has capacity. An unavailable role is disabled with an
  explanation; another role can be chosen only as an ordinary independent
  Source when it has capacity. The failed URL record remains visible after
  success and refresh.

### Recovery composition

Mount exactly one existing `WorkflowRecoveryController` subscription while the
Sources section is active. An authoritative Workflow projection notice
coalesces one refresh of the formal Source list and URL intake read. Own
successful Source/URL submissions refresh immediately. Dispose the subscription
on section change and unmount. Do not change the recovery controller, render a
Timeline, or treat SSE as state.

## Implementation requirements

1. Start from the exact implementation base created after this planning PR is
   merged into `origin/main`; record that SHA before editing.
2. Use tests first for Core mapping, response Contract, pure view model, and the
   repository/API behavior before composing the Workspace.
3. Keep the PostgreSQL query owner- and Package-rooted and parameterized. Join
   through existing composite bindings rather than trusting same-shaped IDs.
4. Reuse the existing safe Workflow failure Schema; do not create a second
   failure vocabulary.
5. Extend the Web API client header logic so JSON bodies retain JSON
   `Content-Type`, caller headers such as Idempotency-Key survive, and FormData
   receives the browser-generated multipart boundary.
6. Read the formal Source collection with the existing `limit=20`; the accepted
   maximum is six formal Sources, so no second browser pagination abstraction
   is needed in this Work Item.
7. Do not store Source drafts, private URLs, idempotency keys, or API responses
   in browser storage or URLs.
8. React-render all user content as text. Do not use `dangerouslySetInnerHTML`.
9. Preserve user drafts and focus during background SSE refresh; background
   updates must not overwrite a selected mode, text, label, file, or role.
10. Prevent duplicate submit through UI pending state, while relying on existing
    server idempotency/constraints as authority.
11. Use existing CSS language and desktop-first layout; no visual redesign,
    animation framework, or new dependency.
12. Update status to `In Review` only after every required check and Acceptance
    Criterion is evidenced. M2 remains `In Progress`.

## Accessibility requirements

- Source section buttons use native controls, visible focus, and
  `aria-pressed`; Research is textually unavailable.
- Input method and role are native labelled fieldsets/radio groups.
- File input has a visible label and `.md`/`.txt` help text.
- Loading/submission uses `aria-busy`; progress/notices use a polite status
  region; rejection uses an alert.
- State, role, and capacity are conveyed in text, never color alone.
- After Source creation, focus the new Source card or its heading. After
  selecting fallback, focus the textarea or file input. Validation failure
  focuses the error summary or first invalid control.
- Background refresh never moves focus.
- All actions are keyboard-operable, and disabled actions include explanatory
  text.

## Acceptance criteria

1. An authenticated owner opens an active Package and sees Sources as the
   current Workspace section, exact Primary/Supporting counts, and no false
   Approval or review state.
2. The owner creates one Pasted Text Source, one `.md` upload, and one `.txt`
   upload through the existing APIs; the formal list shows the exact role,
   input type, label, and persisted identity after reload.
3. The UI respects one Primary and at most five Supporting Sources, disables
   predictably unavailable roles, and displays server role-conflict failures
   without optimistic duplicates.
4. The owner submits one public URL with one per-action idempotency key. The
   durable intake read shows the exact private URL as non-link text and restores
   queued/running state after reload. Once any intake item exists, the URL
   composer is disabled and this Work Item never sends a second URL POST.
5. The read endpoint returns the exact zero-or-one discriminated Contract for
   queued, running, failed, and succeeded records, including safe failure and
   exact successful Source binding.
6. A Workflow notification causes an authoritative REST refresh. When the
   existing recovery controller enters Polling, the Workspace continues to use
   REST truth without parallel browser state authority.
7. A failed URL displays only safe category copy. For an active Package with
   available role capacity, Paste/Upload fallback creates an independent formal
   Source and the failed URL record remains visible after creation and reload.
   An unavailable role is disabled with an explanation; archived Packages show
   no fallback actions.
8. A succeeded URL intake is rendered once as its correlated formal public URL
   Source, not as both a Source and an activity card.
9. Missing and cross-owner Package intake reads are indistinguishable 404;
   unauthenticated is 401; malformed Package UUID is 422; malformed terminal
   persistence returns sanitized 500 with no mutation or private detail.
10. The owner can read URL intake history for an archived Package, while all
    intake actions are disabled and formal archived Source-read semantics remain
    unchanged.
11. OpenAPI contains the authenticated GET route, exact 200 union, and
    401/404/422/500 errors, with no request body, query, Secret Header, or
    internal fields.
12. UI and API output, logs, errors, SSE notifications, browser console, and
    test evidence do not expose submitted URLs outside the authorized response
    and visible owner page, nor expose claims, Secrets, Headers, SQL, Object
    keys, Candidate bodies, or provider errors.
13. Existing M1 Package behavior, Source APIs, Workflow recovery, URL runtime,
    integration concurrency, and browser cleanup continue to pass.
14. No Schema, migration, dependency, lockfile, configuration, Queue, Fetcher,
    Worker, Object Storage, Research, Agent, Approval, or Accepted DEC change is
    present.

## Required tests

### Unit and Contract

- Core maps the exact four states and rejects one realistic inconsistent
  terminal binding without adding speculative variants.
- URL intake JSON Schema accepts empty, queued, running, failed, and succeeded
  responses and rejects extra/internal fields or invalid failure/source pairs.
- The Web API client preserves JSON/caller headers and lets FormData set its
  multipart boundary.
- The pure view model covers role capacity/reservation, safe failure copy,
  succeeded deduplication, and no false Source/Approval state.

### PostgreSQL/API Integration

- active Package with no URL request → `200 items: []`, zero writes;
- normal URL submit → exact queued item;
- legitimate dispatched Claim → running item;
- legitimate failed Result → safe failed item;
- legitimate success Result → succeeded item with exact formal Source ID;
- active and archived owner reads;
- missing/cross-owner same 404, unauthenticated 401, malformed UUID 422;
- one realistic inconsistent terminal graph → sanitized 500 and zero writes;
- private submitted URL appears only in the authorized successful read, never
  in error, log, Timeline, or SSE evidence; and
- exact OpenAPI route, security, response union, errors, and absence of body,
  query, and internal fields.

### Browser

1. Owner login → create Package → Sources default → Pasted Text Primary →
   `.md` Supporting → `.txt` Supporting → exact cards/counts → reload →
   persisted cards/counts. Exercise pending/double-submit behavior and labelled
   keyboard-accessible controls.
2. Submit URL → queued URL visible as non-link text → reload → same durable
   record → transition through existing private Gateway/Result contracts to one
   safe failure → SSE-triggered authoritative refresh → Paste or Upload fallback
   with the role preselected when available → independent formal Source → failed
   URL still visible after reload. Confirm the URL composer remains disabled
   after queued, failed, and fallback states.
3. Archived Package keeps intake actions disabled and can display owned URL
   intake history without pretending the formal Source list is empty.

The browser fixture may use the isolated test database to mark only its owned
Outbox row dispatched, then use the existing private Gateway and Result API with
the temporary harness Secret held only in Node test memory. It must not add a
test-only product endpoint, expose the Secret to browser code, or touch
`contentos-local` resources.

A full Queue-to-Fetcher success browser journey and the complete SSE
disconnect/Polling matrix belong to `M2-QUAL-001`; this Work Item proves one
composition-level notification/refetch path and relies on the already accepted
M2-FETCH-001 and M2-WF-004B regression suites for their internal mechanics.

## Required verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm test:integration:concurrent`
- `corepack pnpm test:browser`
- `corepack pnpm db:generate` twice; both runs must report no Schema changes
- `git diff --check`
- exact changed-file, forbidden-path, manifest/lockfile, local-path, Secret,
  generated-artifact, `.DS_Store`, process/container/tmpdir, and Git-status
  inspection

No required test may be skipped or silenced. A failure must be attributed to
the changed code, an existing reproducible baseline defect, or the execution
environment with concrete evidence.

## Failure-path verification

- initial Source/intake read failure does not render an empty authoritative
  state;
- background refresh failure retains but labels stale last-known state;
- 401 redirects to Login and disposes recovery resources;
- 404 uses the existing unavailable Workspace path;
- role conflict, rejected paste/upload, and ambiguous URL network failure do
  not create duplicate browser rows or automatic retries;
- malformed persisted URL terminal state fails sanitized and read-only;
- failed URL fallback never mutates the URL request/result, never bypasses
  capacity, and is absent for archived Packages; and
- unmount/section change disposes EventSource/Polling through the existing
  recovery controller, with no late focus or draft mutation.

## Security requirements

- Submitted URL, Pasted Text, upload bytes, labels, and Source bodies are
  private owner content.
- Authentication and server-side owner scope apply to every read/write. Missing
  and cross-owner resources remain indistinguishable where accepted.
- Upload continues through the existing allowlist/quarantine; browser
  `accept` is UX guidance, not a security control.
- URL validation and SSRF controls remain in the Fetcher. Manual fallback is a
  separate Source command, not a transport bypass or URL success mutation.
- React escapes every user value. No HTML execution, external link navigation,
  browser URL capture, local storage, or diagnostic URL echo is added.
- No Secret, Claim, idempotency key, request Header, Queue payload, SQL, stack,
  Object key, Candidate body, or provider error enters logs, UI diagnostics,
  SSE, or Completion evidence.
- Review remains proportional: cover credible boundary and state failures; do
  not add a generic hash/redaction system or matrices of unreachable cases.

## Migration and compatibility review

- Database Schema, migrations, metadata, indexes, and stored values: unchanged.
- Existing Source, URL POST, Gateway, Result, Workflow REST/SSE, Queue, and
  Object Storage Contracts: unchanged.
- One additive authenticated REST GET and additive Web composition are added.
- No Backfill or compatibility sequencing is needed because the query projects
  existing rows.
- Rollback is one PR revert; persisted Source/Workflow/URL data remains valid.

## Observability

No new Metric, Trace, audit table, or generic logging framework is required.
Existing sanitized API/HTTP failures remain sufficient. The new read endpoint
must not log the submitted URL. UI copy presents safe owner-visible status only;
it is not an operational diagnostic surface.

## Documentation updates

- `AGENTS.md`, `README.md`, and `README.zh-CN.md`: current M2 capability and
  explicit absence of Source review/Approval UI;
- Source Foundation: durable URL intake read and formal Source distinction;
- Workflow Overview: Workspace composition consumes REST truth after existing
  SSE/Poll notifications without duplicating SSE rules;
- Repository Structure: new Core/Database/Web seams;
- Browser Thin Slice: M2 Source intake scenarios and fixture ownership; and
- Roadmap and this Work Packet: `In Review` during implementation, later
  `Completed` only after merge/status sync.

No Decision Register or new DEC update is required. M2-DES-007 is the accepted
bounded Decision Review for the new public read.

## Destructive operations

None authorized. Do not delete or prune Docker resources, volumes, images,
branches, migrations, user data, or unrelated temporary state. Test harnesses
may clean only resources carrying their own generated ownership token.

## Git permissions

- Commit: Yes, after implementation is complete and local required checks pass
- Push: Yes, after the same gate
- Draft Pull Request: Yes, after the same gate
- Mark Pull Request Ready: No
- Merge: No

The Implementation Agent cannot approve its own work. The Orchestrator may mark
the PR ready and squash merge only after independent Review `PASS`, all required
GitHub CI is green, and no Human escalation category applies.

## Escalation conditions

Stop and return `HUMAN_DECISION_REQUIRED` if implementation requires:

- changing M2-DES-007, Source limits, archived formal Source reads, fallback
  linkage, Source semantics, Workflow state, Authentication, Authorization, or
  the private-content boundary;
- adding Retry, Approval, Research, Agent, raw Candidate/Snapshot access, a new
  protocol, dependency, Schema, migration, configuration, provider, or
  production operation;
- modifying a forbidden file or lowering an Acceptance Criterion;
- a destructive operation or external action not authorized above; or
- an unresolved conflict with Accepted DEC or Current-truth.

An ordinary implementation defect, test correction, focus/accessibility fix,
or bounded response-mapping fix does not require a new Decision Review.

## Definition of Ready review

```text
PASS
Blocking Design Question: None
```

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: XHigh requested
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/web001a_ready_review`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `fae900f13e985483f189f5c7dae7348948f43265`
- Review Date: 2026-08-07

The independent reviewer verified:

- product/UX scope and the `M2-WEB-001B` / `M2-QUAL-001` exclusions;
- exact API/Core/database feasibility from existing persistence;
- owner, archived-Package, fallback, and private-URL boundaries;
- complete file allowlist with no migration or dependency requirement;
- feasible unit, Integration, isolated browser fixture, accessibility, and
  required-verification evidence; and
- correct Issue, branch, base, Git permissions, and governance sequencing.

The first review required three bounded corrections: focused formatting; a
fixed-v1 rule that any durable intake item disables all later URL submissions;
and active/capacity-gated fallback semantics. The reviewer verified all three
corrections and returned final `PASS`.

## Implementation review corrections

Two independent implementation reviews returned `NEEDS CHANGES` against the
uncommitted implementation. Correction Round 1 remains within this packet and
keeps the Work Item `In Review`:

- successful intake activity is deduplicated only against its exact formal
  Source ID; archived history never invents formal Source counts or an empty
  formal collection;
- an ambiguous URL POST and a successful POST followed by a failed
  authoritative refresh both remain locked until the owner performs a
  successful reconciliation read;
- Source refreshes are serialized and coalesced, disposed completions cannot
  commit state, terminal `401`/`404` reads and commands use the existing
  Workspace terminal paths, and background refresh failure preserves the last
  known view and form draft;
- focus moves to the exact created Source card or the actionable failure, while
  URL activity updates remain live status without stealing focus; and
- browser and Integration evidence covers the accepted success, failure,
  fallback, archived-history, owner-scope, sanitized-error, and zero-side-effect
  boundaries without adding a dependency, Schema, migration, hash, or broader
  defensive mechanism.

Correction executor metadata remains `Logical Role: IMPLEMENTATION_AGENT`,
`Actual Model: UNVERIFIED_RUNTIME_MODEL`, and `Runtime Model Status:
UNVERIFIED_RUNTIME_MODEL`. Final gate evidence must be recorded only after the
commands complete; this section does not change the packet status or authorize
Git publication.

Correction Round 1 final local evidence on 2026-08-07:

- `pnpm check` passed in the environment that permits the existing managed
  process-identity tests: 51 files and 456 unit tests, plus all five application
  builds. The restricted sandbox run was separately recorded as an environment
  failure because `ps` spawning returned `EPERM`; no test was skipped or
  weakened.
- `pnpm test:integration` passed 26 files and 182 tests;
  `pnpm test:integration:concurrent` passed; and `pnpm test:browser` passed all
  six Chromium scenarios.
- frozen installation, Workspace resolution, documentation, repository,
  Secret, formatting, lint, strict TypeScript, build, and diff checks passed.
  Two consecutive `db:generate` runs reported no Schema changes.
- The final browser evidence includes initial and background read failure,
  preserved draft/focus, ambiguous submission, accepted-but-unconfirmed
  submission, authoritative reconciliation, exact successful Source
  deduplication, archived history, independent fallback, and terminal command
  authentication handling.

Correction Round 2 resolved two independent re-review blockers without changing
the packet boundary:

- URL confirmation status and its narrowly scoped warning now reconcile as one
  state update. An authoritative empty intake collection returns the browser to
  idle, while a durable item confirms the permanent fixed-v1 lock; both remove
  only the associated confirmation warning and prompt.
- Source read/command and recovery `404` paths now use one unavailable-Package
  transition. It clears the mounted Package and stale Source projection so the
  Sources effect disposes its coordinator and recovery subscription; `401`
  continues to return to Login.

Correction Round 2 focused evidence passed 10 unit tests, Web and Testing
TypeScript checks, and all seven Chromium scenarios. The final repository gate
passed 51 files and 456 unit tests, all application builds, documentation,
repository, Secret, and diff checks. API/database code did not change after the
immediately preceding 26-file/182-test Integration and concurrent-smoke passes,
so those expensive suites were not repeated for this Web/test/documentation-only
correction. The Work Item remains `In Review`, M2 remains `In Progress`, and
the executor metadata remains `Actual Model: UNVERIFIED_RUNTIME_MODEL`.

## Completion record

Completed through PR #118, squash merge
`58d2e8ca1f80d0ea03ef991aa22f40c3b058c25c`
(`feat: add Source intake workspace (#118)`). Independent correctness and
security/privacy/quality reviews both returned `PASS`, and all three required
GitHub CI jobs passed before merge. M2 remains `In Progress`; `M2-WEB-001B`
and the M2 acceptance work remain not started.

## Completion report format

Return the repository [Implementation Completion Report](../templates/implementation-report-template.md), including:

- Summary and design choices;
- exact files changed;
- migration/dependency statement;
- commands and test counts;
- criterion-by-criterion evidence;
- browser and failure-path evidence;
- security and accessibility impact;
- known limitations and incomplete items;
- documentation updates and possible new DEC;
- runtime residue and final Git status; and
- actual execution metadata without inferring an unobservable model.
