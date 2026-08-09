# M2-QUAL-017 — Correct-Tempdir Browser Recurrence and Artifact-Baseline Replay

**Status:** Completed — Not Reproduced
**Issue:** [#200](https://github.com/JettxonHo/ContentOS/issues/200) (Closed)
**Linked Issues:** [#196](https://github.com/JettxonHo/ContentOS/issues/196) and [#147](https://github.com/JettxonHo/ContentOS/issues/147) (Open)

This Work Item corrects only the Browser evidence baseline and performs a
bounded recurrence replay. It does not modify Browser behavior, publish the
M2-QUAL-003 Worker repair, or reinterpret M2-QUAL-016's historical first red.

## Identification

- Task ID: `M2-QUAL-017`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Evidence Replay
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED`; runtime identity unavailable
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-017-plan-wt`
- Planning Branch: `codex/m2-qual-017-browser-recurrence-plan`
- Planning Base/HEAD: `001aaf6dbf1d2032c15b870c48838adefd4a3839`
- Planning Initial Status: clean
- Implementation Thread: `/root/m2_qual_017_implementation`
- Implementation Worktree: `/private/tmp/contentos-m2-qual-017-impl-wt`
- Implementation Branch: `codex/m2-qual-017-browser-recurrence-impl`
- Implementation Base/HEAD: `34adb7147460a949092fda65f054a4fcadbec2a7`
- Implementation Initial Status: clean
- Risk: bounded docs/evidence-only Browser replay

## Goal

From fresh latest main, establish the fixed Playwright output observation from
the actual platform `tmpdir()` semantics, then run three predetermined full
Browser slots with first-red stopping. The result answers only whether the
M2-QUAL-016 queued-URL Browser symptom recurs in those slots.

## Context and authority

M2-QUAL-016 stopped on its only Browser invocation at `15/16`, while waiting for
the fixed `Capture failed` UI state in the queued-URL refresh test. It also used
an incomplete Browser-artifact probe path; the later correct platform-temp
probe found one root and two files whose entry ownership could not be proven.
The safe choice was not to delete them.

The repository's Playwright configuration places persistent diagnostic output
under `join(tmpdir(), 'contentos-smoke-harness', 'playwright-output')`. Existing
Current-truth says the Browser wrapper does not own or recursively clean this
fixed output. It is separate from run-unique Harness roots and is not a
task-owned cleanup delta. PRs #198 and #199 had green Browser CI, but CI does not
replace the recorded local red or authorize a retry.

This Work Item creates a new, predeclared three-slot evidence domain. Even a
3/3 green result is only Not Reproduced evidence. Issues #196/#147 remain Open,
M2-QUAL-003 and M2-QUAL-016 remain Blocked, M2-GOV-006 remains Blocked, M2
remains In Progress, and M3 remains Not Started.

## In scope

1. Keep Issue #200 aligned with this Packet and linked to Issues #196/#147.
2. Add only this Packet and the Roadmap row.
3. From a fresh clean implementation worktree after the Ready planning merge,
   verify normal-permission-first preflight and correct artifact observation.
4. Run the exact full Browser command in three predetermined sequential slots,
   stopping on the first red, signal, missing status, unsafe evidence, or owned
   residue.
5. Record one bounded terminal outcome in this Packet and Roadmap only.
6. Obtain independent correctness/evidence and governance/scope/security review
   before Git publication.

## Out of scope

- Modifying M2-QUAL-016, M2-QUAL-003, any Worker test, Browser test,
  `playwright.config.ts`, Browser runner, Web/API/product code, Current-truth,
  dependency/lockfile, Schema/migration, Compose/CI, DEC, or Acceptance Record.
- Running focused Worker, root `check`, full Integration, or full Concurrent
  locally; they do not narrow this Browser recurrence signal.
- Adding a wait, retry, timeout, sleep, category, parser, reporter, output sink,
  cleanup authority, or artifact ownership rule.
- Reading artifact contents; retaining or publishing raw Browser output, stack,
  raw path, PID/PGID, command/arguments, port, URL, credential, Secret,
  environment value, timestamp, content hash, or manifest.
- Deleting or altering the fixed Playwright output or any pre-existing state.
- A replacement/fourth Browser run, rerun-to-green, or treating CI as a local
  slot substitute.
- Completing or publishing the Worker repair, closing #196/#147, completing
  M2-GOV-006 or M2, or starting M3.
- Git/GitHub mutation by implementation or review agents.

## Relevant decisions and documents

- DEC-245, DEC-247, and DEC-261 — deterministic layered and failure-path tests.
- DEC-287, DEC-288, DEC-291, and DEC-292 — bounded Work Items, independent
  review, Ready/Done, and scope governance.
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-QUAL-016 Work Packet](m2-qual-016-worker-dispatcher-observation-repair-final-replay.md)

No new DEC is required. Stop for Decision Review only if a later proposal
changes product, architecture, security, agent responsibility, or release-gate
semantics.

## Exact file authority

All planning, local terminal evidence, Blocked or Not-Reproduced publication,
and post-merge status sync phases are exact two:

- `docs/implementation/work-packets/m2-qual-017-correct-tempdir-browser-recurrence-artifact-baseline-replay.md`
- `docs/implementation/roadmap.md`

Every code, test, configuration, Current-truth, prior Packet, dependency,
lockfile, generated, or runtime-artifact path is prohibited. Any extra diff or
untracked artifact is Blocked.

## Artifact and residue contract

- Resolve the fixed output root from current configuration semantics using
  platform `node:os.tmpdir()`; do not hard-code `/tmp` or persist its raw path.
- The first governed toolchain call is a normal-permission Node 24.18.0 bounded
  probe. It resolves `tmpdir()`, uses `lstat` without following symlinks, and
  reads at most 65 direct directory entries to enforce a 64-entry cap.
- Durable entry/post fields are exactly:
  `fixed-browser-output=absent|directory`,
  `fixed-browser-entry-count=0..64`,
  `fixed-browser-last-run=absent|regular-file`, and aggregate direct-entry
  counts for `regular-file` and `directory`. Raw names other than the static
  `.last-run.json` contract are not retained.
- Passing states are: root absent (count zero, last-run absent), or a real
  directory with at most 64 direct entries, only regular-file/directory direct
  node types, and `.last-run.json` either absent or a regular file. Root or
  direct-entry symlink, root non-directory, `.last-run.json` non-regular,
  unsupported node type, more than 64 entries, read error, or indeterminate
  state is Blocked. No symlink is followed and no file content is read.
- The fixed output is shared persistent Playwright diagnostic output. Observe
  only; do not read contents, enumerate durable filenames, or manually delete
  it. Standard Playwright internal management remains unchanged.
- `.last-run.json` is checked only by node type and recorded by the fixed field
  above; no content is read or retained. Any accepted direct-entry count may
  change across slots because the root is shared/non-owned; only safety and
  determinacy, not count equality, is required.
- Task-owned state comprises task-worktree application processes, exact smoke
  Compose projects/containers, run-unique Harness roots, and repository-local
  `.pnpm-store`. Use ephemeral identity-set comparison; durable evidence retains
  counts/deltas only. Never signal or delete pre-existing state.
- Every post-slot task-owned delta must be zero. Fixed shared output is reported
  separately and is not misclassified as task-owned residue.

## Permission and exact command order

All toolchain, repository, test/harness, Docker, process-enumeration, and
residue commands—including `fnm`, Corepack/pnpm, Playwright, `ps`, and `pgrep`—
must use normal process permission from their first physical invocation. A
default-sandbox governed invocation immediately makes the Work Item Blocked and
cannot be replaced by a later green run. Pure read-only Git identity/status is
not a runtime probe.

1. Pure Git: record branch, exact base, clean status, no untracked files, and
   diff check.
2. As the first governed toolchain invocation, use normal permission with
   `fnm exec --using=24.18.0 node` to verify Node `24.18.0`, check that the
   eleven fixed injection names are unset, and execute the bounded
   config-derived fixed-output probe above. In the same pre-install phase, use
   normal-permission process/Compose/root/store observations to record the
   task-owned entry identities/counts.
3. With normal permission from first invocation, record pnpm `11.17.0`; run
   frozen install and workspace check; immediately require zero task-owned
   delta and repeat the bounded shared-output probe.
4. Run targeted Packet/Roadmap Prettier, `repository:check`, `git diff --check`,
   exact-two, and no-untracked prechecks with normal permission where applicable.
5. Run this exact command in three predetermined sequential slots:

   ```text
   fnm exec --using=24.18.0 corepack pnpm test:browser
   ```

   Each slot consumes one physical invocation and must return explicit `RC=0`
   with `16/16`. After each slot, require zero task-owned delta and a determinate
   fixed-output observation. Stop at first red, signal, missing status, unsafe
   evidence, or residue. No replacement or fourth run.

6. Synchronize terminal evidence only to this Packet and Roadmap; then rerun
   targeted Prettier, `repository:check`, diff/exact-two/no-untracked checks and
   final observations.

Pinned Chromium is a prerequisite. If unavailable, stop Blocked; this Work Item
does not download or change the browser version.

## Terminal outcomes

### Local In Review — Browser Symptom Not Reproduced

Requires all three predetermined slots at explicit `RC=0`, `16/16`; every
task-owned delta zero; shared-output observations determinate; exact-two static
checks green. The Packet/Roadmap then say `In Review — Browser symptom Not
Reproduced; independent review, CI, and merge pending`.

After independent exact-two reviews pass, all three final-head CI jobs are
green, and the Orchestrator squash-merges, the post-merge exact-two status sync
may record **Completed — Not Reproduced** and close only Issue #200. This does
not prove repair or permanent non-recurrence and does not authorize Worker
publication. Issues #196/#147 remain Open.

### Blocked — Queued-URL Browser Symptom Reproduced

Available only when one complete failure identifies the exact repository-owned
test title `M2 Source intake: queued URL refreshes to safe failure and keeps
fallback independent` and exactly one closed safe ordinal:

- `capture-failed-1`: after the manual `Reload Source status` action;
- `capture-failed-2`: after the independent fallback Source is added;
- `capture-failed-3`: after the subsequent page reload.

Ephemeral inspection of the top-level Playwright gate output is allowed solely
to map the fixed title and repository source location/order to this closed enum.
Child logs/streams and artifact contents are not inspected; raw output,
path/line, or stack is not retained or published. Unmatched, multiple, or
conflicting sites remain non-target/unclassified. Durable evidence retains only
the fixed test title, safe ordinal, top-level RC, and counts. It is symptom
attribution only, not root cause.

### Other Blocked outcomes

- Any other, multiple, or incomplete Browser failure: `Blocked — Browser
required gate failure (non-target/unclassified)`.
- Unsafe fixed-output node type/shape or incomplete entry evidence: `Blocked —
Browser artifact evidence incomplete`.
- Defined injection, sandbox-first execution, task-owned residue, missing
  status/signal, scope/static failure, or review finding: Blocked.

Every Blocked outcome stops remaining slots. All three Issues remain Open. A
fresh-main exact-two Blocked record may publish only after independent review,
green static checks, and green publication final-head CI.

## Acceptance Criteria

1. Issue #200 and this Packet have exact parity and link Issues #196/#147.
2. Exact-two scope is preserved throughout; prohibited paths remain unchanged.
3. All governed commands use normal permission from first invocation; eleven
   injections are unset.
4. Fixed shared Browser output and task-owned state are correctly separated,
   safely observed, and never manually cleaned.
5. Three predetermined Browser slots run sequentially, first-red stopping is
   enforced, and every completed slot has an explicit status and post snapshot.
6. Terminal evidence matches exactly one predicate and makes no root-cause,
   repair, non-recurrence, Worker-publication, M2, or M3 claim.
7. Targeted Prettier, `repository:check`, diff/exact-two/no-untracked checks and
   independent reviews pass for the final publication checkpoint.

## Tests and validation

- Node 24.18.0 / pnpm 11.17.0, frozen install, workspace check.
- Targeted Packet/Roadmap Prettier and `repository:check` before and after slots.
- Exact full Browser command: up to three predetermined normal-permission slots.
- Entry/post/final shared-output and task-owned aggregate observations.
- Diff, exact-two scope, no-untracked, and no prohibited artifact checks.

No local Worker, root, Integration, or Concurrent gate is authorized.
Publication final-head CI still requires quality, Integration, and browser jobs;
CI cannot overwrite a local first red.

## Security, migration, observability, and rollback

- Product data, auth, owner scope, API, database, Queue, Object Storage,
  credentials, network, dependencies, Schema, migration, Compose, and CI:
  unchanged.
- Observability: existing Browser gate result/counts, safe fixed test
  title/ordinal where eligible, and aggregate observations only; no new sink.
- Migration/backfill: none.
- Rollback: revert the exact-two docs publication.
- Possible new DEC: none.

## Documentation updates

- New M2-QUAL-017 Packet: planning, bounded replay, review, CI, merge, status.
- Roadmap: add and synchronize M2-QUAL-017 while preserving QUAL016/003,
  M2-GOV-006, M2, and M3 history.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning base
`001aaf6dbf1d2032c15b870c48838adefd4a3839`, the exact-two Packet/Roadmap
checkpoint, and live Issue #200 parity:

- `/root/m2_qual_014_dor_correctness` — correctness/executability: PASS;
- `/root/m2_qual_012_browser_setup_diagnosis` —
  governance/scope/security: PASS;
- logical role: `DEFINITION_OF_READY_REVIEWER`;
- requested model/reasoning: `gpt-5.6-sol` / High;
- actual runtime model: `UNVERIFIED_RUNTIME_MODEL`.

All Required findings were corrected and narrowly re-reviewed. Ready confirms
Issue #200 parity, exact-two scope, correct artifact
and residue semantics, normal-permission-first ordering, fixed slot count and
terminal predicates, publication authority, no Blocking Design Question, no
new DEC, and no unresolved review finding.

No pre-DoR commit/publication is allowed. After both reviews pass, only the
Orchestrator may mark Ready, publish the exact-two planning PR, and merge it
after all required final-head CI jobs are green.

## Implementation Replay Evidence — Completed — Not Reproduced

**Terminal outcome:** **Completed — Not Reproduced.** The fresh implementation baseline completed all
three predetermined Browser slots with explicit `RC=0` and `16/16`. This is
bounded Not Reproduced evidence only; it makes no root-cause, repair, permanent
non-recurrence, Worker-publication, M2-completion, M3-start, or Issue mutation
claim.

### Baseline and preflight

- The implementation branch was clean at base/HEAD
  `34adb7147460a949092fda65f054a4fcadbec2a7`, with no untracked files and a
  passing diff check.
- The first governed toolchain invocation used normal permission with Node
  `v24.18.0`; all eleven fixed failure-injection names were unset. The
  config-derived shared output probe used platform `tmpdir()`, `lstat` without
  following symlinks, and the bounded direct-entry read. Its pre-install fields
  were `fixed-browser-output=directory`,
  `fixed-browser-entry-count=2`, `fixed-browser-last-run=regular-file`, with
  direct-entry aggregates `regular-file=1` and `directory=1`; the probe passed.
- pnpm `11.17.0`, frozen install, and workspace check passed. The pre-install
  and post-install task-owned aggregates were all zero for application
  processes, matching Compose projects/containers, Harness roots, and the
  repository-local `.pnpm-store`; the post-install delta was zero. The repeated
  shared-output probe remained determinate and safe with fields
  `directory`, `2`, `regular-file`, `1`, and `1`.
- Every governed command used normal process permission from its first physical
  invocation. The fixed shared output was observed only; no content was read,
  no raw entry names were retained, and the implementer performed no manual
  cleanup or out-of-contract direct mutation. The later aggregate count change
  was recorded as contract-allowed Playwright internal management without an
  ownership or deletion-actor claim.

### Browser slots and post-slot evidence

- The exact command
  `fnm exec --using=24.18.0 corepack pnpm test:browser` ran in three
  predetermined sequential slots with first-red stopping.
- Slot #1 returned `RC=0` with `16/16`. Its post-slot task-owned aggregate was
  zero for application processes, matching Compose projects/containers,
  Harness roots, and the repository-local `.pnpm-store`; the shared-output probe
  passed with `fixed-browser-output=directory`,
  `fixed-browser-entry-count=1`, `fixed-browser-last-run=regular-file`, and
  direct-entry aggregates `regular-file=1`, `directory=0`.
- Slot #2 returned `RC=0` with `16/16`. Its post-slot task-owned aggregate and
  shared-output probe were the same zero/determinate fields as slot #1.
- Slot #3 returned `RC=0` with `16/16`. Its post-slot task-owned aggregate and
  shared-output probe were the same zero/determinate fields as slot #1.
- The shared direct-entry count changed from two during preflight to one after
  the first slot and remained one; this shared/non-owned variation is accepted
  by the contract and was never misclassified as task-owned residue. No fourth
  or replacement Browser invocation was made.

### Final publication checkpoint

- After evidence synchronization, targeted Packet/Roadmap Prettier,
  `repository:check`, `git diff --check`, exact-two scope, and no-untracked
  checks all passed. The final tracked diff contains only this Packet and the
  Roadmap; no generated or runtime artifact is present.
- The final task-owned aggregate remained zero for application processes,
  matching Compose projects/containers, Harness roots, and the repository-local
  `.pnpm-store`, with `final-task-owned-delta=zero`. The final shared-output
  probe remained safe and determinate with
  `fixed-browser-output=directory`, `fixed-browser-entry-count=1`,
  `fixed-browser-last-run=regular-file`, and direct-entry aggregates
  `regular-file=1`, `directory=0`.

## Independent implementation review

**PASS.** Independent correctness/evidence and governance/scope/security review
completed against implementation base
`34adb7147460a949092fda65f054a4fcadbec2a7` plus the corrected exact-two
Packet/Roadmap implementation evidence:

- `/root/m2_qual_014_dor_correctness`
- `/root/m2_qual_012_browser_setup_diagnosis`
- Logical Role: `INDEPENDENT_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`

Both reviews returned PASS with no remaining finding. The planning placeholders
were replaced with the actual implementation identity, and the shared-output
count change is now recorded without an ownership or deletion-actor inference.
This PASS authorizes only the exact-two In Review candidate to enter the
Orchestrator-controlled final-head CI and merge gate. At that review checkpoint
it was not Completed and did not authorize Issue closure, Worker or historical
Packet publication, root-cause, repair, permanent non-recurrence, M2
completion, or M3 entry.

## Completion publication evidence

- PR [#202](https://github.com/JettxonHo/ContentOS/pull/202),
  `docs: record M2-QUAL-017 browser recurrence replay`, merged at
  `2026-08-09T12:37:55Z` with squash
  `78bcac18ae4ca008fa25a00df1f1b5a7643f9aba`.
- The final-head source was
  `41a6eba45e89e8807830deab7b2056dc84aaacb0`. PR #202 changed exactly this
  Packet and the Roadmap.
- Final-head CI run
  [31313625846](https://github.com/JettxonHo/ContentOS/actions/runs/31313625846)
  completed successfully: Docker-independent quality `2m12s`, Integration
  smoke `3m04s`, and M1/M2 browser smoke `2m36s`.
- Issue #200 closed at `2026-08-09T12:38:18Z` after merge. Issues #196 and #147
  remain Open; the Worker repair remains unpublished, M2-QUAL-016 and
  M2-QUAL-003 remain historical Blocked, M2-GOV-006 remains Blocked, M2 remains
  In Progress, and M3 remains Not Started.
- `Completed — Not Reproduced` is bounded to the three predetermined local
  Browser slots plus the green publication gate. It makes no root-cause,
  repair, or permanent non-recurrence claim and does not authorize the
  conditional M2-QUAL-018 Worker publication work without its own Ready packet.

### Independent completion-status review

**PASS.** The exact-two completion-status diff on base
`78bcac18ae4ca008fa25a00df1f1b5a7643f9aba` was independently reviewed by:

- `/root/m2_qual_014_dor_correctness`
- `/root/m2_qual_012_browser_setup_diagnosis`
- Logical Role: `INDEPENDENT_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Requested Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`

Both reviewers verified PR #202, its exact-two final head and squash, CI run
`31313625846`, Issue #200 closure, Issues #196/#147 remaining Open, and the
bounded status language with no finding. This authority covers only publication
of this Packet/Roadmap status diff. It does not authorize Worker or historical
Packet changes, Issues #196/#147 closure, root-cause, repair, permanent
non-recurrence, M2 completion, or M3 entry.

## Definition of Done and authority

Done requires the applicable terminal predicate, all local/static evidence,
two independent final exact-two reviews with no finding, exact scope, and all
three final-head CI jobs green. Only the Orchestrator may stage, commit, push,
open/ready/merge PRs, or mutate Issues. Completed closes only Issue #200 after
merge; #196/#147 remain Open. Blocked keeps all three Open. Implementation and
review agents may not approve their own work or perform Git/GitHub mutation.
