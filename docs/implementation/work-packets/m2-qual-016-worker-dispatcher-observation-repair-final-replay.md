# M2-QUAL-016 — Fresh-Main Worker Dispatcher Observation Repair Reconstruction and Final Replay

**Status:** Ready
**Issue:** [#196](https://github.com/JettxonHo/ContentOS/issues/196) (Open)
**Historical Defect:** [#147](https://github.com/JettxonHo/ContentOS/issues/147) (Open)

This Work Item reconstructs the preserved M2-QUAL-003 test synchronization
repair on fresh latest main and performs its final normal-permission replay. It
does not add another repair, weaken an assertion, or start the M2 Exit Review.

## Identification

- Task ID: `M2-QUAL-016`
- Title: Fresh-Main Worker Dispatcher Observation Repair Reconstruction and
  Final Replay
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Test Repair Reconstruction and Verification
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: record when visible; otherwise
  `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED`; runtime verification pending
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-016-plan-wt`
- Planning Branch: `codex/m2-qual-016-worker-observation-final-replay-plan`
- Planning Base/HEAD: `ec10909bb8590de29684548df8759cd8b4932a00`
- Planning Initial Status: clean
- Proposed Implementation Thread: assigned only after this packet is Ready and
  the planning PR merges with green final-head CI
- Dependencies: M2-QUAL-015 Completed — Not Reproduced through PR #194 and its
  final status synchronized through PR #195
- Risk Classification: bounded deterministic integration-test repair replay

## Goal

From a fresh latest-main implementation worktree, manually reconstruct the
three preserved M2-QUAL-003 bounded Outbox-observation waits, prove ephemeral
non-hash byte equivalence, and validate the repair with three focused Worker
runs and three full Concurrent runs plus the required repository gates. A
successful merge completes the historical M2-QUAL-003 defect through this
successor while preserving every earlier Blocked record.

## Context and authority

M2-QUAL-003 addresses a test-observation race: after the matching current Queue
Job is visible, the test may observe its owning PostgreSQL Outbox while it is still
`dispatching`, even though the production path publishes the Job before the
authoritative Outbox acknowledgement. The preserved repair captures the exact
fixture Outbox ID in one local binding, then waits with the repository's existing
bounded `waitFor` helper for that exact Outbox to become `dispatched` at three
observation points. All exact Job, Task, generation, attempt, retention, and
final assertions remain unchanged.

M2-QUAL-015 published the API-readiness lifecycle checkpoint after a clean
normal-permission replay. That result removes the diagnostic dependency but
does not itself complete M2-QUAL-003.

The authoritative reference named by the published M2-QUAL-003 Packet is
`/private/tmp/contentos-m2-qual-005-wt`, branch
`codex/m2-qual-003-worker-dispatcher-observation-final-v2`, HEAD
`eac0561ea5e020d7f1d712e0aefff100567fc78a`. It must remain exact-three dirty
(Roadmap, M2-QUAL-003 Packet, Worker test), with no untracked files and a clean
diff check. No alternate reference or fallback matrix is authorized.

The published M2-QUAL-003 Packet otherwise prohibits commands and Git operations
inside that preserved worktree. This successor's explicit task-level authority
creates one narrow exception: read-only Git branch/HEAD/status/diff checks and
silent byte comparisons against the fixed reference are allowed. Runtime or test
commands, edits, clean, checkout, reset, staging, commit, or any other Git or
filesystem mutation in the reference remain prohibited.

Issues #196 and #147 remain Open until a successful implementation merge.
M2-GOV-006 remains **Blocked** and requires its own renewed Definition of Ready
after this Work Item; M2 remains **In Progress** and M3 remains **Not Started**.
No new DEC is required or proposed.

## In scope

### Planning turn

1. Keep Orchestrator-created Issue #196 aligned with this exact contract and
   linked to Issue #147.
2. Add this complete Work Packet and one M2-QUAL-016 Roadmap row.
3. Obtain independent correctness/executability and governance/scope/security
   Definition of Ready reviews against the exact planning base, exact two-file
   checkpoint, and Issue #196 body.

### Future implementation and replay

4. Start only after the Ready planning PR merges with green final-head CI, in a
   fresh clean worktree at the resulting latest `origin/main`.
5. Verify the fixed preserved reference worktree, branch, HEAD, exact-three
   historical dirty allowlist, no-untracked state, and `git diff --check`.
6. Before editing, silently compare the fresh Worker test with the same file at
   the preserved reference's committed HEAD. Any mismatch is Blocked.
7. Manually reconstruct only the preserved local exact-ID capture and three
   existing bounded observation waits:

   - `const outboxId = fixture.outboxId;` to retain the exact initial owner ID;
   - initial Queue Job visibility → exact initial owner Outbox `dispatched`;
   - first repaired Job visibility → exact repaired owner Outbox `dispatched`;
   - fairness repaired Job visibility → exact target owner Outbox `dispatched`.

8. Preserve the existing 15-second `waitFor` bound and all exact assertions.
   Add no helper, sleep, timeout, retry, production code, or new assertion.
9. After editing, silently compare the reconstructed Worker test with the
   preserved working-copy file. Record only pass/fail; persist no diff, hash,
   manifest, or raw comparison output.
10. Run every required gate in the exact order and permission mode below and
    stop on first red. A fully green local replay records the In Review
    candidate; a failure records the Blocked terminal. Completed is available
    only after independent review, final-head CI, and merge.

## Out of scope

- Copying, applying, cherry-picking, or publishing the preserved worktree or
  its existing diff.
- Modifying production, API, Worker runtime, Domain, database, Schema,
  migration, dependency, lockfile, manifest, Compose, CI, configuration,
  Accepted DEC, Acceptance Record, README, AGENTS, or Current-truth.
- Adding or changing wait duration, retry count, sleep, timeout, assertion,
  setup category, lifecycle token, parser, reporter, cleanup, ownership,
  process-control behavior, or test filter.
- Directly opening or extracting child logs or streams; retaining or publishing
  raw child output, arbitrary error/stack, child command line/arguments, PID,
  process group, child exit code/signal, runtime path, port, URL, credential,
  Secret, environment value, timestamp, content hash, or persistent comparison
  artifact.
- A failure retry, fourth focused/Concurrent run, rerun-to-green, arbitrary
  subset, or full-gate substitute.
- Rewriting or deleting any historical M2-QUAL-003 failure, Blocked terminal,
  review metadata, root-cause statement, or base.
- Starting, completing, or publishing M2-GOV-006; completing M2; or starting
  M3.
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
- [Release Gates](../../quality/release-gates.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-015 Work Packet](m2-qual-015-normal-permission-api-readiness-lifecycle-checkpoint-replay.md)

## Allowed and prohibited files

### Planning write scope — exact two files

- `docs/implementation/work-packets/m2-qual-016-worker-dispatcher-observation-repair-final-replay.md`
- `docs/implementation/roadmap.md`

### Completed implementation candidate — exact four files

- `packages/testing/src/integration/worker-dispatcher.test.ts`
- `docs/implementation/work-packets/m2-qual-016-worker-dispatcher-observation-repair-final-replay.md`
- `docs/implementation/work-packets/m2-qual-003-worker-dispatcher-observation-stability.md`
- `docs/implementation/roadmap.md`

During the candidate stage, the original M2-QUAL-003 Packet may only change its
top-level status to `In Review — successor repair replay passed; independent
review, final-head CI, and merge pending` and append a successor-evidence
section. Except for that explicitly authorized top-level status line, every
historical line must remain intact. It may not say Completed before the
successful merge.

A **Blocked** publication contains only the new M2-QUAL-016 Packet and Roadmap
from a fresh latest-main status branch. It must not publish the Worker test or
modify the original M2-QUAL-003 Packet.

After a successful implementation merge, final completion-status sync is exact
three documents: both Work Packets and Roadmap. Only that sync marks
M2-QUAL-003 `Completed through M2-QUAL-016` while retaining prior attempts as
historical Blocked evidence.

All other files are prohibited. No generated file, build output, coverage,
runtime log, trace, screenshot, dump, hash, manifest, or persistent comparison
output may be retained or committed.

## Contracts

### Reconstruction and equivalence contract

- The preserved reference is read-only and must match its fixed worktree,
  branch, HEAD, exact-three dirty allowlist, no-untracked state, and diff check.
- The only exception to the older M2-QUAL-003 reference prohibition is the
  successor-authorized read-only Git identity/status/diff inspection and silent
  comparison above; no reference mutation or runtime command is allowed.
- The pre-edit comparison is the fresh Worker file against the reference's
  committed HEAD file.
- Reconstruction is manual with `apply_patch` and limited to the one local exact
  `outboxId` capture plus the three bounded wait conversions.
- The post-edit comparison is the reconstructed Worker file against the
  reference working-copy file.
- Comparisons are silent, ephemeral, non-hash checks such as `cmp -s`; durable
  evidence records only purpose and pass/fail.
- Any identity, baseline, equivalence, or scope mismatch is Blocked. No fallback
  reference is allowed.

### Observation-repair contract

The matching current Queue Job remains the first test observation and trigger;
it is transport evidence, not authoritative state. After it appears, the test
waits only for the exact owning PostgreSQL Outbox ledger—the authoritative
acknowledgement—to become `dispatched`, using the existing 15-second bounded
helper. The final assertions remain exact and unchanged. The repair changes test
observation timing only; it does not change production sequencing, retry, or
timeout behavior.

### Evidence and security boundary

Required gate-returned output may be inspected ephemerally to determine the
contracted outcome. Durable evidence may retain only approved top-level or
coordinator gate command names/results, RC/test counts, existing sanitized
classification fields, reviewer metadata, Git governance SHAs, PR/CI facts, and
aggregate task-owned residue counts/deltas. A child exit/signal may be recorded
only when it is already represented by an existing sanitized field; its raw
value may not be extracted or retained. Direct child log/stream inspection and
publication of raw output or any prohibited runtime value remain forbidden. No
new sink, credential, network capability, cleanup authority, or hash mechanism
is added.

## Required preflight, permission, and command order

All toolchain, repository, test/harness, Docker, process-enumeration, and
residue commands—including `fnm`, Corepack/pnpm, Vitest, `ps`, and `pgrep`—must
use normal process permission from their first physical invocation. Pure
read-only Git identity/status checks and silent byte comparisons are not
runtime gates and must not be used as sandbox capability probes.

Any governed command first invoked in the default sandbox immediately makes
the Work Item Blocked and stops every later runtime command. A later green
rerun cannot replace the failed permission/order evidence.

1. Use pure read-only Git checks to record branch, exact base, and clean initial
   status.
2. Before any toolchain/install/runtime invocation, use normal process
   permission to verify the eleven fixed Harness, concurrent, and Browser
   injection names are unset and record the entry task-owned application
   processes, matching Compose projects/containers, Harness temporary roots,
   Browser artifacts, and repository-local `.pnpm-store`.
3. With normal process permission from the first invocation, record Node
   `24.18.0` and pnpm `11.17.0`, then run frozen install and workspace check.
   Immediately repeat the bounded residue snapshot and require zero delta from
   entry before continuing.
4. Verify the reference identity/state, pre-edit equality, manual
   reconstruction, post-edit equality, `git diff --check`, and exact Worker-only
   implementation scope.
5. With normal process permission, run the exact focused Worker command three
   planned consecutive times:

   ```text
   fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
   ```

   Each must return `RC=0`, `1 file / 7 tests`. Stop on first red, signal,
   missing status, or residue. The three runs are predetermined validation
   slots, not retries.

6. Run root `check` exactly once with normal process permission. Expected
   baseline shape: `54 files / 578 tests` and five application builds.
7. Run full Integration exactly once with normal process permission. Expected
   baseline shape: `27 files / 185 tests`.
8. Run targeted Prettier for the Worker file, prerequisite `repository:check`,
   `git diff --check`, and a preliminary scope check proving that the only
   implementation delta is the Worker file and that it fits the eventual
   exact-four allowlist. Use normal process permission where applicable.
9. Run Browser exactly once with normal process permission. Expected shape:
   `16/16`.
10. Run full Concurrent three planned consecutive times with normal process
    permission:

    ```text
    fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent
    ```

    Each must have explicit coordinator `RC=0`, both children complete
    successfully, isolation/ownership verification pass, and zero task-owned
    residue. Stop on first red, signal, missing status, ambiguous sanitized
    evidence, or residue. No fourth run.

11. After every focused, root, Integration, Browser, and Concurrent gate, record
    a normal-permission task-owned residue snapshot. Any non-zero delta stops
    later runtime commands.
12. When all runtime gates are green, write the local candidate evidence only to
    the new Packet, original M2-QUAL-003 Packet, and Roadmap. Both Packets and the
    Roadmap must say `In Review — successor repair replay passed; independent
review, final-head CI, and merge pending`; the original M2-QUAL-003 history
    otherwise remains unchanged. Then run final targeted Prettier,
    `repository:check`, `git diff --check`, exact-four scope,
    no-untracked/artifact, and final residue checks.

## Terminal outcomes and stopping rules

### Local candidate — In Review — Repair Replay Passed

All of these are required:

- reference identity, baseline equality, manual reconstruction, and post-edit
  equivalence pass;
- injections are unset and every process gate starts with normal permission;
- focused Worker passes all three planned runs at `1 file / 7 tests`;
- root, Integration, Browser, and all three Concurrent runs are green;
- every required task-owned residue delta is zero;
- final static, exact-four scope, artifact, and residue checks pass.

This local predicate permits the exact-four candidate to enter independent
review; it is not yet Completed. Only after two new independent implementation
reviews pass, the implementation PR's three required final-head CI jobs are
green, and the Orchestrator squash-merges the exact-four candidate may the
post-merge exact-three status sync record **Completed — Repair Verified** and
close Issues #196/#147. The three Concurrent passes are bounded non-recurrence
evidence only; they do not prove permanent non-recurrence or authorize another
repair.

### Blocked

Blocked includes any reference, baseline, reconstruction, equivalence, scope,
permission, injection, or residue uncertainty; any gate red, signal, missing
status, or ambiguous Concurrent evidence; any Worker/code/test or unplanned
document correction after a runtime gate; or an unresolved independent review
finding. The required step-12 three-document evidence/status sync and bounded
review-requested documentation accuracy corrections are the only post-runtime
edit exception. After every such documentation correction, rerun targeted
Prettier, `repository:check`, `git diff --check`, exact-four scope, and
no-untracked checks; the independent reviewer must re-review the corrected final
checkpoint. Stop at first failure evidence. Do not modify the Worker delta,
rerun-to-green, or widen the Work Item.

## Acceptance Criteria

1. Issue #196, exact planning/Completed/Blocked/final-status boundaries, and
   Issue #147 lifecycle are aligned and independently reviewable.
2. The fixed preserved reference identity/state and pre/post silent non-hash
   equivalence checks pass without a persistent artifact.
3. Exactly one preserved local exact-ID capture and three existing bounded
   Outbox-observation waits are reconstructed; all exact assertions and the
   existing bound remain unchanged.
4. Every governed command starts with normal process permission and runs once or
   in the stated predetermined three-run set, with first-red stopping.
5. Focused Worker 3×, root, Integration, Browser, and full Concurrent 3× pass,
   with every required task-owned residue delta zero.
6. The preliminary Worker-only scope check and post-sync exact-four candidate
   scope/final gates pass; no prohibited or generated file remains.
7. Original M2-QUAL-003 history is preserved. Candidate status is In Review;
   only the post-merge exact-three sync may mark it Completed through
   M2-QUAL-016.
8. No root-cause expansion, assertion weakening, timeout/retry/cleanup/product
   change, M2-GOV-006 completion, M2 completion, or M3 start is claimed.

## Tests and validation

- Node 24.18.0 / pnpm 11.17.0, frozen install, workspace check.
- Focused Worker exact command: three planned normal-permission runs.
- Root `check`: one normal-permission run.
- Full Integration: one normal-permission run.
- Browser: one normal-permission run.
- Full Concurrent: three planned normal-permission runs.
- Targeted Prettier, prerequisite/final `repository:check`, diff, exact scope,
  untracked/artifact, and per-gate/final residue checks.

No required failure may be skipped, relabeled, or replaced by a later green
run.

## Security, migration, observability, and rollback

- User/external content, authentication, authorization, Object Storage, export,
  deletion, credentials, and provider transmission: unchanged.
- Database, Schema, migration, API, Queue, Artifact, Agent, dependency,
  configuration, Compose, and CI compatibility: unchanged.
- Observability: existing sanitized Harness results and bounded aggregate
  evidence only; no new log, metric, trace, audit event, or raw sink.
- Migration/backfill: none.
- Rollback: revert the exact-four Completed candidate. A Blocked status branch
  contains only the new Packet and Roadmap.
- Possible new DEC: none. Stop for Decision Review only if implementation
  requires a product, architecture, security, agent-responsibility, or release
  gate change.

## Documentation updates

- New M2-QUAL-016 Packet: record reconstruction, gates, terminal evidence,
  review, CI, merge, and status.
- Original M2-QUAL-003 Packet: successful candidate only; mark In Review and
  append successor evidence without rewriting history. Final status sync marks
  Completed through M2-QUAL-016.
- Roadmap: add M2-QUAL-016 and synchronize M2-QUAL-003 while preserving all
  historical facts and downstream M2-GOV-006/M2/M3 boundaries.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning base
`ec10909bb8590de29684548df8759cd8b4932a00`, the exact two-file Packet/Roadmap
checkpoint, and live Issue #196 parity:

- `/root/m2_qual_014_dor_correctness` — correctness/executability: PASS;
- `/root/m2_qual_012_browser_setup_diagnosis` —
  governance/scope/security: PASS;
- logical role: `DEFINITION_OF_READY_REVIEWER`;
- requested model/reasoning: `gpt-5.6-sol` / High;
- actual runtime model: `UNVERIFIED_RUNTIME_MODEL`.

All required findings were corrected and narrowly re-reviewed. Ready confirms:

- Issue #196 exists, links #147, and matches this exact contract;
- exact planning/Completed/Blocked/final-status file boundaries are fixed;
- reference identity, manual reconstruction, normal-permission-first commands,
  exact gate order/counts, residue checks, terminal predicate, security limits,
  publication authority, and Issue lifecycle are testable;
- no Blocking Design Question or new DEC is required;
- no unresolved review finding remains.

No pre-DoR commit or publication is allowed. After both reviews pass, the
Orchestrator may mark the Packet/Roadmap Ready, publish the exact-two planning
PR, and merge it only after all required final-head CI jobs are green.
Implementation begins only from the resulting fresh latest main.

## Definition of Done and publication authority

### Completed path

Done requires the exact-four candidate, every Acceptance Criterion, all local
gates and residue checks, two new independent implementation reviews with no
unresolved finding, and all three required final-head CI jobs green. Only the
Orchestrator may stage, commit, push, open the Draft PR, mark Ready, and squash
merge. Only after that merge may the Orchestrator close Issues #196 and #147.
The exact-three final status sync must then pass independent review and
publication CI before it marks both Work Items Completed. M2-GOV-006 remains
Blocked pending its own renewal.

### Blocked path

Freeze the evidence and obtain independent evidence-accuracy and
scope/governance/security review. From fresh latest main, publish only the new
Packet and Roadmap after targeted Prettier, final `repository:check`,
diff/scope checks, exact-two independent PASS, and green publication final-head
CI. Issues #196/#147 remain Open; the Worker test and original M2-QUAL-003 Packet
must not publish.

Implementation and review agents may not stage, commit, push, create or mutate
PRs/Issues, approve, mark Ready, merge, close Issues, or approve their own work.
