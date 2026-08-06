# M2-SRC-004 — Approved Source Input Projection

**Status:** Completed

**Issue:** [#102](https://github.com/JettxonHo/ContentOS/issues/102)

**Planning branch:** `codex/m2-src-004-ready-design`

**Implementation branch:** `codex/m2-src-004-approved-source-input-projection`

**Planning / Definition-of-Ready base:** `7d7d5b6b756c852a513dbfb5b4130c5c809877cb`

**Implementation base:** `b689736af26cab5fd448369b5b7bcdfc5a76885e`

## Identification

- Work Item: `M2-SRC-004`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Risk Classification: private user-content read projection, owner authorization,
  immutable Version selection, and future Research input eligibility

## Goal

Add one internal, owner-scoped Approved Source Input Port that returns only the
current exact human-approved Normalized Source Versions for one active Content
Package. The Port gives a future Research use case one deterministic read seam
without exposing Source mutation, database rows, historical selection, or a
Research execution capability.

## Canonical sources

- [Canonical Decision Register](../../decisions/decisions.md)
- [Domain Overview](../../architecture/domain-overview.md)
- [Artifact Versioning](../../architecture/artifact-versioning.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Data Classification](../../security/data-classification.md)
- [Security Baseline](../../security/security-baseline.md)
- [MVP Scope](../../product/mvp-scope.md)
- [Test Strategy](../../quality/test-strategy.md)
- [M2 Exit Criteria](../milestone-exit-criteria.md#12-m2-exit-criteria)
- [Roadmap](../roadmap.md)
- [M2-SRC-001 — Pasted-text Source foundation](m2-src-001.md)
- [M2-SRC-002 — Upload Source foundation](m2-src-002.md)
- [M2-SRC-003 — URL Result and Source evidence](m2-src-003-url-capture-result-source-evidence.md)
- [Issue #102](https://github.com/JettxonHo/ContentOS/issues/102)

Relevant Accepted Decisions: DEC-030, DEC-032, DEC-059, DEC-062–DEC-065,
DEC-129, DEC-160–DEC-169, DEC-171–DEC-172, DEC-199, DEC-226, DEC-245,
DEC-247, DEC-259, DEC-268, DEC-272, DEC-280, and DEC-287–DEC-293. A later
Accepted DEC governs an actual conflict.

## Current truth and dependencies

- Source Reference, immutable Raw Snapshot, mutable Working Copy, immutable
  Version, separated Head pointers, and append-only human Approval are already
  implemented for Pasted Text, `.md`, `.txt`, and URL-derived Source evidence.
- `source_heads.approved_version_id` identifies the Source's current Approved
  Version. `latest_version_id` and `review_candidate_version_id` have different
  meanings and may point elsewhere.
- `source_approvals` preserves historical Approval records. A historical row
  does not make its Version current after the Approved Head advances.
- PostgreSQL is authoritative. Version bodies are exact
  `source/normalized/v1` `{ text }` values stored in PostgreSQL; this read does
  not require Object Storage.
- An active Package may currently have no Approved Source, or a mixture of
  approved and unapproved Sources. The first Research Agent and Frozen Input
  persistence belong to M3, not this Work Item.
- The accepted Package bound is one Primary Source and at most five Supporting
  Sources, so a complete projection is bounded and needs no pagination.

## Chosen module design

### Module, Interface, Seam, and Adapter

- **Module:** Approved Source Input Projection.
- **Interface / Seam:** one provider-neutral Core Port.
- **Production Adapter:** one PostgreSQL/Drizzle read adapter in
  `@contentos/database`.
- **Composition:** `DatabaseRuntime` exposes the Port for a future owning use
  case; no application route or Research caller is registered in this item.

The Interface is intentionally small:

```ts
export interface ApprovedSourceInputScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

export interface ApprovedSourceInput {
  readonly sourceId: SourceId;
  readonly role: SourceRole;
  readonly sourceVersionId: SourceVersionId;
  readonly versionNumber: number;
  readonly schemaVersion: typeof SOURCE_SCHEMA_VERSION;
  readonly body: NormalizedSourceBody;
}

export interface ApprovedSourceInputPort {
  listCurrentForPackage(scope: ApprovedSourceInputScope): Promise<readonly ApprovedSourceInput[]>;
}
```

This exact surface is fixed for the Work Item. It does not return owner IDs,
Source labels/types, URLs, Working Copies, Heads, Raw Snapshot IDs or bytes,
Object keys, Approval records/actors/summaries, content hashes, Workflow state,
or Research readiness.

### Why this design

One method hides owner scope, Package lifecycle, current Approved Head
resolution, exact Version and Approval matching, historical exclusion, row
mapping, and stable ordering. Deleting the Module would force every future
Research/Frozen-Input caller to rebuild those rules, so the Module has real
Depth and keeps change Locality at the Source-owned seam.

The wider alternative was rejected because returning Approval, Snapshot,
capture, label, and hash metadata increases the Interface without a current
caller requirement. The caller-first `ready/not_ready` tuple was rejected for
M2 because deciding whether a missing Approved Primary or an unapproved
Supporting Source blocks Research belongs to the future Research Command and
Frozen Input Gate. This Projection reports eligible inputs; it does not decide
whether Research may start.

## Fixed behavior

### Eligibility

Every returned row must satisfy all of the following in one owner-scoped read:

1. the Content Package matches the exact Package ID and owner;
2. the Package lifecycle is `active`;
3. the Source belongs to that Package and owner;
4. the Source Head has a non-null current `approved_version_id`;
5. the immutable Version ID equals that exact Approved Head pointer and belongs
   to the same Source and owner; and
6. an append-only Approval exists for that exact Source, owner, and Version.

Consequently:

- an unapproved Source is excluded;
- a Working Copy, Latest Version, or Review Candidate is never read as input;
- a previously approved historical Version is excluded after the Approved Head
  advances;
- a cross-owner or other-Package Source is excluded; and
- each Source contributes at most one current exact Version.

### Package and empty-result semantics

- An unknown Package or a Package owned by another user fails with the existing
  `SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND')`. The two cases remain
  indistinguishable.
- An owned archived Package fails with the existing
  `SourceApplicationError('PACKAGE_ARCHIVED')`, matching current Source read
  behavior.
- An active Package with no current Approved Source returns an empty immutable
  list.
- A Package with an unapproved Primary and an approved Supporting Source returns
  only that approved Supporting Source. This is not a Research-ready decision;
  M3 must define and enforce its own start Gate.

### Ordering and consistency

The result order is deterministic:

```text
Primary
→ Supporting
→ Source created_at ASC
→ Source id ASC
```

The Adapter uses one parameterized PostgreSQL statement rooted at the
owner-scoped Package and left-joins Source, Head, exact Version, and matching
Approval. It filters incomplete/unapproved rows during mapping. The one
statement provides one PostgreSQL statement snapshot and distinguishes an
active empty Package from a missing or archived Package.

The result is a current read projection, not a lock, lease, dependency record,
or Frozen Input. The Approved Head may advance after return. A future M3 use
case must persist the returned exact Version IDs before execution and must not
dynamically re-resolve historical inputs.

### Performance

- one PostgreSQL round trip;
- at most six returned bodies, each within the existing 100 KB Source body
  bound;
- no N+1 reads, lock, write, cache, pagination, Object Storage operation, or
  provider call; and
- existing Package/Source/Head/Version/Approval indexes are used. No new index
  or migration is authorized.

## In scope

1. Define the exact internal Core value, scope, and one-method Port above.
2. Add a dedicated Drizzle Adapter; do not enlarge the existing Source mutation
   Repository Interface.
3. Compose the Adapter into `DatabaseRuntime` as a read-only capability without
   adding an application caller.
4. Implement exact owner, lifecycle, current Head, Version, Approval, exclusion,
   and ordering behavior.
5. Add real PostgreSQL integration evidence through the public Port Interface.
6. Synchronize Source/repository Current-truth and M2 status without claiming a
   Research capability.

## Out of scope

- Research Agent, Research Artifact, Agent Run, Model Attempt, Task, Queue,
  Frozen Input persistence, dependency persistence, stale detection, Prompt,
  Provider transmission, Eval, or M3 behavior;
- a Research readiness rule, automatic run, all-Sources-approved Gate, or
  exclusion/selection UI;
- public or private HTTP, OpenAPI, API Controller, Web UI, SSE, Timeline, or
  Workflow write;
- Source capture/edit/Version/Approval mutation, automatic Approval, Head
  mutation, or a new Source lifecycle state;
- Object Storage reads, Raw Snapshot bytes, URL/reference disclosure, cache,
  materialized view, new table, index, Schema, migration, backfill, or lock;
- a new dependency, package, process, configuration value, JSON Schema,
  Queue/Event Contract, generic query DSL, or second Source truth; and
- a new hash/SHA/digest/fingerprint or exposure of the existing Version content
  hash through this Port.

## Allowed and prohibited files

### Allowed files

- `packages/core/src/source/approved-source-input.ts`
- `packages/core/src/index.ts`
- `packages/database/src/approved-source-input-projection.ts`
- `packages/database/src/runtime.ts`
- `packages/testing/src/integration/approved-source-input-projection.test.ts`
- `docs/architecture/source-foundation.md`
- `docs/architecture/repository-structure.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-packets/m2-src-004-approved-source-input-projection.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

No other file is implicitly allowed. If a required file is absent from this
list, stop and request a bounded Work Packet correction before editing it.

### Prohibited modules and generated files

- all `apps/**`;
- `packages/contracts/**`, `packages/config/**`, `packages/object-storage/**`,
  and existing Source capture/mutation implementation files;
- `packages/core/src/research/**` or a new Research package;
- `schema.ts`, `migrations/**`, Drizzle metadata, package manifests,
  `pnpm-lock.yaml`, Compose, `.github/**`, DEC, and Session files;
- generated SQL, snapshots, build outputs, logs, credentials, local paths, and
  runtime artifacts.

## Contract review

- Domain/Internal Interface: the exact Core Port above.
- Database Contract: existing tables and constraints only; one read statement.
- API/OpenAPI: none.
- JSON Schema: none. The existing persisted `source/normalized/v1` body is
  returned without defining a new cross-process DTO.
- Queue/Event/Workflow Command: none.
- Error Contract: existing `CONTENT_PACKAGE_NOT_FOUND` and `PACKAGE_ARCHIVED`.
- Security Boundary: private owner-scoped PostgreSQL read; body content is never
  logged or copied into errors.

## Acceptance Criteria

1. The Core Interface exposes exactly one owner/package-scoped current-approved
   read and the minimal six-field input value.
2. An active Package with approved Primary and Supporting Sources returns their
   exact immutable bodies and Version IDs in deterministic Primary-first order.
3. Creating a newer Latest/Review Candidate without approving it leaves the
   previous current Approved Version in the projection.
4. Approving the newer Version moves that Source to the new exact Version and
   excludes its historical Approval/Version from the result.
5. Mixed approved and unapproved Sources return only approved current inputs;
   an active Package with no approved inputs returns an empty list.
6. Unknown and cross-owner Packages fail identically; an owned archived Package
   fails with the existing archived error; no cross-owner data enters a result.
7. The exact returned object shape contains no URL, label, Source type,
   Working Copy, Head, Snapshot/Object key, Approval, owner, or hash metadata.
8. The read creates or updates no Package, Source, Head, Version, Approval,
   Workflow, Task, Event, Queue, Object Storage, or cache state.
9. Existing Source/API/Workflow/Fetcher behavior and all required repository
   checks remain green.
10. No Schema, migration, dependency, lockfile, configuration, application,
    public Contract, Agent, or M3 behavior changes.

## Required tests

### Real PostgreSQL Interface tests

Use the existing isolated Integration Harness and test through
`ApprovedSourceInputPort`, not private SQL helpers:

1. Create an active Package with approved Primary and Supporting inputs plus an
   unapproved Supporting Source; assert exact shape and stable order.
2. For the same Source, approve v1, create v2 without Approval, and confirm v1
   remains; then approve v2 and confirm only v2 remains.
3. Confirm active-empty, wrong-owner, random-Package, and owned-archived
   behavior and unchanged Source/Head/Version/Approval row counts.

These scenarios may be combined to avoid repetitive setup. Do not manufacture
impossible malformed database rows that normal repository and constraint paths
cannot create.

### Regression and static tests

- existing Source/API integration tests;
- TypeScript strict checking and full deterministic unit/build gate;
- exact file-scope, forbidden-import, Secret, local-path, generated-artifact,
  and diff checks.

No concurrent Integration or Browser test is required because this Work Item
adds no concurrent write/lifecycle or Web behavior. No migration test is added;
two generator runs must prove zero Schema change.

## Security review

- The Port reads Private User Content. Exact owner and Package scope is
  mandatory at the root of the query and every relevant join.
- Missing and cross-owner Package behavior is indistinguishable.
- Returned text is authorized application data but is not loggable diagnostic
  evidence. Logs/errors may contain only stable error codes and safe IDs under
  existing policy.
- The Port does not add authentication, provider transmission, network access,
  Object Storage access, export, deletion, Secret, Prompt, or public exposure.
- Do not add repeated defensive cases for states already prevented by existing
  foreign keys and Version/Approval transactions. The exact matching join is
  the fail-closed read rule.

## Migration and compatibility review

- Database Schema/index/migration/backfill: none.
- Existing data: read-compatible; no mutation or normalization.
- Public/private HTTP and Queue Contracts: none.
- Dependencies/configuration/lockfile: none.
- Rollback: revert the implementation commit. No data or migration rollback is
  required.

## Observability

No new log, metric, trace, or Event is required. Database availability follows
the existing runtime failure path. Never log Source bodies, Approval details,
SQL, connection strings, or query rows.

## Documentation updates

- `source-foundation.md`: document the internal current-approved-only Port,
  exact Head/Version/Approval rule, stable order, and non-Frozen nature.
- `repository-structure.md`: record Core Interface and Database Adapter
  ownership.
- `roadmap.md`: mark `M2-SRC-004` Completed after independent review, green CI,
  and merge; M2 stays `In Progress`.
- `AGENTS.md` and README English/Chinese: state only that the internal read
  projection exists; keep Research Agent/API/UI/Frozen Input unavailable.
- This Work Packet: record Completed only after independent review, required CI,
  and merge.

No DEC update is expected. Return to Decision Review before adding a Research
readiness rule, Frozen Input/dependency persistence, new public/private
protocol, new data field whose meaning changes the accepted Source input, or a
change to owner/Approval/Version semantics.

## Required verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- focused Core/Database tests as applicable
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm db:generate` twice with no Schema diff
- `git diff --check`
- exact file scope, forbidden imports, dependency/lockfile/migration equality,
  Secret/local-path/generated-artifact/`.DS_Store`, runtime residue, and Git
  status checks

The known inherited dependency advisories remain tracked by Issue #95. Because
this Work Item changes no dependency edge, it must not modify or claim to
remediate them.

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

Return `HUMAN_DECISION_REQUIRED` before adding or changing Research readiness,
Agent/Frozen Input semantics, owner authorization, Approval/Version meaning,
public/private protocols, Schema/migration, production data/configuration,
technical stack, cost, irreversible behavior, or M2/MVP exit criteria.

Two correction rounds that leave the same substantive defect unresolved stop
further patching and return to root-cause and Work Packet review.

## Definition of Ready record

- Result: `PASS`
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: XHigh
- Thread: `/root/src004_ready_review`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `7d7d5b6b756c852a513dbfb5b4130c5c809877cb`
- Blocking Design Question: None
- New DEC required: No

The independent review confirmed that the minimal Port does not decide
Research readiness, the Package-rooted single-statement read can preserve
missing/archive/active-empty semantics, the exact allowlist is sufficient, and
the acceptance evidence is independently reviewable. Implementation may start
only from this Ready packet and its fixed boundaries.

## Completion record

Independent implementation review passed and all required CI checks were green.
PR [#104](https://github.com/JettxonHo/ContentOS/pull/104) was squash-merged on
2026-08-06 as `d2ec063743681b64f0406b4903805700bd9866e3`
(`feat: add approved Source input projection (#104)`). Issue
[#102](https://github.com/JettxonHo/ContentOS/issues/102) is closed.

This Work Item is completed. M2 remains In Progress: Workflow Timeline/SSE,
Source workspace, M2 acceptance work, and M3 remain not started. This
completion does not introduce Research readiness, Frozen Input, API/UI,
Research execution, Agent, Render, publishing, or M3 behavior.
