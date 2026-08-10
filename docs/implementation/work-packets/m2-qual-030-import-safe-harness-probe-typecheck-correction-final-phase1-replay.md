# M2-QUAL-030 — Import-Safe Harness Probe Typecheck Correction and Final Phase-1 Replay

**Status:** Blocked — Harness Probe Attribution Not Verified

## Candidate identity and publication boundary

- Task ID: `M2-QUAL-030`
- Milestone: M2 — Source and Workflow Foundation
- Work Item type: bounded quality diagnostic replay
- Issue: #241 Open, linked to #238, #235, #232, and #229
- Dependency: QUAL029 is effective Blocked after its reconciled exact-two publication; current main is `69f6d287828bf57f11a02732579feebbde50bdc4`.
- Candidate worktree: `/private/tmp/contentos-m2-qual-030-blocked-status-wt`
- Candidate branch: `codex/m2-qual-030-blocked-status-sync`
- Candidate base/HEAD: `69f6d287828bf57f11a02732579feebbde50bdc4`
- Candidate publication shape: exact two documentation paths only — this Packet and `docs/implementation/roadmap.md`; observer, test, and all other code are zero diff.
- Contract shape: planning exact two / local evidence maximum exact four / terminal publication exact two.
- Logical implementation role: `IMPLEMENTER`; requested agent `luna-worker`; configured `gpt-5.6-luna` Max; actual runtime model `UNVERIFIED_RUNTIME_MODEL`.
- Frozen implementation worktree: `/private/tmp/contentos-m2-qual-030-plan-wt`, branch `codex/m2-qual-030-import-safe-plan`, base/HEAD `69f6d287828bf57f11a02732579feebbde50bdc4`.
- Frozen QUAL029 source: `/private/tmp/contentos-m2-qual-029-plan-wt`, branch `codex/m2-qual-029-minimal-harness-probe-plan`, base/HEAD `0c94e1b8f34185ff26d92ec9d1a6f235eb7a54c2`.

This fresh-main candidate records only the Blocked terminal documentation. It
does not publish the observer/test reconstruction, claim a runtime result, or
change current-truth code.

## Goal and context

QUAL029 closed two local validation gaps but its root gate stopped at the sole
TypeScript error for the existing Vitest query-suffixed fresh import. QUAL030
authorizes exactly one adjacent typecheck comment, then the existing fixed
Phase-1 observer with at most three real slots. A valid RC20 would be safely
classified as Reproduced; three valid RC0 records would be Not Reproduced. The
bounded replay cannot establish filesystem causality, repair, non-recurrence,
Worker or Concurrent readiness, M2 completion, or M3 entry.

The frozen implementation reconstructed the QUAL029 observer and test through
exactly two baseline `apply_patch` writes. Two silent `git diff --no-index
--quiet` comparisons returned RC0 with no output. Final review found one
non-semantic trailing blank-line difference in the observer relative to the
QUAL029 reference; that equivalence gap remains unrepaired, unrerun, and
unpublished. The test delta is only this line immediately before the frozen
query-suffixed import:

```ts
// @ts-expect-error -- Vitest intentionally resolves this query-suffixed fresh import at runtime.
```

QUAL029's exit-assignment counter, increment, and `toBe(1)` assertion remain
preserved. No observer behavior changed.

## Scope and proportionality

In scope is the one-line typecheck correction, the fixed existing preflight,
toolchain, static gates, named/focused tests, root gate, and up to three real
observer slots in the Ready Packet order, plus the exact-two Packet/Roadmap
publication record. Validation is proportional to the one TS2307 seam.

Out of scope: observer behavior or formatting repair; any other test, fixture,
probe, assertion, counter, adapter, package, lockfile, dependency, runtime,
cleanup, retry, timeout, or matrix change; hashes/SHA-256; raw or residue
inspection; lsof/ps; Docker, Integration, Browser, Concurrent, Worker,
Fetcher, Renderer, deployment, or process diagnosis; Current-truth/API/
Schema/migration/CI/Acceptance/DEC/AGENTS/README edits; Issue, milestone,
Git, GitHub, commit, push, PR, merge, or status mutation by implementers or
reviewers.

## Relevant documents and boundary review

The governing references are `AGENTS.md`, the Work Item template, the Agent
Collaboration Workflow, the Test Strategy, Release Gates, the M2 Roadmap, and
the frozen QUAL029 Packet plus observer/test. No accepted DEC or Blocking Design
Question applies. There is no Domain, API, Schema, migration, compatibility,
queue, storage, provider, configuration, or deployment contract change.

Security impact is none: no user content, credentials, secrets, network input,
owner scope, object storage, process identity, or logging boundary changes. The
existing sanitized observer record remains the only runtime evidence contract;
no new metric, trace, audit sink, dependency, hash, or diagnostic artifact is
introduced.

## File boundary

The candidate has exactly these publication paths:

- `docs/implementation/work-packets/m2-qual-030-import-safe-harness-probe-typecheck-correction-final-phase1-replay.md`
- `docs/implementation/roadmap.md`

The frozen local maximum additionally contained the observer and test only as
unpublished implementation evidence. The candidate deliberately contains no
observer/test/code copy, fixture, generated file, or lockfile change. A pnpm
install may materialize ignored `node_modules`; such dependency materialization
is tooling side effect only and is not evidence or publication content.

## Exact correction contract and frozen evidence

The implementation handoff was explicit to `/root/m2_qual_030_planning` as
`IMPLEMENTER`, with the model identity above. Before any governed non-Git
command it performed two baseline file reconstructions and the two required
silent comparisons, both RC0/no output. It then inserted exactly one
`@ts-expect-error` comment before the existing query-suffixed import. The
observer's trailing-blank equivalence gap was discovered afterward and was not
repaired, rerun, or published. No code formatter write occurred.

The first governed Node 24 preflight ran once and emitted:

```text
Harness harness-probe preflight=verified
```

The one-time pnpm version was `11.17.0`; frozen install and workspace check
passed once. The one-time targeted code Prettier check returned nonzero on the
frozen observer. Ordinary first-red rules froze implementation evidence there:
repository/diff/exact-four checks in that failed compound, the named fixture,
full focused file, root check, observer slots, and later implementation gates
were not run and remain unearned, each with count `0`. No rerun, replacement,
diagnosis, cleanup, or code-format write followed.

Permitted post-red closeout then synchronized only Packet/Roadmap evidence.
The docs-only Prettier write/check reported both files unchanged;
`repository:check` passed; `git diff --check` passed; and the final read-only
exact-four scope predicate returned `QUAL030_BLOCKED_SCOPE verified`. These
closeout facts are distinct from the failed compound: its repository/diff/
exact-four, named/focused, root, and slot gates were not earned.

## Candidate rebuild and publication state

This fresh-main worktree was clean at candidate start. The Packet and Roadmap
were manually reconstructed with `apply_patch`; no observer, test, or code was
copied or cherry-picked. Candidate identity is therefore exact two docs,
observer/test/code zero diff, with static/scope verification limited to the
Packet/Roadmap paths. The candidate does not replay runtime evidence and does
not turn frozen local evidence into published implementation code.

Candidate publication reviews are now PASS/no findings; only the first
eligible quality/Integration/Browser three-job CI result and an Orchestrator
squash merge remain pending. Until all are complete, this Blocked record is a
publication candidate, not an effective merged-main status. A red or missing
first eligible CI result closes the publication unmerged; there is no unchanged
rerun or replacement head. At most one material fresh exact-two docs/evidence
correction may receive new reviews, static checks, and three-job CI; a further
red or missing result belongs to M2-QUAL-031.

Candidate docs-only verification then ran in this worktree: targeted Packet/
Roadmap Prettier check returned RC0 with both files matching. Because the fresh
worktree lacked dependencies, pnpm materialized 571 locked packages under
ignored `node_modules`; this is an operator/tooling side effect, not a tracked,
forbidden, unexpected, or publishable artifact. No formatter write occurred.
`repository:check` returned RC0, `git diff --check` returned RC0, and the
read-only exact-two scope predicate returned `QUAL030_EXACT_TWO verified` with
only the Packet and Roadmap paths. No observer, test, or code path appeared.
These are candidate documentation/static facts only; no implementation,
runtime, or test command ran in this worktree.

## Required order (frozen, not run in this candidate)

The frozen Ready contract requires, once after explicit handoff and only in the
implementation worktree: pure-Git identity/scope; two baseline writes; two
silent comparisons; the one comment; Node 24 preflight once; pnpm version,
frozen install, and workspace once; targeted code Prettier check;
`repository:check`; `git diff --check`; the named matrix once (`1 passed / 12
skipped`); the full focused file once (`13 passed`); root `check` once (`55
files / 591 tests` plus five builds); then up to three real observer slots.
No slot is consumed before a green root gate. Slot 1 may end the loop with the
fixed RC20 record; otherwise three valid RC0 records are required. Any ordinary
red, invalid tuple, missing output, or failed slot freezes the sequence with no
rerun, substitution, diagnosis, or cleanup. The final permitted closeout is
Packet/Roadmap evidence, optional one-time docs-only Prettier write/check,
`repository:check`, `git diff --check`, and a read-only scope predicate.

## Reviews and authority

Frozen exact-four independent reviews both PASS with no remaining docs/evidence
findings against base/HEAD `69f6d287828bf57f11a02732579feebbde50bdc4`, the
corrected physical exact-four evidence, and its Completion Report:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.

The trailing-blank gap remains unrepaired, unrerun, and unpublished. Those
reviews authorize only this future fresh-main exact-two Blocked Packet/Roadmap
publication; they authorize no code/runtime publication, Issue or milestone
transition, Git/GitHub action, DEC, repair, or broader attribution claim.

The corrected current exact-two candidate was independently reviewed against
base/HEAD `69f6d287828bf57f11a02732579feebbde50bdc4`, the frozen exact-four,
and the Completion Report. Both publication reviews PASS with no findings:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`: PASS/no findings.

Their authority is limited to exact-two Blocked publication only. The
candidate docs/static/scope checks are PASS; only the first eligible exact-head
quality/Integration/Browser CI and Orchestrator merge remain pending and
non-effective. Implementers and reviewers have no authority to mutate
Git/GitHub/Issue state; only the Orchestrator may publish, merge, and reconcile
lifecycle status.

## Terminal, recovery, and lifecycle rules

The local terminal is **Blocked — Harness Probe Attribution Not Verified**.
The observer/test remain unpublished and no cause, repair, non-recurrence,
Worker/Concurrent readiness, M2 completion, or M3 start is claimed. If the
candidate is eventually merged as Blocked, no Issue closes. A Completed
terminal would close #241, #238, #235, and #232 while #229 stays Open; this
candidate is not Completed and does not apply that lifecycle. In every outcome
M2-GOV-006 remains Blocked, M2 remains In Progress, and M3 remains Not Started.
No DEC or Blocking Design Question is opened.

## Acceptance criteria

1. The fresh-main publication candidate has exactly two docs at base/HEAD
   `69f6d287828bf57f11a02732579feebbde50bdc4`; observer/test/code are zero diff.
2. Frozen evidence preserves two RC0 silent comparisons, the sole test comment,
   QUAL029 counter additions, and the observer's one trailing-blank gap as
   unrepaired, unrerun, and unpublished.
3. Frozen first-red chronology and post-red docs-only closeout remain distinct;
   no unearned named/focused/root/slot gate is presented as passed.
4. Frozen exact-four reviews and fresh exact-two publication reviews PASS with
   no findings; only first eligible three-job CI and Orchestrator merge remain
   explicit pending gates.
5. Issue, M2-GOV-006, M2, M3, DEC, code, runtime, and Git/GitHub boundaries are
   unchanged.

## Documentation updates and completion report

Only this Packet and the M2 Roadmap row/current-reconciliation paragraph are
updated. No Current-truth, API, Schema, migration, Acceptance Record, DEC,
AGENTS, README, CI, or runtime document changes are authorized.

The candidate completion report must state: summary; files changed; exact
candidate worktree/branch/base; every permitted command and result; frozen
first-red and post-red closeout evidence; code-zero/static/scope result;
security impact; known limitations; incomplete publication gates; lifecycle
boundaries; documentation updates; possible DEC (`none`); logical role,
requested/configured model, and actual runtime-model status; and Git status.
It must record any ignored dependency materialization and any one-time docs-only
format correction honestly, distinguishing those operator/documentation facts
from runtime/test evidence. No commit is made in this candidate.

### Candidate completion report

- Summary: fresh-main exact-two Blocked Packet/Roadmap candidate reconstructed;
  observer/test/code remain unpublished and zero diff.
- Files changed: the new QUAL030 Packet and `docs/implementation/roadmap.md`
  only, in `/private/tmp/contentos-m2-qual-030-blocked-status-wt` on
  `codex/m2-qual-030-blocked-status-sync` at `69f6d287828bf57f11a02732579feebbde50bdc4`.
- Candidate commands: targeted Packet/Roadmap Prettier RC0; first invocation
  materialized 571 ignored locked packages and performed no write;
  `repository:check` RC0; `git diff --check` RC0; read-only
  `QUAL030_EXACT_TWO verified` RC0. No candidate runtime or test command ran.
- Frozen implementation/tests: first code Prettier red; named/focused/root/
  slot counts `0`/unearned; permitted post-red docs-only closeout was
  Packet/Roadmap evidence sync, unchanged docs Prettier write/check,
  `repository:check` PASS, `git diff --check` PASS, and
  `QUAL030_BLOCKED_SCOPE verified`.
- Security, migration, compatibility, observability, and DEC impact: none;
  no secrets, content, runtime boundary, dependency publication, or new DEC.
- Known limitations/incomplete items: trailing-blank observer gap remains
  unrepaired/unrerun/unpublished; first eligible quality/Integration/Browser
  CI and Orchestrator merge remain pending; no causal, repair, non-recurrence,
  M2, or M3 claim is made.
- Lifecycle: Issue #241 and #238/#235/#232/#229 remain Open; M2-GOV-006 is
  Blocked, M2 is In Progress, and M3 is Not Started.
- Git status: exactly `M docs/implementation/roadmap.md` plus untracked this
  Packet; no commit, push, PR, merge, or other Git/GitHub mutation.
