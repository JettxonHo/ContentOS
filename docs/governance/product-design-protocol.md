# Product Design and Decision Protocol

**Version:** 1.0  
**Status:** Active

---

## 1. Purpose

This protocol defines how humans and AI collaborate to explore, decide, document, and implement product and architecture decisions.

The process separates:

- Exploration
- Proposals
- Decisions
- Current specifications
- Implementation

A discussion is not automatically a decision.

A decision is not automatically a current specification.

A current specification is not automatically an implementation.

---

## 2. Documentation Layers

### Sessions

Sessions preserve chronological discussion history.

They include:

- Context
- Questions
- Assumptions
- Alternatives
- Trade-offs
- Confirmed decisions
- Rejected approaches
- Open questions

Sessions are historical records and must not be treated as the only source of current product truth.

### RFCs

RFCs describe significant proposals before implementation.

An RFC should be created when a proposal:

- Affects multiple modules
- Is difficult to reverse
- Introduces a public contract
- Changes core data models
- Changes MVP scope
- Defines Agent boundaries
- Introduces external integration
- Has multiple reasonable alternatives

RFC statuses:

```text
Draft
In Discussion
Accepted
Rejected
Superseded
Implemented
```

### Decision Records

Decision Records preserve accepted conclusions and their rationale.

Every Decision Record contains:

```text
Identifier
Type
Status
Title
Decision
Reason
Impact
Related Session
Related RFC
Supersedes or Amends
```

Decision types may include:

```text
Product
Architecture
UX
Data
Agent
Integration
Security
Governance
```

### Current Specifications

Current specifications describe active product and system behavior.

Examples:

```text
Product Vision
PRD
MVP Scope
User Flows
Agent Specifications
Architecture Specifications
Data Contracts
API Contracts
```

When a Decision changes current behavior, the corresponding specification must be updated.

### Implementation

Implementation includes:

- Tasks
- Issues
- Code
- Tests
- Migrations
- Deployment

Implementation must follow accepted Decisions and current Specifications.

---

## 3. Standard Session Workflow

### Step 1: Initialize

Every Session begins with:

```text
Topic
Context
Goal
Non-goals
Existing constraints
Questions to resolve
```

### Step 2: Explore

During exploration, distinguish:

```text
Fact
Assumption
Observation
Proposal
Alternative
Risk
Open Question
```

Do not present a proposal as an accepted decision.

### Step 3: Draft RFC When Required

Create an RFC for significant or cross-cutting proposals.

The RFC should include:

```text
Summary
Context
Problem
Goals
Non-goals
Proposed solution
Alternatives
Trade-offs
Risks
Migration
Open questions
```

### Step 4: Decision Gate

At the end of discussion, present Proposed Decisions.

The user may:

```text
Accept
Reject
Revise
Defer
```

Only explicitly accepted decisions enter the Decision Log.

### Step 5: Record Decisions

Create or update Decision Records.

Do not silently delete older Decisions.

Use:

```text
Amended
Superseded
Deprecated
```

when later decisions change earlier decisions.

### Step 6: Formalize Session

The formal Session document includes:

```text
Context
Discussion conclusions
Accepted decisions
Rejected approaches
Open questions
Documentation updates
Sync checklist
```

### Step 7: Synchronize Current Truth

Update affected:

```text
Product documents
Agent specifications
Architecture documents
Schemas
API contracts
AGENTS.md
```

### Step 8: Implement

Implementation begins only after required Decisions and Specifications are sufficiently stable.

### Step 9: Review

After implementation:

- Validate acceptance criteria
- Compare implementation with Decisions
- Update documentation
- Record new constraints
- Create follow-up RFCs when necessary

---

## 4. Document Precedence

When documents conflict, use this order:

1. Current explicit user instruction
2. Latest accepted Decision Record
3. Current product, Agent, architecture, and contract specifications
4. Accepted RFC
5. Product Vision
6. Governance documentation
7. Historical Sessions
8. Informal notes

A historical Session must not override a later accepted Decision.

---

## 5. Required Session Output

Before formalization, the Session should produce:

```text
Discussion Summary
Proposed Decisions
Open Questions
Deferred Topics
```

After confirmation, it should produce:

```text
Formal Session Document
Decision Records
Documentation Sync Checklist
```

---

## 6. AI Collaboration Rules

The AI must:

- Ask what is being decided
- Distinguish proposals from accepted decisions
- Present alternatives when meaningful
- Explain trade-offs
- Identify assumptions
- Avoid premature implementation
- Avoid silently expanding MVP scope
- Preserve historical decisions
- Produce documentation only after confirmation
- State unresolved questions explicitly

The AI must not:

- Treat its own recommendation as user approval
- Rewrite historical Sessions to match later conclusions
- Delete superseded Decisions without traceability
- Select technology providers without evidence or approval
- Start implementation while the problem remains undefined

---

## 7. Reusable Session Prompt

Use the following instruction when starting a new project-design Session:

```text
Use the Product Design and Decision Protocol.

For this Session:

1. Begin by identifying the Topic, Context, Goal, Non-goals,
   existing constraints, and questions to resolve.

2. During discussion, clearly distinguish facts, assumptions,
   proposals, alternatives, risks, and open questions.

3. Do not treat your recommendations as accepted decisions.

4. Compare meaningful alternatives and explain trade-offs.

5. Separate MVP requirements from post-MVP and long-term ideas.

6. At the end of the discussion, output Proposed Decisions
   using Title, Decision, Reason, and Impact.

7. Wait for explicit confirmation before assigning final
   Decision status.

8. After confirmation, generate a formal Session document,
   Decision Records, unresolved questions, and a documentation
   synchronization checklist.

9. Preserve historical context and do not silently rewrite
   earlier decisions.

10. Do not begin implementation unless explicitly requested.
```