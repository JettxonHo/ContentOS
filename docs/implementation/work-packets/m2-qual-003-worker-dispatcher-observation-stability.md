# M2-QUAL-003 — Worker Dispatcher Reconciliation Observation Stability

**Status:** Blocked — focused replay setup failure

**Proposed successor status (non-effective):** Completed — Repair Verified
through M2-QUAL-039

**Issue:** [#147](https://github.com/JettxonHo/ContentOS/issues/147)

## Identification

- Task ID: `M2-QUAL-003`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Defect
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Branch: `codex/m2-qual-003-final-replay-plan`
- Planning Base SHA: `c3894a920b4f2315a81c4f0add47b8e06bc28cee`
- Renewed Planning Base SHA: `e734755bc92d6e4e6a2506511aa0b402c57d68cd`
- Implementation Thread: `/root/m2_qual_003_final_replay_implementation`
- Implementation Branch: `codex/m2-qual-003-worker-dispatcher-final-impl`
- Implementation Base SHA: `2297bad3415157a7f84ff60e6a9a39dc9985adc6`
- Preserved Reference Worktree: `/private/tmp/contentos-m2-qual-005-wt`
- Risk Classification: integration-test synchronization only

## Goal

Make the existing Worker reconciliation integration evidence wait for the
authoritative PostgreSQL acknowledgement after an initial or repaired Redis Job
appears, without changing production behavior or weakening the final
`dispatched` assertion.

## Context and root cause

The final-head Integration smoke job for closed Draft PR
[#146](https://github.com/JettxonHo/ContentOS/pull/146) failed in
`worker-dispatcher.test.ts`. The test removed a current BullMQ Job, waited for
the Worker to recreate that Job, and then immediately asserted that the Outbox
row was `dispatched`. The observed row was still `dispatching`.

The accepted Dispatcher sequence publishes the Queue Job before acknowledging
the claimed Outbox row in PostgreSQL. Redis Job visibility therefore proves
that publication occurred, but it does not prove that the following database
acknowledgement has completed. The test used the wrong synchronization point.
The product contract and the final state assertion remain unchanged.

This is not accepted as a rerun-only CI fluctuation. PR #146 was closed without
merge, Issue #144 remains open, M2 remains In Progress, and M3 remains Not
Started.

The preserved final-v2 implementation changes only the initial Job ledger and
two missing-Job repair ledger observations. It passed three focused Worker
runs, root quality, full Integration, and Browser. Its first two full Concurrent
runs passed; the third stopped on the then-safe
`test=fetcher-gateway-api.test.ts case=fg-07` diagnostic. The Worker change was
not published.

M2-QUAL-004 through M2-QUAL-009 subsequently added bounded test/case and child
cleanup attribution without changing product behavior. M2-QUAL-010 completed
through PR #171, squash merge
`df7ba1427d066373289d8fa33d008acda0be509a`, and replayed the real non-injected
focused FG07 loop three times on the merged explicit child teardown baseline;
all three attempts exited zero with zero task-owned cleanup delta. That result
is `not reproduced` only, not an FG repair. It removes the diagnostic blocker
to one final M2-QUAL-003 replay from latest `main` under the same bounded
first-red stopping rule.

The final replay implementation started from clean base
`2297bad3415157a7f84ff60e6a9a39dc9985adc6` with Node `v24.18.0` and pnpm
`11.17.0`. The ten concurrent/Harness injection variables were unset, and the
entry aggregate was `app-processes=0 compose-projects=0 compose-containers=0`
with `coordinator-temp-roots=0 repo-local-pnpm-store=no`. The implementation
reproduced only the preserved three `waitFor` observation changes in
`worker-dispatcher.test.ts`; frozen install and workspace checks passed.

Focused Worker replay attempt 1 exited `1` with the bounded Harness result
`setup=setup-failed teardown=clean`. This required local-gate red result stopped
the sequence under the first-red rule: focused attempts 2 and 3, root `check`, full
Integration, Browser, and all full Concurrent attempts were not run. The
post-attempt aggregate remained
`app-processes=0 compose-projects=0 compose-containers=0`,
`coordinator-temp-roots=0 repo-local-pnpm-store=no`, with
`task-owned-delta=zero`. No raw child output, root-cause claim, final repair
completion, M2-GOV-006 completion, M2 completion, or M3 start is claimed.
M2-QUAL-003 remains **Blocked** pending a future replay from a clean latest-main
baseline.

## Independent Blocked evidence review

**PASS.** Independent reviewers verified the bounded blocked record against the
reviewed implementation base/checkpoint `2297bad3415157a7f84ff60e6a9a39dc9985adc6`.

- `/root/m2_qual_003_blocked_evidence_review` — PASS
- `/root/m2_qual_003_blocked_scope_review` — PASS
- Logical Role: `INDEPENDENT_REVIEWER`
- Requested model: `gpt-5.6-sol` / High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed the exact three-file dirty implementation evidence; publication is
  permitted only for these two documentation files.

This PASS authorizes only the two-document Blocked publication. It does not
authorize publication of the Worker test delta, Issue #147 closure, a
speculative repair, M2 completion, or M3 start.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered tests.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items and focused review.
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Start from a clean implementation worktree at latest `origin/main` after
   this renewed Ready packet merges. Inspect the preserved reference worktree,
   then reproduce only its `worker-dispatcher.test.ts` observation delta; do not
   copy its stale documentation or branch state. The preserved worktree is
   read-only: do not edit it, run commands in it, clean it, or perform any Git
   operation against it.
2. Change the actually observed initial-Job path and both repaired-Job paths in
   `worker-dispatcher.test.ts` to wait for the owner Outbox row to reach
   `dispatched` after the matching Job is visible.
3. Preserve the exact Queue name, Job name, Job ID, envelope, retention,
   Task-state, and Outbox-state assertions.
4. Use the existing bounded `waitFor` test helper with its existing timeout and
   assertion path; do not add an arbitrary sleep.
5. Run the focused Worker dispatcher integration test three consecutive times,
   then run root, full Integration, Browser, and three sequential full
   Concurrent attempts. Stop immediately on the first red; do not rerun it to
   green.
6. Record the PR #146 failure, preserved final-v2 evidence, M2-QUAL-010
   dependency, and actual final repair evidence.
7. Synchronize only this Work Packet and the Roadmap status.

## Out of scope

- Worker, Dispatcher, Queue adapter, database repository, Schema, migration,
  API, Web, Fetcher, Renderer, runtime configuration, or product behavior;
- weakening, removing, skipping, retrying, or extending the timeout of the
  final `dispatched` assertion;
- changing the merged safe test/case/cleanup diagnostics or running the focused
  FG07 command as a substitute for full Concurrent;
- adding polling or delay behavior to production code;
- dependency, lockfile, Compose, CI workflow, Accepted DEC, or Current-truth
  architecture changes;
- publication of Acceptance Record 002, M2 completion, or any M3 work.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/worker-dispatcher.test.ts`
- `docs/implementation/work-packets/m2-qual-003-worker-dispatcher-observation-stability.md`
- `docs/implementation/roadmap.md`

### Prohibited modules

- all production application and package source;
- migrations, Schema, Drizzle metadata, package manifests, lockfile, Compose,
  CI, Decision, Session, and Acceptance Record files;
- the existing `M2-GOV-006` Work Packet during implementation.

### Generated files policy

No generated or runtime file may be committed. The implementer must remove only
task-owned temporary state and must not touch pre-existing local resources.

## Contracts

- Production Dispatcher, Queue, Outbox, Task, and Event contracts: unchanged.
- Test synchronization contract: initial or repaired Redis Job visibility is
  followed by a bounded wait for the matching PostgreSQL Outbox row to reach
  `dispatched`.
- Error, API, JSON Schema, Event, migration, configuration, and security
  contracts: unchanged.

## Acceptance criteria

1. The affected integration test waits for the matching Outbox row to become
   `dispatched` instead of assuming repaired Job visibility implies database
   acknowledgement completion.
2. The exact final `{ state: 'dispatched' }` assertion remains present and
   passing.
3. The repaired Job ID, data, `removeOnComplete`, and `removeOnFail` assertions
   remain unchanged and passing.
4. The test uses a bounded condition wait and introduces no arbitrary sleep,
   timeout increase, retry setting, or production change.
5. The focused test passes at least three consecutive isolated runs.
6. Root quality, full Integration, and Browser pass.
7. Three sequential full Concurrent attempts pass; the first red stops without
   rerun-to-green and leaves this Work Item Blocked.
8. Documentation, repository, Secret, and diff gates pass.
9. GitHub final-head Docker-independent, Integration, and Browser jobs all pass
   before merge.
10. The diff contains only the three allowed files and leaves no task-owned
    process, container, temporary directory, or repository-local store.

## Required tests and commands

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
# repeat the focused command three times
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm test:browser
fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent
# repeat the full Concurrent command three times; stop on first red
fnm exec --using=24.18.0 corepack pnpm exec prettier --check packages/testing/src/integration/worker-dispatcher.test.ts docs/implementation/work-packets/m2-qual-003-worker-dispatcher-observation-stability.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
```

If the focused Vitest command cannot use the integration global setup with a
path argument, the implementer may use the narrowest existing supported
integration command plus an exact test-name filter. It must not change test
configuration to obtain a pass.

Before the first runtime command, confirm all ten concurrent/Harness failure
injection variables listed by M2-QUAL-010 are unset and record only the bounded
`injection-env=unset` result. Record aggregate entry counts for implementation
worktree application processes, exact `contentos-smoke-*` Compose projects and
containers, coordinator temporary-root basenames, and this worktree's
repository-local `.pnpm-store`. After every process-starting command, require no
new task-owned aggregate delta. Do not output or persist PID, command, absolute
path, credential, or raw child output. Any current-run residue blocks
completion until safely cleaned; pre-existing state is not a cleanup target.

Every physical full Concurrent invocation consumes one of the three slots. A
missing final exit status is Blocked and stops without replacement. Any non-zero
result stops immediately and is recorded only through the merged sanitized
coordinator fields; it does not authorize a code change outside the existing
Worker test delta.

## Security review

No user content, Credential, network policy, Authorization, Object Storage,
logging, or deletion boundary changes. Existing temporary credential and
isolated harness cleanup rules remain in force. This task adds no hash or
security mechanism.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, configuration, dependency,
or compatibility change. Rollback is one focused Git revert.

## Observability

No product logging, metric, trace, or Audit Event change. Test failure output
continues to use the existing bounded diagnostic helper.

## Documentation updates

- this Work Packet;
- `docs/implementation/roadmap.md`, limited to this defect and the temporary
  M2-GOV-006 blocked dependency.

No Current-truth capability document, Acceptance Record, README, AGENTS, DEC,
or M3 document changes.

## Definition of Ready

**PASS.** Renewed independent review completed against
`e734755bc92d6e4e6a2506511aa0b402c57d68cd`:

- correctness and executability: `/root/m2_qual_003_renewed_dor_correctness`;
- governance, scope, and security:
  `/root/m2_qual_003_renewed_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`.
They validated the read-only preserved delta, latest-main sequencing, three
focused plus three full Concurrent bound, first-red stopping rule, exact
three-file scope, cleanup ownership, and Git publication rules. No Blocking
Design Question or new DEC is present.

## Definition of Done

The focused test passes three consecutive runs, all complete local gates pass,
all three full Concurrent attempts pass, independent review finds no unresolved
issue, final-head GitHub CI is green, the diff stays within the three-file
allowlist, and task-owned runtime residue is zero.

## Git authority

After Definition of Ready passes, the Orchestrator may publish this planning
packet. The implementer may modify only the three allowlisted files within the
Ready contract and must stop before Git publication. The implementer must not
create, update, comment on, label, or close Issue #147 or any other Issue. After
independent implementation review passes, the Orchestrator may commit, push,
and create a Draft PR. Only all-green final-head CI and no unresolved finding
or escalation permit Ready status and squash merge. The implementer cannot
approve or merge its own work.

If a required local gate is red, the combined code branch must not be
published. After independent evidence review, the Orchestrator may publish a
separate two-document Blocked record from latest `main`; that publication does
not include the Worker test delta, does not complete M2-QUAL-003, and authorizes
no speculative repair.

## QUAL039 successor evidence (proposed, non-effective)

QUAL039 reconstructed the accepted Worker observation repair with one
`outboxId` binding and three existing bounded waits for `state === 'dispatched'`.
The candidate Worker is byte-equal to the frozen QUAL034 Worker, and the
implementation reached exact four across this Worker test, this historical
QUAL003 Packet appendix, the QUAL039 Packet, and the Roadmap. The named frozen
runtime evidence is accepted: focused Worker `3 × (1 file / 7 tests)`, root
`54 files / 578 tests` plus five builds, Integration `27 files / 185 tests`,
Browser `16/16`, and one outer Concurrent RC0. QUAL039 invoked no local runtime
Worker/root/Integration/Browser/Concurrent commands; no replay or fallback is
claimed.

The proposed status is non-effective until independent actual-shape review,
first-eligible exact-head quality/Integration/Browser CI, and Orchestrator
squash merge. This appendix does not publish the Worker delta, close Issue
#147, or change M2/M3 governance.
