# M2-QUAL-006 — Managed Process Capture Cleanup Integrity

**Status:** Ready

**Issue:** [#157](https://github.com/JettxonHo/ContentOS/issues/157)

## Identification

- Task ID: `M2-QUAL-006`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Defect
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Branch: `codex/m2-qual-006-managed-process-capture-cleanup-planning`
- Implementation Thread: assigned after Definition of Ready passes
- Implementation Branch: assigned from synchronized `origin/main` after this
  Ready planning packet is merged
- Planning Base SHA: `eac0561ea5e020d7f1d712e0aefff100567fc78a`
- Dependencies: the M2-QUAL-003 final-v2 writer has stopped and its unmerged
  three-file evidence is preserved in its isolated worktree; implementation
  starts only after this planning packet is merged and records the then-current
  exact `origin/main` base
- Risk Classification: test-harness process ownership and cleanup evidence

## Goal

Close the integration-harness cleanup gap between spawning a detached API or
Web process and publishing its full managed-process identity. A failure during
identity capture or control-record publication must either prove that the
newly spawned process group was stopped or report incomplete cleanup; it must
never report `teardown=clean` while leaving that task-owned process running.

## Context

During bounded M2 quality diagnosis, a restricted execution environment denied
the harness's portable `ps` inspection with `EPERM`. The harness had already
spawned a detached API process, but it awaited identity capture before assigning
`runtime.apiProcess`. Capture failed, setup entered teardown, and teardown saw
no registered application process. The command reported `teardown=clean` while
a task-owned orphan API process remained. Two exact identity-confirmed
task-owned orphan processes from those failed attempts were later stopped with
`SIGTERM` and verified absent; unrelated historical processes were not touched.

The defect is a real ownership handoff gap, not a product failure. A spawn-time
`ps` preflight alone is insufficient because inspection can still fail after
spawn. The bounded repair must retain immediate in-memory ownership of the
newly created child until the existing full identity has been captured and its
authenticated control record has been published.

M2-QUAL-003 remains Blocked by the separately attributed concurrent `FG-07`
failure. M2-GOV-006 remains Blocked, M2 remains In Progress, and M3 remains Not
Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered tests.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items and scope governance.
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Release Gates](../../quality/release-gates.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Register an in-memory pending child record immediately after each detached
   API/Web spawn and before awaiting process inspection.
2. Keep the child handle and newly created process-group identifier available
   only to the current harness runtime; do not publish PID-only recovery
   authority.
3. On identity-capture or managed-process-control publication failure, attempt
   a bounded `SIGTERM`, then bounded `SIGKILL` only if required, against that
   exact newly spawned detached process group.
4. Clear pending ownership only after either:
   - the existing full managed-process identity is captured and published; or
   - rollback confirms that the new process group is gone.
5. If rollback cannot prove disappearance, preserve the task capsule and return
   a non-zero cleanup result with `managed-process` / physical-incomplete
   evidence.
6. Add one harness-only deterministic API identity-capture failure switch that
   proves the real post-spawn rollback path without exposing a PID or log.
7. Add focused unit tests for successful capture handoff, capture-failure
   rollback, already-gone handling, TERM-to-KILL escalation, and unproven
   cleanup failure. These are the reachable outcomes of this one lifecycle,
   not a generalized signal-error matrix.
8. Add a focused harness-state test that injects control-record publication
   failure after successful full-identity capture and proves the same rollback,
   representation, classification, and no-partial-publication rules.
9. Refine setup attribution to the single safe category
   `process-identity-failed` for this boundary.
10. Synchronize the harness Current-truth, this Work Packet, and Roadmap status.

## Out of scope

- Product, API, Web, Worker, Fetcher, Renderer, Domain, Queue, database, or
  Object Storage behavior;
- arbitrary process discovery, global scans, global cleanup, or signaling an
  unrelated process;
- persisting a PID-only or partial identity into the authenticated recovery
  capsule;
- replacing or weakening the existing full process identity and recovery
  contract;
- a standalone `ps` preflight presented as the complete fix;
- new hash/SHA mechanisms, dependencies, lockfile changes, Schema, migrations,
  Compose, CI, Accepted DEC, or security architecture;
- FG-07 localization or repair, M2-QUAL-003 completion, Acceptance Record 002,
  M2 completion, or M3 work.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/integration/process-identity.ts`
- `packages/testing/src/process-identity.test.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-006-managed-process-capture-cleanup.md`
- `docs/implementation/roadmap.md`

### Prohibited modules

- all production application and package source;
- `packages/testing/src/integration/run-concurrent-smoke.ts` and Fetcher Gateway
  test behavior;
- migrations, Schema, Drizzle metadata, manifests, lockfile, Compose, CI,
  Decision, Session, README, AGENTS, and Acceptance Record files;
- the existing M2-QUAL-003 and M2-GOV-006 Work Packets.

### Generated files policy

No generated or runtime file may be committed. Remove only task-owned temporary
state. Pre-existing processes, containers, worktrees, local volumes, and
temporary directories are not cleanup targets.

## Contracts

- Product and API Contracts: unchanged.
- Existing full managed-process identity: unchanged and remains the only
  persisted recovery authority.
- Pending child ownership: in-memory, task-local, and valid only from a
  successful detached spawn until full identity publication or proven rollback.
- Handoff order:
  1. store pending ownership synchronously after spawn;
  2. capture the full identity into a local value without clearing pending;
  3. assign the full runtime identity and publish the complete control record;
  4. clear pending ownership only after publication succeeds;
  5. on failure, rollback uses the full identity when capture succeeded and the
     pending child record otherwise;
  6. proven rollback clears both representations, while unproven rollback
     retains exactly one ownership representation and cannot report physical
     cleanup.
- Rollback: bounded TERM, bounded confirmation, then KILL and bounded final
  confirmation; no global enumeration.
- Physical cleanup: any remaining pending child makes `physicalClean` false.
  Teardown cannot delete the task capsule or clear the runtime while pending
  disappearance is unproven.
- Failure contract: capture/publication failure is safe
  `setup=process-identity-failed`; rollback failure is non-zero
  `cleanup=managed-process physical=incomplete capsule=preserved`.
- Security boundary: no PID, process command, local path, Secret, URL, log body,
  or raw exception is added to persisted evidence or ordinary diagnostics.

## Acceptance criteria

1. The pending child record exists before the first awaited identity-capture
   operation for both API and Web startup.
2. Successful capture publishes the existing full identity, clears pending
   ownership, and preserves normal setup/teardown behavior.
3. The deterministic post-spawn API capture failure exits non-zero with
   `setup=process-identity-failed teardown=clean` and leaves no task-owned API
   process, Compose project, container, or temporary run root.
4. Capture failure never writes a PID-only or partial managed-process control
   record.
5. A focused unit test injects control-record publication failure after full
   identity capture and proves bounded rollback, no partial/PID-only
   publication, safe `process-identity-failed` classification, and correct
   pending/full representation cleanup.
6. If the pending process group is already gone, rollback succeeds without
   signaling another process.
7. If TERM does not stop the exact pending group, bounded KILL is attempted and
   success is confirmed.
8. If rollback cannot confirm that the group is gone, pending ownership makes
   physical cleanup false and setup cannot report clean;
   the task capsule is preserved and the command exits non-zero with incomplete
   cleanup evidence.
9. Existing successful Integration, concurrent Integration, and Browser
   ownership/cleanup paths remain passing.
10. No production, dependency, lockfile, Schema, migration, Compose, CI, DEC,
    M2 acceptance, or M3 behavior changes.
11. The final diff contains only files in the allowlist and leaves no
    task-owned runtime or repository-store residue.

## Required tests and commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec vitest run packages/testing/src/process-identity.test.ts
corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts
corepack pnpm check

# Deterministic real post-spawn capture failure. Non-zero is required.
CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE=1 corepack pnpm test:integration

corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

The injected command is a negative-path pass only when it exits non-zero with
the exact safe setup/teardown classification and independent read-only checks
confirm zero task-owned residue. It must not be repeated merely to obtain a
preferred result. Any unproven cleanup stops the Work Item.

Before and after each process-starting command, record only task-owned process,
Compose project/container, temporary-root, and repository-store deltas. Do not
kill, remove, or relabel pre-existing state.

## Security review

This task changes only test-harness ownership during one already observed
failure window. It introduces no user content, Credential, Provider, network,
Authorization, Object Storage, Export, or deletion-range change. The pending
child handle is not durable authority and must not be serialized. No new hash
or security mechanism is authorized.

## Migration and compatibility review

No database, Schema, migration, API, Queue, configuration, dependency, or
compatibility change. Rollback is one focused Git revert of the harness change.

## Observability

Only the stable `process-identity-failed` setup category and existing cleanup
categories are allowed. No PID, command, path, raw error, Stack, Secret, or log
body may appear in output.

## Documentation updates

- this Work Packet;
- `docs/quality/integration-smoke-harness.md`, limited to the pending-child
  ownership and rollback guarantee;
- `docs/implementation/roadmap.md`, limited to M2-QUAL-006 and its dependency
  effect.

No README, AGENTS, DEC, Current-truth product/architecture, Acceptance Record,
or M3 document changes.

## Definition of Ready

PASS. Goal, real defect evidence, lifecycle boundary, handoff order, files,
deterministic negative path, publication-failure evidence, cleanup proof, and
rollback are specified. No Blocking Design Question or new DEC exists.

- Reviewers:
  - `/root/m2_qual_006_dor_correctness` — PASS after four bounded contract
    corrections
  - `/root/m2_qual_006_dor_governance` — PASS after metadata, Git-authority,
    and current-status corrections
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `eac0561ea5e020d7f1d712e0aefff100567fc78a`

## Definition of Done

The deterministic post-spawn failure proves non-zero exit plus zero owned
residue; unit and complete local gates pass; independent review finds no
unresolved issue; final-head GitHub CI is green; scope is exact; and no Secret
or generated/runtime residue remains.

## Git authority

After Definition of Ready passes, the Orchestrator may commit and publish this
planning packet. The implementation Agent may modify only the Ready contract
and must stop before Git publication. After independent implementation review
passes, the Orchestrator may commit, push, and create a Draft PR. Only all-green
final-head CI and no unresolved finding or escalation permit the PR to become
ready for review and be squash merged. The implementer cannot approve or merge
its own work.
