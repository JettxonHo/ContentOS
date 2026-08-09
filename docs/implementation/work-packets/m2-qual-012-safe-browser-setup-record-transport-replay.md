# M2-QUAL-012 — Safe Browser Harness Setup Record Transport and Replay

**Status:** Completed — Not Reproduced

Issue #178 was closed at `2026-08-09T02:10:36Z` after PR #180 merged with
squash SHA `62a246a01658f0c5c7e1a165b01056df4a301c1d` (`test: preserve Browser
setup failure evidence (#180)`). Final-head CI run `31289654402` passed all
three required jobs: quality (`2m13s`), browser (`2m26s`), and integration
(`3m2s`). Independent correctness and scope review threads both passed.

**Issue:** [#178](https://github.com/JettxonHo/ContentOS/issues/178)

## Identification

- Task ID: `M2-QUAL-012`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Branch: `codex/m2-qual-012-browser-setup-transport-plan`
- Planning Base SHA: `5e16883e51963548705715ecdef8a19bb119c028`
- Implementation Thread: `/root/m2_qual_012_implementation`
- Implementation Branch: `codex/m2-qual-012-browser-setup-transport-impl`
- Implementation Base SHA: `215408bd054da1faef2847eb69e4fce17e4130da`
- Dependencies: M2-QUAL-011 Blocked record merged through PR #177
- Risk Classification: bounded Browser Harness diagnostic transport and replay

## Goal

Transport the Integration Harness's already-sanitized setup and teardown result
through the Browser harness runner and Playwright global setup without exposing
arbitrary error content, then replay the non-injected Browser gate under a
bounded first-red rule. This Work Item attributes a Browser setup boundary; it
does not diagnose or repair the underlying setup failure.

## Context

The unpublished M2-QUAL-011 implementation passed focused, root, and full
Integration gates, then its required Browser gate exited `1` with only
`Browser smoke harness reported a classified setup failure.` No Browser rerun
or focused Worker replay followed, and task-owned residue was zero. PR #177
published that Blocked record only; the six-file implementation remains
unpublished and Issue #175 remains open.

The Integration Harness already throws a sanitized record containing
`setup=<category>` and `teardown=<state>`. The Browser runner currently retains
only `docker-unavailable` and collapses every other category to `setup-failed`,
discarding teardown evidence. Playwright global setup then converts that token
to one generic sentence. This transport loss is known; the original setup
cause is not.

## Implementation checkpoint

The seven-file implementation is present on the clean implementation entry
above. The pure Browser transport parser/formatter accepts the fixed current
and compatibility setup categories, enforces canonical cleanup ordering,
reconstructs only static fields, and fails closed to one unclassified failed
record. The Browser runner emits that record and global setup requires exactly
one complete non-conflicting LF-terminated Browser record before exposing the
same fixed fields in its Playwright error. Focused transport and wiring tests
pass (38 tests). `workspace:check` passes. The first sandbox `check` stopped on
five existing `process-identity.test.ts` `spawn EPERM` cases; the unchanged
check passed with normal process permissions (54 files, 574 tests, and all five
application builds). Full Integration passed with normal process permissions
(27 files, 185 tests; existing `pg@9` warning); its initial sandbox invocation
failed at the pre-existing generic `setup=setup-failed teardown=clean`
boundary.

### Final review correction

The final review correction adds table-driven focused coverage for all 12
current setup categories and all 9 fixed compatibility categories, exports the
existing `waitForReady` seam without changing its runtime logic, and verifies
valid plus malformed/conflicting output with fake child streams. A dynamic
mock test exercises the actual Browser runner catch wiring without Docker,
spawn, or injection. These changes are testability-only and preserve the exact
protocol/runtime checkpoint used for the three Browser attempts. Browser replay
is not repeated because its three-attempt cap is already consumed; the final
focused count is 38 tests.

## Independent implementation review evidence

**PASS.** Independent implementation correctness and scope reviews passed:

- correctness: `/root/m2_qual_012_correctness_review`;
- scope, governance, and security: `/root/m2_qual_012_scope_review`.

Both reviewers used logical role `INDEPENDENT_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model
`UNVERIFIED_RUNTIME_MODEL`. The 12-current/9-compatibility test-coverage and
Implementation Thread metadata findings are closed; no remaining findings.

## Replay evidence

The required preflight emitted only `injection-env=unset` for the ten
M2-QUAL-010 Harness/concurrent variables plus `CONTENTOS_BROWSER_INJECT_FAILURE`.
The aggregate entry snapshot was
`app-processes=0 compose-projects=0 compose-containers=0 harness-temp-roots=1`
`playwright-artifacts=yes repo-local-pnpm-store=no`; the existing temporary
root and Playwright artifact presence were retained and not treated as task
owned. The exact command
`fnm exec --using=24.18.0 corepack pnpm test:browser` ran sequentially three
times. Attempts 1, 2, and 3 each explicitly exited `0` with all 16 Browser
tests passing. After every attempt, the same aggregate fields were observed
and the task-owned cleanup delta was zero. No Browser setup failure record was
emitted, so no setup category or root cause is attributed. The terminal
evidence is **Completed — Not Reproduced** only; independent review passed,
and final-head GitHub CI run `31289654402` passed all three required jobs
(quality `2m13s`, browser `2m26s`, integration `3m2s`). PR #180 merged with
squash SHA `62a246a01658f0c5c7e1a165b01056df4a301c1d`, and Issue #178 closed at
`2026-08-09T02:10:36Z`. This does not attribute a root cause or prove the
historical failure cannot recur.

M2-QUAL-012 fixes only that Browser diagnostic transport. It does not copy or
repair M2-QUAL-011. M2-QUAL-011, M2-QUAL-003, and M2-GOV-006 remain Blocked; M2
remains In Progress and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, readiness,
  completion, and scope governance.
- [Test Strategy](../../quality/test-strategy.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-011 Work Packet](m2-qual-011-safe-focused-integration-setup-attribution-replay.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No Blocking Design Question or
new DEC is identified.

## In scope

1. Start from a clean latest-`origin/main` implementation worktree after this
   Ready packet merges; record branch, base SHA, Node, pnpm, and initial status.
2. Add one pure Browser Harness setup-record transport module that parses the
   exact sanitized Integration setup grammar and reconstructs fixed fields from
   static allowlists.
3. Make `browser/harness-runner.ts` emit exactly one LF-terminated fixed Browser
   record when `harness.setup()` rejects.
4. Make `browser/global-setup.ts` accept exactly one complete, non-conflicting
   record and expose only its reconstructed safe fields in the Playwright setup
   error.
5. Add focused deterministic tests for exact formatting/parsing, current and
   planned category compatibility, one representative redaction boundary, and
   malformed/conflicting/partial fail-closed behavior.
6. Synchronize Browser Thin Slice Current-truth, this Work Packet, and Roadmap.
7. After deterministic, root, and full Integration gates pass, run the exact
   non-injected Browser command sequentially at most three times. Every
   physical invocation consumes one slot; stop on first red or missing status.
8. Record only the fixed Browser record and aggregate task-owned cleanup
   evidence. A reviewed specific failure requires a separate repair Work Item.

## Out of scope

- changing or copying the unpublished M2-QUAL-011 setup-phase implementation or
  its teardown-independence unit test;
- changing Integration Harness code, `browser/run-browser.ts`, retry, timeout,
  sleep, signal, process ownership, cleanup ordering, output cap, reporter,
  state-file transport, or runtime behavior;
- adding an injection switch, persistent diagnostic artifact, raw-output sink,
  hash, dependency, package, or configuration;
- changing product/application code, Worker/Fetcher tests, database, Schema,
  migration, Compose, CI, Accepted DEC, Acceptance Record, README, AGENTS, or
  another Work Packet;
- treating a transported category as a root cause or repairing it here;
- completing Issue #175, M2-QUAL-011, M2-QUAL-003, M2-GOV-006, M2, or starting
  M3.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/browser/setup-failure-transport.ts` — new pure module
- `packages/testing/src/browser-harness-transport.test.ts` — new focused tests
- `packages/testing/src/browser/harness-runner.ts`
- `packages/testing/src/browser/global-setup.ts`
- `docs/quality/browser-thin-slice.md`
- `docs/implementation/work-packets/m2-qual-012-safe-browser-setup-record-transport-replay.md`
- `docs/implementation/roadmap.md`

### Prohibited files

- `packages/testing/src/integration/harness.ts`, `global-setup.ts`,
  `run-concurrent-smoke.ts`, `process-identity.ts`,
  `packages/testing/src/harness-cleanup.test.ts`, and every Worker/Fetcher test;
- all `apps/**`, product packages, manifests, lockfiles, migrations, Schema,
  Drizzle metadata, Compose, CI, Decisions, Sessions, README, AGENTS, Acceptance
  Records, and existing Work Packets.

No generated or runtime file may be committed. Remove only task-owned state;
pre-existing processes, containers, worktrees, volumes, directories, and
package stores are not cleanup targets.

## Contracts

### Fixed Browser setup record

The runner emits exactly one LF-terminated record in one of two exact forms:

```text
CONTENTOS_BROWSER_HARNESS_ERROR:setup=<category> teardown=clean
CONTENTOS_BROWSER_HARNESS_ERROR:setup=<category> teardown=failed cleanup=<categories> physical=<clean|incomplete> capsule=<removed|preserved>
```

The pure transport accepts only the exact sanitized Integration Harness setup
grammar. It reconstructs output from static allowlists and never forwards the
source `message`, `cause`, stack, path, URL, credential, PID, port, or raw
output.

Accepted setup categories include the current merged Harness categories plus
the nine compatibility tokens already fixed by the M2-QUAL-011 Work Packet.
`setup-failed` remains accepted but generic; it is not attribution. Cleanup
categories use the existing canonical order:
`managed-process`, `process-control`, `object-storage`, `compose`,
`compose-verify`, `root`, `synthetic`.

Unknown, malformed, partial, duplicate-conflicting, or non-Error input produces
only:

```text
CONTENTOS_BROWSER_HARNESS_ERROR:setup=unclassified teardown=failed cleanup=root physical=incomplete capsule=preserved
```

Playwright global setup reads complete LF-terminated lines from the unchanged
bounded output tail, requires exactly one non-conflicting record, and reports a
fixed error containing only reconstructed fields. `MAX_CLASSIFICATION_OUTPUT`,
startup/teardown deadlines, signals, child shutdown, Harness teardown, and
state-file transport remain unchanged. The nine M2-QUAL-011 tokens are
compatibility only; this task does not claim current Integration code produces
them.

### Replay contract

After deterministic, root, and full Integration gates pass, run:

```text
fnm exec --using=24.18.0 corepack pnpm test:browser
```

Run sequentially at most three times. Every physical invocation consumes one
slot. Stop on first non-zero result; never rerun it to green. A missing final
status consumes a slot and stops Blocked without replacement.

Before replay, confirm all M2-QUAL-010 Harness/concurrent injection variables
and `CONTENTOS_BROWSER_INJECT_FAILURE` are unset, printing names only if any are
defined. Record aggregate task-owned deltas only for application processes,
exact smoke Compose projects/containers, Harness temporary roots, Playwright
task artifacts, and this worktree's repository-local store. Any unproven
cleanup or non-zero task-owned delta is Blocked. Never touch pre-existing state.

### Terminal outcomes

1. **Completed — Not Reproduced:** all three Browser attempts explicitly exit
   `0`, every task-owned delta is zero, all other gates pass, and independent
   review passes. Publish the seven-file implementation after green final-head
   CI. After merge, the Orchestrator may close Issue #178. This does not prove
   the historical failure cannot recur.
2. **Blocked — Attributed `<category>`:** the first red has explicit exit `1`,
   exactly one allowlisted non-generic setup category, `teardown=clean`, no
   competing Browser/test failure, and zero task-owned residue. Stop without
   another Browser invocation. Do not publish code; after independent evidence
   review publish only this Work Packet and Roadmap from latest `main`. A
   separate repair Issue is created only when the reviewed category establishes
   a repository-owned boundary.
3. **Blocked — Unclassified or unsafe evidence:** `setup-failed`,
   `setup=unclassified`, teardown failure, malformed/missing/conflicting fields,
   unrelated Browser assertion failure, unexpected signal, defined injection,
   missing status, required gate failure, or task-owned residue stops the task.
   Use the same two-document publication path; do not broaden instrumentation or
   repair in place.

Later green publication CI is publication-integrity evidence only; it never
overwrites a recorded first red. Every outcome keeps M2-QUAL-011 and Issue #175
Blocked/open, M2-QUAL-003 and M2-GOV-006 Blocked, M2 In Progress, and M3 Not
Started. Both Blocked outcomes keep Issue #178 open.

## Acceptance criteria

1. Browser runner reconstructs exactly one fixed record from the sanitized
   Integration setup error; arbitrary source error content is not copied.
2. Global setup accepts exactly one complete non-conflicting record and exposes
   only safe fields.
3. Existing Docker and generic setup behavior remain representable; current
   Harness categories and nine future compatibility tokens are accepted without
   claiming they occurred.
4. Unknown/malformed/conflicting/partial input fails closed to the one fixed
   unclassified record.
5. Browser timeouts, signals, cleanup, process lifecycle, output cap, and
   state-file transport remain unchanged.
6. Focused tests cover exact clean/failed formatting, category compatibility,
   one bounded sensitive-input case, and fail-closed parsing without an
   exhaustive impossible-case matrix.
7. Frozen install, workspace, focused tests, root quality, full Integration,
   documentation, repository, Secret, diff, scope, artifact, and residue gates
   pass before replay.
8. At most three Browser attempts run sequentially; first red/missing status
   stops and one terminal outcome is recorded without exceeding evidence.
9. Final diff is limited to seven allowed files with no dependency, lockfile,
   Integration Harness, production, migration, Compose, CI, or unrelated doc
   change.
10. Independent review and final-head CI satisfy the applicable Completed or
    Blocked publication path.

## Required commands and evidence

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/browser-harness-transport.test.ts
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
```

After these pass, run the exact Browser replay one attempt at a time under the
terminal contract. Full Concurrent is not required because no Integration or
concurrent ownership behavior changes.

## Security review

This Work Item handles no user content, credential, provider transmission, or
new network boundary. It reconstructs only static safe fields from an already
sanitized Harness record and adds no arbitrary error sink, hash, dependency, or
cleanup authority. One representative redaction case is sufficient.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must remain unchanged. Rollback is a
focused Git revert of the seven-file diagnostic implementation.

## Observability

No product Log, Metric, Trace, Audit Event, or persistent artifact changes. The
only new evidence is the fixed Browser setup record and fixed Playwright error.

## Documentation updates

- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- this Work Packet
- `docs/implementation/roadmap.md`

No Integration Harness Current-truth, README, AGENTS, DEC, Acceptance Record,
API, Schema, or M3 document changes.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `5e16883e51963548705715ecdef8a19bb119c028`:

- correctness and executability: `/root/m2_qual_012_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_012_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`. They
validated the exact two-form protocol, current/future category compatibility,
seven-file scope, bounded replay, cleanup ownership, QUAL-011 separation, Issue
lifecycle, and planning/Completed/Blocked publication paths. No Blocking Design
Question or new DEC is present.

## Definition of Done

The seven-file implementation stays within contract; deterministic and ordinary
gates pass; replay reaches one permitted terminal outcome; task-owned residue is
zero; independent review finds no unresolved issue; and documentation, CI, and
Git status match the claim.

For **Completed — Not Reproduced**, independent review PASS permits a seven-file
code-and-documentation Draft PR; green final-head CI and no unresolved finding
permit Ready status and squash merge. For **Blocked**, the combined code branch
is not published. Independent evidence/scope PASS permits a separate latest-main
Work Packet + Roadmap Draft PR; green publication CI and no record/scope finding
permit Ready status and squash merge while the Work Item remains Blocked.

## Git authority

After Definition of Ready PASS, the Orchestrator may commit, push, and open a
Draft PR for this planning packet. Green final-head CI and no unresolved finding
permit Ready status and squash merge. The planning PR does not close or mutate
Issue #178. The `luna-worker` implementer may modify only the seven allowed
files in a fresh worktree and must stop before Git publication or Issue
mutation.

After independent implementation review, the Orchestrator may publish only the
terminal path authorized above. The implementer cannot approve or merge its own
work. A Completed implementation merge permits the Orchestrator to close Issue
#178; a Blocked publication leaves it open. Issue #175 remains open in every
outcome. All Issue mutation and creation for a later repair are
Orchestrator-only after evidence review.
