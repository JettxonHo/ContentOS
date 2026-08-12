# G4 — Text-first private MVP acceptance

**Status:** Publication Ready — acceptance, bounded corrections, and independent review passed; PR CI and merge pending
**Issue:** #295
**Goal:** `GOAL-MVP-TEXT-001`
**Reviewed build:** `main@dfdc84027e0c3d7ece2b155069d828f215309396` plus this bounded candidate diff; the exact PR head becomes the reviewed publication identity before merge

## Goal

Run one current-main acceptance of the private text-first path from supported Sources through reviewed Research and explicit Opinion/Research-based Mode to independently approved Blog and Xiaohongshu text exports, then publish the immutable M5 Acceptance Record required by DEC-295.

## In scope

- current-main Node 24 toolchain, root quality, isolated Integration, concurrent Integration, pinned-Chromium Browser, repository integrity, registry vulnerability, migration-generation, and diff evidence;
- the required small versioned Research Core Eval baseline with deterministic synthetic cases, reproducible results, Human Review, and zero real-Provider cost;
- the existing end-to-end browser journey and real API/PostgreSQL Integration evidence for exact Approval, provenance, Outdated propagation, owner isolation, duplicate requests, and eligible `article.md`, `post.md`, and `pages.json` exports;
- one immutable `M5 Acceptance Record 001` with required deliverables, test and demo results, security/documentation results, limitations, blocking defects, reviewer, decision, and timestamp;
- synchronization of Goal, AGENTS, English/Chinese README, and Roadmap to the reviewed decision; and
- one independent review, first eligible PR CI, and squash merge.

## Out of scope

Real or paid Provider calls, production deployment, Design, image generation, Renderer, image/ZIP packages, backup/restore, automatic publishing, new API/database/provider behavior, new migrations, typed Direct Quote Usage, and speculative post-MVP hardening. The only runtime correction allowed by the first review is the bounded existing Blog validator change needed to enforce already Accepted M4 first-person and Direct Quote rules.

## Relevant decisions and specifications

- DEC-295 and `GOAL-MVP-TEXT-001` define the text-first MVP boundary;
- M3–M5 and Milestone Acceptance Record requirements in `milestone-exit-criteria.md`;
- current Product, Architecture, Security, Test Strategy, and Release Gate specifications; and
- the merged G1–G3 Work Items and current code/tests on `main@dfdc84027…`.

## Contracts and allowed files

This Work Item changes no API, database Schema, Queue, migration, Provider, credential, authorization, or deployment contract. After independent review found an Accepted-rule gap, it may change `packages/core/src/publishing/blog.ts` and its test to enforce Research-based first-person denial and fail-closed Direct Quote handling; add `packages/testing/src/research-eval.test.ts` and `docs/quality/evals/research-core-v1.json`; add `docs/implementation/m5-acceptance-record-001.md`; and update only this Packet, `GOAL.md`, `AGENTS.md`, `README.md`, `README.zh-CN.md`, and `docs/implementation/roadmap.md` with observed evidence.

## Acceptance criteria

1. Node 24.18.0, pnpm 11.17.0, frozen install, and exact five-app/six-package workspace resolution pass on current main.
2. Root quality, full isolated Integration, concurrent Integration, pinned-Chromium Browser, repository integrity, official registry High/Critical audit, migration-generation no-diff, and final diff integrity pass.
3. The browser demo traverses owner login, supported Source creation/Approval, reviewed Research Approval, confirmed Human Opinion, independently generated/edited/checkpointed/approved Blog and Xiaohongshu Versions, and all three portable text downloads.
4. Deterministic evidence covers malformed Provider/input denial, English/Chinese Research-based first-person denial, fail-closed Direct Quote handling, duplicate request idempotency, exact dependency/provenance revalidation, Outdated propagation, owner/archive denial, refresh persistence, and safe M2 queue/recovery behavior. Worker interruption, cancellation, retry, and late Provider results are not applicable to the synchronous local Fake Provider path and are not inferred.
5. A versioned Research Core Eval Dataset, Configuration, Run, case results, Human Review, and Baseline reproduce with zero Critical Failures and zero Provider cost.
6. The Acceptance Record reports no unsupported production or real-Provider claim, records Fake Provider cost as zero, and names every remaining post-MVP limitation.
7. One independent reviewer approves the real implementation/documentation/evidence diff. First eligible PR quality, Integration, and Browser CI pass before squash merge.
8. Only the merge makes the M5 Passed decision, formal text-first MVP completion, Goal completion, and post-MVP M6 eligibility effective.

## Verification and documentation

Run the exact affected acceptance commands listed in the Completion Report. Reversible code, evidence, or documentation corrections stay in this Work Item and rerun affected evidence. Security tier is S1 validation hardening within an existing untrusted Working Copy boundary: it denies content that lacked accepted provenance, adds no access, storage, network, credential, or data category, and exposes no new information. No migration is added; `db:generate` must leave tracked schema/migration files unchanged. No new DEC is expected.

## Completion report

### Outcome

The current-main text-first acceptance and bounded review corrections passed. `M5 Acceptance Record 001` records the exact evidence, demo, accepted zero-cost Research Eval baseline, limitations, and Passed-on-publication decision.

### Files changed

The first independent review found two active product/evidence gaps plus stale README truth. This Work Item therefore also changes only the Blog validator/test, one Research Eval test and versioned manifest, and authorized Goal/current-truth/governance documentation. No API, database, schema, migration, queue, provider, credential, or runtime-configuration contract changed.

### Verification

- Node `v24.18.0`, pnpm `11.17.0`, frozen install, exact workspace: PASS;
- focused Blog/Research Eval corrections: PASS — 2 files / 7 tests;
- root quality after corrections: PASS — 61 files / 605 tests and five builds;
- Integration after corrections: PASS — 29 files / 188 tests;
- Concurrent Integration: PASS — two children, isolation and cleanup verified;
- Browser: PASS — 18/18, including the complete dual-output demo and three downloads;
- migration generation: PASS — no diff;
- repository integrity and official registry High/Critical audit: PASS;
- final documentation formatting, repository, and diff checks follow composition and review.

### Security / migration impact

S1 bounded validation hardening in the existing Blog Working Copy/Approval path. Research-based English/Chinese first-person content and the finite prohibited Direct Quote syntax set are rejected before checkpoint/Approval; no typed Quote Usage, bypass, new data, privilege, network, secret, or migration is added. The tested implemented boundary and registry audit passed.

### Limitations and incomplete items

Real Provider execution, production, Design/Render, rich package, backup/restore, typed Evidence-bound Direct Quote support, and automatic publishing remain unclaimed post-MVP work. First eligible PR CI, squash merge, Issue #295 closure, and effective Goal completion remain pending. Final independent reviewer `/root/g4_mvp_acceptance_review` returned PASS with no blocking findings.

### Git status

Expected bounded candidate diff: Blog validator/test, Research Eval executable/data, Acceptance Record, Work Packet, Goal, AGENTS, both READMEs, and Roadmap only. No API/database/schema/migration/queue/provider/config file changes. No commit, push, or PR exists before final independent review.
