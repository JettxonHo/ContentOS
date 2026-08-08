# M2-QUAL-003 — Worker Dispatcher Reconciliation Observation Stability

**Status:** In Progress — revalidation on the safe-attribution baseline required

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
- Implementation Thread: `/root/m2_qual_003_implementation`
- Planning Base SHA: `c3894a920b4f2315a81c4f0add47b8e06bc28cee`
- Risk Classification: integration-test synchronization only

## Goal

Make the existing Worker reconciliation integration evidence wait for the
authoritative PostgreSQL acknowledgement after a repaired Redis Job appears,
without changing production behavior or weakening the final `dispatched`
assertion.

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

Repeated concurrent validation after implementation reported an unclassified
child `test-run-failed`. M2-QUAL-004 is now completed through PR #151 and adds
safe test-file attribution, although its bounded real runs did not reproduce a
failure. The valid implementation branch is preserved and must now be replayed
onto the latest `main`, then revalidated with the safe diagnostic active. A
future failure must stop immediately and use the attributed test file for exact
remediation rather than rerun-only acceptance.

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

1. Change the affected repaired-Job path in
   `worker-dispatcher.test.ts` to wait for the owner Outbox row to reach
   `dispatched` after the repaired Job is visible.
2. Preserve the exact Queue name, Job name, Job ID, envelope, retention,
   Task-state, and Outbox-state assertions.
3. Use the existing bounded `waitFor` test helper or an equally bounded
   assertion path; do not add an arbitrary sleep.
4. Run the focused Worker dispatcher integration test repeatedly and run the
   complete required local and GitHub gates.
5. Record the PR #146 failed evidence and final repair evidence.
6. Synchronize only this Work Packet and the Roadmap status.

## Out of scope

- Worker, Dispatcher, Queue adapter, database repository, Schema, migration,
  API, Web, Fetcher, Renderer, runtime configuration, or product behavior;
- weakening, removing, skipping, retrying, or extending the timeout of the
  final `dispatched` assertion;
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
- Test synchronization contract: repaired Redis Job visibility is followed by
  a bounded wait for the matching PostgreSQL Outbox row to reach `dispatched`.
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
6. Root quality, full integration, concurrent integration, browser,
   documentation, repository, Secret, and diff gates pass.
7. GitHub final-head Docker-independent, Integration, and Browser jobs all pass
   before merge.
8. The diff contains only the three allowed files and leaves no task-owned
   process, container, temporary directory, or repository-local store.

## Required tests and commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
# repeat the focused command three times
corepack pnpm check
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

If the focused Vitest command cannot use the integration global setup with a
path argument, the implementer may use the narrowest existing supported
integration command plus an exact test-name filter. It must not change test
configuration to obtain a pass.

Before and after runtime commands, record task-owned process, Compose project,
container, temporary-directory, and repository-store state. Any current-run
residue blocks completion until safely cleaned.

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

PASS. The failure, root cause, allowed synchronization change, file boundary,
assertions, commands, cleanup, and publication gates are defined. No Blocking
Design Question or new DEC exists.

- Reviewers:
  - `/root/m2_qual_003_dor_correctness` — PASS
  - `/root/m2_qual_003_dor_scope` — PASS after one mechanical model-routing
    metadata correction
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `c3894a920b4f2315a81c4f0add47b8e06bc28cee`

## Definition of Done

The focused test passes three consecutive runs, all complete local and final
GitHub gates pass, independent review finds no unresolved issue, the diff stays
within the three-file allowlist, and task-owned runtime residue is zero.

## Git authority

After Definition of Ready passes, the Orchestrator may publish this planning
packet. The implementer may modify only the Ready contract and must stop before
Git publication. After independent implementation review passes, the
Orchestrator may commit, push, and create a Draft PR. Only all-green final-head
CI and no unresolved finding or escalation permit Ready status and squash
merge. The implementer cannot approve or merge its own work.
