# M2-QUAL-008 — Concurrent Cleanup Failure Attribution

**Status:** Ready

**Issue:** [#163](https://github.com/JettxonHo/ContentOS/issues/163)

## Identification

- Task ID: `M2-QUAL-008`
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
- Planning Branch: `codex/m2-qual-008-concurrent-cleanup-attribution-planning`
- Planning Base SHA: `7a5e8a0db980383fa6fa5d15f0093b998535ba5d`
- Implementation Thread: assigned after this Ready packet is merged
- Implementation Branch: assigned from the then-current `origin/main`
- Dependencies: the reviewed, uncommitted M2-QUAL-007 seven-file checkpoint is
  preserved in `/private/tmp/contentos-m2-qual-007-impl-wt`
- Risk Classification: bounded test-harness cleanup diagnostics only

## Goal

Separate safe child Harness teardown evidence from the parent concurrent
coordinator's owned-cleanup verification without changing either cleanup path.
The first reproduced failure must identify which evidence axis failed before a
repair is selected.

## Context

M2-QUAL-007 focused Concurrent attempts #1 and #2 passed. Attempt #3 stopped on
the first failure:

```text
child-1 exit=1 signal=none category=cleanup-failed
captured-bytes=2179 remaining-child=clean owned-cleanup=failed
```

The current coordinator combines two different facts:

1. a child may report a fixed Harness teardown category with physical and
   capsule state; and
2. the parent may succeed or fail while verifying and cleaning its exact owned
   claims.

Today any child output containing `teardown=failed` forces the final
`owned-cleanup=failed` value even when the parent verifier succeeds. Child
classification is also parsed before terminal formatting is removed and can
collapse to generic `cleanup-failed`. The parent cleaner reduces its own
bounded error set to one generic exception. The later absence of residue is
compatible with multiple paths and does not establish a race, false positive,
or cleanup root cause.

This Work Item changes diagnostic separation only. It does not modify cleanup,
waits, retries, signals, capture size, product behavior, or the accepted test
gate.

`M2-QUAL-007`, `M2-QUAL-003`, and `M2-GOV-006` remain Blocked. M2 remains In
Progress and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, and quality gates.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-004 Work Packet](m2-qual-004-safe-concurrent-failure-attribution.md)
- [M2-QUAL-006 Work Packet](m2-qual-006-managed-process-capture-cleanup.md)
- [M2-QUAL-007 Work Packet](m2-qual-007-fg07-focused-concurrent-localization.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Reproduce the reviewed M2-QUAL-007 checkpoint exactly in a fresh
   latest-main implementation worktree before adding the M2-QUAL-008 delta.
   Compare the inherited five-file code/document delta against the preserved
   checkpoint; do not redesign it.
2. Parse child cleanup evidence only from complete, newline-terminated,
   ANSI-stripped fixed Harness failure lines. Safely expose:
   - one allowlisted child cleanup category;
   - `child-physical=clean|incomplete`;
   - `child-capsule=removed|preserved`.
3. Preserve ordinary non-cleanup classification when no complete child cleanup
   indicator exists. Once a complete line indicates Harness teardown failure,
   a missing, incomplete, unknown, conflicting, or multi-category cleanup
   record is `category=cleanup-unclassified` and does not expose raw content.
4. Make `owned-cleanup` represent only the parent verifier's actual outcome.
   A child teardown failure must not overwrite a successful parent result.
5. Classify parent cleanup failure into one allowlisted coarse value:
   `ownership`, `process`, `compose`, `verification`, `root`, or
   `unclassified`. Multiple distinct parent categories are unclassified.
6. Add deterministic tests for the two independent axes and preserve all
   ordinary/focused child, ownership, termination, and cleanup behavior.
7. Synchronize only the Integration Harness document, this Work Packet, and
   the Roadmap for the new diagnostic evidence.

## Out of scope

- changing Harness or parent cleanup behavior, ordering, timeout, retry,
  signal, wait, capture size, child count, or ownership authority;
- adding a timing injection, sleep, generalized filter, raw-output logging, or
  new cleanup attempt;
- fixing any hypothesized process, Compose, filesystem, or observation issue;
- product, API, Fetcher Gateway, database, Worker, Queue, Web, Fetcher,
  Renderer, or application behavior;
- dependencies, lockfile resolution, Schema, migration, Compose configuration,
  CI, Accepted DEC, Acceptance Record, M2 completion, or M3 work;
- exposing raw output, paths, PIDs, ports, URLs, Secrets, Claims, Headers,
  stacks, SQL, or test titles;
- a new hash, generalized telemetry framework, or defensive matrix for
  unreachable variants.

## Allowed and prohibited files

### Combined implementation allowlist

The implementation branch is based on latest `main` and may contain only the
five inherited M2-QUAL-007 checkpoint files plus the two M2-QUAL-008 status
documents:

- `packages/testing/src/integration/fetcher-gateway-api.test.ts` — inherited
  M2-QUAL-007 split only;
- `packages/testing/src/integration/run-concurrent-smoke.ts` — inherited
  focused mode plus the new two-axis attribution;
- `packages/testing/src/concurrent-smoke.test.ts` — inherited focused tests plus
  new deterministic attribution tests;
- `package.json` — inherited fixed focused script only;
- `docs/quality/integration-smoke-harness.md` — inherited focused-mode and new
  cleanup-attribution truth;
- `docs/implementation/work-packets/m2-qual-008-concurrent-cleanup-failure-attribution.md`;
- `docs/implementation/roadmap.md`.

### Preserved checkpoint files not modified during M2-QUAL-008

The M2-QUAL-007 Work Packet is updated to Blocked by this planning change and
must not be modified by the implementation Agent. Its preserved implementation
checkpoint remains the comparison source, not a writable second truth.

### Prohibited modules

- `packages/testing/src/integration/harness.ts`, `global-setup.ts`, and all
  other tests or fixtures;
- all production application and package source;
- migrations, Schema, Drizzle metadata, dependency declarations, lockfile,
  Compose, CI, Decision, Session, README, AGENTS, and Acceptance Record files;
- the M2-QUAL-003, M2-QUAL-006, M2-QUAL-007, and M2-GOV-006 Work Packets during
  implementation.

### Generated files policy

No generated or runtime file may be committed. Remove only task-owned temporary
state. Pre-existing processes, containers, worktrees, volumes, directories, and
package stores are not cleanup targets. `pnpm-lock.yaml` must remain unchanged.

## Contracts

- Child teardown evidence and parent owned-cleanup evidence are independent.
- Child cleanup parsing is activated only when a complete, newline-terminated
  line contains one of the two fixed Harness record forms:

  ```text
  contentos smoke harness teardown failed: cleanup=<categories> physical=<state> capsule=<state>
  contentos smoke setup failed: setup=<safe-category> teardown=failed cleanup=<categories> physical=<state> capsule=<state>
  ```

  The parser may ignore a reporter prefix before the fixed record, but the
  record fields must remain contiguous in the shown order and end with the
  line. A complete `teardown=failed` Harness line that does not contain one
  valid record activates cleanup parsing but yields `cleanup-unclassified`.
  `error during close` alone retains its existing generic cleanup classification
  and is not promoted to a specific Harness record.

- Child cleanup categories are exactly `managed-process`, `process-control`,
  `object-storage`, `compose`, `compose-verify`, `root`, and `synthetic`.
  Exactly one distinct category is required for specific attribution. Repeated
  identical complete records are deduplicated; conflicting records, a
  comma-separated multi-category record, or an unknown category are
  unclassified.
- ANSI is stripped before parsing. A trailing `\r` is removed from each
  complete CRLF line. When the bounded capture starts mid-line, its first split
  segment is ignored. A final segment without `\n` is ignored. A discarded
  partial segment does not by itself turn an otherwise ordinary non-cleanup
  failure into a cleanup failure.
- A specific child diagnostic has this fixed field order:

  ```text
  category=cleanup-<category>
  child-physical=<clean|incomplete>
  child-capsule=<removed|preserved>
  ```

- Non-cleanup child failure diagnostics retain their existing shape.
- Parent verifier success always emits `owned-cleanup=verified`, including
  when the child independently reported teardown failure.
- Parent verifier failure emits only
  `owned-cleanup=failed-<allowlisted-category>`. Unknown or multiple distinct
  categories use `failed-unclassified`.
- Parent cleanup paths map deterministically:
  - `ownership`: invalid claim sets, missing or invalid exact child claims, and
    missing or invalid managed-process control;
  - `process`: an exact managed-process stop failure;
  - `compose`: exact Compose down/input failure or claimed Compose residue;
  - `verification`: Compose project-list or project-list parsing failure;
  - `root`: child-run-root removal/residue or parent-root removal/residue.
    Repeated failures in one category are deduplicated. Two or more distinct
    categories produce `failed-unclassified`; an unexpected error also produces
    `failed-unclassified`.
- The same bounded parent classification is used by the catch-path verifier,
  the verifier after successful children, and pre-child build-failure cleanup.
  The latter two have no child cleanup axis to invent; they retain their current
  safe child/build context and add only the parent `owned-cleanup` result.
- `owned-cleanup=verified` does not mean the child teardown succeeded. Both
  axes must be retained in the same final safe diagnostic.
- Raw child output remains bounded in memory and is never persisted or printed.
- Ordinary and focused modes retain their existing command selection,
  ownership, timing, lifecycle, termination, cleanup, and residue verification.

## Acceptance criteria

1. Complete ANSI-formatted child teardown output yields the exact allowlisted
   child category, physical state, and capsule state.
2. A complete Harness teardown indicator with truncated, incomplete, missing,
   unknown, conflicting, or multi-category child evidence yields
   `cleanup-unclassified` without extra detail. An ordinary failure with no
   complete Harness teardown indicator retains its existing classification.
3. Child teardown failure plus parent verifier success preserves the child axis
   and emits `owned-cleanup=verified`.
4. Parent verifier failure is classified independently even when the child is
   a test failure or also reports teardown failure.
5. Parent ownership/process/compose/verification/root paths map to their fixed
   safe values; unknown or multiple categories map to unclassified.
6. Ordinary and focused dual-child commands, timeout, capture, termination,
   ownership, cleanup, and residue behavior are unchanged.
7. Diagnostics contain no raw output, path, PID, port, URL, Secret, Claim,
   Header, stack, SQL, or test title and add no hash.
8. Focused coordinator tests, root quality, full Integration, Browser,
   documentation, repository, Secret, diff, scope, and cleanup gates pass.
9. Focused Concurrent validation runs sequentially at most three times and
   stops on the first failure without rerun-to-green.
10. A first cleanup-related red completes this diagnostic only when every
    applicable axis is specific: the child cleanup axis is one allowlisted
    category with both states, and the parent axis is either `verified` or one
    allowlisted failed category. It requires a separate repair Work Item.
11. Any applicable `cleanup-unclassified` or `failed-unclassified` axis takes
    precedence over a specific axis and leaves M2-QUAL-008 Blocked pending a
    bounded follow-up.
12. A first ordinary red attributed exactly to
    `test=fetcher-gateway-api.test.ts` and either `case=fg-07a` or
    `case=fg-07b`, with parent cleanup verified, completes the focused
    localization and requires a separate FG repair; it does not claim a cleanup
    cause. An unrelated Docker, build, setup, start, migration, other-test, or
    generic non-cleanup red leaves M2-QUAL-008 Blocked.
13. Three focused passes permit only a `not reproduced` publication of this
    diagnostic implementation; they do not complete M2-QUAL-007 or unblock
    M2-QUAL-003.
14. The final diff contains only the seven combined allowlist files, reproduces
    the inherited M2-QUAL-007 checkpoint without unrelated change, keeps the
    lockfile unchanged, and leaves zero task-owned runtime or repository-store
    residue.

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

After deterministic and ordinary gates pass, run sequentially at most three
times:

```text
corepack pnpm test:integration:concurrent:fg07
```

- stop on the first red result and record only the applicable safe evidence
  axes;
- do not rerun to green and do not substitute the ordinary full Concurrent
  command;
- any applicable unclassified child or parent axis takes precedence, stops,
  and remains Blocked without expanding into raw logging;
- exact `fg-07a` or `fg-07b` with parent verified is a localized non-cleanup
  result; unrelated non-cleanup red results remain Blocked;
- three consecutive passes stop as `not reproduced` only;
- a tool session that loses final exit status is not a pass or a failure. After
  proving zero owned residue, one explicit-exit-code replacement may be run and
  must be recorded honestly.

Before and after every process-starting command, record only task-owned process,
Compose project/container, temporary-root, and repository-store deltas. Do not
kill, remove, or relabel pre-existing state.

## Security review

This task handles bounded test-process output adjacent to potentially private
or operational values. It exposes only fixed allowlisted classifications and
does not add a Credential, network capability, user-data path, Authorization
change, logging sink, persistence, or hash. It deliberately avoids expanding
to raw output or a generalized diagnostic matrix.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must not change. Rollback is one
focused Git revert of the combined diagnostic branch after publication.

## Observability

The existing safe concurrent failure line gains two independent bounded axes.
No product Log, Metric, Trace, or Audit Event changes. Raw child output remains
bounded in memory and is not persisted or printed.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md),
  limited to the two-axis safe diagnostic;
- this Work Packet;
- `docs/implementation/roadmap.md`.

No capability Current-truth, README, AGENTS, DEC, Acceptance Record, or M3
document changes.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `7a5e8a0db980383fa6fa5d15f0093b998535ba5d`:

- correctness and executability: `/root/m2_qual_008_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_008_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model
`UNVERIFIED_RUNTIME_MODEL`. Goal, preserved checkpoint, two-axis diagnostic
contract, combined seven-file boundary, stopping rules, security impact, tests,
and cleanup requirements are specified. No Blocking Design Question or new DEC
is present.

## Definition of Done

The two-axis diagnostic and inherited focused loop pass independent review and
all required ordinary gates. A cleanup red completes this diagnostic only when
all applicable cleanup axes are specific. An exact `fg-07a` or `fg-07b` red
with parent cleanup verified completes focused localization instead. Either
outcome requires a separate repair and does not authorize one here. Three
green runs are published only as `not reproduced`. An applicable unclassified
axis or unrelated non-cleanup red leaves this Work Item Blocked. The combined
diff remains exact, the lockfile is unchanged, and task-owned residue is zero.

## Git authority

After Definition of Ready passes, the Orchestrator may commit and publish this
planning packet. The implementation Agent may modify only the files and
behavior authorized by the Ready contract and must stop before Git publication.
After independent implementation review passes, the Orchestrator may commit,
push, and create a Draft PR. Only all-green final-head CI and no unresolved
finding or escalation permit Ready-for-review status and squash merge. A
diagnostic result does not authorize its repair. The implementer cannot approve
or merge its own work.
