# 95. Decisions

## DEC-221

### Status

Accepted

### Title

ContentOS MVP 使用 TypeScript 模块化单体与隔离 Worker 架构

### Decision

ContentOS uses one TypeScript Monorepo, one primary PostgreSQL Database, and one authoritative domain model.

Web, API, Agent Worker, Source Fetcher, and Renderer run as separate processes or containers.

### Reason

A modular monolith reduces distributed-system complexity while isolated Workers provide workload and security separation.

### Impact

The MVP does not split independent microservice databases and does not require every function to run in one process.

---

## DEC-222

### Status

Accepted

### Title

MVP 固定 Node.js 24 LTS、TypeScript 与 pnpm Workspace

### Decision

Node.js 24 LTS is the initial production runtime.

TypeScript is the primary implementation language for Web, API, Workers, Agent Runtime, and Renderer.

The Repository uses pnpm Workspace and one lockfile.

### Reason

A unified language and dependency graph reduce duplicated Contracts and improve implementation efficiency.

### Impact

Python is not part of the core MVP runtime and may be added later through an isolated service boundary.

---

## DEC-223

### Status

Accepted

### Title

Frontend 使用 Next.js App Router，NestJS API 保持领域写入权威

### Decision

Next.js App Router owns the product UI, Workspace routes, server-rendered queries, and client-side Editors.

Approval, Workflow Commands, Version creation, and other authoritative mutations enter the NestJS API.

Next.js Server Actions do not reimplement core domain logic.

### Reason

Two competing application backends would create inconsistent authorization and workflow behavior.

### Impact

Web uses a typed API client for the `/v1` Application API.

---

## DEC-224

### Status

Accepted

### Title

Backend API 使用 NestJS、Fastify、REST 与 OpenAPI

### Decision

NestJS provides application composition, Guards, Controllers, lifecycle management, and infrastructure wiring.

Fastify is the HTTP Adapter.

The Application API uses REST and OpenAPI.

GraphQL is excluded from the MVP.

### Reason

ContentOS has explicit resource, Command, file, Task, and SSE Contracts that map clearly to REST.

### Impact

API DTOs remain separate from database and Domain models.

---

## DEC-225

### Status

Accepted

### Title

Domain Core 保持 Framework-independent

### Decision

Domain and Application Use Cases do not depend on Next.js, NestJS, Drizzle, BullMQ, Redis, Playwright, or Provider SDKs.

Infrastructure connects through Ports and Adapters.

### Reason

Domain rules must remain independently testable and resilient to infrastructure changes.

### Impact

NestJS Modules operate as composition boundaries rather than Domain truth.

---

## DEC-226

### Status

Accepted

### Title

PostgreSQL 是全部权威领域与 Workflow 状态的 Source of Truth

### Decision

Artifact, Version, Artifact Head, Workflow, Task, Approval, Dependency, Provenance, Agent Run, Outbox, Render, and Export metadata are stored in PostgreSQL.

Redis and BullMQ do not store the sole authoritative business state.

### Reason

Version history, recovery, dependency analysis, and audit require durable relational state.

### Impact

Redis loss can be recovered through PostgreSQL reconciliation.

---

## DEC-227

### Status

Accepted

### Title

Database Access 使用 Drizzle ORM 与受审查的 SQL Migration

### Decision

Drizzle is used for PostgreSQL Schema, Queries, Transactions, Repository Adapters, and migration tooling.

Complex projections may use explicit SQL.

Production schema changes use reviewed and version-controlled SQL migrations.

### Reason

The project needs TypeScript integration while retaining clear PostgreSQL and SQL control.

### Impact

Migrations become release Artifacts and CI gates.

---

## DEC-228

### Status

Accepted

### Title

Redis 与 BullMQ 只承担异步任务分发和短期协调

### Decision

BullMQ dispatches Source, Agent, Image, Render, and Maintenance Tasks.

Queue payloads contain only Task identity and minimum metadata.

Workflow Graph and Task state remain in PostgreSQL.

### Reason

Queue delivery may repeat, and Redis must not become the only workflow history.

### Impact

Workers use idempotent Task handling and frozen Input Snapshots.

---

## DEC-229

### Status

Accepted

### Title

Transactional Outbox 是 PostgreSQL Domain State 与 BullMQ 的可靠桥梁

### Decision

Domain state changes, Task creation, and Outbox insertion occur in one PostgreSQL transaction.

An Outbox Dispatcher delivers Jobs to BullMQ.

Duplicate delivery is handled through idempotency.

### Reason

This prevents database state from committing without the corresponding asynchronous Task being dispatched.

### Impact

ContentOS requires an Outbox Dispatcher, delivery tracking, lag monitoring, and reconciliation.

---

## DEC-230

### Status

Accepted

### Title

MVP Deployable Process 分为 Web、API、Worker、Fetcher 和 Renderer

### Decision

The MVP processes are:

```text
web
api
worker
fetcher
renderer
```

General Workflow and Agent work runs in Worker.

Source Fetcher and Renderer remain separately deployable boundaries.

### Reason

Fetcher and Renderer have distinct network, Browser, resource, and security requirements.

### Impact

The processes share one Repository and release but can be configured and scaled independently.

---

## DEC-231

### Status

Accepted

### Title

Source Fetcher 与 Renderer 使用独立 Container、Service Identity 和权限

### Decision

Fetcher receives restricted public-network access and Snapshot write permission.

Renderer receives Approved Design, Asset, Font, and Render Output permissions while public network access is disabled.

Neither process receives general Agent Provider credentials.

### Reason

Malicious Sources and Chromium execution should be contained within small permission boundaries.

### Impact

Compose and production deployment express separate network, Secret, filesystem, and resource configurations.

---

## DEC-232

### Status

Accepted

### Title

文件统一通过 Private S3-compatible Object Store 抽象保存

### Decision

Raw Snapshots, uploads, Assets, Previews, Render Outputs, and Exports use a common ObjectStore Port.

Domain objects store Object Keys and Object References.

Local and production storage Providers may differ.

### Reason

Domain logic must not depend on a specific cloud vendor or temporary URL format.

### Impact

Object Storage requires private access, quarantine support, temporary URLs, streaming, deletion, and Hash verification.

---

## DEC-233

### Status

Accepted

### Title

Artifact 与 Agent Contract 使用 JSON Schema 2020-12 和 Ajv

### Decision

Persisted Artifacts, Agent Inputs and Outputs, Workflow payloads, and Export Manifests use versioned JSON Schema 2020-12.

Ajv performs runtime Schema Validation.

TypeScript boundary types are generated or synchronized through CI.

### Reason

The same Contract must support storage, model Structured Output, services, validation, and Export.

### Impact

Security and domain rules remain separate Validators and are not delegated entirely to JSON Schema.

---

## DEC-234

### Status

Accepted

### Title

Workspace 状态更新使用 SSE，并保留 Polling Fallback

### Decision

API uses Server-Sent Events for Task, Workflow, Agent, and Render status updates.

Read APIs remain authoritative.

When SSE disconnects or misses Events, the client recovers through Polling and full Queries.

### Reason

The MVP primarily requires one-way server progress updates and does not need WebSocket collaboration complexity.

### Impact

The Event Stream is not an independent state store.

---

## DEC-235

### Status

Accepted

### Title

Final Renderer 使用固定 Playwright、Chromium 和 Linux Container

### Decision

Final Render is produced only in a controlled Renderer Container.

Playwright, Chromium, Fonts, Component Registry, Brand Theme, and Render Profile are included in the Environment Fingerprint.

Local developer previews do not automatically qualify as Final Render.

### Reason

Operating-system, Browser, and Font differences may alter pixel output.

### Impact

Renderer uses a dedicated image, fixed Browser binary, bounded resources, and disabled public egress.

---

## DEC-236

### Status

Accepted

### Title

本地开发与初期部署使用 Docker Compose，不引入 Kubernetes

### Decision

Docker Compose manages local PostgreSQL, Redis, Object Storage, and ContentOS processes.

The first public MVP may use one regional container host.

Kubernetes is not required.

### Reason

The current scale benefits more from simplicity, debuggability, and low operational cost.

### Impact

The architecture preserves future scaling boundaries without implementing cluster orchestration prematurely.

---

## DEC-237

### Status

Accepted

### Title

MVP 不使用 Temporal、Kafka 或 Serverless-only 作为核心运行架构

### Decision

Workflow execution uses PostgreSQL state, Transactional Outbox, and BullMQ.

Temporal, Kafka, and a Serverless-only Worker architecture are not introduced in the MVP.

### Reason

ContentOS already has an explicit Workflow model, and a second workflow or event authority would increase implementation and operational complexity.

### Impact

These technologies may be reconsidered when scale or orchestration requirements become concrete.

---

## DEC-238

### Status

Accepted

### Title

Redis Queue 丢失和 Worker Crash 通过 PostgreSQL Reconciliation 恢复

### Decision

Tasks and Agent Runs record execution state, Lease, and Heartbeat.

A Reconciliation process detects incomplete Tasks without a valid active Lease and recreates missing Queue Jobs.

Workers check existing execution and Promotion state before repeating work.

### Reason

Queue delivery is at least once in the worst case, and both Workers and Redis can fail.

### Impact

Idempotency, Lease, Heartbeat, and Reconciliation are MVP requirements.

---

## DEC-239

### Status

Accepted

### Title

ContentOS 使用 Structured Logs 和 OpenTelemetry Trace / Metrics

### Decision

Application logs use structured and redacted JSON.

OpenTelemetry is used for server-side Traces and Metrics.

Source text, Prompts, Human Opinion, Raw Output, Secrets, and signed URLs are excluded from normal telemetry.

### Reason

The system needs cross-process execution visibility while preserving user privacy.

### Impact

Correlation ID spans HTTP, Command, Task, Agent Run, Model Call, Promotion, and Render.

---

## DEC-240

### Status

Accepted

### Title

Runtime Configuration 使用 Typed Validation、Fail-fast 与 Secret Reference

### Decision

Every process validates its required configuration at startup.

Missing or invalid critical configuration prevents startup.

Secrets are resolved through Credential References and the Secret Layer.

### Reason

Configuration failure should be discovered before user workflow execution, and Secrets must remain outside ordinary configuration.

### Impact

Web, API, Worker, Fetcher, and Renderer use separate typed configuration Schemas.

---

## DEC-241

### Status

Accepted

### Title

Production Migration 作为独立单次 Deployment Job 执行

### Decision

SQL migrations run through one dedicated deployment Job before new application instances accept traffic.

API Replicas do not run concurrent automatic migrations at startup.

Breaking changes use Expand-and-contract.

### Reason

Concurrent or destructive migrations increase deployment and rollback risk.

### Impact

Migration validation is part of CI and the release checklist.

---

## DEC-242

### Status

Accepted

### Title

MVP 使用 Fake Provider、Seed Data 和 Containerized Dependencies 建立可重复开发环境

### Decision

Local development uses Docker Compose for PostgreSQL, Redis, and Object Storage.

A Fake Model Adapter and deterministic Fixtures are the default development Provider.

Real Providers are enabled only for explicit integration or manual tests.

### Reason

Daily development must not depend on model cost, network availability, or random output.

### Impact

Fixtures are required for success, validation failure, Provider failure, Retry, Fallback, cancellation, and late-result scenarios.

---

## DEC-243

### Status

Accepted

### Title

生产首阶段允许单 VPS 计算部署，但不绑定具体云厂商

### Decision

Web, API, Worker, Fetcher, and Renderer may run on one container host for the first production stage.

PostgreSQL, Redis, and Object Storage may be self-hosted or managed.

The architecture does not depend on a specific VPS or cloud vendor.

### Reason

A personal MVP requires affordable and understandable deployment while preserving migration paths.

### Impact

Single-host deployment does not promise high availability, and Backup, Restore, monitoring, and resource limits remain launch requirements.
