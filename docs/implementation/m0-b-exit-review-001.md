# M0-B Engineering Baseline Exit Review 001

**Status:** Blocked
**Reviewed Commit:** `95a5763b432f09c40077f153548934a9bf182b47`
**Review Date:** 2026-07-28
**Review Timestamp:** `2026-07-28T16:18:14+08:00`
**Reviewer:** Codex evidence review
**Milestone:** M0-B — Engineering Baseline

---

## 1. Review Identity

This is the first formal exit review for the ContentOS M0-B Engineering Baseline. It evaluates the merged workspace, application skeletons, local state services, quality toolchain, integration smoke harness, and CI skeleton against the common and M0-B Exit Criteria.

The review records a blocked result because the reviewed dependency graph contains unresolved High-severity security advisories. It does not change an Accepted DEC, approve a security exception, remediate a dependency, or authorize M0-C.

## 2. Reviewed Commit

The reviewed baseline is merge commit `95a5763b432f09c40077f153548934a9bf182b47` on `main`, which includes `M0-CI-001` through Pull Request [#19](https://github.com/JettxonHo/ContentOS/pull/19).

The following M0-B Work Items are merged into the reviewed baseline:

- `M0-ENG-001 — Workspace and TypeScript Baseline`;
- `M0-ENG-002 — Application Skeletons`;
- `M0-ENG-003 — Web Skeleton Loopback Binding`;
- `M0-INFRA-001 — Local State Services`;
- `M0-QUAL-001 — Local Quality Toolchain`;
- `M0-QUAL-002 — Integration Smoke Harness`; and
- `M0-CI-001 — CI Skeleton`.

## 3. Required Deliverables

| M0-B requirement                           | Result | Evidence                                                                                                                                               |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js 24 pinned                          | Passed | `.node-version` resolves to `v24.18.0`; the root engine is `>=24.18.0 <25.0.0`.                                                                        |
| pnpm Workspace and one lockfile            | Passed | Nine explicit workspace members resolve under pnpm `11.17.0`; one root `pnpm-lock.yaml` is tracked.                                                    |
| TypeScript strict                          | Passed | `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; `skipLibCheck` remains `false`.                   |
| Required application and package skeletons | Passed | Five application skeletons and four approved packages exist; the workspace check resolves all nine.                                                    |
| Local state services                       | Passed | Compose defines PostgreSQL, Redis, and digest-pinned SeaweedFS S3-compatible Object Storage on loopback-only Host ports.                               |
| Executable quality commands                | Passed | Format check, lint, typecheck, unit tests, and five application builds pass through `corepack pnpm check`.                                             |
| Unit Test and Integration Smoke            | Passed | Two unit-test files provide 20 passing tests; seven integration files provide 9 passing smoke tests.                                                   |
| CI skeleton                                | Passed | The GitHub Actions run for reviewed `main` completed both the Docker-independent and Docker-dependent jobs successfully.                               |
| No Secret committed                        | Passed | The repository-integrity Secret scan passes, and the integration harness uses repository-external temporary credentials.                               |
| No business implementation                 | Passed | Web and API expose baseline-only behavior; worker, fetcher, and renderer only demonstrate process lifecycle; Domain packages contain identifiers only. |

All M0-B-specific engineering deliverables are present. This does not by itself satisfy the common requirement for no unresolved Blocking Defect.

## 4. Local Verification

The following checks were run independently from the reviewed `main` commit with Node.js `v24.18.0` and Corepack pnpm `11.17.0`:

| Check                                          | Result                                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm install --frozen-lockfile`      | Passed; all ten workspace projects were already reproducibly resolved.                                         |
| `corepack pnpm workspace:check`                | Passed; five applications and four packages resolved.                                                          |
| `corepack pnpm check`                          | Passed; formatting, lint, strict TypeScript, 20 unit tests, and all application builds succeeded.              |
| `corepack pnpm repository:check`               | Passed; documentation links, Decision Register integrity, DEC references, and bounded Secret checks succeeded. |
| `corepack pnpm test:integration`               | Passed; 7 files and 9 tests completed with no remaining smoke container or process.                            |
| `git diff --check`                             | Passed.                                                                                                        |
| Tracked `.DS_Store` and generated-output check | Passed; none are tracked.                                                                                      |

The integration smoke harness exercised the real skeleton entry points and isolated PostgreSQL, Redis, and S3-compatible Object Storage with temporary credentials, `tmpfs`, and loopback-only ephemeral ports. It did not read or change the persistent `contentos-local` volumes.

## 5. Demo Result

**Passed for the M0-B scope.** The independent integration smoke run demonstrated that the built Web and API skeletons start and respond through loopback-only endpoints; PostgreSQL, Redis, and S3-compatible Object Storage become usable through their authenticated baseline paths; and worker, fetcher, and renderer processes start and terminate cleanly. No product behavior, persistent business data, schema, migration, Queue, or Agent path was involved.

This is an engineering-baseline demonstration. It is not the clean-environment M0 Demo or M0 Acceptance Record required by M0-C.

## 6. CI Evidence

GitHub Actions run [30331250377](https://github.com/JettxonHo/ContentOS/actions/runs/30331250377) executed on the reviewed `main` commit and completed successfully:

- `Docker-independent quality`: passed;
- `Integration smoke (Docker)`: passed; and
- no deployment, artifact publication, repository Secret, or write permission was used.

## 7. Security Review

The bounded repository Secret scan passes, the service baseline remains loopback-only, and no product authentication, external input, migration, or business data path exists.

The official npm Registry audit nevertheless reports unresolved dependency advisories:

| Audit                                                              | Result                         |
| ------------------------------------------------------------------ | ------------------------------ |
| `corepack pnpm audit --prod --registry=https://registry.npmjs.org` | Failed: 4 High and 1 Moderate. |
| `corepack pnpm audit --registry=https://registry.npmjs.org`        | Failed: 5 High and 1 Moderate. |

The High findings affect the current Next.js paths for `sharp` and `postcss`, the NestJS/Fastify path for `find-my-way`, and the development-only ESLint path for `brace-expansion`. Their current exploitability is constrained by the skeleton scope, but the advisory severity is not changed by that assessment.

Issue [#12 — M0-MAINT-001](https://github.com/JettxonHo/ContentOS/issues/12) preserves package paths, patched ranges, applicability, and the proposed bounded remediation sequence. It is not an approved exception and does not mark the findings resolved.

## 8. Documentation and Governance Review

- The Canonical Decision Register remains continuous from DEC-001 through DEC-294.
- `README.md`, `AGENTS.md`, the Roadmap, quality documents, and the actual command surface agree after the status corrections delivered with this record.
- `M0-GOV-003` is resolved: the Session-009 asset path is a fenced example rather than a missing historical asset.
- No Accepted DEC, Session, product Current-truth, or architecture boundary changes in this review.

## 9. Known Limitations

- M0-B intentionally contains no product database Schema, migration, Queue behavior, Content Package, Source, Workflow, Agent, Render, or Export implementation.
- Applications do not connect to local state services through product code; the integration harness drives the skeleton and service entry points directly.
- This review does not repeat the persistent named-volume recovery exercise accepted under `M0-INFRA-001`; M0-C requires a clean-environment integration gate and M0 Demo.
- Current exposure assessment for a dependency advisory is not a waiver of its severity or a security exception.

## 10. Blocking Defects

One blocking class is open: unresolved High-severity dependency advisories in the reviewed baseline.

Section 6 of the [Milestone Exit Criteria](milestone-exit-criteria.md#6-blocking-defect) defines a Critical or High security issue as a Blocking Defect. Section 20 requires a failed Milestone to remain In Progress or Blocked, retain failure evidence, and receive bounded remediation before a new review.

No other Blocking Defect was found.

## 11. Final Decision

**Blocked**

The M0-B-specific engineering criteria pass, but the common Exit Criteria do not permit acceptance while the High-severity dependency findings remain unresolved. M0-B must not be marked Completed, and M0-C must not begin.

## 12. Required Next Action

1. Keep `M0-MAINT-001` separate from this Exit Review.
2. Create and complete bounded remediation Work Items by framework boundary.
3. Re-run both production and full audits, the affected runtime checks, `corepack pnpm check`, `corepack pnpm repository:check`, `corepack pnpm test:integration`, and CI.
4. Produce a new immutable M0-B Exit Review record; do not revise this blocked result into a pass.

No new DEC is currently required. A framework replacement, approved-stack change, security exception, or release-gate change would require Decision Review.
