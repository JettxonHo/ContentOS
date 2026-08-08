# M2-QUAL-009 — Explicit Child Teardown Record Emission

**Status:** In Review — independent review passed; awaiting GitHub CI

Implementation evidence (2026-08-09): the QUAL008 five-file checkpoint was
reproduced byte-identically before the QUAL009 delta. Frozen install,
workspace, focused tests (64), root quality (53 files / 536 tests and builds),
Integration (27 files / 185 tests), Browser (16/16), documentation,
repository, Secret, and diff gates passed under Node 24.18.0 via `fnm exec`.
The sandbox-only root run hit the known `spawn EPERM` limitation and was
repeated process-enabled without test changes. The single injected FG07 run
returned the expected non-zero evidence:
`cleanup-synthetic`, `child-physical=clean`, `child-capsule=removed`,
`remaining-child=clean`, and `owned-cleanup=verified`; scoped post-run checks
found no task-owned temporary roots or Compose projects. No publication,
commit, push, or Issue closure was performed.

Independent implementation reviews passed after one test-only evidence
correction: correctness `/root/m2_qual_009_correctness_review` and scope,
security, and governance `/root/m2_qual_009_scope_review`. Both reviewers used
logical role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, and recorded
runtime model `UNVERIFIED_RUNTIME_MODEL`. GitHub CI remains pending.

**Issue:** [#165](https://github.com/JettxonHo/ContentOS/issues/165)

## Identification

- Task ID: `M2-QUAL-009`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Bug Fix
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
- Planning Branch: `codex/m2-qual-009-explicit-child-teardown-record-planning`
- Planning Base SHA: `6d6155266463d10b8684ebb0e6df27a1adf28f39`
- Implementation Thread: `/root/m2_qual_009_implementation`
- Implementation Branch: `codex/m2-qual-009-explicit-child-teardown-record-impl`
- Implementation Base SHA: `8273ac64951eb2d91033beacfaceb5fc677fbeff`
- Dependency: reviewed M2-QUAL-008 checkpoint preserved read-only at
  `/private/tmp/contentos-m2-qual-008-impl-wt`
- Risk Classification: bounded test-harness evidence transport only

## Goal

Ensure the already-sanitized child Harness teardown record enters the existing
bounded concurrent child capture before Vitest reports its generic close error.
Do not change cleanup execution or broaden the parser.

## Context

M2-QUAL-008 separated child teardown evidence from parent owned-cleanup
verification. Its first focused run stopped on:

```text
child-2 exit=1 signal=none category=cleanup-failed captured-bytes=2179 remaining-child=clean owned-cleanup=verified
```

The parent cleanup was verified and no task-owned residue remained. The Harness
already constructs a fixed sanitized `HarnessCleanupError` record containing
only cleanup categories, physical state, and capsule state. The Integration
`globalSetup` teardown catch currently sets `process.exitCode = 1` and rethrows;
Vitest later reports a generic `error during close`, which live evidence showed
does not reliably preserve the fixed record in the child capture.

This Work Item adds one explicit transport at that seam. It does not infer why
the original cleanup failed and does not repair cleanup behavior.

`M2-QUAL-008`, `M2-QUAL-007`, `M2-QUAL-003`, and `M2-GOV-006` remain Blocked.
M2 remains In Progress and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, and quality gates.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-006 Work Packet](m2-qual-006-managed-process-capture-cleanup.md)
- [M2-QUAL-007 Work Packet](m2-qual-007-fg07-focused-concurrent-localization.md)
- [M2-QUAL-008 Work Packet](m2-qual-008-concurrent-cleanup-failure-attribution.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. In a fresh latest-main implementation worktree, reproduce the reviewed
   M2-QUAL-008 five-file code/document checkpoint byte-for-byte from the
   preserved worktree before applying the M2-QUAL-009 delta. Do not redesign
   the inherited FG split, focused mode, parser, parent classification, or docs.
2. Add one Harness-owned formatter that converts only the existing structured
   cleanup error fields to the existing fixed sanitized record.
3. In the existing Integration global teardown catch, write exactly one
   LF-terminated fixed record to `process.stderr` after setting the non-zero
   exit code and before rethrowing the same error.
4. Add focused tests for valid structured formatting, fail-closed unknown
   errors, single-LF transport, no arbitrary message disclosure, and identical
   record deduplication through the existing M2-QUAL-008 parser.
5. Verify the transport exactly once through the existing synthetic teardown
   injection and focused dual-child ownership path.
6. Synchronize only the Integration Harness document, this Work Packet, and
   Roadmap for the accepted behavior and actual evidence.

## Out of scope

- changing cleanup steps, ordering, timeout, retry, wait, signal, ownership,
  child count, capture size, buffer policy, or parser rules;
- adding a drain loop, reporter plugin, raw-output log, generalized telemetry,
  timing injection, or second cleanup attempt;
- interpreting or fixing the prior real cleanup failure;
- a non-injected FG-07 replay or the ordinary full Concurrent command;
- product, API, Fetcher Gateway, database, Worker, Queue, Web, Fetcher,
  Renderer, or application behavior;
- dependencies, lockfile, Schema, migration, Compose configuration, CI,
  Accepted DEC, Acceptance Record, M2 completion, or M3 work;
- exposing raw error messages, causes, stacks, paths, PIDs, ports, URLs,
  Secrets, Claims, Headers, SQL, test titles, or a new hash.

## Allowed and prohibited files

### Combined implementation allowlist

The implementation branch may contain only the five inherited M2-QUAL-008
checkpoint files plus five M2-QUAL-009 files:

- `package.json` — inherited fixed focused script only;
- `packages/testing/src/integration/fetcher-gateway-api.test.ts` — inherited
  FG-07A/B split only;
- `packages/testing/src/integration/run-concurrent-smoke.ts` — inherited focused
  mode and two-axis parser only;
- `packages/testing/src/concurrent-smoke.test.ts` — inherited deterministic
  focused/two-axis tests plus identical-record transport regression;
- `docs/quality/integration-smoke-harness.md` — inherited diagnostics plus the
  explicit safe emission truth;
- `packages/testing/src/integration/harness.ts` — safe formatter only;
- `packages/testing/src/integration/global-setup.ts` — one explicit record
  emission in the existing catch;
- `packages/testing/src/harness-cleanup.test.ts` — formatter/transport tests;
- `docs/implementation/work-packets/m2-qual-009-explicit-child-teardown-record-emission.md`;
- `docs/implementation/roadmap.md`.

### Prohibited files

- M2-QUAL-003, M2-QUAL-006, M2-QUAL-007, M2-QUAL-008, and M2-GOV-006 Work
  Packets during implementation;
- every other test or harness file;
- all production application/package source;
- dependency declarations, `pnpm-lock.yaml`, migrations, Schema, Drizzle
  metadata, Compose, CI, Decisions, Sessions, README, AGENTS, and Acceptance
  Records.

No generated or runtime file may be committed. Remove only task-owned temporary
state. Pre-existing processes, containers, worktrees, volumes, directories, and
package stores are not cleanup targets.

## Contracts

- Harness remains the sole owner of cleanup categories and state vocabulary.
- The formatter recognizes only the internal structured Harness cleanup error;
  it never copies `error.message`, `cause`, stack, or arbitrary input.
- A recognized error produces exactly:

  ```text
  contentos smoke harness teardown failed: cleanup=<categories> physical=<clean|incomplete> capsule=<removed|preserved>
  ```

- Category values remain `managed-process`, `process-control`,
  `object-storage`, `compose`, `compose-verify`, `root`, and `synthetic`.
  Existing canonical category order is preserved. The formatter returns no CR
  or LF.
- An unknown or structurally invalid error produces only this constant
  fail-closed record:

  ```text
  contentos smoke harness teardown failed: cleanup=unclassified physical=incomplete capsule=preserved
  ```

  `unclassified` is deliberately not an allowlisted specific child category.

- The global teardown catch preserves `process.exitCode = 1`, writes exactly
  `record + "\n"` once to `process.stderr`, and rethrows the identical error
  object. It adds no cleanup attempt, retry, wait, signal, or drain behavior.
- Vitest may later print an identical record. The existing parser deduplicates
  identical tuples; malformed or conflicting evidence remains unclassified.
- Ordinary and focused child commands, capture, termination, ownership, parent
  verification, cleanup, and residue behavior remain unchanged.

## Acceptance criteria

1. A structured synthetic/clean/removed Harness error formats to the exact
   fixed record without CR/LF.
2. An arbitrary error containing Secret-like or local-path-like text emits only
   the constant unclassified record and does not echo input.
3. The global teardown transport sets non-zero exit status, writes exactly one
   LF-terminated record, and rethrows the same error object.
4. One direct and one reporter-prefixed identical record still yield one
   specific `cleanup-synthetic` child classification; conflicting evidence
   remains fail-closed.
5. No cleanup, parser, timeout, retry, signal, capture, ownership, or product
   behavior changes.
6. Focused formatter/coordinator tests, root quality, Integration, Browser,
   documentation, repository, Secret, diff, scope, and cleanup gates pass.
7. The one synthetic injected focused run exits non-zero and reports exactly
   `cleanup-synthetic`, `child-physical=clean`, `child-capsule=removed`,
   `remaining-child=clean`, and `owned-cleanup=verified` with zero task-owned
   residue.
8. The final diff contains only the ten combined allowlist files, reproduces the
   inherited checkpoint without unrelated change, keeps the lockfile unchanged,
   and leaves zero task-owned runtime or repository-store residue.
9. M2-QUAL-008, M2-QUAL-007, M2-QUAL-003, and M2-GOV-006 remain Blocked; M2
   remains In Progress and M3 remains Not Started.

## Required tests and commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts packages/testing/src/concurrent-smoke.test.ts
corepack pnpm check
corepack pnpm test:integration
corepack pnpm test:browser
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

After all deterministic and ordinary gates pass, run exactly once:

```text
CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE=1 corepack pnpm test:integration:concurrent:fg07
```

- the expected result is non-zero with the exact safe fields from Acceptance
  Criterion 7 and zero task-owned residue;
- `cleanup-failed`, `cleanup-unclassified`, missing state fields, parent cleanup
  failure, unexpected signal, unrelated test failure, residue, or exit zero is
  Blocked and stops without rerun or parser broadening;
- a lost final exit status is neither pass nor failure. After proving zero
  owned residue, one explicit-exit-code replacement is allowed and must be
  recorded honestly;
- do not run a non-injected focused attempt or the ordinary full Concurrent
  command in this Work Item.

Before and after every process-starting command, record only task-owned process,
Compose project/container, temporary-root, and repository-store deltas. Do not
kill, remove, or relabel pre-existing state.

## Security review

The emitted record is reconstructed from internal bounded fields and contains
no arbitrary error content. It uses the existing child stderr pipe and does not
add a log sink, persistence, Credential, network capability, user-data path,
Authorization change, or hash. The constant unknown-error record fails closed.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must not change. Rollback is one
focused Git revert of the combined diagnostic branch after publication.

## Observability

One existing sanitized Harness record becomes explicit in the child process's
already-bounded stderr capture. No product Log, Metric, Trace, Audit Event, raw
output, or persistent diagnostic changes.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md), only
  for the explicit sanitized teardown emission;
- this Work Packet;
- `docs/implementation/roadmap.md`.

No capability Current-truth, README, AGENTS, DEC, Acceptance Record, or M3
document changes.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `6d6155266463d10b8684ebb0e6df27a1adf28f39`:

- correctness and executability: `/root/m2_qual_009_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_009_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model
`UNVERIFIED_RUNTIME_MODEL`. Goal, preserved checkpoint, formatter/transport
contract, exact ten-file boundary, stopping rules, security impact, tests, and
cleanup requirements are specified. No Blocking Design Question or new DEC is
present.

## Definition of Done

The formatter, explicit transport, inherited checkpoint, and ordinary gates
pass independent review. The one synthetic injected run returns the exact
expected non-zero safe evidence and zero task-owned residue. M2-QUAL-009 may
then publish the combined quality-tooling branch, but publication does not mark
M2-QUAL-008, M2-QUAL-007, or M2-QUAL-003 Completed and does not claim a cleanup
root cause. Any other live result leaves this Work Item Blocked. The diff stays
exact, the lockfile is unchanged, and task-owned residue is zero.

## Git authority

After Definition of Ready passes, the Orchestrator may commit and publish this
planning packet. The implementation Agent may modify only the files and
behavior authorized by the Ready contract and must stop before Git publication.
After independent implementation review passes, the Orchestrator may commit,
push, and create a Draft PR. Only all-green final-head CI and no unresolved
finding or escalation permit Ready-for-review status and squash merge. The
implementer cannot approve or merge its own work. A successful synthetic run
authorizes only this combined quality-tooling publication, not a real FG replay
or cleanup repair.
