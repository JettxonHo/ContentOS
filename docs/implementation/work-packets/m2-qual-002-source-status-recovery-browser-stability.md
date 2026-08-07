# M2-QUAL-002 — Source Status Recovery Browser Stability

**Status:** Completed

**Issue:** [#129](https://github.com/JettxonHo/ContentOS/issues/129)

## Identification

- Task ID: `M2-QUAL-002`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Defect
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Logical Role: `IMPLEMENTATION_AGENT`
- Requested Model: `gpt-5.6-terra`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2qual002_implementation`
- Base SHA: `88f18884491e797071191788bc0e752fd60446ca`
- Risk: Browser-test evidence stability only

## Goal

Make the existing Source-status recovery browser evidence deterministic when an
accepted background Workflow refresh and a user-visible reload affordance race,
without changing product behavior or weakening the assertion.

## Context and root cause

PR #127 and PR #128 both failed the same Playwright step in
`m2-source-intake.spec.ts`: the test made an actionability click on `Reload
Source status` after releasing an intercepted read failure. The background
Workflow recovery may legitimately complete first, update authoritative Source
state, and remove that button. Playwright then observes the old element detach
and retries until the 60-second test timeout.

The accepted product behavior is correct: either the background refresh already
recovers the state, or the still-visible reload affordance can request it. The
test must observe those two valid orders without adding retry policy or changing
the Web runtime.

## Existing CI red evidence

- PR [#128](https://github.com/JettxonHo/ContentOS/pull/128), CI run
  [31177499917](https://github.com/JettxonHo/ContentOS/actions/runs/31177499917/job/92862675611),
  failed in `M1/M2 browser smoke (Chromium)` at
  `m2-source-intake.spec.ts:300`. The 2026-08-07 log shows the locator resolved
  to `Reload Source status`, became visible, enabled, and stable, then “element
  was detached from the DOM, retrying” until the 60-second test timeout.
- This Work Packet's pre-implementation record identifies PR #127 as the other
  reproduction. GitHub retains a successful final run for its merged head
  ([31175870711](https://github.com/JettxonHo/ContentOS/actions/runs/31175870711));
  its earlier red job is not available from the current PR checks, so it is
  recorded here as historical context rather than reasserted as independently
  retrieved log evidence.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered tests.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded defect and focused PR.
- [M2 Acceptance Harness](../../quality/m2-acceptance-harness.md)
- [M1 Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Test Strategy](../../quality/test-strategy.md)

## In scope

1. Change only the affected Playwright step so one DOM evaluation triggers the
   reload button if it still exists and does nothing if background recovery has
   already removed it.
2. Keep the following authoritative capacity assertion unchanged.
3. Preserve the later explicit reload scenarios in the same test.
4. Run the focused scenario repeatedly and the complete browser/quality gates.
5. Record the two failing CI runs and the final green evidence.

## Out of scope

- Web, API, Source, Workflow recovery, SSE, Polling, or UI behavior changes;
- increasing timeouts, enabling Playwright retries, skipping the test, adding a
  force-click retry loop, or reducing the final assertion;
- dependency, lockfile, Schema, migration, Compose, CI, config, or DEC changes;
- M2 dependency remediation, Current-truth normalization, Exit Review, or M3.

## Allowed files

- `packages/testing/src/browser/m2-source-intake.spec.ts`
- this Work Packet
- `docs/implementation/roadmap.md`, limited to this defect status

No other file is allowed without an independently reviewed correction.

## Acceptance criteria

1. The focused scenario passes at least three consecutive local runs without a
   detached-element timeout.
2. The step still reaches and asserts `Primary 0/1 · Supporting 0/5` from the
   authoritative API state.
3. Both valid orders are accepted: background recovery completed first, or the
   currently present reload button is triggered once.
4. The later manual reload, ambiguous URL lock, confirmation refresh, and 401
   return-to-login assertions remain unchanged and passing.
5. Full browser, root quality, documentation, repository, Secret, and diff
   checks pass.
6. No product/runtime, timeout, retry, dependency, or accepted-behavior change.

## Required commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec playwright test --config playwright.config.ts --grep "read failures recover, ambiguous URL stays locked, and command 401 returns to Login"
# repeat the focused command three times
corepack pnpm test:browser
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

The focused browser setup may require a normal local process/container execution
environment. An environment-only setup failure is recorded separately and does
not count as a passing test.

## Security, migration, compatibility, and observability

No security boundary, user data, credential, network policy, database,
migration, public Contract, or telemetry changes. Test credentials and runtime
cleanup continue to use the existing isolated browser harness. Rollback is one
focused Git revert.

## Documentation updates

This Work Packet and the Roadmap status only. No Current-truth capability or
milestone-completion statement changes.

## Implementation evidence

- The affected step now performs one `evaluateAll` DOM evaluation over the
  current `Reload Source status` match set. Only the first current match is
  clicked natively, and only when it is an `HTMLButtonElement`; an empty match
  set is a no-op. The unchanged following assertion still requires
  `Primary 0/1 · Supporting 0/5`.
- `corepack pnpm install --frozen-lockfile` and `corepack pnpm workspace:check`
  passed locally.
- The focused Playwright scenario passed three consecutive runs after the final
  change. An earlier focused attempt ended in the harness's classified browser
  setup failure before test execution, so it was not counted.
- `corepack pnpm test:browser`, `corepack pnpm check:docs`,
  `corepack pnpm repository:check`, and `corepack pnpm check:secrets` passed.
- The first `corepack pnpm check` attempt reached and passed format, lint, and
  TypeScript stages, then the restricted local sandbox rejected child-process
  spawning in five process-identity tests with `spawn EPERM`. The Orchestrator
  reran the same root gate with normal process permission: it exited zero with
  all 53 test files and 485 tests passing, followed by successful builds for all
  five applications. The final root-quality result is therefore PASS; the first
  attempt remains recorded as an environment fact.

## Post-merge status synchronization

`M2-QUAL-002` was completed through Issue #129 and PR #130, squash merge
`cc0445159a210e2d60c6abdda132480383b38d82`
(`test: stabilize Source status recovery evidence (#130)`). All three required
GitHub CI jobs were green before merge: Docker-independent quality, Integration
smoke (Docker), and M1/M2 browser smoke (Chromium).

This documentation-only synchronization does not mark M2 Completed or Passed.
M2 remains In Progress pending Current-truth normalization and `M2-GOV-005`;
M3 remains Not Started.

- Logical Role: `DOCUMENTATION_EXECUTOR`
- Requested Model: `gpt-5.6-terra`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2qual002_implementation`
- Base SHA: `fea08d03eb1c4303f5ae65e6e3fea6c289a44023`

## Definition of Ready

Ready. The exact failure, root cause, file boundary, assertion, and verification
are known. No Blocking Design Question or new DEC is required.

- Review: PASS
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2qual002_ready_review`
- Reviewed Base: `88f18884491e797071191788bc0e752fd60446ca`

## Definition of Done

The focused and full gates pass; independent review confirms the test still
proves authoritative recovery; CI is green; no unrelated diff or residue
remains.

## Git authority

Implementation stops before publication. After independent review passes, the
Orchestrator may commit, push, and create a draft PR. The Orchestrator may mark
the PR ready and squash merge only after all required CI is green and no
unresolved finding or escalation item remains.
