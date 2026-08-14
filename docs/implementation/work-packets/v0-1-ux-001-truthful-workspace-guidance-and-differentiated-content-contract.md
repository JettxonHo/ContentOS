# V0.1-UX-001 — Truthful Workspace Guidance and Differentiated Content Contract

**Status:** Completed — PR #301 squash-merged after independent review and required CI
**Base:** `main@15a9b847db035d75da38ed94876bbbac727c477c`
**Branch:** `codex/v0-1-ux-001`

## Goal

Repair the two failure classes observed in bounded external V0 validation: make the existing human workflow truthful and actionable, and version a stronger external manual content contract without adding product-integrated Provider behavior.

## In Scope

- Derive client-only Workspace stage status and one primary next action from existing Source, Research, Opinion, Blog, and Xiaohongshu resources.
- Distinguish current Approved Versions, fresh review candidates, unsaved Working Copy edits, Outdated dependencies, loading, and read failure.
- Make Creator-led Opinion recovery explicit and keep Research-based creation free of personal-experience claims.
- Expose existing fresh Blog and Xiaohongshu candidate generation while preserving immutable history.
- Replace the generic Xiaohongshu Source-card layout with page navigation, one focused editor, and a read-only traceability disclosure.
- Add versioned external manual Blog/Xiaohongshu prompt and evaluation artifacts plus deterministic contract tests.

## Out of Scope

- Domain Core, public contracts, API controllers/services, persistence, migrations, Queue/Workflow/Agent Runtime, or M6.
- Changes to Fake Provider output, real Provider calls, credentials, cost, Adapter implementation, deployment, or product-data reset.
- Automated human Approval, public publishing, Issue/PR/merge actions, or postmerge reconciliation.

## Relevant DEC / Specifications

- DEC-295 text-first MVP boundary and proportional affected-path verification.
- [Artifact Versioning](../../architecture/artifact-versioning.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Vertical Slice Acceptance](../../quality/vertical-slice-acceptance.md)
- [Release Gates](../../quality/release-gates.md)
- The external V0.1 joint correction design at `/private/tmp/contentos-v0-exec-002/outputs/019ff929-6e43-75b2-8163-5303e90e43b9/ContentOS-V0.1-joint-correction-design.md` is implementation input, not a durable repository artifact.

## Contracts

- Presentation projection only: no new persisted Workflow, Artifact, or status truth.
- Existing Working Copy → immutable Version → exact human Approval semantics remain authoritative.
- Existing `generateBlog` and `generateXiaohongshu` client/API commands are reused; no endpoint or payload changes.
- External manual prompt patches may edit only the already editable fields and must preserve product-owned identity, dependency, Evidence, Provenance, References, Plan, and page metadata.
- Foundation Sufficiency requires a fact/claim, why it matters, a limit/tradeoff, and an actionable judgment. Insufficient foundation stops; it is not padded.

## Allowed Files or Modules

- `apps/web/components/workspace-client.tsx`
- `apps/web/components/research-review-panel.tsx`
- `apps/web/components/opinion-blog-panel.tsx`
- `apps/web/components/xiaohongshu-panel.tsx`
- `apps/web/components/source-review-panel.tsx` only for status refresh notification
- focused presentation helpers/tests under `apps/web/components` and `apps/web/lib`
- `apps/web/app/styles.css`
- affected Browser tests under `packages/testing/src/browser`
- deterministic Publishing contract test under `packages/testing/src`
- versioned artifacts under `docs/quality/evals`
- this Work Item and the bounded Roadmap entry

## Acceptance Criteria

1. The stage rail shows loading, Ready, In review, Approved, Outdated, or Blocked from existing authoritative reads; it never labels every stage Available.
2. An Outdated older Approved Version plus a fresh non-outdated Review Candidate presents In review.
3. Research visibly separates immutable Approved state from unsaved Working Copy changes.
4. Each authoring panel presents one visually primary next action and a human-readable disabled reason.
5. Research-based mode hides Human Opinion editing and explains its Approved Research basis without a personal-experience claim.
6. Creator-led Opinion presents Respond → Interpret → Review → Confirm; stale state retains the raw response, requires re-interpretation and human re-confirmation, and never auto-confirms. Current unchanged confirmation does not solicit a duplicate command.
7. Existing Blog and Xiaohongshu outputs can generate a fresh Candidate using current dependencies while preserving history.
8. Xiaohongshu uses eight-page navigation and one focused editor; traceability is read-only; title candidates are rendered once; Plan order remains the default; a 720px viewport has no horizontal overflow or vertical metadata collapse.
9. Covered command errors provide a precise recovery message instead of only generic failure copy.
10. Versioned Blog and Xiaohongshu prompt/eval artifacts enforce Foundation Sufficiency, 4–6 functionally distinct Blog sections plus exact `## References`, and eight role-distinct Xiaohongshu pages with exact existing IDs/order. Exact mode-specific first-person and confirmed-Opinion rules remain synchronized.
11. The artifacts explicitly do not change the current Fake Provider or prove product Provider integration.

## Verification

- Pure stage/action matrix tests, including old Approved Outdated + fresh Candidate = In review.
- Deterministic prompt/eval artifact contract test.
- Updated `m1-thin-slice`, `research-g1`, and `opinion-blog-g2` Browser coverage, including stale Opinion recovery and 720px Xiaohongshu layout.
- Node 24.18.0: focused tests during development, formatter/static checks, full Browser, repository check, and proportional Integration if the final diff exposes an integration gap.
- Desktop and 720px visual QA before commit.
- Code review of the final diff before commit; the repository's independent publication review passed before merge.

## Documentation Updates

- Add the two versioned prompt templates and one Publishing V0.1 evaluation contract under `docs/quality/evals`.
- Synchronize the Roadmap with this bounded V0.1 Work Item.

## Security / Migration Impact

S0 — no new boundary. The change makes owner-scoped existing state easier to interpret and maps existing safe error codes; it adds no external input channel, credential path, storage, schema, migration, or execution authority.

## Decision Review

No new DEC is expected. Stop for Decision Review if implementation would require a public contract, domain lifecycle, persistence, security boundary, Provider capability, or release-gate change.

## Local Implementation Evidence

- Node 24.18.0 root `check`: 63 test files / 617 tests passed; five application builds passed.
- Browser: 19/19 scenarios passed on the corrected implementation head, including confirmed-Opinion reload fidelity, explicit deferred-mode selection, stale Opinion recovery, and the 720px Xiaohongshu layout assertion.
- Publishing contract plus Workspace state/action matrix: 2 files / 12 focused tests passed.
- Repository integrity and `git diff --check`: passed.
- Visual QA: desktop and 720px screenshots showed a single focused page editor, readable 4×2 mobile navigation, normal horizontal metadata, and no horizontal overflow.
- Review: independent publication review found three bounded correctness issues across its initial and first corrected-head passes: confirmed Opinion displayed the pre-correction interpretation after reload, deferred mode was implicitly coerced to Research-based, and re-interpreting an updated response could redisplay the older confirmed statement. All three are corrected with focused Browser and projection regressions; final corrected-head independent re-review passed with no blocking findings.
- Provider attempts/cost: zero / ¥0.

## Publication Evidence

- PR [#301](https://github.com/JettxonHo/ContentOS/pull/301) was squash-merged.
- Required CI run [31765862087](https://github.com/JettxonHo/ContentOS/actions/runs/31765862087) completed with `Change scope`, `Docker-independent quality`, `Integration smoke (Docker)`, and `M1/M2 browser smoke (Chromium)` all successful.
- The effective PR #301 squash merge commit on `main` is `db32025f58c3ea977a3a04084435deba1c14caf2`.
- GitHub records `mergedAt=2026-08-14T03:11:50Z`.
