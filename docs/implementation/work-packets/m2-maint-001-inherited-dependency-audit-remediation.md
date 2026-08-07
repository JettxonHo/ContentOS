# M2-MAINT-001 — Inherited Dependency Audit Remediation

**Status:** Ready

**Issue:** [#95](https://github.com/JettxonHo/ContentOS/issues/95)

## Identification

- Task ID: `M2-MAINT-001`
- Title: Inherited Dependency Audit Remediation
- Milestone: M2 — Source and Workflow Foundation
- Type: Dependency Maintenance / Security Remediation
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Logical Role: `WORK_ITEM_PLANNER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root`
- Planning Base SHA: `88f18884491e797071191788bc0e752fd60446ca`
- Risk Classification: Bounded transitive dependency and build-tool compatibility

## Goal

Remove every current Critical or High official-registry dependency advisory from
the latest M2 baseline using the smallest compatible patched transitive
versions, without upgrading direct frameworks or changing product behavior.

## Context

The official npm-registry audit on planning base `88f1888` reports four High
advisories:

| Package           | Installed | Minimum patched | Current path class                             |
| ----------------- | --------- | --------------- | ---------------------------------------------- |
| `fast-uri`        | `3.1.4`   | `3.1.5`         | Fastify/Ajv validation dependencies            |
| `fast-uri`        | `4.1.1`   | `4.1.2`         | Fastify JSON serialization dependencies        |
| `brace-expansion` | `5.0.8`   | `5.0.9`         | ESLint/minimatch development-tool dependencies |
| `js-yaml`         | `4.3.0`   | `4.3.1`         | ESLint configuration dependencies              |

Issue #95 already authorizes a bounded review of the inherited `fast-uri` and
`brace-expansion` paths. The `js-yaml` advisory is the same class of inherited
transitive maintenance and is included because it is also present in the exact
M2 Exit baseline. M2 cannot pass while a High security issue remains unresolved.

The repository already pins `brace-expansion@5.0.8` and applies a one-line
CommonJS compatibility patch required by the installed minimatch generations.
The upstream 5.0.9 package retains the bounded-expansion API but still requires
that compatibility behavior in this repository.

## Relevant decisions and documents

- DEC-244 — Tests and Acceptance Gates remain distinct.
- DEC-245 — deterministic rules use executable tests and validators.
- DEC-247 — the layered test baseline covers the affected workspace.
- DEC-259 — a blocking security failure cannot be averaged away.
- DEC-262 — unresolved Critical or High security failures block acceptance.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Item, focused PR,
  Definition of Ready/Done, and implementation-detail governance.
- [Security Baseline](../../security/security-baseline.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [Release Gates](../../quality/release-gates.md)
- [Local Quality Toolchain](../../quality/local-quality-toolchain.md)

Later Accepted DEC govern any actual conflict.

## Dependencies

- M2-QUAL-001 is Completed on `main`.
- Issue #95 is Open and records the inherited advisory context.
- The official npm registry is reachable for metadata, lockfile resolution, and
  audit evidence.

## In scope

1. Pin the exact currently vulnerable `fast-uri` 3.x and 4.x transitive paths
   to `3.1.5` and `4.1.2` respectively.
2. Move the existing `brace-expansion` override and CommonJS compatibility
   patch from `5.0.8` to `5.0.9`.
3. Pin the exact current ESLint `js-yaml@4.3.0` path to `4.3.1`, while
   preserving the existing Nest Swagger `js-yaml@5.2.2` selection.
4. Regenerate the single pnpm lockfile with pnpm 11.17.0.
5. Update the existing brace-expansion compatibility test only as required for
   the new patched version.
6. Record exact before/after advisory paths, versions, licenses, audit result,
   compatibility evidence, and M2 Exit blocker resolution.

## Out of scope

- upgrading Next.js, NestJS, Fastify, ESLint, Ajv, TypeScript, Playwright, or
  another direct dependency;
- adding or removing a product runtime dependency;
- audit ignore, suppression, registry replacement, or severity reclassification;
- product, API, Source, Workflow, Fetcher, Queue, database, Schema, migration,
  Compose, authentication, authorization, or UI behavior;
- a generic dependency-upgrade campaign or lockfile refresh;
- marking M2 Passed or Completed, creating the M2 Acceptance Record, or starting
  M3; and
- modifying an Accepted DEC or adding a new security mechanism.

## Allowed files

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `patches/brace-expansion@5.0.8.patch` (deletion)
- `patches/brace-expansion@5.0.9.patch` (replacement patch)
- `packages/testing/src/dependencies/eslint-brace-expansion-compatibility.test.ts`
- this Work Packet
- `docs/implementation/roadmap.md`, limited to the Work Item status and blocker
  resolution

No other file is allowed without a correction to this Work Packet and an
independent readiness review.

## Prohibited modules and generated files

- `apps/**`, except no file is allowed there;
- `packages/core`, `packages/contracts`, `packages/config`,
  `packages/database`, and `packages/object-storage`;
- migrations, Drizzle metadata, schemas, Compose, environment templates,
  GitHub workflows, Decision and Session files.

`pnpm-lock.yaml` is the only generated file and must be produced by the pinned
pnpm version from the reviewed workspace override changes. No unrelated
resolution may change.

## Fixed dependency contract

| Package range                               | Required resolved version                                         | License      |
| ------------------------------------------- | ----------------------------------------------------------------- | ------------ |
| current `fast-uri` 3.x vulnerable selection | `3.1.5`                                                           | BSD-3-Clause |
| current `fast-uri` 4.x vulnerable selection | `4.1.2`                                                           | BSD-3-Clause |
| current `brace-expansion` selection         | `5.0.9` plus the existing bounded CommonJS compatibility behavior | MIT          |
| current `js-yaml` 4.x vulnerable selection  | `4.3.1`                                                           | MIT          |
| `@nestjs/swagger@11.4.6 > js-yaml`          | remains `5.2.2`                                                   | MIT          |

The implementation may use exact vulnerable-version selectors rather than a
broad range when that produces the smaller future constraint. No version may be
substituted without a Work Packet correction.

## Acceptance criteria

1. Official-registry full audit and production audit report zero Critical and
   zero High advisories.
2. `pnpm why` and the lockfile show only `fast-uri@3.1.5` and `4.1.2`,
   `brace-expansion@5.0.9`, `js-yaml@4.3.1` for the ESLint 4.x path, and the
   preserved `js-yaml@5.2.2` Nest Swagger path.
3. The old brace-expansion patch is absent; the 5.0.9 patch contains only the
   compatibility change already required by the repository, and the existing
   representative minimatch behavior remains passing.
4. Frozen installation succeeds without modifying the lockfile.
5. Root quality, integration, concurrent integration, and browser gates pass.
6. No direct dependency version, product source, API, Schema, migration,
   Compose, CI, or runtime configuration changes.
7. File scope, Secret, local-path, generated-artifact, Markdown-link, and diff
   checks pass with no owned runtime residue.
8. Documentation states only that the dependency blocker is remediated; M2
   remains In Progress pending a new M2-GOV-005 review.

## Required tests and commands

```text
node --version
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm --registry=https://registry.npmjs.org audit --audit-level high
corepack pnpm --prod --registry=https://registry.npmjs.org audit --audit-level high
corepack pnpm why fast-uri
corepack pnpm why brace-expansion
corepack pnpm why js-yaml
git diff --check
```

The audit before remediation is expected to return non-zero and is retained as
blocking evidence. Both final audits must return zero.

## Security review

This task changes no external-input, credential, authentication, authorization,
network, Object Storage, logging, or content boundary. It removes inherited
High dependency advisories. It must not hide an advisory, echo private data, or
introduce a new security mechanism.

## Migration and compatibility review

There is no database, Schema, API, Queue, Artifact, Agent, Prompt, or runtime
configuration migration. Compatibility risk is limited to transitive parser,
serializer, lint, and glob behavior and is covered by the existing unit,
integration, browser, and brace-expansion compatibility tests. Rollback is the
single focused Git revert.

## Observability

No application log, metric, trace, or audit Event changes. Audit command output,
the lockfile, tests, CI, and the completion report are the evidence.

## Documentation updates

- This Work Packet records Ready, implementation, review, and final merge
  evidence.
- Roadmap may record M2-MAINT-001 without changing the accepted M2 capability
  scope.
- Issue #95 records the new `js-yaml` path and the final remediation PR.
- No Current-truth architecture, product, security policy, Decision Register,
  or Session update is required.

## Definition of Ready

**PASS.** Independent review confirmed the four advisory paths, minimum patched
versions, pnpm override feasibility, continued need for the one-line
`brace-expansion@5.0.9` CommonJS compatibility patch, file boundaries, tests,
and rollback. No Blocking Design Question or new DEC is required.

- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2maint_ready_review`
- Reviewed Base: `88f18884491e797071191788bc0e752fd60446ca`

## Definition of Done

All acceptance criteria are evidenced on one reviewable diff; independent
review passes; required CI is green; Issue #95 closes through the merged PR; no
Critical or High official-registry advisory remains; M2 remains In Progress.

## Git authority

The Implementation Agent may modify only the allowed files and must stop before
Git publication. The Orchestrator may commit, push, create the PR, and squash
merge only after independent review passes and required CI is green.

## Completion report requirements

Report Summary; exact dependency paths and versions; files changed; patch
delta; commands and tests; official-registry audits; acceptance criteria;
security impact; known limitations; incomplete items; documentation updates;
possible new DEC; cleanup; and Git status.
