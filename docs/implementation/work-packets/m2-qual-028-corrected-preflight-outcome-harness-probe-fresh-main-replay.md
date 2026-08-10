# M2-QUAL-028 — Corrected Preflight-Outcome Harness-Probe Fresh-Main Replay

**Status:** Blocked — Harness Probe Attribution Not Verified

## Identification

- Task ID: M2-QUAL-028
- Milestone: M2 — Source and Workflow Foundation
- Work Item type: Quality / diagnostic attribution publication
- Issue: #235 Open; it links Issues #232 and #229 and grants no
  implementation, review, or mutation authority.
- Planning worktree: /private/tmp/contentos-m2-qual-028-plan-wt
- Planning branch: codex/m2-qual-028-corrected-harness-probe-plan
- Planning base/HEAD: 4767d07b88e4d7087e770d017ee7ca323c8bae7d
- Contract shape: 2 / 4 / 2 — planning docs / local implementation /
  terminal publication
- Implementation thread: /root/m2_qual_028_implementation
- Implementation role: IMPLEMENTER
- Requested implementation agent: luna-worker
- Configured model/reasoning: gpt-5.6-luna / Max
- Actual runtime model: UNVERIFIED_RUNTIME_MODEL
- Frozen reference worktree: /private/tmp/contentos-m2-qual-027-plan-wt
- Frozen reference branch: codex/m2-qual-027-harness-probe-plan
- Frozen reference base/HEAD: 3490615cc789e0e5077d788770033bf12363f9fc
- Fresh publication candidate worktree:
  /private/tmp/contentos-m2-qual-028-blocked-status-wt
- Fresh publication candidate branch:
  codex/m2-qual-028-blocked-status-sync
- Fresh publication candidate base/HEAD:
  4767d07b88e4d7087e770d017ee7ca323c8bae7d
- Fresh publication candidate target shape: exact two — this Packet plus the
  Roadmap
- Relevant DEC: none; this is a bounded diagnostic record and changes no
  accepted product, architecture, security, workflow, or release contract.
- Risk classification: bounded local diagnostic, deterministic attribution,
  evidence minimization.

## Goal

Publish a reviewed fresh-main exact-two record for the corrected preflight
outcome seam. The record preserves the frozen first-red evidence without
publishing the observer or test, claiming a cause, repairing the seam, or
advancing M2-GOV-006.

## Context and dependency evidence

QUAL027 is effective on current main as Blocked — Harness Probe Attribution
Not Verified through PR #233 and reconciliation PR #234. Its observer/test
remain unpublished and its preflight-unexpected adequacy gap is unresolved.
Issue #232 and Issue #229 remain Open.

The frozen implementation was performed only in
/private/tmp/contentos-m2-qual-028-plan-wt at base/HEAD
4767d07b88e4d7087e770d017ee7ca323c8bae7d. Its exact-four shape contained the
observer, the twelve-test file plus the separate thirteenth fixture, this
Packet, and the Roadmap. This fresh candidate contains only the Packet and
Roadmap; it does not copy, reconstruct, or publish observer/test code.

## In scope

- Reconstruct this publication Packet and the one Roadmap row from the frozen
  evidence.
- Record the exact first-red TDD evidence, adequacy findings, security
  boundaries, review boundaries, and fresh-main publication gates.
- Run only documentation, repository, diff, and exact-two scope checks in this
  fresh candidate.

## Out of scope

- No observer/test or other code publication, reconstruction, or modification.
- No preflight, Vitest, focused, slot, root, Node, Docker, Integration,
  Browser, Worker, Concurrent, or other runtime invocation.
- No diagnosis, root-cause, repair, retry, replacement, cleanup, filesystem
  inspection, or non-recurrence claim.
- No product, API, Schema, migration, dependency, CI, Current-truth, DEC,
  security-boundary, M2, or M3 change.
- No Issue, Git, GitHub, commit, push, PR, merge, or status mutation.

## Relevant documents

- Repository guidance: ../../../AGENTS.md
- Work Item template: ../work-item-template.md
- Agent collaboration workflow: ../agent-collaboration-workflow.md
- Test strategy: ../../quality/test-strategy.md
- Release gates: ../../quality/release-gates.md
- Roadmap: ../roadmap.md
- Frozen planning Packet:
  m2-qual-028-corrected-preflight-outcome-harness-probe-fresh-main-replay.md

No Current-truth behavior changes. A later Accepted DEC governs any actual
conflict.

## Exact scope and publication boundary

The fresh publication candidate is exact two: this Packet and
docs/implementation/roadmap.md. The observer and both test shapes never
publish. The candidate is reconstructed from fresh main, not merged from the
implementation worktree. No forbidden or unexpected path is permitted.

Candidate publication remains non-effective until two fresh exact-two
publication reviews, targeted static/scope checks, the first eligible green
quality/Integration/Browser CI result, and Orchestrator squash merge all pass.
The candidate has no authority to perform those external actions.

## Frozen implementation evidence

The implementation handoff used the recorded thread, role, requested agent,
configured model, and actual runtime metadata above. The baseline observer/test
reconstruction used exactly two apply_patch writes and two silent no-index
equality predicates, both RC0. The separate thirteenth fixture was added by
one additional apply_patch write.

The first governed preflight ran exactly once and returned RC0 with one exact
LF line:

```text
Harness harness-probe preflight=verified
```

The one-time pnpm version was 11.17.0. Frozen install and workspace checks
returned RC0. The named thirteenth fixture ran exactly once before the source
patch and produced the planned TDD red:

- RC1;
- exactly 1 failed / 12 skipped / 0 other failures; and
- only the fixed expected-versus-received mismatch:
  expected Harness harness-probe preflight=blocked reason=unexpected followed
  by LF, received Harness harness-probe predicate=blocked reason=unexpected
  entries=zero failures=one followed by LF.

The source patch changed only the unique let exits binding to const exits and
made the CLI catch mode-aware. One code Prettier write completed. The sole
quoted-heredoc closed-delta predicate then returned RC1 with only:

```text
QUAL028_DELTA blocked
```

Per the first-red rule, the local exact-four shape froze at that point.
Implementation-sequence code static, focused, slots, and root counts remained 0. No delta rerun, diagnosis, repair, retry, replacement, cleanup, or raw
evidence occurred.

## Frozen exact-four closeout chronology

After the delta RC1 first red, implementation-sequence code static, focused,
slots, and root counts remained 0. The only permitted post-delta action was the
Packet/Roadmap evidence write. The first final exact-four Prettier check then
returned RC1 solely for Packet formatting; one docs-only Packet/Roadmap
Prettier write corrected that issue; final exact-four
Prettier/repository/diff/scope verification returned PASS. This is the frozen
implementation closeout and is separate from the fresh exact-two candidate
formatting chronology recorded below.

## Frozen code/test adequacy findings

Read-only review froze two findings in the unpublished code/test shape:

1. The delta predicate expected multiline Prettier catch bytes while actual
   Prettier kept a semantically equivalent catch on one line. Candidate test
   bytes otherwise match the declared transform. This is a
   predicate/candidate byte mismatch, not filesystem or runtime attribution.
2. The thirteenth fixture stores only the last exit value and has no
   setter-call counter, so exactly-one exit assignment is unverified.

Both findings are frozen, unrepaired, unrerun, and unpublished. They authorize
no observer/test change and do not establish a filesystem or runtime cause.

## Frozen review evidence

Definition-of-Ready PASS evidence was recorded before implementation by
/root/m2_qual_014_dor_correctness and
/root/m2_qual_012_browser_setup_diagnosis. Their role was
DEFINITION_OF_READY_REVIEWER, requested gpt-5.6-sol High, actual runtime model
UNVERIFIED_RUNTIME_MODEL, and their authority was limited to readiness.

The frozen exact-four implementation/evidence shape and Completion Report were
independently reviewed by the same two reviewers:

- /root/m2_qual_014_dor_correctness
- /root/m2_qual_012_browser_setup_diagnosis

Both had role INDEPENDENT_REVIEWER, requested gpt-5.6-sol High, actual runtime
model UNVERIFIED_RUNTIME_MODEL, and reviewed base/HEAD
4767d07b88e4d7087e770d017ee7ca323c8bae7d plus the corrected physical exact-four
shape and Completion Report. Both PASS for frozen evidence correctness and
future fresh-main exact-two Blocked publication eligibility with no remaining
docs/evidence findings. The two adequacy gaps above remain frozen, unrerun, and
unpublished. Their authority is limited to exact-two publication only.

## Fresh exact-two publication review evidence

The current fresh candidate was independently reviewed against base/HEAD
4767d07b88e4d7087e770d017ee7ca323c8bae7d and the corrected exact-two candidate
against the frozen exact-four shape by:

- /root/m2_qual_014_dor_correctness
- /root/m2_qual_012_browser_setup_diagnosis

Both reviewers had role INDEPENDENT_REVIEWER, requested gpt-5.6-sol High, and
actual runtime model UNVERIFIED_RUNTIME_MODEL. Both reviews PASS for this
exact-two Blocked publication with no remaining publication docs findings. The
two adequacy gaps remain unresolved, frozen, and unpublished. Their authority
is limited to exact-two Blocked publication only; it does not authorize
runtime/code changes, Issue transitions, M2/M3 changes, or Git mutation.

## Fresh publication candidate status

This worktree started clean at base/HEAD
4767d07b88e4d7087e770d017ee7ca323c8bae7d on branch
codex/m2-qual-028-blocked-status-sync. The candidate target is exact two:
the new Packet and the Roadmap modification. No runtime or external mutation
was performed in this candidate.

Candidate docs/static/scope checks PASS for Prettier, repository, diff, exact
two, forbidden, and no-unexpected predicates. Fresh exact-two publication
reviews PASS with no publication docs findings. Only the first eligible
quality/Integration/Browser CI result and Orchestrator squash merge remain
pending and non-effective.

The full recovery rule remains fixed: at most one material fresh-main exact-two
evidence correction may receive new reviews, targeted static/scope checks, and
the first eligible three-job CI result. A second red or missing first eligible
result requires M2-QUAL-029. No unchanged rerun, replacement head, or Issue
transition is authorized here.

## Effective merge-status reconciliation

Effective PR #236, titled docs: record blocked M2-QUAL-028 replay, used base
4767d07b88e4d7087e770d017ee7ca323c8bae7d, final head
306e317e82450eb8dc9d36d5e8902bfbe529d8de, and exactly two docs: this Packet
and the Roadmap. Its first eligible CI run 31363832768 passed quality in 1m59,
Integration in 2m59, and Browser in 2m16.

The Orchestrator squash/main is
fee37c125352302c07d221639ac007db3ec18565, merged at
2026-08-10T06:59:14Z. The gh merge command was nonzero only after the remote
merge because local main was owned by another worktree; read-only verification
confirmed the remote merge and no second merge was attempted. The effective
terminal remains Blocked. Issues #235, #232, and #229 remain Open; observer/test
remain unpublished and both adequacy gaps remain unresolved, frozen, and
unpublished.

The current reconciliation identity is worktree
/private/tmp/contentos-m2-qual-028-merge-status-wt, branch
codex/m2-qual-028-merge-status-sync, base/HEAD
fee37c125352302c07d221639ac007db3ec18565, with exactly two tracked
modifications (Packet + Roadmap) and no other path. Reconciliation targeted
Packet/Roadmap Prettier, repository:check, git diff --check, tracked
exact-two, forbidden, and no-unexpected checks PASS. Its own reconciliation
reviews and targeted docs/static/scope are PASS; only the next first eligible
exact-head three-job CI result and any further Orchestrator merge action remain
pending and non-effective.

## Current reconciliation review evidence

Two independent current reconciliation reviews are PASS with no findings:

- /root/m2_qual_014_dor_correctness, role INDEPENDENT_REVIEWER, requested
  gpt-5.6-sol High, actual UNVERIFIED_RUNTIME_MODEL;
- /root/m2_qual_012_browser_setup_diagnosis, role INDEPENDENT_REVIEWER,
  requested gpt-5.6-sol High, actual UNVERIFIED_RUNTIME_MODEL.

Both reviewed base/HEAD
fee37c125352302c07d221639ac007db3ec18565 and the corrected tracked exact-two
Packet/Roadmap. Their authority is reconciliation-publication only. Reviews
and targeted docs/static/scope are PASS; only the first eligible exact-head
quality/Integration/Browser three-job CI result and Orchestrator squash merge
remain pending and non-effective.

## Security, migration, observability, and DEC

The frozen observer retains no names, Dirent values, paths, contents, error
objects, PIDs, commands, arguments, environment values, status/signal detail,
URLs, ports, secrets, stacks, logs, hashes, manifests, artifacts, or raw
stdout/stderr. Durable evidence is limited to governance identities, fixed
records, RCs, aggregate test/build counts, physical scope, and allowlisted
enum/bucket fields.

This publication candidate changes no product data, external input,
credential, network/provider transmission, Authentication, Authorization,
Object Storage, Queue, API, Schema, migration, configuration, logging policy,
deletion range, or accepted security boundary. No migration, compatibility
sequence, backfill, rollback, cleanup authority, or persistent diagnostic sink
exists. No DEC is required.

## Issue and milestone boundaries

Issue #235, Issue #232, and Issue #229 remain Open. A merged Blocked outcome
closes no Issue. M2-GOV-006 remains Blocked, M2 remains In Progress, and M3
remains Not Started. No Issue, Git, GitHub, M2, or M3 mutation is claimed.

## Acceptance criteria

1. Candidate is exact two from base/HEAD
   4767d07b88e4d7087e770d017ee7ca323c8bae7d with no unexpected path.
2. Frozen implementation metadata, first preflight, pnpm/install/workspace,
   TDD red, source patch, and delta RC1 fixed record are preserved.
3. Implementation-sequence code static/focused/slots/root counts remain 0;
   both adequacy gaps remain frozen/unrerun/unpublished.
4. Exact Blocked label, security/no-raw-evidence, Issue, M2, M3, and no-DEC
   boundaries remain exact.
5. Fresh candidate docs/static/scope checks PASS and fresh exact-two publication
   reviews PASS with no publication docs findings. Effective PR236, its green
   first eligible CI, and the Orchestrator merge are recorded. Reconciliation
   reviews and targeted docs/static/scope are PASS; only the next first eligible
   exact-head three-job CI result and any further Orchestrator merge action
   remain pending and non-effective.

## Completion report

- Summary: effective PR236 and its green first eligible CI are recorded for
  the fresh-main exact-two Blocked outcome; observer/test remain unpublished.
- Files changed: this tracked Packet and docs/implementation/roadmap.md only
  in the merge-status reconciliation.
- Commands: reconciliation ran only targeted Packet/Roadmap documentation,
  repository, diff, and tracked exact-two/forbidden/no-unexpected checks; all
  passed (RC0). No runtime, Git mutation, GitHub, or Issue command was run by
  this reconciliation agent.
- Formatting chronology: the initial candidate Packet/Roadmap Prettier check
  was RC1 solely for Packet formatting and materialized only ignored locked
  node_modules; no tracked or unexpected artifact appeared. One authorized
  Packet/Roadmap-only Prettier write corrected the docs issue. Final
  docs/static/scope verification is a separate closeout and passed (RC0); this
  chronology is documentation formatting evidence only, not a runtime red,
  rerun, or cleanup event.
- Tests: no candidate runtime tests. Frozen TDD red is recorded as RC1 with
  exactly 1 failed / 12 skipped / 0 other failures; focused/root/slot counts
  are 0.
- Acceptance criteria: effective PR236, final head, green first eligible CI,
  squash/main, merge time, exact-two docs, and post-remote gh verification are
  recorded; frozen evidence, fresh publication reviews, and docs/static/scope
  checks remain PASS. Its own reconciliation reviews and targeted docs/static/
  scope are PASS; only the next first eligible exact-head three-job CI result
  and any further Orchestrator merge action remain pending/non-effective.
- Security impact: no product/security behavior changed; no raw or secret
  evidence is retained.
- Known limitations: this candidate does not prove cause, repair,
  non-recurrence, or broader Worker/Concurrent readiness; frozen adequacy gaps
  remain unresolved.
- Incomplete items: the next first eligible exact-head quality/Integration/
  Browser CI result and any further Orchestrator merge action remain
  pending/non-effective; its own reconciliation reviews, publication reviews,
  and docs/static/scope checks are PASS.
- Documentation updates: this Packet and Roadmap only.
- Possible new DEC: none.
- Git status: exact two tracked modifications — Packet plus Roadmap; no commit,
  push, PR, merge, or Issue mutation by this reconciliation agent.
