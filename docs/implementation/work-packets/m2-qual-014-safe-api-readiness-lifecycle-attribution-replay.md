# M2-QUAL-014 — Safe API Readiness Lifecycle Attribution and Replay

**Status:** Ready
**Issue:** [#188](https://github.com/JettxonHo/ContentOS/issues/188) (Open)

This Work Item adds one bounded lifecycle observation at the existing API
readiness failure boundary. It does not change the existing setup category,
diagnose a root cause, or authorize a repair.

## Identification

- Task ID: `M2-QUAL-014`
- Title: Safe API Readiness Lifecycle Attribution and Replay
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Replay
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: record the runtime value when visible; otherwise
  `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-014-plan-wt`
- Planning Branch: `codex/m2-qual-014-api-readiness-lifecycle-plan`
- Planning Base/HEAD: `f941c6cde4fa04460be1744c8f72b709ef8e98bc`
- Planning Initial Status: clean
- Proposed Implementation Thread: assigned after this packet becomes Ready
- Proposed Implementation Branch:
  `codex/m2-qual-014-api-readiness-lifecycle-impl`
- Proposed Implementation Base: exact latest `origin/main` after the planning
  packet is merged; record it before any edit or runtime command
- Dependencies: M2-QUAL-013 Blocked record published through PR #186 and
  status synchronized through PR #187; Issues #184 and #175 remain Open
- Risk Classification: bounded test-harness lifecycle evidence and replay

## Goal

From a clean latest-main implementation worktree, add one fixed API-child
lifecycle record at the already-merged `api-start-failed` readiness deadline,
then replay the required normal-permission gates and exact Worker test under a
bounded first-red rule. The result may attribute only whether a child exit was
observed at that deadline; it must not infer why readiness failed or implement
a repair.

## Context and authority

M2-QUAL-013 proved that the existing `api-start-failed` record is emitted only
after API spawn and managed-process identity/control publication succeed, when
`/health/live` does not return 2xx within the existing 40-second readiness
window. Its first two exact Worker slots passed `1 file / 7 tests`; slot three
stopped before test-body execution with primary
`setup=api-start-failed teardown=clean` and the ANSI-stripped reporter line
`No test files found, exiting with code 1`. The Blocked checkpoint remains
unpublished.

Pinned Vitest 4.1.10 emits that complete line as a reporter companion when
global setup fails before file collection. For this Work Item only, one exact
complete ANSI-stripped line may accompany an otherwise eligible target record.
Ordinary reporter framing such as the repository-relative `filter:` line,
timing, and empty-suite headings is not a failure boundary and is not retained
as durable evidence. This exception does not permit another Harness,
application, test, cleanup, or unhandled-error line or any raw-output capture.

The current Harness collapses two safe observations at the readiness
deadline: a child exit was observed, or no child exit was observed. The latter
does not prove that the child is alive, listening, hung, or healthy. The fixed
record therefore uses `no-exit-observed`, never `alive`.

M2-QUAL-011 and M2-QUAL-013 remain historical **Blocked** records. Issues #184
and #175 remain Open. M2-QUAL-003 and M2-GOV-006 remain **Blocked**; M2 remains
**In Progress**; M3 remains **Not Started**. No new DEC is required or
proposed.

## In scope

### Planning turn

1. Keep Orchestrator-created Issue #188 aligned with this exact contract.
2. Add this complete Work Packet and one new M2-QUAL-014 Roadmap row.
3. Obtain independent correctness/executability and
   governance/scope/security Definition of Ready reviews against the exact
   planning base plus exact two-document checkpoint.

### Future implementation and replay

4. Start from a fresh, clean worktree at exact latest `origin/main` after this
   packet is merged. Record branch, base, clean status, Node 24.18.0, pnpm
   11.17.0, frozen-install, workspace, injection, and aggregate entry-residue
   evidence before runtime gates.
5. Confirm that latest main already contains the existing API readiness
   failure boundary, `api-start-failed` classifier, managed-process handoff,
   and teardown behavior. Do not reconstruct or publish the unpublished
   M2-QUAL-011/M2-QUAL-013 checkpoint.

6. In `harness.ts`, add one narrow pure formatter that reads only whether the
   API child `exitCode` or `signalCode` is non-null at the existing readiness
   deadline, plus a thin caller helper used by the real readiness branch. The
   helper writes exactly one LF-terminated fixed record and throws the same
   existing readiness error shape:

   ```text
   contentos smoke api readiness failed: api-child=exit-observed
   ```

   or:

   ```text
   contentos smoke api readiness failed: api-child=no-exit-observed
   ```

   Any observed exit code or signal maps to `exit-observed`; the record never
   includes the code or signal. Both null map to `no-exit-observed`.

7. Use the helper once immediately before the existing readiness error is
   thrown. Preserve the existing
   `setup=api-start-failed teardown=<clean|failed>` grammar and the existing
   setup snapshot → exactly-one teardown → classification ordering.
8. Add deterministic focused tests for the two records, signal/exit
   equivalence, fixed LF shape, exactly-one write before the same readiness
   error is thrown, and absence of prohibited values. Preserve the existing
   teardown-independence tests.
9. Run the normal-permission gates and exact Worker replay in the required
   order. Record only bounded command results, the two fixed records, existing
   sanitized setup/teardown fields, the permitted exact Vitest companion, and
   aggregate task-owned residue counts/deltas.

## Out of scope

- Adding or changing a setup category, Browser/concurrent parser, reporter,
  shared transport grammar, or general API error matrix.
- Reading, tailing, copying, parsing, publishing, or retaining `api.log`, raw
  child output, arbitrary error messages, causes, stacks, or commands.
- Recording PID, process group, exit code, signal name, URL, port, path,
  credential, environment value, timestamp, hash, or persistent diagnostic
  artifact.
- Changing the 40-second timeout, polling cadence, retry, sleep, readiness URL,
  health endpoint, port allocation, API startup, cleanup, ownership, signal,
  teardown, or process-control behavior.
- Modifying API, Worker, Web, Fetcher, Renderer, Domain, database, Schema,
  migration, dependency, lockfile, manifest, Compose, CI, configuration,
  Accepted DEC, Acceptance Record, README, or AGENTS.
- Reconstructing, copying, applying, or publishing any unpublished
  M2-QUAL-011/M2-QUAL-013 code or Current-truth checkpoint.
- Adding an injection, rerun-to-green, fourth Worker attempt, full Concurrent
  substitute, or arbitrary test filter.
- Diagnosing or repairing EADDRINUSE, configuration, bootstrap, Nest, module
  load, database, or another hypothetical root cause.
- Rewriting M2-QUAL-011 or M2-QUAL-013 history; closing Issues #184 or #175;
  completing M2-QUAL-003, M2-GOV-006, or M2; or starting M3.
- Any Git or GitHub mutation by the implementation or review agents.

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
- [M2-QUAL-011 Work Packet](m2-qual-011-safe-focused-integration-setup-attribution-replay.md)
- [M2-QUAL-013 Work Packet](m2-qual-013-normal-permission-integration-replay-checkpoint-publication.md)

## Allowed and prohibited files

### Planning write scope — exact two files

- `docs/implementation/work-packets/m2-qual-014-safe-api-readiness-lifecycle-attribution-replay.md`
- `docs/implementation/roadmap.md`

### Completed implementation allowlist — exact five files

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-014-safe-api-readiness-lifecycle-attribution-replay.md`
- `docs/implementation/roadmap.md`

A **Blocked** publication contains only the Work Packet and Roadmap from a
fresh latest-main status branch. It must not publish any code, test, or
Current-truth implementation delta.

### Prohibited modules and generated files

All files outside the applicable exact allowlist are prohibited. No generated
file, build output, coverage output, comparison file, runtime log, screenshot,
trace, dump, hash, or temporary diagnostic record may be retained or
committed. Task-owned temporary runtime state must be removed by the existing
Harness lifecycle; unrelated pre-existing state must not be touched.

## Contracts

### Lifecycle observation contract

The formatter input is limited to the observable null/non-null state of the
API child's `exitCode` and `signalCode` at the existing readiness deadline:

| Observation                                  | Fixed token                  |
| -------------------------------------------- | ---------------------------- |
| `exitCode !== null` or `signalCode !== null` | `api-child=exit-observed`    |
| both are `null`                              | `api-child=no-exit-observed` |

`exit-observed` does not identify cause, code, signal, timing, or ownership.
`no-exit-observed` is not an assertion that the process is alive or healthy.

### Existing setup and teardown contract

The existing primary record remains exactly:

```text
contentos smoke setup failed: setup=api-start-failed teardown=<clean|failed>
```

No new setup category is introduced. The existing teardown result remains
authoritative for cleanup. The lifecycle line cannot turn a failed teardown
into an eligible attribution.

### Exact Vitest reporter companion contract

For one target Worker invocation only, exactly one complete ANSI-stripped
reporter line `No test files found, exiting with code 1` may accompany exactly
one lifecycle line and one complete
`setup=api-start-failed teardown=clean` record when no Worker test body ran.
The ordinary repository-relative `filter:` line, timing, and empty-suite
headings are reporter framing, not additional failure boundaries, and are not
retained in durable evidence. Any duplicate/conflicting lifecycle line,
second Harness/application/test/cleanup/unhandled-error line, different
secondary failure, or evidence that a test body ran makes the outcome Blocked.

### Security boundary

Only the two fixed lifecycle records may cross this diagnostic seam. Arbitrary
process values and child output are neither inputs to the formatter nor
eligible evidence. No new sink, capability, dependency, network access, or
credential handling is introduced.

## Required preflight and command order

All commands that can spawn application or test processes run directly with
normal process permission. Do not first execute a sandbox version to generate
an expected environmental failure.

1. Record branch, exact base, initial clean status, Node and pnpm versions.
2. Run:

   ```text
   fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
   fnm exec --using=24.18.0 corepack pnpm workspace:check
   ```

3. Verify all existing Harness, concurrent, and Browser failure-injection
   variables are unset using only their fixed names. Do not persist values.
4. Record aggregate task-owned entry state for application processes,
   matching Compose projects/containers, Harness temporary roots, Browser
   artifacts, and repository-local `.pnpm-store`. Preserve unrelated state.
5. Confirm the existing merged readiness/classification boundary, then verify
   the applicable file scope and `git diff --check` before runtime gates.
6. Run the focused deterministic gate:

   ```text
   fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts
   ```

7. Run root `check` with normal process permission:

   ```text
   fnm exec --using=24.18.0 corepack pnpm check
   ```

8. Run full Integration exactly once with normal process permission:

   ```text
   fnm exec --using=24.18.0 corepack pnpm test:integration
   ```

   A red, signal, missing final status, or non-zero task-owned delta stops all
   Browser and Worker commands.

9. If Integration is green, run targeted Prettier, one prerequisite
   `repository:check`, `git diff --check`, and exact-five scope verification.
10. Run Browser exactly once with normal process permission:

    ```text
    fnm exec --using=24.18.0 corepack pnpm test:browser
    ```

    A red, signal, missing final status, or non-zero task-owned delta stops all
    Worker commands.

11. Run the exact Worker command sequentially at most three times, with normal
    process permission:

    ```text
    fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
    ```

    Every physical invocation consumes one slot. Stop on the first red,
    signal, or missing final status. No fourth invocation and no rerun-to-green
    is allowed.

12. After the terminal outcome is recorded in the Packet and Roadmap, run
    targeted Prettier, a final `repository:check`, `git diff --check`, exact
    scope, untracked/artifact, and aggregate task-owned residue checks. A
    failed final static or scope gate forbids Completed publication and must be
    recorded through the Blocked two-document path.

## Terminal outcomes and stopping rules

Terminal predicates are mutually exclusive and evaluated in this order.

### Completed — Attributed `exit-observed` or `no-exit-observed`

All prerequisite gates are green. Every earlier Worker slot has explicit
`RC=0`, `1 file / 7 tests`, no setup/lifecycle record, and zero task-owned
delta. The first red slot has all of:

- explicit `RC=1`;
- exactly one fixed lifecycle record with one of the two allowed tokens;
- exactly one complete `setup=api-start-failed teardown=clean` primary;
- zero Worker test bodies executed;
- at most one complete ANSI-stripped
  `No test files found, exiting with code 1` reporter companion;
- no other Harness, application, test, cleanup, signal, or failure boundary;
- zero task-owned delta.

Stop immediately. This outcome attributes only the deadline observation and
does not authorize a repair or root-cause Issue within this Work Item.

### Completed — Not Reproduced

All prerequisite gates are green and all three Worker slots have explicit
`RC=0`, `1 file / 7 tests`, no setup/lifecycle record, and zero task-owned
delta. This is a bounded not-reproduced result, not proof of non-recurrence.

### Blocked

Blocked includes any prerequisite red, signal, missing status, injection,
scope uncertainty, or task-owned residue; any Worker failure not
matching the exact Attributed predicate; missing, duplicate, or conflicting
lifecycle records; `teardown=failed`; a test body running in the target red;
or any secondary boundary other than the one exact reporter companion. Stop
at first evidence and do not widen or repair the task.

## Acceptance Criteria

1. Planning and terminal file boundaries are exact and independently
   reviewable.
2. The lifecycle formatter accepts only null/non-null child termination state
   and returns one of two fixed records; the real caller helper writes exactly
   one LF and then throws the unchanged readiness error shape.
3. The formatter and emitted record disclose none of the prohibited process,
   path, network, environment, error, log, or credential values.
4. Existing `api-start-failed` and teardown grammar, ordering, timing, cleanup,
   process ownership, and runtime behavior are unchanged.
5. Focused tests cover exit observed through exit code, exit observed through
   signal, no exit observed, signal/exit equivalence, exactly-one LF write
   before throw, unchanged error classification, and bounded non-disclosure.
6. Required gates run once or within the stated attempt cap, in order, under
   normal process permission, with first-red stopping and zero task-owned
   residue.
7. The exact Vitest companion is accepted only under its narrow contract; all
   other secondary or conflicting evidence is Blocked.
8. The Packet and Roadmap report one truthful terminal outcome without a root
   cause, repair, non-recurrence, M2 completion, or M3 claim.

## Security, migration, observability, and rollback

- User content/external input: none.
- Authentication/Authorization/Object Storage/Export/deletion: unchanged.
- Credential/network/provider transmission: unchanged; no new access.
- Database/Schema/API/Queue/Artifact/Agent/configuration compatibility: none.
- Migration/backfill: none.
- Observability: one fixed local stderr diagnostic line at an existing test
  failure boundary; no metric, trace, audit event, raw log, or new sink.
- Rollback: revert the exact five-file Completed diff. A Blocked record branch
  contains only Packet and Roadmap.
- Possible new DEC: none. Stop for Decision Review only if implementation
  requires a product, architecture, security, agent-responsibility, or release
  gate change.

## Documentation updates

- `docs/quality/integration-smoke-harness.md`: document the two fixed lifecycle
  observations and their non-inference boundary.
- This Work Packet: record implementation, commands, terminal evidence,
  independent review, publication CI, and final status.
- `docs/implementation/roadmap.md`: synchronize M2-QUAL-014 without changing
  historical M2-QUAL-011/M2-QUAL-013 truth or M2/M3 status.

## Definition of Ready

**PASS.** All readiness conditions are satisfied:

- the Orchestrator-created GitHub Issue exists and matches this packet;
- exact two-file planning scope and five-file Completed scope are fixed;
- lifecycle, companion, stopping, terminal, security, and publication
  contracts are testable and contain no Blocking Design Question;
- independent correctness/executability and
  governance/scope/security reviewers both return PASS against planning base
  `f941c6cde4fa04460be1744c8f72b709ef8e98bc` plus the exact two-document
  checkpoint;
- reviewer task paths, logical role `DEFINITION_OF_READY_REVIEWER`, requested
  `gpt-5.6-sol` High, and actual runtime status are recorded;
- the planning Packet is then marked Ready, committed and published by the
  Orchestrator, and merged only after its final-head CI is green.

No pre-DoR commit or publication was performed. Issue #188 exists, both final
independent reviews pass, and this Ready sync authorizes only the exact
two-document planning publication. Implementation remains unauthorized until
that planning PR merges with green final-head CI.

### Independent Definition of Ready review

The bounded technical and governance contracts passed independent read-only
review against base `f941c6cde4fa04460be1744c8f72b709ef8e98bc` plus this
exact two-document checkpoint:

- `/root/m2_qual_014_dor_correctness` — correctness/executability PASS after
  the complete Vitest reporter companion was corrected;
- `/root/m2_qual_012_browser_setup_diagnosis` —
  governance/scope/security PASS.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` with High reasoning, and recorded actual runtime as
`UNVERIFIED_RUNTIME_MODEL`. They changed no files and ran no runtime or Docker
operations. Their initial PASS was conditional only on creation of the matching
Issue. Both then re-reviewed open Issue #188 against the corrected Packet and
returned final overall PASS with no remaining findings. There is no Blocking
Design Question and no new DEC is required.

## Definition of Done

### Completed implementation

Done requires the exact five-file diff, every applicable Acceptance Criterion,
the required terminal evidence, final static/scope/residue checks, independent
correctness and scope review PASS, and all required final-head GitHub CI jobs
green. Only then may the Orchestrator mark the PR Ready and squash merge. The
Orchestrator may close only the new M2-QUAL-014 Issue after the Completed merge;
Issues #184 and #175 remain Open.

### Blocked evidence publication

A Blocked Work Item is not Done. After first-red stopping, independent
evidence-accuracy and scope reviewers must PASS the preserved implementation
evidence and authorize only a fresh latest-main exact two-document status
branch. Targeted Prettier, final repository, diff, scope, and artifact checks
and publication final-head CI must be green. The Orchestrator may then publish
and squash-merge the accurate Blocked record while the new Issue remains Open.
No code/current-truth implementation, repair, Issue closure, M2 completion, or
M3 start is authorized by that path.

## Git and GitHub authority

- The Planning Agent may draft only the two planning documents. It may not
  publish before DoR PASS.
- The `luna-worker` implementation agent may edit only the applicable
  allowlist, run required commands, and return the standard Completion Report.
  It may not stage, commit, push, open/modify a PR or Issue, approve itself,
  mark a PR Ready, merge, close Issues, or switch branches.
- Independent reviewers are read-only and do not approve from a report alone.
- After independent PASS, the Orchestrator alone may stage the exact applicable
  files, commit, push, create a Draft PR, reconcile final-head CI, mark Ready,
  and squash merge under the approved bounded autonomous gate.
- Red CI, unrelated failure, record-integrity error, scope drift, unresolved
  finding, branch-protection failure, or required escalation remains blocking.
  No agent may bypass it.
