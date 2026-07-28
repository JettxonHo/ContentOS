# M0 Acceptance Record 001

| Field           | Value                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Status          | Blocked                                                                                                |
| Milestone       | M0 — 开工基线 / M0-C — M0 Integration Gate                                                             |
| Reviewed Commit | `4d7c68805879b03a075e2f012de2e2a65dc20c5c`                                                             |
| Work Item       | `M0-GATE-001 — M0 Demo and Exit Audit` ([Issue #29](https://github.com/JettxonHo/ContentOS/issues/29)) |
| Execution date  | 2026-07-28                                                                                             |
| Reviewer        | Independent Codex evidence review                                                                      |
| Decision        | Blocked; M0 remains in progress and M1 has not started                                                 |
| Timestamp       | `2026-07-28T18:22:18+08:00`                                                                            |

---

## 1. Review identity

This immutable record captures the M0-C integration-gate evidence for the exact reviewed commit. It follows the passed [M0-B Exit Review 002](m0-b-exit-review-002.md), but neither changes that historical record nor approves M0. The gate was run from a clean, separate checkout of the reviewed commit with no product code, Current-truth, Decision, Session, dependency, Compose, CI, or prior-acceptance-record change.

## 2. Required deliverables

| Requirement                                 | Result                       | Evidence                                                                                                                                                     |
| ------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clean runtime and reproducible installation | Passed                       | Node `v24.18.0` resolved from `.node-version`; Corepack pnpm resolved `11.17.0`; frozen installation completed without lockfile mutation.                    |
| Approved local services                     | Passed, with cleanup blocker | PostgreSQL, Redis, and SeaweedFS became healthy with loopback-only Host bindings in the README demo. Ordinary shutdown removed containers and network.       |
| Five application skeletons                  | Passed                       | The quality build completed for Web, API, worker, fetcher, and renderer; Web and API returned loopback responses.                                            |
| Full M0 command baseline                    | Passed                       | Workspace resolution, Docker-independent quality, repository integrity, and normal integration smoke all passed.                                             |
| CI skeleton                                 | Passed                       | GitHub Actions run [30349292136](https://github.com/JettxonHo/ContentOS/actions/runs/30349292136) completed both required jobs on the exact reviewed commit. |
| M0 Acceptance Record                        | Present                      | This record preserves the evidence and Blocked decision required by [Milestone Exit Criteria](milestone-exit-criteria.md#19-milestone-acceptance-record).    |

## 3. Local verification

The following were executed in the separate checkout at the reviewed commit. Temporary credentials were generated outside tracked files and were never printed or retained in this record.

| Command or check                                                   | Result                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime identity                                                   | Passed: Node `v24.18.0` on `darwin/arm64`; Corepack pnpm `11.17.0`.                                                                                                                                                                               |
| `corepack pnpm install --frozen-lockfile`                          | Passed; lockfile unchanged.                                                                                                                                                                                                                       |
| `corepack pnpm workspace:check`                                    | Passed; five applications and four packages resolved.                                                                                                                                                                                             |
| `corepack pnpm check`                                              | Passed; formatting, lint, strict TypeScript, 25 unit tests, and five application builds passed.                                                                                                                                                   |
| `corepack pnpm repository:check`                                   | Passed before this record was added; local Markdown links, DEC integrity/references, and bounded Secret scan passed.                                                                                                                              |
| `corepack pnpm test:integration`                                   | Passed; 7 files and 9 tests completed in 17.03 seconds, exercising isolated PostgreSQL, Redis, S3-compatible Object Storage, Web, API, and skeleton lifecycle behavior.                                                                           |
| `CONTENTOS_SMOKE_INJECT_FAILURE=1 corepack pnpm test:integration`  | Independently reproduced as the expected non-zero assertion-failure path: 7 files, 1 intentionally failed and 6 passed; 8 tests passed and 1 intentionally failed; no smoke container, network, process, or temporary-directory residue remained. |
| `corepack pnpm audit --prod --registry=https://registry.npmjs.org` | Passed; no known vulnerabilities.                                                                                                                                                                                                                 |
| `corepack pnpm audit --registry=https://registry.npmjs.org`        | Passed; no known vulnerabilities.                                                                                                                                                                                                                 |
| `corepack pnpm build` and manual README application start          | Passed; Web and API each returned the expected loopback response.                                                                                                                                                                                 |

The normal smoke run left no `contentos-smoke-*` container, network, process, or temporary-credential residue. Independent review also reproduced the intended assertion-failure path with the same zero-residue result. The earlier interrupted failure-injection attempt in this implementation run was cleaned but is not acceptance evidence. The harness verified PostgreSQL authentication/connectivity, Redis authenticated `PONG`, and authenticated/incorrect/anonymous S3 request behavior through isolated test paths; it does not claim a product application-to-service connection.

## 4. M0 Demo result

**Blocked.** The README sequence was followed with an ignored temporary `.env`, a separate task-specific Compose project, and temporary loopback ports to avoid unrelated locally occupied ports. `infra:config`, `infra:up`, and `infra:status` succeeded; all three services were healthy and loopback-bound. `corepack pnpm build` succeeded; Web and API started and responded. Worker, fetcher, and renderer startup and graceful-shutdown behavior are evidenced by the normal isolated smoke run.

The demonstration cannot be accepted because its ordinary shutdown intentionally retained three newly created named volumes. Those volumes are listed as Blocking Defects below and cannot be deleted under this Work Item's explicit cleanup authorization.

## 5. Security results

- Temporary credentials were strong, local-only, ignored, and removed; no credential value, temporary URL, or local filesystem path is recorded here.
- All demo service Host bindings were `127.0.0.1` only.
- The normal integration smoke covered correct and incorrect PostgreSQL and Redis authentication plus correct, incorrect, and anonymous S3 access behavior.
- Official-registry production and full audits reported no known vulnerabilities.
- No user content, product credential, schema, migration, queue, Agent, rendering, Export, or application-to-service product connection was added.

## 6. Documentation results

- The README startup path was executed against the reviewed commit.
- `AGENTS.md` authority references, Markdown links, Canonical Decision Register continuity (`DEC-001`–`DEC-294`), Decision references, and bounded Secret scan passed before this record was created.
- This record is the only repository change made by the gate. Stage wording in `AGENTS.md`, `README.md`, and the Roadmap is deliberately unchanged because the gate is Blocked.

## 7. CI evidence

The reviewed `main` commit completed GitHub Actions run [30349292136](https://github.com/JettxonHo/ContentOS/actions/runs/30349292136) successfully:

- [Docker-independent quality](https://github.com/JettxonHo/ContentOS/actions/runs/30349292136/job/90242733405): passed.
- [Integration smoke (Docker)](https://github.com/JettxonHo/ContentOS/actions/runs/30349292136/job/90242733415): passed.

The run is a `push` CI execution for exactly `4d7c68805879b03a075e2f012de2e2a65dc20c5c`.

## 8. Acceptance Criteria evidence

| Criterion                                    | Evidence                                                                                                                                                                    | Result  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Exact clean base and allowed scope           | Separate checkout resolved exactly the reviewed commit; the implementation branch began clean.                                                                              | Passed  |
| Pinned runtime and frozen install            | Node `v24.18.0`, pnpm `11.17.0`, and frozen install passed.                                                                                                                 | Passed  |
| Command suite and smoke cleanup              | `workspace:check`, `check`, `repository:check`, and normal `test:integration` passed; normal and independently reproduced assertion-failure smoke paths left no residue.    | Passed  |
| README infrastructure and application demo   | Service health, loopback bindings, Web, and API passed; normal smoke verified skeleton lifecycle. New retained demo volumes prevent full acceptance.                        | Blocked |
| No Secret or temporary path in record        | Record contains neither credentials nor temporary local paths.                                                                                                              | Passed  |
| Exact-main CI                                | Run 30349292136 passed both jobs on the reviewed commit.                                                                                                                    | Passed  |
| Official dependency audits                   | Production and full official-registry audits reported no known vulnerabilities.                                                                                             | Passed  |
| Integrity, artifact, and scope checks        | The staged record passed `repository:check`, exact-file Prettier, diff, allowed-file scope, Secret/local-path, `.DS_Store`, generated-artifact, and runtime-residue checks. | Passed  |
| No business implementation                   | No forbidden product behavior or implementation file changed.                                                                                                               | Passed  |
| Complete acceptance record                   | This record names the milestone, commit, deliverables, test/demo/security/documentation results, limitations, blockers, reviewer state, decision, and timestamp.            | Passed  |
| Passed decision only with no Blocking Defect | Blocking defects below prevent a Passed decision and stage synchronization.                                                                                                 | Blocked |
| M1 remains unstarted                         | This record authorizes no M1 work.                                                                                                                                          | Passed  |

## 9. Blocking defects

1. **Gate-created persistent volume residue.** The README demo created exactly these three named volumes at `2026-07-28T10:17:46Z`, each labeled `com.docker.compose.project=contentos-m0-demo-001`:
   - `contentos-m0-demo-001_contentos_postgres_data`
   - `contentos-m0-demo-001_contentos_redis_data`
   - `contentos-m0-demo-001_contentos_seaweedfs_data`

   Ordinary `infra:down` correctly removed the task's containers and network while retaining the volumes. Issue #29 prohibits volume deletion and permits cleanup only of task-created temporary checkout and credential paths; it also requires no gate-introduced runtime residue. The three volumes therefore cannot be removed or accepted as residue under this Work Item.

## 10. Known limitations

- M0 intentionally remains an engineering baseline: no product database schema, migration, Content Package, Source, Workflow, queue behavior, Agent, rendering, Export, authentication, or product application-to-service connection exists.
- The README’s ordinary infrastructure shutdown intentionally preserves named volumes. That behavior is expected for local development, but it conflicts with this Work Item's separate-project/no-residue cleanup constraint and needs an explicitly authorized remediation or audit approach before M0 can pass.
- The review is not a formal M1 readiness decision and does not claim the formal MVP, which remains an M8 outcome.

## 11. Final decision and next action

**Blocked**

M0 does not satisfy all M0-C Exit Criteria at `4d7c68805879b03a075e2f012de2e2a65dc20c5c`. M0 remains **In Progress / Blocked**, and M1 remains **not started**. A separate bounded remediation or a Human decision is required to resolve the persistent-volume cleanup contract. No Accepted DEC is changed by this finding.
