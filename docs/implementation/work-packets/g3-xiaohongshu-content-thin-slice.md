# G3 — Xiaohongshu content thin slice

**Status:** Publication Ready — local evidence and independent review passed; CI and merge pending
**Issue:** #293
**Goal:** `GOAL-MVP-TEXT-001`

## Goal

Deliver the independent, private Xiaohongshu content branch from the current Approved Content Foundation through a deterministic Packaging Plan, editable platform-native Artifact, immutable Version, exact human Approval, dependency-aware Outdated state, and eligible portable `post.md` / `pages.json` export.

## In scope

- static versioned MVP Platform Profile;
- deterministic Fake Packaging Provider with no network, credential, or cost;
- Packaging Plan followed by a Xiaohongshu Artifact that does not consume Blog;
- platform title candidates and selection, cover title/subtitle, eight stable pages with purpose/content/emphasis/density/visual brief/provenance, Caption, CTA, hashtags, and public references;
- Creator-led and Research-based modes bound to exact Approved Research and optional exact Confirmed Opinion;
- Working Copy editing and page reordering, immutable Versions, deterministic validation, exact Approval, and Outdated propagation;
- owner-scoped portable `post.md` and `pages.json` export for the current eligible exact Approved Version, including Artifact and Version identity;
- owner-scoped REST/OpenAPI, active Workspace UI, additive migration, JSON Schema, deterministic Core/contract/Integration/Browser evidence, and documentation synchronization.

## Out of scope

Design, Assets, rendering, PNG output, image/ZIP Export Package, automatic publishing, real Provider calls, generic Agent runtime, Blog-derived shortening, deployment, and production proof.

## Contracts

- `platformProfileVersion` is the static `xiaohongshu-profile/v1` input.
- Packaging uses the same Approved Research plus Confirmed Opinion or explicit Research-based Mode as Blog, but never reads Blog content or identity.
- The Packaging Plan records the eight-page narrative allocation and is generation metadata, not publishable content.
- The Artifact keeps platform titles, cover copy, pages, Caption, CTA, hashtags, references, and provenance as distinct fields.
- Direct edits cannot change mode, profile, dependencies, references, or provenance. Page reorder preserves stable page IDs.
- Approval is human-only and appends the validation summary for one exact current eligible Version. Upstream changes preserve history and make affected content Outdated.
- Research-based Mode is an explicit user choice; a deferred package preference never silently selects it, and first-person claims are rejected in English and Chinese.
- The portable exports are authorized reads of only the current non-Outdated Approved Version. G3 does not render or publish.

## Acceptance criteria

1. Fake Packaging deterministically produces an independently validated eight-page Plan and Artifact from exact current Approved Research, plus exact current Confirmed Opinion only in Creator-led mode.
2. Research-based content carries no Opinion dependency or fabricated first-person position.
3. The owner can independently review title fields, cover fields, pages, Caption, CTA, and hashtags; edit and reorder pages; checkpoint an immutable Version; and approve only its exact current eligible candidate.
4. Validation checks schema, page count/identity/order/purpose, unique page content, density, Caption complementarity, citations, exact eligible dependencies, and mode-specific Opinion provenance.
5. Public references and internal provenance cannot be rewritten through ordinary editing and are revalidated at Approval.
6. Upstream Research or Opinion changes yield visible Outdated state without deleting historical Versions; stale content cannot silently enter G4.
7. Owner isolation, archive denial, refresh persistence, malformed output/input denial, and concurrent request idempotency are covered proportionally.
8. One Browser scenario proves Approved Research → confirmed Opinion → explicit Mode → Packaging → field/provenance review → edit/reorder → checkpoint → exact Approval → `post.md` and `pages.json` download.
9. Both portable files contain the exact Approved Artifact/Version identity; owner mismatch and Outdated state deny export.

## Tests

- focused Core and contract tests;
- Node 24 root `corepack pnpm check`;
- full isolated `corepack pnpm test:integration`;
- full pinned-Chromium `corepack pnpm test:browser`;
- `corepack pnpm repository:check` and `git diff --check`;
- independent merge review, first eligible quality/Integration/Browser CI, and squash merge.

## Security, migration, and documentation

Owner scope and active-package checks remain API-owned. Raw Fake Provider output stays server-side. Human Opinion stays private and is never copied to public references. The migration is additive. Update AGENTS, README, Roadmap, browser quality truth, JSON Schema, and this Packet. No new DEC is required.

## Completion report

### Summary

The bounded G3 implementation is complete locally. It adds an independent deterministic Packaging Plan and eight-page Xiaohongshu text Artifact, static versioned Platform Profile, explicit Creator-led and Research-based modes, structured editing and page reordering, immutable Versions, exact human Approval, dependency Outdated state, exact Approved-Version `post.md` / `pages.json` export, protected API, private Workspace UI, additive PostgreSQL persistence, and JSON Schema.

### Files and documentation

The candidate changes only G3-relevant Core, contracts, database/migration, API, Web, Integration/Browser tests, schema, AGENTS, README, Roadmap, browser-quality truth, and this Packet. It does not add Design, Render, images, image/ZIP Export, publishing, real Provider execution, credentials, or generic Agent infrastructure.

### Commands and tests

- focused Core/contracts: PASS — 2 files / 7 tests, including Chinese first-person denial, page uniqueness/density/Caption complementarity, exact foundation binding, corrected Research eligibility, and bounded long-input condensation;
- workspace typecheck: PASS;
- full isolated `corepack pnpm test:integration`: PASS — 29 files / 188 tests, including concurrent request idempotency, edit/reorder, immutable latest-Version truth, tampered provenance denial, exact Approval, portable exports, Outdated propagation, owner isolation, and archive denial;
- full pinned-Chromium `corepack pnpm test:browser`: PASS — 18/18, including explicit Mode selection, review fields, eight-page edit/reorder/checkpoint/Approval/refresh, and both portable downloads;
- final Node 24 root `corepack pnpm check`: PASS — format, lint, typecheck, 60 test files / 602 tests, and all five application builds;
- independent reviewer `/root/g3_final_re_review`: PASS — no merge blockers after two correction rounds; verified the original five findings, corrected-only Research, UTF-8-safe long-input condensation, exact Approved-Version export, and current Goal/document truth;
- `corepack pnpm repository:check`: PASS;
- `git diff --check`: PASS.

### Acceptance, security, and limitations

All nine local Acceptance Criteria are evidenced and independent review passed with no blockers. Owner and active-package boundaries remain API-owned; raw deterministic Provider output stays server-side; public references and page provenance are immutable through ordinary editing and revalidated at Approval. Export is an authorized read of only the current non-Outdated exact Approved Version. The Fake Provider is not real AI quality or production proof. First eligible PR CI, squash merge, and #293 closure remain pending and non-effective.

### DEC and Git status

No new DEC is required. The candidate remains uncommitted in the intended G3 branch until independent review passes.
