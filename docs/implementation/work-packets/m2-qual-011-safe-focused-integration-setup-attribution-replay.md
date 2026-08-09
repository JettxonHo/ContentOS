# M2-QUAL-011 — Safe Focused Integration Setup Failure Attribution and Replay

**Status:** Ready

**Issue:** [#175](https://github.com/JettxonHo/ContentOS/issues/175)

## Historical Blocked record (retained)

The following sections preserve the reviewed historical M2-QUAL-011 Blocked
record as evidence. They are not the renewed implementation contract and do
not claim a renewed code or replay PASS; the renewed Definition-of-Ready result
is recorded below.

**Historical Status:** **Blocked — Browser setup gate failure**

## Identification

- Task ID: `M2-QUAL-011`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Defect
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
- Planning Branch: `codex/m2-qual-011-safe-setup-attribution-plan`
- Planning Base SHA: `6a9149be368a9b826c2c13b095ac2459362f2fde`
- Implementation Thread: `/root/m2_qual_011_implementation`
- Implementation Branch: `codex/m2-qual-011-safe-setup-attribution-impl`
- Implementation Base SHA: `d2a1db7d797707f6791ebb324f4bee0ee8499d10`
- Dependencies: M2-QUAL-006 and M2-QUAL-009 completed; M2-QUAL-003
  Blocked record merged through PR #174
- Risk Classification: bounded Integration Harness diagnostic and cleanup
  evidence

## Goal

Replace only the Integration Harness's generic `setup=setup-failed` fallback
with one fixed, safe setup-phase category, then replay the exact focused Worker
Integration command under a bounded first-red rule. This Work Item attributes a
failure boundary; it does not diagnose or repair its root cause.

## Context

The final M2-QUAL-003 replay started from clean base
`2297bad3415157a7f84ff60e6a9a39dc9985adc6`. Its first focused Worker attempt
exited `1` with only `setup=setup-failed teardown=clean`; task-owned entry and
post-attempt aggregate state were zero, and first-red stopping prevented every
later gate. The Worker test body did not run. PR #174 published only that
Blocked evidence; its Worker test delta remains unpublished and Issue #147
remains open.

The Integration Harness already emits stable specific setup categories for
managed-process identity, Docker, application build, Compose startup, host-port
resolution, bucket HTTP rejection, migration, API/Web readiness, and ownership
validation. Other credible setup boundaries still fall through to the generic
category. `teardown=clean` proves only that teardown did not reject; it does not
identify whether failure occurred before runtime construction or after a
partially initialized runtime was cleaned.

This Work Item adds only an in-memory phase snapshot for that final fallback.
It preserves the existing record grammar and all existing category precedence.
M2-QUAL-003 and M2-GOV-006 remain Blocked, M2 remains In Progress, and M3
remains Not Started.

## Implementation checkpoint

The implementation branch records the nine-phase local tracker, snapshots it
before teardown, and uses it only after the existing specific setup classifier
has declined a category. Focused unit evidence covers all phase mappings,
specific-category precedence, bounded sensitive-input redaction, snapshot
independence, and the existing concurrent parser path.

The unpublished-code implementation review is not a PASS: the current
teardown-independence unit only awaits `Promise.resolve()` and does not execute
real teardown or runtime removal. This evidence gap must be corrected before
any future code publication; the combined code branch remains unpublished.

## Gate and replay outcome

**Terminal outcome:** **Blocked — Browser setup gate failure.** The first sandbox
root `check` stopped only on five existing `process-identity.test.ts` cases with
`spawn EPERM`; 52/53 files and 545/550 tests passed before that stop. The exact
process-enabled root `check` then passed (53 files, 550 tests, and all five
application builds) without test changes. The full Integration gate passed (27
files, 185 tests, with the existing `pg@9` warning). The required Browser gate
returned exit code `1` with only the bounded message `Browser smoke harness
reported a classified setup failure.` No Browser rerun was made. Under the
first-red rule, the focused Worker replay was not run and no phase-specific
setup attribution or root-cause/repair claim is made.

The ten replay injection variables were not evaluated because the Browser gate
stopped the sequence. The post-gate aggregate residue snapshot is zero for
application processes, exact `contentos-smoke-*` Compose containers/projects,
coordinator and Harness temporary roots, and this worktree's repository-local
`.pnpm-store`. No PID, path, credential, port, or raw child output is retained.
M2-QUAL-003 and M2-GOV-006 remain Blocked; M2 remains In Progress; M3 remains
Not Started.

## Independent Blocked evidence review

**PASS.** Independent Blocked-evidence review completed against reviewed
base/checkpoint `d2a1db7d797707f6791ebb324f4bee0ee8499d10`:

- correctness: `/root/m2_qual_011_blocked_correctness_review`;
- scope: `/root/m2_qual_011_blocked_scope_review`.

Both reviewers used logical role `INDEPENDENT_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`.
This PASS is limited to exact Work Packet and Roadmap Blocked publication from
latest `main` after green publication CI. It is not code or implementation
review PASS and does not authorize modification of the four code/test/current-
truth files, code-gap repair, a Browser rerun, the focused Worker replay, Issue
#175 closure, M2-QUAL-003 or M2-GOV-006 completion, M2 completion, or M3 entry.
The recorded teardown-independence evidence gap remains: the current unit only
awaits `Promise.resolve()` and does not execute real teardown or runtime
removal.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, Definition
  of Ready/Done, and scope governance.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-006 Work Packet](m2-qual-006-managed-process-capture-cleanup.md)
- [M2-QUAL-009 Work Packet](m2-qual-009-explicit-child-teardown-record-emission.md)
- [M2-QUAL-010 Work Packet](m2-qual-010-real-fg07-evidence-replay.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No Blocking Design Question or
new DEC is currently identified.

## In scope

1. Start implementation from a clean latest-`origin/main` worktree after this
   Ready packet merges; record branch, base SHA, Node, pnpm, and initial status.
2. Add a task-local, in-memory setup-phase tracker to the Integration Harness.
   Set the phase immediately before each currently generic fallible setup
   boundary and snapshot it before teardown begins.
3. Preserve all existing message-derived specific setup classifications and
   their precedence. Use the phase only when the existing classifier would
   otherwise return `setup-failed`.
4. Emit only one fixed allowlisted category in the existing
   `setup=<category>` field. Never retain the source error, message, cause, or
   stack.
5. Add focused unit evidence for phase mapping, existing-category precedence,
   redaction, teardown independence, and compatibility with the existing
   concurrent diagnostic parser.
6. Synchronize the Integration Harness Current-truth, this Work Packet, and
   Roadmap.
7. After deterministic and ordinary gates pass, run the exact focused Worker
   Integration command sequentially at most three times. Every physical
   invocation consumes one slot; stop on the first red or missing exit status.
8. Record only the bounded setup/teardown result and task-owned aggregate
   residue evidence. A later phase-specific repair requires a separate Ready
   Work Item and Issue created by the Orchestrator after independent evidence
   review.

## Out of scope

- changing `worker-dispatcher.test.ts` or publishing any preserved M2-QUAL-003
  implementation delta;
- changing `global-setup.ts`, `run-concurrent-smoke.ts`,
  `process-identity.ts`, setup/teardown record grammar, capture size, cleanup,
  ownership, timeout, retry, sleep, signal, or process behavior;
- adding a failure-injection switch, reporter, persistent diagnostic artifact,
  raw-output sink, hash, dependency, package, or configuration;
- changing product, API, Fetcher Gateway, database, Worker, Queue, Web,
  Fetcher, Renderer, Schema, migration, Compose, CI, Accepted DEC, Acceptance
  Record, README, AGENTS, or another Work Packet;
- treating a setup phase as a root cause or fixing an attributed phase in this
  Work Item;
- completing Issue #147, M2-QUAL-003, M2-GOV-006, M2, or starting M3.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `packages/testing/src/concurrent-smoke.test.ts`, only for compatibility and
  redaction evidence using the existing parser
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-011-safe-focused-integration-setup-attribution-replay.md`
- `docs/implementation/roadmap.md`

### Prohibited files

- `packages/testing/src/integration/worker-dispatcher.test.ts`,
  `global-setup.ts`, `run-concurrent-smoke.ts`, and `process-identity.ts`;
- all `apps/**`, product packages, manifests, lockfiles, migrations, Schema,
  Drizzle metadata, Compose, CI, Decisions, Sessions, README, AGENTS, and
  Acceptance Records;
- every existing M2 Work Packet other than this new packet.

No generated or runtime file may be committed. Remove only state proven
task-owned. Pre-existing processes, containers, worktrees, volumes,
directories, and package stores are not cleanup targets.

## Contracts

### Safe setup-phase contract

The phase tracker is local to one `setup()` invocation and is not persisted.
The exact new fallback categories are:

- `harness-preflight-failed`
- `build-preparation-failed`
- `compose-operation-failed`
- `credential-setup-failed`
- `object-storage-provision-failed`
- `origin-allocation-failed`
- `api-launch-failed`
- `web-launch-failed`
- `ready-state-publication-failed`

The phase is set immediately before its real fallible boundary. Existing
specific classifications, including `process-identity-failed`,
`docker-unavailable`, `build-failed`, `compose-start-failed`,
`partial-compose-injected`, `port-resolution-failed`, `bucket-create-failed`,
`migration-failed`, `api-start-failed`, `web-start-failed`, and
`ownership-invalid`, retain precedence and exact spelling.

The existing output grammar remains unchanged:

```text
contentos smoke setup failed: setup=<safe-category> teardown=<clean|failed> ...
```

Unknown calls without a valid phase still return `setup-failed`. The classifier
never derives a phase from arbitrary exception text and never emits that text.
The phase means only “the current setup boundary when an otherwise generic
failure was caught.”

### Replay command and attempt bound

After all deterministic and ordinary gates pass, the only task-specific replay
command is:

```text
fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
```

Run it sequentially at most three times. Every physical invocation consumes one
slot. Stop on the first non-zero result; never rerun that failure to green. A
missing final exit status is Blocked and stops without replacement.

Before replay, confirm the ten M2-QUAL-010 concurrent/Harness injection
variables are unset and emit only `injection-env=unset`; if any is defined,
print names only and stop Blocked before the first attempt. Record aggregate
counts only for application processes belonging to this worktree, exact
`contentos-smoke-*` Compose projects/containers, coordinator temporary roots,
and this worktree's repository-local `.pnpm-store`. Require zero new task-owned
delta after every attempt. Do not output or persist PID, command, absolute path,
credential, port, or raw child output.

### Terminal outcomes

1. **Completed — Attributed `<category>`:** the first red has explicit exit
   `1`, exactly one of the nine new phase categories, `teardown=clean`, no
   second failure boundary, and zero task-owned residue. The diagnostic change
   may be published after independent review and green final-head CI. The
   Orchestrator creates a separate repair Issue only after review; no repair is
   made here.
2. **Completed — Not Reproduced:** all three attempts explicitly exit `0` with
   zero task-owned residue. Publish only `not reproduced`; M2-QUAL-003 remains
   Blocked pending its own final replay.
3. **Blocked:** generic/unclassified output, an existing unrelated setup
   category, teardown failure, conflicting/missing fields, unexpected signal,
   defined injection, missing exit status, task-owned residue, or any required
   deterministic/ordinary gate failure stops the Work Item. Do not broaden
   instrumentation or make a speculative repair in place.

No outcome publishes the preserved Worker delta or completes M2-QUAL-003,
M2-GOV-006, M2, or M3 entry.

## Acceptance criteria

1. Every currently generic setup boundary is assigned exactly one of the nine
   fixed phases immediately before its fallible operation.
2. Existing recognized categories retain precedence and exact output shape.
3. Arbitrary Error and non-Error values, including a representative input with
   private text, an absolute path, URL, or Secret-like value, emit only a fixed
   category; none of the input appears. This is one bounded redaction
   regression, not a generalized exception matrix.
4. The phase snapshot remains available while teardown runs and after clean
   teardown removes runtime state.
5. Teardown classification, cleanup behavior, ownership, process signals, and
   runtime record transport remain unchanged.
6. The existing concurrent parser accepts a new phase category through its
   existing safe setup-category path without parser or capture changes.
7. Focused unit tests cover all nine phase mappings, existing-specific
   precedence, the bounded sensitive-input regression, teardown independence,
   and parser compatibility.
8. Frozen install, workspace, root quality, full Integration, Browser,
   documentation, repository, Secret, diff, scope, artifact, and residue gates
   pass before replay.
9. The replay obeys the three-physical-invocation cap and first-red rule, and
   reaches exactly one terminal outcome without exceeding its evidence.
10. The final diff is limited to the six allowed files; no dependency,
    lockfile, Schema, migration, Compose, CI, production, or unrelated
    documentation change occurs.

## Required commands and evidence

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts packages/testing/src/concurrent-smoke.test.ts
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm test:browser
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
```

After these pass, run the exact replay command one attempt at a time under the
terminal contract. Final-head GitHub CI must pass before a Completed
implementation PR may merge.

## Security review

This Work Item handles no user content, credential, provider transmission, or
new network boundary. Categories come only from a static internal phase. It
does not retain source errors or add a new sink, hash, Secret path, or cleanup
authority. One representative redaction regression is sufficient; do not add
an exhaustive impossible-case matrix.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must remain unchanged. Rollback is a
focused Git revert of the diagnostic implementation and documentation.

## Observability

No product Log, Metric, Trace, Audit Event, or persistent artifact changes. The
only new evidence is one fixed setup category in the existing sanitized Harness
record.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- this Work Packet
- `docs/implementation/roadmap.md`

No README, AGENTS, DEC, Acceptance Record, API, Schema, or M3 documentation
changes.

## Historical Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `6a9149be368a9b826c2c13b095ac2459362f2fde`:

- correctness and executability: `/root/m2_qual_011_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_011_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`. They
validated the nine fixed phases, existing-category precedence, six-file scope,
bounded tests and replay, mutually exclusive terminal outcomes, cleanup
ownership, and planning/Completed/Blocked publication sequencing. No Blocking
Design Question or new DEC is present.

## Historical Definition of Done

The six-file implementation stays within this contract; deterministic and
ordinary gates pass; replay reaches one permitted terminal outcome; task-owned
residue is zero; independent implementation review finds no unresolved issue;
and documentation, final-head CI, and Git status match the claimed outcome.

For **Completed**, independent implementation review PASS permits the
Orchestrator to commit, push, and open a Draft PR containing the six-file
implementation. Green final-head CI and no unresolved finding or escalation are
then required before Ready status and squash merge.

For **Blocked**, the combined code branch is not published. After independent
evidence/scope review PASS, the Orchestrator may create a separate latest-main
branch, commit only this Work Packet and Roadmap, push, and open a Draft PR.
Green final-head publication CI and no record-accuracy, scope, or unrelated CI
finding are required before that two-document record may become Ready and
squash-merge. The Work Item remains Blocked; publication does not authorize a
repair.

## Historical Git authority

After Definition of Ready passes, the Orchestrator may commit, push, and open a
Draft PR for the planning packet. Green final-head CI and no unresolved finding
or escalation are required before Ready status and squash merge. The
implementation Agent may modify only the six allowlisted files in a fresh
implementation worktree and must stop before Git publication or Issue mutation.

After independent implementation review, the Orchestrator may commit, push,
and create a Draft PR only for a permitted Completed outcome. All required
final-head CI must be green and no finding or escalation may remain before
Ready status and squash merge. For a Blocked outcome, only the separate
two-document Draft-PR path in Definition of Done is authorized. The implementer
cannot approve or merge its own work.

## Renewed planning (Ready for renewed implementation)

The following is the renewed plan on the latest reviewed planning base. Its
Definition of Ready has passed; it does not convert the historical Browser-gate
Blocked result into a code or replay PASS.

### Renewed identification

- Task ID: `M2-QUAL-011`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Defect
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
- Renewed Planning Branch: `codex/m2-qual-011-renewed-ready-plan`
- Renewed Planning Base SHA: `ba99ef750141e2eef83e54742bc816c65d4bca0b`
- Proposed Implementation Branch: `codex/m2-qual-011-safe-setup-attribution-final-impl`
- Proposed Implementation Base: the exact latest `origin/main` SHA after this
  renewed packet merges; record it before any implementation edit or runtime
  command
- Preserved Reference Worktree: `/private/tmp/contentos-m2-qual-011-impl-wt`
  (read-only facts only; do not copy or apply its overall diff)
- Dependencies: M2-QUAL-006 and M2-QUAL-009 completed; M2-QUAL-012 completed
  through PR #180, with status synchronized through PR #181; M2-QUAL-003
  remains Blocked
- Risk Classification: bounded Integration Harness diagnostic and cleanup
  evidence
- Issue lifecycle: Issue [#175](https://github.com/JettxonHo/ContentOS/issues/175)
  remains Open; do not create, close, or mutate an Issue and do not create a
  replacement Issue in this planning task

### Renewed goal and fixed context

Replace only the Integration Harness's generic setup fallback with one fixed,
safe setup-phase category, while repairing the teardown-independence evidence
gap before any implementation publication. Then replay the exact focused
Worker Integration command only after the complete latest-head gates pass. The
Work Item attributes a failure boundary; it does not infer or repair a root
cause.

M2-QUAL-012 is now **Completed — Not Reproduced** through merged PR #180
(squash SHA `62a246a01658f0c5c7e1a165b01056df4a301c1d`) and status PR #181;
the Browser safe setup-record transport is available. The historical
M2-QUAL-011 Browser failure remains a retained Blocked fact. It is not replayed
or reinterpreted here.

The preserved implementation reference records the narrow phase tracker and
focused evidence, but its teardown-independence unit only awaited
`Promise.resolve()`: it did not execute teardown or remove shared runtime
state. That unit is insufficient and must be replaced, not retained alongside
the corrected test. The preserved six-file diff is not a publication source.

M2-QUAL-003 and M2-GOV-006 remain Blocked, M2 remains In Progress, M3 remains
Not Started. The historical Worker replay count is `0` because the Browser gate
stopped before Worker; the renewed Worker replay count also starts at `0`.

### Renewed in scope

1. Start a fresh implementation worktree from the exact latest `origin/main`
   after this renewed packet merges. Use the proposed implementation branch,
   record the exact base SHA, Node, pnpm, and clean initial status, and inspect
   the preserved reference only as read-only factual context.
2. In `packages/testing/src/integration/harness.ts`, add the smallest narrow
   production seam, such as
   `createSetupFailureError(setupError, { snapshotPhase, teardown })`.
   The helper must snapshot the supplied phase, await the supplied teardown,
   and only then classify the setup failure. The real setup catch must pass the
   existing tracker snapshot and the real teardown operation.
3. Replace the old `Promise.resolve()`-only teardown-independence unit with a
   test that calls the same production helper and a teardown operation that
   really clears the shared test runtime/state. Assert the strict operation
   order, exactly-once snapshot and teardown calls, runtime/state removal, and
   the exact clean record's continued use of the pre-teardown phase snapshot.
   Add the second structured `HarnessCleanupError` path: teardown clears state
   and then throws, while the record retains the phase and canonical failed
   teardown fields exactly.
4. Keep the existing concurrent parser compatibility and bounded redaction
   evidence in `packages/testing/src/concurrent-smoke.test.ts`; replace the old
   unit rather than adding a parallel Promise-only test.
5. Synchronize only the Integration Harness Current-truth, this Work Packet,
   and the Roadmap in the future six-file implementation. This renewed planning
   change itself writes only this Work Packet and the Roadmap.
6. After the full latest-head gate is green, run the exact focused Worker
   command sequentially at most three physical times under the first-red rule.
   Record only sanitized setup/teardown fields and aggregate task-owned residue.

### Renewed out of scope

- Publishing or copying the preserved M2-QUAL-011 implementation diff as a
  whole, or changing `worker-dispatcher.test.ts` or any preserved
  M2-QUAL-003 delta.
- Exporting `HarnessRuntime`, `teardown`, or `teardownRuntime`; changing
  cleanup behavior, timeout, retry, sleep, signal, process lifecycle, capture,
  ownership, or setup/teardown output grammar.
- Treating any phase as a root cause, adding a speculative root-cause repair,
  or changing Product, API, Worker, Queue, Web, Fetcher, Renderer, Schema,
  migration, Compose, CI, or deployment behavior.
- Adding injections, hashes, artifacts, raw-output sinks, an error matrix,
  dependencies, configuration, or a new DEC.
- Automating Approval or publishing, completing Issue #175, M2-QUAL-003,
  M2-GOV-006, M2, or starting M3.
- Any Git, GitHub, runtime, or integration/browser test execution in this
  planning turn.

### Renewed six-file boundary

The implementation allowlist is unchanged:

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `packages/testing/src/concurrent-smoke.test.ts` (compatibility and bounded
  redaction evidence only)
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-011-safe-focused-integration-setup-attribution-replay.md`
- `docs/implementation/roadmap.md`

No generated or runtime file may be committed. In this renewed planning
worktree the exact write scope is only the last two documentation files.

### Renewed contracts

#### Narrow setup-failure helper

The helper seam is internal to the Harness except for the minimal production
test seam required by the focused unit. Its required sequence is:

```text
snapshot supplied phase → await teardown exactly once → classify setup error
```

The helper must preserve existing message-derived category precedence and use a
phase only for an otherwise generic setup failure. The real `setup()` catch
passes `tracker.snapshot()` and the real `teardown` operation into the helper;
it does not classify before cleanup. `HarnessRuntime`, `teardown`, and
`teardownRuntime` remain unexported.

The nine fixed fallback phase categories remain:

- `harness-preflight-failed`
- `build-preparation-failed`
- `compose-operation-failed`
- `credential-setup-failed`
- `object-storage-provision-failed`
- `origin-allocation-failed`
- `api-launch-failed`
- `web-launch-failed`
- `ready-state-publication-failed`

Existing categories retain precedence and exact spelling:
`process-identity-failed`, `docker-unavailable`, `build-failed`,
`compose-start-failed`, `partial-compose-injected`, `port-resolution-failed`,
`bucket-create-failed`, `migration-failed`, `api-start-failed`,
`web-start-failed`, and `ownership-invalid`.

The existing grammar remains unchanged:

```text
contentos smoke setup failed: setup=<safe-category> teardown=<clean|failed> ...
```

Unknown calls without a valid phase remain `setup-failed`. Arbitrary Error or
non-Error input, including private text, an absolute path, a URL, or a
Secret-like value, never becomes a category and never appears in a record.
Generic failures, existing non-target categories, teardown failures, malformed
or conflicting records, and parser conflicts cannot be explained as a phase.

#### Teardown-independence evidence

The focused unit must exercise the same production helper in both paths. In the
clean path, a real teardown operation clears the shared test runtime/state;
assertions prove snapshot-before-teardown ordering, one snapshot, one teardown,
state removal, and exact `teardown=clean` output using the pre-teardown phase.
In the structured failure path, the operation clears that state before throwing
the canonical `HarnessCleanupError`; assertions prove exact phase retention and
canonical `teardown=failed` cleanup/physical/capsule fields without arbitrary
error text. The two paths are mutually explicit and the old Promise-only test
does not remain.

#### Gate and replay contract

Before any runtime gate, confirm all ten M2-QUAL-010 concurrent/Harness
injection variables are unset and record only `injection-env=unset`. The latest
head must pass, in order, the focused Harness plus concurrent tests, root
`check`, the full Integration gate, and one ordinary non-injected Browser
acceptance gate. Require zero task-owned aggregate residue after each gate.

Only after all four gates are green may the exact Worker command run:

```text
fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
```

Run at most three sequential physical invocations. Every invocation consumes a
slot; a first red or missing final exit status stops immediately and is never
rerun-to-green. The renewed Worker replay count is zero until that point. A
Browser red, missing status, or residue stops the sequence before Worker and
does not authorize a Browser rerun.

#### Mutually exclusive terminal outcomes

The renewed replay has exactly one terminal outcome, selected only after the
required evidence is complete:

1. **Completed — Attributed `<category>`:** the first red Worker replay is an
   explicit exit `1`, exactly one of the nine new phase categories is present,
   `teardown=clean`, no second failure boundary is present, and the
   task-owned residue delta is zero. The diagnostic may be published only
   after independent review and green final-head CI. A separate repair Issue
   may be created only by the Orchestrator after that review; no repair is made
   here.
2. **Completed — Not Reproduced:** all three Worker attempts explicitly exit
   `0`, each has zero task-owned residue delta, and no category is attributed.
   Publish only the `not reproduced` claim; M2-QUAL-003 remains Blocked pending
   its own final replay.
3. **Blocked:** any generic or unclassified result, existing non-target setup
   category, teardown failure, malformed/conflicting/missing field, unexpected
   signal, defined injection, missing final status, task-owned residue, or
   required-gate failure. Stop at that boundary; do not broaden the
   instrumentation, rerun-to-green, or make a speculative repair.

The ordinary Browser acceptance gate is a required gate: Browser red, missing
status, or residue is therefore **Blocked** and prevents Worker entry, with no
Browser rerun-to-green.

### Renewed acceptance criteria

1. The narrow production helper snapshots before teardown, awaits teardown,
   and classifies only after teardown; the real setup catch supplies the
   existing tracker snapshot and real teardown.
2. Existing setup-category precedence, exact output grammar, cleanup behavior,
   timeout, retry, signal, process, ownership, and parser behavior remain
   unchanged.
3. The replacement focused unit executes real shared-state teardown, proves
   order and exactly-once behavior, proves runtime/state removal, and proves
   exact pre-teardown phase retention for both clean and canonical structured
   failed teardown paths.
4. Focused Harness/concurrent tests cover all nine phase mappings, existing
   specific precedence, one bounded sensitive-input regression, and parser
   compatibility. No generalized error matrix is added.
5. Frozen install/workspace, focused tests, root `check`, full Integration, one
   ordinary Browser acceptance gate, documentation, repository, Secret, diff,
   scope, artifact, and residue checks pass before Worker replay.
6. Worker replay obeys the three-physical-invocation cap and first-red/missing
   status rule; Browser red/missing/residue prevents Worker entry and any
   rerun-to-green.
7. Every terminal outcome is one bounded attributed category,
   `Completed — Not Reproduced`, or `Blocked`; no outcome claims a root cause,
   code PASS, M2-QUAL-003 completion, M2 completion, or M3 entry.
8. The final implementation diff contains exactly the six allowlisted files;
   this renewed planning diff contains exactly the two documentation files.

### Renewed evidence commands (future implementation only)

These commands define future implementation evidence and were not run in this
planning turn:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts packages/testing/src/concurrent-smoke.test.ts
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm test:browser
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
```

The exact Worker command above is the only replay command. No output may retain
PID, absolute path, credential, port, raw child output, or a persistent
artifact. Pre-existing state is not a cleanup target.

### Renewed security, migration, and observability review

This bounded diagnostic handles no user content, Credential, provider
transmission, or new network boundary. It adds no hash, artifact, dependency,
Secret path, or cleanup authority. Static phase categories and canonical
teardown fields are the only new evidence. There is no database, Schema,
migration, API, Queue, configuration, or compatibility change, and no product
Log, Metric, Trace, Audit Event, or persistent runtime artifact change.

### Renewed documentation updates

The future six-file implementation synchronizes the Integration Smoke Harness
Current-truth, this Work Packet, and the Roadmap. The current renewed planning
change updates only this Work Packet and `docs/implementation/roadmap.md`.
No README, AGENTS, DEC, Acceptance Record, API, Schema, or M3 document changes
are permitted.

### Renewed Definition of Ready

**PASS.** Independent Sol Definition-of-Ready reviews completed against
planning base `ba99ef750141e2eef83e54742bc816c65d4bca0b`:

- correctness and executability: `/root/m2_qual_011_renewed_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_011_renewed_dor_governance`.

Both reviewers use logical role `DEFINITION_OF_READY_REVIEWER`, request
`gpt-5.6-sol` / High, and record actual runtime model
`UNVERIFIED_RUNTIME_MODEL`. They verified the narrow helper sequence, real
teardown/state removal, exact two-path evidence, current Browser transport
dependency, six-file boundary, bounded gates/replay, Issue and publication
authority, and absence of a Blocking Design Question or new DEC. Terminal and
publication findings are closed. This is a Definition-of-Ready PASS only; no
implementation code-review PASS or replay PASS is recorded here.

### Renewed Definition of Done and Git authority

The renewed Work Item is not Done until the six-file implementation, focused
and complete gates, bounded replay, residue evidence, independent implementation
review, documentation, and final-head CI satisfy the selected terminal outcome.
For a red or missing gate, publish no code and keep the Work Item Blocked; a
two-document evidence publication does not authorize repair. A Completed
implementation or `not reproduced` result still leaves Issue #175 open until
the Orchestrator performs any separately authorized lifecycle action.

For either Completed terminal outcome, an independent implementation review
must PASS before the Orchestrator may commit, push, and create a Draft PR
containing exactly the six allowlisted files. Required final-head CI must then
be fully green with no unresolved finding or escalation before the Orchestrator
may mark the PR Ready and squash-merge it. After that merge, the Orchestrator
handles Issue #175 according to the recorded terminal outcome: a Completed
result may close Issue #175; a phase-specific repair Issue may be created only
after the attribution has been independently reviewed, and only by the
Orchestrator. No repair is made in this Work Item.

For a Blocked terminal outcome, independent evidence and scope review must PASS
before the Orchestrator may create a separate branch from latest `main`, commit
and push only this Work Packet and the Roadmap, and create a Draft PR. The
publication PR may be marked Ready and squash-merged only when its required
final-head publication CI is green and no record-accuracy, scope, unrelated
CI, integrity, or other unresolved finding remains. The recorded M2 runtime
blocker does not authorize a branch-protection bypass: publication CI normally
does not execute the unpublished implementation diff, but if that same blocker
makes the publication CI red, the PR must not merge and the Orchestrator must
stop and escalate under the existing governance. A Blocked publication leaves
the Work Item Blocked, keeps Issue #175 Open, and grants no repair authority.

This planning turn authorizes no Git commit, push, Draft PR, GitHub operation,
runtime command, or test execution. After this Ready packet merges, the
Orchestrator may create the proposed implementation branch from a fresh latest
`origin/main`; the implementer may then modify only
the six allowlisted files and must stop before commit, push, Draft PR, Ready
status, publication, approval, merge, or Issue mutation. The implementer cannot
approve or merge its own work. A later phase-specific repair, if independently
justified, requires a separate Ready Work Item and Issue; no root-cause fix is
hidden in this plan.
