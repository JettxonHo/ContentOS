# ContentOS Session-022

**Status:** Formalized  
**Session Type:** MVP Technical Architecture and Deployment Baseline  
**Topic:** TypeScript Monorepo, Modular Monolith, Workers, PostgreSQL, BullMQ, Object Storage, Rendering, Development Environment, and Deployment  
**Date:** 2026-07-27  
**Accepted Decisions:** DEC-221～DEC-243  
**Previous Session:** Session-021  
**Next Session:** Session-023

---

## 1. Context

Previous Sessions established the complete ContentOS product and domain architecture:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

The system already defines:

- Content Package
- Working Copy
- Immutable Version
- Artifact Head
- Version Dependency Graph
- Provenance
- Approval
- Workflow Template
- Workflow Instance
- Workflow Command
- Task
- Agent Run
- Model Call Attempt
- Agent Spec
- Prompt Template
- Model Configuration
- Model Adapter
- Model Router
- Validation Profile
- Security Principal
- Provider Data Policy
- Object Reference
- Transactional Outbox
- Deletion Request
- Security Audit Event

The remaining technical question was:

> How should these accepted domain concepts be implemented as one coherent MVP codebase and deployment architecture?

This Session converts the product architecture into an engineering baseline suitable for phased implementation by Codex.

---

## 2. Technical Verification Baseline

As of July 27, 2026, Node.js 24 is an LTS release, while Node.js 26 remains in Current status. The Node.js project recommends using Active LTS or Maintenance LTS versions for production applications. ContentOS therefore selects Node.js 24 as its initial production major version. citeturn705549search0

Next.js App Router is the current file-system-based router supporting features such as Server Components, Suspense, Server Functions, nested layouts, loading states, and error handling. citeturn705549search1turn705549search3

NestJS supports Fastify through its HTTP adapter architecture and provides first-class Server-Sent Events endpoints through `@Sse()`. citeturn844511search1turn705549search2

BullMQ is a Redis-backed Node.js job queue with retries, worker concurrency, delayed jobs, horizontal processing, and process-crash recovery. Its documented worst-case behavior includes at-least-once delivery, so jobs must be designed to be idempotent. citeturn602595search8turn602595search1

Drizzle supports PostgreSQL drivers, transactions, and version-controlled SQL migration workflows. citeturn602595search7turn602595search5turn602595search10

Playwright requires browser binaries compatible with the installed Playwright version. Updating Playwright may require installing new browser binaries, which supports ContentOS’s decision to pin Playwright and Chromium together for deterministic rendering. citeturn602595search2

Docker Compose is designed to define and run multi-container applications and supports optional service profiles. citeturn602595search12turn602595search4

Ajv supports JSON Schema Draft 2020-12 through a dedicated implementation, with Draft 2020-12 having compatibility differences from earlier drafts. ContentOS will standardize its persisted cross-boundary Schemas rather than mixing Schema drafts inside one validator instance. citeturn844511search0

OpenTelemetry JavaScript currently identifies Traces and Metrics as Stable while Logs remain in Development. ContentOS therefore uses OpenTelemetry for server-side Traces and Metrics while retaining an independent structured application logger. citeturn844511search2

---

## 3. MVP Technical Stack

The accepted MVP stack is:

```text
Primary Language
→ TypeScript

Runtime
→ Node.js 24 LTS

Repository
→ pnpm Workspace Monorepo

Frontend
→ Next.js App Router

Backend API
→ NestJS + Fastify

API Style
→ REST + OpenAPI

Database
→ PostgreSQL

Database Access
→ Drizzle ORM + reviewed SQL migrations

Asynchronous Queue
→ Redis + BullMQ

Object Storage
→ Private S3-compatible Object Storage

Artifact Validation
→ JSON Schema 2020-12 + Ajv

Final Rendering
→ Playwright + pinned Chromium

Browser State Updates
→ Server-Sent Events
→ Polling fallback

Observability
→ Structured JSON Logs
→ OpenTelemetry Traces and Metrics

Local Infrastructure
→ Docker Compose

Initial Deployment
→ Single-region containerized deployment
```

---

## 4. Why TypeScript Is the Primary Language

ContentOS contains a large number of typed boundaries:

- Workflow Commands
- Workflow Events
- Artifact Bodies
- Agent Inputs
- Agent Candidate Outputs
- Model Adapter requests
- Model Adapter responses
- Validation Results
- Dependency Edges
- Provenance Usages
- API DTOs
- Queue payloads
- Export Manifests

Using TypeScript across Web, API, Worker, Agent Runtime, Model Adapter, and Renderer reduces the number of parallel representations that must remain synchronized.

The accepted goal is:

```text
One primary implementation language
+
Versioned external Contracts
+
Framework-independent Domain Core
```

This does not mean that JSON Schema or database constraints are replaced by TypeScript.

TypeScript improves development-time consistency.

Runtime boundaries remain validated independently.

---

## 5. Python Position

Python is not part of the core MVP runtime.

The current system primarily needs to:

- Call external model APIs
- Execute workflow state transitions
- Manage immutable Versions
- Validate structured objects
- Persist relational data
- Run asynchronous queues
- Render controlled web components
- Manage Object Storage

These requirements can be implemented coherently in TypeScript.

A separate Python service may be introduced later for a concrete need such as:

- OCR
- Audio processing
- Video processing
- Local model inference
- Advanced vector processing
- Custom ML pipelines
- Large-scale data science evaluation

Python will be added as an isolated Adapter or Service only when the requirement justifies the additional language boundary.

---

## 6. Architectural Style

ContentOS MVP uses:

```text
Modular Monolith
+
Isolated Worker Processes
```

The modular monolith provides:

- One Repository
- One primary language
- One primary database
- One coordinated release
- One authoritative domain model
- Clear module ownership
- Lower distributed-system complexity

Isolated processes provide:

- Workload separation
- Security isolation
- Independent concurrency
- Browser-process isolation
- Public-network isolation
- Independent scaling boundaries

---

## 7. Modular Monolith Does Not Mean One Process

The term “modular monolith” does not mean:

- One executable file
- One Node.js process
- One giant NestJS Module
- One transaction for the entire Package
- Direct table access between every module
- No asynchronous work

It means:

> The product remains one coherently versioned application with explicit internal module boundaries rather than a set of prematurely independent services.

The MVP may run several processes while remaining a modular monolith.

---

## 8. Initial Deployable Processes

The accepted processes are:

```text
web
api
worker
fetcher
renderer
```

Their responsibilities are:

### `web`

- Dashboard
- New Content Package
- Content Package Workspace
- Structured Editors
- Chief Editor Panel
- Version comparison
- Validation display
- SSE client

### `api`

- Authentication
- Authorization
- Queries
- Working Copy mutations
- Version creation
- Workflow Commands
- Upload authorization
- Download authorization
- SSE endpoints
- Application Query Projections

### `worker`

- Workflow asynchronous work
- Agent Runtime
- Research Agent
- Writer Agent
- Packaging Agent
- Visual Agent
- Chief Editor Planner
- Schema Repair
- Domain Regeneration
- Outbox dispatch
- Maintenance work where appropriate

### `fetcher`

- Public URL Fetch
- SSRF validation
- Redirect validation
- Raw Snapshot creation
- Source extraction
- Upload quarantine processing where appropriate

### `renderer`

- Preview Render
- Final Render
- Playwright execution
- Chromium lifecycle
- Render Validation
- Render Output upload

---

## 9. High-level Runtime Topology

```text
                           ┌─────────────────┐
                           │     Browser     │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │ Reverse Proxy   │
                           └──────┬─────┬────┘
                                  │     │
                         ┌────────▼─┐ ┌─▼────────┐
                         │ Web App  │ │ API      │
                         │ Next.js  │ │ NestJS   │
                         └──────────┘ └────┬─────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
             ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
             │ PostgreSQL  │      │ Redis       │      │ Object Store│
             │ Domain Data │      │ BullMQ      │      │ Private Data│
             │ Workflow    │      │ Dispatch    │      │ Assets      │
             │ Outbox      │      │ Coordination│      │ Renders     │
             └──────┬──────┘      └──────┬──────┘      └─────────────┘
                    │                    │
         ┌──────────┴────────────────────┴────────────────────────────┐
         │                     Async Processes                       │
         │ Agent Worker · Source Fetcher · Renderer · Maintenance   │
         └───────────────────────────────────────────────────────────┘
```

---

## 10. Repository Strategy

ContentOS uses one Monorepo.

Recommended root structure:

```text
contentos/
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   ├── fetcher/
│   └── renderer/
│
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
│
├── schemas/
├── docs/
├── migrations/
├── docker/
├── compose.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

The final physical structure may evolve, but the ownership boundaries are authoritative.

---

## 11. Workspace Package Roles

### `packages/core`

Contains:

- Domain objects
- Value objects
- Domain errors
- Application Use Cases
- Ports
- Domain Events
- Pure Domain Validators

### `packages/contracts`

Contains generated or shared boundary types for:

- API
- Queue
- Agent Runtime
- Events
- Artifact metadata
- Validation
- Object References

### `packages/database`

Contains:

- Drizzle Schema
- Repository Adapters
- Query Projection SQL
- Transaction helpers
- Outbox persistence
- Lease persistence

### `packages/queue`

Contains:

- Queue names
- Job payload Schemas
- BullMQ Adapters
- Retry configuration
- Worker registration
- Queue reconciliation helpers

### `packages/agent-runtime`

Contains:

- Agent Run execution
- Context Builder
- Prompt Assembly
- Model Router
- Model Adapter orchestration
- Parse
- Schema Validation
- Repair
- Runtime budgets

### `packages/model-adapters`

Contains:

- Provider-neutral interfaces
- Provider-specific Adapters
- Usage normalization
- Error normalization
- Fake Provider Adapter

### `packages/object-storage`

Contains:

- ObjectStore Port
- S3-compatible Adapter
- Local development Adapter
- Temporary URL generation
- Hash verification
- Quarantine operations

### `packages/rendering`

Contains:

- Component Registry implementation
- Render templates
- Render contracts
- Render validation
- Fit checks
- Playwright orchestration shared with Renderer

### `packages/observability`

Contains:

- Structured logger
- Redaction
- Correlation ID
- OpenTelemetry initialization
- Metrics definitions

### `packages/config`

Contains:

- Typed environment parsing
- Feature Flags
- Runtime configuration Schemas
- Secret References
- Process-specific configuration

### `packages/testing`

Contains:

- Fixtures
- Fake clock
- Fake Provider
- Database factories
- Queue test helpers
- Artifact builders
- Workflow test scenarios

---

## 12. Domain-module Structure

Recommended domain-module structure:

```text
packages/core/src/modules/
├── content-package/
├── source/
├── research/
├── human-opinion/
├── publishing/
├── visual/
├── render-export/
├── workflow/
├── agent-execution/
└── security/
```

A module may contain:

```text
module/
├── domain/
├── application/
├── ports/
├── events/
├── validators/
└── errors/
```

Example:

```text
research/
├── domain/
│   ├── research-result.ts
│   ├── research-version.ts
│   ├── research-item.ts
│   └── research-errors.ts
├── application/
│   ├── create-research-version.ts
│   ├── approve-research-version.ts
│   └── mark-research-outdated.ts
├── ports/
│   ├── research-repository.ts
│   └── evidence-repository.ts
├── validators/
│   └── validate-research-candidate.ts
└── events/
    └── research-version-approved.ts
```

---

## 13. Framework-independent Core

The Domain Core must not depend on:

- Next.js
- NestJS
- Fastify
- Drizzle
- PostgreSQL Driver
- BullMQ
- Redis
- Playwright
- Chromium
- Provider SDK
- S3 SDK
- OpenTelemetry SDK

Domain Core may depend on:

- TypeScript language features
- Stable internal types
- Pure utility functions
- Domain interfaces
- Pure validation primitives

Infrastructure enters through Ports and Adapters.

---

## 14. Dependency Direction

The accepted dependency direction is:

```text
apps
↓
infrastructure adapters
↓
application use cases
↓
domain
```

Prohibited directions include:

```text
domain
→ NestJS Controller

domain
→ Drizzle Table

domain
→ BullMQ Worker

domain
→ Provider SDK

domain
→ Playwright Page
```

This protects the long-term domain model from infrastructure replacement.

---

## 15. NestJS Boundary

NestJS is used for application composition.

NestJS owns:

- Composition Root
- Dependency Injection
- HTTP Controllers
- Authentication Guards
- Authorization Guards
- Validation Pipes
- Exception Filters
- Interceptors
- OpenAPI generation
- SSE Controllers
- Process lifecycle
- Infrastructure Adapter wiring

NestJS does not own the domain rules.

A NestJS Module may assemble a domain module, but it is not itself the Domain Source of Truth.

---

## 16. Cross-module Writes

A module must not write another module’s tables directly merely because they share one database.

Examples of prohibited behavior:

```text
Visual Module
→ Direct UPDATE of Xiaohongshu Version

Render Module
→ Direct UPDATE of Design Working Copy

Research Module
→ Direct creation of Blog Version
```

Cross-module state changes must use:

- Application Use Case
- Domain Port
- Workflow Command
- Domain Event
- Transactional Outbox

---

## 17. Cross-module Reads

Cross-module reads are allowed in an explicit Query Layer.

Examples:

- Dashboard Projection
- Content Package Overview
- Current Action
- Needs Your Attention
- Workflow Timeline
- Version Review Summary

Rule:

```text
Cross-module read
→ Allowed in Query Projection

Cross-module write
→ Must go through owning module
```

Query Projections do not become new writable domain objects.

---

## 18. Frontend Architecture

The frontend uses Next.js App Router.

Primary frontend responsibilities:

- Authentication-aware routing
- Initial server-rendered queries
- Workspace layouts
- Stage routes
- Client-side editors
- Autosave
- Revision conflict handling
- SSE subscription
- Polling recovery
- Validation display
- Version Diff
- Provenance Drawer
- Asset Preview
- Render Preview

---

## 19. Next.js Route Structure

Recommended structure:

```text
apps/web/app/
├── login/
├── dashboard/
├── content-packages/
│   ├── new/
│   └── [contentPackageId]/
│       ├── layout.tsx
│       ├── overview/
│       ├── sources/
│       ├── research/
│       ├── opinion/
│       ├── blog/
│       ├── xiaohongshu/
│       ├── design/
│       ├── export/
│       └── history/
└── settings/
```

The exact route implementation remains flexible.

The product-level information architecture from Session-018 remains authoritative.

---

## 20. Server and Client Component Boundary

Server-rendered areas may include:

- Dashboard initial load
- Content Package shell
- Overview initial projection
- Settings
- Authentication routing
- Initial Artifact metadata

Client-side areas may include:

- Blog Editor
- Xiaohongshu Editor
- Drag-and-drop page order
- Autosave
- Revision Proposal Diff
- Chief Editor Panel
- SSE client
- Asset Candidate selection
- Preview interactions

Server Components must not replace the authoritative NestJS Application API for critical domain mutations.

---

## 21. Frontend State Categories

The frontend distinguishes:

### Server State

Examples:

- Artifact Versions
- Approval
- Workflow State
- Validation
- Task
- Current Action
- Artifact Head

### Local Editor State

Examples:

- Unsaved typing
- Local selection
- Page order before autosave
- Expanded sections

### Working Copy Revision

The latest known server Revision used for optimistic concurrency.

### Ephemeral UI State

Examples:

- Selected page
- Open Drawer
- Active tab
- Chief Editor Panel visibility

The MVP does not require all frontend state to be placed in one global store.

---

## 22. Backend API Architecture

The authoritative Application API uses:

```text
NestJS
+
Fastify
+
REST
+
OpenAPI
```

The API exposes:

- Queries
- Working Copy mutations
- Version creation
- Workflow Commands
- Task status
- File authorization
- Object download authorization
- SSE streams
- Application Query Projections

GraphQL is not part of the MVP.

---

## 23. API Authority

NestJS API is the only authority for:

- Approval
- Version creation
- Workflow Command execution
- Artifact Head transitions
- Warning acknowledgement
- Final Render selection
- Export creation
- Archive
- Delete Request

Next.js Server Actions must not duplicate those rules.

The Web may use Server Components as an API consumer, but domain mutation remains centralized.

---

## 24. API Route Families

Conceptual route families:

```text
/v1/content-packages
/v1/sources
/v1/research-artifacts
/v1/human-opinion-artifacts
/v1/blog-artifacts
/v1/xiaohongshu-artifacts
/v1/design-artifacts
/v1/workflows
/v1/tasks
/v1/assets
/v1/render-jobs
/v1/render-outputs
/v1/export-packages
/v1/security
```

These names remain implementation guidance.

Session-019’s Query, Working Copy, Version, and Command semantics remain authoritative.

---

## 25. Same-origin Deployment

Recommended external origin:

```text
https://contentos.example.com
```

Reverse-proxy routing:

```text
/
→ Next.js Web

/v1/
→ NestJS API
```

Benefits include simpler handling of:

- Session Cookies
- CSRF controls
- CORS
- SSE
- API base URL
- Download authorization
- Local development parity

Same origin does not remove the need for server-side authorization.

---

## 26. Server-Sent Events

SSE is the primary browser progress-update mechanism.

Potential events include:

- Task state changed
- Workflow Event created
- Agent Run completed
- Agent Run failed
- Render page completed
- Render completed
- Artifact became outdated
- Current Action changed
- Export became available

SSE is a delivery convenience.

PostgreSQL and Query APIs remain authoritative.

---

## 27. Polling Fallback

When SSE is unavailable or disconnected, the client recovers using:

```text
GET /v1/tasks/{taskId}
GET /v1/content-packages/{contentPackageId}/overview
GET /v1/workflows/{workflowInstanceId}
```

The browser must not assume that all Events were received.

After reconnection, it refreshes authoritative state.

---

## 28. Why WebSocket Is Deferred

The MVP does not currently require:

- Multi-user cursor synchronization
- Collaborative text editing
- Bidirectional high-frequency events
- Real-time presence
- Shared canvas updates

Normal mutations use HTTP.

Server progress uses SSE.

WebSocket may be reconsidered after collaborative editing becomes a real requirement.

---

## 29. PostgreSQL Authority

PostgreSQL is the Source of Truth for:

- Content Package
- Artifact
- Working Copy
- Immutable Version
- Artifact Head
- Workflow Template references
- Workflow Instance
- Workflow Node State
- Workflow Command
- Task
- Agent Run
- Approval
- Dependency Edge
- Provenance
- Revision Proposal
- Warning Acknowledgement
- Render Job
- Render Output
- Export Package
- Outbox Event
- Security Audit Event
- Deletion Request

Redis does not replace these records.

---

## 30. Database Access

Drizzle ORM is used for:

- PostgreSQL table definitions
- Typed Query construction
- Transactions
- Repository Adapters
- Migration generation
- Migration application tooling

Explicit SQL is allowed for:

- Complex Query Projections
- Recursive dependency analysis
- Performance-sensitive reads
- Database-specific constraints
- Maintenance jobs

The system does not force every query through a high-level abstraction when SQL is clearer.

---

## 31. ORM Boundary

Drizzle rows are not Domain objects.

Drizzle tables are not API DTOs.

Mapping remains:

```text
Database Row
→ Repository Adapter
→ Domain Object or Application Result
→ API DTO
```

This protects:

- Domain invariants
- API versioning
- Internal fields
- Security filtering
- Storage refactoring

---

## 32. Migration Strategy

Production uses version-controlled SQL migrations.

Recommended workflow:

```text
Modify Drizzle schema
→ Generate SQL migration
→ Review SQL
→ Run migration tests
→ Commit migration
→ Execute once during deployment
```

Unreviewed schema push is restricted to local experimentation.

Production startup must not silently alter the database.

---

## 33. Expand-and-contract

Breaking database changes follow:

```text
Add new structure
→ Deploy compatible code
→ Backfill data
→ Switch reads and writes
→ Verify
→ Remove old structure later
```

This supports short-term rollback and avoids a release where old and new application versions cannot coexist.

---

## 34. Database Ownership

The MVP uses:

```text
One PostgreSQL Database
+
Module-owned tables
+
Shared transaction infrastructure
```

It does not use:

- Database per module
- Database per Worker
- Independent microservice migrations
- Cross-database distributed transactions

Module ownership is enforced primarily by:

- Code organization
- Repository interfaces
- Application Use Cases
- Review rules
- Migration ownership

---

## 35. Redis Responsibilities

Redis is used for:

- BullMQ queue state
- Delayed jobs
- Retry timing
- Worker coordination
- Short-lived queue locks
- Optional rate limits
- Optional short-lived fan-out

Redis is not used as the only store for:

- Workflow
- Approval
- Artifact
- Version
- Provenance
- Dependency
- Human Opinion
- Export

---

## 36. BullMQ Role

BullMQ delivers already-created Tasks to Workers.

The relationship is:

```text
PostgreSQL Task
→ Outbox Dispatcher
→ BullMQ Job
→ Worker
```

BullMQ does not decide whether a Task is legally allowed.

Workflow Policy and the Deterministic Executor decide eligibility before Task creation.

---

## 37. Queue Payload

Recommended Queue payload:

```json
{
  "task_id": "task_...",
  "task_type": "agent_execution",
  "correlation_id": "corr_..."
}
```

Queue payload must not contain full:

- Source
- Prompt
- Human Opinion
- Artifact Body
- Asset binary
- Provider Secret

The Worker loads the authoritative frozen Task data from PostgreSQL.

---

## 38. Queue Categories

Recommended Queue names:

```text
source-capture
agent-runtime
image-generation
render
maintenance
```

Possible later queues:

```text
export
deletion
notification
```

Separate Queues support:

- Different Worker identities
- Different concurrency
- Different timeout
- Different retry policies
- Different resource limits
- Security isolation

---

## 39. Transactional Outbox

Task dispatch uses the Transactional Outbox.

Authoritative flow:

```text
Database Transaction
├── Update domain state
├── Create Task
└── Insert Outbox Event
        ↓
Commit
        ↓
Outbox Dispatcher
        ↓
BullMQ
        ↓
Worker
```

The Outbox Dispatcher may redeliver.

Workers and Queue Jobs must therefore be idempotent.

---

## 40. Outbox Dispatcher

Dispatcher responsibilities:

- Read pending Outbox Events
- Lock a bounded batch
- Create BullMQ Jobs
- Use stable Job IDs
- Record delivery state
- Retry transient Queue failures
- Preserve Correlation ID
- Expose Outbox lag metrics

The Dispatcher does not delete the domain Event merely because it has been delivered.

Retention and processed-state behavior are configured separately.

---

## 41. Queue Job Identity

A Queue Job should use a stable ID derived from the Task or dispatch identity.

Conceptually:

```text
jobId = queueName + taskId
```

This reduces duplicate Queue entries.

Queue-level de-duplication does not replace database-level Task idempotency because completed Queue Jobs may eventually be removed. BullMQ documents that custom job IDs are scoped to a Queue and are useful for avoiding duplicate jobs while the existing Job remains present. citeturn602595search6turn602595search13

---

## 42. At-least-once Processing

Workers must assume that a Job may be delivered more than once.

Before performing side effects, a Worker checks:

- Task state
- Task idempotency identity
- Existing Agent Run
- Existing Render Output
- Existing Promotion
- Current lease
- Cancellation state
- Workflow state

A repeated delivery must converge on the same final result.

---

## 43. Redis-loss Recovery

Redis loss must not destroy domain truth.

Recovery flow:

```text
PostgreSQL reconciliation
→ Find ready or queued Tasks
→ Check active lease
→ Check completed output
→ Recreate missing Queue Jobs
```

Relevant Task states may include:

- ready
- queued
- running with expired lease
- retryable failure
- cancellation requested

The exact reconciliation query will be defined in the Task implementation specification.

---

## 44. Worker Lease

Task or Agent Run may record:

```text
lease_owner
lease_expires_at
heartbeat_at
```

The Worker renews the lease while executing.

Lease supports:

- Crash detection
- Stuck-task detection
- Reconciliation
- Safe retry decisions
- Operational visibility

Lease does not replace BullMQ’s internal lock.

It expresses the execution state in the authoritative PostgreSQL domain model.

---

## 45. Process-crash Recovery

Worker processing flow:

1. Receive Queue Job.
2. Load Task.
3. Verify Task eligibility.
4. Acquire or validate lease.
5. Create or resume execution record.
6. Execute bounded work.
7. Save result transactionally.
8. Create Outbox Event.
9. Complete Queue Job.
10. Release or expire lease.

On crash:

- BullMQ may deliver again.
- The next Worker checks persisted progress.
- Completed work is not repeated unnecessarily.
- Duplicate Artifact Versions are prevented.
- Expired leases allow recovery.

---

## 46. Graceful Shutdown

Every Worker process must handle termination signals.

On shutdown:

- Stop accepting new Jobs
- Stop starting retries
- Stop starting Repair or Fallback
- Complete safe in-flight work where possible
- Record cancellation or interrupted state
- Stop lease renewal
- Close Browser instances
- Close database pool
- Close Redis connections
- Flush logs and traces

A deployment should provide a reasonable termination grace period.

---

## 47. Agent Worker Boundary

Agent Worker executes:

- Chief Editor Planner
- Research Agent
- Writer Agent
- Packaging Agent
- Visual Agent
- Schema Repair
- Domain Regeneration
- Provider Model Calls
- Candidate creation

Agent Worker does not:

- Fetch arbitrary public URLs
- Run Final Chromium Render
- Approve Artifacts
- Change security configuration
- Purge user data
- Publish content

---

## 48. Source Fetcher Boundary

Source Fetcher executes:

- URL normalization
- SSRF checks
- DNS validation
- Redirect validation
- HTTP/HTTPS fetch
- Response limits
- Raw Snapshot storage
- Extraction
- Safe Source Candidate creation

Fetcher does not receive:

- Model Provider Credential
- Human Opinion
- General database access
- Workflow approval permissions
- Render permissions

JavaScript-heavy Browser Capture is deferred unless the MVP Vertical Slice proves it is necessary.

---

## 49. Renderer Boundary

Renderer consumes:

- Approved Design Version
- Approved Asset Versions
- Component Registry Version
- Brand Theme Version
- Render Profile Version
- Font Bundle Version

Renderer produces:

- Preview Render or Final Render
- Page files
- Render Validation
- Environment Fingerprint
- Object References

Renderer does not:

- Call LLM
- Access public internet
- Edit canonical text
- Read Raw Human Opinion
- Create Approval
- Change Artifact dependencies

---

## 50. Final Renderer

Final Render runs in a controlled Linux Container.

The environment pins:

- Container Image Digest
- Node Version
- Playwright Version
- Chromium Binary
- System libraries
- Font Bundle
- Component Registry
- Brand Theme
- Render Profile
- Locale
- Pixel ratio

A macOS local preview may be useful during development but is not automatically an authoritative Final Render.

---

## 51. Renderer Container Security

Renderer Container should use:

- No public egress
- Read-only application filesystem where practical
- Temporary writable workspace
- CPU limit
- Memory limit
- Process limit
- Job timeout
- Controlled fonts
- Controlled local assets
- No Provider SDK credential
- No Source Fetch capability

Browser crashes and timeouts are recorded as Render failure categories.

---

## 52. Object Storage Abstraction

Domain code uses an `ObjectStore` Port.

Conceptual operations:

```text
put
get
head
delete
copy
streamUpload
streamDownload
createTemporaryAccessUrl
verifyHash
```

The implementation uses private S3-compatible Object Storage.

Domain objects reference:

- Object Key
- MIME Type
- Size
- Hash
- Storage Version

They do not store temporary URLs as permanent dependencies.

---

## 53. Object-storage Categories

Object Storage may contain:

```text
sources/
uploads/
quarantine/
assets/
previews/
renders/
exports/
diagnostics/
```

Storage prefixes aid operations but do not define domain ownership by themselves.

PostgreSQL Object References remain authoritative.

---

## 54. Quarantine Boundary

Unvalidated uploads and fetched objects remain in:

```text
quarantine
```

They cannot be used by:

- Agent Runtime
- Renderer
- Export
- Normal download
- Artifact Promotion

After successful validation:

```text
Quarantine Object
→ Promote or copy
→ Create formal Object Reference
→ Remove or expire quarantine copy
```

---

## 55. Contract Architecture

ContentOS distinguishes:

### Persisted and Cross-boundary Contracts

Examples:

- Artifact Body
- Agent Input
- Agent Candidate Output
- Workflow Command payload
- Domain Event payload
- Export Manifest
- Design Specification
- Model Adapter request

These use versioned JSON Schema.

### Internal Domain Types

Examples:

- Aggregate
- Value Object
- Domain Error
- Application Use Case input
- Repository Port

These use TypeScript domain types and classes.

---

## 56. JSON Schema Baseline

The accepted baseline is:

```text
JSON Schema 2020-12
+
Ajv 2020 implementation
```

All ContentOS-owned persisted cross-boundary Schemas should explicitly declare their Schema version.

The project should not silently combine incompatible Schema drafts in one validator configuration.

---

## 57. Type Generation

Recommended build direction:

```text
JSON Schema
→ Validation
→ Generated TypeScript boundary types
```

The project should avoid manually maintaining:

```text
schema.json
+
separate handwritten interface
```

without a synchronization check.

CI should detect generated-type drift.

---

## 58. Schema Validation Limits

JSON Schema validates representation.

It does not replace:

- SSRF validation
- URL destination validation
- HTML sanitization
- Provenance validation
- First-person validation
- Citation validation
- Workflow Policy
- Authorization
- Component compatibility
- Render fit validation

These remain separate Validators.

---

## 59. API DTO versus Artifact Schema

An HTTP API DTO and a stored Artifact are not necessarily the same Contract.

Example:

```text
PATCH Xiaohongshu Working Copy Request
→ API Contract
```

```text
contentos.xhs-artifact/v1
→ Artifact Contract
```

API Contracts are described through OpenAPI.

Persisted and Agent Contracts are described through JSON Schema.

Generated tooling may connect them, but they retain distinct responsibilities.

---

## 60. Runtime Configuration Classes

Configuration is divided into:

```text
Runtime non-secret configuration
Secret Reference
Versioned domain configuration
```

### Runtime non-secret configuration

Examples:

- Port
- Log level
- Queue name
- Worker concurrency
- Feature Flag
- Timeout
- Public application origin

### Secret Reference

Examples:

- Database credential
- Session key
- Provider credential
- Object Storage credential

### Versioned domain configuration

Examples:

- Agent Spec
- Prompt Template metadata
- Runtime Policy
- Model Configuration
- Platform Profile
- Component Registry
- Brand Theme
- Render Profile

---

## 61. Process-specific Configuration

Each process validates only its required configuration.

### Web

Requires:

- Public application URL
- API origin
- Frontend feature flags

### API

Requires:

- Database
- Session configuration
- Redis, where needed
- Object Storage
- Authentication policy
- SSE configuration

### Worker

Requires:

- Database
- Redis
- Object Storage
- Model Configuration
- Credential References
- Agent Runtime policies

### Fetcher

Requires:

- Redis
- Restricted database access
- Restricted Object Storage access
- Source Fetch Policy
- Network policy

### Renderer

Requires:

- Redis
- Restricted database access
- Object Storage
- Render Profile
- Font Bundle
- Browser configuration

Invalid configuration causes fail-fast startup.

---

## 62. Local Development

Required local tools:

```text
Node.js 24 LTS
pnpm
Docker Engine or Docker Desktop
Docker Compose
```

Infrastructure services in Compose:

```text
postgres
redis
object-storage
```

Optional local services:

```text
otel-collector
mail-test-service
```

---

## 63. Local Process Strategy

Recommended development mode:

```text
Host with hot reload:
- web
- api
- worker

Containers:
- postgres
- redis
- object-storage
- fetcher
- renderer
```

Fetcher and Renderer remain containerized to preserve their security and system-dependency boundaries.

A full-container profile may also run all application processes.

---

## 64. Compose Profiles

Conceptual profiles:

```text
default
→ postgres
→ redis
→ object-storage

full
→ web
→ api
→ worker
→ fetcher
→ renderer

observability
→ otel-collector
→ local telemetry backend

tools
→ migration
→ seed
→ diagnostics
```

Profiles are a development and deployment convenience.

They do not change application authorization.

---

## 65. Development Commands

Conceptual developer workflow:

```text
pnpm install

docker compose up -d postgres redis object-storage

pnpm db:migrate

pnpm db:seed

pnpm dev
```

A full environment may use:

```text
docker compose --profile full up
```

Final commands will be formalized in the implementation README.

---

## 66. Fake Model Adapter

A Fake Model Adapter is mandatory for routine development.

It provides deterministic Fixtures for:

- Successful Research
- Successful Blog
- Successful Xiaohongshu
- Successful Design
- Malformed JSON
- Schema Validation failure
- Domain Validation failure
- Rate limit
- Timeout
- Provider unavailable
- Fallback
- Safety refusal
- Token Usage
- Cancellation
- Late result

This allows frontend, workflow, validation, and failure-recovery development without model cost or randomness.

---

## 67. Seed Data

Development seed data should create:

- Owner User
- Content Package
- Source
- Research Result
- Human Opinion
- Blog Working Copy
- Xiaohongshu Working Copy
- Design
- Workflow Instance
- Tasks
- Agent Runs
- Warnings
- Version history
- Render Output
- Export Package

Seed data must not create a known default production password.

---

## 68. Test Environment

Test environment uses:

- Isolated PostgreSQL
- Isolated Redis or test Queue Adapter
- Isolated Object Storage
- Fake Provider
- Fake time where needed
- Deterministic IDs where helpful
- Repeatable Fixtures

Tests must not depend on the developer’s existing local data.

---

## 69. Staging Environment

Staging should use:

- Production-equivalent images
- Separate database
- Separate storage
- Separate Redis
- Separate Secrets
- Limited Provider budget
- No production user content
- Real integration tests where required

Staging is used for:

- Migration tests
- Provider Adapter verification
- Renderer verification
- Security verification
- End-to-end acceptance

---

## 70. Initial Production Deployment

The first production deployment may run on one container host.

Conceptual topology:

```text
One Compute Host
├── Reverse Proxy
├── Web
├── API
├── Worker
├── Fetcher
└── Renderer
```

State services may be:

```text
Managed PostgreSQL
Managed Redis
Managed Object Storage
```

or self-hosted when budget requires it.

The architecture does not depend on a specific VPS or cloud vendor.

---

## 71. Single-VPS Suitability

A single VPS is suitable for:

- Personal MVP
- Portfolio demonstration
- Small number of users
- Low concurrency
- Manual publishing
- Limited Render load
- Early validation

A single VPS does not provide:

- High availability
- Automatic multi-host failover
- Large Chromium concurrency
- Enterprise SLA
- Multi-region processing

These limitations must be documented rather than hidden.

---

## 72. Resource Separation on One Host

Even on one host, containers should have separate:

- Process identity
- Filesystem scope
- Environment variables
- Network permissions
- Secret access
- CPU limits
- Memory limits
- Restart policies

A single physical machine does not require all processes to share unrestricted access.

---

## 73. Production Growth Stages

### Stage 1: Single-host MVP

```text
One compute host
+
durable state
```

### Stage 2: Managed state separation

```text
Managed PostgreSQL
Managed Object Storage
Managed Redis
Independent compute host
```

### Stage 3: Worker scaling

```text
API replicas
Agent Worker replicas
Fetcher replicas
Renderer replicas
```

### Stage 4: Advanced orchestration evaluation

Potentially reconsider:

- Kubernetes
- Temporal
- Dedicated event infrastructure
- Service decomposition

The MVP should not implement Stage 4 prematurely.

---

## 74. Serverless Position

ContentOS is not designed as Serverless-only.

The system contains:

- Long-running Agent Runs
- Queue Workers
- Chromium
- Outbox Dispatcher
- Source Fetch isolation
- Retention jobs
- Deletion jobs
- SSE
- Controlled Font Bundle

These workloads fit persistent container processes more naturally.

Individual surfaces may later use serverless platforms, but the core runtime remains container-oriented.

---

## 75. Kubernetes Position

Kubernetes is deferred.

It may become appropriate when ContentOS has:

- Multiple compute hosts
- High Worker counts
- Autoscaling requirements
- High availability requirements
- Multiple deployment teams
- Complex rolling deployment
- Strong platform-standardization requirements

The MVP instead optimizes for:

- Simplicity
- Debuggability
- Low cost
- Fast implementation
- Clear architecture
- Local-production similarity

---

## 76. Temporal Position

Temporal is not the MVP Workflow Source of Truth.

ContentOS already defines:

- Workflow Instance
- Workflow Node State
- Commands
- Tasks
- Events
- Human Gates
- Approval
- Pause
- Resume
- Cancel
- Stale propagation
- Dependency Graph

Introducing Temporal immediately would risk two workflow state systems.

The accepted MVP is:

```text
PostgreSQL State Machine
+
Transactional Outbox
+
BullMQ
```

Temporal may be reconsidered if the application later develops:

- Numerous long-lived timers
- Complex compensation
- Cross-service workflows
- Extensive handwritten recovery cost
- Large-scale durable orchestration

---

## 77. Kafka Position

Kafka is not required by the MVP.

Current needs are:

- Reliable task delivery
- Low-to-moderate throughput
- Limited Worker groups
- Simple operational model
- Explicit database state

BullMQ plus Outbox is sufficient for the initial scale.

Kafka may be reconsidered only after event throughput, replay, or consumer diversity becomes a concrete need.

---

## 78. Health Endpoints

API exposes:

```text
/health/live
/health/ready
```

### Liveness

Indicates whether the process is running.

### Readiness

Indicates whether the process can safely handle traffic.

Readiness may check:

- Database
- Required configuration
- Object Storage
- Redis where necessary
- Migration state

A temporary Model Provider outage should normally disable or fail the relevant Agent capability rather than make every API Query unavailable.

---

## 79. Worker Health

Workers report health through:

- Heartbeat
- Lease renewal
- Queue metrics
- Optional internal health endpoint
- Last successful Job time
- Last error
- Process metrics

Worker health is not a normal Dashboard metric.

It belongs in Advanced Diagnostics and operations monitoring.

---

## 80. Observability Baseline

The MVP uses:

```text
Structured JSON Application Logs
+
OpenTelemetry Traces
+
OpenTelemetry Metrics
```

Logs remain in a dedicated logger because OpenTelemetry JavaScript Logs are not yet at the same maturity level as Traces and Metrics. citeturn844511search2

---

## 81. Trace Correlation

Trace path examples:

```text
HTTP Request
→ Workflow Command
→ Database Transaction
→ Outbox Event
→ Queue Job
→ Task
→ Agent Run
→ Model Call
→ Validation
→ Promotion
```

```text
Render Command
→ Render Task
→ Render Job
→ Playwright
→ Page Render
→ Validation
→ Object Upload
```

Correlation ID connects:

- HTTP request
- Workflow Command
- Task
- Agent Run
- Model Call Attempt
- Render Job
- Domain Event
- Error

---

## 82. Telemetry Privacy

Normal telemetry may include:

- IDs
- Status
- Error Code
- Duration
- Attempt
- Queue delay
- Token Usage
- Provider alias
- Schema Version

Normal telemetry must not include:

- Source full text
- Prompt full text
- Raw Human Opinion
- Raw Model Output
- Secret
- Signed URL
- Uploaded file content

This preserves Session-021’s security boundaries.

---

## 83. MVP Metrics

### HTTP

- Request count
- Error rate
- Request duration
- Authorization failure
- Revision conflict

### Workflow

- Command count
- Command failure
- Blocked Node count
- Needs-attention count
- Workflow completion duration

### Queue

- Queue depth
- Queue delay
- Job duration
- Retry count
- Failed Job count
- Reconciliation count
- Outbox lag

### Agent

- Model call count
- Input Tokens
- Output Tokens
- Schema failure
- Domain failure
- Repair count
- Regeneration count
- Fallback count
- Estimated cost

### Render

- Render duration
- Pages rendered
- Fit failure
- Browser crash
- Output size
- Validation failure

### Infrastructure

- Database pool
- Redis connection
- Worker heartbeat
- Object upload failure
- Disk or volume usage
- Process memory

---

## 84. Container Images

Recommended images:

```text
contentos-web
contentos-api
contentos-worker
contentos-fetcher
contentos-renderer
```

Web, API, and Worker may share a Node base stage.

Fetcher and Renderer should have dedicated final images reflecting their security and system dependency requirements.

---

## 85. Image Pinning

Production images pin:

- Node major and patch policy
- Lockfile
- Base image digest
- OS package versions where practical
- Playwright version
- Chromium binary
- Font Bundle
- Application release

Production containers must not install `latest` dependencies at startup.

---

## 86. Release Identity

Every application release should have a stable release identifier.

It may include:

- Git commit
- Release version
- Container digest
- Migration version
- Schema bundle version
- Component Registry version

Agent Runs and Render Outputs should record relevant execution versions.

---

## 87. Deployment Sequence

Recommended sequence:

```text
Build
→ Test
→ Scan
→ Verify backup or restore point
→ Run one migration job
→ Deploy API and Workers
→ Verify readiness
→ Deploy Web
→ Run smoke tests
```

A failed Migration blocks deployment.

Migration is not run concurrently by every Replica.

---

## 88. Rollback Strategy

Application rollback uses a previous container image.

Database rollback should not rely on automatically running dangerous Down Migrations.

Preferred approach:

```text
Expand-and-contract
+
Backward-compatible release window
+
Forward fix when necessary
```

Irreversible migrations require explicit release notes and restore planning.

---

## 89. CI Pipeline

Every Pull Request should run:

```text
Frozen dependency install
Lint
Format check
Typecheck
Unit tests
Contract validation
JSON Schema validation
Generated-type drift check
Migration validation
Integration tests
Security checks
Build
```

Release or main-branch workflows may add:

```text
Container build
Image scan
End-to-end tests
Render snapshot tests
Agent evaluations
Prompt regression tests
Staging deployment
Smoke tests
Production deployment
```

Session-023 will define release-blocking acceptance thresholds.

---

## 90. Schema CI

CI validates:

- Schema syntax
- Unique Schema IDs
- Schema Version
- Schema draft consistency
- Generated TypeScript synchronization
- Agent Spec references
- Prompt Template references
- Workflow Template references
- Model Configuration aliases
- Component Registry references
- Export Manifest compatibility

Configuration-reference failures should be detected before runtime.

---

## 91. Migration CI

Migration tests include:

```text
Empty database
→ Apply every migration
```

```text
Previous supported schema
→ Apply new migration
```

```text
Seeded database
→ Migrate
→ Verify invariants
```

Invariants include:

- Immutable Version constraints
- Unique Version number per Artifact
- Artifact Head validity
- Approval target validity
- Outbox consistency
- Idempotency uniqueness
- Foreign keys
- Owner relationship
- Archive behavior

---

## 92. Feature Flags

Feature Flags may control:

- Real Provider
- Image Generation
- Automatic Final Render
- New Agent Spec
- New Model Configuration
- User Data Export
- Public Share
- New Source parser

A Feature Flag is not authorization.

Enabled features still require:

- Authentication
- Ownership
- Validation
- Workflow Policy
- Security Policy

---

## 93. Implementation Phases

### Phase A: Foundation

```text
Monorepo
Web shell
API shell
PostgreSQL
Drizzle
Authentication
Owner model
Content Package
Object Storage
Configuration
Logging
```

### Phase B: Source and Research

```text
Workflow foundation
Task
Outbox
BullMQ
Fetcher
Source Workspace
Research Agent Runtime
Research Review
Approval
```

### Phase C: Human Opinion and Blog

```text
Human Opinion Workspace
Question Cards
Writer Agent
Blog Editor
Working Copy
Version
Revision Proposal
Provenance
```

### Phase D: Xiaohongshu

```text
Packaging Agent
XHS Editor
Page model
Caption
Title candidates
Approval
```

### Phase E: Design and Render

```text
Visual Agent
Component Registry
Asset Registry
Renderer
Preview
Final Render
Export Package
```

### Phase F: Hardening

```text
Security tests
Deletion
Retention
Backup
Reconciliation
Observability
Failure recovery
Performance
```

The final implementation order will be formalized in Session-024.

---

## 94. Explicit MVP Exclusions

The MVP does not use:

```text
Python as the core backend
Separate frontend and backend repositories
Multiple domain implementation languages
Next.js Server Actions as domain authority
GraphQL
Microservice databases
Kubernetes
Kafka
Temporal as first workflow authority
Redis as authoritative workflow store
Full content inside Queue payloads
Shared high-permission Fetcher identity
Renderer public internet access
Chromium for every Source
macOS preview as official Final Render
Serverless-only runtime
Automatic migration from every API instance
ORM Entity as Domain Model
Hand-maintained duplicate Schemas and types
Full Prompt in ordinary logs
Complex self-hosted observability cluster
```

---

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

---

## 96. Rejected or Deferred Alternatives

### Python Core Backend

Rejected for the MVP because the principal workload is workflow, persistence, API integration, and rendering rather than local ML computation.

### Separate Frontend and Backend Repositories

Rejected because the project benefits from shared Contracts, one release context, and unified Codex implementation.

### Domain Logic inside Next.js Server Actions

Rejected because authoritative mutations must remain centralized in the NestJS Application API.

### GraphQL

Deferred because REST and OpenAPI adequately express current Query, Command, file, Task, and SSE requirements.

### Microservices

Deferred because current module boundaries can exist inside one modular monolith without distributed transactions and multiple deployment contracts.

### Redis as Workflow Source of Truth

Rejected because Queue state cannot replace durable Workflow, Task, Approval, and Version history.

### Full Data in Queue Payload

Rejected because it duplicates sensitive data, increases Redis usage, and weakens Frozen Input authority.

### One High-permission Worker

Rejected because Source Fetching, Agent execution, and Chromium require different permissions.

### Browser-based Fetch for Every Source

Rejected because it increases resource and security cost. Browser Capture may be added only for specific unsupported Sources.

### Local Preview as Final Render

Rejected because macOS, fonts, Browser binaries, and Linux containers may differ.

### Temporal in MVP

Deferred because ContentOS already defines its own workflow state and would otherwise have two orchestration authorities.

### Kafka in MVP

Deferred because current throughput and consumer diversity do not justify the operational overhead.

### Kubernetes in MVP

Deferred until multi-host scheduling, autoscaling, or high availability becomes a concrete requirement.

### Serverless-only

Rejected because long-running Workers, Chromium, Queue consumers, and maintenance jobs require persistent execution.

### Automatic Database Push in Production

Rejected because Schema changes must be reviewed and repeatable.

### OpenTelemetry Logs as the Only Logger

Deferred because the JavaScript Logs implementation remains less mature than Traces and Metrics.

---

## 97. Open Questions

The following questions remain unresolved and move to implementation planning:

1. What exact pnpm version should be pinned?
2. Will the Repository add Turborepo after the first Vertical Slice?
3. Which lint and formatting tools will be used?
4. Should the project use ESLint and Prettier or Biome?
5. What exact TypeScript strictness options are required?
6. Should internal packages compile independently?
7. Will the Monorepo use ESM only?
8. Which package exports strategy will be used?
9. How will circular package dependencies be detected?
10. Which shared code belongs in `contracts` versus `core`?
11. Should `application` remain inside `core` or become a separate package?
12. Which module owns Revision Proposal persistence?
13. Which module owns generic Artifact metadata?
14. Which module owns Artifact Head infrastructure?
15. Can Query Projections directly use Drizzle tables from multiple modules?
16. How will write-boundary violations be checked in CI?
17. Should module imports be restricted through lint rules?
18. Which Next.js major and minor version will be initially pinned?
19. Which React version will be used?
20. Which UI component library will be selected?
21. Which styling approach will be used?
22. Which Markdown editor will be used?
23. Which Diff library will be used?
24. Which drag-and-drop library will be used?
25. Which frontend Query library will be used?
26. Will autosave use debouncing, explicit batching, or both?
27. How should offline or reconnect behavior work?
28. Which Editor state remains local before autosave?
29. How should Revision conflicts be resolved in the UI?
30. Should SSE use one stream per Package or one stream per user?
31. How should SSE Events be resumed?
32. Does the Event Stream require `Last-Event-ID` support?
33. Which Events belong in SSE?
34. How should SSE authorization be refreshed?
35. How will reverse-proxy buffering be disabled for SSE?
36. What Polling interval is acceptable?
37. Which NestJS version will be selected?
38. Which Fastify plugins are required?
39. How will OpenAPI clients be generated?
40. Should internal API calls use generated clients?
41. How will API error DTOs be mapped to domain errors?
42. Which authentication implementation will be selected?
43. Will Sessions be stored in PostgreSQL or Redis?
44. Which CSRF strategy will be used?
45. Will the API expose an explicit BFF layer?
46. Which HTTP upload library will be used?
47. How will streaming downloads be implemented?
48. Which PostgreSQL major version will be used?
49. Which PostgreSQL extensions are required?
50. Will UUIDv7 be generated in application or database?
51. How will database connection pooling be configured?
52. Which indexes are required for the initial Vertical Slice?
53. How will recursive dependency queries be implemented?
54. Which Head pointer updates require row locks?
55. How will Version Number allocation be serialized?
56. How will Task leases be stored?
57. How often will Workers renew leases?
58. What lease duration is appropriate?
59. Which Task states are recoverable?
60. How will stuck Tasks be identified?
61. Should Reconciliation run in Worker or a separate process?
62. How frequently should Reconciliation execute?
63. Which BullMQ version will be pinned?
64. How will BullMQ Queue names be versioned?
65. What Job-retention policy will be used?
66. How will custom BullMQ Job IDs be formatted?
67. How are duplicate Job events recorded?
68. Which Backoff policies apply to each Queue?
69. Which Queue Jobs are removable after completion?
70. Which Queue data is retained for diagnostics?
71. How will BullMQ and PostgreSQL Task status divergence be detected?
72. How does a Worker safely resume a partially persisted Agent Run?
73. Can the first Agent Run always restart from the beginning?
74. Which Agent operations have external side effects?
75. How will Provider idempotency interact with Task retry?
76. Which Redis deployment mode will be used?
77. Is Redis persistence required?
78. What happens if Redis becomes temporarily unavailable?
79. Should API readiness require Redis?
80. Which Redis data is backed up?
81. Which Outbox delivery states are required?
82. How long are processed Outbox rows retained?
83. How will Outbox batches be locked?
84. How are failed Outbox deliveries surfaced?
85. Should Domain Events and Queue dispatches use one Outbox table?
86. Which Object Storage Provider will be used locally?
87. Which Object Storage Provider will be used in production?
88. Will local development use MinIO or another compatible service?
89. What bucket structure is required?
90. How are Object Keys generated?
91. How are Object Storage writes made atomic?
92. How is Hash verification performed during upload?
93. How are partially uploaded files removed?
94. How are Object Storage lifecycle policies configured?
95. How are temporary URLs signed?
96. What temporary URL lifetime is appropriate?
97. How is Quarantine isolated?
98. How are Renderer outputs uploaded atomically?
99. Which JSON Schema file organization will be used?
100. How will Schema `$id` values be named?
101. How will Schema references be resolved?
102. Should each Schema package compile an Ajv standalone validator?
103. Which Ajv strict-mode settings are required?
104. Which custom Formats are allowed?
105. How will Schema migrations be handled?
106. Will stored Artifact Bodies be upgraded in place or through new Versions?
107. Which TypeScript generator will create types from JSON Schema?
108. How is generated-code drift checked?
109. Which Contracts use OpenAPI instead of JSON Schema?
110. How are OpenAPI and JSON Schema shared primitives synchronized?
111. Which Playwright version will be pinned?
112. Which Chromium channel will be used?
113. How will the Renderer image install fonts?
114. Which Chinese fonts are permitted?
115. How are Font licenses recorded?
116. Which Render dimensions are required?
117. How is Browser launch concurrency limited?
118. Should one Browser serve multiple isolated Contexts?
119. When should Browser instances be recycled?
120. How are memory leaks detected?
121. How are Render timeouts determined?
122. How are failed temporary Render files cleaned?
123. How are pixel-diff tests normalized?
124. How much cross-platform preview variation is acceptable?
125. Which Linux base image will be used?
126. Should Renderer run as a non-root user?
127. Can Renderer use a read-only root filesystem?
128. Which seccomp or sandbox configuration is appropriate?
129. Can public egress be disabled reliably in local Compose?
130. Which reverse proxy will be used?
131. Will TLS terminate at the proxy or hosting platform?
132. Which container registry will store images?
133. How will image digests be pinned in deployment?
134. Which VPS or hosting platform will be used for the first release?
135. Which components should use managed services?
136. What minimum CPU and RAM are required?
137. How many Chromium Jobs can the host run safely?
138. What disk space is required?
139. How are volumes backed up?
140. How is production restore tested?
141. What is the production RPO?
142. What is the production RTO?
143. How are deployments triggered?
144. Which CI platform will be used?
145. Which container scanning tool will be used?
146. Which dependency scanning tool will be used?
147. How are lockfile changes reviewed?
148. How are migration failures recovered?
149. How long should previous application images be retained?
150. How are Feature Flags stored?
151. Which Feature Flags are environment-level?
152. Which Feature Flags are owner-level?
153. How are Feature Flag changes audited?
154. Which OpenTelemetry Collector configuration will be used?
155. Which telemetry backend will be used?
156. How long are Logs retained?
157. How are Log fields redacted centrally?
158. Which metrics are release-blocking?
159. How is high-cardinality telemetry prevented?
160. Should `content_package_id` appear as a metric label?
161. How are Provider aliases represented without leaking sensitive configuration?
162. Which health dependencies are required for API readiness?
163. How does Worker readiness differ from liveness?
164. Should unavailable Provider configurations affect Worker readiness?
165. How is graceful shutdown tested?
166. Which operations may finish during shutdown?
167. Which operations should be cancelled?
168. How are late model responses handled after shutdown?
169. Which Fake Provider Fixtures are required first?
170. How are Fixtures versioned with Agent Schemas?
171. Can Seed Data use the same Builders as tests?
172. How will test database cleanup work?
173. Should integration tests use Testcontainers or Compose?
174. How are Queue tests isolated?
175. Which tests require real Redis?
176. Which tests require real Chromium?
177. Which tests require real Object Storage?
178. Which tests use a real model Provider?
179. How will Provider integration tests control cost?
180. Which Session-022 choices require a future DEC if changed?

---

## 98. Documentation Updates

Create:

```text
docs/sessions/session-022.md
```

Update:

```text
docs/decisions/decisions.md
```

Append:

```text
DEC-221
DEC-222
DEC-223
DEC-224
DEC-225
DEC-226
DEC-227
DEC-228
DEC-229
DEC-230
DEC-231
DEC-232
DEC-233
DEC-234
DEC-235
DEC-236
DEC-237
DEC-238
DEC-239
DEC-240
DEC-241
DEC-242
DEC-243
```

Future authoritative documents:

```text
docs/architecture/technical-architecture.md
docs/architecture/modular-monolith.md
docs/architecture/repository-structure.md
docs/architecture/process-topology.md
docs/architecture/worker-architecture.md
docs/architecture/queue-architecture.md
docs/architecture/outbox-dispatcher.md
docs/architecture/task-reconciliation.md
docs/architecture/source-fetcher-runtime.md
docs/architecture/renderer-runtime.md
docs/architecture/object-storage.md
docs/architecture/schema-tooling.md
docs/architecture/configuration.md
docs/architecture/observability.md
docs/architecture/deployment.md
docs/architecture/database-migrations.md
docs/architecture/local-development.md
docs/architecture/ci-cd.md
```

Potential implementation files:

```text
pnpm-workspace.yaml
compose.yaml
tsconfig.base.json
apps/web/
apps/api/
apps/worker/
apps/fetcher/
apps/renderer/
packages/core/
packages/contracts/
packages/database/
packages/queue/
packages/agent-runtime/
packages/model-adapters/
packages/object-storage/
packages/rendering/
packages/observability/
packages/config/
packages/testing/
```

---

## 99. Documentation Sync Checklist

- [x] DEC-221 confirmed
- [x] DEC-222 confirmed
- [x] DEC-223 confirmed
- [x] DEC-224 confirmed
- [x] DEC-225 confirmed
- [x] DEC-226 confirmed
- [x] DEC-227 confirmed
- [x] DEC-228 confirmed
- [x] DEC-229 confirmed
- [x] DEC-230 confirmed
- [x] DEC-231 confirmed
- [x] DEC-232 confirmed
- [x] DEC-233 confirmed
- [x] DEC-234 confirmed
- [x] DEC-235 confirmed
- [x] DEC-236 confirmed
- [x] DEC-237 confirmed
- [x] DEC-238 confirmed
- [x] DEC-239 confirmed
- [x] DEC-240 confirmed
- [x] DEC-241 confirmed
- [x] DEC-242 confirmed
- [x] DEC-243 confirmed
- [ ] Save this document as `docs/sessions/session-022.md`
- [ ] Append DEC-221 through DEC-243 to `docs/decisions/decisions.md`
- [ ] Create Monorepo root
- [ ] Pin Node.js 24
- [ ] Create pnpm Workspace
- [ ] Create base TypeScript configuration
- [ ] Create Web skeleton
- [ ] Create API skeleton
- [ ] Create Worker skeleton
- [ ] Create Fetcher skeleton
- [ ] Create Renderer skeleton
- [ ] Create Framework-independent Core package
- [ ] Define module ownership
- [ ] Define dependency rules
- [ ] Create PostgreSQL and Drizzle package
- [ ] Define migration workflow
- [ ] Create Queue package
- [ ] Define Queue names
- [ ] Define minimum Queue payload
- [ ] Create Transactional Outbox
- [ ] Create Outbox Dispatcher
- [ ] Create Task Lease
- [ ] Create Reconciliation Job
- [ ] Create ObjectStore Port
- [ ] Create local Object Storage Adapter
- [ ] Define Quarantine
- [ ] Configure JSON Schema 2020-12
- [ ] Configure Ajv validator
- [ ] Configure generated boundary types
- [ ] Configure OpenAPI
- [ ] Generate frontend API client
- [ ] Configure SSE
- [ ] Implement Polling fallback
- [ ] Build Fake Model Adapter
- [ ] Build Agent Fixtures
- [ ] Build Renderer image
- [ ] Pin Playwright and Chromium
- [ ] Install approved Font Bundle
- [ ] Create Compose development stack
- [ ] Create Seed Data
- [ ] Configure structured logging
- [ ] Configure Log Redaction
- [ ] Configure OpenTelemetry Traces
- [ ] Configure OpenTelemetry Metrics
- [ ] Define Health endpoints
- [ ] Define process-specific Configuration Schemas
- [ ] Define deployment migration Job
- [ ] Define CI pipeline
- [ ] Define container build
- [ ] Define production Backup and Restore
- [ ] Review `AGENTS.md` after implementation documents become authoritative

---

## 100. Session Summary

ContentOS MVP uses:

```text
TypeScript
Node.js 24 LTS
pnpm Workspace
Next.js App Router
NestJS + Fastify
PostgreSQL
Drizzle
Redis + BullMQ
Private S3-compatible Object Storage
JSON Schema 2020-12 + Ajv
Playwright + pinned Chromium
SSE + Polling
Docker Compose
Structured Logs + OpenTelemetry
```

The product is a modular monolith with isolated processes:

```text
web
api
worker
fetcher
renderer
```

One Repository, one primary language, one primary database, and one release preserve product coherence.

Separate processes isolate model work, public-network fetching, and Chromium rendering.

The Domain Core does not depend on frameworks or infrastructure.

NestJS assembles the application but does not own domain truth.

Next.js owns the user interface but does not become a second authoritative backend.

PostgreSQL is the Source of Truth for domain, workflow, Task, Approval, Version, and execution state.

Redis and BullMQ deliver asynchronous work but do not own the Workflow.

Transactional Outbox connects committed domain state to Queue dispatch.

Queue payloads contain Task identity rather than complete user content.

Workers assume at-least-once delivery and use Idempotency, Lease, Heartbeat, and Reconciliation.

Source Fetcher and Renderer use isolated containers, permissions, and network policies.

Files use a private S3-compatible Object Storage abstraction.

Artifacts, Agent Contracts, and cross-boundary payloads use JSON Schema 2020-12 and Ajv.

API Contracts use REST, OpenAPI, and typed clients.

SSE accelerates Workspace updates, while Query APIs and Polling remain authoritative recovery paths.

Final Render is produced only in a fixed Linux Renderer Container with pinned Playwright, Chromium, Fonts, Components, Theme, and Render Profile.

Local development uses Docker Compose, deterministic Seed Data, and a Fake Model Adapter.

The initial production release may run on one container host without Kubernetes.

Temporal, Kafka, Microservices, and Serverless-only architecture are deferred until real scale or orchestration pressure appears.

Production migrations run as one controlled deployment Job.

Structured Logs and OpenTelemetry provide cross-process visibility without storing user content or Secrets in ordinary telemetry.

This architecture is deliberately sized for a reliable personal MVP while preserving clean paths to later scale.