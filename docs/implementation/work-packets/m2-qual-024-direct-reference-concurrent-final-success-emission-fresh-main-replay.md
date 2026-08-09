# M2-QUAL-024 — Direct-Reference Concurrent Final-Success Emission Fresh-Main Replay

**Status:** Blocked — Direct-Reference Concurrent Final Success Emission Not Verified
**Issue:** [#222](https://github.com/JettxonHo/ContentOS/issues/222) (Open)
**Linked:** #218/#215/#208/#204/#196/#147 Open; #212/#210 Closed

## Fresh-main publication identity

- Task ID: M2-QUAL-024
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Bug Fix and Bounded Verification
- Correction worktree: /private/tmp/contentos-m2-qual-024-blocked-correction-wt
- Correction branch: codex/m2-qual-024-blocked-status-correction
- Correction base/HEAD: 8a9940220cd86a487054291b36e6710f9109a3e3
- Correction initial status: clean; publication shape is exact-two M Roadmap + ?? Packet
- Reconciliation worktree: /private/tmp/contentos-m2-qual-024-merge-status-wt
- Reconciliation branch: codex/m2-qual-024-merge-status-sync
- Reconciliation base/HEAD: dac54d2a3efe70f7f2bb498372958cb40aa667b6
- Reconciliation physical shape: tracked M Packet + tracked M Roadmap; no other path
- Historical planning worktree: /private/tmp/contentos-m2-qual-024-plan-wt
- Historical planning branch: codex/m2-qual-024-direct-reference-replay-plan
- Historical planning base/HEAD: 8a9940220cd86a487054291b36e6710f9109a3e3
- Actual implementation thread: /root/m2_qual_024_implementation
- Logical implementation role: IMPLEMENTER
- Requested implementation agent: luna-worker
- Configured implementation model/reasoning: gpt-5.6-luna / Max
- Actual runtime model: UNVERIFIED_RUNTIME_MODEL
- Model verification: CONFIG_VERIFIED; runtime identity unavailable

The single permitted material fresh-main docs-only correction merged through
PR #224 after the first Blocked publication candidate closed unmerged on its
first eligible CI failure. This current exact-two reconciliation records the
effective merge facts in the tracked Packet and Roadmap only.
The runner, Concurrent test, Harness Current-truth, observer, Worker,
package/lock files, historical Packets, and every other code path remain at
the fresh base and are not copied or published.

## Goal and context

The bounded implementation goal was to manually reconstruct the independently
reviewed frozen QUAL023 runner, Concurrent test, and Harness final-success
record contract on fresh main, prove all three candidate files byte-equal to
the fixed reference through direct silent comparisons, and run one bounded
focused/root/observer replay. The historical QUAL023 generated-transform
predicate RC=1 remains unclassified. This Work Item does not recreate,
diagnose, relabel, or rerun that predicate.

Static read-only inspection established that the frozen QUAL023 test differs
from frozen QUAL022 exactly by the three authorized corrections and that the
runner/Harness retain the reviewed seam. A separate diagnostic-only Work Item
would test a newly invented predicate rather than identify the discarded one,
so this successor used the already reviewed fixed bytes as the closed
equivalence boundary.

## Frozen implementation result and first-red boundary

The implementation epoch froze at the first protocol red. Pure Git identity,
scope, reference, diff-check, and three-path pre-edit equality predicates
passed: candidate base/HEAD was 8a9940220cd86a487054291b36e6710f9109a3e3,
the QUAL023 reference was
ecb702e11520259bce48b0868803dc85279262be, and the QUAL021 observer reference
was c0470aa7d1b210348f6b119a146bd13bc0bbb890.

Before the mandated first normal-permission Node 24 safety probe, an
exploratory default-sandbox command sequence invoked node --version (Node
22.15.1), fnm --version, corepack pnpm --version (11.17.0), and a Node
package-script read. This violated the required normal-permission-first and
sandbox-first-immediately-blocks contract. It is the first red; no
implementation gate may follow.

The immediately applicable read-only safety observation then ran under
normal permission with fnm exec --using=24.18.0 node. Its aggregate result
passed: Node 24.18.0, all eleven injection names unset, task-owned app,
Compose, run-unique Harness, and repository-local store aggregates zero or
absent, and bounded shared output safe (directory; one regular direct entry;
zero directories/other entries; within cap; .last-run.json regular). No raw
path, name, PID, value, or child output was retained.

The final read-only safety observation also ran under normal permission with
the same Node 24.18.0 boundary and passed with the same aggregate
zero/absent and shared-safe classifications. No cleanup or mutation followed.

Install, workspace, implementation transformation, all three comparisons,
implementation static, focused, root, observer, and direct Concurrent gates
were not invoked after the first red. Every such implementation gate count is
zero. The runner, Concurrent test, and Harness therefore remain byte-identical
to the fresh base.

## Required protocol and exact reconstruction boundary

The frozen protocol required pure Git identity/scope/reference checks, then
one normal-permission Node 24/injection/safety probe before any toolchain use.
It required a frozen install and workspace check, manual reconstruction of the
three implementation files, one targeted implementation-file Prettier write,
and exactly one silent cmp -s for each of runner, Concurrent test, and Harness.
Any first red stopped all later implementation work. No rerun, replacement,
cleanup, or shape-forcing edit was authorized.

The reviewed reconstruction would preserve:

- the runner constant exactly as
  Harness concurrent final coordinator=verified children=2 isolation=verified cleanup=verified
  followed by one LF;
- the narrow wrapper that awaits unchanged coordinator completion, writes that
  record exactly once only after final owned cleanup succeeds, and returns the
  states; rejection writes no success record and preserves failure propagation;
- exactly the two corrected tests: the owned-cleanup failed-unclassified
  rejection with zero writes, and success ordering
  states-ready -> final-cleanup -> write, with a direct literal LF assertion
  rather than a production-constant import; and
- the reviewed Harness one-record success and safe-disclosure contract.

The reconstruction, Prettier write, three comparisons, and all implementation
static/runtime gates did not occur because the protocol red froze the epoch.

## Historical references

The sole implementation reconstruction reference was the read-only QUAL023
planning worktree at /private/tmp/contentos-m2-qual-023-plan-wt, branch
codex/m2-qual-023-corrected-success-record-plan, HEAD
ecb702e11520259bce48b0868803dc85279262be. Its reviewed physical shape was
exact-five: runner, existing Concurrent test, Harness Current-truth, Packet,
and Roadmap, with no unexpected path and clean diff-check.

The separate execution-only observer reference was the read-only QUAL021
planning worktree at /private/tmp/contentos-m2-qual-021-plan-wt, branch
codex/m2-qual-021-concurrent-final-status-replay-plan, HEAD
c0470aa7d1b210348f6b119a146bd13bc0bbb890. Its reviewed physical shape was
exact-four: Roadmap plus the QUAL021 Packet, observer, and test. Only its
absolute observer script would have been allowed to execute from a candidate
worktree after identity and scope verification; it was not executed here.

Before implementation edits, pure Git proved the fresh-base versions of the
three implementation paths equal the QUAL023 reference versions. The fresh
candidate also had no dirty runner, test, Harness, observer, Worker,
package/lock, or old-Packet path.

## Scope

In scope for the historical implementation were the reviewed runner/test/
Harness reconstruction, three fixed silent byte comparisons, one focused
test-file gate, one root gate, and one observer-owned existing Concurrent
gate, followed by exact-five evidence review. In scope for this fresh
publication candidate are only the Blocked Packet and Roadmap.

Out of scope are any change to QUAL022/QUAL023 historical Packets, observer or
test, Worker, package scripts, dependency/lockfile, CI, Compose, Schema,
migration, product code, API, Current-truth, README, AGENTS, Acceptance
Record, Decision Register, or any other path. Coordinator state, child count,
isolation, timeout, retry, signal, termination, failure diagnostic,
ownership, cleanup, generated expected bytes, source-transform predicates,
hashes, manifests, raw diffs, logs, artifacts, direct Concurrent runs,
standalone Integration/Browser/Worker runs, root-cause, repair, permanent
non-recurrence, Issue transitions, M2 completion, and M3 start are not
claimed or authorized.

## Historical correction publication boundary

The merged material correction was exactly:

1. this new M2-QUAL-024 Packet; and
2. docs/implementation/roadmap.md.

Runner, Concurrent test, Harness Current-truth, observer, Worker, package,
lockfile, and every historical Packet remain zero diff. Implementers and
reviewers have no stage, commit, push, PR, merge, Issue, GitHub, runtime,
process, Docker, test, or observer authority beyond the bounded docs
toolchain; only the Orchestrator may publish after the required gates. In the
historical first candidate, one unneeded normal-permission host-shim inspection
nevertheless invoked
`/usr/bin/env node --version` and returned sanitized version `22.15.1` before
the authorized Node 24 docs checks. It was a non-evidentiary operator deviation:
read-only, no mutation, no test/Docker/observer/package execution, and no
validation result. It did not consume, satisfy, replace, or waive the required
Node 24 Prettier/repository gates and does not change the frozen implementation
counts or Blocked status.

At historical candidate creation, its own two independent reviews, targeted
Packet/Roadmap static and scope checks, first eligible final-head quality/
Integration/Browser CI, and Orchestrator squash merge were pending. The
permitted local docs/static closeout below records targeted checks as local
PASS only; it cannot substitute for the two reviews, CI, or Orchestrator
publication.
Authority is publication-only: even after those gates, this candidate cannot
publish runner/test/Harness code, close an Issue, claim repair or
non-recurrence, complete M2, or start M3.

## Frozen exact-two evidence reviews

The corrected frozen physical exact-two Packet/Roadmap evidence received
independent PASS/no-findings reviews:

- /root/m2_qual_014_dor_correctness, role INDEPENDENT_REVIEWER, requested
  gpt-5.6-sol High, actual UNVERIFIED_RUNTIME_MODEL;
- /root/m2_qual_012_browser_setup_diagnosis, role INDEPENDENT_REVIEWER,
  requested gpt-5.6-sol High, actual UNVERIFIED_RUNTIME_MODEL.

Both reviewed base 8a9940220cd86a487054291b36e6710f9109a3e3 plus the corrected
frozen exact-two Packet/Roadmap and Completion Report. All findings are
closed. Their authority is limited to a separate fresh-main exact-two
Blocked Packet/Roadmap publication chain; it does not authorize runner/test/
Harness publication, implementation success, Issue closure, root-cause or
repair claims, M2 completion, or M3 start.

## Historical first exact-two publication reviews

The historical first candidate received two independent PASS/no-findings
publication reviews:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested
  `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`;
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`,
  requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base `8a9940220cd86a487054291b36e6710f9109a3e3` plus the
historical first fresh exact-two Packet/Roadmap, including the disclosed
non-evidentiary host-shim deviation, with no remaining findings. Their
authority is exact-two Blocked publication review only. Targeted static/scope
also passed. That authority was consumed by PR #223 and did not transfer to
this correction.

## First publication-gate failure and single material correction

PR #223, `docs: record blocked M2-QUAL-024 replay`, used exact reviewed head
`5f19f79109bbb282cabaa1186abe8dd149face3a`. Its first eligible CI run
`31339229858` completed with required quality failure after `1m16`: the
existing `packages/testing/src/harness-cleanup.test.ts` live-lock case timed
out waiting for the shared smoke application-build lock, leaving `1/578`
tests failed. Integration passed after `3m08` and Browser passed after `2m34`.
This is a bounded non-target publication-gate classification only; it is not
a QUAL024 root-cause, repair, or non-recurrence conclusion.

PR #223 was closed unmerged. It received no unchanged rerun, replacement run,
or new head. The local Blocked result and Issue states remain unchanged. This
current exact-two Packet/Roadmap is the one contract-permitted material
evidence correction. Its targeted static/scope checks and both new independent
reviews passed as recorded below. It must receive its first eligible final-head
quality/Integration/Browser CI and an Orchestrator squash merge. A red or
missing result on that
correction CI closes the PR unmerged with no unchanged rerun or replacement;
recovery then requires a separately numbered successor.

## Material-correction publication reviews

The current correction received two independent PASS/no-findings reviews:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested
  `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`;
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`,
  requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base/HEAD `8a9940220cd86a487054291b36e6710f9109a3e3`
plus this current corrected exact-two Packet/Roadmap, including PR #223 and CI
run `31339229858` evidence, with no findings. Their authority is limited to
this correction's exact-two Blocked-publication chain. They do not authorize
code/current-truth publication, Issue transition, root-cause, repair,
non-recurrence, M2 completion, or M3 start.

## Effective correction merge and current reconciliation

PR #224, `docs: record M2-QUAL-024 publication gate failure`, published the
reviewed exact-two correction from final head
`2cd704d4a4c760e340b7294c533f63d56f5d3901`. Its first eligible CI run
`31339957320` passed quality after `2m09`, Integration after `3m04`, and
Browser after `2m15`. The Orchestrator squash-merged it as
`dac54d2a3efe70f7f2bb498372958cb40aa667b6` at
`2026-08-09T22:43:34Z`. The effective result remains exactly
`Blocked — Direct-Reference Concurrent Final Success Emission Not Verified`;
Issue #222 and linked Open Issues remain Open, and #212/#210 remain Closed.

The current reconciliation starts from that squash commit and changes only
the now-tracked Packet and Roadmap. It does not rerun implementation or
runtime gates, publish code/Current-truth, reverse the terminal result, or
mutate any Issue. Its targeted Packet/Roadmap Prettier, `repository:check`,
`git diff --check`, tracked-exact-two scope, forbidden-path, and
no-unexpected-artifact checks passed. It requires its own two independent
reviews, first eligible final-head quality/Integration/Browser CI, and
Orchestrator squash merge. The reviews passed as recorded below.

## Merge-status reconciliation reviews

The current tracked exact-two reconciliation received two independent
PASS/no-findings reviews:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested
  `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`;
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`,
  requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base/HEAD `dac54d2a3efe70f7f2bb498372958cb40aa667b6`
plus the current corrected tracked-exact-two Packet/Roadmap and returned PASS
with no findings. Their authority is reconciliation-publication review only;
it cannot reverse the effective Blocked result, mutate Issues, publish code/
Current-truth, claim cause/repair/non-recurrence, complete M2, or start M3.

## Required implementation counts

The frozen first-red implementation counts are all zero:

- install: 0
- workspace: 0
- implementation transformation: 0
- runner comparison: 0
- Concurrent test comparison: 0
- Harness comparison: 0
- implementation static: 0
- focused Concurrent test: 0
- root check: 0
- observer-owned Concurrent: 0
- direct Concurrent: 0

No focused result, root result, observer result, direct Concurrent result,
quality result, Integration result, or Browser result exists for this frozen
epoch.

## Permission, injection, and safety boundary

The eleven injection names were all unset in both retained safety
observations:

- CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE
- CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE
- CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY
- CONTENTOS_SMOKE_INJECT_FAILURE
- CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE
- CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE
- CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE
- CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE
- CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE
- CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE
- CONTENTOS_BROWSER_INJECT_FAILURE

Task-owned aggregates covered candidate app processes, exact smoke Compose
projects/containers, run-unique contentos-smoke-harness roots, and the
repository-local .pnpm-store. Entry and post-gate deltas were zero/absent.
The shared tmpdir/contentos-smoke-harness/playwright-output inspection was
metadata-only, no-follow, capped at 64 entries. Accepted direct entries were
regular files or directories only, and .last-run.json was regular. No path,
name, PID, process argument, credential, environment value, or child output
was retained or published.

## Docs and operator scope-correction chronology

Planning-only evidence was completed before the implementation epoch. With no
installed dependencies in the fresh planning worktree, the first
normal-permission targeted Packet/Roadmap Prettier check materialized the
existing locked dependencies and returned red only for the new Packet. An
authorized planning-docs write corrected that formatting. The final planning
targeted Prettier, repository:check, git diff --check, exact-two, forbidden-
path, and no-artifact checks passed. These calls were planning-only and
consumed no implementation gate, transformation, probe, or slot.

In the frozen implementation closeout, targeted Packet/Roadmap Prettier
--check returned RC=0 with no formatter write; repository:check returned
RC=0; and git diff --check returned RC=0. The first exact-scope shell
predicate was an operator error (RC=1): its loop variable shadowed zsh PATH,
and its literal predicate did not count the expected names. No repository
check was red. One corrected read-only predicate then passed with exactly one
tracked Roadmap modification, one untracked Packet, forbidden-path PASS, and
no-artifact PASS. This operator correction was not a repository/runtime gate
rerun or evidence laundering.

## Historical static closeout for the first fresh candidate

Only the following local checks are authorized and recorded for this fresh
candidate:

- targeted Packet/Roadmap Prettier check, with any red/write chronology stated
  below;
- repository:check;
- git diff --check;
- physical exact-two scope;
- forbidden-path and no-unexpected-artifact predicates.

No runtime, process enumeration, Docker, Node test, integration, browser,
observer, direct Concurrent, cleanup, or package-install command is part of
the authorized closeout. The host-shim version probe disclosed above occurred
outside this allowlist and is retained only as a non-evidentiary procedural
deviation; it supplies no gate evidence or authority.

Fresh-candidate closeout chronology:

- Before the targeted checks, the normal-permission host-shim inspection
  unnecessarily invoked `/usr/bin/env node --version` and returned sanitized
  version `22.15.1`. It caused no mutation and neither consumed nor replaced
  any Node 24 publication gate.
- The first targeted Packet/Roadmap Prettier check ran with normal process
  permission and returned RC=1 for this Packet only; Roadmap was clean.
- The authorized targeted Packet/Roadmap Prettier write then changed only this
  Packet; Roadmap was unchanged.
- The final targeted Packet/Roadmap Prettier check under fnm exec using Node
  24.18.0 returned RC=0.
- repository:check under fnm exec using Node 24.18.0 and pnpm 11.17.0 returned
  RC=0.
- git diff --check returned RC=0; exact-two scope is one modified Roadmap plus
  one untracked Packet; forbidden-path and no-artifact predicates passed with
  no other tracked or untracked path.

The repository check materialized only ignored dependency directories required
by the local command; they are not part of the candidate scope or evidence.

These local checks do not change the frozen implementation counts above.

## Static closeout for the material correction

The correction used Node 24.18.0 and pnpm 11.17.0 for the bounded docs
toolchain. Its first targeted Packet/Roadmap Prettier check materialized the
existing locked dependencies and returned red only for this Packet. The
authorized docs-only Prettier write changed only the Packet; Roadmap was
unchanged. The final targeted Packet/Roadmap Prettier check and
`repository:check` then passed. `git diff --check`, physical exact-two scope
(`M Roadmap + ?? Packet`), forbidden-path zero-diff, and no-unexpected-artifact
predicates also passed. Ignored dependency directories are not candidate scope
or evidence. No runtime, test, process-enumeration, Docker, observer, cleanup,
or Issue command ran for this correction.

## Terminal predicate and acceptance

The frozen terminal result is exactly Blocked — Direct-Reference Concurrent
Final Success Emission Not Verified. It is not In Review or Completed because
the mandated normal-permission-first protocol was violated before the first
Node 24 safety probe. The pure-Git predicates, two safety observations, and
docs-only chronology pass as bounded evidence; the three comparisons and all
implementation runtime gates were not run and cannot establish success.

The material correction's two independent reviews, targeted static/scope,
first eligible three-job CI, and Orchestrator merge all passed. The Blocked
status and Issue #222 Open state are effective. This reconciliation's targeted
static/tracked-exact-two scope and its own reviews passed; it is non-effective
until its first eligible final-head three-job CI and Orchestrator merge pass.

## Frozen implementation completion report

### Summary

The implementation candidate is frozen as Blocked — Direct-Reference
Concurrent Final Success Emission Not Verified at the first protocol red.
The required first governed Node 24 safety call was preceded by default-
sandbox exploratory Node 22/fnm/Corepack/package-script invocations, so no
implementation outcome is claimed.

### Files

The fresh publication candidate changes only this Packet and Roadmap. The
historical runner, Concurrent test, Harness Current-truth, observer, package
scripts, dependency files, Worker, and every forbidden path remain unchanged.

### Commands and tests

- Pure Git identity, dirty-shape, reference-scope, git diff --check, and
  fresh-base/QUAL023 three-path equality checks: PASS.
- Exploratory default-sandbox node --version (22.15.1), fnm --version,
  corepack pnpm --version (11.17.0), and package-script read before the
  mandated probe: protocol red.
- One immediate normal-permission read-only Node 24 safety observation: PASS
  with Node 24.18.0, eleven injections unset, zero/absent task-owned
  aggregates, and safe bounded shared-output classifications.
- One final normal-permission read-only Node 24 safety observation: PASS with
  the same aggregate classifications.
- Frozen implementation install, workspace, transformation, comparisons,
  static, focused, root, observer, and direct Concurrent counts: 0.

### Acceptance criteria

Pure-Git predicates, both retained safety observations, and the bounded
docs/operator chronology pass. The three direct comparisons and all
implementation static/runtime gates were not run and therefore cannot
establish success. The exact terminal result is the Blocked status above; no
rerun, replacement, cleanup, repair, or root-cause claim occurred.

### Security impact

No product, API, Schema, migration, dependency, authentication,
authorization, configuration, or security-boundary change was made. Safety
evidence retained only aggregate zero/absent and shared-output
type/count classifications; all eleven injection names were unset. No
secret, path, PID, process argument, credential, or child output was retained.

### Known limitations and incomplete items

The implementation bytes were not reconstructed or compared, and no focused,
root, observer, or direct Concurrent result exists. The historical QUAL023
transform mismatch remains unclassified and was not recreated or relabeled.
Root cause, permanent non-recurrence, Issue transition, M2 completion, and M3
start are not claimed.

### Documentation updates

This Packet records the frozen first-red evidence, both safety observations,
implementation gate counts of zero, and the docs/operator scope correction
chronology. Roadmap status is synchronized to the same exact Blocked
classification. No Harness Current-truth or code documentation was changed.

### Possible new DEC

None. This is a protocol-blocked bounded quality replay with no accepted
behavior or architecture change.

### Authority and Git status

The frozen evidence and its reviews authorized only the historical exact-two
Blocked publication chain. PR #223 closed unmerged after its first eligible
quality failure; PR #224 then published the one permitted material correction
after its reviews, static/scope, and first eligible three-job CI passed. No
Issue was mutated. The current reconciliation has no code/runtime, cleanup,
Issue, or direct-state authority. Its static/tracked-exact-two scope and own
reviews passed; only first eligible three-job CI and Orchestrator merge remain
pending.
