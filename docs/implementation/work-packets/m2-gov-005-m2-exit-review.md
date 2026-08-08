# M2-GOV-005 — M2 Exit Review and Acceptance Record 001

**Status:** Completed — Exit Review Blocked

**Issue:** [#137](https://github.com/JettxonHo/ContentOS/issues/137)

**Execution outcome:** Completed — Exit Review Blocked. The immutable
[M2 Acceptance Record 001](../m2-acceptance-record-001.md) fixes reviewed commit
`c64fe74ab27513b07a2eb95e86c8f55b90245923` and records the required strict
`Blocked` decision. Both official-registry audits retain one High
`nanoid@3.3.16` advisory (`GHSA-2v37-7h3g-55p8`), tracked by [Issue #139](https://github.com/JettxonHo/ContentOS/issues/139).
M2 remains In Progress and M3 remains Not Started; no dependency remediation is
performed in this publication.

## Identification

- Task ID: `M2-GOV-005`
- Milestone: M2 — Source and Workflow Foundation
- Type: Milestone Exit Review / Immutable Acceptance Record
- Owner: Orchestrator Reviewer
- Reviewer: Independent Review Agents
- Logical Role: `WORK_ITEM_PLANNER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root`
- Planning Base SHA: `220bffc66b50184022fae1dcf8c6b9976e523e2f`
- Risk: Formal milestone acceptance and progression gate

## Goal

Independently verify the complete M2 Source and Workflow Foundation on one exact
latest `main` commit, then publish immutable M2 Acceptance Record 001 with a
strict `Passed` or `Blocked` decision. A Passed decision completes M2 but does
not start, plan, or mark M3 Ready.

## Authority and decision rules

The [Milestone Exit Criteria](../milestone-exit-criteria.md),
[M2 Acceptance Harness](../../quality/m2-acceptance-harness.md), and Accepted
DEC govern this review. There is no Conditional Pass.

`Passed` requires all applicable Common and M2 Exit Criteria, all required
commands, both official-registry audits, exact-SHA GitHub CI, synchronized
documentation, and no Blocking Defect.

Any of the following requires `Blocked`:

- a required command fails or cannot be safely executed;
- required M2 evidence is absent or inconsistent;
- a Critical or High security advisory remains;
- owner crossover, data loss, Version overwrite, Approval bypass, Duplicate
  Promotion, Secret leakage, or a required security boundary failure;
- a required migration, documentation, or exact-SHA CI result is missing;
- the record would need to weaken or rename a Blocking criterion to pass.

Warnings and Known Limitations cannot rename a Blocking Defect. A Blocked
record is retained immutably; remediation uses a separate Work Item and a later
numbered Acceptance Record.

## Preconditions

- M0 and M1 have Passed immutable Acceptance Records.
- M2 Source, Workflow, Fetcher, Workspace, and acceptance-harness Work Items are
  Completed on `main`.
- `M2-QUAL-002` is Completed through PR #130.
- `M2-MAINT-001` is Completed through PR #131 and removed the inherited
  Critical/High dependency blocker without an audit suppression.
- `M2-DOC-001` is Completed through PR #135 and the corresponding status sync
  through PR #136 leaves only this Exit Review pending.
- Issue #137 was the planned M2 exit-review work. Execution identified the
  dependency-audit Blocking Defect recorded in Acceptance Record 001 and tracked
  by Issue #139; no Blocking Design Question was introduced.

The execution branch must be created from the latest `origin/main` after this
Ready Work Packet is merged. That exact execution base, not this planning base,
is the `Reviewed Commit` in the Acceptance Record.

## Relevant decisions and documents

- DEC-244–DEC-266 — test, evidence, recovery, and release gates.
- DEC-267–DEC-286 — MVP scope, milestone order, and completion boundary.
- DEC-287, DEC-288, DEC-291–DEC-293 — bounded Work Items, focused review,
  Definition of Ready/Done, and formal completion governance.
- [Canonical Decision Register](../../decisions/decisions.md)
- [MVP Scope](../../product/mvp-scope.md)
- [Roadmap](../roadmap.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [M2 Acceptance Harness](../../quality/m2-acceptance-harness.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Vertical Slice Acceptance](../../quality/vertical-slice-acceptance.md)
- [Release Gates](../../quality/release-gates.md)
- [Security Baseline](../../security/security-baseline.md)
- [Source Fetcher Security](../../security/source-fetcher.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Source Foundation](../../architecture/source-foundation.md)

Later Accepted DEC govern any actual conflict.

## In scope

1. Freeze one exact latest `origin/main` commit as the reviewed M2 build.
2. Run the complete deterministic, integration, concurrent, browser, migration,
   documentation, security-audit, and repository evidence set.
3. Verify the exact reviewed SHA has all required GitHub CI jobs green.
4. Reconcile the M2 Current-truth, Roadmap, merged Work Items, Issues, PRs, and
   test evidence against the required exit matrix.
5. Publish `docs/implementation/m2-acceptance-record-001.md` with an immutable
   `Passed` or `Blocked` decision and reproducible evidence.
6. Synchronize this Work Packet, `AGENTS.md`, both README files, and the Roadmap
   to the final decision without starting M3.

## Out of scope

- modifying product, test, dependency, lockfile, config, Schema, migration,
  Compose, CI, API, or runtime behavior;
- fixing a discovered defect inside the Exit Review publication diff;
- changing an Accepted DEC, security boundary, release gate, or acceptance
  criterion;
- introducing a new hash, defensive mechanism, package, service, or technology;
- planning or implementing Research, Agent, Render, Export, deployment, or M3;
- rewriting an earlier immutable Acceptance Record.

If a Blocking Defect is found, stop product changes, record `Blocked`, and open
a separate bounded remediation Work Item.

## Publication file boundary

- `docs/implementation/m2-acceptance-record-001.md`
- this Work Packet
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/implementation/roadmap.md`

No other tracked file may change. Evidence commands may create only their
existing isolated runtime resources and must complete owned cleanup.

## Acceptance Record contract

The record header must contain:

- Status;
- Milestone;
- Reviewed Commit;
- Work Item and Issue;
- Execution date and timestamp with timezone;
- Logical reviewer role, requested model, reasoning, thread, and actual runtime
  status;
- final Decision.

The body must contain:

1. Review identity and immutable scope;
2. Required deliverables;
3. Common Exit Criteria matrix;
4. M2 Exit Criteria evidence matrix;
5. commands, test counts, and results;
6. migration and no-diff generation evidence;
7. security and dependency-audit results;
8. recovery, Workflow, SSE, and Queue evidence;
9. demo and browser evidence;
10. documentation and exact-SHA CI evidence;
11. Known Limitations;
12. Blocking Defects;
13. final Decision and required next action.

All links, commands, counts, SHAs, PR facts, and test names must be checked
against the reviewed commit. A model statement without reproducible evidence is
not acceptance evidence.

## M2 evidence matrix

The record must explicitly evaluate:

| Criterion                              | Required interpretation                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SSRF denial                            | Controlled public transport rejects restricted targets with no Source evidence or ordinary bypass.                                                                                         |
| Upload Quarantine                      | Only valid Pasted Text, `.md`, and `.txt` formal paths create Source graphs; denials have zero Object Store side effect.                                                                   |
| Raw Snapshot / Safe Display separation | Raw bytes are never rendered; deterministic non-executable plain text is the review representation. Do not claim a separate Safe Display entity or HTML renderer.                          |
| Approved Source Version                | Human Approval binds an exact immutable current Version.                                                                                                                                   |
| URL failure fallback                   | Failed URL capture remains visible and Paste/Upload fallback creates an independent formal Source.                                                                                         |
| Duplicate Queue protection             | Duplicate, stale, or terminal delivery creates no duplicate Result, Source, Version, Approval, or promotion.                                                                               |
| Outbox recovery                        | PostgreSQL Outbox recovers dispatch without making Redis truth.                                                                                                                            |
| Redis-loss reconciliation              | Missing Jobs are repaired from PostgreSQL authority.                                                                                                                                       |
| Lease recovery                         | Expired claims recover with fencing and no stale result promotion.                                                                                                                         |
| Workflow Timeline                      | Owner-scoped bounded Timeline reflects authoritative safe Events.                                                                                                                          |
| SSE fallback                           | SSE is notification-only; refresh, disconnect, and Polling recovery read authoritative REST state.                                                                                         |
| Approved-only Research input           | The internal current-Approved Source input projection returns exact current Approved Versions only. This is not a Research Agent, Frozen Input, readiness decision, or Research execution. |

## Required commands and evidence

Run from a clean execution branch whose HEAD equals the recorded `Reviewed
Commit` before publication files are created:

```text
node --version
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm check
corepack pnpm repository:check
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm db:generate
git status --short --untracked-files=all
corepack pnpm db:generate
git status --short --untracked-files=all
corepack pnpm --registry=https://registry.npmjs.org audit --audit-level high
corepack pnpm --prod --registry=https://registry.npmjs.org audit --audit-level high
git diff --check
```

Also record:

- Node.js `v24.18.0` and pnpm `11.17.0`;
- exact test counts and exit codes;
- an empty tracked/untracked status after each database-generation pass;
- the exact reviewed SHA's three GitHub CI jobs and URLs;
- all completed M2 Work Items, Issues, PRs, and squash SHAs needed for
  traceability;
- no Secret, local absolute path, `.DS_Store`, generated artifact, or owned
  runtime residue;
- no interaction with `contentos-local` volumes or unrelated containers.

The official-registry audit commands may use an external temporary pnpm store
if the local environment otherwise writes a repository-root `.pnpm-store`.
Such temporary state must be outside the repository and the task-owned store
must be deleted after the audits. Merely excluding it from the publication diff
does not satisfy cleanup.

After creating the publication files, stage exactly the six allowed files so
the repository checks' `git ls-files` input includes the new Acceptance Record.
Staging is authorized only for this integrity check; it does not authorize a
commit, push, or merge. Then run:

```text
git add AGENTS.md README.md README.zh-CN.md docs/implementation/roadmap.md docs/implementation/work-packets/m2-gov-005-m2-exit-review.md docs/implementation/m2-acceptance-record-001.md
git diff --cached --name-status
git diff --cached --check
corepack pnpm format:check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

Verify the staged publication diff is exactly the six allowed files and the
working tree contains no additional tracked or untracked change. If a
publication file changes after staging, re-stage the same allowlist and rerun
the final checks.

## Demonstration and recovery evidence

The existing M2 acceptance browser scenario is the formal demonstrable
capability: authenticated URL failure remains visible; manual fallback creates
a Source; Working Copy review, Version creation, exact Approval, Timeline, page
refresh, SSE disconnect, and Polling recovery preserve PostgreSQL authority.

The integration and concurrent harnesses provide the Queue, Outbox, Redis-loss,
lease, owner-scope, duplicate-delivery, migration, and cleanup evidence. Do not
invent a separate manual production deployment or public-network demo.

## Security, migration, and compatibility review

- Both official-registry audits must report zero Critical and zero High
  advisories; no ignore, suppression, or severity reclassification is allowed.
- SSRF, upload quarantine, owner authorization, Secret redaction, and private
  Snapshot boundaries must have executable evidence.
- Database generation must be idempotent and leave no diff; committed empty and
  upgrade migration tests must pass through the required integration command.
- No production data, external account, or non-isolated environment is used.

## Status synchronization

If the record is `Passed`:

- mark this Work Item `Completed`;
- mark M2 `Completed` in `AGENTS.md`, both README files, and the Roadmap;
- link Acceptance Record 001 and the reviewed commit;
- keep M3 `Not Started` and do not create an M3 Work Item in this PR.

If the record is `Blocked`:

- mark this Work Item `Completed — Exit Review Blocked`;
- leave M2 `In Progress` or explicitly `Blocked` consistently;
- keep M3 `Not Started`;
- name every Blocking Defect and required remediation without fixing it in this
  publication PR.

## Definition of Ready

**PASS.** Independent governance and evidence reviewers confirmed the exact
entry conditions, M2 matrix, command mechanics, immutable record, six-file
publication scope, strict Passed/Blocked rules, and publication authority. The
first review's bounded no-diff, cleanup, staged-integrity, and Blocked-record
publication findings are resolved. No Blocking Design Question or new DEC is
required.

- Governance reviewer:
  - Logical Role: `DEFINITION_OF_READY_GOVERNANCE_REVIEWER`
  - Requested Model: `gpt-5.6-sol`
  - Reasoning: High
  - Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2_acceptance_governance_audit`
- Evidence reviewer:
  - Logical Role: `DEFINITION_OF_READY_EVIDENCE_REVIEWER`
  - Requested Model: `gpt-5.6-sol`
  - Reasoning: High
  - Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2qual002_correctness_review`
- Reviewed Base: `220bffc66b50184022fae1dcf8c6b9976e523e2f`
- Blocking Design Question: None

## Definition of Done

One exact reviewed commit has a complete reproducible evidence set; the
immutable record makes the only permitted decision; status documents are
consistent; independent review passes; and no unrelated diff or residue
remains.

For `Passed`, every reviewed-build gate and both audits pass, the exact reviewed
SHA and publication PR CI are green, and no Blocking Defect remains.

For `Blocked`, the record completely and accurately preserves the failed
evidence; independent review passes for record accuracy and publication scope;
and all documentation-integrity checks pass. The recorded M2 blocker may remain
red or unresolved solely to publish the immutable failure record. An unrelated
PR failure, an inaccurate/incomplete record, or a publication-scope finding
still blocks publication. Publishing a Blocked record is not Conditional Pass
and does not progress M2 or start M3.

## Git authority

The Exit Reviewer may modify only the six publication files and must stop before
Git publication, except for the six-file staging explicitly required for final
integrity checks. After independent review passes, the Orchestrator may commit,
push, and create a draft PR.

For a `Passed` record, the Orchestrator may mark the PR ready and squash merge
only after all required exact-PR CI is green and no unresolved finding or
escalation item remains.

For a `Blocked` record, the same recorded M2 failure may also fail the unified
PR CI. The autonomous merge authority does not bypass branch protection or that
red gate: the Orchestrator must request the applicable explicit Human
authorization or use an already approved failure-record publication path.
Unrelated CI failures and record-integrity, review, or scope findings cannot use
this exception.

## Escalation conditions

Human decision is required only if the review would change product direction,
Accepted scope, authentication/authorization, production data or configuration,
a major security boundary, technical stack, release gate, or required evidence
standard. Ordinary evidence collection, bounded documentation correction,
test reruns, and a strict Blocked decision do not require a new DEC.

## Completion report requirements

Report Summary; Reviewed Commit; reviewer metadata; files changed; commands and
test counts; M2 matrix; security/audit results; migration evidence; CI evidence;
Known Limitations; Blocking Defects; final Decision; documentation updates;
possible new DEC; cleanup; Git status; and next authorized action.
