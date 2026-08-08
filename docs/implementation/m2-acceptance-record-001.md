# M2 Acceptance Record 001

| Field                 | Value                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                | Blocked                                                                                                                                                                                          |
| Milestone             | M2 — Source and Workflow Foundation                                                                                                                                                              |
| Reviewed Commit       | `c64fe74ab27513b07a2eb95e86c8f55b90245923`                                                                                                                                                       |
| Work Item and Issue   | `M2-GOV-005 — M2 Exit Review and Acceptance Record 001` ([Issue #137](https://github.com/JettxonHo/ContentOS/issues/137))                                                                        |
| Execution date        | 2026-08-08                                                                                                                                                                                       |
| Execution timestamp   | `2026-08-08T19:01:49+08:00`                                                                                                                                                                      |
| Logical reviewer role | `M2_EXIT_REVIEW_ORCHESTRATOR`                                                                                                                                                                    |
| Requested model       | `gpt-5.6-sol`                                                                                                                                                                                    |
| Reasoning             | High                                                                                                                                                                                             |
| Thread                | `/root`                                                                                                                                                                                          |
| Actual runtime status | `UNVERIFIED_RUNTIME_MODEL`                                                                                                                                                                       |
| Independent review    | PASS — `/root/m2_gov_005_record_review` and `/root/m2_gov_005_scope_review`; both logical role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` / High, Actual Runtime `UNVERIFIED_RUNTIME_MODEL` |
| Decision              | Blocked; M2 remains In Progress and M3 remains Not Started                                                                                                                                       |

---

## 1. Review identity and immutable scope

This record independently evaluates the complete M2 Source and Workflow Foundation on exact reviewed commit `c64fe74ab27513b07a2eb95e86c8f55b90245923`. That commit is the latest `origin/main` produced by the squash merge of [PR #138](https://github.com/JettxonHo/ContentOS/pull/138), and its single parent is `220bffc66b50184022fae1dcf8c6b9976e523e2f`.

The review changes no product, test, dependency, lockfile, configuration, Schema, migration, Compose, CI, API, or runtime behavior. The only publication files are this record, the M2-GOV-005 Work Packet, `AGENTS.md`, both README files, and the Roadmap. The decision is limited to `Passed` or `Blocked`; there is no Conditional Pass.

## 2. Required deliverables

| Deliverable                                               | Result  | Evidence                                                                                                                                                                                                                |
| --------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source input and review foundation                        | Passed  | Pasted Text, `.md`, `.txt`, and controlled URL paths create owner-scoped Source graphs; Working Copies are mutable, Versions immutable, and human Approval binds the exact current Review Candidate Version.            |
| URL capture and Fetcher boundary                          | Passed  | API-owned Command/Task/Outbox/Gateway/Result state, controlled public transport, immutable Snapshot writing, deterministic Candidate extraction, and Queue-to-Gateway orchestration pass unit and integration evidence. |
| Workflow delivery and recovery                            | Passed  | PostgreSQL remains authoritative across Outbox recovery, missing-Redis-Job repair, claim/lease fencing, terminal redelivery, and duplicate-delivery tests.                                                              |
| Owner Workflow projection, Timeline, and browser recovery | Passed  | Owner-scoped REST projection and bounded safe Timeline remain authoritative; notification-only SSE, refresh, disconnect, and five-second Polling recovery pass browser evidence.                                        |
| Approved-only downstream input                            | Passed  | The internal projection returns only exact current human-Approved Source Versions; it creates no Research readiness, Frozen Input, Agent, execution, or synthetic Approval.                                             |
| M2 acceptance harness and reproducible evidence           | Passed  | Root checks, 27-file/184-test integration, two complete concurrent integration children, and 16 browser scenarios pass.                                                                                                 |
| Dependency security gate                                  | Blocked | Both official-registry audits report one High advisory for `nanoid@3.3.16` under GHSA-2v37-7h3g-55p8. The production path is `@contentos/web > next > postcss > nanoid`. No ignore or suppression was used.             |
| Immutable acceptance decision and next action             | Passed  | This record retains the failure without modifying implementation and opens bounded remediation [Issue #139](https://github.com/JettxonHo/ContentOS/issues/139).                                                         |

## 3. Common Exit Criteria

| Common criterion                                | Result  | Evidence                                                                                                                                                                                       |
| ----------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required deliverables                           | Blocked | All M2 capability deliverables pass, but the required dependency security gate is not satisfied.                                                                                               |
| Demonstrable capability                         | Passed  | The authenticated browser journey preserves URL failure, creates an independent fallback Source, saves and versions review content, approves the exact candidate, and recovers Timeline state. |
| Verified Acceptance Criteria and required tests | Blocked | Deterministic, integration, concurrent, browser, migration-generation, repository, and exact-SHA CI evidence passes; both required audit commands exit 1.                                      |
| Security Review                                 | Blocked | SSRF, upload quarantine, owner scope, Secret containment, safe Snapshot display, and private Fetcher boundaries pass executable evidence, but one High dependency advisory remains.            |
| Synchronized documentation                      | Passed  | The staged six-file publication is designed to keep this Work Item Completed — Exit Review Blocked, M2 In Progress, M3 Not Started, and the remediation path explicit.                         |
| Evidence Record                                 | Passed  | This record fixes the reviewed commit, commands, counts, CI jobs, milestone matrix, limitation, Blocking Defect, decision, and required next action.                                           |
| No unresolved Blocking Defect                   | Blocked | GHSA-2v37-7h3g-55p8 affects the reviewed dependency graph at High severity.                                                                                                                    |

## 4. M2 Exit Criteria evidence matrix

The capability-specific M2 criteria pass on the reviewed commit. They do not override the separate High-advisory Blocking Defect.

| M2 criterion                           | Result | Reproducible evidence                                                                                                                                                                                                                     |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSRF denial                            | Passed | Integration runs the unmodified Worker and Fetcher processes and rejects loopback with `VALIDATION_BLOCKED`, no Source, Snapshot, or task-attempt object; focused unit transport tests reject restricted IP literals before connection.   |
| Upload Quarantine                      | Passed | Browser proves Pasted Text, `.md`, and `.txt` formal input; integration denies every quarantine violation with stable categories and zero Object Storage side effect.                                                                     |
| Raw Snapshot / Safe Display separation | Passed | Integration proves immutable raw HTML bytes differ from normalized Working Copy/Version text. Raw bytes are never rendered; the deterministic review representation is non-executable plain text, not a separate entity or HTML renderer. |
| Approved Source Version                | Passed | Human confirmation binds one exact immutable current Version; `source_review` remains `awaiting_human` and Approval creates no Workflow transition or synthetic Event.                                                                    |
| URL failure fallback                   | Passed | Browser keeps the failed URL capture visible and creates an independent Pasted Text primary Source without retrying or manufacturing URL success.                                                                                         |
| Duplicate Queue protection             | Passed | Terminal redelivery and stale generation evidence leave exactly one Result, Source, Snapshot, Working Copy, Head, Version, Approval, terminal Event, and promotion.                                                                       |
| Outbox recovery                        | Passed | PostgreSQL Outbox dispatch recovers an expired dispatch lease with the same generation and rejects the stale owner; Redis remains delivery transport rather than truth.                                                                   |
| Redis-loss reconciliation              | Passed | Worker integration repairs a missing current BullMQ Job from the PostgreSQL Task/Outbox authority while preserving the exact fixed envelope.                                                                                              |
| Lease recovery                         | Passed | Expired claims advance one bounded delivery generation, fence stale claim/result replay, and do not promote stale or duplicate evidence.                                                                                                  |
| Workflow Timeline                      | Passed | Owner-scoped REST reads return a bounded ascending deduplicated safe Event Timeline, including cursor-based load-more behavior.                                                                                                           |
| SSE fallback                           | Passed | Native credentialed EventSource receives only change notification; refresh, forced disconnect, and Polling recovery re-read authoritative REST state.                                                                                     |
| Approved-only Research input           | Passed | Internal current-Approved Source projection returns exact current Approved Version bodies in stable order only; no Research Agent, Frozen Input, readiness decision, or Research execution exists.                                        |

## 5. Commands, counts, and results

All commands ran from a branch whose pre-publication `HEAD` equalled the Reviewed Commit and whose tracked/untracked status was empty. Node 24 was selected from the repository-configured local runtime before every pnpm command.

| Command or check                                                                      | Exit | Result                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --version`                                                                      | 0    | `v24.18.0`.                                                                                                                                                                                                                              |
| `corepack pnpm --version`                                                             | 0    | `11.17.0`.                                                                                                                                                                                                                               |
| `corepack pnpm install --frozen-lockfile`                                             | 0    | All 12 workspace projects were already up to date; lockfile and worktree unchanged.                                                                                                                                                      |
| `corepack pnpm workspace:check`                                                       | 0    | Five applications and six packages resolved under Node `v24.18.0`.                                                                                                                                                                       |
| `corepack pnpm check`                                                                 | 0    | Formatting, lint, strict TypeScript, 53 unit test files / 485 tests, and all five application builds passed. An initial sandbox-limited attempt hit `spawn EPERM`; the exact command passed outside that process-inspection restriction. |
| `corepack pnpm repository:check`                                                      | 0    | Markdown links, DEC-001–DEC-294 continuity/references, and bounded high-confidence Secret scan passed before publication.                                                                                                                |
| `corepack pnpm test:integration`                                                      | 0    | 27 files / 184 tests passed in 115.11 seconds; the existing `pg` client-query deprecation warning was non-failing.                                                                                                                       |
| `corepack pnpm test:integration:concurrent`                                           | 0    | Two complete token-owned child runs executed the same 27-file / 184-test integration suite and verified distinct runtime state, credentials, cleanup ownership, and zero claimed residue.                                                |
| `corepack pnpm test:browser`                                                          | 0    | 16/16 pinned-Chromium tests passed in 1.1 minutes.                                                                                                                                                                                       |
| First `corepack pnpm db:generate` and status proof                                    | 0    | Drizzle inspected 19 tables, reported no schema change, and the immediate tracked/untracked status was empty.                                                                                                                            |
| Second `corepack pnpm db:generate` and status proof                                   | 0    | Drizzle again inspected 19 tables, reported no schema change, and the immediate tracked/untracked status was empty.                                                                                                                      |
| `corepack pnpm --registry=https://registry.npmjs.org audit --audit-level high`        | 1    | Blocked: one High advisory, GHSA-2v37-7h3g-55p8, through Vitest/Vite/PostCSS and Next/PostCSS paths.                                                                                                                                     |
| `corepack pnpm --prod --registry=https://registry.npmjs.org audit --audit-level high` | 1    | Blocked: the same High advisory remains on the production Next/PostCSS path.                                                                                                                                                             |
| `git diff --check`                                                                    | 0    | Passed before publication.                                                                                                                                                                                                               |
| Staged six-file publication checks                                                    | 0    | Passed after staging exactly the six allowed publication files: cached name-status, cached diff check, format check, documentation links, repository integrity, Secret scan, and final diff check.                                       |

The audit commands created one repository-root task-owned pnpm store database. It was identified as the only untracked state, removed immediately, and the repository returned to an empty tracked/untracked status before publication editing. No audit cache remains in the repository.

## 6. Migration and no-diff generation evidence

- The integration harness applies committed migrations to isolated empty and upgrade databases and passed all migration assertions within the 184-test suite.
- Both explicit Drizzle generation passes resolved the same 19-table schema and printed `No schema changes, nothing to migrate`.
- `git status --short --untracked-files=all` was empty immediately after each generation pass.
- No Schema, migration, Drizzle configuration, dependency, or lockfile file is changed by this publication.

## 7. Security and dependency audit results

Executable evidence passes for owner Authorization, private Sessions, SSRF denial, upload quarantine, no-side-effect denial, Secret redaction, safe non-executable review text, immutable Snapshot integrity, Fetcher-only Redis/Object Storage identities, API-owned Task/Source mutation, and no direct Fetcher PostgreSQL access.

The official registry results block acceptance:

| Audit scope | Critical | High | Affected package | Installed | Patched    | Advisory                                                                 |
| ----------- | -------- | ---- | ---------------- | --------- | ---------- | ------------------------------------------------------------------------ |
| Full graph  | 0        | 1    | `nanoid`         | `3.3.16`  | `>=3.3.17` | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) |
| Production  | 0        | 1    | `nanoid`         | `3.3.16`  | `>=3.3.17` | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) |

No ignore, suppression, severity reclassification, registry substitution, or dependency change was used. The Blocked review does not evaluate exploitability as a substitute for the accepted zero-High gate.

## 8. Recovery, Workflow, SSE, and Queue evidence

- The authenticated end-to-end integration path runs API Command → PostgreSQL Task/Outbox → Worker → fixed BullMQ envelope → Fetcher Claim/Heartbeat/capture/Result → immutable Snapshot/Source/Version/Approval → approved-input and Workflow REST reads.
- Duplicate, stale-generation, terminal-redelivery, late-result, stale-claim, and expired-lease paths cannot create a second Result or promotion.
- Outbox and Redis-loss repair start from PostgreSQL authority; Queue contents do not become Workflow truth.
- Workflow projection and Timeline reads are owner-scoped and bounded. SSE carries notification only, and browser refresh/Polling always re-read REST state.
- The concurrent harness completed two authenticated token-distinct children and verified exact claimed cleanup. No `contentos-smoke-*` container, network, or volume remained.
- Process inspection found only pre-existing orphan ContentOS processes started before this review; none was created during the 2026-08-08 acceptance execution. They were not token-attributable to this review and were not signalled or deleted.

## 9. Demo and browser evidence

The formal M2 browser scenario passed inside the 16-test suite. It authenticates the owner, preserves a failed URL capture, creates an independent manual fallback Source, reviews and saves a normalized Working Copy, creates and selects immutable Versions, confirms the exact current Review Candidate, observes the bounded Timeline, refreshes the page, forces SSE disconnect, and proves Polling recovery from authoritative REST/PostgreSQL state.

The browser never renders raw Snapshot HTML, invents URL success, advances `source_review` through Approval, appends a synthetic Approval Timeline Event, exposes archived Package review commands, or claims Research/Agent behavior.

## 10. Documentation, traceability, and exact-SHA CI evidence

The main M2 delivery sequence is fixed below. Full SHAs were checked through GitHub merge metadata.

| Work Item       | Issue                                                     | PR                                                      | Squash SHA                                 |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| `M2-SRC-001`    | [#39](https://github.com/JettxonHo/ContentOS/issues/39)   | [#40](https://github.com/JettxonHo/ContentOS/pull/40)   | `1a50d2d67c2d293a5cee907c17a8c458a168ce74` |
| `M2-SRC-002`    | [#41](https://github.com/JettxonHo/ContentOS/issues/41)   | [#42](https://github.com/JettxonHo/ContentOS/pull/42)   | `3f418bf06f195ea2ab344d7532c9f1931f162a55` |
| `M2-WF-001`     | [#53](https://github.com/JettxonHo/ContentOS/issues/53)   | [#55](https://github.com/JettxonHo/ContentOS/pull/55)   | `8ec67ae21cf6bd5bd0b30462f299d3fbcde8cb12` |
| `M2-WF-002`     | [#58](https://github.com/JettxonHo/ContentOS/issues/58)   | [#60](https://github.com/JettxonHo/ContentOS/pull/60)   | `3928b55ca371fd80f93be75baa694f12e45913b6` |
| `M2-WF-003A`    | [#65](https://github.com/JettxonHo/ContentOS/issues/65)   | [#69](https://github.com/JettxonHo/ContentOS/pull/69)   | `3211c29ef8e6a934e6473a4f92caf36d8593abc3` |
| `M2-WF-003B`    | [#71](https://github.com/JettxonHo/ContentOS/issues/71)   | [#73](https://github.com/JettxonHo/ContentOS/pull/73)   | `c9c92b70a0ccd99be944107120f03dd3a1776da3` |
| `M2-WF-003C`    | [#75](https://github.com/JettxonHo/ContentOS/issues/75)   | [#77](https://github.com/JettxonHo/ContentOS/pull/77)   | `ed428b1c12eb6e2ce01d964d56c05a09a3ba87d1` |
| `M2-SRC-003`    | [#80](https://github.com/JettxonHo/ContentOS/issues/80)   | [#82](https://github.com/JettxonHo/ContentOS/pull/82)   | `6b6e4a0f2c180093db6e76090ab14b831e5631f6` |
| `M2-FETCH-001A` | [#91](https://github.com/JettxonHo/ContentOS/issues/91)   | [#92](https://github.com/JettxonHo/ContentOS/pull/92)   | `551217c130f6717f4b8891ce76de1fa124bf8ee0` |
| `M2-FETCH-001B` | [#94](https://github.com/JettxonHo/ContentOS/issues/94)   | [#96](https://github.com/JettxonHo/ContentOS/pull/96)   | `9b28068eb3ed266973f77bcdffe6c08776b2086c` |
| `M2-FETCH-001C` | [#98](https://github.com/JettxonHo/ContentOS/issues/98)   | [#100](https://github.com/JettxonHo/ContentOS/pull/100) | `4fe20a48a02b83ec68886bae68b86f5e65ba3895` |
| `M2-SRC-004`    | [#102](https://github.com/JettxonHo/ContentOS/issues/102) | [#104](https://github.com/JettxonHo/ContentOS/pull/104) | `d2ec063743681b64f0406b4903805700bd9866e3` |
| `M2-WF-004A`    | [#106](https://github.com/JettxonHo/ContentOS/issues/106) | [#108](https://github.com/JettxonHo/ContentOS/pull/108) | `acdb971ffd8a1c8898666182ac017817f095e1b7` |
| `M2-WF-004B`    | [#110](https://github.com/JettxonHo/ContentOS/issues/110) | [#112](https://github.com/JettxonHo/ContentOS/pull/112) | `d9460747c530797dc11c341374183ad57e7fa85e` |
| `M2-WEB-001A`   | [#116](https://github.com/JettxonHo/ContentOS/issues/116) | [#118](https://github.com/JettxonHo/ContentOS/pull/118) | `58d2e8ca1f80d0ea03ef991aa22f40c3b058c25c` |
| `M2-WEB-001B`   | [#120](https://github.com/JettxonHo/ContentOS/issues/120) | [#122](https://github.com/JettxonHo/ContentOS/pull/122) | `9af5f68b8846ab172bff7599657c9409faed85c4` |
| `M2-QUAL-001`   | [#124](https://github.com/JettxonHo/ContentOS/issues/124) | [#126](https://github.com/JettxonHo/ContentOS/pull/126) | `4ee1911c69d9ad55bbb34a3729be3cd3d9625f23` |
| `M2-QUAL-002`   | [#129](https://github.com/JettxonHo/ContentOS/issues/129) | [#130](https://github.com/JettxonHo/ContentOS/pull/130) | `cc0445159a210e2d60c6abdda132480383b38d82` |
| `M2-MAINT-001`  | [#95](https://github.com/JettxonHo/ContentOS/issues/95)   | [#131](https://github.com/JettxonHo/ContentOS/pull/131) | `fea08d03eb1c4303f5ae65e6e3fea6c289a44023` |
| `M2-DOC-001`    | [#133](https://github.com/JettxonHo/ContentOS/issues/133) | [#135](https://github.com/JettxonHo/ContentOS/pull/135) | `9546010bd030b08e1ce56048c5dd151ec5b4e06c` |

The accepted M2 design/governance chain is also present in the reviewed commit: M2-DES-001 through M2-DES-005, M2-DES-006, M2-DES-007, M2-GOV-001 through M2-GOV-004, status synchronization [PR #136](https://github.com/JettxonHo/ContentOS/pull/136) at `220bffc66b50184022fae1dcf8c6b9976e523e2f`, and the Ready M2-GOV-005 Work Packet in [PR #138](https://github.com/JettxonHo/ContentOS/pull/138) at the Reviewed Commit.

GitHub Actions run [31253489476](https://github.com/JettxonHo/ContentOS/actions/runs/31253489476) completed successfully for exact Reviewed Commit `c64fe74ab27513b07a2eb95e86c8f55b90245923`:

- [Docker-independent quality](https://github.com/JettxonHo/ContentOS/actions/runs/31253489476/job/93093319849): success;
- [Integration smoke (Docker)](https://github.com/JettxonHo/ContentOS/actions/runs/31253489476/job/93093319855): success; and
- [M1/M2 browser smoke (Chromium)](https://github.com/JettxonHo/ContentOS/actions/runs/31253489476/job/93093319867): success.

The six publication files keep M2 In Progress, complete M2-GOV-005 as an Exit Review Blocked record, keep M3 Not Started, and identify remediation #139. No M3 Work Item or capability is created.

## 11. Known limitations

- M2 delivers formal Source and Workflow foundations, not the formal MVP. Research, Agent Runtime, Human Opinion, Blog/Xiaohongshu generation, Design, Render, Export, publishing, deployment, and M3 remain absent.
- SSE is notification-only and cannot reconstruct Workflow state; REST/PostgreSQL remain authoritative by design.
- Approved Source input projection is an internal current-Approved Version read, not Research readiness, Frozen Input, or execution.
- Existing orphan ContentOS processes and the shared external Playwright output bookkeeping predate or fall outside token-owned acceptance-run capsules. This review did not terminate, delete, or claim unrelated state; no current-run Compose resource or process was left.

## 12. Blocking Defects

### BD-M2-001 — High dependency advisory in full and production graphs

Both required official-registry audits report GHSA-2v37-7h3g-55p8 against installed `nanoid@3.3.16`; the accepted patched floor is `3.3.17`. The full graph includes Vitest/Vite/PostCSS and Next/PostCSS paths, while the production graph retains the Next/PostCSS path. Each command exits 1 with one High advisory and zero Critical advisories.

This is a Blocking Defect under the Milestone Exit Criteria and M2-GOV-005. It cannot be renamed a Warning, ignored, suppressed, or repaired inside this publication diff. Remediation is bounded by [M2-MAINT-002 Issue #139](https://github.com/JettxonHo/ContentOS/issues/139), followed by the complete evidence set and a later numbered immutable M2 Acceptance Record.

## 13. Final decision and required next action

**Blocked**

M2-GOV-005 is **Completed — Exit Review Blocked**. M2 remains **In Progress**. M3 remains **Not Started**.

The required next action is to make M2-MAINT-002 Ready, remediate the High advisory without weakening any gate or changing product behavior, re-run the complete reviewed-build evidence set, and publish a later numbered M2 Acceptance Record. This record must remain immutable after publication. No new DEC is required for the bounded dependency remediation as currently defined.
