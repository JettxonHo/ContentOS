# ContentOS

ContentOS is a single-user, desktop-first Personal AI Content Studio. It turns private, reviewable source material into a traceable content flow:

```text
Source → Research → Human Opinion → Blog / Xiaohongshu → Design → Render → Export
```

It is not a bulk-writing tool or an autonomous publishing system.

## Current status

The repository is completing **M0-A Documentation Runway**. Current-truth specifications and implementation governance are in place, while M0-GOV-001 establishes the repository entry and contribution rules. There is no runnable Web Application and no business-code implementation yet.

The next formal engineering stage is **M0-B Engineering Baseline**, after M0-A Exit Review accepts the documentation runway. This repository does not yet provide a dependency installation, development server, build, or application-test command.

## MVP boundary

The formal MVP is a private, single-user, desktop-first web application with human review. It produces both Blog and Xiaohongshu outputs from a shared Content Foundation, then supports deterministic rendering and manual export/publishing. Public registration, automatic publishing, multi-user collaboration, and unsupported media inputs are outside the MVP. Read the complete [MVP Scope](docs/product/mvp-scope.md).

## Repository contents

The repository currently contains:

- historical [Sessions](docs/sessions/);
- the [Canonical Decision Register](docs/decisions/decisions.md);
- Product, Architecture, Security, and Quality Current-truth specifications;
- Implementation governance: [Roadmap](docs/implementation/roadmap.md), [Milestone Exit Criteria](docs/implementation/milestone-exit-criteria.md), and [Work Item template](docs/implementation/work-item-template.md).

The planned `apps/` and `packages/` directories do not exist until M0-B creates them through bounded Work Items.

## Authoritative documentation map

- [Agent and repository rules](AGENTS.md)
- Product: [definition](docs/product/product-definition.md), [users and jobs](docs/product/user-and-jobs.md), [MVP scope](docs/product/mvp-scope.md)
- Architecture: [domain overview](docs/architecture/domain-overview.md), [technical architecture](docs/architecture/technical-architecture.md), [repository structure](docs/architecture/repository-structure.md), [workflow overview](docs/architecture/workflow-overview.md)
- Security: [security baseline](docs/security/security-baseline.md)
- Quality: [test strategy](docs/quality/test-strategy.md), [release gates](docs/quality/release-gates.md)
- Implementation: [roadmap](docs/implementation/roadmap.md), [exit criteria](docs/implementation/milestone-exit-criteria.md), [Work Item template](docs/implementation/work-item-template.md)
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

There are currently no engineering dependencies to install and no `pnpm install`, development, or application-test command to run. At this stage, contributors need Git and Markdown review only. Useful current checks include `git status --short`, `git diff --check`, `git ls-files`, and local-link review with `rg`.

## Next implementation steps

1. Complete human review of M0-GOV-001.
2. Run the M0-A Exit Review.
3. Start `M0-ENG-001 — Workspace and TypeScript Baseline` only after M0-A acceptance.
4. Progress through the remaining bounded M0 engineering Work Items in the [Roadmap](docs/implementation/roadmap.md).

No completion date is committed by this repository.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [Work Item template](docs/implementation/work-item-template.md), and [AGENTS.md](AGENTS.md) before starting a change.

## Historical documents

[Sessions](docs/sessions/) preserve discussion history, and [vision.md](docs/product/vision.md) preserves product background. Implementation should begin with Current-truth specifications and the Decision Register. Historical documents do not automatically override later Accepted DEC.
