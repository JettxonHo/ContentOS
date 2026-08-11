# M2-QUAL-032 — Zsh-Safe Scope Predicate Variable Correction and Final Phase-1 Replay

**Status:** In Review — Harness Probe Reproduced and Safely Classified (fresh
exact2 publication candidate; dual reviews, first eligible CI, and merge
pending)

## Candidate identity

- Task ID: `M2-QUAL-032`; this is the separate fresh-main exact2 publication
  candidate after the reviewed local implementation evidence.
- Candidate worktree: `/private/tmp/contentos-m2-qual-032-reproduced-status-wt`;
  branch: `codex/m2-qual-032-reproduced-status-sync`; base/HEAD:
  `9188f9bca2bdb37cd964590ec8642d275867706b`.
- Candidate shape is exactly two new documents: this Packet and
  `docs/implementation/roadmap.md`; observer/test/code are zero diff and were
  not copied, reconstructed, or published here.
- Issue #248 is Open and links #245/#241/#238/#235/#232/#229. This candidate
  performs no Issue, Git, GitHub, commit, or runtime mutation. No DEC or BQ is
  opened.

## Frozen implementation evidence

- The frozen implementation worktree is
  `/private/tmp/contentos-m2-qual-032-plan-wt`, branch
  `codex/m2-qual-032-zsh-safe-scope-plan`, base/HEAD
  `9188f9bca2bdb37cd964590ec8642d275867706b`; its physical local shape was
  exact4 (observer, test, Packet, Roadmap).
- The sole correction was `path` → `changed_path` in the zsh-safe scope
  predicate. Observer/test behavior and bytes remain unpublished.
- Required implementation gates passed once in order: normal Node24 preflight;
  pnpm 11.17.0/version, frozen install, workspace; code Prettier,
  `repository:check`, diff, and corrected scope; named `1 file / 1 passed /
12 skipped`; focused `1 file / 13 tests`; root `55 files / 591 tests` plus
  five builds.
- After root green, slot 1 returned the valid sanitized RC20:
  `Harness harness-probe predicate=red reason=over-cap entries=over-cap
failures=one`. This is **Reproduced and Safely Classified**. Slots 2/3 were
  not consumed; no rerun, replacement, diagnostic, or cleanup occurred.
- Frozen exact4 docs chronology records an initial Packet/Roadmap Prettier RC1,
  one Orchestrator-authorized proportional docs-only `apply_patch` correction,
  then Prettier/repository/diff/exact4 PASS. The correction was accepted as
  non-laundering evidence finalization; no runtime rerun occurred.

## Frozen review metadata and authority

- `/root/m2_qual_014_dor_correctness` and
  `/root/m2_qual_012_browser_setup_diagnosis`, both role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`, reviewed base/HEAD `9188f9b...`, the corrected
  physical exact4, and its Completion Report. Both returned PASS/no
  findings/all docs findings closed.
- Their authority is limited to this future separate fresh-main exact2
  publication only. It does not authorize observer/test publication, runtime
  rerun, Git/GitHub/Issue mutation, M2 completion, M3 entry, or a new exit
  review.

## Fresh exact2 publication review

- `/root/m2_qual_014_dor_correctness` and
  `/root/m2_qual_012_browser_setup_diagnosis`, both role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`, reviewed base/HEAD `9188f9b...`, the corrected
  current exact2 against the frozen exact4 and Completion Report, and live Issue
  #248 parity. Both returned PASS/no findings.
- The proportional formatting chronology was accepted as non-laundering.
  Authority is limited to this exact2 publication only. Pending are only the
  first eligible exact-head quality/Integration/Browser CI and Orchestrator
  merge; a red or missing result transfers recovery to M2-QUAL-033. No
  observer/test, Git/GitHub, Issue, M2, or M3 action is authorized.

## Dependency and lifecycle boundaries

- QUAL031 remains effective **Blocked — Harness Probe Attribution Not
  Verified** after PR #247 (`docs: reconcile M2-QUAL-031 merge status`), base
  `3daaa50e...`, head `4cf33d31...`, run `31385389148` all-success, and
  squash/current main `9188f9b...` at `2026-08-10T11:55:32Z`. Its observer/test
  and attribution gap remain unpublished.
- A successful QUAL032 publication proves only bounded Phase-1 attribution. It
  hands off the minimal Worker publication/revalidation successor for
  QUAL003/#147; it cannot enter an M2 exit review until QUAL003 is Completed
  and remaining blockers are cleared. M2-GOV-006 remains Blocked, M2 remains In
  Progress, and M3 remains Not Started.
- Completed closes #248 plus #245/#241/#238/#235/#232; #229 and Worker chain
  #226/#222/#218/#215/#208/#204/#196/#147 remain Open. Blocked closes none.
  A fresh exact2 publication red/missing result closes unmerged without
  unchanged rerun/replacement and transfers bounded recovery to M2-QUAL-033.

## Candidate scope and acceptance

1. Only this Packet and the Roadmap row are changed; observer/test/code remain
   zero diff and unpublished.
2. Candidate formatting followed Prettier `RC1` → one manual docs-only
   `apply_patch` → Prettier `RC1` → one formatter write → final Prettier PASS;
   `repository:check`, `git diff --check`, and exact-two scope then each ran
   once, with no implementation or runtime command.
3. The candidate records exact2 static/scope PASS before fresh exact2 reviews,
   first eligible quality/Integration/Browser CI, and Orchestrator merge.
4. No hash/SHA, extra probe/fixture/case, shell/PATH workaround, matrix,
   cleanup, or rubric expansion is introduced.

## Fresh worktree materialization

The candidate is fresh-main and documentation-only. Targeted tooling may
materialize ignored dependencies such as `node_modules`; any such dependency
materialization is outside the exact2 tracked scope and is not evidence of code
or runtime execution.

## Candidate formatting chronology

The initial targeted Packet/Roadmap Prettier check returned `RC1` after
materializing 571 ignored dependencies. One manual docs-only `apply_patch`
correction was followed by a second targeted Prettier `RC1`; one authorized
standard Packet formatter write then produced the final docs Prettier,
`repository:check`, `git diff --check`, and
`QUAL032_REPRODUCED_STATUS_EXACT_TWO verified` PASS. This was a proportional
formatting correction only: not a runtime/CI red, rerun, waiver, or evidence
laundering, and it changed no evidence facts or code.

## Candidate completion report

- Summary: fresh exact2 candidate preserves the valid frozen RC20
  Reproduced-and-Safely-Classified record without publishing observer/test/code.
- Files: this Packet and the Roadmap row only; expected exact2 scope is those
  two paths, with no observer/test/code path.
- Candidate commands: after the formatting chronology above, final targeted
  Packet/Roadmap Prettier, `repository:check`, `git diff --check`, and
  read-only exact2 scope each passed once. No runtime/test/toolchain/CI command
  is authorized here.
- Pending: the first eligible final-head quality/Integration/Browser CI and
  Orchestrator merge. Until those gates pass, status remains In Review and is
  non-effective.
- Security/migration/compatibility/DEC: none. No Issue, Git, GitHub, commit,
  observer/test publication, M2, M3, or exit-review action occurred.
- Documentation update: this candidate Packet and the Roadmap chronology
  preserve the frozen proportional docs sequence and review authority without
  laundering the RC20 runtime evidence.
