# AGENTS.md

**Status:** Active repository guidance
**Current stage:** M1 completed; M2 is in progress. M2 Source, Workflow, Fetcher, Workspace, and acceptance-harness Work Items are completed. `M2-GOV-005` remains **Completed — Exit Review Blocked** in [M2 Acceptance Record 001](docs/implementation/m2-acceptance-record-001.md) on reviewed commit `c64fe74ab27513b07a2eb95e86c8f55b90245923`; its recorded `nanoid` advisory blocker was remediated by `M2-MAINT-002` through PR #142, squash merge `5b9640707217aba3d7f59c14f2343e6fcc7f102b`, with Issue #139 closed. M2 remains In Progress pending a new numbered exit review and M3 remains Not Started.
**Last updated:** 2026-08-08

## 1. Project identity and current stage

ContentOS is a single-user, desktop-first **Personal AI Content Studio**. It helps one creator turn source material into reviewable, traceable, private content assets.

The repository has completed **M0** and **M1 — Product Skeleton and Domain Foundation**. [M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md) records the Passed decision for the private Login → Dashboard → Content Package Workspace loop and its Domain/persistence/security foundations. M2 — Source and Workflow Foundation — is in progress; its Source, Workflow, delivery, Gateway, recovery, Result, public-transport, Candidate/Snapshot, Queue-to-Gateway Fetcher, internal current-Approved Source input projection, private notification-only SSE, Source Intake Workspace, and Source Review and Approval Workspace foundations through `M2-WEB-001B` are completed. `M2-FETCH-001` is completed through PR #100, squash merge `4fe20a48a02b83ec68886bae68b86f5e65ba3895` (`feat: add queue-to-gateway Fetcher orchestration (#100)`); `M2-SRC-004` is completed through PR #104, squash merge `d2ec063743681b64f0406b4903805700bd9866e3` (`feat: add approved Source input projection (#104)`); `M2-WF-004A` is completed through PR #108, squash merge `acdb971ffd8a1c8898666182ac017817f095e1b7` (`feat: add workflow projection and timeline queries (#108)`), with owner-scoped authoritative Workflow projection and Timeline REST reads. `M2-WF-004B` is completed through PR #112, squash merge `d9460747c530797dc11c341374183ad57e7fa85e` (`feat: add workflow SSE recovery (#112)`), with private notification-only SSE and a reusable browser recovery controller. `M2-WEB-001B` is completed through PR #122, squash merge `9af5f68b8846ab172bff7599657c9409faed85c4` (`feat: add Source review and approval workspace (#122)`). `M2-QUAL-001` is completed through PR #126, squash merge `4ee1911c69d9ad55bbb34a3729be3cd3d9625f23` (`test: add M2 acceptance harness (#126)`). `M2-GOV-005` remains Completed — Exit Review Blocked in [M2 Acceptance Record 001](docs/implementation/m2-acceptance-record-001.md); its recorded `nanoid` advisory blocker was remediated by `M2-MAINT-002` through PR #142, squash merge `5b9640707217aba3d7f59c14f2343e6fcc7f102b`, with Issue #139 closed. M2 remains incomplete pending a new numbered exit review and M3 remains Not Started.

`M2-WEB-001A` is completed through PR #118, squash merge `58d2e8ca1f80d0ea03ef991aa22f40c3b058c25c` (`feat: add Source intake workspace (#118)`). The active Workspace now provides Source intake, explicit Source Working Copy review and save, immutable Version history, exact Review Candidate human Approval, and a safe REST Workflow Timeline composed through the existing notification/Polling recovery controller. Source Approval does not transition `source_review` or append a Workflow Timeline Event, and archived Package review commands remain unavailable. Research, Agent, Render, and Export behavior remain unimplemented.

## 2. Product goal and MVP boundary

The formal MVP follows this bounded flow:

```text
Source → Research → Human Opinion → Blog / Xiaohongshu → Design → Render → Export
```

It is a private web application with human review. Blog and Xiaohongshu are independent outputs from the same Content Foundation; both are required for the formal MVP. Publishing is manual. Do not duplicate the full scope here—read the [MVP Scope](docs/product/mvp-scope.md).

## 3. Authoritative documents

Read only the documents relevant to the Work Item, in this order:

- [Canonical Decision Register](docs/decisions/decisions.md): accepted decisions and historical decision navigation.
- Product Current-truth: [product definition](docs/product/product-definition.md), [users and jobs](docs/product/user-and-jobs.md), [MVP scope](docs/product/mvp-scope.md).
- Architecture Current-truth: [domain](docs/architecture/domain-overview.md), [versioning](docs/architecture/artifact-versioning.md), [technical architecture](docs/architecture/technical-architecture.md), [topology](docs/architecture/process-topology.md), [repository structure](docs/architecture/repository-structure.md), [workflow](docs/architecture/workflow-overview.md), [agent runtime](docs/architecture/agent-runtime.md), and [rendering](docs/architecture/rendering.md).
- Security Current-truth: [data classification](docs/security/data-classification.md), [security baseline](docs/security/security-baseline.md), [source fetcher](docs/security/source-fetcher.md), and [secret management](docs/security/secret-management.md).
- Quality Current-truth: [test strategy](docs/quality/test-strategy.md), [vertical-slice acceptance](docs/quality/vertical-slice-acceptance.md), and [release gates](docs/quality/release-gates.md).
- Implementation governance: [roadmap](docs/implementation/roadmap.md), [milestone exit criteria](docs/implementation/milestone-exit-criteria.md), and [Work Item template](docs/implementation/work-item-template.md).

[Sessions](docs/sessions/) preserve historical discussion; [vision.md](docs/product/vision.md) preserves product background. Neither is the normal implementation entry point.

## 4. Document precedence

Use this implementation chain:

```text
Later Accepted DEC → Current-truth Specification → Work Item → Implementation
```

The user’s explicit current instruction is the task-level authority. A Work Item never overrides an Accepted DEC or Current-truth specification. If they conflict or the conflict cannot be resolved from the register, stop implementation, report the conflict, and request a Decision Review where required. Do not silently choose an interpretation.

## 5. Approved technical stack

The approved direction is: TypeScript; Node.js 24 LTS; pnpm Workspace; Next.js App Router; NestJS + Fastify; REST + OpenAPI; PostgreSQL + Drizzle; Redis + BullMQ; S3-compatible Object Storage; JSON Schema 2020-12 + Ajv; Playwright + pinned Chromium; Docker Compose; and OpenTelemetry.

Do not select packages, versions, providers, images, or CI products unless a Ready Work Item authorizes the bounded choice.

## 6. Architecture and process boundaries

- Build a TypeScript **modular monolith** with isolated `web`, `api`, `worker`, `fetcher`, and `renderer` processes—not microservices with independent databases.
- PostgreSQL is the authoritative state source. Redis/BullMQ transports work; it is not Workflow truth.
- Domain Core must not depend on a framework, ORM, queue, or provider SDK.
- Fetcher and Renderer have separate least-privilege identities. Renderer has no public network access and no LLM access.
- API owns domain-state changes. Web, workers, and tools do not bypass API/domain rules by writing state directly.

## 7. Domain and versioning invariants

- A Working Copy is mutable; a Version is immutable.
- Approval binds one precise immutable Version and its validation result.
- Dependencies bind exact upstream Versions; downstream work becomes outdated when relevant inputs change.
- Restore creates a new Version; it never overwrites history.
- Artifact Head distinguishes Working Copy, Latest Version, Review Candidate, and Approved Version; it is not one “current” pointer.
- Outdated is not Deleted. Historical Versions remain readable and cannot be overwritten.

## 8. Workflow and agent rules

- Chief Editor coordinates bounded work; it is not a super-agent.
- AI produces Proposals or Candidates. Workflow Commands require structured validation; model output has no execution authority.
- Human Approval is never created or substituted by an Agent.
- Task, Agent Run, and Model Attempt are separate records. Raw Output is not automatically an Artifact.
- Tools are disabled by default and opened only by an approved capability boundary.
- A Cancelled or stale late result cannot be promoted.

## 9. Security rules

- Keep product data private by default. Authentication and Authorization are separate; enforce owner scope.
- Treat external input as untrusted. The only MVP upload formats are `.md` and `.txt`.
- Never place Secrets in Git, logs, Queue payloads, Prompts, exports, or diagnostic evidence. Use Secret References and least privilege.
- Preserve source safety, Prompt Injection containment, upload quarantine, safe rendering, and scoped private object access.
- A Security Error has no ordinary bypass. Report it and use the approved failure path.

## 10. Testing and quality rules

- Put deterministic rules behind tests and validators.
- Evaluate Agent quality with versioned Evals when that milestone introduces Agent Eval; M0 needs only baseline quality entry points.
- An LLM Judge may inform evaluation but cannot replace a deterministic Gate.
- A Critical Failure is not offset by average scores. Do not silence or skip a failing required test to obtain a pass.
- Use the applicable test layers, recovery tests, security tests, and render checks from the [Test Strategy](docs/quality/test-strategy.md).

Keep review and defensive design proportional to credible product risk:

- Do not turn ordinary implementation review into a security-paper exercise or add controls for merely imaginable cases with no realistic path or material impact.
- Do not introduce a new hash or SHA-256 mechanism unless an existing Accepted contract requires it or a concrete major risk threatens a core product function. This rule does not silently remove an already accepted integrity or credential contract.
- Cover accepted invariants and plausible failure paths without repeatedly defending against effectively unreachable variants.
- Use rubrics to support engineering judgment, not as mechanical checklists that override context, risk, or product value.

## 11. Work Item contract

Every Work Item must state: Task ID, Goal, In Scope, Out of Scope, Relevant DEC, Relevant Documents, Acceptance Criteria, Tests, and Documentation Updates. Use the [Work Item template](docs/implementation/work-item-template.md); it also defines Contracts, file boundaries, security review, migration review, and observability requirements.

For a separated planning, implementation, and independent-review handoff, use the [Agent Collaboration Workflow](docs/implementation/agent-collaboration-workflow.md) and its templates. It does not replace this file, the Work Item contract, or the authority hierarchy.

## 12. Definition of Ready

Start only a Ready Work Item: its scope, dependencies, relevant Accepted DEC, contracts, testable acceptance criteria, fixtures, security and migration impacts, documentation target, and no Blocking Design Question must be known. See [Definition of Ready](docs/implementation/work-item-template.md#17-definition-of-ready).

## 13. Definition of Done

Required checks, relevant failure handling, documentation synchronization, and every Acceptance Criterion must be evidenced. A done change has no unrelated edits, skipped required test, or Secret, and has a reviewable diff. See [Definition of Done](docs/implementation/work-item-template.md#18-definition-of-done).

## 14. Documentation sync

Synchronize Current-truth when accepted behavior changes; API and Schema contracts when their boundary changes; runbooks when operation or recovery changes; and `README.md` or this file when repository entry guidance changes. Use Decision Review for a change to scope, domain semantics, workflow, security boundary, agent responsibility, technical architecture, or release gate. An ordinary Bug Fix does not automatically require a new DEC.

## 15. Scope change and DEC governance

- **Bug:** accepted behavior fails; use the defect flow.
- **Implementation Detail:** a bounded choice that does not change accepted behavior; use a normal Work Item.
- **Scope or Architecture Change:** affects MVP scope, domain, workflow, security, agent responsibility, technical architecture, or release gate; stop and create a Decision Review before implementation.

Do not modify an Accepted DEC. Later Accepted DEC govern an actual conflict.

## 16. Prohibited actions

Do not:

- expand MVP scope, alter the approved stack, create microservice databases, or add Kubernetes, Kafka, or Temporal;
- automate Approval or public publishing;
- bypass API/domain rules to mutate domain state;
- disable tests to make checks pass, commit a Secret, or create an ownerless `shared` or `utils` area;
- make broad unrelated refactors; or
- create a Git Commit unless the task explicitly authorizes one.

## 17. Current commands

M0-QUAL-001 extends the real workspace commands with a local quality toolchain. Node.js remains 24.18.0 and pnpm remains Corepack-managed at 11.17.0:

- `corepack pnpm install` installs the single workspace lockfile.
- `corepack pnpm install --frozen-lockfile` verifies reproducible installation.
- `corepack pnpm typecheck` builds the shared package declarations required by consumers, then runs strict TypeScript checking across the workspace. The root strict baseline keeps `skipLibCheck` disabled; only the Drizzle adapter package isolates known third-party declaration noise.
- `corepack pnpm build` creates the five application build outputs.
- `corepack pnpm format` formats the active repository baseline; `format:check` verifies it without writes.
- `corepack pnpm lint` runs the root flat ESLint configuration across source and configuration files.
- `corepack pnpm test` runs local, deterministic Vitest unit tests. It does not require Docker or any external service.
- `corepack pnpm check` runs `format:check`, `lint`, `typecheck`, `test`, and `build` in that order and stops at the first failure.
- `corepack pnpm check:docs`, `check:decisions`, and `check:secrets` run the focused dependency-free repository-integrity checks; `corepack pnpm repository:check` runs all three. They validate Git-tracked Markdown local links, the Canonical Decision Register (exactly DEC-001–DEC-294, no missing or duplicate), DEC references, and a bounded high-confidence Secret scan. They are Docker-independent and not part of `check`. Read [CI Skeleton](docs/quality/ci-skeleton.md) for their scope.
- `corepack pnpm test:integration` runs the black-box API/process integration smoke harness against isolated PostgreSQL, Redis, and S3-compatible Object Storage.
- `corepack pnpm test:integration:concurrent` launches two complete token-owned integration smoke runs concurrently and verifies distinct runtime state, credentials, cleanup ownership, and zero owned residue without touching unrelated harness runs.
- `corepack pnpm test:browser` runs the M1/M2 owner-browser suite in pinned Playwright Chromium against the same isolated runtime boundary. Both Docker-dependent commands use `tmpfs`, ephemeral loopback ports, and temporary credentials outside the repository; both are intentionally excluded from `check`. Read [Integration Smoke Harness](docs/quality/integration-smoke-harness.md), [M1 Browser Thin Slice](docs/quality/browser-thin-slice.md), and [M2 Acceptance Harness](docs/quality/m2-acceptance-harness.md).
- `corepack pnpm workspace:check` confirms that pnpm resolves exactly the five current applications and six current packages.
- `corepack pnpm db:generate` generates reviewed SQL from the Drizzle schema; `db:migrate` builds the database adapter and applies committed migrations to the explicitly supplied `DATABASE_URL`.
- `corepack pnpm auth:hash-password` interactively reads a local owner password and emits only its versioned `scrypt` hash. Never pass the password as a command-line argument.
- `corepack pnpm start:web`, `start:api`, `start:worker`, `start:fetcher`, and `start:renderer` start their respective built applications.
- `corepack pnpm infra:config`, `infra:pull`, `infra:up`, `infra:status`, `infra:logs`, and `infra:down` manage only local PostgreSQL, Redis, and S3-compatible Object Storage through Compose. `infra:down` retains named volumes.

The current local S3-compatible implementation is SeaweedFS `weed mini`, pinned to its verified `4.29` image manifest. It is a local-development baseline only; it does not select a production Object Storage provider or add a vendor dependency to the Domain or application packages.

The API owns Sessions, Content Package and Source state, the durable URL-capture request boundary, private Fetcher Gateway Claim/Heartbeat/Result, API-owned Source promotion, owner-scoped read-only `GET /v1/content-packages/:packageId/workflow` and `/workflow/events` queries, and notification-only `GET /v1/content-packages/:packageId/workflow/stream`. REST reads expose materialized Nodes and a bounded safe Event Timeline; PostgreSQL remains the Workflow truth. The SSE route compares the public projection in process memory and only notifies a browser to refresh or Poll; it cannot reconstruct Workflow state. The Worker uses PostgreSQL and Redis to dispatch the fixed minimal BullMQ envelope and reconcile eligible expired leases. `M2-FETCH-001C` registers the Fetcher as the bounded consumer: it validates the current-generation Job, uses Fetcher-only Redis/Object Storage identities and controlled public transport, and submits Result through the Gateway. It never receives `DATABASE_URL` or writes Task, Workflow, or Source state directly. Web provides the M1 login, active/archived Dashboard, new-package form, metadata/archive Workspace, active Source Intake, and active-only Source review: explicit normalized Working Copy save, immutable Version review, exact current Review Candidate confirmation, and a bounded REST Timeline refreshed by the existing recovery controller. Source Approval does not transition `source_review` or append a Workflow Timeline Event, and archived Package review commands remain unavailable. The committed migrations create the M1 Source graph, Workflow catalog, URL-capture delivery boundary, Task leases, and Result boundary. No Research, Agent, Render, Export, publishing behavior, or deployment exists.

## 18. Work completion report

Report: Summary; Files changed; Commands; Tests; Acceptance Criteria; Security impact; Known limitations; Incomplete items; Documentation updates; Possible new DEC; and Git status. State failures and unresolved blockers plainly. Do not claim a check passed unless it was run.
