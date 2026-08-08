# M2-GOV-006 — M2 Exit Review and Acceptance Record 002

**Status:** Blocked — awaiting M2-QUAL-003 and M2-QUAL-004

**Issue:** [#144](https://github.com/JettxonHo/ContentOS/issues/144)

## Identification

- Task ID: `M2-GOV-006`
- Title: M2 Exit Review and Acceptance Record 002
- Milestone: M2 — Source and Workflow Foundation
- Status: Ready
- Type: Milestone Exit Review / Immutable Acceptance Record
- Owner: Orchestrator Reviewer
- Reviewer: Independent Review Agents
- Executor Profile: `DOCUMENTATION_EXECUTOR`
- Logical Role: `WORK_ITEM_PLANNER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root`
- Planning Base SHA: `b4c48696e776f2d8e96cb364b6cbf72bf70e6fd9`
- Relevant DEC: DEC-244–DEC-266, DEC-267–DEC-293
- Relevant Documents: Milestone Exit Criteria, M2 Acceptance Harness, Release
  Gates, Test Strategy, Roadmap, and M2 Acceptance Record 001
- Dependencies: `M2-MAINT-002` and its completion status synchronization are
  merged; Issue #139 is closed; Issue #144 is open
- Risk Classification: Formal milestone acceptance and progression gate

## Goal

Independently re-run the complete M2 exit evidence on one exact latest `main`
commit after the `nanoid` remediation, then publish immutable M2 Acceptance
Record 002 with a strict `Passed` or `Blocked` decision. A Passed decision may
complete M2; it does not start or plan M3.

## Context

[M2 Acceptance Record 001](../m2-acceptance-record-001.md) is immutable
historical evidence. It fixed reviewed commit
`c64fe74ab27513b07a2eb95e86c8f55b90245923` and correctly recorded `Blocked`
because both official-registry audits contained the High
`nanoid@3.3.16` advisory. `M2-MAINT-002` remediated that exact blocker through
PR #142, squash merge `5b9640707217aba3d7f59c14f2343e6fcc7f102b`,
and the completion truth was synchronized through PR #143, squash merge
`b4c48696e776f2d8e96cb364b6cbf72bf70e6fd9`. Issue #139 is closed.

M2 remains In Progress until a new numbered Exit Review proves every applicable
criterion again on one post-remediation commit. Record 001 must not be edited,
reclassified, or reused as the new decision.

The first Record 002 publication attempt was closed without merge after its
final-head Integration job exposed the M2-QUAL-003 observation race. Repeated
Concurrent validation then produced an unclassified child test failure, so
M2-QUAL-004 must provide safe attribution before the remaining exact remediation
and this Exit Review can restart from a new `main` commit.

A maintenance verification run previously exposed and then cleaned one
task-owned orphan API process. Four subsequent isolated harness lifecycles—one
ordinary integration run, two concurrent integration children, and one browser
run—left zero new API processes and did not reproduce a harness defect. This
Work Item therefore does not invent a defect or change the harness. It requires
a before/after process and runtime-resource delta around the complete review.
Any current-review-owned residue is a Blocking Defect.

## Authority and decision rules

The [Milestone Exit Criteria](../milestone-exit-criteria.md),
[M2 Acceptance Harness](../../quality/m2-acceptance-harness.md), and Accepted
DEC govern this review. There is no Conditional Pass.

`Passed` requires all applicable Common and M2 Exit Criteria, every required
local command, both official-registry audits with zero Critical or High
advisories, exact-reviewed-SHA GitHub CI, synchronized documentation, complete
owned cleanup, and no Blocking Defect.

Any of the following requires `Blocked`:

- a required command fails or cannot be safely executed;
- required M2 evidence is absent, stale, or inconsistent;
- a Critical or High security advisory remains;
- owner crossover, data loss, Version overwrite, Approval bypass, Duplicate
  Promotion, Secret leakage, or a required security-boundary failure occurs;
- a required migration, documentation, cleanup, or exact-SHA CI result is
  missing;
- a process, container, temporary directory, task-owned package store, or
  generated artifact created by this review remains after its owner command;
- the record would need to weaken or rename a Blocking criterion to pass.

Warnings and Known Limitations cannot rename a Blocking Defect. A Blocked
record is retained immutably; remediation uses a separate Work Item and a later
numbered Acceptance Record.

## Preconditions

- M0 and M1 have Passed immutable Acceptance Records.
- M2 Source, Workflow, Fetcher, Workspace, and acceptance-harness Work Items are
  Completed on `main`.
- `M2-QUAL-002`, `M2-MAINT-001`, and `M2-DOC-001` are Completed.
- `M2-GOV-005` is Completed — Exit Review Blocked and Record 001 is immutable.
- `M2-MAINT-002` is Completed through PR #142; Issue #139 is closed; its
  completion truth is synchronized through PR #143.
- Issue #144 is the open tracking Issue for this new numbered Exit Review.
- No Blocking Design Question remains.

The execution branch must be created from the latest `origin/main` after this
Ready Work Packet is merged. That exact execution base, not this planning base,
is the `Reviewed Commit` in Acceptance Record 002.

## Relevant decisions and documents

- DEC-244–DEC-266 — test, evidence, recovery, and release gates.
- DEC-267–DEC-286 — MVP scope, milestone order, and completion boundary.
- DEC-287, DEC-288, DEC-291–DEC-293 — bounded Work Items, focused review,
  Definition of Ready/Done, and formal completion governance.
- [Canonical Decision Register](../../decisions/decisions.md)
- [MVP Scope](../../product/mvp-scope.md)
- [Roadmap](../roadmap.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [M2 Acceptance Record 001](../m2-acceptance-record-001.md)
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
2. Capture an entry baseline for tracked/untracked files and currently running
   ContentOS application processes, owned smoke/browser Compose projects, and
   task-owned temporary resources without changing pre-existing state.
3. Run the complete deterministic, integration, concurrent, browser, migration,
   documentation, security-audit, and repository evidence set.
4. Verify the exact reviewed SHA has all required GitHub CI jobs green.
5. Reconcile M2 Current-truth, Roadmap, merged Work Items, Issues, PRs, CI, and
   test evidence against the exit matrix.
6. Publish `docs/implementation/m2-acceptance-record-002.md` with an immutable
   `Passed` or `Blocked` decision and reproducible evidence.
7. Synchronize this Work Packet, `AGENTS.md`, both README files, and the Roadmap
   to the final decision without starting M3.

## Out of scope

- editing or replacing `docs/implementation/m2-acceptance-record-001.md`;
- modifying product, test, dependency, lockfile, config, Schema, migration,
  Compose, CI, API, or runtime behavior;
- fixing a discovered defect inside the Exit Review publication diff;
- changing an Accepted DEC, security boundary, release gate, or acceptance
  criterion;
- introducing a new hash, defensive mechanism, package, service, or technology;
- terminating or cleaning a process, container, volume, directory, or package
  store that existed in the entry baseline;
- planning or implementing Research, Agent, Render, Export, deployment, or M3.

If a Blocking Defect is found, stop product changes, record `Blocked`, and open
a separate bounded remediation Work Item.

## Publication file boundary

- `docs/implementation/m2-acceptance-record-002.md`
- this Work Packet
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/implementation/roadmap.md`

No other tracked file may change. Evidence commands may create only their
existing isolated runtime resources and must complete owned cleanup. Before
tracked-file-based documentation checks, the Orchestrator may stage exactly
these six publication files. Staging does not authorize publication or merge.

### Allowed modules

- Documentation and milestone-governance records only.

### Allowed files

- the six publication files listed above and no others.

### Prohibited modules

- all `apps/**`, `packages/**`, migrations, Schema, configuration, Compose, CI,
  dependency manifests, lockfile, Accepted DEC, Sessions, and M3 artifacts;
- M2 Acceptance Record 001.

### Generated files policy

- the only committable new file is M2 Acceptance Record 002;
- test/build/database/audit output is evidence only and is never committed;
- isolated harness resources must be owned by their command and removed by its
  existing cleanup path;
- a temporary audit store must be uniquely created outside the repository,
  validated as task-owned, deleted after the final audit, and asserted absent;
- no repository-local package store, generated migration, log, screenshot,
  trace, or local evidence file may enter the publication diff.

## Acceptance Record contract

The record header must contain:

- Status;
- Milestone;
- Reviewed Commit;
- Work Item and Issue;
- execution date and timestamp with timezone;
- logical reviewer role, requested model, reasoning, thread, and actual runtime
  status;
- final Decision.

The body must contain:

1. Review identity and immutable scope;
2. prerequisite and remediation traceability;
3. required deliverables;
4. Common Exit Criteria matrix;
5. M2 Exit Criteria evidence matrix;
6. commands, test counts, and results;
7. migration and two no-diff generation passes;
8. security and dependency-audit results;
9. recovery, Workflow, SSE, Queue, and approved-input evidence;
10. browser/demo evidence;
11. exact-reviewed-SHA CI evidence;
12. cleanup delta and repository-integrity evidence;
13. Known Limitations;
14. Blocking Defects;
15. final Decision and required next action.

All links, commands, counts, SHAs, PR facts, CI facts, and test names must be
checked against the reviewed commit. A model statement without reproducible
evidence is not acceptance evidence.

## M2 evidence matrix

The record must explicitly evaluate:

| Criterion                              | Required interpretation                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSRF denial                            | Controlled public transport rejects restricted targets with no Source evidence or ordinary bypass.                                                                |
| Upload Quarantine                      | Only valid Pasted Text, `.md`, and `.txt` formal paths create Source graphs; denials have zero Object Store side effect.                                          |
| Raw Snapshot / Safe Display separation | Raw bytes are never rendered; deterministic non-executable plain text is the review representation. Do not claim a separate Safe Display entity or HTML renderer. |
| Approved Source Version                | Human Approval binds an exact immutable current Version.                                                                                                          |
| URL failure fallback                   | Failed URL capture remains visible and Paste/Upload fallback creates an independent formal Source.                                                                |
| Duplicate Queue protection             | Duplicate, stale, or terminal delivery creates no duplicate Result, Source, Version, Approval, or promotion.                                                      |
| Outbox recovery                        | PostgreSQL Outbox recovers dispatch without making Redis truth.                                                                                                   |
| Redis-loss reconciliation              | Missing Jobs are repaired from PostgreSQL authority.                                                                                                              |
| Lease recovery                         | Expired work advances one fenced generation without accepting a stale heartbeat or result.                                                                        |
| SSE fallback                           | SSE is notification-only; disconnect leads to bounded REST polling and authoritative refresh.                                                                     |
| Workflow Timeline                      | Owner-scoped ordered safe Events are read through PostgreSQL-backed REST projection.                                                                              |
| Research Approved-only input           | The internal projection returns only each Source's exact current Approved Version and does not implement Research.                                                |

## Required evidence sequence

### 1. Freeze and inspect

- Fetch `origin` and require the planning PR to be merged.
- Create the execution branch from exact latest `origin/main`.
- Record branch, SHA, Node `v24.18.0`, pnpm `11.17.0`, and clean Git status.
- Verify Record 001 has no diff throughout this Work Item.
- Record only counts/identities needed to compare pre-existing ContentOS
  application processes, smoke/browser projects, task-owned temporary
  directories, and repository-local `.pnpm-store` state. Do not publish local
  paths, environment values, or process commands.

### 2. Deterministic and repository gates

Run:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

If a restricted sandbox produces the known process-inspection `EPERM`, preserve
that environment result and rerun the same command with normal process
visibility. A product or test failure must not be reclassified as a sandbox
failure.

### 3. Runtime gates

Run:

```text
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
```

After each command, compare its owned process, Compose, temporary-directory, and
repository-store delta with the entry baseline. A current-review-owned residue
blocks Passed even if it is later safely cleaned for local hygiene. Historical
entry resources are neither evidence of this review nor authorized cleanup
targets.

### 4. Migration no-diff gates

Run `corepack pnpm db:generate` twice. Immediately after each pass, execute a
non-empty-status failure assertion and focused content-diff checks equivalent
to:

```text
test -z "$(git status --porcelain=v1 --untracked-files=all)"
git diff --exit-code -- packages/database/src/schema.ts drizzle.config.ts migrations
git diff --exit-code "$reviewed_sha" -- docs/implementation/m2-acceptance-record-001.md
```

Each assertion must return zero after each generation pass. `git diff --check`
alone is not a Schema or generated-file no-diff gate. Run the committed
migration/integration evidence as part of the required integration suite; do
not create or edit a migration.

### 5. Dependency security gates

Create one unique task-owned external audit store with `mktemp -d`, validate
that it is outside the repository and absent from the entry inventory, and use
that exact path for both commands:

```text
corepack pnpm --store-dir "$audit_store" --registry=https://registry.npmjs.org audit --audit-level high
corepack pnpm --store-dir "$audit_store" --prod --registry=https://registry.npmjs.org audit --audit-level high
```

After the second command, delete only that validated task-owned store and
assert the exact path is absent. Do not create an audit ignore, suppression,
exception, or repository-local store.

Both audits must contain zero Critical or High advisories for Passed. Record
the exact commands, exit codes, and non-sensitive summary.

### 6. Exact-SHA GitHub evidence

- Verify all three required workflow jobs are green for the exact reviewed
  `main` SHA and record those facts in Record 002.
- Reconcile relevant merged PR, Issue, and Work Packet facts.
- Do not treat a different SHA or earlier green run as evidence.

The later publication PR CI is an external merge gate. Its result is verified
on the final publication head and recorded in the PR/review completion evidence;
it is not written back into Record 002, because doing so would create a new head
and make the embedded CI result self-referential.

### 7. Publication integrity

- Create Record 002 and update only the six publication files.
- Stage exactly those six files so Git-tracked documentation checks include the
  new record.
- Check cached name/status, cached diff whitespace, explicit Prettier on all six
  files, `format:check`, `check:docs`, `repository:check`, `check:secrets`, local
  link/path/Secret scans, exact scope, untracked files, and final runtime
  residue.
- Independently review evidence accuracy and publication scope before commit.

## Acceptance criteria

1. Record 002 fixes one exact post-remediation `origin/main` commit and Record
   001 remains unchanged.
2. Every applicable Common and M2 Exit Criterion has reproducible evidence and
   a strict result.
3. For a Passed decision, root, integration, concurrent, browser, migration,
   repository, Secret, audit, cleanup, and exact-reviewed-SHA CI gates all pass
   without skips, suppressions, or weakened assertions.
4. For a Blocked decision, the failing or missing reviewed-build evidence is
   preserved accurately, no new publication-diff failure is introduced, M2
   remains In Progress, and an independently scoped remediation Issue is
   created after the decision is validated.
5. For either decision, no current-review-owned process, container, temporary
   directory, package store, generated migration, or other artifact remains;
   failure to meet cleanup is itself recorded as a blocker before owned hygiene
   cleanup is attempted.
6. Publication scope is exactly six files and all local links and documentation
   checks pass with Record 002 staged.
7. Independent reviewers validate evidence accuracy, decision correctness, and
   exact publication scope.
8. `Passed` is used only with zero unresolved Blocking Defect. Only Passed may
   set M2 to Completed; M3 remains Not Started pending separate planning.
9. `Blocked` retains M2 In Progress, records the exact blocker, and creates a
   separate remediation Issue without Conditional Pass.

## Security review

This Work Item changes no authentication, authorization, network, Object
Storage, logging, Secret, Source-safety, or process privilege boundary. Evidence
must not publish credentials, URLs containing private input, object keys,
headers, SQL, stack traces, environment values, local absolute paths, or raw
process commands. The review checks existing accepted boundaries; it does not
add speculative controls or a new hash mechanism.

## Migration and compatibility review

No Schema, migration, API, Queue, Artifact, configuration, or dependency change
is authorized. Both `db:generate` passes must be no-diff. Any generated or
compatibility delta blocks Passed and moves remediation to a separate Work
Item.

## Observability

No production Log, Metric, Trace, or Audit Event changes. The Acceptance Record
contains command-level result summaries and stable GitHub evidence only. It
does not reproduce sensitive logs.

## Documentation updates

- new immutable `docs/implementation/m2-acceptance-record-002.md`;
- this Work Packet;
- `AGENTS.md`;
- `README.md`;
- `README.zh-CN.md`;
- `docs/implementation/roadmap.md`.

No Accepted DEC or Record 001 update is permitted.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed by:

- `/root/m2_gov_006_evidence_dor` — `DEFINITION_OF_READY_REVIEWER`, requested
  `gpt-5.6-sol` / High, actual runtime `UNVERIFIED_RUNTIME_MODEL`;
- `/root/m2_gov_006_scope_dor` — `DEFINITION_OF_READY_REVIEWER`, requested
  `gpt-5.6-sol` / High, actual runtime `UNVERIFIED_RUNTIME_MODEL`.

The review confirmed exact scope, complete evidence sequence, strict
Passed/Blocked decision mechanics, executable migration and audit gates,
publication-PR authority, satisfied prerequisites, and a process-delta gate
that does not authorize changes to pre-existing local state. No Blocking Design
Question remains. Execution may begin only after this Ready Work Packet is
merged and a fresh branch is created from the latest `origin/main`.

## Definition of Done and publication rules

### Passed decision

- all reviewed-build commands, audits, cleanup checks, and exact-reviewed-SHA CI
  are green;
- Record 002 accurately records zero Blocking Defects and `Passed`;
- two independent publication reviews pass;
- the publication PR's three required CI jobs are green;
- only then may the Orchestrator squash merge, close Issue #144, and synchronize
  M2 as Completed. M3 remains Not Started.

### Blocked decision

- the failed or missing reviewed-build evidence is preserved accurately;
- Record 002 names the Blocking Defect and M2 remains In Progress;
- after independent validation of the decision, the Orchestrator opens the
  separate bounded remediation Issue and records its identifier;
- independent record-accuracy and publication-scope reviews pass;
- publication-integrity checks pass;
- the final publication PR head must still have all required CI jobs green for
  autonomous ready/merge. The unresolved reviewed-build blocker may remain only
  when it does not fail publication-PR CI;
- if the same recorded blocker causes required publication-PR CI to fail, or
  any unrelated CI, record-integrity, review, or scope failure remains, do not
  mark ready or merge; return `HUMAN_DECISION_REQUIRED`;
- publishing Blocked is not Conditional Pass, does not complete M2, and does not
  authorize M3.

For either decision, independent review PASS authorizes the Orchestrator to
commit, push, and create a draft PR. Marking ready and squash merging require
the applicable path above. The Implementer or record author never approves its
own publication.

## Rollback

Before merge, abandon only the publication branch. After merge, do not edit or
delete Record 002; any correction or new decision uses a later numbered record.
No runtime or database rollback exists because this Work Item changes no
runtime state or Schema.

## Possible new DEC

None expected. A discovered scope, architecture, security-boundary, or release-
gate conflict stops the review and returns to Decision Review; ordinary failed
evidence does not create a DEC.
