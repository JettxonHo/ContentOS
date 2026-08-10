# M2-QUAL-030 — Import-Safe Harness Probe Typecheck Correction and Final Phase-1 Replay

**Status:** Blocked — Harness Probe Attribution Not Verified

## Correction candidate identity

- Task ID: `M2-QUAL-030`; milestone M2 — Source and Workflow Foundation.
- Issue #241 remains Open and is linked to #238, #235, #232, and #229.
- Correction worktree: `/private/tmp/contentos-m2-qual-030-blocked-correction-wt`.
- Correction branch: `codex/m2-qual-030-blocked-status-correction`.
- Correction base/HEAD: `69f6d287828bf57f11a02732579feebbde50bdc4` (clean at start).
- Candidate shape: one permitted material fresh-main exact-two documentation
  correction — this Packet plus `docs/implementation/roadmap.md`; observer,
  test, and all code remain zero diff and unpublished.
- Logical role: `IMPLEMENTER`; requested agent `luna-worker`; configured
  `gpt-5.6-luna` Max; actual runtime model `UNVERIFIED_RUNTIME_MODEL`.
- Contract shape remains planning exact two / frozen local evidence exact four /
  terminal publication exact two.

This is the only authorized material fresh-main evidence correction after the
previous exact-two publication attempt. It does not copy or cherry-pick the
observer/test, and it does not rerun implementation or runtime commands.

## Prior Blocked publication and correction boundary

The prior exact-two candidate was published as PR #242, title `docs: record
blocked M2-QUAL-030 replay`, from base `69f6d287828bf57f11a02732579feebbde50bdc4`
to head `673bc43…`, with exactly Packet + Roadmap. PR #242 is **CLOSED and
unmerged**. Its first eligible CI run `31375793099` passed quality (`2m16`) and
Browser (`2m24`) but failed Integration (`2m58`) at the Integration smoke
harness step. No rerun, replacement, or new head followed; no cause is
inferred from that failure. The PR closure is not a successful publication or
merge and does not change the Blocked terminal.

This worktree records the one permitted material docs-only correction after
that red. Its targeted documentation/static checks are PASS. Fresh exact-two
publication reviews are also PASS/no findings; only first eligible
quality/Integration/Browser CI and Orchestrator merge remain pending. If this
correction's first eligible CI is red or missing, it closes unmerged with no
unchanged rerun or replacement and M2-QUAL-031 owns the next work; no further
material correction is authorized here.

## Frozen QUAL030 evidence

QUAL029 is effective Blocked after PR #239 and reconciliation PR #240. Its two
local validation gaps were closed without observer behavior change: two initial
silent comparisons returned RC0/no output, and the existing preflight-unexpected
fixture retained the authorized exit-setter counter, increment, and `toBe(1)`
assertion. The reconstructed observer still has one non-semantic trailing blank
line relative to the QUAL029 reference; that equivalence gap is unrepaired,
unrerun, and unpublished. The test delta is exactly one line immediately before
the query-suffixed import:

```ts
// @ts-expect-error -- Vitest intentionally resolves this query-suffixed fresh import at runtime.
```

The frozen implementation handoff to `/root/m2_qual_030_planning` used role
`IMPLEMENTER`, requested `luna-worker`, configured `gpt-5.6-luna` Max, and actual
`UNVERIFIED_RUNTIME_MODEL`. Exactly two baseline `apply_patch` reconstructions
and two silent RC0 comparisons preceded that one comment. Node 24 preflight
emitted `Harness harness-probe preflight=verified`; pnpm `11.17.0`, frozen
install, and workspace check passed once. Targeted code Prettier then returned
nonzero on the frozen observer. First-red rules stopped the sequence there:
repository/diff/exact-four checks in the failed compound, named/focused/root
gates, and observer slots were not run and remain unearned/count `0`. No rerun,
replacement, diagnosis, cleanup, code-format write, or extra probe followed.

The permitted post-red closeout synchronized Packet/Roadmap evidence only:
docs-only Prettier write/check reported files unchanged,
`repository:check` passed, `git diff --check` passed, and the read-only
`QUAL030_BLOCKED_SCOPE verified` exact-four predicate passed. Those closeout
facts are separate from the failed compound's unearned repository/diff/exact4,
named/focused/root, and slot gates.

## Proportionality, files, and boundary review

The correction is limited to documenting the closed-unmerged PR242 result and
rebuilding the exact-two terminal record from the clean `69f6…` base. No hash or
SHA mechanism, new fixture/probe/assertion, raw transcript, residue inspection,
lsof/ps, cleanup, diagnosis, matrix expansion, Docker, Integration, Browser,
Concurrent, Worker, Fetcher, Renderer, deployment, Current-truth, API, Schema,
migration, CI, Acceptance Record, DEC, AGENTS, README, product, security-policy,
Issue, milestone, Git, or GitHub mutation is authorized.

Relevant references are `AGENTS.md`, the Work Item template, Agent
Collaboration Workflow, Test Strategy, Release Gates, Roadmap, and the frozen
QUAL030 Packet plus QUAL029 observer/test reference. No Accepted DEC or
Blocking Design Question applies. There is no product, persistence,
compatibility, migration, observability, security, credential, or dependency
contract change; no generated or code artifact is publishable. Any pnpm
dependency materialization under ignored `node_modules` is tooling side effect
only.

The correction publication exact two is:

- `docs/implementation/work-packets/m2-qual-030-import-safe-harness-probe-typecheck-correction-final-phase1-replay.md`
- `docs/implementation/roadmap.md`

No observer/test/code path is copied into this worktree. Implementers and
reviewers cannot mutate Git/GitHub/Issue state; only the Orchestrator can publish,
merge, or reconcile lifecycle labels.

## Publication reviews and pending gates

Frozen exact-four reviews PASS with no remaining docs/evidence findings against
base/HEAD `69f6d287828bf57f11a02732579feebbde50bdc4`, the corrected physical
exact-four evidence, and its Completion Report:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.

The prior exact-two publication reviews also PASS/no findings against the
corrected exact-two and frozen exact-four, with authority limited to Blocked
publication. `/root/m2_qual_014_dor_correctness` and
`/root/m2_qual_012_browser_setup_diagnosis` both held role
`INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
`UNVERIFIED_RUNTIME_MODEL`, and reviewed base/HEAD
`69f6d287828bf57f11a02732579feebbde50bdc4` plus the corrected exact-two,
frozen exact-four, Completion Report, and PR242 history. They do not authorize
a merge after PR242's red. Fresh correction reviews by
`/root/m2_qual_014_dor_correctness` and
`/root/m2_qual_012_browser_setup_diagnosis` PASS/no findings, with the role,
model, base/evidence set, and authority stated above. Their authority is
limited to correction exact-two publication. Only first eligible
quality/Integration/Browser CI and Orchestrator merge remain pending.

## Required candidate checks and recovery

Only these commands are authorized in this correction worktree: targeted
Packet/Roadmap Prettier check, `repository:check`, `git diff --check`, and a
read-only exact-two scope predicate. No runtime, focused, root, observer, test,
install, GitHub, Issue, or implementation command runs here. The checks must
record any ignored dependency materialization and any docs-only formatting fact
without converting it into runtime evidence.

The candidate terminal remains **Blocked — Harness Probe Attribution Not
Verified**. The trailing-blank observer gap remains unrepaired, unrerun, and
unpublished; no filesystem cause, repair, non-recurrence, M2 completion, or M3
start is claimed. PR242's Integration red is a closed-unmerged publication
boundary, not a diagnostic finding. A red or missing first eligible CI for this
correction closes unmerged with no rerun/replacement/new head and transfers the
next bounded work to M2-QUAL-031.

Issue lifecycle remains unchanged: a merged Blocked record closes none; a
Completed terminal would close #241, #238, #235, and #232 while #229 stays Open.
M2-GOV-006 remains Blocked, M2 remains In Progress, M3 remains Not Started,
and no DEC is opened.

## Acceptance criteria

1. The correction worktree starts clean at base/HEAD `69f6…` and ends with
   exactly Packet + Roadmap; observer/test/code are zero diff.
2. PR242 is recorded accurately as title/base/head exact-two, CLOSED unmerged,
   quality/Browser success, Integration failure at the named smoke step, with
   no rerun/replacement/new head and no inferred cause.
3. Frozen first-red chronology, two RC0 silent comparisons, sole test comment,
   counter preservation, trailing-blank gap, post-red closeout, and dual frozen
   review PASS are preserved without claiming unearned runtime gates.
4. Fresh correction reviews and docs/static scope PASS distinctly from PR242;
   only first eligible three-job CI and Orchestrator merge are pending, and a
   new red/missing result transfers to M2-QUAL-031.
5. Issue, M2-GOV-006, M2, M3, DEC, security, code, runtime, and Git/GitHub
   boundaries remain unchanged.

## Candidate completion report

- Summary: one material fresh-main exact-two docs-only correction candidate for
  the closed-unmerged PR242 red; terminal remains Blocked.
- Files: only this Packet and `docs/implementation/roadmap.md` in the named
  correction worktree/branch/base; no code publication or commit.
- Commands: the initial targeted docs Prettier check returned RC1 on this
  Packet and materialized 571 locked packages under ignored `node_modules`;
  one permitted docs-only Prettier write changed the Packet and left Roadmap
  unchanged. The final docs Prettier check returned RC0, `repository:check`
  returned RC0, `git diff --check` returned RC0, and the read-only scope
  predicate returned `QUAL030_CORRECTION_EXACT_TWO verified` RC0. No formatter
  write touched code, and no tracked/forbidden/unexpected path was created.
- Tests/runtime: none run in this correction worktree. Frozen first-red and
  post-red evidence above remains the only implementation/runtime record.
- Security/migration/compatibility/DEC: none; no secrets or product behavior.
- Limitations: observer/test unpublished; trailing-blank gap and all unearned
  implementation gates remain as stated; PR242 is closed unmerged.
- Pending: first eligible quality/Integration/Browser CI and Orchestrator merge;
  fresh dual exact-two reviews and final docs Prettier/repository/diff/exact-two
  checks already PASS. A new red/missing CI requires M2-QUAL-031.
- Lifecycle: Issues #241/#238/#235/#232/#229 Open; M2-GOV-006 Blocked; M2 In
  Progress; M3 Not Started.
- Role/model: `IMPLEMENTER`; requested `luna-worker`; configured
  `gpt-5.6-luna` Max; actual `UNVERIFIED_RUNTIME_MODEL`.
- Git: no stage/commit/push/PR/merge/Issue mutation authorized.
