# M2 Acceptance Record 002

**Record status:** Candidate immutable record — independent review passed; PR CI and merge pending  
**Milestone ID:** M2 — Source and Workflow Foundation  
**Build / Commit:** `main@51e7341ab691d64e8d5c7c071b1b7262f8c863ed` plus the controlled-path one-line test-timeout correction recorded below  
**Work Item:** [G0 / Issue #144](https://github.com/JettxonHo/ContentOS/issues/144)  
**Timestamp:** 2026-08-13T00:33:03+08:00

## Required deliverables

Passed. The reviewed implementation provides private owner-scoped Source intake, quarantine and safe review, immutable Source Versions, exact human Approval, bounded URL capture, transactional Queue/Outbox/lease recovery, API-owned promotion, authoritative Workflow reads, notification-only SSE with Polling recovery, and the exact current-Approved Source projection required by the [M2 Exit Criteria](milestone-exit-criteria.md#12-m2-exit-criteria).

Research, Agent, Render, Export, Provider, deployment, backup/restore, public sharing, and publishing behavior are not M2 deliverables.

## Test results

| Evidence                                                                                                | Result                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fnm exec --using=24.18.0 node --version`                                                               | Passed: `v24.18.0`.                                                                                                                                                                               |
| `fnm exec --using=24.18.0 corepack pnpm --version`                                                      | Passed: `11.17.0`.                                                                                                                                                                                |
| `fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile`                                      | Passed for all 12 workspace projects; lockfile unchanged.                                                                                                                                         |
| `fnm exec --using=24.18.0 corepack pnpm workspace:check`                                                | Passed: five applications and six packages resolved with Node 24.18.0.                                                                                                                            |
| Initial `fnm exec --using=24.18.0 corepack pnpm check`                                                  | Failed: one 9 MiB gzip/decompression boundary test exceeded Vitest's default 5,000 ms timeout by approximately 25 ms; 53/54 files and 580/581 tests passed, and build was not reached.            |
| Focused corrected test                                                                                  | Passed: 1/1 in 432 ms. The only correction gives that resource-intensive test a 10,000 ms test timeout; its fixture, assertions, 8 MiB decoded limit, 20:1 ratio, and runtime code are unchanged. |
| Final `fnm exec --using=24.18.0 corepack pnpm check`                                                    | Passed: formatting, lint, strict typecheck, 54/54 unit files with 581/581 tests, and all five application builds.                                                                                 |
| `fnm exec --using=24.18.0 corepack pnpm test:integration`                                               | Passed: 27/27 files and 185/185 tests in 373.58 seconds. The existing `pg` concurrent-query deprecation warning was non-failing.                                                                  |
| `fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent`                                    | Passed: `children=2 isolation=verified cleanup=verified`.                                                                                                                                         |
| `fnm exec --using=24.18.0 corepack pnpm test:browser`                                                   | Passed: 16/16 pinned-Chromium tests in 2.1 minutes.                                                                                                                                               |
| `fnm exec --using=24.18.0 corepack pnpm repository:check`                                               | Passed: documentation links, Decision integrity, and bounded Secret checks.                                                                                                                       |
| `fnm exec --using=24.18.0 corepack pnpm --registry=https://registry.npmjs.org audit --audit-level=high` | Passed: `No known vulnerabilities found`.                                                                                                                                                         |
| `git diff --check`                                                                                      | Passed on the final candidate diff after publication editing.                                                                                                                                     |

The initial timeout was a reversible test-harness defect, not a product or security failure. It was diagnosed and corrected within G0 as Issue #144 permits, then the focused evidence and complete root quality gate were rerun. The failed attempt remains part of this record.

## Demo result

Passed. The formal browser journey authenticates the owner; preserves a failed URL capture; creates an independent Pasted Text fallback; reviews and saves a normalized Working Copy; creates, selects, and approves the exact immutable current Version; observes the bounded safe Timeline; refreshes; forces SSE disconnection; and recovers by Polling authoritative REST/PostgreSQL state. All 16 M1/M2 browser scenarios passed.

## Security results

Passed for the active M2 boundary. Executable evidence covers owner Authorization, private Sessions, `.md`/`.txt` quarantine, SSRF/redirect/TLS denial, bounded encoded/decoded input, Raw Snapshot versus safe display separation, Secret/error redaction, least-privilege Fetcher Redis/Object Storage identities, no Fetcher database access, API-owned state mutation, exact immutable Approval, stale/duplicate-result fencing, and owned integration cleanup. The official registry reports no known High or Critical vulnerability. No new security boundary was introduced.

## Documentation results

Passed for the candidate diff. `AGENTS.md`, `README.md`, `README.zh-CN.md`, `GOAL.md`, and the Roadmap are synchronized with this decision. Acceptance Record 001 remains unchanged as immutable historical evidence. Repository integrity passed before publication; the final candidate documentation checks remain part of PR verification.

## Known limitations

- M2 is a Source and Workflow foundation, not the text-first MVP. Research, Agent execution, Human Opinion, Blog, Xiaohongshu text, Export, Provider calls, Render, publishing, and deployment remain unimplemented.
- SSE is notification-only; REST/PostgreSQL remain authoritative.
- Source Approval intentionally does not transition `source_review` or append a synthetic Workflow Event.
- The Approved Source projection is an owner-scoped exact-Version input boundary, not Research readiness or execution.
- The existing `pg` client-query deprecation warning is non-failing technical debt and does not invalidate M2 behavior.

## Blocking defects

None.

## Reviewer

`/root/g0_m2_exit_independent_review`, acting as `INDEPENDENT_REVIEWER`, reviewed the corrected candidate diff and recorded evidence. Result: **Passed — no blocking findings**. The implementation agent did not approve its own work. PR CI and squash merge remain pending.

## Decision

**Passed, pending effect.** The fresh current-main evidence satisfies every M2 Exit Criterion and contains no Blocking Defect. This decision makes M2 Completed and M3 eligible only after required PR CI and squash merge. It does not start M3 or authorize Provider calls, production actions, or any deferred capability.
