# ContentOS Agent Runtime

**Status:** Current Truth

**Scope:** Versioned Agent execution, model boundaries, Context, validation, recovery, Candidate handling, security, and auditability

**Last Updated:** 2026-07-27

This document defines how ContentOS executes Agent Specs and model calls in a controlled and auditable way. It defines responsibilities and invariants, not Prompt content, JSON Schemas, Provider selection, model names, package versions, or concrete budget values.

Related current-truth documents:

- [Product Definition](../product/product-definition.md)
- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](domain-overview.md)
- [Artifact Versioning](artifact-versioning.md)
- [Technical Architecture](technical-architecture.md)
- [Process Topology](process-topology.md)
- [Workflow Overview](workflow-overview.md)
- [Rendering](rendering.md)

---

## 1. Runtime Purpose

```text
Workflow Engine
→ Agent Runtime
→ Model Providers
```

The Workflow Engine creates an eligible Task and freezes its input dependencies. Agent Runtime executes model-backed work by:

- Resolving an exact Agent Spec;
- Building an explicit Context;
- Resolving approved Prompt, Model, Runtime, and Validation configuration;
- Calling a Model Provider through an Adapter;
- Persisting Raw Provider Output;
- Parsing and normalizing the output;
- Performing Schema and Domain Validation;
- Applying bounded Repair, Regeneration, Retry, or Fallback where policy permits;
- Producing a Candidate for an independent Promotion boundary;
- Recording telemetry, budgets, cancellation, and execution history.

Agent Runtime does not approve content, publish, execute a Workflow Command, or directly mutate a formal Artifact. Artifact Version creation and Promotion remain independent Domain/Application responsibilities.

## 2. Agent Responsibility Model

Each Agent has one logical responsibility. Research, Writer, Packaging, Visual, and Chief Editor Planner remain separate responsibilities with distinct inputs, outputs, prohibited actions, validation, and evaluation.

An Agent is a logical contract boundary. It does not require a separate microservice, database, Queue, or deployable process. Multiple Agent types may run through the shared Worker and Agent Runtime while retaining separate Agent Specs.

An Agent receives only the capabilities its Agent Spec explicitly permits. Single responsibility is enforced through Contract, Context, Capability, validation, and Promotion boundaries—not merely through Prompt wording.

## 3. Agent Spec

A versioned Agent Spec is the authoritative behavior Contract for one Agent responsibility. It conceptually defines:

- **Agent Spec ID:** stable identity of an Agent responsibility;
- **Agent Spec Version:** exact immutable behavior Contract;
- **Responsibility:** the bounded result the Agent is meant to produce;
- **Input Contract:** required and permitted structured input;
- **Output Contract:** expected structured Candidate form;
- **Prompt Template reference:** exact independently versioned model-facing template;
- **Runtime Policy reference:** execution, retry, budget, and cancellation rules;
- **Validation Profile reference:** required Parse, Schema, and Domain checks;
- **Capability requirements:** required model capabilities and allowed tool capabilities;
- **Promotion Policy:** what an eligible Candidate may become and which checks remain external;
- **Prohibited actions:** behavior outside the Agent's responsibility.

An Agent is not defined only by a Prompt. Agent Spec changes are versioned, evaluated, release-gated, and rollback-capable.

## 4. Prompt Template

Prompt Templates are independently versioned model-facing expressions of an Agent Spec.

- A Prompt Template is referenced by identity and Version;
- changing Prompt wording does not silently rewrite Agent Spec history;
- production Prompt changes require evaluation, comparison with the current Baseline, and a Release Gate;
- production Prompts cannot be hot-edited without Versioning;
- Prompt Templates do not contain Secrets or Credential values;
- Prompt formatting instructions never replace a formal output Schema or Domain Validator.

Prompt content and template syntax are outside this document.

## 5. Model Configuration

A Model Configuration is independently versioned and conceptually includes:

- Provider Alias;
- Model Alias;
- generation parameters;
- capability claims;
- Context and output limits;
- cost and usage metadata;
- timeout behavior;
- Fallback eligibility;
- a Credential Reference, never a Secret value.

Agent Spec, Prompt Template, and Model Configuration have different lifecycles. An Agent Spec does not permanently hardcode a Provider model.

The initial Provider, model, parameter values, and exact configuration storage remain Open Implementation Decisions.

## 6. Model Adapter

All Model Providers are accessed through a normalized Model Adapter interface.

Provider Adapters own:

- Provider request translation;
- Provider-native structured-output integration where supported;
- response and streaming normalization;
- usage and cost-data normalization;
- Provider request identity;
- error and refusal normalization;
- cancellation behavior;
- Provider-specific SDK interaction.

Provider SDK types stay inside the Adapter boundary. Domain Core and Agent Specs do not depend on a Provider SDK.

An Adapter reports normalized execution facts. It does not decide whether content satisfies Evidence, first-person, Citation, dependency, page, Design, or other Domain rules.

## 7. Capability Registry and Router

The Model Capability Registry records approved capability and limit claims for available Model Configurations. The deterministic Model Router selects an approved configuration using:

- Agent Spec capability requirements;
- Runtime Policy;
- Context capacity;
- Provider availability;
- cost and budget constraints;
- approved Fallback order.

MVP routing uses one default configuration per Agent type and zero to two approved Fallback configurations. It does not implement an LLM Router, autonomous bidding, unconstrained Provider discovery, or an open model marketplace.

A Security Error, Safety Refusal, content filter, or Domain Validation failure cannot be evaded through arbitrary model switching. Only policy-approved categories may use Fallback.

## 8. Execution Object Model

```text
Task
└── Agent Run
    ├── Model Call Attempt 1
    ├── Model Call Attempt 2: Provider retry or Fallback
    └── Model Call Attempt 3: Repair or Regeneration
```

### 8.1 Task

A Task represents work the Workflow intends to complete. It owns operational eligibility, cancellation, idempotency, lease, and recovery state. A Task may be non-model-backed.

### 8.2 Agent Run

An Agent Run is one logical execution of an exact Agent Spec under a Frozen Input Snapshot, Prompt Template, Runtime Policy, Validation Profile, Routing Policy, and Model Configuration. A full Task retry may create another Agent Run.

### 8.3 Model Call Attempt

A Model Call Attempt is one concrete Provider invocation. Provider retry, Fallback, Schema Repair, or Domain Regeneration creates another Attempt without rewriting the earlier Attempt.

Task success, Agent Run completion, Model Call success, Candidate validity, Promotion, and Approval are separate outcomes.

## 9. Frozen Input Snapshot

Before an Agent Run begins, the Runtime freezes an Execution Manifest that includes:

- Exact Artifact and upstream Version references;
- Agent Spec ID and Version;
- Prompt Template ID and Version;
- selected Model Configuration;
- Routing Policy and routing decision;
- Runtime Policy Version;
- Validation Profile Version;
- Context Manifest and coverage information;
- Input and output Schema Versions;
- Token, cost, attempt, Context, timeout, and other applicable budgets.

Once the Agent Run starts, these inputs cannot be silently replaced. Later configuration or upstream Version changes affect only a new Run. An old-input result may be retained but becomes stale on arrival when current dependencies no longer match Promotion eligibility.

## 10. Context Assembly

Context is explicitly constructed from authorized, role-appropriate data.

- Context Builder selects only information required by the Agent Spec;
- exact Artifact Versions and Evidence references are recorded in the Context Manifest;
- Source content is untrusted external data and cannot grant instructions or capabilities;
- Raw Human Opinion enters Context only when the Agent responsibility and data policy permit it;
- model memory is not formal Evidence;
- Agent Context does not include Secrets;
- Context Capacity is checked before the Provider call;
- authoritative Source, Evidence, or Human Opinion cannot be silently truncated.

If required input does not fit, Runtime uses only an approved path: an eligible long-context configuration, an Agent Spec-defined chunking Workflow, explicit optional-context reduction, or a clear `context_capacity_exceeded`-class result. Runtime-defined invisible chunking is prohibited.

## 11. Raw Output and Candidate

The processing order is:

```text
Persist Raw Provider Output
→ Parse
→ Normalize
→ Schema Validation
→ Domain Validation
→ Candidate
```

Raw Output:

- Has no execution, Approval, Promotion, or Domain write authority;
- Is stored before Parse so failure evidence is preserved;
- Is access-controlled and governed by a separate retention policy;
- Is not placed in ordinary logs, traces, frontend responses, Exports, or Eval datasets by default;
- May use Object Storage with database metadata and content Hash when appropriate.

A Candidate is a validatable proposed output bound to its Frozen Input Snapshot. It is not yet a formal Artifact, Review Candidate, Approval, or current Workflow result.

## 12. Validation Layers

The Runtime records three distinct results:

### 12.1 Parse

Determines whether the Raw Output can be converted into the target machine-readable representation. Parsing does not establish structural or Domain correctness.

### 12.2 Schema Validation

Determines whether the parsed object satisfies the exact versioned JSON Schema Contract. Provider-native structured output assists generation but does not replace independent Schema Validation.

### 12.3 Domain Validation

Determines whether the structurally valid object satisfies its owned business and trust rules, such as:

- Evidence and Research usage;
- Human Opinion and first-person provenance;
- Citation and direct-quote accuracy;
- dependency eligibility;
- page purpose and content density;
- Component and Content Binding constraints;
- Blocking Error and Warning policy.

Domain Validators are deterministic code owned by the relevant Domain module. LLM-as-Judge is not authoritative for these rules. One generic “validation passed” field cannot replace the separate layer results.

## 13. Repair and Regeneration

### 13.1 Schema Repair

Schema Repair addresses bounded format or structural failure without changing the Task objective. It creates a new Model Call Attempt, references the original Raw Output, and is independently recorded.

### 13.2 Domain Regeneration

Domain Regeneration requests a new Candidate when content fails a Domain rule and Runtime Policy permits another attempt. It also creates a new Model Call Attempt and preserves the failed Candidate and validation result.

Both paths have explicit attempt, token, time, and cost limits. They cannot form an infinite self-reflection loop. Critical Security failures, unauthorized capability requests, and Safety Refusals do not enter ordinary Repair or get bypassed through Fallback.

## 14. Candidate and Promotion

Candidate and formal Artifact state remain separate.

- Every Candidate binds the Frozen Input Snapshot and originating Agent Run;
- a Candidate may be stale on arrival if upstream state changed during execution;
- Promotion rechecks current dependencies, cancellation, supersession, duplicate identity, Blocking Errors, and Workflow eligibility;
- only the owning Artifact/Application boundary creates or updates a Working Copy, creates a Version, and selects a Review Candidate under policy;
- Raw Output never bypasses Candidate validation;
- Candidate creation does not create Approval;
- Promotion does not create Approval;
- Approval remains a separate Human Gate decision on an exact immutable Version.

A successful Provider response alone is insufficient for Promotion.

## 15. Tool and Capability Gateway

Tool access is disabled by default. MVP Research, Writer, Packaging, and Visual Agents run primarily from Frozen Input to structured Candidate output.

If an Agent capability is authorized:

- The Agent Spec must explicitly allow it;
- the call passes through a typed, allowlisted, authorized, and audited Capability Gateway;
- inputs and outputs are validated;
- tool output is treated as untrusted input;
- capability use is included in budget and execution records;
- the model never receives direct database, Shell, filesystem, Workflow Command, Secret, or unrestricted Internet access.

Fetcher, Renderer, and Image Generation are independently constrained services. They are not exposed as unrestricted, arbitrary Agent tools. Their Task and Contract boundaries remain intact.

## 16. Budget and Limits

Runtime Policy can bound:

- Input and output Token Budget;
- estimated Cost Budget;
- total Model Call Attempt limit;
- Provider retry and Fallback limit;
- timeout and wall-clock limit;
- Context capacity;
- Schema Repair limit;
- Domain Regeneration limit;
- allowed capability-call limit.

Execution stops with a structured result when a hard limit is reached. Exact values remain configuration and evaluation decisions, not rules selected here.

## 17. Error Classification

Agent Runtime distinguishes at least:

- Input Error;
- Context Error or Context Capacity Exceeded;
- Parse Error;
- Schema Error;
- Domain Validation Error;
- Provider Timeout;
- Rate Limit;
- Provider Unavailable;
- Permanent Configuration Error;
- Budget Exceeded;
- Cancellation;
- Safety Refusal;
- Content Filtered;
- Capability Error;
- Security Error;
- Unknown Runtime Error.

Each category maps through Runtime Policy to a bounded outcome such as fail, retry, Fallback, Schema Repair, Domain Regeneration, return upstream, or require human action. No category receives unlimited retry.

## 18. Telemetry and Reproducibility

Agent Runtime records, with applicable privacy controls:

- Agent Spec and Prompt Template Versions;
- Runtime and Validation Profile Versions;
- selected Model Configuration and routing reason;
- Model Call Attempt identity and Provider request identity;
- token usage and normalized cost data;
- latency and timeout;
- Repair, Regeneration, Retry, and Fallback;
- Parse, Schema, and Domain Validation Results;
- Candidate identity and Promotion Result;
- cancellation and error classification;
- Correlation ID across Workflow and downstream execution.

Unknown Provider values remain unknown rather than fabricated.

Reproducibility means preserving a complete execution record and historical output. It does not promise that a repeated generative call returns identical text. ContentOS does not request, require, or store hidden chain of thought. It may retain a short public reason or structured explanation when the Agent Contract requires one.

The MVP does not use approximate semantic caching as a formal result source. Reuse is allowed only for explicit, exact, dependency-aware idempotency equivalence.

## 19. Agent Runtime Security

- Provider Secrets are resolved by Credential Reference through the authorized Secret Layer;
- Prompt injection in Source or tool output cannot grant a Capability or Workflow authority;
- Provider receives only the minimum data needed for the Agent responsibility;
- Provider Data Policy controls which classified data may be sent;
- Model output is always untrusted Candidate material;
- ordinary logs and traces exclude complete Prompt, Source, Human Opinion, Raw Output, Artifact Body, Secrets, and temporary URLs;
- Raw Output and restricted diagnostics use separate access, storage, retention, and audit policy;
- cancelled work stops new attempts and cannot promote a Late Result;
- Capability Gateway authorization is deterministic and external to the model.

## 20. Agent Runtime Invariants

- Every Agent Run binds one complete Frozen Input Snapshot.
- Agent Spec, Prompt Template, Model Configuration, Runtime Policy, and Validation Profile are independently versioned.
- Raw Provider Output is persisted before Parse.
- Parse, Schema Validation, and Domain Validation remain separate results.
- Schema Repair and Domain Regeneration are distinct and bounded.
- Historical Model Call Attempts and Raw Outputs are not overwritten by retry or Fallback.
- Candidate does not automatically become a formal Artifact or Review Candidate.
- Promotion does not automatically create Approval.
- Tool and capability access is disabled by default.
- Model output has no direct Domain or Workflow write authority.
- Provider SDKs do not enter Domain Core.
- Required Context is never silently truncated.
- Security failure or Safety Refusal is not bypassed through Provider switching.
- Approximate similarity does not authorize cached-result reuse.

## 21. Open Implementation Decisions

Accepted Decisions do not yet select:

- The first Model Provider;
- the first concrete Model Configurations;
- exact Provider Adapter interface shape;
- Context token estimator;
- Raw Output retention duration and storage threshold;
- default budget values;
- deterministic Router Policy representation;
- structured-output Fallback method;
- Runtime telemetry backend.

These decisions must preserve the boundaries above. Selecting a Provider or package does not authorize a change to Agent responsibility, security, Promotion, or Workflow semantics.

## 22. Decision Traceability

| Agent Runtime area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Specialized and single-responsibility Agents | DEC-009–DEC-011, DEC-039 | [Session-003](../sessions/session-003.md), [Session-008](../sessions/session-008.md) |
| Writer and Packaging input, output, and deterministic gates | DEC-076–DEC-097 | [Session-013](../sessions/session-013.md), [Session-014](../sessions/session-014.md) |
| Visual Agent and Image Generation boundaries | DEC-098–DEC-110 | [Session-015](../sessions/session-015.md) |
| Task, Agent Run, Frozen Input, failure, and Promotion | DEC-125–DEC-139 | [Session-017](../sessions/session-017.md) |
| Agent Specs, Prompts, models, Context, execution, validation, recovery, and security | DEC-177–DEC-198 | [Session-020](../sessions/session-020.md) |
| Stack, Schemas, Queue, telemetry, and repeatable development | DEC-221–DEC-242 | [Session-022](../sessions/session-022.md) |
| Runtime tests, Evals, configuration gates, and release quality | DEC-244–DEC-266 | [Session-023](../sessions/session-023.md) |
| Agent implementation order and MVP recovery requirements | DEC-280–DEC-285, DEC-291, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
