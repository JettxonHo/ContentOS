# M2-QUAL-010 — Real FG-07 Evidence Replay

**Status:** Ready

**Issue:** [#169](https://github.com/JettxonHo/ContentOS/issues/169)

## Identification

- Task ID: `M2-QUAL-010`
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
- Actual Runtime Model: record if visible; otherwise
  `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED`; runtime status recorded by the
  implementation Agent
- Planning Thread: `/root`
- Planning Branch: `codex/m2-qual-010-real-fg07-replay-plan`
- Planning Base SHA: `5874d042cc4631bee10f087e3d030b681140c10d`
- Implementation Thread: assigned after this Ready packet merges
- Implementation Branch: `codex/m2-qual-010-real-fg07-replay-impl`
- Implementation Base SHA: latest `origin/main` after this Ready packet merges;
  record the exact SHA before any runtime command
- Dependency: M2-QUAL-009 Completed through PR #167 and its Completed status
  synchronized through PR #168
- Risk Classification: bounded concurrent-test execution and cleanup evidence

## Goal

Run the real, non-injected focused FG-07 concurrent loop on the merged explicit
child teardown evidence baseline. Obtain one bounded terminal result that is
safe enough to define the next repair or replay task, without changing code or
claiming a root cause that the evidence does not establish.

## Context

M2-QUAL-007 split FG-07 into `[FG-07A]` and `[FG-07B]` and introduced the fixed
two-child focused loop. M2-QUAL-008 separated child Harness cleanup evidence
from parent-owned cleanup verification. M2-QUAL-009 then made the existing
sanitized Harness teardown record explicit in the bounded child stderr capture
and verified that transport once through the synthetic teardown injection.

The real non-injected failure has not been replayed on that merged baseline.
This Work Item performs that replay only. It neither repairs a Fetcher Gateway
case nor changes Harness cleanup behavior.

`M2-QUAL-008`, `M2-QUAL-007`, `M2-QUAL-003`, and `M2-GOV-006` remain Blocked.
M2 remains In Progress and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, and quality
  gates.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-007 Work Packet](m2-qual-007-fg07-focused-concurrent-localization.md)
- [M2-QUAL-008 Work Packet](m2-qual-008-concurrent-cleanup-failure-attribution.md)
- [M2-QUAL-009 Work Packet](m2-qual-009-explicit-child-teardown-record-emission.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Start from a clean implementation worktree at the latest `origin/main`
   after this Ready packet merges; record branch, exact base SHA, Node, pnpm,
   and initial Git status.
2. Confirm the fixed focused command and merged safe diagnostic contract are
   present without modifying them.
3. Confirm every named concurrent and Harness failure-injection environment
   variable in the non-injection preflight below is unset. Record names only;
   never output values.
4. Run `corepack pnpm test:integration:concurrent:fg07` sequentially at most
   three times under Node 24.18.0 and pnpm 11.17.0.
5. Stop immediately on the first non-zero result. Do not rerun that failure to
   green.
6. After every attempt, verify only task-owned process, Compose project,
   container, temporary-root, and repository-store residue. Do not touch
   unrelated or pre-existing state.
7. Record only the existing safe coordinator diagnostic and terminal outcome
   in this Work Packet and Roadmap.
8. If a specific terminal result defines a follow-up repair boundary, the
   implementation Agent records that reviewed boundary only. After independent
   review, the Orchestrator or Planning Agent creates the separate Issue; the
   implementation Agent does not perform that GitHub write. Do not repair it in
   this Work Item.

## Out of scope

- any source, test, Harness, parser, cleanup, ownership, timeout, retry, signal,
  capture, buffer, or command change;
- any synthetic failure injection, arbitrary focused filter, ordinary full
  Concurrent run, or M2-QUAL-003 implementation replay;
- interpreting a pass as proof that the historical failure cannot recur;
- interpreting a specific diagnostic as a root cause without separate evidence;
- product, API, Fetcher Gateway, database, Worker, Queue, Web, Fetcher,
  Renderer, or application behavior;
- dependencies, lockfile, Schema, migration, Compose configuration, CI,
  Accepted DEC, Acceptance Record, M2 completion, or M3 work;
- exposing raw child output, test titles, assertions, stacks, URLs, credentials,
  paths, PIDs, ports, Secrets, Claims, Headers, SQL, or a new hash.

## Allowed and prohibited files

### Allowed files

- `docs/implementation/work-packets/m2-qual-010-real-fg07-evidence-replay.md`
- `docs/implementation/roadmap.md`

The implementation may only update status and bounded safe evidence in these
two documents. No runtime result authorizes a code change in this Work Item.

### Prohibited files

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`;
- all `apps/**`, `packages/**`, migrations, Schema, Drizzle metadata, Compose,
  CI, Decisions, Sessions, README, AGENTS, and Acceptance Records;
- M2-QUAL-003 and M2-GOV-006 Work Packets;
- every historical M2-QUAL-007, M2-QUAL-008, and M2-QUAL-009 implementation
  file or checkpoint.

No generated or runtime file may be committed. Remove only task-owned runtime
state. Pre-existing processes, containers, worktrees, volumes, directories,
and package stores are not cleanup targets.

## Contracts

### Exact command and attempt bound

The only repository process-starting diagnostic command is:

```text
corepack pnpm test:integration:concurrent:fg07
```

Attempts are sequential and capped at three. The first red result terminates
the sequence. Each physical command invocation consumes one of the three slots.
Use `fnm exec --using=24.18.0` only as the toolchain-selection wrapper; it does
not change the repository command. A tool invocation without an explicit final
exit status is always Blocked, even when retained safe text resembles a red
diagnostic. Stop without replacement; do not spend more runs trying to recover
a missing tool status.

### Non-injection preflight

The implementation must fail before the first attempt unless all ten variables
below are unset, not merely set to an inactive-looking value:

- `CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY`
- `CONTENTOS_SMOKE_INJECT_FAILURE`
- `CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE`
- `CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE`
- `CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE`
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE`

Use a bounded Node 24 check that prints only variable names if any are defined;
never print values. Any defined name leaves this Work Item Blocked before replay.
The executable preflight is:

```text
fnm exec --using=24.18.0 node -e 'const n=["CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE","CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE","CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY","CONTENTOS_SMOKE_INJECT_FAILURE","CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE","CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE","CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE","CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE","CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE","CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE"];const s=n.filter((k)=>Object.hasOwn(process.env,k));console.log(s.length?`injection-env-set=${s.join(",")}`:"injection-env=unset");process.exitCode=s.length?1:0'
```

### Accepted safe evidence

The report may retain only the coordinator's existing sanitized diagnostic
fields:

- child number, exit, signal, category, captured byte count;
- exact safe test basename or `test=unclassified`, and exact allowlisted case or
  `case=unclassified`, when present;
- one allowlisted child cleanup category plus child physical/capsule state;
- remaining-child and parent-owned cleanup result, including their existing
  fixed failure enumerations when the outcome is Blocked.

Raw child output is not persisted or copied into repository documents.

### Terminal outcomes

1. **Specific FG case:** the complete first-red coordinator result contains
   exactly one failed-child boundary with `exit=1`, `signal=none`,
   `category=test-run-failed`,
   `test=fetcher-gateway-api.test.ts`, and exactly `case=fg-07a` or
   `case=fg-07b`; every other child/parent axis is clean and no second repair
   boundary is present. The diagnostic objective is complete; a separate
   correction Work Item is required.
2. **Specific child cleanup:** the complete first-red coordinator result
   contains exactly one failed-child boundary with `exit=1`, `signal=none`, one
   allowlisted `cleanup-<category>` classification, complete child
   physical/capsule state, remaining child clean, and parent-owned cleanup
   verified; no second repair boundary is present. The diagnostic objective is
   complete; a separate cleanup correction Work Item is required.
   `cleanup-synthetic` is invalid because this Work Item runs without injection.
3. **Not reproduced:** all three sequential attempts exit zero with zero
   task-owned residue. Publish only `not reproduced`; M2-QUAL-003 remains
   Blocked pending its own final replay.
4. **Blocked evidence:** every non-zero result that does not completely and
   uniquely match outcome 1 or 2 is Blocked. This includes multiple child repair
   boundaries, FG plus cleanup evidence, generic or unclassified categories,
   non-FG tests, start/Docker/build/Compose/migration/setup failures,
   missing/conflicting safe fields, unexpected signal, non-clean remaining
   child, parent cleanup failure, task-owned residue, active injection, or
   inability to establish an exit status. Do not merge a Completed claim or
   create a speculative repair.

None of these outcomes marks M2-QUAL-003 or M2-GOV-006 Completed.

## Acceptance criteria

1. The implementation begins from latest `origin/main` with a clean worktree
   and the merged fixed FG07 command/diagnostics. Every pnpm/Node command uses
   `fnm exec --using=24.18.0`; the same context reports Node 24.18.0 and pnpm
   11.17.0 before replay. Failure to establish that context is Blocked before
   the first attempt.
2. No concurrent or Harness failure-injection switch is active for the replay.
3. At most three focused attempts run sequentially; the first red stops without
   rerun-to-green.
4. Every physical invocation consumes one of three slots and has an explicit
   exit result plus a task-owned cleanup/residue check; missing status stops
   rather than authorizing a replacement.
5. The outcome matches exactly one terminal outcome above and does not exceed
   the evidence supported by the safe coordinator fields.
6. No code, dependency, lockfile, Schema, migration, Compose, CI, DEC,
   Acceptance Record, product behavior, or unrelated documentation changes.
7. Final documentation, repository, Secret, diff, scope, artifact, and residue
   checks pass.
8. Independent review validates the evidence and status before publication.
9. M2-QUAL-008, M2-QUAL-007, M2-QUAL-003, and M2-GOV-006 remain Blocked; M2
   remains In Progress and M3 remains Not Started.

## Required commands and evidence

Before runtime replay, use the same explicit Node 24 wrapper for every Node or
pnpm command:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Run the exact focused command one attempt at a time through
`fnm exec --using=24.18.0`, following the attempt and terminal-outcome contract.
Do not run Integration, Browser, ordinary full Concurrent, or an injected
focused command as a substitute.

After the terminal result and documentation update:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-qual-010-real-fg07-evidence-replay.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
git status --short --untracked-files=all
```

Before the first attempt, record aggregate counts only for exact
`contentos-smoke-*` Compose projects/containers, coordinator temporary-root
basenames, application processes belonging to this implementation worktree,
and the presence of this worktree's repository-local `.pnpm-store`. While a
claim exists, use its authenticated project/root ownership. After each attempt,
require the coordinator result plus zero newly added aggregate delta against
that entry snapshot. Do not record PID, command, or absolute path. Delete only
state proven task-owned; do not use broad process termination, Compose prune,
volume deletion, or global temporary-directory cleanup.

## Security review

This Work Item handles no user content, credential, provider transmission, or
new network boundary. It consumes only the already-sanitized coordinator
diagnostic, records no raw output, and adds no hash. Cleanup remains exact and
task-owned; unrelated local state is never a cleanup target.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must remain unchanged. Rollback is a
focused Git revert of the two-document evidence publication.

## Observability

No new Log, Metric, Trace, Audit Event, sink, or persistent runtime artifact.
The Work Packet records only one existing sanitized terminal diagnostic or
three explicit zero exits.

## Documentation updates

- this Work Packet;
- `docs/implementation/roadmap.md`.

No Current-truth capability document, README, AGENTS, DEC, Acceptance Record,
or M3 document changes.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `5874d042cc4631bee10f087e3d030b681140c10d`:

- correctness and executability: `/root/m2_qual_010_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_010_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`.
The exact non-injected command, three-physical-invocation cap, Node 24 context,
unset injection preflight, mutually exclusive terminal outcomes, task-owned
cleanup evidence, exact two-file boundary, Blocked publication path, and Git
authority are executable. No Blocking Design Question or new DEC is present.

## Definition of Done

The Work Item has one accepted terminal outcome, complete task-owned cleanup
evidence, exact two-file documentation scope, passing static repository gates,
and independent review.

- A specific FG case or specific child cleanup outcome completes only the
  diagnostic and requires a separate repair Work Item.
- Three passes complete only a `not reproduced` publication and keep
  M2-QUAL-003 Blocked pending its own final replay.
- A Blocked-evidence outcome leaves this Work Item Blocked and is not Done.

No outcome is a Conditional Pass, M2 acceptance, or authority to start M3.

## Git authority

After Definition of Ready passes, the Orchestrator may commit and publish this
planning packet. The implementation Agent may run only the authorized replay
and update the two allowed documents; it must stop before Git publication.
For a specific diagnostic or three-pass `not reproduced` result, independent
implementation review must pass before the Orchestrator may commit, push, and
create a Draft PR. Only all-green final-head CI and no unresolved finding or
escalation permit Ready-for-review status and squash merge.

For a Blocked-evidence result, reviewers may instead PASS the accuracy,
cleanup, and exact two-document publication scope while the runtime blocker
remains unresolved. The Orchestrator may publish that Blocked record only when
the publication PR's required final-head CI is green and no unrelated CI,
record-integrity, review, scope, or cleanup finding remains. The Work Item stays
Blocked and not Done; publication is not Conditional Pass and authorizes no
repair. If the recorded blocker also prevents publication CI from passing,
stop and escalate rather than bypassing the gate. The implementer cannot
approve or merge its own work.
