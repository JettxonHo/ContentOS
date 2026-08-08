# M2-QUAL-007 — FG-07 Focused Concurrent Localization

**Status:** Blocked — focused concurrent cleanup failure

**Issue:** [#161](https://github.com/JettxonHo/ContentOS/issues/161)

## Identification

- Task ID: `M2-QUAL-007`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Diagnostic
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
- Planning Branch: `codex/m2-qual-007-fg07-focused-concurrent-localization-planning`
- Planning Base SHA: `dd305ee75f0dda69add9d559eb5f9522293e9fdc`
- Implementation Thread: `/root/m2_qual_007_implementation`
- Implementation Branch: `codex/m2-qual-007-fg07-focused-concurrent-localization-impl`
- Implementation Base SHA: `7a5e8a0db980383fa6fa5d15f0093b998535ba5d`
- Dependencies: `M2-QUAL-006` Completed; the unmerged three-file
  `M2-QUAL-003` final-v2 correction remains preserved in its isolated worktree
- Risk Classification: bounded test diagnostics and concurrent-harness command selection

## Goal

Create the smallest concurrency-preserving diagnostic loop that can distinguish
the two behavior boundaries currently combined in `[FG-07]`. The loop must
retain the real two-child Integration setup and ownership/cleanup coordinator,
emit only one safe static case ID, and stop before any product or test-policy
repair is selected.

## Context

The latest required `M2-QUAL-003` final-v2 replay stopped on this safe evidence:

```text
child-2 exit=1 signal=none category=test-run-failed
test=fetcher-gateway-api.test.ts case=fg-07 captured-bytes=1435
remaining-child=clean owned-cleanup=verified
```

`M2-QUAL-005` established case attribution but later recorded only three local
`not reproduced` passes. `M2-QUAL-006` then closed a separate verified
post-spawn cleanup gap through PR #159 and is Completed. The remaining FG-07
test combines two independent boundaries in one test: recording a
Fetcher-reported failure without a Source, and rejecting a body larger than 1
MiB before parsing. The original full concurrent suite is an expensive and
imprecise feedback loop because either boundary may fail while the diagnostic
reports only `fg-07`.

This Work Item improves that loop only. It does not infer whether the observed
failure came from HTTP upload/early rejection timing, the composite test
budget, PostgreSQL observation, cleanup, or another cause. A unique diagnostic
result authorizes a separate bounded repair Work Item, not an implementation in
this task.

`M2-QUAL-003` and `M2-GOV-006` remain Blocked. M2 remains In Progress and M3
remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, and quality gates.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-004 Work Packet](m2-qual-004-safe-concurrent-failure-attribution.md)
- [M2-QUAL-005 Work Packet](m2-qual-005-safe-fetcher-gateway-case-attribution.md)
- [M2-QUAL-006 Work Packet](m2-qual-006-managed-process-capture-cleanup.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Split the existing composite `[FG-07]` test into two independently owned
   tests with exact static markers:
   - `[FG-07A]` verifies a Fetcher-reported failure produces the accepted failed
     Task/result projection and no Source;
   - `[FG-07B]` verifies an over-limit Result body is rejected with the existing
     safe `422 INVALID_GATEWAY_REQUEST` response before parsing.
2. Preserve the existing assertions and cleanup responsibility for both
   behaviors. Each split test uses its own existing fixture/claim lifecycle;
   neither depends on a Task already made terminal by the other behavior.
3. Replace the diagnostic allowlist entry `FG-07` with `FG-07A` and `FG-07B`.
   All other existing case IDs remain unchanged.
4. Add one fixed concurrent mode selected only by the exact CLI tuple
   `--focus fg-07`. It runs two isolated children through the existing
   ownership/cleanup coordinator, complete Integration global setup, and an
   exact Vitest selection limited to the Fetcher Gateway file and the two
   `[FG-07A]` / `[FG-07B]` titles.
5. Add the fixed root command
   `test:integration:concurrent:fg07`. Do not accept an arbitrary file, regex,
   test name, or command from CLI or environment input.
6. Add deterministic tests for exact command selection, unsupported arguments,
   `fg-07a` / `fg-07b` safe attribution, and preservation of the ordinary full
   concurrent mode.
7. Synchronize only the Integration Harness documentation, this Work Packet,
   and the Roadmap.

## Out of scope

- any API, Fetcher Gateway, database, Worker, Queue, Web, Fetcher, Renderer, or
  product behavior change;
- changing the 1 MiB body limit, HTTP error contract, test timeout, retry,
  capture size, child lifecycle, cleanup ownership, concurrent child count, or
  ordinary full-suite command;
- adding sleep, timing injection, random stress, a generalized filter, or a
  raw-output diagnostic;
- interpreting `fg-07a` or `fg-07b` as a root cause or implementing a repair;
- exposing or persisting a test title, assertion, stack, raw output, URL,
  Candidate body, Claim, Secret, Header, SQL, absolute path, PID, or port;
- dependencies, lockfile resolution, Schema, migration, Compose, CI, Accepted
  DEC, Acceptance Record, M2 completion, or M3 work;
- a new hash, generalized telemetry framework, or defensive matrix for
  unobserved cases.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/fetcher-gateway-api.test.ts`
- `packages/testing/src/integration/run-concurrent-smoke.ts`
- `packages/testing/src/concurrent-smoke.test.ts`
- `package.json` — only the fixed `test:integration:concurrent:fg07` script
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-007-fg07-focused-concurrent-localization.md`
- `docs/implementation/roadmap.md`

### Prohibited modules

- all production application and package source;
- other tests and fixtures;
- migrations, Schema, Drizzle metadata, dependency declarations, lockfile,
  Compose, CI, Decision, Session, README, AGENTS, and Acceptance Record files;
- the M2-QUAL-003 and M2-GOV-006 Work Packets during implementation.

### Generated files policy

No generated or runtime file may be committed. Remove only task-owned temporary
state. Pre-existing processes, containers, worktrees, volumes, directories, and
package stores are not cleanup targets. `pnpm-lock.yaml` must remain unchanged
because this task adds only a root script and no dependency.

## Contracts

- Ordinary mode: no CLI arguments continues to start two complete
  `test:integration` children exactly as today.
- Focused mode: only exact `--focus fg-07` is valid. It starts two complete
  Integration harnesses whose Vitest selection is fixed in source to:
  - `packages/testing/src/integration/fetcher-gateway-api.test.ts`;
  - the two title markers `[FG-07A]` and `[FG-07B]`;
  - the existing Integration config and a reporter that emits complete Vitest
    failure metadata required by safe attribution.
- Unsupported or extra CLI arguments fail before claims, child processes,
  Compose projects, or temporary roots are created and expose no supplied
  argument value.
- The same coordinator owns discovery, evidence, termination, exact cleanup,
  and final residue verification in both modes.
- Safe case values replace `fg-07` with `fg-07a` and `fg-07b`. They appear only
  for complete allowlisted Fetcher Gateway failure metadata under the existing
  exact safe test basename. All unsafe shapes remain `case=unclassified`.
- The diagnostic remains metadata only. It does not create a public API or
  modify a product, database, Queue, Event, configuration, or security contract.

## Acceptance criteria

1. `[FG-07A]` retains the accepted failure-result assertions, no-Source
   observation, redaction check where applicable, and owned cleanup.
2. `[FG-07B]` retains the over-limit size assertion and exact safe 422/error
   assertion with its own fixture, claim, and owned cleanup.
3. The remaining `[FG-01]`–`[FG-06]` and `[FG-08]`–`[FG-11]` tests are unchanged;
   no `[FG-07]` marker remains.
4. Ordinary mode still selects the unchanged full `test:integration` command.
5. Exact focused mode selects only the fixed Fetcher Gateway file and the two
   new markers while retaining two children, full global setup, and the same
   coordinator. Unsupported or extra arguments fail before runtime ownership is
   created.
6. A complete focused failure emits only `case=fg-07a` or `case=fg-07b`;
   ambiguous, incomplete, unknown, or mixed metadata remains unclassified.
7. Timeout, capture, retry, lifecycle, cleanup, ownership, and ordinary
   concurrent behavior remain unchanged.
8. Focused unit tests, root quality, full Integration, Browser, documentation,
   repository, Secret, diff, scope, and cleanup gates pass.
9. Focused concurrent validation runs sequentially at most three times and
   stops on the first failure without rerun-to-green.
10. A unique `fg-07a` / `fg-07b` failure completes only this diagnostic and
    requires a separate repair Work Item. Three focused passes lead to one
    ordinary full concurrent attempt; if it also passes, the result is only
    `not reproduced` and `M2-QUAL-003` remains Blocked.
11. An unclassified case, non-test failure, other test/case failure, or cleanup
    failure leaves this Work Item Blocked and not Done pending a bounded
    follow-up; cleanup failure always stops publication.
12. The final diff contains only the seven allowed files, keeps the lockfile
    unchanged, and leaves zero task-owned process, container, Compose project,
    temporary directory, or repository-store residue.

## Required tests and commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec vitest run packages/testing/src/concurrent-smoke.test.ts
corepack pnpm check
corepack pnpm test:integration
corepack pnpm test:browser
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

After deterministic and ordinary gates pass, run the new fixed command
sequentially at most three times:

```text
corepack pnpm test:integration:concurrent:fg07
```

- stop on the first `case=fg-07a` or `case=fg-07b`; do not rerun to green;
- stop on any unclassified, non-test, other-test/case, or cleanup failure;
- after three consecutive focused passes, run the original
  `corepack pnpm test:integration:concurrent` exactly once and stop on its
  result;
- a tool session that loses the final exit status is not a pass and is not a
  test failure. First prove zero owned residue, then one explicit-exit-code
  replacement may be run and must be recorded honestly.

Before and after each process-starting command, record only task-owned process,
Compose project/container, temporary-root, and repository-store deltas. Do not
kill, remove, or relabel pre-existing state.

## Security review

This task handles bounded test-process output adjacent to potentially private
or operational values. It emits only two new static non-semantic allowlisted
IDs and one stable unsupported-command category. It adds no Credential,
network capability, user-data path, Authorization change, logging sink, or
persistence. No hash or new security mechanism is added.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, or
compatibility change. The root script does not change package resolution and
must not change `pnpm-lock.yaml`. Rollback is one focused Git revert.

## Observability

Only the existing safe diagnostic allowlist and one fixed local quality command
change. Raw child output stays bounded in memory and is never persisted or
printed. No product Log, Metric, Trace, or Audit Event changes.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md),
  limited to the fixed focused mode and two safe case IDs;
- this Work Packet;
- `docs/implementation/roadmap.md`.

No capability Current-truth, README, AGENTS, DEC, Acceptance Record, or M3
document changes.

## Definition of Ready

PASS. Goal, observed evidence, fixed command boundary, split-test contract,
seven-file scope, stopping rules, security boundary, tests, and cleanup
requirements are specified. No Blocking Design Question or new DEC exists.

- `/root/m2_qual_007_dor_correctness` — PASS
- `/root/m2_qual_007_dor_governance` — PASS
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `dd305ee75f0dda69add9d559eb5f9522293e9fdc`

## Definition of Done

The split diagnostic and fixed two-child loop pass independent review and all
required ordinary gates. A unique focused case is published only as diagnostic
evidence and requires a separate repair; a fully green bounded run is published
only as `not reproduced`. Unclassified, unrelated, or cleanup failures leave
this Work Item Blocked. The final diff stays within the seven-file allowlist,
the lockfile is unchanged, and task-owned runtime residue is zero.

## Blocked implementation checkpoint

The bounded seven-file implementation passed independent code review. It
splits `[FG-07]` into independent `[FG-07A]` and `[FG-07B]` fixtures, adds the
fixed non-injectable focused command, preserves ordinary mode, and keeps safe
case attribution fail-closed. Frozen install, workspace resolution, focused
coordinator tests (37/37), root `check` (53 files / 516 tests plus builds), full
Integration (27 files / 185 tests), Browser (16/16), and static repository gates
passed. `pnpm-lock.yaml` remained unchanged.

Focused Concurrent attempts #1 and #2 exited zero with zero task-owned
residue. Attempt #3 stopped on the first failure without rerun:

```text
child-1 exit=1 signal=none category=cleanup-failed
captured-bytes=2179 remaining-child=clean owned-cleanup=failed
```

No `fg-07a` or `fg-07b` case was attributed, and the original full Concurrent
command was not run. A later read-only check found no task-owned process,
Compose project, or temporary root, but that does not identify which child or
parent cleanup boundary failed. No cleanup root cause or repair is claimed.
The implementation checkpoint remains uncommitted and unpublished in its
isolated worktree pending M2-QUAL-008.

Independent implementation review `/root/m2_qual_007_implementation_review`
passed the seven-file code, scope, and security boundary while confirming this
runtime result blocks publication. Requested model was `gpt-5.6-sol` High;
runtime model remains `UNVERIFIED_RUNTIME_MODEL`.

## Git authority

After Definition of Ready passes, the Orchestrator may commit and publish this
planning packet. The implementation Agent may modify only the files and
behavior authorized by the Ready contract and must stop before Git publication.
After independent implementation review passes, the Orchestrator may commit,
push, and create a Draft PR. Only all-green final-head CI and no unresolved
finding or escalation permit Ready-for-review status and squash merge. A
diagnostic case does not authorize its repair. The implementer cannot approve
or merge its own work.
