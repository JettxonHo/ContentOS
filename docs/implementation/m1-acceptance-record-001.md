# M1 Acceptance Record 001

| Field           | Value                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Status          | Passed                                                                                                                    |
| Milestone       | M1 — Product Skeleton and Domain Foundation                                                                               |
| Reviewed Commit | `b5b727a8ce4a186c485f64e28aef1381b7a81737`                                                                                |
| Work Item       | `M1-WEB-001 — Login, Dashboard, and Workspace Thin Slice` ([Issue #35](https://github.com/JettxonHo/ContentOS/issues/35)) |
| Pull Request    | [PR #38](https://github.com/JettxonHo/ContentOS/pull/38)                                                                  |
| Execution date  | 2026-07-28                                                                                                                |
| Reviewer        | Independent Codex evidence review                                                                                         |
| Decision        | Passed; M1 is completed and M2 has not started                                                                            |
| Timestamp       | `2026-07-28T23:27:51+08:00`                                                                                               |

---

## 1. Review identity

This immutable record evaluates the complete M1 sequence: `M1-SEC-001` supplies the private owner Session and protected API boundary, `M1-CP-001` supplies owner-scoped Content Package Domain/persistence/API behavior and Artifact identity foundations, and `M1-WEB-001` supplies the first browser-visible UI → API → Domain → PostgreSQL → UI loop.

The exact reviewed implementation commit is `b5b727a8ce4a186c485f64e28aef1381b7a81737`. This record was created only after GitHub Actions run [30373223977](https://github.com/JettxonHo/ContentOS/actions/runs/30373223977) passed all three required jobs on that commit.

## 2. Required deliverables

| M1 requirement                    | Result | Evidence                                                                                                                                               |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication and owner checks   | Passed | Password login, server-side opaque Session, cookie guard, owner-scoped API, non-disclosing lookup, logout, expiry, revocation, and replay denial pass. |
| Content Package creation          | Passed | The typed Web client creates one owner-scoped package through the protected API; duplicate browser submission is guarded.                              |
| Persistence across refresh        | Passed | Browser metadata updates use the API revision contract and remain after a full page refresh.                                                           |
| Workspace shell                   | Passed | The opaque package route provides metadata editing, revision display, Archive, and truthful unavailable later stages.                                  |
| Opaque identity                   | Passed | Owner, Session, Content Package, and Artifact identities remain opaque UUID-based values; no title or sequence becomes identity.                       |
| Artifact / Working Copy / Version | Passed | The framework-independent Artifact identity/head model distinguishes mutable Working Copy and immutable Version references.                            |
| Migration test                    | Passed | The isolated harness applies both reviewed migrations twice and verifies the expected PostgreSQL tables and migration journal.                         |
| Archive separate from Delete      | Passed | Archive requires explicit confirmation, preserves the package, removes it from Active, and exposes it exactly once in Archived.                        |
| API error contract                | Passed | Shared contracts and the Web client preserve status/code handling without exposing internal response details.                                          |
| M1 demo                           | Passed | The pinned-Chromium scenario completes Login → Create Package → Workspace → Edit → Refresh → Persist → Archive → Logout.                               |

## 3. Test results

| Command or check                                                               | Result                                                                                                                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime identity                                                               | Passed: Node `v24.18.0` on `darwin/arm64`; Corepack pnpm `11.17.0`.                                                                                 |
| `corepack pnpm install --frozen-lockfile`                                      | Passed; the single workspace lockfile reproduced without mutation.                                                                                  |
| `corepack pnpm workspace:check`                                                | Passed; five applications and five packages resolved.                                                                                               |
| `corepack pnpm check`                                                          | Passed; formatting, lint, strict TypeScript, 16 unit files / 54 tests, and all five application builds succeeded.                                   |
| `corepack pnpm repository:check`                                               | Passed; Markdown links, Decision Register integrity/references, and bounded Secret checks succeeded on the staged change.                           |
| `corepack pnpm test:integration`                                               | Passed; 9 files / 16 tests exercised processes, migrations, authentication, Content Package behavior, PostgreSQL, Redis, and object storage.        |
| `corepack pnpm test:browser`                                                   | Passed; one complete M1 owner scenario ran in pinned Playwright Chromium and left zero runtime/test residue.                                        |
| Browser assertion-failure injection                                            | Passed: command returned non-zero; isolated containers, processes, credential directory, and result metadata were absent afterward.                 |
| Browser teardown-failure injection                                             | Passed: all scenario assertions completed, teardown reported non-zero, real cleanup completed, and no residue remained.                             |
| Browser invalid-Docker path                                                    | Passed: command failed clearly and non-zero before product startup, with no runtime or credential residue.                                          |
| `corepack pnpm audit --registry=https://registry.npmjs.org --audit-level high` | Passed; no known vulnerabilities.                                                                                                                   |
| Scope, local-path, `.DS_Store`, artifact, volume, and diff checks              | Passed; no forbidden implementation path changed, no local path or Secret was added, and the three existing local named volumes remained unchanged. |

## 4. Demo result

**Passed.** The Chromium scenario starts from an unauthenticated browser, verifies a generic incorrect-password path and a correct HttpOnly SameSite Session, creates one Content Package, opens its opaque Workspace route, edits metadata, refreshes and observes persisted state, rejects a stale revision, reloads the authoritative revision, confirms Archive, finds the preserved package in Archived, logs out, and verifies that the protected route returns to Login.

The Workspace labels Sources as planned for M2 and Research/creation as not implemented. No fake Workflow, Agent, generated content, or publishing action is presented as available.

## 5. Security results

- Authentication and Authorization remain separate; all package mutations pass through the protected API and owner-scoped Domain/application boundary.
- Web uses `credentials: include` with an HttpOnly, SameSite=Strict server-side Session; it stores no password, token, or API response in browser storage.
- The exact Web Origin is enforced by API CORS/Origin policy. Browser API runtime configuration accepts only IPv4 loopback outside production and requires HTTPS in production.
- Owner-provided metadata is rendered as React text; no raw HTML injection path is introduced.
- Temporary test credentials exist only in a repository-external OS temp directory. The password hash is single-quoted in the Compose env file so its `$` separators cannot be expanded or emitted as warnings.
- The browser and integration harnesses use unique Compose projects, `tmpfs`, and loopback-only ephemeral ports. They do not read, mount, modify, or delete the persistent `contentos-local` volumes.
- The official npm audit reports no known vulnerability. `@playwright/test` is exactly `1.62.0` and reports Apache-2.0.

## 6. Documentation results

- `AGENTS.md`, `README.md`, the Roadmap, Repository Structure, Local Quality Toolchain, Integration Smoke Harness, CI Skeleton, `.env.example`, and [M1 Browser Thin Slice](../quality/browser-thin-slice.md) match the executable M1 boundary.
- The Canonical Decision Register remains unchanged and continuous from DEC-001 through DEC-294.
- No Accepted DEC, Session, product scope, migration, Domain rule, API route, or later-milestone Current-truth was modified by `M1-WEB-001`.

## 7. CI evidence

GitHub Actions run [30373223977](https://github.com/JettxonHo/ContentOS/actions/runs/30373223977) is a successful `pull_request` run for exact reviewed commit `b5b727a8ce4a186c485f64e28aef1381b7a81737`:

- [Docker-independent quality](https://github.com/JettxonHo/ContentOS/actions/runs/30373223977/job/90322192996): passed;
- [Integration smoke (Docker)](https://github.com/JettxonHo/ContentOS/actions/runs/30373223977/job/90322193294): passed; and
- [M1 browser thin slice (Chromium)](https://github.com/JettxonHo/ContentOS/actions/runs/30373223977/job/90322192975): passed.

The workflow used read-only repository permission, immutable reusable-action SHAs, the frozen lockfile, no repository Secret, no credential persistence, no artifact upload, and no deployment or release step.

## 8. Common Exit Criteria

| Common criterion                                | Result | Evidence                                                                                                                           |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Required deliverables                           | Passed | Section 2 maps every M1 Exit Criterion to implemented and tested behavior.                                                         |
| Demonstrable capability                         | Passed | Section 4 records the complete M1 browser demo through real Web/API/Domain/PostgreSQL boundaries.                                  |
| Verified Acceptance Criteria and required tests | Passed | Section 3 records local deterministic, integration, browser, failure-path, repository, audit, and remote CI evidence.              |
| Security Review                                 | Passed | Section 5 records owner scope, Session, Origin, rendering, Secret, isolation, supply-chain, and cleanup results.                   |
| Synchronized documentation                      | Passed | Section 6 identifies the synchronized entry-point, architecture, quality, CI, environment, and roadmap documents.                  |
| Evidence Record                                 | Passed | This immutable record identifies the exact implementation commit, commands, results, CI jobs, reviewer, limitations, and decision. |
| No unresolved Blocking Defect                   | Passed | No invariant violation, High/Critical vulnerability, owner crossover, data loss, missing test, or missing document remains.        |

## 9. Known limitations

- M1 is a product/domain foundation, not the formal MVP. Source Capture, Workflow, Queue, Agent Runtime, Research, content generation, Render, Export, publishing, and deployment remain absent.
- The browser baseline is one pinned-Chromium owner scenario, not a multi-browser or broad product E2E suite.
- Web and API currently run as separately configured loopback processes; this record does not select a production deployment topology.
- Package metadata uses explicit Save rather than autosave. Autosave is a later milestone requirement and is not claimed here.

## 10. Blocking defects

None.

## 11. Final decision

**Passed**

All Common and M1 Exit Criteria have reproducible passing evidence on the exact reviewed implementation commit, and no Blocking Defect remains. M1 is **Completed**. M2 is **not started** and requires a separate Ready Work Item. No new DEC is required.
