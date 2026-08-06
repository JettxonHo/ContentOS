# ContentOS Work Packet Template

**Status:** Template

**Purpose:** Planning-to-implementation handoff for one Ready Work Item

Use this template after the Work Item is Ready. It does not replace the [Work Item Template](../work-item-template.md); it operationalizes that approved scope for one Implementation Agent.

```markdown
# WORK PACKET

## Identification

- Work Item:
- Issue:
- Branch:
- Base Commit:
- Executor Profile:
- Target Execution Configuration: # Optional; profile remains the durable governance label.
- Logical Role:
- Actual Model: # Record only when observable; otherwise `UNVERIFIED_RUNTIME_MODEL`.
- Reasoning:
- Thread:
- Runtime Model Status: VERIFIED | UNVERIFIED_RUNTIME_MODEL

## Goal

## Canonical Sources

- Later Accepted DEC:
- Current-truth Specifications:
- Repository Guidance:
- Issue / Work Item:

## Current Truth

State the relevant accepted rules, existing implementation facts, and any later DEC that governs a conflict. Do not copy entire specifications.

## Allowed Files

-

## Forbidden Files

-

## Implementation Requirements

1.

## Acceptance Criteria

1.

## Required Tests

-

## Required Verification

-

## Failure-path Verification

-

## Security Requirements

-

## Non-goals

-

## Destructive Operations

Not authorized unless each permitted operation, exact target, precondition, recovery expectation, and Human authorization are listed here.

## Git Permissions

- Commit: No
- Push: No
- Draft Pull Request: No
- Mark Pull Request Ready: No
- Merge: No

An ordinary, reversible, in-scope Work Packet may explicitly change Commit,
Push, and Draft Pull Request to `Yes`. This never grants self-approval,
ready-for-review, or merge authority. The Orchestrator applies the independent
review, CI, and escalation gate from the
[Agent Collaboration Workflow](../agent-collaboration-workflow.md).

## Escalation Conditions

Stop and return `HUMAN_DECISION_REQUIRED` if:

- a higher authority conflicts with this packet;
- a required change is outside Allowed Files or changes a prohibited boundary;
- a new DEC, architecture, security, scope, workflow, or release-gate decision is required;
- a destructive operation is required but not authorized above;
- required verification cannot be completed truthfully; or
- an Acceptance Criterion is ambiguous or mutually inconsistent.

## Completion Report Format

Return the completed [Implementation Completion Report](implementation-report-template.md), with command results, criterion-by-criterion evidence, failure-path evidence, scope checks, limitations, incomplete items, final Git status, and the recommended review result.
```
