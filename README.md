# ContentOS

ContentOS is a single-user, desktop-first Personal AI Content Studio. It turns private, reviewable source material into a traceable content flow:

```text
Source → Research → Human Opinion → Blog / Xiaohongshu → Design → Render → Export
```

It is not a bulk-writing tool or an autonomous publishing system.

## Current status

The repository has completed **M0-A Documentation Runway**, **M0-B Engineering Baseline**, and **M0-C Integration Gate**. [M0 Acceptance Record 002](docs/implementation/m0-acceptance-record-002.md) records the final Passed decision. M1 is in progress through `M1-CP-001`: the single-user Session foundation is completed, and the first owner-scoped Content Package Domain, PostgreSQL persistence, protected API, and Artifact identity invariants now exist. Web product behavior does not yet exist.

This repository now provides workspace installation, local and CI quality checks, builds, five process entry points, local state-service containers, authentication, and the bounded Content Package API foundation. It does not yet provide the M1 Web thin slice, deployment, or a development server.

## MVP boundary

The formal MVP is a private, single-user, desktop-first web application with human review. It produces both Blog and Xiaohongshu outputs from a shared Content Foundation, then supports deterministic rendering and manual export/publishing. Public registration, automatic publishing, multi-user collaboration, and unsupported media inputs are outside the MVP. Read the complete [MVP Scope](docs/product/mvp-scope.md).

## Repository contents

The repository currently contains:

- historical [Sessions](docs/sessions/);
- the [Canonical Decision Register](docs/decisions/decisions.md);
- Product, Architecture, Security, and Quality Current-truth specifications;
- Implementation governance: [Roadmap](docs/implementation/roadmap.md), [Milestone Exit Criteria](docs/implementation/milestone-exit-criteria.md), and [Work Item template](docs/implementation/work-item-template.md).

The current workspace contains five applications and five packages. `M1-SEC-001` added `packages/database` and the authentication foundation. `M1-CP-001` adds the second reviewed migration plus framework-independent Content Package and Artifact identity rules, shared HTTP contracts, a Drizzle repository, and protected API composition within existing packages. Remaining planned packages stay absent until bounded Work Items require them.

## Authoritative documentation map

- [Agent and repository rules](AGENTS.md)
- Product: [definition](docs/product/product-definition.md), [users and jobs](docs/product/user-and-jobs.md), [MVP scope](docs/product/mvp-scope.md)
- Architecture: [domain overview](docs/architecture/domain-overview.md), [Content Package foundation](docs/architecture/content-package-foundation.md), [technical architecture](docs/architecture/technical-architecture.md), [repository structure](docs/architecture/repository-structure.md), [workflow overview](docs/architecture/workflow-overview.md)
- Security: [security baseline](docs/security/security-baseline.md), [authentication foundation](docs/security/authentication-foundation.md)
- Quality: [test strategy](docs/quality/test-strategy.md), [release gates](docs/quality/release-gates.md), [local quality toolchain](docs/quality/local-quality-toolchain.md), [integration smoke harness](docs/quality/integration-smoke-harness.md), [CI skeleton](docs/quality/ci-skeleton.md)
- Implementation: [roadmap](docs/implementation/roadmap.md), [exit criteria](docs/implementation/milestone-exit-criteria.md), [Work Item template](docs/implementation/work-item-template.md), and [agent collaboration workflow](docs/implementation/agent-collaboration-workflow.md)
- [Decision Register](docs/decisions/decisions.md)
- [Contribution guide](CONTRIBUTING.md)

## Development lifecycle

```text
Work Item → Plan → Implementation → Verification → Review → Commit
```

A Work Item must be Ready before implementation, and a commit is never implicit. Accepted DEC and Current-truth specifications take precedence over a Work Item when they conflict.

## GitHub workflow

The repository is privately hosted on GitHub. Create a bounded Work Item, Bug, or Decision Review with the matching [GitHub Issue Form](.github/ISSUE_TEMPLATE/); work on a branch associated with that Issue; then open a Pull Request using the [GitHub PR template](.github/pull_request_template.md). GitHub forms are an adaptation layer: the [Work Item contract](docs/implementation/work-item-template.md) and platform-neutral templates remain authoritative.

## Current setup

Use Node.js 24.18.0 (declared in `.node-version`) and Corepack-managed pnpm 11.17.0:

```bash
corepack pnpm install
corepack pnpm install --frozen-lockfile
corepack pnpm format
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm build
corepack pnpm check
corepack pnpm workspace:check
corepack pnpm check:docs
corepack pnpm check:decisions
corepack pnpm check:secrets
corepack pnpm repository:check
```

Before a commit, run `corepack pnpm check`. It runs `format:check`, `lint`, `typecheck`, `test`, and `build` without starting Docker services, reaching the network, or reading Secrets. `corepack pnpm test:integration` is the only Docker-dependent command; it is excluded from `check`. `corepack pnpm repository:check` (and the focused `check:docs`, `check:decisions`, and `check:secrets`) run the dependency-free repository-integrity checks over Git-tracked files; they are also Docker-independent. The local quality gate covers the engineering baseline only.

After a successful build, the processes can be started with `corepack pnpm start:web`, `start:api`, `start:worker`, `start:fetcher`, or `start:renderer`. Web remains a baseline page; API provides liveness, the three `/v1/auth/*` endpoints, protected `/v1/content-packages` routes, and `/openapi.json`; worker, fetcher, and renderer remain lifecycle skeletons. API startup requires the validated values documented in `.env.example`.

Generate a local owner-password hash interactively, then apply the committed database migration only after supplying the intended PostgreSQL URL through the environment:

```bash
corepack pnpm auth:hash-password
corepack pnpm db:migrate
```

The password-hash command does not accept plaintext through command-line arguments. The migration command never runs automatically during API startup.

To prepare local state services, copy `.env.example` to an untracked `.env`, replace every placeholder, then run:

```bash
corepack pnpm infra:config
corepack pnpm infra:pull
corepack pnpm infra:up
corepack pnpm infra:status
corepack pnpm infra:logs
corepack pnpm infra:down
```

The Compose baseline runs PostgreSQL on `127.0.0.1:5432`, Redis on `127.0.0.1:6379`, and SeaweedFS `weed mini` S3-compatible object storage on `127.0.0.1:8333` unless overridden in `.env`. Its other internal component ports are not exposed to the Host. The local image is fixed to SeaweedFS `4.29` and its verified manifest digest. `infra:down` retains named volumes. The API can connect to PostgreSQL for server-side Sessions and Content Package metadata after the migrations are applied; it does not use Redis or Object Storage, and no Source, Workflow, Queue, bucket, or production deployment exists.

To verify the five application skeletons and the local state services work together through their real entry points and containers, run:

```bash
corepack pnpm test:integration
```

This starts an isolated `contentos-smoke-*` Compose project that replaces persistent volumes with `tmpfs`, binds ephemeral ports to `127.0.0.1` only, uses temporary credentials outside the repository, applies the reviewed migrations, and exercises Session and Content Package API behavior. It never reads, mounts, or changes the `contentos-local` named volumes. It is a black-box integration harness, not a browser or full product end-to-end test.

These commands remain a bounded M1 foundation. There is no `dev`, browser or full product E2E test, Queue, Source, Workflow, Agent, Render, or publishing-content feature yet.

## Continuous integration

A bounded M0 GitHub Actions workflow at [.github/workflows/ci.yml](.github/workflows/ci.yml) runs on pull requests, pushes to `main`, and manual dispatch. It uses the GitHub-hosted `ubuntu-24.04` runner with read-only permissions, pins the only two reusable actions to immutable commit SHAs, resolves Node from `.node-version`, activates Corepack pnpm `11.17.0`, and installs with the frozen lockfile. It runs two required jobs:

- a Docker-independent job: workspace resolution, `corepack pnpm check`, and `corepack pnpm repository:check` (Markdown local-link, Canonical Decision register, and Secret checks);
- a Docker-dependent job: `corepack pnpm test:integration` through the existing isolated smoke harness.

The workflow references no repository Secrets, persists no credentials, uploads no artifacts, and performs no deployment or release. It is an M0 skeleton, not a full release gate. Both jobs pass on the merged `main` baseline. Read [CI Skeleton](docs/quality/ci-skeleton.md) for the full scope.

## Next implementation steps

1. Complete and merge `M1-CP-001` only after its Domain, persistence, protected API, migration, security, audit, and CI evidence passes.
2. Begin `M1-WEB-001` from the merged Content Package API baseline; do not start Source or Workflow work.

No completion date is committed by this repository.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [Work Item template](docs/implementation/work-item-template.md), and [AGENTS.md](AGENTS.md) before starting a change.

## Historical documents

[Sessions](docs/sessions/) preserve discussion history, and [vision.md](docs/product/vision.md) preserves product background. Implementation should begin with Current-truth specifications and the Decision Register. Historical documents do not automatically override later Accepted DEC.
