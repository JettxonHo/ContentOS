# AGENTS.md

**Status:** Active repository guidance
**Current stage:** M0, M1, and M2 are completed. G1/M3 Research is implemented by the current reviewed change; G2 remains Not Started.
**Last updated:** 2026-08-13

## 1. Project identity and current stage

ContentOS is a single-user, desktop-first **Personal AI Content Studio**. It helps one creator turn source material into reviewable, traceable, private content assets.

The repository has completed **M0**, **M1 — Product Skeleton and Domain Foundation**, and **M2 — Source and Workflow Foundation**. [M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md) records the Passed private Login → Dashboard → Content Package Workspace loop. [M2 Acceptance Record 002](docs/implementation/m2-acceptance-record-002.md) records the fresh current-main Passed decision for Source intake/review/Approval, URL Fetcher, Queue/lease recovery, owner-scoped Workflow reads, private SSE notification, and the acceptance harness. G1/M3 adds deterministic Fake Provider Research from exact Approved Source Versions, direct review, immutable checkpoint, exact human Approval, and Outdated propagation. G2 Human Opinion/Blog, a real Provider, generic Agent runtime, Render, and Export remain unimplemented.

## 2. Product goal and MVP boundary

DEC-295 rebaselines the formal MVP to this bounded text-first flow:

```text
Source → Research → Human Opinion or Research-based Mode
→ approved Blog Markdown + approved Xiaohongshu text
→ manual text export
```

It is a private web application with human review. Blog and Xiaohongshu remain independent outputs from the same Content Foundation; both are required. Design, image generation, PNG Render, rich asset packages, production deployment, backup/restore, and automatic publishing are post-MVP. Read the [MVP Scope](docs/product/mvp-scope.md) and the approved execution [Goal](GOAL.md).

## 3. Authoritative documents

Read only the documents relevant to the Work Item, in this order:

- [Canonical Decision Register](docs/decisions/decisions.md): accepted decisions and historical decision navigation.
- Product Current-truth: [product definition](docs/product/product-definition.md), [users and jobs](docs/product/user-and-jobs.md), [MVP scope](docs/product/mvp-scope.md).
- Architecture Current-truth: [domain](docs/architecture/domain-overview.md), [versioning](docs/architecture/artifact-versioning.md), [technical architecture](docs/architecture/technical-architecture.md), [topology](docs/architecture/process-topology.md), [repository structure](docs/architecture/repository-structure.md), [workflow](docs/architecture/workflow-overview.md), [agent runtime](docs/architecture/agent-runtime.md), and [rendering](docs/architecture/rendering.md).
- Security Current-truth: [data classification](docs/security/data-classification.md), [security baseline](docs/security/security-baseline.md), [source fetcher](docs/security/source-fetcher.md), and [secret management](docs/security/secret-management.md).
- Quality Current-truth: [test strategy](docs/quality/test-strategy.md), [vertical-slice acceptance](docs/quality/vertical-slice-acceptance.md), and [release gates](docs/quality/release-gates.md).
- Implementation governance: [Goal](GOAL.md), [roadmap](docs/implementation/roadmap.md), [milestone exit criteria](docs/implementation/milestone-exit-criteria.md), and [Work Item template](docs/implementation/work-item-template.md).

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

- Build a TypeScript **modular monolith** with isolated `web`, `api`, `worker`, and `fetcher` processes for the text-first MVP. The existing `renderer` entry point remains dormant until post-MVP visual work; these are not microservices with independent databases.
- PostgreSQL is the authoritative state source. Redis/BullMQ transports work; it is not Workflow truth.
- Domain Core must not depend on a framework, ORM, queue, or provider SDK.
- Fetcher has a least-privilege identity. When Renderer is activated post-MVP, it has a separate identity, no public network access, and no LLM access.
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

Default to the shortest evidence path that proves the affected behavior:

- Under DEC-295's procedural amendment, an ordinary reversible change uses one Work Item, one implementation branch, one independent review, and the affected tests. The same agent may plan and implement; it may not independently approve its own change.
- A GitHub Issue may be the Work Item. A separate Work Packet, planning-only Pull Request, dual review, or postmerge reconciliation is required only for a milestone exit, an immutable Acceptance Record, an irreversible migration, a production action, or an explicitly high-risk security/architecture change.
- Do not require literal command ledgers, exact working-tree cardinalities, serialized tool-return values, byte-for-byte documentation reconstruction, or repeated status snapshots for ordinary implementation. Record commands and results once in the Pull Request or completion report.
- A normal test, formatting, CI, or tool failure may be diagnosed and corrected on the same branch, followed by the smallest relevant rerun. Strict first-failure freeze/no-rerun rules apply only when a Work Item explicitly protects destructive, production, migration, or immutable acceptance evidence.
- Documentation-only changes run formatting, repository documentation checks, and `git diff --check`. They do not run Docker Integration or Browser suites unless they change commands, test harness behavior, runtime configuration, Accepted Decisions, agent/release governance, or formal acceptance/release evidence.
- Security review is trigger-based. Require focused security review for Authentication/Authorization, external input or network access, Secrets, private data, Object Storage access, rendering active content, deletion/restore, production configuration, or a changed security boundary. Otherwise state `No new security boundary` and rely on existing baseline tests.
- Controls for capabilities that do not exist yet—Model Providers, Agent tools, Renderer execution, Export, backup/restore, production deployment—must not block earlier milestones. Introduce and verify them with the capability that creates the risk.
- Formatting fixes, evidence wording, and review corrections stay in the same Work Item unless they change scope or invalidate already-merged immutable evidence.

## 11. Work Item contract

Every Work Item must state: Task ID/title, Goal, In Scope, Out of Scope, relevant DEC/specifications, applicable Contracts (or explicitly no contract change), allowed files or modules, Acceptance Criteria, Verification, and Documentation Updates. Use the [Work Item template](docs/implementation/work-item-template.md); add detailed security, migration, observability, or production supplements only when their trigger applies.

For a separated planning, implementation, and independent-review handoff, use the [Agent Collaboration Workflow](docs/implementation/agent-collaboration-workflow.md) and its templates. It does not replace this file, the Work Item contract, or the authority hierarchy.

## 12. Definition of Ready

Start only a Ready Work Item: its outcome, scope, dependencies, applicable contracts, testable Acceptance Criteria, affected verification layers, documentation target, and any real security/migration/production impact must be known, with no Blocking Design Question. See [Definition of Ready](docs/implementation/work-item-template.md#5-definition-of-ready).

## 13. Definition of Done

Affected checks, relevant failure handling, documentation synchronization, and every Acceptance Criterion must be evidenced. A done change has no unrelated edits, skipped applicable test, or Secret, and has a reviewable diff approved by one independent reviewer. See [Definition of Done](docs/implementation/work-item-template.md#6-definition-of-done).

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
- `corepack pnpm check:docs`, `check:decisions`, and `check:secrets` run the focused dependency-free repository-integrity checks; `corepack pnpm repository:check` runs all three. They validate Git-tracked Markdown local links, the Canonical Decision Register (exactly DEC-001–DEC-295, no missing or duplicate), DEC references, and a bounded high-confidence Secret scan. They are Docker-independent and not part of `check`. Read [CI Skeleton](docs/quality/ci-skeleton.md) for their scope.
- `corepack pnpm test:integration` runs the black-box API/process integration smoke harness against isolated PostgreSQL, Redis, and S3-compatible Object Storage.
- `corepack pnpm test:integration:concurrent` launches two complete token-owned integration smoke runs concurrently and verifies distinct runtime state, credentials, cleanup ownership, and zero owned residue without touching unrelated harness runs.
- `corepack pnpm test:browser` runs the M1/M2/G1 owner-browser suite in pinned Playwright Chromium against the same isolated runtime boundary. Both Docker-dependent commands use `tmpfs`, ephemeral loopback ports, and temporary credentials outside the repository; both are intentionally excluded from `check`. Read [Integration Smoke Harness](docs/quality/integration-smoke-harness.md), [M1 Browser Thin Slice](docs/quality/browser-thin-slice.md), and [M2 Acceptance Harness](docs/quality/m2-acceptance-harness.md).
- `corepack pnpm workspace:check` confirms that pnpm resolves exactly the five current applications and six current packages.
- `corepack pnpm db:generate` generates reviewed SQL from the Drizzle schema; `db:migrate` builds the database adapter and applies committed migrations to the explicitly supplied `DATABASE_URL`.
- `corepack pnpm auth:hash-password` interactively reads a local owner password and emits only its versioned `scrypt` hash. Never pass the password as a command-line argument.
- `corepack pnpm start:web`, `start:api`, `start:worker`, `start:fetcher`, and `start:renderer` start their respective built applications.
- `corepack pnpm infra:config`, `infra:pull`, `infra:up`, `infra:status`, `infra:logs`, and `infra:down` manage only local PostgreSQL, Redis, and S3-compatible Object Storage through Compose. `infra:down` retains named volumes.

The current local S3-compatible implementation is SeaweedFS `weed mini`, pinned to its verified `4.29` image manifest. It is a local-development baseline only; it does not select a production Object Storage provider or add a vendor dependency to the Domain or application packages.

The API owns Sessions, Content Package, Source, and Research state; the durable URL-capture request boundary; private Fetcher Gateway Claim/Heartbeat/Result; API-owned Source promotion; owner-scoped Workflow reads; and notification-only SSE. Research routes consume exact Approved Source Versions, persist restricted Raw Provider output, expose only validated structured Research, and keep human Approval API-owned. PostgreSQL remains authoritative. The Worker dispatches the fixed minimal BullMQ envelope and reconciles eligible expired leases. The Fetcher uses only its scoped Redis/Object Storage/Gateway identities and never receives `DATABASE_URL`. Web provides login, Dashboard, metadata/archive Workspace, Source intake/review/Approval/Timeline, and active-only Research generate/review/checkpoint/Approval. Archived review commands remain unavailable. The committed migrations create the Source/Workflow/Fetcher and Research boundaries. No real Provider, Human Opinion, Blog, Xiaohongshu, Render, Export, publishing, or deployment exists.

## 18. Work completion report

Report: Summary; Files changed; Commands; Tests; Acceptance Criteria; Security impact; Known limitations; Incomplete items; Documentation updates; Possible new DEC; and Git status. State failures and unresolved blockers plainly. Do not claim a check passed unless it was run.
