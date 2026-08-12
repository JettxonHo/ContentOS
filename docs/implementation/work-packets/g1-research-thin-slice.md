# G1 — Approved Sources to Approved Research Thin Slice

**Status:** In Review — implementation and affected local verification complete; independent review, PR CI, and merge pending
**Issue:** [#289](https://github.com/JettxonHo/ContentOS/issues/289)
**Base:** `8fb4ec5d2fd74aa679a8904d91550a5ee9f59ba0`

## Goal

Let the private owner turn exact currently Approved Source Versions into structured, evidence-linked Research, directly review it, checkpoint an immutable Version, and approve that exact eligible Version in the Workspace.

## Scope

In scope:

- one owner-scoped Research Artifact per Content Package;
- exact Primary plus up to five Supporting Approved Source Version inputs;
- deterministic `FakeResearchProvider` output with no network, credential, or cost;
- persisted generation Run with API-restricted Raw Output;
- Research v1 Summary, Facts/Claims/Tensions, Evidence, Open Questions, and review states;
- optimistic Working Copy edit, immutable checkpoint, exact human Approval, and Outdated propagation;
- owner-scoped REST/OpenAPI contracts and one Workspace review panel;
- additive migration, deterministic tests, Integration, Browser, and documentation.

Out of scope: a real Provider, paid calls, autonomous search/tools, a generic Agent platform, Human Opinion, Blog, Xiaohongshu, Export, Render, deployment, and automatic Approval.

## Relevant decisions and specifications

- DEC-295 and `GOAL-MVP-TEXT-001`;
- Product Definition, MVP Scope, Domain Overview, Artifact Versioning, Agent Runtime, Test Strategy, Vertical Slice Acceptance, and Security Baseline;
- `AGENTS.md`, the Roadmap, and the Work Item contract.

No new DEC is required. The implementation realizes already accepted Research, exact-Version dependency, owner, human Approval, and Fake Provider boundaries.

## Contracts

- Domain: `ResearchService` depends only on project-owned `ResearchRepository`, `ResearchProvider`, ID, and Clock interfaces.
- Schema: `research/v1`; strict bounded body with no unknown keys.
- Input: exactly one Approved Primary Source and no more than six exact Approved Source Versions total.
- Provider: deterministic Fake Provider only. Raw Provider output is persisted in `research_runs` and never returned by the public API.
- Versioning: generated and user-checkpoint Versions are immutable; Approval binds the current exact Review Candidate and exact Source inputs.
- Outdated: a later Approved Source Version makes prior Research visibly Outdated and ineligible for renewed Approval.
- Security: authenticated owner scope, API-owned writes, no HTML execution, no new Secret, network, tool, or production boundary.
- Migration: additive `0009`; rollback before release is repository rollback plus disposable-database rebuild. No production migration is authorized here.

## Acceptance criteria

1. Generation consumes only the exact current owner-scoped Approved Source Versions and is idempotent by owner/request ID.
2. Malformed Provider output records a failed Run and creates no Research Version.
3. The owner can review/correct items, save with optimistic revision, checkpoint, and approve one exact eligible Version.
4. Public responses expose structured Research and evidence but not Raw Output, Provider alias, or internal failure details.
5. Cross-owner access is non-disclosing; missing Approved input and archived commands fail safely.
6. A newly Approved Source Version makes the prior Approved Research Outdated.
7. The Workspace demonstrates generate → review → checkpoint → exact Approval and survives refresh.

## Verification

- Research domain/HTTP contract tests: `8 passed`.
- `corepack pnpm lint`: Passed.
- `corepack pnpm typecheck`: Passed.
- Final root `corepack pnpm check`: `56 files / 589 tests` and all five application builds Passed.
- First Integration run: Research tests passed; the exact PostgreSQL table inventory correctly failed because it had not yet named the seven new Research tables.
- Corrected full `corepack pnpm test:integration`: `28 files / 187 tests` Passed.
- First full Browser run: existing 16 scenarios Passed; the new G1 assertion was narrowed from hidden/ambiguous evidence text to the explicit disclosure interaction.
- Focused G1 Browser scenario after correction: `1 passed`.
- Final full `corepack pnpm test:browser`: `17 passed`.
- Independent review found and the implementation corrected one Outdated-recovery deadlock: the public state now distinguishes an old Approved Version from the current review candidate, and Integration plus Browser prove regenerate → review → checkpoint → reapprove after a Source change.
- Independent re-review found and the implementation corrected one Approval-record omission: each append-only Research Approval now persists and rehydrates a bounded `research-validation/v1` summary for its exact Version; Integration asserts the stored binding through the authoritative read response.
- Final review found and the implementation corrected one Unicode truncation boundary: Fake Provider summaries/snippets now truncate by code point, and Core/HTTP/JSON Schema reject lone surrogate code units while preserving valid astral characters.
- Final `corepack pnpm repository:check`, targeted documentation Prettier check, and `git diff --check`: Passed.
- Independent review is recorded before publication.
- Final independent review: Passed with no blocking findings.

## Completion report

### Summary

Implemented one bounded Research vertical slice without introducing a generic Agent runtime or real Provider. PostgreSQL remains authoritative; the API owns every Research mutation; the Web client renders only validated structured text.

### Files changed

- Core Research domain/service and deterministic Fake Provider.
- Shared HTTP contracts, strict Research resource OpenAPI schema, and safe error codes.
- Additive Drizzle schema/migration and PostgreSQL repository adapter.
- Protected NestJS Research routes and Web API composition.
- Workspace Research review panel.
- Unit, Integration, Browser, migration-inventory, and documentation evidence.

### Security impact

S1 existing private owner/input boundary. The change adds owner-scoped database rows and validated text input. It adds no Secret, external network call, tool capability, active rendering, public sharing, or automatic Approval. Raw Provider output stays server-side and is size bounded.

### Known limitations and incomplete items

- Only the deterministic Fake Provider exists. Real Provider credentials/cost remain separately unauthorized.
- Research history is represented by immutable persisted Versions, while this thin UI displays the current review state rather than a full history browser.
- G2 Human Opinion/Research-based Mode and Blog remain Not Started.
- Independent review, PR CI, squash merge, and Issue closure remain pending until publication.

### Documentation updates

Synchronized `GOAL.md`, `AGENTS.md`, Roadmap, repository structure, browser/integration baselines, and both READMEs. No new ADR/DEC.

### Git status

The implementation worktree contains only G1 code, generated migration artifacts, affected tests, and required documentation. No commit, push, PR, merge, real Provider call, or production action is claimed by this report.
