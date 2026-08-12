# ContentOS Repository Structure

**Status:** Current Truth

**Scope:** Planned Monorepo layout, package ownership, dependency direction, and current creation boundaries

**Last Updated:** 2026-08-07

This document specifies the planned Repository structure and the subset that currently exists. M0 created the five process skeletons, four shared-package skeletons, local services, quality tooling, integration harness, and CI. M1 adds the database/authentication boundary, Content Package Domain and API slice, and the first Web product loop within those existing boundaries. Remaining package and Docker build paths are still planned.

Related documents:

- [Technical Architecture](technical-architecture.md)
- [Process Topology](process-topology.md)
- [Domain Overview](domain-overview.md)
- [Artifact Versioning](artifact-versioning.md)
- [MVP Scope](../product/mvp-scope.md)

---

## 1. Repository Goals

The ContentOS Repository must provide:

- One Repository and one coordinated release context;
- One pnpm lockfile and visible dependency graph;
- Clear Domain Module and infrastructure ownership;
- Shared, validated cross-boundary Contracts;
- Separate entry points for the five deployable processes;
- Framework-independent Domain and Application code;
- Testable dependency seams and reusable test support;
- Predictable paths that developers and Codex can navigate without relying on historical Sessions;
- Incremental growth by Milestone instead of speculative package scaffolding.

## 2. Planned Root Structure

The target structure is:

```text
contentos/
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   ├── fetcher/
│   └── renderer/
├── packages/
│   ├── core/
│   ├── contracts/
│   ├── database/
│   ├── queue/
│   ├── agent-runtime/
│   ├── model-adapters/
│   ├── object-storage/
│   ├── rendering/
│   ├── observability/
│   ├── config/
│   └── testing/
├── schemas/
├── migrations/
├── docs/
├── docker/
├── compose.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

This is a planned destination, not a claim that the paths already exist. M0 Engineering may create only the subset required by its bounded Work Items. Later packages are created when their Milestone first needs them.

### Current engineering baseline

The repository has a Node.js 24.18.0 / pnpm 11.17.0 workspace with one lockfile and these six private ESM packages:

```text
packages/core
packages/contracts
packages/config
packages/testing
packages/database
packages/object-storage
```

`core`, `contracts`, and `config` expose the bounded authentication, Content Package, Source, Workflow, and Research values/Ports. G1 adds a deep Research module: the application service depends only on project-owned repository/provider/ID/clock interfaces, consumes exact Approved Source Versions, validates `research/v1`, and owns review/checkpoint/Approval rules without importing NestJS, Drizzle, or a Provider SDK. `database` owns the Drizzle Session, Content Package, Source, Workflow, URL delivery, and Research schemas plus PostgreSQL adapters and migration runner. Its Research adapter keeps Raw Provider output restricted, stores exact Source Version inputs, and implements owner-scoped Working Copy, immutable Version, Head, Approval, and Outdated state. Existing Workflow, Fetcher Gateway, Result, and Object Storage ownership remains unchanged. `testing` owns deterministic unit support and the isolated Integration/Browser harnesses, now including the G1 Research thin slice. Package build outputs remain generated under ignored `dist/` directories.

M0-ENG-002 adds only these deployable-process skeletons:

```text
apps/web
apps/api
apps/worker
apps/fetcher
apps/renderer
```

Web now owns the M1 login, active/archived Dashboard, new-package form, Workspace metadata editor, typed browser API client, active-only Source review and Timeline presentation, and the reusable Workflow recovery controller; it never accesses PostgreSQL or Secrets. Source review keeps local draft state provisional until an explicit API save, renders normalized Source bodies as text only, and opens an exact-Version human-Approval confirmation only for the current Review Candidate. API composes liveness, authentication, exact-Origin enforcement, the Content Package routes, the Source routes (capture, list, get, working-copy edit, version creation, version list, approval), the protected owner URL-capture Command route, the read-only owner Workflow projection/Timeline routes, the private notification-only Workflow SSE route, the private non-OpenAPI Fetcher Gateway, common errors, OpenAPI JSON, PostgreSQL adapters, and the S3-compatible ObjectStore adapter. The URL-capture route persists only a safe request/task/outbox boundary; the private Gateway owns API-authoritative Claim/Heartbeat/Result and Source promotion; the Workflow Query token owns no write. Worker owns the bounded Outbox Dispatcher, expired-lease/delivery reconciliation, its Worker-only configuration, and the BullMQ producer adapter. `M2-FETCH-001C` registers Fetcher-owned Queue, Gateway-client, and orchestration modules in `apps/fetcher`: they validate the shared fixed Queue Job, claim through the API, compose the already accepted public transport/Candidate preparation/scoped Snapshot writer, and submit the exact Result. The Fetcher receives no PostgreSQL credential and never mutates Source or Workflow tables directly. Renderer remains a lifecycle skeleton. The root `migrations/` path contains the reviewed forward migrations and Drizzle metadata; the root `schemas/` directory contains the versioned Normalized Source JSON Schema 2020-12 document; every other planned infrastructure package remains absent.

M0-QUAL-002 adds the integration smoke harness inside the existing `packages/testing` package, without adding a new package or application:

```text
packages/testing/fixtures/compose.smoke.yaml
packages/testing/src/integration/**
```

The fixture combines with the root `compose.yaml` to start an isolated `contentos-smoke-*` project using `tmpfs` and ephemeral loopback ports. In M1 it applies the reviewed authentication migration and tests the API Session adapter without touching local named volumes. Read [Integration Smoke Harness](../quality/integration-smoke-harness.md).

M0-CI-001 adds a bounded GitHub Actions workflow and dependency-free repository-integrity checks, without adding a new package or application:

```text
.github/workflows/ci.yml
packages/testing/src/repository/**
```

The workflow runs the existing workspace, Docker-independent quality, repository-integrity, and Docker-dependent integration-smoke checks on the GitHub-hosted `ubuntu-24.04` runner. The repository-check source is a self-contained TypeScript module executed directly by Node's built-in type-stripping (no new dependency, no build step); it provides Markdown local-link, Canonical Decision register, and bounded Secret checks over Git-tracked files. It introduces no product behavior, release platform, or deployment. Read [CI Skeleton](../quality/ci-skeleton.md) for its scope.

## 3. `apps` Responsibilities

| Planned path    | Responsibility                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`      | Next.js product UI, routes, structured Editors, API client composition, SSE client, and UI-specific state                     |
| `apps/api`      | NestJS/Fastify composition root, HTTP Controllers, Guards, DTO mapping, OpenAPI, SSE, and Adapter wiring                      |
| `apps/worker`   | General async process entry point, BullMQ Worker registration, Workflow asynchronous execution, and Agent Runtime composition |
| `apps/fetcher`  | Restricted Source-fetch process entry point, public-egress policy composition, extraction, and safe Source Candidate handling |
| `apps/renderer` | Isolated Playwright/Chromium process entry point, render-job execution, validation, and output upload                         |

An `apps` project primarily owns a deployable process entry point and composition. It does not become the cross-project home for Domain truth. Process-specific Controllers, bootstrap, lifecycle, and wiring belong in `apps`; reusable Domain and Adapter behavior belongs in the appropriate owned package.

## 4. `packages` Responsibilities

`M2-WEB-001A` adds the framework-neutral Core URL-intake read Port, its PostgreSQL projection, and the typed API Contract. The active Web Source Intake panel uses those API reads and existing Source commands without PostgreSQL or Secret access.

| Planned package  | Responsibility                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `core`           | Domain Modules, Application Use Cases, Ports, Domain Events, pure Validators, and Domain errors                                           |
| `contracts`      | Generated or shared boundary types for API, Queue, Agent, Event, Artifact metadata, Validation, and Object References                     |
| `database`       | Drizzle Schema, Repository Adapters, Transactions, Query SQL, Outbox persistence, and lease persistence                                   |
| `queue`          | Queue names, minimal Job Schemas, BullMQ Adapters, retry configuration, registrations, and reconciliation support                         |
| `agent-runtime`  | Context building, Prompt assembly, deterministic Model Router, execution, parsing, Schema validation, bounded repair, and budgets         |
| `model-adapters` | Provider-neutral model interface implementations, Provider-specific Adapters, error/usage normalization, and Fake Provider Adapter        |
| `object-storage` | Implementations of the Core-owned ObjectStore Port, S3-compatible Adapters, quarantine operations, temporary access, and integrity checks |
| `rendering`      | Component Registry implementation, controlled templates, render orchestration, fit/layout validation, and Renderer-shared behavior        |
| `observability`  | Structured logging, redaction, Correlation ID propagation, OpenTelemetry setup, and metric definitions                                    |
| `config`         | Typed runtime configuration, process Schemas, Secret References, and configuration validation                                             |
| `testing`        | Shared Fixtures, fakes, builders, database factories, Queue helpers, and Workflow test scenarios                                          |

These are planned ownership boundaries. A package is created only when a bounded Work Item requires its responsibility.

## 5. Core Package

`packages/core` is the framework-independent center of the modular monolith. It may contain:

- Domain entities and value objects;
- Application Use Cases;
- Ports;
- Domain Events;
- pure Domain Validators;
- Domain and Application errors.

It must not depend on:

- Next.js;
- NestJS or Fastify;
- Drizzle or a PostgreSQL driver;
- BullMQ or a Redis client;
- Playwright or Chromium;
- a Provider SDK;
- an S3 SDK;
- the OpenTelemetry SDK.

Core defines the capabilities it requires as Ports. Infrastructure packages implement those Ports and are wired by application composition roots.

## 6. Domain Module Organization

The planned Domain Modules are:

```text
content-package
source
research
human-opinion
publishing
visual
render-export
workflow
agent-execution
security
```

A module may use this internal shape:

```text
module/
├── domain/
├── application/
├── ports/
├── events/
├── validators/
└── errors/
```

This shape is recommended, not a mandate to create every directory in advance. A module should expose the smallest stable public surface required by current use cases.

Domain Module and deployable process are different axes. For example, the `source` Domain Module may be invoked by the API and Fetcher, while the Fetcher remains a process boundary. A NestJS Module may compose a Domain Module but does not replace it.

## 7. Contracts Package and `schemas/`

`schemas/` is the planned authoritative home for ContentOS-owned JSON Schema 2020-12 documents, including versioned Artifact, Agent input/output, Workflow payload, and Export Manifest Schemas.

`packages/contracts` contains generated or deliberately shared TypeScript boundary types and primitives. Schema and generated TypeScript types must remain synchronized through CI; hand-maintained duplicate definitions are prohibited.

Contract ownership remains explicit:

- JSON Schema expresses persisted and cross-process structural Contracts;
- OpenAPI expresses HTTP request, response, and error Contracts;
- Domain Types express internal invariants and behavior;
- Queue payload Contracts remain minimal dispatch envelopes.

Artifact Schemas and OpenAPI DTOs may share primitives but do not become one undifferentiated object model.

## 8. Infrastructure Packages

Infrastructure packages implement Ports defined by Core/Application boundaries. They may depend on approved SDKs and infrastructure libraries, but they do not define or override Domain rules.

Provider-specific behavior remains isolated in the package that owns the Adapter. For example:

- Drizzle mapping belongs in `database`, not `core`;
- BullMQ registration belongs in `queue`, not a Workflow Domain entity;
- model Provider SDK calls belong in `model-adapters`, not an Agent Spec;
- S3 SDK use belongs in `object-storage`, not a Source or Asset entity;
- Playwright-specific execution belongs in `rendering` and `apps/renderer`, not `core`.

Infrastructure packages may depend on Core-owned interfaces and boundary Contracts. Core must never depend back on their concrete implementations.

## 9. Dependency Direction

The approved direction is:

```text
apps / composition roots
        ↓
infrastructure adapters ─────┐
        ↓                    │ implements Ports
application use cases ◄──────┘
        ↓
domain
```

Applications compose both Use Cases and Adapters. Application and Domain layers never locate infrastructure through hidden global state.

Prohibited directions include:

```text
domain → framework
domain → ORM
domain → queue
domain → Provider SDK
domain → renderer
domain → Object Storage SDK
```

The `contracts` package must not become a route for infrastructure concepts to leak into Domain objects.

## 10. Cross-package Rules

- Cross-package imports use the owning package's public exports.
- Consumers do not import another package's deep internal path.
- Circular package dependencies are prohibited.
- A generic `shared` or `utils` package is not created.
- Shared code must have a named responsibility and owner.
- Cross-module write behavior uses the owning Application Use Case, Command, Port, or Event.
- Cross-module Query Projections may read across module data but cannot write Domain state.
- Process-specific bootstrap, Controller, lifecycle, or network code does not belong in Core.
- Provider-specific types do not cross the Model Adapter boundary as Domain Contracts.
- Renderer-specific types and SDK objects do not cross into Domain Core.
- Database Rows do not cross Repository Adapters as public API DTOs.

## 11. Package Creation Policy

- Do not create all planned packages for hypothetical future needs.
- M0 creates only the approved foundation skeleton required by bounded Work Items.
- A new package requires a clear responsibility, owner, consumers, and dependency direction.
- A meaningful change to the overall package boundary requires architecture review and may require a new Decision.
- One reusable file or helper is not sufficient reason to create a package.
- Empty directories and placeholder packages do not count as architecture progress.
- Packages for Agent, rendering, queue, storage, or observability are introduced at the Milestone where their first real slice needs them unless an approved M0 Work Item explicitly establishes a minimal foundation.

## 12. Naming and Exports

Package and module naming must remain consistent with the Domain language in [Domain Overview](domain-overview.md). Every package exposes a stable, intentional public API; internal implementation paths are not supported imports.

M0-ENG-001 selects the `@contentos` npm scope and ESM (`NodeNext`) module baseline for the initial private packages. It deliberately does not select an export-map shape or a package build strategy; those remain Open Implementation Decisions until a bounded Work Item requires them.

## 13. Tests Placement

- Unit Tests may live near Domain code or follow a later Repository-wide convention.
- Integration Tests use dedicated test support and real or containerized dependencies where their contract requires it. The M0 integration smoke harness lives in `packages/testing/src/integration/**` and is collected only by `corepack pnpm test:integration`; the ordinary `corepack pnpm test` and `corepack pnpm check` commands exclude it.
- The bounded M1 browser scenario lives in `packages/testing/src/browser/**`, uses pinned Playwright Chromium, and is collected only by `corepack pnpm test:browser`. It reuses the isolated smoke runtime and is also excluded from ordinary unit tests and `check`.
- Reusable Fixtures, fakes, clocks, builders, database factories, and Queue helpers belong in `packages/testing` when genuinely shared. The M0 smoke Compose override lives at `packages/testing/fixtures/compose.smoke.yaml`.
- Repository-integrity checks (Markdown links, Canonical Decision register, Secret scan) and their deterministic tests live in `packages/testing/src/repository/**`. The checks run locally via `corepack pnpm repository:check` and in the M0 CI workflow; their tests are collected by the ordinary `corepack pnpm test` command.
- Agent Eval datasets are governed evaluation assets, not ordinary Unit Test Fixtures.
- Renderer Fixtures and visual baselines are managed separately from general Domain Fixtures.
- Tests must import packages through the same supported public boundaries as production consumers where practical.

The exact test runner, filename convention, and test-directory layout remain open.

## 14. Documentation Placement

| Documentation layer          | Planned location and role                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Historical Sessions          | `docs/sessions/` preserves discussion, alternatives, and historical context                                                              |
| Decision Register            | `docs/decisions/decisions.md` is the canonical Decision index; split files preserve detailed records                                     |
| Current-truth Specifications | `docs/product/`, `docs/architecture/`, `docs/security/`, `docs/quality/`, and `docs/implementation/` define current implementation rules |
| Implementation documentation | README and bounded implementation docs describe actual commands, environment, and operational procedures once implemented                |
| Agent governance             | Root `AGENTS.md` defines concise, executable rules for coding agents                                                                     |

Current-truth documents must reflect later Accepted Decisions over conflicting historical Session text. Implementation docs must not describe planned paths as existing before they are created.

## 15. M0 Creation Boundary

M0 Engineering is initially allowed to create these planned paths:

```text
apps/web
apps/api
apps/worker
apps/fetcher
apps/renderer
packages/core
packages/contracts
packages/config
packages/testing
schemas
migrations
docker
```

This list is permission for bounded M0 Work Items, not a requirement to create everything in one change. M0 may also create the approved root engineering files defined by its Work Items, such as the workspace, TypeScript, Compose, CI, README, and lockfile baselines.

The remaining planned packages are created according to Milestone need. M0 does not implement Content Package, Source, Workflow, Agent Runtime, Fetcher logic, Renderer logic, or other business behavior.

## 16. Explicit Repository Exclusions

The Repository plan excludes:

- Separate frontend Repository;
- separate backend Repository;
- one Repository per Agent;
- microservice Repositories;
- a generic plugin directory;
- a generic shared-everything package;
- vendor-specific Provider code inside Core;
- arbitrary generated files committed without ownership and regeneration policy;
- duplicate hand-maintained Schema and TypeScript boundary definitions;
- process-specific implementation hidden inside Domain Modules.

## 17. Open Implementation Decisions

The Repository plan does not yet select:

- Build Orchestrator;
- package build strategy;
- import-boundary enforcement mechanism;
- Test placement convention;
- generated-code location;
- OpenAPI client location.

These choices belong to bounded M0 Engineering Work Items. They must preserve one lockfile, dependency direction, public exports, and framework-independent Core.

## 18. Decision Traceability

| Repository concern                                                        | Accepted Decisions | Primary historical sources                                                                                                      |
| ------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Content Package, storage, structured output, and logical Agent boundaries | DEC-023–DEC-042    | [Session-006](../sessions/session-006.md), [Session-007](../sessions/session-007.md), [Session-008](../sessions/session-008.md) |
| Renderer package and dependency isolation                                 | DEC-111–DEC-124    | [Session-016](../sessions/session-016.md)                                                                                       |
| Workflow, Command, Task, and Promotion ownership                          | DEC-125–DEC-139    | [Session-017](../sessions/session-017.md)                                                                                       |
| Domain Modules, API DTO separation, Ports, Query Projections, and Outbox  | DEC-160–DEC-176    | [Session-019](../sessions/session-019.md)                                                                                       |
| Agent Runtime and Provider Adapter ownership                              | DEC-177–DEC-198    | [Session-020](../sessions/session-020.md)                                                                                       |
| Security, Service Identity, Fetcher, Renderer, and Secret boundaries      | DEC-199–DEC-220    | [Session-021](../sessions/session-021.md)                                                                                       |
| Monorepo, stack, processes, packages, and dependency direction            | DEC-221–DEC-243    | [Session-022](../sessions/session-022.md)                                                                                       |
| M0 skeleton, Work Item sizing, documentation, and scope governance        | DEC-267–DEC-293    | [Session-024](../sessions/session-024.md)                                                                                       |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
