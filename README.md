# ContentOS

Language: English | [简体中文](README.zh-CN.md)

ContentOS is a single-user, desktop-first Personal AI Content Studio. It turns private, reviewable source material into a traceable content flow:

```text
Source → Research → Human Opinion or Research-based Mode
→ approved Blog Markdown + approved Xiaohongshu text
→ manual text export
```

It is not a bulk-writing tool or an autonomous publishing system.

## Current status

The repository has completed **M0**, **M1 — Product Skeleton and Domain Foundation**, and **M2 — Source and Workflow Foundation**. [M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md) records the Passed decision for the first private Login → Dashboard → Workspace loop. [M2 Acceptance Record 002](docs/implementation/m2-acceptance-record-002.md) records the fresh current-main Passed decision for the private Source/Workflow foundation. G1/M3 Research and G2 Human Opinion/Blog are effective; the G3 Xiaohongshu content thin slice is implemented by the current candidate.

This repository now provides workspace installation, quality checks, builds, five process entry points, isolated local state services, authentication, Content Package/Source/Workflow/Fetcher foundations, G1 Research, effective G2 Human Opinion/Blog, and the G3 Xiaohongshu content candidate. The active Workspace can independently generate and review provenance-bound Blog and Xiaohongshu text from the same Content Foundation; Xiaohongshu supports a deterministic eight-page Packaging Plan, structured page edit/reorder, immutable checkpoint, exact Approval, Outdated state, and eligible `post.md` / `pages.json` download. PostgreSQL and the API remain authoritative; Raw Provider output is server-side only. No real Provider, generic Agent runtime, Render, image/ZIP Export Package, publishing, production deployment, or development server exists yet.

## MVP boundary

The formal MVP is a private, single-user, desktop-first web application with human review. It independently produces approved Blog Markdown and approved Xiaohongshu text from a shared Content Foundation, then supports manual portable-text export and publishing. Design, image generation, PNG rendering, rich asset packages, production deployment, public registration, automatic publishing, multi-user collaboration, and unsupported media inputs are post-MVP or out of scope. Read the complete [MVP Scope](docs/product/mvp-scope.md) and approved execution [Goal](GOAL.md).

## Repository contents

The repository currently contains:

- historical [Sessions](docs/sessions/);
- the [Canonical Decision Register](docs/decisions/decisions.md);
- Product, Architecture, Security, and Quality Current-truth specifications;
- Implementation governance: [Roadmap](docs/implementation/roadmap.md), [Milestone Exit Criteria](docs/implementation/milestone-exit-criteria.md), and [Work Item template](docs/implementation/work-item-template.md).

The current workspace contains five applications and six packages. G1 adds no package or application: Research domain/service logic lives in `core`, strict HTTP contracts in `contracts`, additive tables/repository in `database`, protected composition in `api`, and the review panel in `web`. Remaining planned packages stay absent until bounded Work Items require them.

## Authoritative documentation map

- [Agent and repository rules](AGENTS.md)
- Product: [definition](docs/product/product-definition.md), [users and jobs](docs/product/user-and-jobs.md), [MVP scope](docs/product/mvp-scope.md)
- Architecture: [domain overview](docs/architecture/domain-overview.md), [Content Package foundation](docs/architecture/content-package-foundation.md), [Source foundation](docs/architecture/source-foundation.md), [technical architecture](docs/architecture/technical-architecture.md), [repository structure](docs/architecture/repository-structure.md), [workflow overview](docs/architecture/workflow-overview.md)
- Security: [security baseline](docs/security/security-baseline.md), [authentication foundation](docs/security/authentication-foundation.md)
- Quality: [test strategy](docs/quality/test-strategy.md), [release gates](docs/quality/release-gates.md), [local quality toolchain](docs/quality/local-quality-toolchain.md), [integration smoke harness](docs/quality/integration-smoke-harness.md), [M1 browser thin slice](docs/quality/browser-thin-slice.md), [M2 acceptance harness](docs/quality/m2-acceptance-harness.md), [CI skeleton](docs/quality/ci-skeleton.md)
- Implementation: [roadmap](docs/implementation/roadmap.md), [exit criteria](docs/implementation/milestone-exit-criteria.md), [M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md), [M2 Acceptance Record 002](docs/implementation/m2-acceptance-record-002.md), [Work Item template](docs/implementation/work-item-template.md), and [agent collaboration workflow](docs/implementation/agent-collaboration-workflow.md)
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
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm build
corepack pnpm check
corepack pnpm workspace:check
corepack pnpm check:docs
corepack pnpm check:decisions
corepack pnpm check:secrets
corepack pnpm repository:check
```

Before a commit, run `corepack pnpm check`. It runs `format:check`, `lint`, `typecheck`, `test`, and `build` without starting Docker services, reaching the network, or reading Secrets. The Docker-dependent `test:integration`, `test:integration:concurrent`, and `test:browser` commands are excluded from `check`. `corepack pnpm repository:check` (and the focused `check:docs`, `check:decisions`, and `check:secrets`) run dependency-free repository-integrity checks over Git-tracked files.

After a successful build, the processes can be started with `corepack pnpm start:web`, `start:api`, `start:worker`, `start:fetcher`, or `start:renderer`. Web provides login, Dashboard, Content Package creation, Source review, and active Research review. API provides liveness, authentication, owner-scoped Content Package/Source/Workflow/Research routes, the private non-OpenAPI Fetcher Gateway, and `/openapi.json`. Research supports get, deterministic generation, Working Copy edit, immutable checkpoint, and exact Approval; it exposes no Raw Provider output. Worker and Fetcher retain their existing scoped delivery identities. Web and API startup require the validated values documented in `.env.example`.

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

The Compose baseline runs PostgreSQL on `127.0.0.1:5432`, Redis on `127.0.0.1:6379`, and SeaweedFS `weed mini` S3-compatible object storage on `127.0.0.1:8333` unless overridden in `.env`. Its other internal component ports are not exposed to the Host. The local image is fixed to SeaweedFS `4.29` and its verified manifest digest. `infra:down` retains named volumes. The API connects to PostgreSQL for server-side Sessions, Content Package metadata, Source metadata, and the API-owned Fetcher Task lease; it connects to S3-compatible Object Storage for immutable Raw Snapshot bytes after the migrations are applied. The Worker connects to PostgreSQL and Redis for delivery-only dispatch. The Fetcher connects only to its independent Redis and Object Storage identities, its configured literal-loopback Gateway origin, and controlled public HTTP/HTTPS; it never receives `DATABASE_URL`. There is no Agent, Render, or production deployment.

To verify the five application skeletons and the local state services work together through their real entry points and containers, run:

```bash
corepack pnpm test:integration
```

This starts an isolated `contentos-smoke-*` Compose project that replaces persistent volumes with `tmpfs`, binds ephemeral ports to `127.0.0.1` only, uses a run-unique temporary directory and credentials outside the repository, applies the reviewed migrations, and exercises Session, Content Package, and Pasted-text Source API behavior. It never reads, mounts, or changes the `contentos-local` named volumes.

Run `corepack pnpm test:integration:concurrent` to launch two complete token-owned smoke runs concurrently and verify that their directories, state, Compose projects, ports, credentials, and cleanup remain isolated from each other and from unrelated harness runs.

After installing the pinned Chromium revision with `corepack pnpm exec playwright install chromium`, run `corepack pnpm test:browser` to exercise the M1/M2/G1 owner-browser suite. Read [M1 Browser Thin Slice](docs/quality/browser-thin-slice.md) and [M2 Acceptance Harness](docs/quality/m2-acceptance-harness.md) for its security, cleanup, and scope boundaries.

These commands remain a bounded M1 foundation plus the active M2 Source, delivery, Fetcher execution, and Source-evidence slices. There is no `dev`, broad product E2E suite, Workflow Engine beyond the current durable request/delivery/lease/recovery/result boundary, Agent, Render, or publishing-content feature yet.

## Continuous integration

A bounded GitHub Actions workflow at [.github/workflows/ci.yml](.github/workflows/ci.yml) runs on pull requests, pushes to `main`, and manual dispatch. It uses the GitHub-hosted `ubuntu-24.04` runner with read-only permissions, pins the only two reusable actions to immutable commit SHAs, resolves Node from `.node-version`, activates Corepack pnpm `11.17.0`, and installs with the frozen lockfile. It runs three required jobs:

- a Docker-independent job: workspace resolution, `corepack pnpm check`, and `corepack pnpm repository:check` (Markdown local-link, Canonical Decision register, and Secret checks);
- a Docker-dependent job: `corepack pnpm test:integration` through the existing isolated smoke harness.
- an M1/M2/G1 browser job: pinned Playwright Chromium runs `corepack pnpm test:browser` against an isolated runtime.

The workflow references no repository Secrets, persists no credentials, uploads no artifacts, and performs no deployment or release. It is a bounded baseline, not a full release gate. All three jobs must pass before a change can merge. Read [CI Skeleton](docs/quality/ci-skeleton.md) for the full scope.

## Next implementation steps

1. G1 Research is effective through PR #290.
2. G2 Human Opinion/Research-based Mode and Blog is effective through PR #292.
3. Review, verify CI, and merge the bounded [G3 Xiaohongshu content Work Item](docs/implementation/work-packets/g3-xiaohongshu-content-thin-slice.md); real Provider calls remain separately authorized.

No completion date is committed by this repository.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [Work Item template](docs/implementation/work-item-template.md), and [AGENTS.md](AGENTS.md) before starting a change.

## Historical documents

[Sessions](docs/sessions/) preserve discussion history, and [vision.md](docs/product/vision.md) preserves product background. Implementation should begin with Current-truth specifications and the Decision Register. Historical documents do not automatically override later Accepted DEC.
