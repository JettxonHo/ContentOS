# M2-QUAL-015 — Normal-Permission API Readiness Lifecycle Checkpoint Reconstruction and Replay

**Status:** In Review — independent review passed; awaiting GitHub CI
**Issue:** [#192](https://github.com/JettxonHo/ContentOS/issues/192) (Open)
**Related Issue:** [#188](https://github.com/JettxonHo/ContentOS/issues/188) (Open)

This Work Item reconstructs the reviewed but unpublished M2-QUAL-014
API-readiness lifecycle checkpoint on fresh latest main and obtains a new,
strictly normal-process-permission replay. It does not rewrite M2-QUAL-014,
diagnose a root cause, or authorize a repair.

## Identification

- Task ID: `M2-QUAL-015`
- Title: Normal-Permission API Readiness Lifecycle Checkpoint Reconstruction
  and Replay
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Checkpoint Reconstruction and Replay
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED`; runtime identity unavailable
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-015-plan-wt`
- Planning Branch: `codex/m2-qual-015-normal-permission-replay-plan`
- Planning Base/HEAD: `f02ac2c8ec234e82e08b44502a4bd9b2e191d753`
- Planning Initial Status: clean
- Implementation Thread: `/root/m2_qual_014_implementation` (thread reused for
  M2-QUAL-015 because the orchestrator did not provide a new canonical path)
- Implementation Worktree:
  `/private/tmp/contentos-m2-qual-015-impl-wt`
- Implementation Branch: `codex/m2-qual-015-normal-permission-replay-impl`
- Implementation Base/HEAD: `8419524ebf7d4cbcf1597afc81ac35b8a3c4d326`
- Implementation Initial Status: clean
- Planning Gate: implementation began only after this Packet was Ready and its
  planning PR merged with green final-head CI
- Dependencies: M2-QUAL-014 historical Blocked record and merge-status sync
  published through PRs #190 and #191; Issues #192 and #188 remain Open
- Risk Classification: bounded test-harness reconstruction and replay

## Goal

From a fresh latest-main implementation worktree, manually reconstruct exactly
the three reviewed M2-QUAL-014 implementation files, prove ephemeral non-hash
byte equivalence to the preserved checkpoint, and replay every process-spawning
gate with normal process permission from its first physical invocation. Publish
the checkpoint only after one exact terminal outcome and new independent review.

## Context and authority

M2-QUAL-014 added a formatter and thin caller that would emit one fixed
API-child lifecycle observation at the existing `api-start-failed` readiness
deadline. Independent implementation review found no code, architecture,
security, or test-coverage defect. That implementation nevertheless remained
unpublished because root `check` was first invoked in the default sandbox,
contrary to its explicit normal-permission-first contract. Later green evidence
could not repair that historical ordering violation.

This Work Item creates a new evidence boundary. It may use the prior code review
as design context only. It cannot inherit an implementation PASS: the fresh
five-file diff, reconstruction equivalence, command ordering, runtime evidence,
and terminal outcome require new independent review.

M2-QUAL-014 remains historical **Blocked** even if this Work Item completes.
Issues #192 and #188 remain Open during planning, implementation, and review.
Issues #184 and #175 remain Open. M2-QUAL-011, M2-QUAL-013, M2-QUAL-003, and
M2-GOV-006 remain **Blocked**; M2 remains **In Progress**; M3 remains **Not
Started**. No new DEC is required or proposed.

## In scope

### Planning turn

1. Keep Orchestrator-created Issue #192 aligned with this exact contract and
   linked to open Issue #188.
2. Add this complete Work Packet and one M2-QUAL-015 Roadmap row.
3. Obtain independent correctness/executability and governance/scope/security
   Definition of Ready reviews against the exact planning base, exact two-file
   checkpoint, and Issue #192 body.

### Future implementation and replay

4. Start only after the Ready planning PR merges with green final-head CI, in a
   fresh clean worktree at the resulting latest `origin/main`.
5. Treat `/private/tmp/contentos-m2-qual-014-impl-wt` as read-only reference.
   Before any comparison, verify that it remains on branch
   `codex/m2-qual-014-api-readiness-lifecycle-impl`, at HEAD
   `ab18bfe5e3e756648465b39beb60f1cd69ca4237`, with exactly the historical
   five-file dirty allowlist and no untracked files. Then silently compare each
   fresh-main target with the same file at that fixed committed HEAD. Any
   reference-state or baseline mismatch is Blocked and requires replanning.
6. Manually reconstruct only these three reviewed changes:

   - the fixed lifecycle formatter and thin readiness-failure caller in
     `packages/testing/src/integration/harness.ts`;
   - its deterministic coverage in
     `packages/testing/src/harness-cleanup.test.ts`;
   - the two fixed records and non-inference boundary in
     `docs/quality/integration-smoke-harness.md`.

7. After editing, silently compare each reconstructed target file with the
   preserved working-copy version. Record only pass/fail. Do not copy files,
   apply patches, cherry-pick, persist a diff, or create a hash/manifest.
8. Execute the required gates in the exact order below. Every command that can
   spawn a repository or test process must use normal process permission on its
   first physical invocation. A sandbox invocation immediately makes this Work
   Item Blocked; a later green rerun cannot replace it.
9. Record exactly one terminal outcome and synchronize this Packet and Roadmap.

## Out of scope

- Modifying the M2-QUAL-014 Packet or rewriting its historical Blocked record.
- Copying, applying, cherry-picking, committing, or publishing the prior
  implementation worktree or its five-file diff.
- Adding a setup category, lifecycle token, parser, transport, reporter,
  injection, shared abstraction, or general API error matrix.
- Reading, tailing, copying, parsing, publishing, or retaining `api.log`, raw
  child output, arbitrary errors, causes, stacks, child command lines, or
  command arguments. Full gate stdout/stderr may be inspected ephemerally only
  to evaluate the exact terminal predicate; it must not be persisted or
  published, and durable evidence remains limited to the allowlist below.
- Recording PID, process group, exit code, signal name, URL, port, runtime path,
  environment value, credential, Secret, timestamp, content hash, or persistent
  equivalence artifact.
- Changing timeout, polling, retry, sleep, readiness URL, health endpoint, port
  allocation, API startup, teardown, cleanup, ownership, signal, or process
  behavior.
- Modifying product applications, Worker behavior, Domain, database, Schema,
  migration, dependency, lockfile, manifest, Compose, CI, configuration,
  Accepted DEC, Acceptance Record, README, or AGENTS.
- A fourth Worker invocation, rerun-to-green, arbitrary filter, full Concurrent
  substitute, root-cause diagnosis, or repair.
- Closing Issues #192 or #188 before a Completed merge; closing Issues #184 or
  #175; completing M2-QUAL-003, M2-GOV-006, or M2; or starting M3.
- Git or GitHub mutation by implementation or review agents.

## Relevant decisions and documents

### Relevant Accepted Decisions

- DEC-245 and DEC-247 — deterministic behavior and layered testing.
- DEC-261 — executable failure-path acceptance evidence.
- DEC-287, DEC-288, DEC-291, and DEC-292 — bounded Work Items, independent
  review, Definition of Ready/Done, and scope governance.

A later Accepted DEC governs an actual conflict. No new DEC is proposed.

### Relevant Current-truth and governance documents

- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Release Gates](../../quality/release-gates.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-QUAL-014 Work Packet](m2-qual-014-safe-api-readiness-lifecycle-attribution-replay.md)

## Allowed and prohibited files

### Planning write scope — exact two files

- `docs/implementation/work-packets/m2-qual-015-normal-permission-api-readiness-lifecycle-checkpoint-replay.md`
- `docs/implementation/roadmap.md`

### Completed implementation allowlist — exact five files

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-015-normal-permission-api-readiness-lifecycle-checkpoint-replay.md`
- `docs/implementation/roadmap.md`

A **Blocked** publication contains only the new Work Packet and Roadmap from a
fresh latest-main status branch. It must not publish any implementation, test,
or Current-truth delta.

All other files are prohibited. No generated file, coverage output, build
artifact, runtime log, trace, screenshot, dump, hash, manifest, or persistent
comparison output may be retained or committed.

## Contracts

### Reconstruction and equivalence contract

- The preserved worktree is read-only and must match branch
  `codex/m2-qual-014-api-readiness-lifecycle-impl`, HEAD
  `ab18bfe5e3e756648465b39beb60f1cd69ca4237`, exactly the historical five-file
  dirty allowlist, and no untracked files before any comparison.
- Pre-edit comparison covers each target file against the preserved worktree's
  committed HEAD version and must pass before reconstruction.
- Reconstruction is manual and limited to the three stated files.
- Post-edit comparison covers each reconstructed file against the preserved
  working-copy version and must pass.
- Comparisons are ephemeral, non-hash, silent byte checks such as `cmp -s`.
  Durable evidence records only the command purpose and pass/fail result.

### Lifecycle observation contract

The formatter maps only nullability:

| Observation                                  | Fixed record                                                       |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `exitCode !== null` or `signalCode !== null` | `contentos smoke api readiness failed: api-child=exit-observed`    |
| both are `null`                              | `contentos smoke api readiness failed: api-child=no-exit-observed` |

The caller writes exactly one LF-terminated record and throws the unchanged
`api did not become ready on <origin>/health/live` Error. The existing
`setup=api-start-failed teardown=<clean|failed>` classification remains
unchanged. The lifecycle record contains no exit code, signal, PID, path, URL,
port, error, stack, Secret, or child output.

`exit-observed` does not identify a cause. `no-exit-observed` does not prove the
child is alive, listening, hung, or healthy.

### Exact Vitest reporter companion contract

For one eligible attributed Worker failure only, at most one complete
ANSI-stripped line `No test files found, exiting with code 1` may accompany
exactly one lifecycle record and exactly one complete
`setup=api-start-failed teardown=clean` record when zero Worker test bodies
ran. Filter, timing, and empty-suite framing are not failure boundaries and are
not durable evidence. Any other Harness, application, test, cleanup, unhandled,
duplicate, malformed, or conflicting boundary makes the outcome Blocked.

### Security boundary

Durable runtime diagnostics are limited to fixed lifecycle/setup/teardown
tokens, the permitted reporter companion, RC/test counts, and aggregate
task-owned residue counts/deltas. Required governance evidence may retain Git
commit SHAs, branch, clean status, tool versions, command names/results,
reviewer metadata, PR/CI facts, and scope results. No new diagnostic sink,
credential, network capability, hash mechanism, or cleanup authority is added.
Ephemeral inspection of the complete gate output is required only to decide
whether another failure boundary exists; it creates no durable raw-output
artifact.

## Required preflight and command order

The Orchestrator must provide normal process permission before every command
below that can spawn repository or test processes. The implementation Agent
must not issue a default-sandbox probe. Any sandbox invocation is an immediate
Blocked terminal event and stops all later runtime commands. For an exactly-once
gate it also consumes that gate's only invocation; for Worker it consumes one
nominal slot, but Blocked stopping prohibits every remaining Worker slot.

1. Record branch, exact base, clean initial status, Node `24.18.0`, and pnpm
   `11.17.0`.
2. With normal process permission on the first invocation, run:

   ```text
   fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
   fnm exec --using=24.18.0 corepack pnpm workspace:check
   ```

3. Verify the eleven fixed Harness, concurrent, and Browser failure-injection
   variable names are unset without persisting their values.
4. Record aggregate task-owned entry state for application processes, matching
   Compose projects/containers, Harness temporary roots, Browser artifacts, and
   repository-local `.pnpm-store`. Preserve unrelated state.
5. Verify the fixed reference branch, HEAD, exact historical five-file dirty
   allowlist, and no-untracked state. Then perform the pre-edit comparisons,
   manual reconstruction, post-edit comparisons, `git diff --check`, and
   exact-three implementation scope check.
6. With normal process permission on the first and only invocation, run focused:

   ```text
   fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts
   ```

   Expected shape: `1 file / 14 tests`.

7. With normal process permission on the first and only invocation, run root:

   ```text
   fnm exec --using=24.18.0 corepack pnpm check
   ```

   Expected baseline shape: `54 files / 578 tests` and five application builds.

8. With normal process permission on the first and only invocation, run full
   Integration:

   ```text
   fnm exec --using=24.18.0 corepack pnpm test:integration
   ```

   Expected baseline shape: `27 files / 185 tests`.

9. If Integration is green, run targeted Prettier, the prerequisite
   `repository:check`, `git diff --check`, and exact-five scope verification.
10. With normal process permission on the first and only invocation, run
    Browser:

    ```text
    fnm exec --using=24.18.0 corepack pnpm test:browser
    ```

    Expected shape: `16/16`.

11. With normal process permission from the first invocation, run the exact
    Worker command sequentially at most three times:

    ```text
    fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
    ```

    Each physical invocation consumes one slot. Stop on first red, signal, or
    missing status. No fourth invocation and no rerun-to-green is allowed.

12. After writing the terminal outcome, run targeted Prettier, final
    `repository:check`, `git diff --check`, exact scope, untracked/artifact, and
    aggregate task-owned residue checks. A final static/scope failure changes a
    candidate Completed outcome to Blocked.

Any prerequisite red, signal, missing status, sandbox invocation, uncertainty,
or non-zero task-owned delta stops all later runtime gates. After first-red
stopping, only the final static checks required for a truthful two-document
Blocked publication may run.

## Terminal outcomes and stopping rules

Terminal predicates are mutually exclusive and evaluated in this order.

### Completed — Attributed `exit-observed` or `no-exit-observed`

All prerequisite gates are green. Every earlier Worker slot has explicit
`RC=0`, `1 file / 7 tests`, no setup/lifecycle record, and zero task-owned
delta. The first red slot has all of:

- explicit `RC=1`;
- exactly one fixed lifecycle record with one allowed token;
- exactly one complete `setup=api-start-failed teardown=clean` record;
- zero Worker test bodies executed;
- at most one complete ANSI-stripped
  `No test files found, exiting with code 1` reporter companion;
- no other Harness, application, test, cleanup, signal, or failure boundary;
- zero task-owned delta.

Stop immediately. This attributes only the deadline observation and does not
authorize a root-cause claim or repair.

### Completed — Not Reproduced

All prerequisite gates are green and all three Worker slots have explicit
`RC=0`, `1 file / 7 tests`, no setup category, no lifecycle record, and zero
task-owned delta. This is a bounded not-reproduced result, not proof of
non-recurrence.

### Blocked

Blocked includes baseline drift; reconstruction/equivalence/scope uncertainty;
any sandbox invocation; any prerequisite red, signal, missing status, injection,
or residue; any Worker failure not matching the exact Attributed predicate;
missing, duplicate, malformed, or conflicting lifecycle/setup evidence;
`teardown=failed`; a Worker body running in the target red; or any secondary
failure other than the exact permitted companion. Stop at first evidence and do
not widen, repair, or rerun-to-green.

## Acceptance Criteria

1. Issue #192, planning exact-two, Completed exact-five, and Blocked exact-two
   boundaries are aligned and independently reviewable.
2. Fresh-main pre-edit and post-edit ephemeral non-hash byte comparisons pass,
   with no persisted comparison artifact.
3. The reconstructed formatter and real caller are byte-equivalent to the
   reviewed preserved checkpoint and disclose no prohibited value.
4. Existing readiness Error, `api-start-failed`, timeout, polling, retry,
   teardown, cleanup, ownership, and process behavior remain unchanged.
5. Focused tests cover the two fixed records, exit/signal equivalence, fixed LF,
   exactly-one write-before-throw, unchanged classification, and non-disclosure.
6. Every process-spawning gate starts with normal process permission, runs once
   or within the Worker cap, follows the exact order, and applies first-red
   stopping with zero task-owned residue.
7. The exact reporter companion is accepted only under its narrow predicate;
   all other secondary or conflicting evidence is Blocked.
8. Packet and Roadmap report one truthful terminal outcome without root-cause,
   repair, non-recurrence, M2 completion, or M3-start claims.
9. Completed requires new independent correctness and scope/security reviews of
   the fresh exact-five diff and evidence; prior QUAL014 implementation review
   cannot substitute.

## Tests and validation

- Frozen install and workspace check under Node 24.18.0 / pnpm 11.17.0.
- Focused Harness test exactly once under normal process permission.
- Root `check` exactly once under normal process permission.
- Full Integration exactly once under normal process permission.
- Targeted Prettier, prerequisite and final `repository:check`, diff, exact
  scope, artifact, and residue checks.
- Browser exactly once under normal process permission.
- Exact Worker command at most three sequential physical invocations under
  normal process permission, with first-red stopping.

No failed required test may be skipped, relabeled, or replaced by a later green
rerun.

## Security, migration, observability, and rollback

- User content/external input: none.
- Authentication/Authorization/Object Storage/Export/deletion: unchanged.
- Credential/network/provider transmission: unchanged; no new access.
- Database/Schema/API/Queue/Artifact/Agent/configuration compatibility: none.
- Migration/backfill: none.
- Observability: the same two fixed local stderr diagnostic records proposed by
  M2-QUAL-014; no metric, trace, audit event, raw log, or new sink.
- Rollback: revert the exact five-file Completed diff. A Blocked publication is
  an exact two-document status record from fresh latest main.
- Possible new DEC: none. Stop for Decision Review only if implementation
  requires a product, architecture, security, agent-responsibility, or release
  gate change.

## Documentation updates

- `docs/quality/integration-smoke-harness.md`: reconstruct the reviewed two
  fixed lifecycle records and their non-inference boundary.
- This Packet: record base, reconstruction evidence, commands, terminal result,
  review, CI, publication, and final status.
- `docs/implementation/roadmap.md`: add and synchronize M2-QUAL-015 without
  changing M2-QUAL-014 or other historical status.

## Definition of Ready

**PASS.** Ready conditions are satisfied:

- Issue #192 exists, links Issue #188, and matches this exact contract;
- exact planning/Completed/Blocked file boundaries are fixed;
- fresh-main base, preserved read-only checkpoint, reconstruction method,
  normal-permission-first command order, terminal predicates, security limits,
  publication authority, and Issue lifecycle are testable;
- no Blocking Design Question or new DEC is required;
- independent correctness/executability and governance/scope/security reviewers
  both return PASS against base
  `f02ac2c8ec234e82e08b44502a4bd9b2e191d753`, the exact two-document checkpoint,
  and Issue #192 parity.

No pre-DoR commit or publication occurred. The Orchestrator may now commit and
publish the exact-two planning PR and merge it only after all required
final-head CI jobs are green. Implementation begins only from the resulting
fresh latest main.

### Independent Definition of Ready review

The exact planning checkpoint and current Issue #192 body received **PASS**
from:

- `/root/m2_qual_014_dor_correctness` — correctness/executability;
- `/root/m2_qual_012_browser_setup_diagnosis` —
  governance/scope/security.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` with High reasoning, and recorded actual runtime as
`UNVERIFIED_RUNTIME_MODEL`. They reviewed base
`f02ac2c8ec234e82e08b44502a4bd9b2e191d753`, the exact Packet/Roadmap
checkpoint, and Issue #192 parity. Findings covering the fixed preserved
reference identity, ephemeral output inspection, sandbox stopping semantics,
and complete Issue terminal/disclosure predicates were corrected and closed.
No findings remain, there is no Blocking Design Question, and no new DEC is
required. The reviewers changed no files and ran no runtime or Docker commands.

### Implementation replay evidence

The implementation thread was the reused `/root/m2_qual_014_implementation`
thread, with logical role `IMPLEMENTER`, requested custom agent `luna-worker`,
configured `gpt-5.6-luna` with Max reasoning, and actual runtime
`UNVERIFIED_RUNTIME_MODEL`. The implementation ran only in fresh worktree
`/private/tmp/contentos-m2-qual-015-impl-wt`, branch
`codex/m2-qual-015-normal-permission-replay-impl`, at base/HEAD
`8419524ebf7d4cbcf1597afc81ac35b8a3c4d326`, which was clean before editing.

The preserved read-only reference was verified on branch
`codex/m2-qual-014-api-readiness-lifecycle-impl`, HEAD
`ab18bfe5e3e756648465b39beb60f1cd69ca4237`, with exactly the historical
five-file dirty allowlist and no untracked files. Pre-edit silent non-hash
comparisons against its committed HEAD passed for all three reconstruction
targets. The three targets were manually rebuilt with `apply_patch` only;
post-edit silent non-hash comparisons against the preserved working copy passed
for all three. No comparison artifact, hash, or raw output was persisted.

Node `24.18.0` / pnpm `11.17.0`, frozen install, workspace check, eleven
injection-unset checks, entry aggregate, and pre-runtime diff/scope checks
passed. Every formal process-spawning command below used normal process
permission on its first physical invocation. One read-only default-sandbox
`pgrep` residue probe failed with `sysmon request failed: sysmond service not
found` / `pgrep: Cannot get process list`; it was not a repository/test gate,
did not produce clean residue evidence, and did not trigger Blocked. The
task-worktree residue check was then rerun with normal process permission and
used for the recorded zero-residue evidence:

- Focused Harness exactly once: `RC=0`, `1 file / 14 tests`.
- Root `check` exactly once: `RC=0`, `54 files / 578 tests`, five application
  builds.
- Full Integration exactly once: `RC=0`, `27 files / 185 tests`.
- Targeted Prettier and prerequisite `repository:check`: `RC=0`; diff-check and
  exact-three pre-Browser scope passed.
- Browser exactly once: `RC=0`, `16/16`.
- Worker command slots #1, #2, and #3: each `RC=0`, `1 file / 7 tests`; no
  setup category or lifecycle record was emitted. The three-slot cap was
  consumed; no fourth invocation or rerun-to-green occurred.

The entry aggregate was `api=0 web=0 compose-projects=0
compose-containers=0 harness-roots=0 browser-artifacts=1 pnpm-store=0`.
After Browser and after each Worker slot, task-owned app processes, matching
Compose projects/containers, Harness roots, and repository-local `.pnpm-store`
remained zero; the single pre-existing Browser `.last-run.json` artifact was
unchanged. Unrelated main-worktree process state was preserved and excluded
from task ownership. The runtime terminal outcome is **Completed — Not
Reproduced**: this is bounded replay evidence only, not proof of non-recurrence
and not a root-cause, repair, M2-completion, or M3-start claim.

This implementation handoff is not an independent review or publication
approval. The exact five-file diff remains unpublished until new independent
correctness and scope/security reviews authorize publication; Issues #192 and
#188 remain Open. After synchronizing this Packet and Roadmap, final targeted
Prettier and `repository:check` returned `RC=0`; `git diff --check`, exact-five
scope, no-untracked, artifact, and aggregate task-owned residue checks passed.

### Independent implementation review

Independent implementation review returned **PASS** from:

- `/root/m2_qual_014_dor_correctness` — correctness/executability and evidence;
- `/root/m2_qual_012_browser_setup_diagnosis` — scope, governance, and security.

Both reviewers used logical role `INDEPENDENT_REVIEWER`, requested
`gpt-5.6-sol` with High reasoning, and recorded actual runtime as
`UNVERIFIED_RUNTIME_MODEL`. They reviewed base
`8419524ebf7d4cbcf1597afc81ac35b8a3c4d326`, the exact five-file diff, and the
replay evidence. No findings remain. This PASS closes independent review only;
the terminal remains **Completed — Not Reproduced**, GitHub CI is still pending,
and it does not authorize staging, commit, publication, Issue closure,
root-cause/repair claims, M2 completion, or M3 start. Issues #192 and #188
remain Open.

## Definition of Done and publication authority

### Completed path

Completed requires the exact five-file diff, every Acceptance Criterion, one
eligible terminal outcome, final static/scope/residue evidence, two new
independent implementation reviews with no unresolved finding, and all three
required final-head CI jobs green. Only the Orchestrator may stage, commit,
push, open the Draft PR, mark it Ready, and squash merge. After the Completed
merge, only the Orchestrator may close Issue #192 and Issue #188. M2-QUAL-014
remains historical Blocked; Issues #184/#175 and other blockers remain open.

### Blocked path

When Blocked, freeze the implementation evidence and obtain independent
evidence-accuracy and scope/governance/security review. From fresh latest main,
publish only this Packet and Roadmap on a separate status branch after targeted
Prettier, final `repository:check`, diff/scope checks, independent two-document
review PASS, and green publication final-head CI. Issues #192 and #188 remain
Open. The three implementation/test/Current-truth files must not publish, and no
root-cause or repair Issue is created from unreviewed or ambiguous evidence.

Implementation and review agents may not stage, commit, push, create or mutate
PRs/Issues, approve, mark Ready, merge, close Issues, or approve their own work.
