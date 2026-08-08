# M2-MAINT-002 — nanoid High Advisory Remediation

**Status:** Ready

**Issue:** [#139](https://github.com/JettxonHo/ContentOS/issues/139)

## Identification

- Task ID: `M2-MAINT-002`
- Title: nanoid High Advisory Remediation
- Milestone: M2 — Source and Workflow Foundation
- Type: Dependency Maintenance / Security Remediation
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Executor Profile: `DEPENDENCY_MAINTENANCE_IMPLEMENTER`
- Planning Logical Role: `ORCHESTRATOR_REVIEWER`
- Requested Planning Model: `gpt-5.6-sol`
- Planning Reasoning: High
- Planning Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Branch: `codex/m2-maint-002-nanoid-advisory-plan`
- Planning Base SHA: `d80e851fa3f97da759c4eab457f37ad4fb8a1cbf`
- Initial Planning Worktree: Clean on exact `origin/main`
- Required Implementation Branch:
  `codex/m2-maint-002-nanoid-advisory-remediation`, created from the latest
  `origin/main` after this Ready Work Packet merges
- Required Implementer: custom Agent `luna-worker`
- Implementer Config: `~/.codex/agents/luna-worker.toml`
- Configured Implementation Model / Reasoning: `gpt-5.6-luna` / Max
- Implementation Runtime Model Status: record the visible runtime, otherwise
  `UNVERIFIED_RUNTIME_MODEL`
- Required Independent Reviewer: separate `gpt-5.6-sol` / High Agent with
  logical role `INDEPENDENT_REVIEWER`
- Risk Classification: Bounded transitive dependency resolution

## Goal

Remove GHSA-2v37-7h3g-55p8 from the full and production dependency graphs by
resolving the current vulnerable `nanoid@3.3.16` selection to the minimum
patched `3.3.17` release, without changing product behavior, direct framework
versions, or any accepted release gate.

## Context

[M2 Acceptance Record 001](../m2-acceptance-record-001.md) reviewed exact commit
`c64fe74ab27513b07a2eb95e86c8f55b90245923` and recorded a strict `Blocked`
decision. Both required official-registry audits exited non-zero with one High
advisory and zero Critical advisories. The production path is
`@contentos/web > next@16.2.12 > postcss@8.5.23 > nanoid@3.3.16`; the full graph
also reaches the same PostCSS selection through Vitest and Vite.

The GitHub Advisory identifies `<3.3.17` as vulnerable and `3.3.17` as the
first patched 3.x release. Official npm Registry metadata records
`nanoid@3.3.17` as MIT-licensed and compatible with Node.js 24. PostCSS 8.5.23
declares `nanoid` as `^3.3.16`, so `3.3.17` is a compatible patch-level
resolution. No direct framework upgrade or new package is required.

This Work Item repairs the recorded dependency gate failure. It does not edit
the immutable Acceptance Record 001 and cannot itself mark M2 Passed or start
M3. A complete later exit review must produce a new numbered Acceptance Record.

## Relevant decisions and documents

- DEC-244 — Tests, Agent Evals, Acceptance Gates, and Production Monitoring are
  distinct.
- DEC-245 — deterministic security and domain rules use executable tests and
  validators.
- DEC-247 — the layered test system covers the affected workspace.
- DEC-259 — a blocking failure cannot be offset or conditionally averaged.
- DEC-262 — unresolved Critical or High security failures block release.
- DEC-287, DEC-288, DEC-291, and DEC-292 — bounded Work Items, focused PRs,
  Definition of Ready/Done, and implementation-detail governance.
- [M2 Acceptance Record 001](../m2-acceptance-record-001.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [Release Gates](../../quality/release-gates.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Local Quality Toolchain](../../quality/local-quality-toolchain.md)

Later Accepted DEC govern any actual conflict.

## Dependencies

- M2 Acceptance Record 001 is published through PR #140, squash merge
  `d80e851fa3f97da759c4eab457f37ad4fb8a1cbf`.
- Issue #139 is Open and contains the bounded remediation request.
- The official npm Registry and GitHub Advisory are available for package and
  audit evidence.
- This Work Packet must pass independent Definition of Ready review before
  implementation begins.

## In scope

1. Add the exact pnpm override `'nanoid@3.3.16': 3.3.17` so only the current
   vulnerable selection is redirected to the minimum patched release.
2. Regenerate the single pnpm lockfile with Node.js 24.18.0 and pnpm 11.17.0.
3. Confirm that every full and production path resolves `nanoid` only to
   `3.3.17` and that both official-registry audits report zero Critical and zero
   High advisories.
4. Run the complete existing deterministic, integration, concurrent, browser,
   migration-generation, documentation, repository, scope, cleanup, and CI
   evidence set.
5. Record exact dependency, audit, test, cleanup, PR, and merge evidence in this
   Work Packet and the Roadmap.

## Out of scope

- upgrading Next.js, PostCSS, Vite, Vitest, or any other direct or transitive
  dependency beyond the exact `nanoid` repair;
- adding a direct `nanoid` dependency, compatibility patch, application test,
  audit ignore, suppression, registry substitution, or severity
  reclassification;
- product, API, Source, Workflow, Fetcher, Queue, database, Schema, migration,
  Compose, CI, authentication, authorization, configuration, or UI behavior;
- editing M2 Acceptance Record 001;
- declaring M2 Passed or Completed, creating Acceptance Record 002, planning
  M3, or implementing M3 behavior; and
- modifying an Accepted DEC or creating a generic dependency-upgrade campaign.

## Allowed and prohibited files

### Allowed implementation files

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- this Work Packet
- `docs/implementation/roadmap.md`, limited to this Work Item status and
  remediation evidence

No other file is allowed without a Work Packet correction and independent
readiness review.

### Prohibited modules

- `apps/**`
- `packages/**`
- migrations, Drizzle metadata, schemas, Compose, environment templates,
  GitHub workflows, Decisions, Sessions, and Acceptance Record 001

### Generated files policy

`pnpm-lock.yaml` is the only authorized generated file. It must be produced by
pnpm 11.17.0 from the single exact override and must not contain an unrelated
resolution refresh. Database generation must produce no committed or untracked
Schema/migration artifact. Any task-owned repository-local or external pnpm
store, audit cache, test output, temporary directory, process, or container must
be removed before handoff; unrelated pre-existing state must not be touched.

The existing `node_modules/.modules.yaml` binds this installation to the
repository-local `.pnpm-store/v11`. Implementation must confirm that
`.pnpm-store` is absent at entry, as it was on the planning base. pnpm commands
may then create that exact repository-local store as task-owned temporary
state. Do not switch this existing installation to a different store and do not
purge or reconstruct `node_modules`. Create the lockfile only with:

```text
corepack pnpm install --lockfile-only
```

After the last package-manager command, remove only the `.pnpm-store` directory
whose absence was recorded at entry and whose creation is attributable to this
task, then verify it is absent. If `.pnpm-store` exists at entry, stop rather
than claiming or deleting it. Normal package-manager cache reads and writes are
permitted and are not task-owned cleanup targets. The task must not delete,
repair, change ownership of, or otherwise administer a global npm or pnpm cache.

## Fixed dependency contract

| Boundary                     | Before             | Required after            | Reason                                                    |
| ---------------------------- | ------------------ | ------------------------- | --------------------------------------------------------- |
| Current vulnerable selection | `nanoid@3.3.16`    | `nanoid@3.3.17`           | First patched 3.x release for GHSA-2v37-7h3g-55p8         |
| Override selector            | absent             | `'nanoid@3.3.16': 3.3.17` | Narrowly redirects only the observed vulnerable selection |
| PostCSS                      | `8.5.23`           | unchanged                 | Its `^3.3.16` range accepts the patched release           |
| Next.js                      | `16.2.12`          | unchanged                 | Direct framework upgrade is unnecessary and out of scope  |
| Vite / Vitest                | `8.1.5` / `4.1.10` | unchanged                 | Development paths use the same PostCSS selection          |
| License                      | MIT                | MIT                       | No license-boundary change                                |

The implementation may not substitute a broader override, newer `nanoid`
release, framework upgrade, or lockfile-only manual edit without correcting the
Work Packet and repeating Definition of Ready review.

## Contracts

- **Dependency contract:** the frozen pnpm lockfile resolves one patched
  `nanoid@3.3.17` across the existing full and production paths.
- **Installation contract:** `corepack pnpm install --frozen-lockfile` succeeds
  without changing the lockfile.
- **Security gate:** both official npm Registry audits at `--audit-level high`
  exit zero with zero Critical and zero High advisories and no suppression.
- **Application contracts:** all current API, Queue, Source, Workflow, Fetcher,
  browser, and persistence behavior remains unchanged.
- **Rollback contract:** a focused Git revert restores the prior override and
  lockfile state; no data rollback or migration is involved.

## Acceptance criteria

1. `pnpm why nanoid` and the lockfile show exactly one `nanoid` version,
   `3.3.17`, on both the Next/PostCSS production path and the
   Vitest/Vite/PostCSS development path.
2. Full and production official-registry audits exit zero with zero Critical
   and zero High advisories, without ignore, suppression, severity change, or
   registry replacement.
3. The frozen install, exact eleven-workspace check, root quality gate, all five
   application builds, integration harness, concurrent harness, and 16-test
   browser harness pass without changing behavior or weakening a test.
4. Two consecutive database-generation passes report no Schema change and do
   not alter the intended implementation diff or create an untracked migration.
5. The diff contains only the four allowed files. Direct dependencies,
   application/package source, Schema, migrations, Compose, CI, and Acceptance
   Record 001 are unchanged.
6. Documentation, Decision references, Secrets, local paths, whitespace,
   generated artifacts, temporary stores, processes, containers, and owned
   runtime residue checks pass.
7. Independent review passes and all three required GitHub CI jobs are green on
   the exact PR head before squash merge.
8. Documentation states only that M2-MAINT-002 remediates BD-M2-001. M2 remains
   In Progress, M3 remains Not Started, and a later full review must publish a
   new numbered Acceptance Record.

## Required tests and commands

```text
node --version
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm why nanoid
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm db:generate
corepack pnpm db:generate
corepack pnpm --registry=https://registry.npmjs.org audit --audit-level high
corepack pnpm --prod --registry=https://registry.npmjs.org audit --audit-level high
git diff --check
```

Capture the intended file set before each `db:generate` pass and require the
same tracked/untracked set afterward. Before and after each pass, require an
empty content diff for `packages/database/src/schema.ts`, `drizzle.config.ts`,
`migrations/**`, and `migrations/meta/**`, plus no untracked file under those
paths. A stable path list alone is not enough; the actual prohibited-file diff
must remain empty.

All pnpm commands use the installation's existing repository-local store
binding described in Generated Files Policy. Final scope evidence must include
`git status --short --untracked-files=all`, tracked and untracked file lists,
and an exact comparison to these four authorized paths:

```text
pnpm-workspace.yaml
pnpm-lock.yaml
docs/implementation/work-packets/m2-maint-002-nanoid-advisory-remediation.md
docs/implementation/roadmap.md
```

Delete only the task-owned repository-root `.pnpm-store` after the last
package-manager command and prove that the path is absent, restoring the entry
state without changing `node_modules`. Do not delete, repair, change ownership
of, or otherwise administer a global package-manager cache as part of this Work
Item.

## Security review

This task changes no external-input, credential, network, authentication,
authorization, Object Storage, logging, or private-content boundary. It removes
one inherited High advisory solely because the accepted release gate requires
zero unresolved High issues. Do not add speculative security mechanisms or a
bespoke `nanoid` behavior matrix; existing application and browser regressions
are the proportional compatibility evidence.

Any remaining Critical or High advisory, audit suppression, Secret exposure,
or owner/runtime boundary regression blocks completion.

## Migration and compatibility review

There is no database, Schema, API, Queue, Artifact, Agent, Prompt,
configuration, or data migration. Compatibility risk is limited to a patch
release inside PostCSS's declared range and is covered by frozen installation,
the complete existing quality/integration/browser suite, and exact dependency
graph evidence. No backfill or compatibility sequencing is required.

## Observability

No application log, metric, trace, or Audit Event changes. The dependency
graph, official-registry audits, lockfile, command results, CI, and completion
report are the evidence.

## Documentation updates

- This Work Packet records Ready, implementation, independent review, and
  final merge evidence.
- The Roadmap records only this bounded remediation status and keeps M2 In
  Progress and M3 Not Started.
- M2 Acceptance Record 001 remains immutable. A later independently reviewed
  task may create Acceptance Record 002 after the full M2 evidence set is rerun.
- No Decision Register or Current-truth architecture document changes.

## Definition of Ready

**PASS.** Two independent `gpt-5.6-sol` / High Definition of Ready reviewers
confirmed the bounded plan on
`d80e851fa3f97da759c4eab457f37ad4fb8a1cbf`:

- `/root/m2_maint_002_dependency_dor` verified the exact dependency paths,
  official patched floor, license and Node compatibility, pnpm 11.17.0 selector
  behavior, expected lockfile delta, test plan, and rollback.
- `/root/m2_maint_002_governance_dor` verified legal status, branch and model
  routing, four-file scope, repository-local task-owned store lifecycle,
  content-level database no-diff evidence, cleanup, and Git authority.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`; actual runtime
model visibility was unavailable and is recorded as `UNVERIFIED_RUNTIME_MODEL`.
There is no Blocking Design Question and no new DEC is required. Implementation
may begin only from the required post-merge branch and latest `origin/main`.

## Definition of Done

All acceptance criteria are evidenced on one focused diff; both final
official-registry audits and all required local/CI checks pass; independent
review has no unresolved finding; Issue #139 closes through the merged PR; no
owned residue remains; M2 remains In Progress and M3 remains Not Started.

## Git authority

The Implementation Agent may modify only the allowed files and must stop before
Git publication. After independent review passes, the Orchestrator may commit,
push, and create a draft PR. The Orchestrator may mark the PR ready and squash
merge only after all required CI is green and no unresolved finding or
escalation item remains. The implementer cannot approve or merge its own work.

## Completion report requirements

Report Summary; logical role/requested custom Agent/configured model/reasoning/
actual runtime status; branch and base SHA; exact dependency paths and versions;
files changed; lockfile delta; commands and tests; official-registry audits;
Acceptance Criteria; security impact; known limitations; incomplete items;
documentation; possible new DEC; cleanup; and Git status.
