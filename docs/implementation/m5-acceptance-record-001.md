# M5 Acceptance Record 001

**Record status:** Passed — effective when this exact reviewed record is published on `main`
**Milestone ID:** M5 — Xiaohongshu Text and Text-first Private MVP
**Reviewed build:** `main@dfdc84027e0c3d7ece2b155069d828f215309396` plus the bounded G4 candidate diff listed in its Work Packet; exact PR head and CI identity are recorded before merge
**Work Item:** [G4 / Issue #295](https://github.com/JettxonHo/ContentOS/issues/295)
**Timestamp:** 2026-08-13T05:20:15+08:00

## Required deliverables

Passed locally. The reviewed build provides the complete private text-first path defined by DEC-295:

- exact owner-scoped Approved Source Versions feed reviewed, evidence-bound Research;
- the owner can confirm the minimum Human Opinion or explicitly choose Research-based Mode;
- Blog and Xiaohongshu are generated independently from the shared Approved Content Foundation through deterministic Fake Providers;
- each output has an editable Working Copy, immutable checkpoint Versions, exact human Approval, dependency-aware Outdated state, public References, and internal Provenance; and
- only the current eligible exact Approved Blog and Xiaohongshu Versions export portable `article.md`, `post.md`, and `pages.json` files with Artifact/Version identity.

The Xiaohongshu branch uses a static versioned Platform Profile, an eight-page Packaging Plan, separate Platform/Cover title fields, Page Purpose, emphasis, density, visual brief, Caption complementarity, CTA, hashtags, direct editing/order, first-person rules, exact dependency validation, and an Approval validation summary.

## Test results

| Evidence                                                                       | Result                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node / pnpm identity                                                           | Passed: Node `v24.18.0`; pnpm `11.17.0`.                                                                                                                                                                                                                                                                                                                                                       |
| `corepack pnpm install --frozen-lockfile`                                      | Passed for all 12 workspace projects; lockfile unchanged.                                                                                                                                                                                                                                                                                                                                      |
| `corepack pnpm workspace:check`                                                | Passed: exactly five applications and six packages resolve under Node 24.18.0.                                                                                                                                                                                                                                                                                                                 |
| `corepack pnpm check`                                                          | Passed after review corrections: formatting, lint, strict typecheck, 61/61 unit files with 605/605 tests, and all five application builds.                                                                                                                                                                                                                                                     |
| `corepack pnpm test:integration`                                               | Passed after review corrections: 29/29 files and 188/188 tests in 117.42 seconds. It covers the real API/PostgreSQL boundary, duplicate generation idempotency, tampered dependency denial, immutable approved-versus-latest export truth, Outdated propagation, owner/archive denial, and all three portable outputs. The existing `pg` concurrent-query deprecation warning was non-failing. |
| `corepack pnpm test:integration:concurrent`                                    | Passed: `children=2 isolation=verified cleanup=verified`.                                                                                                                                                                                                                                                                                                                                      |
| `corepack pnpm test:browser`                                                   | Passed: 18/18 pinned-Chromium scenarios in 1.6 minutes. The current end-to-end demo traverses supported Source intake/Approval, Research review/Approval, Human Opinion confirmation, explicit output modes, independent Blog and Xiaohongshu edit/checkpoint/Approval, refresh persistence, reviewable provenance, and `article.md` / `post.md` / `pages.json` downloads.                     |
| G3 first eligible PR CI, run `31640699198`                                     | Passed on the exact G3 implementation head: Change scope 3s, Docker-independent quality 2m24s, Integration 3m07s, Browser 2m30s; squash `dfdc84027…` is current main.                                                                                                                                                                                                                          |
| `corepack pnpm db:generate`                                                    | Passed: 40-table schema produced no migration or schema diff.                                                                                                                                                                                                                                                                                                                                  |
| `corepack pnpm repository:check`                                               | Passed: documentation links, Decision integrity, and bounded Secret checks.                                                                                                                                                                                                                                                                                                                    |
| `corepack pnpm --registry=https://registry.npmjs.org audit --audit-level=high` | Passed: `No known vulnerabilities found`.                                                                                                                                                                                                                                                                                                                                                      |
| Research Core Eval baseline v1                                                 | Passed and independently accepted: versioned Core Dataset with two synthetic cases, Configuration, reproducible Run, per-case grounding/coverage/structure Metrics, zero Critical Failures, zero Provider cost, Human Review, and accepted Baseline.                                                                                                                                           |
| Blog active-flow correction evidence                                           | Passed: Research-based Blog rejects English and Chinese first-person claims; the defined finite direct-quote syntax set (Markdown/HTML blockquotes and common ASCII/English/Chinese paired quote forms) fails closed until typed exact-Evidence quote usage is implemented. Focused Blog/Eval evidence and the full root, Integration, and Browser gates passed.                               |
| `git diff --check`                                                             | Passed before Acceptance Record composition; the final documentation diff receives the same closeout check and PR verification.                                                                                                                                                                                                                                                                |

Deterministic unit and Integration evidence also rejects malformed Provider/input output, duplicate/dense Xiaohongshu pages, Caption repetition, English/Chinese first-person Research-based claims, rewritten References/Provenance, stale Approval, wrong-owner access, and Outdated export. Source/Workflow evidence preserves duplicate delivery, lease recovery, late-result fencing, private notification/Polling recovery, and owned cleanup.

## Demo result

Passed. The current-main Browser demo signs in the private owner, creates and approves a supported Source, generates and reviews evidence-bound Research, checkpoints and approves its exact Version, confirms a Human Opinion, generates Blog and Xiaohongshu independently, edits both Working Copies, checkpoints and approves exact immutable Versions, reviews structured Xiaohongshu fields and Provenance, downloads `article.md`, `post.md`, and `pages.json`, refreshes, and observes the Approved state and saved content.

The real API/PostgreSQL Integration run supplements the visible demo with exact exported Artifact/Version identity, approved-versus-newer-unapproved truth, dependency tamper denial, Outdated export denial, owner isolation, archived-package denial, and duplicate-request idempotency.

## Security results

Passed for the implemented private MVP boundary. Current executable evidence covers private Sessions, owner Authorization on protected reads/writes/exports, `.md`/`.txt` Source containment, SSRF and transport controls, bounded/validated external and Provider input, Raw Output separation, Secret/error redaction, API-owned mutations, exact human Approval, immutable Versions, Provenance binding, stale/duplicate-result fencing, and owned integration cleanup. The G4 correction hardens the existing Blog boundary by rejecting unproven Research-based first-person language and the finite direct-quote syntax set (Markdown blockquote, raw HTML blockquote, ASCII double, English curly single, Chinese curly double, corner, and white-corner quotes) until typed Evidence-bound Quote Usage exists. The official registry reported no known High or Critical vulnerability. No production credential, paid Provider, platform account, public sharing, rendering, or automatic publishing boundary was exercised or claimed.

## Documentation results

Documentation synchronizes `GOAL.md`, `AGENTS.md`, both READMEs, the Roadmap, the accepted Research Eval baseline, this Acceptance Record, and the G4 Work Packet. Repository integrity and final independent review passed; final static checks and first eligible PR CI remain before merge.

## Known limitations

- Research, Blog, and Xiaohongshu generation use deterministic local Fake Providers. Real Provider credentials and paid calls were not authorized; Provider cost was exactly zero.
- The formal MVP is private, single-user, desktop-first, and local/tested. It is not production deployment proof.
- Design, image generation, Renderer, image/ZIP packages, automated publishing, backup/restore, monitoring, and production operations are post-MVP.
- The current Fake Provider calls are synchronous. Worker interruption, Provider-task cancellation/retry, and late asynchronous Provider results are not applicable to this path; the existing M2 Queue/lease/late-result recovery remains independently tested.
- Blog direct quotes are deliberately rejected until a later bounded Work Item introduces typed Direct Quote Usage with exact Evidence and public attribution; ordinary paraphrase plus References remains supported.
- The non-failing `pg` concurrent-query deprecation warning remains technical debt.

## Blocking defects

None found in the current-main acceptance run.

## Reviewer

`/root/g4_mvp_acceptance_review` — `INDEPENDENT_REVIEWER` — **PASS, no blocking findings** on the final targeted review. The initial review requested Blog Chinese first-person/direct-quote enforcement, a formal Research Eval baseline, and complete README Current-truth; an intermediate targeted review narrowed the remaining work to the finite quote set and truthful candidate governance. All findings were corrected and the reviewer independently reran the focused Blog/Eval evidence (2 files / 7 tests). The implementation/acceptance agent did not approve its own decision.

## Decision

**Passed — effective on main publication.** The reviewed current-main implementation and acceptance evidence satisfy M3, M4, and M5 exit requirements and contain no active-flow Blocking Defect. First eligible PR CI and squash merge remain; when this exact reviewed record is present on `main`, that merge makes this decision effective, completes `GOAL-MVP-TEXT-001`, marks the formal text-first private MVP Completed, and makes post-MVP M6 eligible. It does not authorize real Provider use, production deployment, Design/Render work, or automatic publishing.
