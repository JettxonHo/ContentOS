# M2-DOC-001 — Current-truth Runtime Status Normalization

**Status:** Ready

**Issue:** [#133](https://github.com/JettxonHo/ContentOS/issues/133)

## Identification

- Task ID: `M2-DOC-001`
- Milestone: M2 — Source and Workflow Foundation
- Type: Documentation Integrity
- Owner: Documentation Executor
- Reviewer: Independent Review Agent
- Logical Role: `WORK_ITEM_PLANNER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root`
- Planning Base SHA: `d4cdd1d774ecb659bd60002ec05303933bd3d852`
- Risk: Current-truth accuracy only

## Goal

Correct the bounded stale implementation-status statements that remain in three
Current-truth documents after `M2-FETCH-001B`, `M2-FETCH-001C`, and
`M2-WEB-001B` merged. The result must describe the existing runtime accurately
without changing product behavior, architecture, security policy, or milestone
acceptance.

## Current evidence

- `M2-FETCH-001B` is Completed through PR #96, squash merge
  `9b28068eb3ed266973f77bcdffe6c08776b2086c`.
- `M2-FETCH-001C` is Completed through PR #100, squash merge
  `4fe20a48a02b83ec68886bae68b86f5e65ba3895`.
- `M2-WEB-001B` is Completed through PR #122, squash merge
  `9af5f68b8846ab172bff7599657c9409faed85c4`.
- The Fetcher is the bounded BullMQ consumer. It loads its separate Redis and
  Object Storage configuration, performs controlled capture and immutable
  Snapshot preparation, and submits Result through the private API Gateway.
- The Fetcher has no `DATABASE_URL`; PostgreSQL remains authoritative and the
  API owns Task, Workflow, and Source mutation.
- The active Workspace includes Source review, Version history, exact human
  Approval, Timeline REST reads, and the existing SSE/Polling recovery
  composition. This does not create Research, Agent, Render, Export, or M3
  behavior.

## Relevant decisions and documents

- DEC-022 — documentation is part of the product and repository.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, focused review, and
  explicit Definition of Ready/Done.
- [Repository Agent Rules](../../../AGENTS.md)
- [Roadmap](../roadmap.md)
- [Source Fetcher Security](../../security/source-fetcher.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [M2-FETCH-001B Work Packet](m2-fetch-001b-candidate-extraction-scoped-snapshot-writer.md)
- [M2-FETCH-001C Work Packet](m2-fetch-001c-queue-gateway-fetcher-orchestration.md)
- [M2-WEB-001B Work Packet](m2-web-001b-source-review-approval-workspace.md)

Later Accepted DEC and Current-truth specifications govern any actual conflict.

## In scope

1. In `docs/security/source-fetcher.md`, replace both stale
   `M2-FETCH-001C` In Review statements with the completed bounded runtime
   composition and preserve the existing security policy.
2. In `docs/architecture/workflow-overview.md`, record `M2-WEB-001B` and
   `M2-FETCH-001C` as Completed and describe only the capabilities already
   merged.
3. In `docs/architecture/source-foundation.md`, record `M2-FETCH-001B` and
   `M2-FETCH-001C` as Completed, the Fetcher-private Snapshot writer as
   registered through the bounded consumer, and the separate Fetcher Object
   Storage configuration as loaded by the current Fetcher lifecycle.
4. Add one Roadmap row for this documentation-integrity Work Item and maintain
   this Work Packet through review and completion.

## Out of scope

- product, Web, API, Worker, Fetcher, Renderer, domain, persistence, or test
  behavior;
- dependencies, lockfile, configuration keys, Schema, migration, Compose, CI,
  OpenAPI, or public interface changes;
- changing any security rule, least-privilege boundary, Accepted DEC, or
  Current-truth behavior;
- claiming a new Safe Display entity, Research readiness, Research Agent,
  Frozen Input, Retry, Render, Export, publishing, deployment, or M3 capability;
- marking M2 Passed or Completed, creating an Acceptance Record, or starting
  `M2-GOV-005` or M3.

## Allowed files

- `docs/security/source-fetcher.md`
- `docs/architecture/workflow-overview.md`
- `docs/architecture/source-foundation.md`
- this Work Packet
- `docs/implementation/roadmap.md`, limited to this Work Item's status

No other file is allowed without a corrected Work Packet and another
independent readiness review.

## Required wording boundaries

- Use `Completed` only for the three merged Work Items named in Current
  evidence.
- Keep PostgreSQL as Workflow truth and the API as the only domain-state write
  authority.
- Keep the Fetcher without database access and with separate least-privilege
  Redis/Object Storage identities.
- State that raw Snapshot bytes are never directly rendered; deterministic
  plain-text review content is the non-executable user review representation.
  Do not invent a separate Safe Display entity or HTML renderer.
- Keep the internal current-Approved Source input projection distinct from a
  future Research Agent or Research execution.
- Keep M2 `In Progress` and M3 `Not Started`.

## Acceptance criteria

1. The six identified stale phrases are removed: two in Source Fetcher, two in
   Workflow Overview, and two status/configuration passages in Source
   Foundation.
2. Each replacement matches the already merged runtime and does not claim a new
   capability.
3. Fetcher least privilege, API write authority, PostgreSQL truth, private data,
   and untrusted-input boundaries remain intact.
4. No code, dependency, lockfile, Schema, migration, Compose, CI, DEC, or other
   Current-truth file changes.
5. M2 remains In Progress; `M2-GOV-005` and M3 remain not started.
6. Formatting, Markdown links, documentation integrity, repository integrity,
   Secret scan, exact file scope, local-path, generated-artifact, and diff
   checks pass.

## Tests and verification

```text
corepack pnpm format:check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

Code, Docker, integration, concurrent, and browser tests are not locally
required for this documentation-only implementation. Required GitHub CI still
must be green before merge.

## Security, migration, compatibility, and observability

This Work Item changes no security policy or runtime boundary; it only aligns
documentation with the already reviewed implementation. There is no migration,
compatibility sequence, telemetry, or rollback operation beyond reverting the
focused documentation commit.

## Documentation updates

Only the five allowed documentation files. No Decision Register, Session,
Product Current-truth, API, Schema, testing strategy, README, or `AGENTS.md`
change is required.

## Definition of Ready

**PASS.** Independent review confirmed the merge facts, six stale passages,
five-file allowlist, wording boundaries, and verification commands. No Blocking
Design Question or new DEC is required.

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2_acceptance_governance_audit`
- Reviewed Base: `d4cdd1d774ecb659bd60002ec05303933bd3d852`
- Blocking Design Question: None

## Definition of Done

All six stale statements are corrected on one reviewable documentation diff;
independent review passes; required CI is green; M2 remains In Progress; no
scope or residue remains.

## Git authority

The Documentation Executor may modify only the allowed files and must stop
before Git publication. After independent review passes, the Orchestrator may
commit, push, and create a draft PR. The Orchestrator may mark the PR ready and
squash merge only after all required CI is green and no unresolved finding or
escalation item remains.

## Completion report requirements

Report Summary; exact stale statements corrected; files changed; commands;
acceptance criteria; security impact; known limitations; incomplete items;
documentation updates; possible new DEC; cleanup; and Git status.
