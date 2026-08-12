# G2 — Human Opinion and approved Blog Markdown thin slice

**Status:** In Review — independent review passed; PR CI and squash merge pending
**Issue:** #291
**Goal:** `GOAL-MVP-TEXT-001`
**Independent reviewer:** `/root/g2_final_re_review` — PASS, no blocking findings

## Goal

Deliver the smallest private, owner-scoped path from effective Approved Research to either an explicitly confirmed Human Opinion or Research-based Mode, then to a reviewable, versioned, exactly approved Blog Markdown Artifact and eligible `article.md` download.

## In scope

- one fixed Human Opinion question;
- Raw Human Response, deterministic interpretation, explicit confirmation/correction, and immutable Opinion Version bound to exact Approved Research;
- explicit `creator_led` and `research_based` Blog generation modes;
- deterministic Fake Blog Provider with no network, credential, or cost;
- Blog Working Copy, immutable Versions, exact Approval with validation summary, public references, internal provenance, dependency Outdated state, and `article.md` download;
- owner-scoped API and active Workspace UI;
- additive PostgreSQL migration, JSON Schema, deterministic Core/contract tests, Integration test, Browser test, and documentation synchronization.

## Out of scope

- real Provider calls, Provider selection, credentials, retry/fallback, or spend;
- generic Agent runtime, chat, tools, or autonomous Approval;
- Xiaohongshu, Design, Asset, Render, rich Export package, automatic publishing, deployment, or production proof;
- broad refactors or changes to Accepted decisions.

## Relevant DEC and documents

- DEC-032, DEC-051–DEC-075, DEC-093, DEC-145, DEC-150–DEC-157, DEC-269–DEC-272, DEC-295;
- `docs/product/mvp-scope.md` §§5–6;
- `docs/product/user-and-jobs.md` §§8–9;
- `docs/architecture/domain-overview.md` §§7–8;
- `docs/architecture/artifact-versioning.md` dependency, Outdated, Approval, and Export boundaries;
- `docs/quality/vertical-slice-acceptance.md` Human Opinion and Blog acceptance;
- `docs/quality/test-strategy.md`.

## Contracts

- The fixed question is: `What should readers understand, feel, or do after reading this?`
- Creator-led Blog Versions bind exact current Approved Research and exact current Confirmed Opinion Version. Research-based Versions bind exact Approved Research and carry no Opinion Version or fabricated first-person position.
- Generated raw output stays server-side. Only validated structured Blog content is exposed.
- Direct Blog edits may change title, summary, and Markdown but not content mode, public references, or internal provenance.
- Approval is human-only, applies to one exact current eligible Version, and appends its deterministic validation summary.
- Upstream Research or Opinion changes preserve history and make affected Blog state Outdated. An Outdated Approval cannot export.
- `article.md` is portable Markdown for manual publication; Exported is not Published.

## Acceptance criteria

1. An active owner can answer the fixed question, inspect deterministic interpretation, correct it, and confirm an immutable Opinion Version against exact Approved Research.
2. Research-based Mode is explicit and creates no first-person Opinion provenance.
3. Creator-led generation fails closed without a current Confirmed Opinion Version.
4. Fake Blog generation is deterministic, validates independently, binds exact dependency IDs, and exposes no raw output.
5. The owner can edit the Blog Working Copy with optimistic revision, checkpoint an immutable Version, and approve only the exact eligible current candidate.
6. The Approval persists a bounded validation summary for the exact Version.
7. Upstream dependency change yields visible Outdated state without rewriting history; stale content cannot silently export.
8. Eligible exact Approved Blog Markdown downloads as `article.md` with its Artifact and approved Version identity; no publishing action occurs.
9. Owner isolation, archive denial, refresh persistence, request idempotency, and malformed input/provider-output denial are covered proportionally.

## Tests

- focused Core Blog and contract tests;
- root `corepack pnpm check`;
- isolated `corepack pnpm test:integration`;
- pinned-Chromium `corepack pnpm test:browser`;
- `corepack pnpm repository:check` and `git diff --check`;
- first eligible PR quality, Integration, and Browser CI.

## Documentation updates

- `AGENTS.md`, `README.md`, Roadmap, browser thin-slice quality truth, this Packet, Blog JSON Schema, and additive migration.

## Security and migration impact

Owner scope and active-package checks remain API-owned. Raw Provider output is restricted to PostgreSQL and excluded from API/UI/log evidence. Human Opinion is private product data and is never placed in export. The migration is additive; no existing row is rewritten.

## Completion report

### Summary

The bounded G2 implementation is complete locally. It introduces owner-scoped Human Opinion and Blog domain/application services, additive PostgreSQL persistence, protected REST/OpenAPI routes, active Workspace UI, exact Approval and Outdated rules, deterministic Fake Blog generation, and eligible `article.md` download. The first independent review identified four bounded blockers; the candidate now preserves public references through editing and Approval, prevents approval of an uncheckpointed Working Copy, serializes concurrent duplicate generation, and embeds Artifact/approved-Version identity in the export.

### Files changed

- Core Blog/Opinion contract, Fake Provider, validation, provenance, dependency, service, and tests;
- database schema, migration `0010`, repository, and runtime wiring;
- API contracts, controller, error mapping, and OpenAPI coverage;
- Workspace API client, Opinion/Blog panel, and Browser flow;
- Integration/PostgreSQL/API coverage, JSON Schema, repository guidance, README, Roadmap, quality truth, and this Packet.

### Commands and tests

- Node 24.18.0 `corepack pnpm check`: PASS — formatting, lint, typecheck, 58 test files / 595 tests, and five application builds;
- `corepack pnpm test:integration`: PASS — 29 files / 188 tests, including concurrent duplicate-request serialization, immutable references, Research-based mode, Outdated/export denial, cross-owner isolation, and archive denial;
- `corepack pnpm test:browser`: PASS — 18/18, including disabled Approval before checkpoint and the end-to-end Opinion/Blog/export journey;
- focused Core and contract tests: PASS — 2 files / 6 tests;
- exported `article.md` regression: PASS — YAML front matter contains the exact Blog Artifact and approved Version IDs;
- final repository integrity, formatting, and diff checks: PASS on the corrected review head;
- targeted independent re-review: PASS — all four original blockers and both regression-coverage gaps are closed.

### Acceptance criteria

All nine local Acceptance Criteria are evidenced. The initial independent-review blockers are corrected, directly covered, and independently re-reviewed with no blocking findings. PR CI, squash merge, and Issue closure remain incomplete and non-effective.

### Security impact

Owner and active-package boundaries remain API-owned. Raw Fake Provider output is persisted only in restricted run state and omitted from REST/UI/log evidence. Human Opinion remains private and is not included in `article.md`. No credential, network Provider call, paid action, automatic Approval, or publishing action was introduced.

### Known limitations and incomplete items

The deterministic interpretation is deliberately bounded to the exact trimmed owner response. The Fake Blog Provider is not production AI quality evidence. G2 does not implement Xiaohongshu, generic Agent runtime, rich Export, publishing, deployment, or production runtime proof. First eligible CI, merge, and #291 closure are pending.

### Documentation, DEC, and Git status

Current repository guidance and quality/roadmap truth are synchronized. No new DEC is required because the implementation stays within Accepted G2 boundaries. The working tree contains only the intended G2 candidate and is not committed or published yet.
