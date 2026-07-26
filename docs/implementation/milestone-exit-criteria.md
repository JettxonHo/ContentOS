# ContentOS Milestone Exit Criteria

**Status:** Current Truth
**Scope:** Entry conditions, completion evidence, blocking rules, and formal acceptance for M0–M8
**Last Updated:** 2026-07-27

This document defines what evidence permits a Milestone to pass to its successor. It does not prescribe a calendar, CI implementation, evidence-record Schema, or implementation plan.

Related documents: [Roadmap](roadmap.md), [Work Item Template](work-item-template.md), [Test Strategy](../quality/test-strategy.md), [Vertical Slice Acceptance](../quality/vertical-slice-acceptance.md), [Release Gates](../quality/release-gates.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Exit Criteria Purpose

Exit Criteria prevent code volume from being mistaken for capability, calendar expiry from being mistaken for completion, Happy Path-only work, documentation/implementation drift, and progression with a Blocking Defect. They make the delivery decision reviewable against product and architecture truth.

## 2. Entry versus Exit

**Entry Criteria** are dependencies and design conditions that must exist before a Milestone begins. **Exit Criteria** are the delivered capability and evidence required before it can be formally accepted. Passing Entry Criteria never proves delivery; passing Exit Criteria does not waive required prerequisites for the next stage.

## 3. Common Entry Criteria

Before a Milestone begins, all of the following apply:

- the previous dependency Milestone has passed;
- the initiating Work Item is Ready;
- relevant Accepted DEC are available;
- relevant Current-truth Specifications exist;
- the required Contract is known;
- Acceptance Criteria are testable;
- Security impact is identified;
- Migration impact is identified;
- no unresolved Blocking Design Question remains.

## 4. Common Exit Criteria

Every Milestone supplies, in proportion to its scope:

- required deliverables;
- a demonstrable capability;
- verified Acceptance Criteria;
- required tests;
- Security Review where relevant;
- synchronized documentation;
- an Evidence Record; and
- no unresolved Blocking Defect.

## 5. Evidence Types

Evidence may include Automated Test Evidence, Manual Review Evidence, Demo Evidence, Security Evidence, Migration Evidence, Eval Evidence, Recovery Drill Evidence, and Release Evaluation Evidence. A Codex statement alone is never completion evidence; it must point to reproducible commands, results, recordings, artifacts, review results, or durable records as appropriate.

## 6. Blocking Defect

A **Blocking Defect** prevents acceptance or progression. It includes at least:

- an Accepted invariant violation;
- a Critical or High security issue;
- data loss;
- owner crossover;
- Version overwrite;
- Approval bypass;
- Duplicate Promotion;
- unrecoverable Migration;
- a required test being unavailable; or
- required documentation being missing.

## 7. Warning and Known Limitation

A **Warning** may be explicitly acknowledged only when the applicable rule permits it. A **Known Limitation** records impact and planned follow-up. Neither label can rename or bypass a Blocking Defect, and neither can override a Zero-tolerance Invariant. A Warning is not automatically Blocking; the applicable validator, Gate, and policy decide it.

## 8. M0-A Exit Criteria

M0-A passes only when the documentation runway has all of the following:

- navigable DEC-001–DEC-294;
- complete Product, Domain, Technical, Workflow/Runtime/Rendering, Security, and Quality Current-truth;
- complete Roadmap, Milestone Exit Criteria, and Work Item Template;
- current, usable `AGENTS.md` and `README.md`;
- valid governance links; and
- no unresolved documentation blocker.

M0-A must also account for the M0 documentation deliverables named in the Roadmap, including `CONTRIBUTING.md` and PR / Issue templates. Until a bounded Work Item creates and validates any absent required governance artifact, M0-A remains In Review or Blocked rather than Passed.

## 9. M0-B Exit Criteria

M0-B requires:

- Node.js 24 pinned;
- pnpm Workspace and one lockfile;
- TypeScript strict;
- required application and package skeletons;
- Docker Compose with PostgreSQL, Redis, and S3-compatible Object Storage;
- executable lint, format, typecheck, and test commands;
- an example Unit Test and Integration Smoke;
- CI skeleton;
- No Secret committed; and
- no business implementation.

## 10. M0-C Exit Criteria

M0-C requires evidence that:

- clean environment setup succeeds;
- local services are healthy;
- web and API start;
- worker, fetcher, and renderer skeleton behavior is verified;
- the full M0 command suite passes;
- CI passes;
- documentation links pass;
- Secret scan passes;
- the README startup path works;
- `AGENTS.md` points to valid authority;
- the M0 Demo is complete; and
- the M0 Acceptance Record is approved.

## 11. M1 Exit Criteria

M1 requires Authentication and owner checks, Content Package creation, persistence across refresh, a Workspace shell, opaque identity, and the Artifact / Working Copy / Version foundation. It also requires a Migration test, Archive separate from Delete, an API error contract, and the M1 demo described in the Roadmap.

## 12. M2 Exit Criteria

M2 requires SSRF denial, Upload Quarantine, Raw Snapshot / Safe Display separation, an Approved Source Version, and URL failure fallback. It also requires duplicate Queue protection, Outbox recovery, Redis-loss reconciliation, Lease recovery, SSE fallback, Workflow Timeline, and proof that Research accepts Approved Source only.

## 13. M3 Exit Criteria

M3 requires Frozen Input, Evidence navigation, Unsupported Claim handling, Prompt Injection containment, and Raw Output separation. It also requires Bounded Repair, duplicate Promotion protection, Cancel and Late Result protection, Fake Provider coverage, a Research Eval baseline, and restricted diagnostics.

## 14. M4 Exit Criteria

M4 requires that AI Interpretation receives confirmation and that Confirmed Opinion traces to Raw Response. It requires first-person integrity, Research-based Mode, Citation and Direct Quote handling, Revision Proposal, autosave, Revision Conflict, an immutable Blog Version, Approved Blog Export, and Writer Eval evidence.

## 15. M5 Exit Criteria

M5 requires independent Xiaohongshu generation, 6–10 pages with the default 8-page route, Page Purpose, and Platform / Cover title separation. It requires Caption complementarity, first-person rules, density validation, outdated propagation, Approved Xiaohongshu before Visual work, and Packaging Eval evidence.

## 16. M6 Exit Criteria

M6 requires that Visual does not modify Xiaohongshu, that only Registered Components are used, and that Content Binding is valid. It requires Asset Approval, Renderer network isolation, an LLM-free Renderer, a missing Font blocking Final Render, overflow and clipping detection, an atomic carousel, immutable Render Output, safe Export, and a complete happy-path Vertical Slice.

## 17. M7 Exit Criteria

M7 requires all Zero-tolerance conditions to pass and zero unresolved Critical or High security issues or Duplicate Promotion. It provides successful Worker Crash, Redis Loss, Provider Outage, Object Storage Failure, Backup Restore, and Deletion Restore drills; Agent Holdout with no critical regression; Render Regression; resource-limit evidence; validated rollback; and a Release Evaluation Record.

## 18. M8 Exit Criteria

### Product

M8 requires an Approved Blog Export, an Approved Xiaohongshu Export, manual fallback, Human Opinion Skip, Version History, Approval, Outdated handling, and manual Publishing guidance.

### Security

M8 requires Authentication, Authorization, private-by-default behavior, SSRF protection, Prompt Injection containment, Secret isolation, log redaction, Backup, Restore, Delete Request, and a Security Audit.

### Operations

M8 requires Liveness, Readiness, Worker heartbeat, Logs, Metrics / traces, a Backup job, Restore runbook, Reconciliation, Rollback, resource limits, and Known Limitations.

## 19. Milestone Acceptance Record

Each exit review produces an immutable, reviewable Acceptance Record containing: Milestone ID; Build / Commit; Required Deliverables; Test Results; Demo Result; Security Results; Documentation Results; Known Limitations; Blocking Defects; Reviewer; Decision; and Timestamp. This is a conceptual record, not a prescribed storage Schema.

## 20. Failure of Exit Review

On failure, the Milestone remains In Progress or Blocked. It does not advance automatically. A bounded remediation Work Item is created, failure evidence is retained, historical Acceptance Records are not modified, and a new review produces a new Record.

## 21. Exception Governance

Zero-tolerance Gates allow no ordinary Exception. A Conditional Gate requires an identified Owner, documented risk, expiry or review point, and rollback condition. If an Exception changes Accepted Scope, a Security Boundary, or a Release Gate, it requires a new DEC before implementation.

## 22. Decision Traceability

The central decisions are DEC-244–DEC-266 for quality, Evals, recovery, and release evidence; DEC-267–DEC-286 for MVP scope, M0–M8, and release order; and DEC-291–DEC-293 for completion and Work Item governance. [Session-024](../sessions/session-024.md) is the primary historical milestone source; the [Canonical Decision Register](../decisions/decisions.md) is authoritative.
