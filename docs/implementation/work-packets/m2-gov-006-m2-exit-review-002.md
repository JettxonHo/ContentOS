# M2-GOV-006 — M2 Exit Review and Acceptance Record 002

**Status:** In Review — Explicit Orchestrator planning-publication handoff recorded

**Issue:** [#144](https://github.com/JettxonHo/ContentOS/issues/144) is Open;
the Orchestrator synchronizes body parity to this final planning head.

## Identification

- **Task ID:** `M2-GOV-006`
- **Title:** M2 Exit Review and Acceptance Record 002
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Milestone Exit Review / immutable Acceptance Record
- **Owner:** Orchestrator Reviewer
- **Definition of Ready reviewers:** `/root/m2_gov_006_dor_correctness` and
  `/root/m2_gov_006_dor_governance`
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model:** `gpt-5.6-sol`
- **Reasoning:** High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_006_current_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-006-current-plan-wt`
- **Planning branch:** `codex/m2-gov-006-exit-review-current-plan`
- **Planning base/HEAD:** `60fca9cf4e75b8efaafd072f22a510a5662699ec`
- **Planning shape:** tracked `M` this Packet + tracked `M` Roadmap only
- **Planning-publication handoff:** explicitly recorded by Orchestrator `/root`
  after dual DoR PASS and Ready-sync mechanical PASS
- **Relevant DEC:** DEC-244–DEC-266, DEC-267–DEC-293
- **Risk classification:** formal milestone acceptance and progression gate

## Goal

After this planning change is independently reviewed and merged, create a
fresh worktree from the then-latest `origin/main`, freeze that one exact commit,
execute the complete M2 exit evidence locally on that commit, and publish a new
immutable M2 Acceptance Record 002 with exactly one decision: `Passed` or
`Blocked`.

A Passed decision may complete M2. It must leave M3 Not Started. A Blocked
decision must leave M2 In Progress and M3 Not Started. This Work Item never
creates a Conditional Pass.

## Current truth and historical disposition

[M2 Acceptance Record 001](../m2-acceptance-record-001.md) remains immutable
historical Blocked evidence on
`c64fe74ab27513b07a2eb95e86c8f55b90245923`. Its recorded `nanoid` advisory
was remediated by M2-MAINT-002 through PR #142; that does not retroactively
change Record 001.

Earlier M2-GOV-006 execution/publication attempts and the long QUAL003–QUAL043
diagnostic chain are historical evidence. They do not authorize inheriting a
test, audit, migration, cleanup, or CI result into this review. The current
effective chain is:

- PR #263 published the complete Worker observation repair; its first eligible
  CI run `31562708126` passed all three required jobs. PR #264 reconciled that
  publication through run `31564293179` and squash
  `33a4b49ed2f8a8176d9e66764a4ee61c79b46e61`.
- PR #268 published the Concurrent final-success record; run `31571915677`
  passed all three required jobs, and PR #270 reconciled that result through
  run `31572829710`.
- M2-GOV-007 completed through PR #272, first eligible run `31573486677`, and
  squash merge `60fca9cf4e75b8efaafd072f22a510a5662699ec`.
- Issues #267, #269, and #271 are Closed/Completed. Issues #175 and #184 are
  Closed/Not Planned with their objectives explicitly not completed. Their
  historical Blocked evidence is preserved; later effective success removed
  the diagnostic need without retroactive completion.
- Issue #144 remains Open as the sole M2 exit-review authority. M2 remains In
  Progress and M3 remains Not Started.
- Current planning base `60fca9cf4e75b8efaafd072f22a510a5662699ec`
  also has exact-SHA push run `31573745743`, with Docker-independent quality,
  Integration smoke, and M1/M2 browser smoke all successful. This is planning
  context only; the execution review must verify the later frozen reviewed
  commit's own existing three-job push CI.

This Packet replaces every earlier M2-GOV-006 readiness/execution plan. It does
not erase or reclassify any historical attempt. No Acceptance Record 002 has
been merged.

## Authority and decision rules

Authority follows:

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ Issue #144
→ this Work Packet
→ Agent judgment
```

The [Milestone Exit Criteria](../milestone-exit-criteria.md),
[M2 Acceptance Harness](../../quality/m2-acceptance-harness.md),
[Test Strategy](../../quality/test-strategy.md), and
[Release Gates](../../quality/release-gates.md) govern the decision.

`Passed` requires every applicable Common and M2 Exit Criterion, every local
gate in this Packet, both official-registry audits with zero Critical or High
advisories, zero owned residue, the reviewed SHA's existing three-job push CI,
publication integrity, two independent reviews, and no Blocking Defect.

Any red, missing, unsafe, stale, inherited, or contradictory required result
forces `Blocked`. The first such result freezes the reviewed-build execution:
no same-head rerun, replacement command, repair, new execution head, or
criterion weakening is permitted. The Orchestrator may perform only exact
task-owned hygiene cleanup, read-only evidence capture, and the strict Blocked
six-file publication. Every not-reached gate is recorded as `Not Run — stopped
at first red`; it is never reported as Passed.

## Preconditions

- M0 and M1 have Passed immutable Acceptance Records.
- M2 Source, Workflow, Fetcher, Workspace, and acceptance-harness delivery is
  merged on `main`.
- Record 001 is immutable and remains unchanged.
- M2-GOV-007 is completed; #175/#184 are Not Planned without completion; #271
  is Completed; #144 is Open.
- The planning publication must merge before execution begins.
- Execution must start in a new worktree and branch from the then-latest exact
  `origin/main`; the planning worktree is never reused as the execution tree.
- No Blocking Design Question may remain after independent Definition of Ready
  review.

## Relevant decisions and documents

- DEC-244–DEC-266 — deterministic tests, evidence, recovery, CI, and release
  gates.
- DEC-267–DEC-286 — MVP scope, milestone order, and completion boundary.
- DEC-287, DEC-288, DEC-291–DEC-293 — bounded Work Items, focused PRs,
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
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [Work Item Template](../work-item-template.md)

Later Accepted DEC govern any actual conflict.

## In scope

1. Merge this independently reviewed planning exact-two change before exit
   execution.
2. Freeze one exact fresh latest `origin/main` commit as the reviewed build.
3. Execute every required M2 local gate in this Work Item; do not inherit any
   prior local result.
4. Verify the reviewed SHA's own pre-existing push CI has the exact three
   required successful jobs without triggering a rerun.
5. Publish immutable Record 002 and synchronize the five other publication
   documents to either Passed or Blocked.
6. After the six-file publication merges, publish one fresh tracked exact-two
   Packet/Roadmap reconciliation without modifying Record 002.

## Out of scope

- editing, replacing, or reclassifying Record 001;
- product, test, fixture, runner, dependency, lockfile, config, Schema,
  migration, Compose, CI, API, or runtime changes;
- repairing a discovered failure inside the exit review;
- inheriting historical local evidence or using a different SHA's CI;
- changing an Accepted DEC, security boundary, release gate, or criterion;
- creating a hash mechanism, suppression, exception, retry, or alternate
  registry;
- cleaning or terminating any process, container, volume, directory, store,
  or other state that existed in the entry safe-count baseline;
- planning or implementing Research, Agent, Render, Export, deployment, M3, or
  any later milestone.

## The 2 / 6 / 2 lifecycle

The physical lifecycle is fixed and phase-specific:

| Phase                    | Exact tracked shape                                                                | Meaning                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Planning                 | this Packet + Roadmap                                                              | Current executable plan only; no exit evidence and no Ready self-declaration. |
| Exit publication         | Record 002 + this Packet + Roadmap + `AGENTS.md` + `README.md` + `README.zh-CN.md` | Strict Passed or Blocked publication. Record 001 remains zero-diff.           |
| Postmerge reconciliation | tracked this Packet + tracked Roadmap                                              | Record publication PR/merge/Issue facts only; Record 002 is immutable.        |

No phase may borrow another phase's file allowance. Code/runtime paths remain
zero-diff in all three phases.

## Acceptance Record contract

Record 002 must contain:

1. Milestone ID, status, exact Reviewed Commit, Work Item/Issue, date and
   timezone timestamp, logical reviewer role, requested model, reasoning,
   thread, actual runtime status, and strict Decision.
2. Prerequisite, remediation, historical-attempt, and current effective-chain
   traceability.
3. Required deliverables and Common Exit Criteria matrices.
4. The complete M2 evidence matrix.
5. An explicit `Demo Result`, using the Browser/M2 acceptance journey and its
   deterministic backend evidence as the M2 demonstration result.
6. Every command's literal argv identity, fixed cwd, structured exit status,
   count/result summary, and explicit not-run reason after first red.
7. Two complete `db:generate` no-diff ledgers.
8. Full and production official-registry audit results.
9. Exact reviewed-SHA existing three-job push CI evidence.
10. Entry/final safe-count and command-owned cleanup evidence.
11. Security, repository, documentation, and Secret results.
12. Known Limitations, Blocking Defects, final Decision, and next action.

Do not publish credentials, private input, object keys, headers, SQL, stack
traces, environment values, absolute local paths, PIDs, raw process commands,
temporary URLs, or raw child output.

## M2 evidence matrix

Record 002 evaluates each criterion independently:

| Criterion                    | Required interpretation                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| SSRF denial                  | Restricted targets fail closed with no Source evidence or ordinary bypass.                                          |
| Upload Quarantine            | Only Pasted Text, `.md`, and `.txt` formal inputs create Source graphs; denial has zero Object Storage side effect. |
| Raw Snapshot / Safe Display  | Raw bytes are never rendered; review uses deterministic non-executable plain text.                                  |
| Approved Source Version      | Human Approval binds the exact immutable current Version.                                                           |
| URL failure fallback         | URL failure remains visible; Paste/Upload fallback creates an independent formal Source.                            |
| Duplicate Queue protection   | Duplicate, stale, or terminal delivery creates no duplicate Result, Source, Version, Approval, or promotion.        |
| Outbox recovery              | PostgreSQL Outbox recovery does not make Redis authoritative.                                                       |
| Redis-loss reconciliation    | Missing Jobs are repaired from PostgreSQL truth.                                                                    |
| Lease recovery               | Expired work advances one fenced generation and rejects stale heartbeat/result.                                     |
| SSE fallback                 | SSE is notification-only; disconnect recovers through bounded REST polling.                                         |
| Workflow Timeline            | Owner-scoped ordered safe Events come from PostgreSQL-backed REST projection.                                       |
| Approved-only Research input | Internal projection returns only exact current Approved Versions and does not implement Research.                   |

## Governed execution contract

Every command is one independent literal process invocation with the fixed
execution worktree as cwd and a returned structured terminal `exit_code`.
There are no combined shells, pipelines, loops, wrappers, marker files,
inferred statuses, or status-variable interpolation. If a tool yields a live
session, only empty-input polling of that same session is allowed, at intervals
of at most 60 seconds, until the one original invocation returns a terminal
status. No replacement invocation is allowed.

The Orchestrator resolves the fresh branch, absolute cwd, Reviewed Commit,
reviewed-CI run ID, and one `mktemp` audit-store path before their dependent
commands. It writes the returned values into an immutable command ledger.
Angle-bracket tokens below are construction-time ledger fields only; no command
containing an angle bracket may execute. Before execution, every dependent
command is rendered once with the resolved value as a literal argv token. Shell
variables, command substitution, pipes, loops, heredocs, compound commands,
temporary status files, and wrappers are prohibited.

Unless a command explicitly names the repository entry checkout as its cwd,
every execution-gate command uses the resolved absolute `<EXECUTION_CWD>` as
its fixed cwd. Every listed expected status is the structured process
`exit_code`; expected output is an additional predicate and never substitutes
for terminal status. The first unexpected status/output freezes the sequence.

### Gate 0 — planning merge and fresh execution identity

Only after the planning PR merges, use repository entry cwd
`/Users/ketchup/Projects/ContentOS` for these independent commands:

```text
git fetch --prune origin
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-006-exit-review-002-current
git worktree add -b codex/m2-gov-006-exit-review-002-current /private/tmp/contentos-m2-gov-006-exit-review-current-wt <REVIEWED_SHA>
```

Expected statuses are respectively `0`, `0`, `1`, and `0`. The second command
must emit exactly one lowercase 40-hex SHA; ledger that literal as
`<REVIEWED_SHA>`. Status `1` from `show-ref` is the one planned nonzero success
predicate and proves the fixed branch is absent before creation; any other
status is red. Before the fourth command, substitute the ledgered SHA as its
literal final argv token. The worktree path and branch are fixed above; if
either already exists or worktree creation fails, stop red rather than delete,
reuse, or rename anything.

Then set `<EXECUTION_CWD>` in the ledger to the exact literal
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt` and run from that cwd:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --check
git diff --exit-code <REVIEWED_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

All six statuses must be `0`. Outputs must be, in order: exact branch
`codex/m2-gov-006-exit-review-002-current`; exact ledgered SHA; exact ledgered SHA;
empty; empty; empty. Substitute the SHA literally in the last command. These
are pure-Git identity/cleanliness/Record001-zero gates; no non-Git command runs
before all pass.

The planning base `60fca9c…` is never automatically the Reviewed Commit.

### Gate 1 — pinned runtime, injection, install, and workspace

From fixed `<EXECUTION_CWD>`, render and run these independent literal argv
commands once:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e 'const names=["CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE","CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE","CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY","CONTENTOS_SMOKE_INJECT_FAILURE","CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE","CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE","CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE","CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE","CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE","CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE","CONTENTOS_BROWSER_INJECT_FAILURE"];const set=names.filter((name)=>Object.hasOwn(process.env,name));process.stdout.write(set.length?`injection-env-set=${set.join(",")}\n`:"injection-env=unset\n");process.exitCode=set.length?1:0'
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

All statuses must be `0`. Expected version outputs are Node `v24.18.0` and pnpm
`11.17.0`; the injection command must emit exactly `injection-env=unset`; and
workspace resolution must report exactly five applications and six packages.
The fixed injection check inspects exactly these names:

- `CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY`
- `CONTENTOS_SMOKE_INJECT_FAILURE`
- `CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE`
- `CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE`
- `CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE`
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE`
- `CONTENTOS_BROWSER_INJECT_FAILURE`

Any present name is red. The check prints names only, never values.

### Gate 2 — safe entry baseline

Run one predeclared Node 24 observer once after install and before root/runtime
gates. It may inspect only:

- the aggregate count of compiled ContentOS API/Worker/Fetcher/Renderer
  entry-point processes;
- the aggregate count of `contentos-smoke-*` Compose projects;
- the aggregate count of `contentos-smoke-*` OS temporary roots; and
- whether a repository-local `.pnpm-store` exists.

Its fixed literal form is:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Its status must be `0`, and it emits exactly the four integer/boolean fields
shown without identity, PID, command, environment value, path, token, URL, or
raw runtime output. `compiled` deliberately does not claim to observe the
Next/Web start process. Web ownership remains covered by the Integration and
Browser Harness claim/control records: each runtime gate must explicitly prove
its claim-owned Web process stopped and its Web control/residue check passed.
Missing, incomplete, or failed claim-owned Web cleanup evidence is red even if
all four aggregate safe counts match.

This is an entry safe-count baseline only and authorizes no cleanup. After each
runtime command and at final closeout, run the same literal observer once and
require status `0` plus no positive aggregate delta, while the command's own
claim-bound API/Web/Compose/temp cleanup evidence must also report zero owned
residue. A count decrease does not become review evidence and does not
authorize attribution to this review.

### Gate 3 — root deterministic gate

Run exactly once:

```text
fnm exec --using=24.18.0 corepack pnpm check
```

Record format/lint/typecheck/unit/build counts actually returned. A red or
missing terminal status freezes execution; do not rerun under another
permission mode, even if the historical chain once used such a distinction.

### Gate 4 — local runtime gates

Run these exact commands once each, in order, only while all prior gates are
green:

```text
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent
fnm exec --using=24.18.0 corepack pnpm test:browser
```

Each command must return its own explicit terminal success and existing
claim-bound cleanup success. Immediately after each, run the safe-count
observer once. No result from any prior Work Item, local attempt, CI job, or
other SHA satisfies these gates.

### Gate 5 — two complete migration no-diff passes

Run `fnm exec --using=24.18.0 corepack pnpm db:generate` exactly twice. After
each pass, independently run all of the following before starting the next
pass or another gate:

```text
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code -- packages/database/src/schema.ts drizzle.config.ts migrations
git diff --exit-code <REVIEWED_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Each complete set must be green and the status output must be empty. This
detects tracked and untracked generated output; `git diff --check` is not a
substitute. The required Integration gate supplies committed migration/runtime
evidence; this Work Item creates no migration.

### Gate 6 — two official-registry dependency audits

From fixed `<EXECUTION_CWD>`, run this independent literal command exactly once:

```text
mktemp -d /private/tmp/contentos-m2-gov-006-audit.XXXXXXXX
```

Require status `0` and exactly one absolute path. Ledger the exact output as
`<AUDIT_STORE>`. The successful `mktemp` call establishes that the path was
newly created in this review. Before any audit, substitute that exact literal
path and the fixed execution cwd into this validation command:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync}=require("node:fs");const {relative,sep}=require("node:path");const p=realpathSync("<AUDIT_STORE>");const repo=realpathSync("<EXECUTION_CWD>");const s=lstatSync(p);const outside=relative(repo,p)===".."||relative(repo,p).startsWith(`..${sep}`);if(!p.startsWith("/private/tmp/contentos-m2-gov-006-audit.")||!outside||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);process.stdout.write("audit-store=validated\n")'
```

Require status `0` and exact output `audit-store=validated`. A validation red
stops audit entry but still permits the exact-path ownership revalidation and
hygiene commands below only when ownership can be proven. After validation,
render these two audit invocations with the same ledgered path as a literal
`--store-dir` argv token and run them independently, in order:

```text
fnm exec --using=24.18.0 corepack pnpm --store-dir <AUDIT_STORE> --registry=https://registry.npmjs.org audit --audit-level high
fnm exec --using=24.18.0 corepack pnpm --store-dir <AUDIT_STORE> --prod --registry=https://registry.npmjs.org audit --audit-level high
```

Each expected status is `0`, and each output must report zero Critical and zero
High advisories. If the first audit is red, the second is `Not Run — stopped at
first red`. After the second audit—or immediately after the first red—render
and run these independent exact-path hygiene commands:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,rmSync}=require("node:fs");const p=realpathSync("<AUDIT_STORE>");const s=lstatSync(p);if(!p.startsWith("/private/tmp/contentos-m2-gov-006-audit.")||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);rmSync(p,{recursive:true})'
fnm exec --using=24.18.0 node -e 'const {existsSync}=require("node:fs");if(existsSync("<AUDIT_STORE>"))process.exit(1);process.stdout.write("audit-store=absent\n")'
```

Require status `0` from both and exact final output `audit-store=absent`. They
may delete only the validated task-created path. No global cleanup, alternate
store, retry, second audit after first red, registry substitution, ignore, or
suppression is allowed.

### Gate 7 — repository, documentation, and Secret evidence

While the execution worktree is still pre-publication clean, run each once:

```text
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
git status --short --untracked-files=all
git diff --exit-code <REVIEWED_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require all RC0, empty status, and Record 001 zero-diff.

### Gate 8 — exact Reviewed Commit existing push CI

From fixed `<EXECUTION_CWD>`, first render this read-only query with the
ledgered Reviewed Commit as the literal `head_sha` form value:

```text
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<REVIEWED_SHA> -f event=push -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
```

Require status `0` and one six-field line. The SHA/event/attempt/status/
conclusion fields must exactly equal `<REVIEWED_SHA>`, `push`, `1`,
`completed`, and `success`. Ledger the first field as `<REVIEWED_CI_RUN_ID>`;
a missing/empty line is red. Then substitute both ledgered values literally
and run these two independent predicates:

```text
gh api repos/JettxonHo/ContentOS/actions/runs/<REVIEWED_CI_RUN_ID> --jq 'if (.id==<REVIEWED_CI_RUN_ID> and .head_sha=="<REVIEWED_SHA>" and .event=="push" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reviewed-ci=verified" else error("reviewed-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<REVIEWED_CI_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reviewed-ci-jobs=verified" else error("reviewed-ci-jobs-invalid") end'
```

Both statuses must be `0`, with exact outputs `reviewed-ci=verified` and
`reviewed-ci-jobs=verified`. This proves the earliest returned push run for the
exact SHA is attempt 1 and has exactly these successful jobs:

- Docker-independent quality;
- Integration smoke (Docker);
- M1/M2 browser smoke (Chromium).

A missing run/job, different SHA, attempt other than 1, extra/missing job,
cancelled/skipped job, or non-success conclusion is red. Do not dispatch,
rerun, replace, or borrow another SHA's run.

### Gate 9 — strict six-file publication

Only after Gate 8 is terminal—or immediately after the first earlier red—write
the strict decision publication using exactly:

- `docs/implementation/m2-acceptance-record-002.md`;
- this Packet;
- `docs/implementation/roadmap.md`;
- `AGENTS.md`;
- `README.md`;
- `README.zh-CN.md`.

Record 001 and all code/config/runtime paths remain zero-diff. From fixed
`<EXECUTION_CWD>`, run the following independent commands in this order; render
the ledgered Reviewed Commit literally wherever shown:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/roadmap.md AGENTS.md README.md README.zh-CN.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/roadmap.md AGENTS.md README.md README.zh-CN.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/roadmap.md AGENTS.md README.md README.zh-CN.md
git diff --cached --name-status
git diff --cached --check
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
git status --short --untracked-files=all
git diff --name-only <REVIEWED_SHA>
git ls-files --others --exclude-standard
git diff --exit-code <REVIEWED_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <REVIEWED_SHA> -- . ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/roadmap.md' ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Every status must be `0`. Cached and working-tree name/status output must
contain exactly the six allowed paths (Record 002 is `A`; the other five are
`M`) and no other entry. `git diff --name-only` must emit exactly those six
paths; `git ls-files --others --exclude-standard`, both `diff --exit-code`
commands, cached/general diff checks, and Record001-zero output must be empty.
The final safe-count output must have no positive entry delta, and the runtime
ledger must independently contain complete claim-owned Web cleanup/residue
success. Missing Web cleanup evidence is red.

Two independent reviewers must inspect the real diff and evidence:

1. evidence accuracy and decision correctness;
2. exact publication scope, security, migration, documentation, and immutable
   record boundary.

The author does not approve its own record.

## Decision and publication lifecycle

### Passed

- Every local gate ran in this Work Item and is green.
- Both audits are zero Critical/High.
- Existing exact-SHA attempt-1 push CI has all three required successful jobs.
- Entry/final safe counts have no positive delta and every runtime command
  reports zero owned residue.
- Record 002 reports no Blocking Defect and `Passed`.
- The six-file publication may set M2 to Completed; M3 remains Not Started.

### Blocked

- The first red/missing result and every unearned later gate are recorded
  exactly.
- No repair, rerun, replacement head, inherited result, waiver, or Conditional
  Pass occurs.
- Record 002 reports `Blocked`; M2 remains In Progress and M3 Not Started.
- After independent validation, any remediation uses a separate bounded Work
  Item/Issue and a later numbered Acceptance Record.

For either decision, independent review PASS authorizes the Orchestrator to
commit, push, and open the six-file PR. The PR's own first eligible
quality/Integration/Browser jobs must all pass before squash merge. This
publication-head CI is merge evidence, not Reviewed Commit evidence, and is
not written back into Record 002.

A red or missing planning-publication or six-file-publication local check,
review, or first eligible CI freezes that candidate and closes its PR unmerged.
There is no same-head rerun, replacement, or automatic correction. A separately
numbered bounded recovery Work Item must own any continuation.

The six-file merge makes immutable Record 002 and its strict M2 decision
effective: Passed makes M2 Completed; Blocked leaves M2 In Progress. In either
case M3 remains Not Started and Issue #144 remains Open until postmerge
reconciliation completes.

After the six-file merge, a fresh latest-main branch updates only this tracked
Packet and the tracked Roadmap with publication PR, run, squash SHA, still-Open
Issue, and effective decision facts. Its two independent reviews, final
docs/static/exact-two checks, first eligible quality/Integration/Browser CI,
and squash merge must all pass. Only after that exact-two merge may the
Orchestrator close Issue #144 as Completed, meaning the exit-review Work Item
published and reconciled its strict decision; a Blocked M2 remains In Progress.

A red or missing postmerge exact-two check, review, CI job, or merge result does
not reverse or edit effective Record 002 and does not reverse its effective M2
status. It keeps #144 Open and transfers reconciliation only to a separately
numbered docs-recovery Work Item with no same-head rerun or replacement. Once
Record 002 is merged, no recovery may edit it.

## Acceptance criteria

1. Planning publishes exact two files and is merged before execution.
2. Execution uses a fresh latest-main worktree and freezes one exact Reviewed
   Commit; Record 001 stays zero-diff.
3. All required local evidence is executed in this Work Item with literal argv,
   fixed cwd, structured terminal status, and first-red stopping.
4. Passed requires every deterministic, runtime, migration, audit, repository,
   Secret, cleanup, and exact-SHA CI gate green.
5. Blocked preserves the first failure without repair or rerun and publishes a
   strict immutable Blocked Record 002.
6. Publication is exact six files; postmerge reconciliation is tracked exact
   two files; code/config/runtime changes are zero.
7. Two independent reviewers validate each governed publication boundary.
8. Only Passed may complete M2. M3 remains Not Started in every outcome.
9. Six-file merge makes the decision effective while #144 remains Open; only a
   merged tracked exact-two reconciliation allows #144 to close Completed.

## Security review

Review-only. This Work Item changes no Authentication, Authorization, network,
Object Storage, logging, Secret, Source-safety, or privilege boundary. It
checks existing accepted controls. Evidence is sanitized and aggregate. No new
hash, credential, provider transmission, suppression, or speculative hardening
is authorized.

## Migration and compatibility review

No database, Schema, API, Queue, Artifact, Prompt, configuration, dependency,
or compatibility change is authorized. Each of the two generation passes must
have a complete empty-status/content-diff/Record001-zero proof. Any delta is a
Blocking Defect and belongs to a separate remediation Work Item.

## Observability

No production Log, Metric, Trace, Audit Event, or correlation contract changes.
Record 002 stores only bounded command summaries, counts, stable Git/GitHub
evidence, safe cleanup counts, and the decision.

## Documentation updates

- Planning: this Packet and Roadmap only.
- Exit publication: new Record 002, this Packet, Roadmap, `AGENTS.md`,
  `README.md`, and `README.zh-CN.md`.
- Postmerge reconciliation: this tracked Packet and tracked Roadmap only.
- Record 001 and Accepted DEC: no change.

## Planning verification chronology

On planning base/HEAD
`60fca9cf4e75b8efaafd072f22a510a5662699ec`, the Node 24 targeted
Packet/Roadmap Prettier write returned RC0 and materialized 571 ignored
dependency packages in the fresh worktree. It created no tracked or untracked
publication path. The subsequent independent targeted Prettier check,
Node 24 `repository:check`, `git diff --check`, and exact-two status each
returned RC0. Status was exactly tracked `M` this Packet plus tracked `M`
Roadmap. No exit runtime, test, audit, migration, cleanup, GitHub mutation, or
Acceptance Record command ran in planning.

The four-finding DoR correction then changed only this Packet and Roadmap. Its
Node 24 targeted formatter write returned RC0 with both files unchanged;
targeted Prettier check, Node 24 `repository:check`, `git diff --check`, exact-
two status/name-only, and Record001-zero checks each independently returned
RC0. Status remained exactly tracked `M` this Packet plus tracked `M` Roadmap.

After this final wording sync, the same targeted check, repository, diff,
exact-two, and Record001-zero commands ran independently with RC0 and no later
edit. The Orchestrator synchronized Issue #144 body parity to that final
planning head.

Before merging planning PR #273, a read-only Gate 0 precondition check found
the older local branch `codex/m2-gov-006-exit-review-002` already existed.
Nothing was deleted, reused, or renamed. This planning head instead fixes the
previously absent branch `codex/m2-gov-006-exit-review-002-current` and absent
worktree path `/private/tmp/contentos-m2-gov-006-exit-review-current-wt`.
Because that correction creates a new PR head, run `31576674949` remains green
historical evidence for the earlier head but cannot authorize merge of this
corrected head; new exact-head reviews, static checks, and first eligible CI
are required.

## Definition of Ready

**Ready; explicit Orchestrator planning-publication handoff recorded.** The plan
fixes the 2/6/2 lifecycle, current authority and Issue facts, full local evidence
sequence, first-red behavior, Passed/Blocked rules, and file boundaries. Issue
#144 parity is synchronized. Independent reviewers
`/root/m2_gov_006_dor_correctness` and
`/root/m2_gov_006_dor_governance`, both acting as
`DEFINITION_OF_READY_REVIEWER` with requested `gpt-5.6-sol` High and actual
`UNVERIFIED_RUNTIME_MODEL`, reviewed planning base/HEAD `60fca9cf...`, the
corrected physical exact-two, Record001-zero, and live Issue parity. Both
returned PASS with no findings, no Blocking Design Question, and no DEC. Their
authority is planning DoR/Ready eligibility only. Orchestrator `/root` now
grants only the exact-two planning commit/PR/first-eligible-CI/merge handoff;
exit implementation, Issue transition, M2 completion, and M3 remain ungranted
until the later fresh-main execution handoff.

## Definition of Done

The Work Item is done only after the strict six-file decision publication is
merged, Issue #144 is reconciled, Record 002 is immutable, the fresh postmerge
tracked exact-two reconciliation is independently reviewed and merged, and
the final repository truth reflects Passed/M2 Completed or Blocked/M2 In
Progress while M3 remains Not Started.

## Rollback

Before merge, abandon only the relevant planning/publication/reconciliation
branch. After Record 002 merges, never edit or delete it; a correction or new
decision uses a later numbered Acceptance Record. There is no runtime/database
rollback because this Work Item authorizes no runtime or Schema change.

## Possible new DEC

None expected. An actual scope, architecture, security-boundary, workflow, or
release-gate conflict stops the review and returns to Decision Review. An
ordinary red gate does not create a DEC.
