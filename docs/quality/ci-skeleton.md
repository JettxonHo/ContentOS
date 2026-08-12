# ContentOS CI Skeleton

**Status:** Implementation Baseline
**Scope:** The bounded GitHub Actions workflow, affected-path classification, permissions, runtime, repository-integrity checks, integration smoke, and M1/M2 browser extension
**Last Updated:** 2026-08-12

This document records the executable continuous-integration baseline introduced by `M0-CI-001` and its bounded M1/M2 browser-test extension. It is the CI companion to the [Local Quality Toolchain](local-quality-toolchain.md), [Integration Smoke Harness](integration-smoke-harness.md), [M1 Browser Thin Slice](browser-thin-slice.md), and [M2 Acceptance Harness](m2-acceptance-harness.md). It does not create a release platform, deployment, or full release gate.

Related documents: [Local Quality Toolchain](local-quality-toolchain.md), [Integration Smoke Harness](integration-smoke-harness.md), [Test Strategy](test-strategy.md), [Release Gates](release-gates.md), [Secret Management](../security/secret-management.md), and the [Roadmap](../implementation/roadmap.md).

---

## 1. Purpose

`M0-CI-001` adds one bounded GitHub Actions workflow at [.github/workflows/ci.yml](../../.github/workflows/ci.yml). Pull Requests first classify their changed paths: non-sensitive Markdown/Issue-template-only changes run the documentation gate, while code, configuration, test-harness, runtime, workflow, Accepted Decision, agent/release-governance, security, quality, and formal acceptance/release-evidence changes run the full Docker-independent, Integration, and Browser gates. Pushes to `main` and manual dispatches always run the full gates. The workflow introduces no product behavior and selects no release platform, deployment provider, or future CI architecture.

GitHub Actions is authorized here as the bounded CI implementation detail for this GitHub-hosted repository only.

## 2. Triggers

The workflow runs on:

- `pull_request` (any target branch);
- `push` to `main`;
- `workflow_dispatch` (manual).

It does not use `pull_request_target`, scheduled triggers, repository dispatch, or external events.

## 3. Runtime and installation

- Runner: GitHub-hosted `ubuntu-24.04`.
- Node.js: resolved from `.node-version` to `24.18.0` via `actions/setup-node`.
- pnpm: activated through Corepack and verified to be `11.17.0` (the root `packageManager` pin).
- Installation: `corepack pnpm install --frozen-lockfile` (reproducible; no lockfile mutation).
- No GitHub Secret is read. No credential is persisted.

## 4. Jobs and boundaries

The workflow defines one path-classification job and three quality jobs. Any executed required job failure makes the run non-zero. A job skipped because a Pull Request is documentation-only is not missing product evidence; the affected-path decision is the gate.

### Change-scope job (`classify`)

1. Check out two commits without persisted credentials.
2. For Pull Requests only, compare the merge candidate with its first parent.
3. Set `docs-only=true` only when at least one path changed, every changed path is Markdown or under `.github/ISSUE_TEMPLATE/`, and no changed path is in the sensitive allowlist below.
4. The sensitive full-CI allowlist is `AGENTS.md`, `GOAL.md`, `docs/decisions/**`, `docs/quality/**`, `docs/security/**`, the collaboration workflow, Work Item template, milestone exit criteria, and Acceptance Record/acceptance-record Work Packets.
5. Use `docs-only=false` conservatively for pushes, manual dispatches, a missing comparison parent, an empty change set, any sensitive documentation path, or any non-document path.

### Docker-independent job (`docker-independent`)

For a non-documentation change:

1. `corepack pnpm workspace:check` — workspace resolution.
2. `corepack pnpm check` — `format:check`, `lint`, `typecheck`, `test`, `build`.
3. `corepack pnpm repository:check` — Markdown local-link, Canonical Decision register, and Secret checks.

For a documentation-only Pull Request:

1. Run the pinned workspace Prettier over exactly the Markdown/Issue-template paths changed by the Pull Request. NUL-delimited Git paths preserve unusual filenames; `--ignore-unknown` keeps the gate bounded to supported formats.
2. `corepack pnpm repository:check` — Markdown local-link, Canonical Decision register, and Secret checks.

### Docker-dependent job (`integration-smoke`)

For non-documentation changes, run `corepack pnpm test:integration` — the existing isolated smoke harness (see [Integration Smoke Harness](integration-smoke-harness.md)). Cleanup behavior is owned entirely by the existing harness; the workflow adds no cleanup step. A documentation-only Pull Request skips this job.

### M1/M2 browser job (`browser-smoke`)

For non-documentation changes:

1. Install only the Chromium browser and required Linux system libraries through the exact root Playwright pin.
2. `corepack pnpm test:browser` — the complete M1/M2 owner-browser suite against a fresh isolated runtime (see [M1 Browser Thin Slice](browser-thin-slice.md) and [M2 Acceptance Harness](m2-acceptance-harness.md)).

A documentation-only Pull Request skips this job.

The job uploads no screenshot, trace, video, HTML report, credential file, or other artifact.

## 5. Permissions and supply chain

- Top-level `permissions: contents: read`. No write permission is granted.
- Checkout uses `persist-credentials: false`, so no token is written into the local Git config. The classifier uses `fetch-depth: 2`; other jobs retain the minimal checkout.
- The only reusable actions are pinned to immutable full commit SHAs:
  - `actions/checkout@11d5960a326750d5838078e36cf38b85af677262`
  - `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020`
- No third-party action, no cache action, no artifact upload, no environment, no deployment, and no release step is used.
- No matrix, no multi-Node-version build, and no schedule.

## 6. Local corresponding commands

The repository-integrity checks are executable locally and are the same code CI invokes. They live in `packages/testing/src/repository/**` and are run directly by Node's built-in TypeScript type-stripping (no new dependency, no build step):

- `corepack pnpm check:docs` — Markdown local-link integrity.
- `corepack pnpm check:decisions` — Canonical Decision register and DEC-reference resolution.
- `corepack pnpm check:secrets` — bounded high-confidence Secret scan.
- `corepack pnpm repository:check` — all three together.

These are Docker-, network-, and credential-independent and are intentionally not part of `corepack pnpm check`.

## 7. Documentation and Decision check scope

- Scans Git-tracked Markdown.
- External URL schemes and fragment-only links are ignored; query and fragment components are stripped before resolution; URL-encoded paths are decoded.
- Links cannot escape the repository root.
- The Canonical Register at `docs/decisions/decisions.md` must contain exactly one index entry for every DEC-001 through DEC-295 — no missing, no duplicate, none outside the range.
- Every `DEC-NNN` reference in tracked Markdown must resolve to the canonical range.
- The immutable historical session archive (`docs/sessions/**`) is excluded as a link-check source because sessions are archived discussion records whose image/asset references were never committed and cannot be repaired without editing a prohibited historical file. Links from current-truth documents into session files are still validated as targets.
- Failure output names only the file, the reference, and the problem category; it does not dump unrelated content.

## 8. Secret check scope

- Scans Git-tracked text files only; binary content is skipped safely.
- Detects a bounded set of high-confidence credential and private-key forms (AWS access key IDs, GitHub tokens, GitHub fine-grained PATs, Slack tokens, Google API keys, and `PRIVATE KEY` blocks).
- Accepts ordinary words such as "secret" or "token" and explicit placeholders such as `replace-with-...`.
- Exits non-zero on a finding.
- Output identifies the detector, the file, and the line number only. The matched value and the complete source line are never printed.

## 9. Failure behavior

A required failure returns a non-zero exit code and fails the containing job. A classifier failure prevents dependent jobs from claiming success. For a documentation-only Pull Request, formatting or repository-integrity failure is Blocking; Integration and Browser are intentionally not applicable. For other events, the Docker-independent job fails on any workspace, quality-gate, or repository-check failure. The Docker-dependent job fails if Docker is missing or invalid, or if the smoke harness fails; the existing harness guarantees its own cleanup, so no container, network, volume, host port, process, or temporary directory remains.

## 10. Preconditions

- GitHub Actions available on the repository (verified only after independent review, commit, push, and the human merge decision).
- Docker available on the runner for the `integration-smoke` job (present on `ubuntu-24.04`).

## 11. Scope boundary and known limitations

This is an M0 skeleton. It is not a full release gate, a deployment pipeline, a coverage service, a status-badge service, a multi-platform matrix, a scheduled job, or a Dependabot configuration. It does not introduce telemetry, artifact retention, or external log sinks. Branch-protection settings and making the jobs required checks are out of scope and remain a human/GitHub-settings decision.

The affected-path workflow has been inspected locally and its documentation commands executed locally, but the new classifier and skipped-job conclusions have not yet been verified on GitHub Actions. Its own Pull Request changes the workflow file, so it is conservatively classified as non-documentation and must run the full three quality jobs before merge.

## 12. Decision traceability

This baseline follows DEC-244–DEC-266 for deterministic tests and gates, DEC-276–DEC-278 for M0 demonstrability and CI tiering, and DEC-284, DEC-287–DEC-292 for quality, bounded Work Items, and scope governance. The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
