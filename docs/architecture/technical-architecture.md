# ContentOS Technical Architecture

**Status:** Current Truth

**Scope:** MVP system architecture, approved technology responsibilities, state authority, and implementation constraints

**Last Updated:** 2026-07-27

This document defines the current technical architecture for the ContentOS MVP. It integrates Accepted Decisions into implementation-facing constraints without choosing unresolved package versions, products, deployment vendors, or code structure details.

Related current-truth documents:

- [Product Definition](../product/product-definition.md)
- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](domain-overview.md)
- [Artifact Versioning](artifact-versioning.md)
- [Process Topology](process-topology.md)
- [Repository Structure](repository-structure.md)

---

## 1. Architecture Goals

The MVP architecture must:

- Preserve one coherent Domain model across UI, API, asynchronous execution, rendering, and persistence;
- Make Workflow, Task, Approval, Version, dependency, and execution state auditable and recoverable;
- Isolate untrusted public Source retrieval from the application and isolate Browser rendering from public-network access;
- Keep early development, deployment, and operations understandable for a private single-user product;
- Support deterministic validation, idempotent recovery, and exact execution traceability;
- Preserve clear module and process boundaries that can scale independently when justified;
- Avoid premature microservices, multiple databases, or a second Workflow authority.

Architecture supports the MVP product loop; it does not expand the product into a generic Agent or infrastructure platform.

## 2. Approved Architecture Style

```text
TypeScript Modular Monolith
+
Isolated Worker Processes
```

The modular monolith means:

- One Repository;
- One primary implementation language;
- One lockfile and coordinated dependency graph;
- One primary PostgreSQL database;
- One authoritative Domain model;
- One coordinated release context;
- Explicit internal module ownership.

It does **not** mean one executable, one Node.js process, one giant NestJS Module, or unrestricted access to every table.

The `web`, `api`, `worker`, `fetcher`, and `renderer` applications may run as separate processes or containers. They remain parts of one coherently versioned application. ContentOS does not use database-separated microservices in the MVP.

## 3. Approved Technical Stack

No exact package version is approved here except the runtime baseline explicitly named by Accepted Decisions.

| Area | Approved technology | Responsibility |
|---|---|---|
| Primary language | TypeScript | Web, API, Workers, Agent Runtime, Renderer, shared Contracts, and tooling |
| Runtime | Node.js 24 LTS | Initial development and production runtime |
| Workspace | pnpm Workspace | One Monorepo dependency graph and one lockfile |
| Web | Next.js App Router | Product UI, routes, server-rendered queries, and client Editors |
| API | NestJS + Fastify | Composition, HTTP adapter, authorization, Commands, Queries, and lifecycle |
| HTTP contract | REST + OpenAPI | Versioned Application API and generated or synchronized clients |
| Authoritative data | PostgreSQL | Domain, Workflow, execution, version, approval, and audit metadata |
| Database access | Drizzle ORM | Schema, typed queries, transactions, Repository Adapters, and migration tooling |
| Schema change | Reviewed SQL Migrations | Version-controlled and deployment-gated production changes |
| Short-lived coordination | Redis | BullMQ state, delayed work, retry timing, locks, and bounded coordination |
| Async dispatch | BullMQ | Delivery of already-authorized Tasks to eligible Workers |
| File storage | Private S3-compatible Object Storage | Snapshots, uploads, Assets, Previews, Renders, and Exports |
| Cross-boundary schema | JSON Schema 2020-12 | Persisted Artifact, Agent, Workflow payload, and Export Manifest Contracts |
| Runtime schema validation | Ajv | JSON Schema validation; not a replacement for Domain or security validation |
| Browser rendering | Playwright + pinned Chromium | Controlled Preview and Final Render execution |
| Progress updates | Server-Sent Events | One-way status updates from API to client |
| Recovery transport | Polling fallback | Restores client state from authoritative read APIs after missed SSE events |
| Logs | Structured JSON Logs | Machine-readable operational events with redaction |
| Telemetry | OpenTelemetry Traces and Metrics | Cross-process execution correlation and operational measures |
| Local orchestration | Docker Compose | Local state services and process topology |
| Initial production | Single-region container deployment | Private single-user deployment; compute may begin on one host |

Python is not the core MVP backend. It may be considered later only behind an explicit isolated boundary when a concrete capability requires it.

## 4. Source of Truth

| Information | Authority | Non-authoritative representations |
|---|---|---|
| Domain entities and ownership | PostgreSQL | Browser state, Queue state, projections |
| Artifact, Working Copy, immutable Version, and Head | PostgreSQL | Editor cache, SSE events |
| Workflow, Command, Task, Agent Run, and lease | PostgreSQL | BullMQ Job state, Worker memory |
| Approval, dependency, Provenance, and warning acknowledgement | PostgreSQL | UI badges, cached summaries |
| Outbox, Render, Export, and execution metadata | PostgreSQL | Queue state, local files |
| Raw snapshots, uploads, Assets, Previews, Renders, and Exports | Private Object Storage | Temporary local workspace, temporary URL |
| Queue delivery and short-term coordination | Redis / BullMQ | Never the sole business record |
| Client progress notification | SSE | Never Workflow truth |

The Browser may hold editor and ephemeral UI state, but it cannot authoritatively decide Workflow status. Read APIs resolve current state from PostgreSQL-backed application Queries.

Queue payloads contain Task identity and minimum routing metadata. They do not carry complete Source text, Prompt, Human Opinion, Artifact Body, binary Asset, or Secret.

## 5. Application Boundaries

### Next.js Web

Next.js owns the product UI, route composition, server-rendered Queries, client-side structured Editors, and SSE client. It may call the typed Application API but does not directly access PostgreSQL or reimplement approval, version, authorization, or Workflow rules.

Next.js Server Actions are not a second authoritative backend. If used for UI composition, they delegate authoritative mutations to the NestJS API.

### NestJS API

The NestJS API is the authoritative entry point for Domain writes and Workflow Commands. It owns authentication and authorization enforcement, API DTO validation, Application Use Case invocation, Query projection access, upload/download authorization, and SSE endpoints.

The API does not perform long-running Agent execution, public Source fetching, or Browser-based Final Render inline with an HTTP request.

### Domain Core

Domain objects and Application Use Cases remain framework-independent. They expose Ports for persistence, queues, object storage, models, time, identity, and other infrastructure needs. Infrastructure Adapters implement those Ports.

## 6. Modular Monolith Boundaries

| Boundary | Meaning |
|---|---|
| Domain Module | Owns terminology, invariants, entities, values, errors, and write rules for one business capability |
| Application Use Case | Coordinates one authorized business action using Domain rules and Ports |
| Port | Framework-independent capability required by Domain or Application code |
| Infrastructure Adapter | Implements a Port with PostgreSQL, BullMQ, Object Storage, Provider, or another approved technology |
| Query Projection | Read-oriented view that may combine data across module-owned tables without gaining write authority |
| Composition Root | Wires Use Cases, Ports, Adapters, process configuration, and lifecycle at an application entry point |

Cross-module writes must go through the owning module's Use Case, Command, or Event. A shared database does not authorize one module to update another module's tables directly.

Cross-module reads may use explicit Query Projections. Projections are read models and do not become editable sources of truth.

A NestJS Module is a composition boundary. It may assemble a Domain Module, but it is not itself the Domain Module or the source of Domain truth.

## 7. Persistence Architecture

PostgreSQL stores structured, relational, and queryable Domain and execution state. Drizzle defines typed database access and implements Repository Adapters, while Domain code remains unaware of Drizzle rows.

Strong-consistency operations use explicit PostgreSQL Transactions. Examples include Working Copy revision updates, immutable Version creation, Head changes, Approval, Task creation, dependency creation, and Outbox insertion.

Important asynchronous intent is persisted through a Transactional Outbox in the same transaction as the corresponding Domain state and Task.

Production schema changes use reviewed, version-controlled SQL Migrations. One dedicated deployment Job applies them before new application instances accept traffic. Breaking changes use expand-and-contract:

```text
Add compatible structure
→ Deploy compatible code
→ Backfill
→ Switch reads and writes
→ Verify
→ Remove old structure in a later change
```

This document does not define tables, columns, indexes, transaction isolation, or locking algorithms.

## 8. Async Processing Architecture

```text
PostgreSQL Task
→ Transactional Outbox
→ Outbox Dispatcher
→ BullMQ Job
→ Worker
```

Task eligibility is decided before dispatch by deterministic application and Workflow policy. BullMQ delivers work; it does not decide whether the work is legally allowed.

The effective failure model is at-least-once in the worst case:

- An Outbox Event may be dispatched more than once;
- A Queue Job may be delivered more than once;
- A Worker may crash after an external or persistence side effect;
- Redis may lose Queue state.

Workers must therefore be idempotent. Before side effects they load the PostgreSQL Task and verify Task state, idempotency identity, lease, cancellation, prior Runs, prior outputs, and Promotion state.

Task and Agent Run state, leases, heartbeats, and results remain in PostgreSQL. Reconciliation discovers eligible incomplete Tasks without a valid active lease and recreates missing Queue Jobs after Redis loss or Worker failure.

A Queue payload is limited to values such as `task_id`, `task_type`, and `correlation_id`. Full user content and Secrets are loaded through authorized, authoritative references after the Worker accepts the Task.

## 9. Object Storage Architecture

Domain and Application code depend on an `ObjectStore` Port rather than a cloud SDK or URL format. Infrastructure Adapters implement the Port for local and production S3-compatible storage.

Private Object Storage contains:

- Raw Source Snapshots;
- Uploaded files;
- Generated or uploaded Assets;
- Preview Render files;
- immutable Final Render outputs;
- Export Packages;
- other explicitly classified large execution objects.

Quarantine objects are separated from validated formal objects. Unvalidated uploads and unsafe Source material cannot enter Agent Context or formal output paths.

PostgreSQL stores durable Object References, Object Keys, hashes, MIME information, ownership, classification, and lifecycle metadata. A signed or temporary URL is only an access mechanism and never the permanent reference.

The architecture does not bind ContentOS to a particular cloud, bucket product, or local Object Storage implementation.

## 10. Contract Architecture

ContentOS keeps these representations distinct:

| Contract type | Purpose |
|---|---|
| TypeScript Domain Type | Internal entities, values, invariants, and Application results |
| JSON Schema cross-boundary Contract | Runtime validation of persisted Artifacts, Agent input/output, Workflow payloads, and Export Manifests |
| OpenAPI HTTP Contract | External Application API requests, responses, errors, and versioned endpoints |
| Database Row | Persistence representation owned by a Repository Adapter |
| Queue Payload | Minimal dispatch envelope identifying authoritative Task state |

The mapping boundary is:

```text
Database Row
→ Repository Adapter
→ Domain / Application Result
→ API DTO
```

An ORM Row, Domain Object, and API DTO must not be collapsed into one object. JSON Schema validation establishes structural validity; separate Domain and security Validators enforce business and trust rules.

TypeScript boundary types are generated from or continuously synchronized with ContentOS-owned Schemas in CI. OpenAPI DTOs and Artifact Schemas may share primitives but remain different contracts.

## 11. Configuration and Secrets

Each process has a typed runtime-configuration Schema and validates required configuration at startup. Missing or invalid critical configuration fails fast before the process accepts work.

Configuration is process-specific and least-privilege. Secret values remain in a dedicated Secret Layer and are addressed through Secret or Credential References. A process resolves only the Secrets it is authorized to use.

An eventual `.env.example` may contain names and placeholders only. Secret values must not enter the Repository, ordinary configuration objects, Queue payloads, logs, traces, frontend responses, Prompts, or Export Packages.

The exact configuration library and Secret Provider remain open implementation decisions.

## 12. Observability

Every process emits structured, redacted JSON Logs. Correlation IDs connect the Browser or HTTP request, Command, Task, Agent Run, Model Call Attempt, Promotion, Render, and Export path where applicable.

OpenTelemetry provides server-side Traces and Metrics. Ordinary telemetry must not store complete:

- Source content;
- Prompt content;
- Human Opinion;
- Raw Model Output;
- Artifact Body;
- Secret or credential value;
- signed or temporary URL.

Raw Model Output and other restricted diagnostics use separately authorized storage, access, retention, and audit controls; they are not normal telemetry.

## 13. Local Development

The approved local baseline consists of:

- Node.js 24 LTS;
- pnpm Workspace;
- Docker Compose;
- PostgreSQL;
- Redis;
- S3-compatible Object Storage;
- a Fake Model Adapter;
- deterministic Fixtures and Seed Data.

Local development must be repeatable without real model cost or network availability. Real Providers are enabled only for explicit integration or manual testing. Actual commands, ports, images, and environment files belong to later Repository implementation and README work.

## 14. Initial Production Deployment

The initial product is a private, single-user, single-region container deployment. The five compute processes may initially run on one Host while retaining separate process identities, Secrets, networks, and resource boundaries.

PostgreSQL, Redis, and Object Storage may be managed or self-hosted. This architecture does not select a VPS, cloud vendor, or managed-service vendor.

The first deployment does not promise high availability. Backup, restore, monitoring, resource limits, and failure recovery remain launch requirements even when all compute runs on one Host.

## 15. Explicitly Deferred Architecture

The MVP does not introduce:

- Microservice databases or distributed transactions;
- Kubernetes;
- Kafka;
- Temporal as Workflow authority;
- GraphQL;
- a serverless-only core runtime;
- Python as the core backend;
- separate frontend and backend Repositories;
- Redis as Workflow Source of Truth;
- arbitrary Browser Fetch for every Source;
- one high-permission process for fetching, model execution, and rendering.

These boundaries may be reconsidered only when concrete requirements justify a separate architecture review and, when material, a new Decision.

## 16. Architecture Invariants

- PostgreSQL is the authority for Domain, Workflow, Task, Approval, Version, and execution metadata.
- Redis and BullMQ are never the sole store of business truth.
- Domain Core does not depend on application frameworks or infrastructure SDKs.
- A Queue Job may be delivered repeatedly.
- Worker processing and external side effects must be idempotent or safely reconciled.
- Queue payloads contain identity and minimum metadata, not complete user content or Secrets.
- Fetcher and Renderer use isolated identities, permissions, and network boundaries.
- Fetcher has controlled public egress; Renderer has no public egress.
- Secrets do not enter Queue payloads, normal telemetry, Prompts, exports, or the Repository.
- Web does not bypass the API to modify authoritative Domain or Workflow state.
- Cross-module writes remain controlled by the owning module.
- ORM Rows, Domain Objects, and API DTOs remain separate.
- SSE and Browser state are not Workflow authority.
- Production Migrations are not run concurrently by every API Replica.
- A process boundary does not imply a microservice or separate database.

## 17. Open Implementation Decisions

Accepted Decisions do not yet select:

- Exact package versions;
- Lint and formatter tools;
- Test runner;
- PostgreSQL major version;
- Redis deployment mode;
- Local Object Storage product;
- Authentication library;
- Reverse proxy;
- CI platform;
- Telemetry backend.

These choices require bounded implementation work and must preserve the architecture invariants above. This document intentionally makes no selection.

## 18. Decision Traceability

| Architecture area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Chief Editor, deterministic execution, logical Agents, and Vertical Slice | DEC-023–DEC-025, DEC-036, DEC-038–DEC-039 | [Session-006](../sessions/session-006.md), [Session-008](../sessions/session-008.md) |
| Domain, persistence, API, dependency, and Outbox foundations | DEC-030–DEC-035, DEC-160–DEC-176 | [Session-007](../sessions/session-007.md), [Session-019](../sessions/session-019.md) |
| Renderer and Export boundaries | DEC-111–DEC-124 | [Session-016](../sessions/session-016.md) |
| Workflow, Tasks, idempotency, and Promotion | DEC-125–DEC-139 | [Session-017](../sessions/session-017.md) |
| Agent Runtime and model boundary | DEC-177–DEC-198 | [Session-020](../sessions/session-020.md) |
| Security, process identity, Source isolation, and telemetry privacy | DEC-199–DEC-220 | [Session-021](../sessions/session-021.md) |
| Technical stack, processes, storage, queues, contracts, and deployment | DEC-221–DEC-243 | [Session-022](../sessions/session-022.md) |
| MVP, M0, implementation, and governance boundary | DEC-267–DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
