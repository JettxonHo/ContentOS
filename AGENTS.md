# AGENTS.md

**Version:** 0.1  
**Status:** Active  
**Project Stage:** Product Discovery and Architecture Definition  
**Last Updated:** 2026-07-26

---

## 1. Project Overview

ContentOS is an AI-powered content operating system for individual creators.

It helps a creator transform valuable external information, such as X posts, articles, newsletters, research papers, product announcements, and technical documentation, into original multi-platform content assets.

The initial product outputs are:

- Personal blog articles
- Xiaohongshu carousel posts

ContentOS is designed as a personal web application with:

- A combined Dashboard and Chat experience
- A Chief Editor coordination layer
- A team of specialized AI agents
- A shared Content Package
- A Knowledge Layer
- A Model Router
- A component-based rendering system
- Human approval at important checkpoints

ContentOS is not a bulk AI writing tool or a fully autonomous publishing bot.

---

## 2. Current Project Stage

The project is currently in:

```text
Product Discovery
+
Architecture Definition
```

Do not begin full product implementation unless the user explicitly requests it.

The current work should prioritize:

- Product requirements
- Content Package design
- Agent responsibility definitions
- Data contracts
- Memory architecture
- RAG boundaries
- Orchestration design
- MVP scope
- Acceptance criteria

Avoid prematurely introducing:

- Complex infrastructure
- Multi-tenant SaaS architecture
- Autonomous agent loops
- Unnecessary vector databases
- Message queues
- Large framework dependencies
- Automatic public publishing

---

## 3. Sources of Truth

Before making product, architecture, or implementation decisions, read the relevant repository documentation.

### Current product truth

- `docs/product/vision.md`

### Accepted decisions

- `docs/decisions/decisions.md`

### Documentation and governance rules

- `docs/governance/documentation-rules.md`

### Historical context

- `docs/sessions/`

Session documents explain how the product evolved, but they are historical records rather than the current product specification.

Future authoritative documents may include:

- `docs/product/prd.md`
- `docs/product/mvp-scope.md`
- `docs/product/user-flow.md`
- `docs/agents/*.md`
- `docs/architecture/*.md`
- `docs/platform/*.md`

Do not assume an empty or missing future document already defines behavior.

---

## 4. Document Precedence

When documents conflict, use the following order of precedence:

1. The user’s explicit instruction in the current task
2. The latest accepted entry in `docs/decisions/decisions.md`
3. Current product, agent, and architecture specifications
4. `docs/product/vision.md`
5. Governance documentation
6. Historical session documents
7. Archived conversations or informal notes

Do not treat an older session idea as current product truth when a later accepted decision has replaced it.

When a conflict remains unresolved:

- Identify the conflict
- Do not silently choose one interpretation
- Record the assumption
- Avoid irreversible implementation decisions

---

## 5. Core Product Principles

All work must preserve the following principles.

### 5.1 AI enhances human judgment

AI assists research, organization, writing, packaging, and visual communication.

It must not replace the creator’s final judgment or invent personal experiences.

### 5.2 Source, AI analysis, and human opinion remain separate

Preserve three distinct layers:

```text
Original Source
AI Analysis
Human Opinion
```

Do not silently merge them.

### 5.3 The Content Package is the central product object

The system should not be designed only around individual articles.

Blog posts, Xiaohongshu posts, visual assets, publishing metadata, and performance data are outputs or states belonging to a Content Package.

### 5.4 Blog and Xiaohongshu are different outputs

Do not create Xiaohongshu content by simply shortening a blog article.

Each platform requires its own structure, packaging, and success criteria.

### 5.5 Quality is more important than volume

ContentOS should help turn one valuable source into one high-quality content package.

Do not optimize the product for mass production of low-quality posts.

### 5.6 Human approval is required at important checkpoints

The MVP uses semi-automated orchestration.

Human review may be required for:

- Execution plans
- Personal opinions
- Uncertain factual claims
- Final titles and packaging
- Visual direction
- Public publishing

### 5.7 Agent responsibilities remain separated

Do not create one all-purpose agent that performs research, writing, packaging, visual design, rendering, publishing, and analytics.

Each agent must have a clear boundary and structured contract.

### 5.8 Planning and execution remain separated

The Chief Editor follows a hybrid architecture:

```text
LLM Planner
+
Deterministic Executor
+
Validators
```

The LLM may propose a plan.

Deterministic application code controls execution.

### 5.9 Agent communication must be structured

Important agent inputs and outputs must use typed, validated structures.

Prefer:

- JSON Schema
- Typed application models
- Explicit status fields
- Versioned contracts

Avoid relying on uncontrolled natural-language conversations between agents.

### 5.10 Visual assets and final rendering remain separated

The visual production pipeline is:

```text
Visual Agent
→ Design Specification
→ Image Generation Service, when required
→ Render Engine
→ Final Output
```

The Render Engine does not need an image-generation model.

It receives structured content, visual assets, templates, and brand rules, then produces the final output.

### 5.11 Important text must use deterministic rendering

Do not rely on image-generation models to render important Chinese text.

Typography, layout, spacing, branding, and page text must be controlled by the rendering system.

### 5.12 Models must remain replaceable

Do not permanently bind an agent to one LLM provider unless an accepted architecture decision explicitly requires it.

Model selection should eventually be handled through a Model Router.

---

## 6. Confirmed High-Level Architecture

The current conceptual architecture is:

```text
User
  ↓
Web Application
  ↓
Chief Editor
  ├── LLM Planner
  ├── Deterministic Executor
  └── Validators
  ↓
Specialized Agents
  ├── Research Agent
  ├── Writer Agent
  ├── Packaging Agent
  ├── Visual Agent
  ├── Publisher Agent
  └── Analytics Agent
  ↓
Content Package
  ↓
Knowledge Layer
  ├── Content Memory
  ├── Brand Memory
  ├── Platform Intelligence
  └── User Preferences
  ↓
Model Router
  ↓
LLM and Image Providers
```

The rendering subsystem is conceptually separate:

```text
Structured Content
+
Design Specification
+
Optional Image Assets
+
Brand Rules
  ↓
Component-based Render Engine
  ↓
Blog Output or Xiaohongshu Images
```

This is a conceptual direction, not yet a final implementation specification.

Do not select frameworks or infrastructure solely from this diagram.

---

## 7. Confirmed Product Decisions

The following directions have already been accepted:

- ContentOS is a content operating system, not a generic AI writing tool.
- Source, AI analysis, and human opinion are separate data layers.
- Blog and Xiaohongshu are separate platform outputs.
- The MVP prioritizes an end-to-end content cycle over full automation.
- The Content Package is the central product object.
- Agent outputs should be structured.
- ContentOS uses specialized agents rather than one super-agent.
- Packaging is an independent responsibility.
- ContentOS requires human-in-the-loop checkpoints.
- The final product direction is a Web App with a multi-agent backend.
- The first version is a single-user personal AI content studio.
- Agents and model providers remain decoupled.
- Platform Intelligence is a shared system capability.
- Platform title, cover title, and page headings are separate fields.
- The Chief Editor is the coordination core.
- The Chief Editor uses an LLM Planner and deterministic execution.
- The MVP uses semi-automated orchestration.
- Visual production is driven by a Design Specification.
- Xiaohongshu rendering uses a component-based rendering system.
- Blog and Xiaohongshu belong to the Content Package Output Layer.
- Formal decisions follow a standard Decision Record format.

Read `docs/decisions/decisions.md` for the complete records and reasons.

---

## 8. Before Starting a Task

Before making changes:

1. Identify the user goal.
2. Determine whether the task is product discovery, specification, architecture, implementation, testing, or documentation.
3. Read `docs/product/vision.md`.
4. Read the relevant decisions.
5. Read governance rules.
6. Read relevant product, agent, architecture, or platform documents if they exist.
7. Check whether the requested work belongs to the MVP.
8. List assumptions that are not supported by existing documents.
9. Prefer a small end-to-end solution over a broad incomplete solution.
10. Do not begin implementation when the requested task is still a product discussion.

---

## 9. Implementation Rules

When implementation begins:

- Use typed data structures.
- Validate all external model outputs.
- Preserve source URLs, authorship, and attribution.
- Store raw source content separately from derived content.
- Store human opinions separately from model-generated analysis.
- Make workflow state visible.
- Support pause and resume at approval checkpoints.
- Make agent failures observable.
- Add clear retry and error-handling rules.
- Avoid hidden autonomous loops.
- Keep prompts versioned.
- Keep model configurations separate from business logic.
- Keep rendering deterministic.
- Write tests for schemas, validators, orchestration transitions, and render outputs.
- Do not add a framework only because it is popular.
- Do not use LLM reasoning where deterministic application logic is sufficient.

---

## 10. Documentation Rules

All meaningful product or architecture changes must be reflected in repository documentation.

### Session documents

Use:

```text
docs/sessions/session-XXX.md
```

Session documents preserve discussion context, alternatives, decisions, unresolved questions, and documentation updates.

### Decision records

Accepted decisions must be added to:

```text
docs/decisions/decisions.md
```

Every formal decision must contain:

- Title
- Decision
- Reason
- Impact

Decision identifiers are globally unique and must not be reused.

### Current specifications

Current product truth belongs in:

- `docs/product/`
- `docs/agents/`
- `docs/architecture/`
- `docs/platform/`

Do not use session documents as the only location for current behavior.

### Documentation synchronization

After changing behavior or architecture:

1. Update the relevant specification.
2. Add or amend a decision when the change is meaningful.
3. Update affected diagrams or schemas.
4. Note unresolved limitations.
5. Do not leave documentation describing behavior that no longer exists.

---

## 11. Working With Historical Sessions

Do not read every historical session by default.

Read a session when:

- The reason behind a decision is unclear
- A current specification references it
- The user asks about product evolution
- Conflicting historical ideas need to be traced
- A rejected alternative is being reconsidered

Historical sessions may contain:

- Early assumptions
- Rejected ideas
- Superseded architecture
- Exploratory examples

They must not override current accepted decisions.

---

## 12. Current Next Design Area

The next planned design area is:

```text
Content Package data model
+
Database design
+
Memory Layer
+
RAG boundaries
```

Before implementation, this area should define:

- Core entities
- Entity relationships
- Mutable and immutable data
- Versioning
- Workflow state
- Human approval state
- Short-term task context
- Long-term memory
- Retrieval requirements
- What does not require RAG
- Data ownership and traceability

Do not introduce a vector database before these requirements are defined.

---

## 13. Expected Task Completion Format

After completing a repository task, report:

- What changed
- Which files changed
- Why the change was made
- Tests or validation performed
- Assumptions
- Known limitations
- Documentation updates
- Recommended next step

Do not claim that tests passed unless they were actually run.

Do not claim that a document or implementation is complete when known sections remain unresolved.