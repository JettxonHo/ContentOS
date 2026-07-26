# 141. Decisions

## DEC-177

### Status

Accepted

### Title

Agent Runtime 是 Workflow Engine 与模型供应商之间的独立执行层

### Decision

Workflow Engine creates Tasks and freezes input dependencies.

Agent Runtime executes the model-backed Task by resolving Agent configuration, building Context, calling a Provider, parsing output, validating output, and applying bounded recovery.

Artifact Service owns Version Creation and Promotion.

### Reason

Workflow orchestration, model execution, and domain Artifact promotion have different responsibilities and failure modes.

### Impact

Agent Runtime cannot directly approve or mutate formal Artifacts.

---

## DEC-178

### Status

Accepted

### Title

每个 Agent 使用版本化 Agent Spec 作为权威行为 Contract

### Decision

Agent Spec defines:

- Purpose
- Responsibilities
- Prohibited actions
- Input Schema
- Output Schema
- Allowed capabilities
- Required model capabilities
- Validation Profile
- Runtime Policy

An Agent is not defined only by a Prompt.

### Reason

Agent boundaries require formal testing, versioning, audit, and historical explanation.

### Impact

Research, Writer, Packaging, Visual, and Chief Editor Planner require explicit Agent Specs.

---

## DEC-179

### Status

Accepted

### Title

Prompt Template 与 Agent Spec 分离并独立版本化

### Decision

Agent Spec defines stable behavior.

Prompt Template defines the model-facing expression of that behavior.

Prompt Template changes do not automatically change Agent Spec Version.

### Reason

Prompt optimization and Agent Contract changes have different meanings and release cycles.

### Impact

Every Agent Run records both Agent Spec Version and Prompt Template Version.

---

## DEC-180

### Status

Accepted

### Title

Model Configuration 与 Agent Spec、Prompt Template 分离

### Decision

Model Configuration independently defines:

- Provider Adapter
- Provider Model
- Capabilities
- Generation options
- Context and output limits
- Timeout
- Provider-specific options
- Credential Reference

Agent Spec does not permanently hardcode a provider model.

### Reason

Agents and models have many-to-many relationships and must evolve independently.

### Impact

Changing model infrastructure does not require rewriting the Agent’s domain Contract.

---

## DEC-181

### Status

Accepted

### Title

所有模型供应商通过统一 Model Adapter 接入

### Decision

Agent Runtime uses a normalized Model Adapter interface.

Provider Adapters handle:

- Request translation
- Response normalization
- Usage normalization
- Error normalization
- Cancellation
- Provider metadata

### Reason

Provider SDKs and response formats must not leak into each Agent or domain module.

### Impact

ContentOS requires normalized Model Request, Response, Usage, and Error Contracts.

---

## DEC-182

### Status

Accepted

### Title

ContentOS 使用 Model Capability Registry 与确定性 Model Router

### Decision

Model Capability Registry records approved model capabilities and limits.

Model Router selects an approved Model Configuration based on:

- Agent Spec requirements
- Runtime Policy
- Input size
- Provider availability
- Budget constraints

Router is deterministic and is not implemented as another LLM Agent.

### Reason

Model selection must be predictable, auditable, testable, and cost-controlled.

### Impact

Every Agent Run records Routing Policy Version, Routing Decision, and Reason Codes.

---

## DEC-183

### Status

Accepted

### Title

MVP 为每个 Agent 配置默认模型和有限 Fallback，不实现复杂自治路由

### Decision

Each Agent Type receives:

- One default Model Configuration
- Zero to two approved Fallback Configurations

The MVP does not implement an open model marketplace, real-time quality prediction, or autonomous model bidding.

### Reason

Provider decoupling and failure recovery provide sufficient MVP value without complex routing infrastructure.

### Impact

Future Router improvements can use Eval data without changing Agent Contracts.

---

## DEC-184

### Status

Accepted

### Title

Task、Agent Run 与 Model Call Attempt 使用三层执行模型

### Decision

Task represents the work objective.

Agent Run represents one logical execution under fixed Agent Spec, Prompt, Input Snapshot, and Runtime Policy.

Model Call Attempt represents one Provider invocation.

Fallback, Repair, and Regeneration create new Model Call Attempts.

A new full Task retry creates a new Agent Run.

### Reason

Business work, logical execution, and provider calls need separate histories.

### Impact

Agent Runtime stores both Agent Run and Model Call Attempt records.

---

## DEC-185

### Status

Accepted

### Title

Agent Run 使用完整且冻结的 Execution Manifest

### Decision

Agent Run records:

- Agent Spec Version
- Prompt Template Version
- Runtime Policy Version
- Validation Profile Version
- Frozen Input Snapshot
- Routing Policy
- Model Configuration
- Model Call Attempts
- Usage
- Validation
- Promotion Result

Input Snapshot, Agent Spec, and Prompt Template cannot silently change during execution.

### Reason

A complete Execution Manifest is required for audit, evaluation, reproducibility, and failure analysis.

### Impact

Configuration updates affect only new Agent Runs.

---

## DEC-186

### Status

Accepted

### Title

结构化 Agent 优先使用 Provider-native Structured Output，并以独立 Schema 验证

### Decision

Research, Packaging, Visual, Command Proposal, and other typed Agents return versioned structured Candidate output.

Provider-native Structured Output or JSON Schema is preferred.

Prompt formatting instructions do not replace formal Schema Validation.

### Reason

Natural-language format instructions are not reliable enough to serve as system Contracts.

### Impact

Every structured Agent Candidate requires an independent versioned Schema.

---

## DEC-187

### Status

Accepted

### Title

Agent 输出依次经过 Parse、Schema Validation 与 Domain Validation

### Decision

Agent output processing is:

```text
Parse
→ Schema Validation
→ Domain Validation
```

Schema-valid output is not automatically domain-valid.

Domain Validators remain owned by the relevant domain modules.

### Reason

Evidence, first-person provenance, citation, page purpose, component compatibility, and dependency validity cannot be guaranteed by JSON Schema alone.

### Impact

Agent Run Result records each validation stage independently.

---

## DEC-188

### Status

Accepted

### Title

Schema Repair 与 Domain Regeneration 使用不同且有上限的策略

### Decision

Structural errors use bounded Schema Repair.

Domain-rule failures use bounded Domain Regeneration where Policy permits.

Each Repair or Regeneration creates a new Model Call Attempt and preserves the original output.

Unlimited self-repair loops are prohibited.

### Reason

Structural correction and content correction have different risks and recovery requirements.

### Impact

Runtime Policy separately defines limits for Provider retry, Schema Repair, and Domain Regeneration.

---

## DEC-189

### Status

Accepted

### Title

Raw Model Output 在解析前持久化，Candidate Output 与 Artifact Promotion 分离

### Decision

Provider output is persisted before Parse and Validation.

Valid Candidate Output is passed to the independent Artifact Promotion process.

A completed model call does not automatically create or promote an Artifact Version.

### Reason

Raw Output is required for debugging, reprocessing, quality evaluation, duplicate handling, and historical audit.

### Impact

Large Raw Outputs may be stored in Object Storage with database metadata and Hash.

---

## DEC-190

### Status

Accepted

### Title

Agent Context 必须显式构建，并禁止静默截断权威输入

### Decision

Context Builder selects only Agent-required data.

Runtime performs Context Capacity Preflight.

If input does not fit, Runtime must use:

- An approved long-context Model Configuration
- An Agent Spec-defined chunking workflow
- Explicit optional-context reduction
- Or `context_capacity_exceeded`

Runtime may not silently remove Source, Evidence, or Human Opinion.

### Reason

Hidden truncation damages completeness, provenance, and execution transparency.

### Impact

Agent Run stores Context estimates and coverage information.

---

## DEC-191

### Status

Accepted

### Title

Agent Tool Access 默认关闭，所有工具能力通过 Capability Gateway

### Decision

MVP Agents default to Frozen Input to Structured Output execution.

Any future Tool Calling must pass through an allowlisted, typed, authorized, audited Capability Gateway.

Models cannot directly access the internet, database, Shell, filesystem, Workflow Commands, or Secrets.

### Reason

Unrestricted Tool Calling expands security risk and violates Agent single-responsibility boundaries.

### Impact

Research, Writer, Packaging, and Visual Agents use no external tools in the MVP.

---

## DEC-192

### Status

Accepted

### Title

Retry、Fallback、Repair 和 Refusal 按统一错误分类处理

### Decision

Agent Runtime classifies execution failures as:

- Transient Provider Error
- Permanent Configuration Error
- Context Capacity Error
- Invalid Structured Output
- Domain Validation Failure
- Safety Refusal
- Content Filtered
- Cancelled
- Budget Exceeded
- Capability Error
- Unknown Runtime Error

Only Policy-approved categories receive Retry, Fallback, Repair, or Regeneration.

Provider switching must not be used to evade safety refusal.

### Reason

Unclassified retry behavior wastes cost, hides configuration defects, and creates security risk.

### Impact

Model Adapter and Agent Run records use stable error classifications and recovery paths.

---

## DEC-193

### Status

Accepted

### Title

每个 Agent Run 使用明确的 Token、时长、调用次数和成本预算

### Decision

Runtime Policy may limit:

- Input Tokens
- Output Tokens
- Model Call Attempts
- Provider retries
- Fallback Attempts
- Repair Attempts
- Tool Calls
- Wall-clock time
- Estimated Cost

Execution stops when a hard limit is exceeded.

### Reason

Agent execution requires protection from retry loops, context growth, and unpredictable cost.

### Impact

Budget values are tuned through testing and Agent Eval.

---

## DEC-194

### Status

Accepted

### Title

Agent Runtime 统一记录 Usage、成本、延迟和 Validation Telemetry

### Decision

Model Adapter normalizes Provider Usage.

Agent Runtime records:

- Token Usage
- Provider latency
- Model Call Attempts
- Routing Decision
- Validation results
- Repair and Regeneration
- Failure
- Promotion Result

Unknown values remain `null`.

### Reason

Cost control, Agent evaluation, Provider comparison, and incident analysis require shared telemetry.

### Impact

Session-023 will use this telemetry for formal evaluation and acceptance testing.

---

## DEC-195

### Status

Accepted

### Title

Agent 可复现性定义为完整执行记录，而不是保证逐字相同输出

### Decision

ContentOS records:

- Frozen Input Snapshot
- Agent Spec Version
- Prompt Template Version
- Model Configuration
- Runtime Policy
- Routing Policy
- Model Call Attempts
- Provider Request IDs
- Raw Output
- Validation Result
- Artifact Version

The system does not promise that a repeated model call produces identical text.

It does not require or store private Chain of Thought.

### Reason

Generative models and provider infrastructure do not guarantee strict deterministic output.

### Impact

Historical reproduction relies on preserved execution records and outputs rather than regeneration alone.

---

## DEC-196

### Status

Accepted

### Title

MVP 不使用模糊语义缓存，只允许显式幂等复用

### Decision

ContentOS may reuse an existing result only when execution identity is exactly equivalent, including Task, Input Snapshot, Agent Spec, Prompt, Policy, and Idempotency.

The MVP does not automatically reuse output from an approximately similar request.

### Reason

Semantic cache reuse can introduce incorrect dependencies, stale content, and hidden execution behavior.

### Impact

Any future Exact Request Cache must be explicit, dependency-aware, version-aware, and auditable.

---

## DEC-197

### Status

Accepted

### Title

模型 API Secret 与普通运行数据严格分离

### Decision

Provider Secrets do not enter:

- Prompt
- Input Snapshot
- Frontend DTO
- Normal Model Configuration record
- Raw Output
- Workflow Event
- Export Package
- Eval dataset

Model Configuration stores only a Credential Reference.

### Reason

Provider credentials are infrastructure secrets rather than Agent domain input.

### Impact

Secret storage, rotation, and access control are formalized in Session-021.

---

## DEC-198

### Status

Accepted

### Title

Image Generation Service 复用 Provider 抽象概念，但保持独立运行边界

### Decision

Image Generation Service may reuse:

- Provider Adapter
- Model Configuration
- Capability Registry
- Usage normalization
- Error normalization
- Retry and budget concepts
- Run metadata

It retains separate:

- Asset Request Contract
- Binary-output handling
- Candidate review
- Asset Version creation
- Storage workflow
- Safety and attribution validation

### Reason

Text Agents and image generation differ substantially in output type, review, storage, and failure behavior.

### Impact

Generated images are managed through Asset Registry rather than ordinary text Candidate promotion.
