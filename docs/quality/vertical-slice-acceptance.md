# ContentOS Vertical Slice Acceptance

**Status:** Current Truth  
**Scope:** Formal MVP end-to-end acceptance behavior and evidence  
**Last Updated:** 2026-07-27

This specification defines the complete behavior that proves the ContentOS MVP, once implemented, rather than a collection of working pages or model calls. It defines acceptance semantics and evidence, not fixtures, Schema, tooling, thresholds, or implementation code.

Related current-truth documents: [Product Definition](../product/product-definition.md), [MVP Scope](../product/mvp-scope.md), [Workflow Overview](../architecture/workflow-overview.md), [Agent Runtime](../architecture/agent-runtime.md), [Rendering](../architecture/rendering.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Acceptance Purpose

A Vertical Slice is one complete product behavior across:

```text
UI → API → Domain → Persistence → Workflow → Queue → Agent Runtime
→ Validation → Human Gate → Render → Export
```

It verifies the user-visible product and its authoritative state together. A Queue Job, page, preview, or successful model response alone is not a Vertical Slice completion signal.

## 2. Formal MVP Path

The formal acceptance path is:

```text
Create Content Package
→ Add Source
→ Capture and Normalize
→ Review and Approve Source
→ Generate and Review Research
→ Confirm or Skip Human Opinion
→ Generate Blog
→ Generate Xiaohongshu
→ Approve Content
→ Generate Design
→ Preview
→ Approve Design
→ Final Render
→ Export Blog
→ Export Xiaohongshu
```

The flow uses the fixed, versioned Workflow Template, structured commands, durable Tasks, exact dependencies, human Gates, and current eligibility policy.

## 3. Required Final Results

Formal MVP acceptance requires all of the following:

- an Approved Blog Version;
- an Approved Blog Export Package;
- an Approved Xiaohongshu Version;
- an Approved Design Version;
- a valid immutable Final Render Output;
- an Approved Xiaohongshu Export Package.

Blog-only behavior is a valid internal Milestone but does not satisfy the formal MVP.

## 4. Source Acceptance

Acceptance verifies Public URL success, Pasted Text, `.md`, and `.txt` inputs; exactly one Primary Source and **0–5 Supporting Sources**; visible Capture Failure; Manual Fallback; and an Approved Normalized Source.

URL capture preserves distinct Raw Snapshot, Extracted Content, Safe Display, and normalized-review representations. Source capture failure never fabricates success; Pasted Text or allowed upload remains a formal alternative Source path.

## 5. Research Acceptance

Research consumes Approved Sources only and provides Evidence navigation. The user can Correct, Exclude, or mark items Needs Verification, producing a new immutable Research Version for review and Approval. Unsupported Claim handling is visible and deterministic: claims without adequate support are blocked or explicitly represented as uncertain, never silently promoted as fact.

## 6. Human Opinion Acceptance

### Creator-led Mode

The flow preserves:

```text
Raw Response → AI Interpretation → User Confirmation → Confirmed Opinion
```

Only Confirmed Human Opinion makes a first-person statement eligible. The confirmation boundary, original response, and interpretation remain traceable.

### Research-based Mode

The user can Skip Human Opinion. The resulting content is visibly research-based and does not fabricate experience, belief, recommendation, team experience, or first-person opinion.

## 7. Blog Acceptance

Blog acceptance verifies Blog Plan, mutable Working Copy, autosave, visible Revision Conflict, AI Revision Proposal, selective apply, Citation, Direct Quote, Provenance, immutable Version, Approval, and Export Package.

The Blog uses the exact Approved Content Foundation or valid Research-based Mode. Markdown remains the sole canonical Blog body in the MVP; an AI Proposal cannot silently overwrite the Working Copy or create Approval.

## 8. Xiaohongshu Acceptance

Xiaohongshu acceptance verifies a Packaging Plan; a 6–10 page carousel with the **Default 8-page** path; Page Purpose; Platform Title; Cover Title; Caption; CTA; Hashtags; page edit and reorder; immutable Version; and Approval.

Platform Title, Cover Title, Page Heading, and Caption remain independently reviewable fields. The Xiaohongshu branch does not derive its canonical editable content by shortening Blog.

## 9. Design and Asset Acceptance

Design begins from Approved Xiaohongshu only. Acceptance verifies a versioned Component Registry and Brand Theme, Content Binding, Asset Request, Asset Review, Asset Reject/Replace, Design Version, Design Approval, and Fit Issue handling.

The Visual Agent cannot modify canonical Xiaohongshu text. Ineligible content density or bindings return a Fit Issue or Packaging Revision Request rather than silent clipping, rewriting, or layout invention.

## 10. Render Acceptance

Render acceptance verifies Preview and Final separation; Approved dependency eligibility; approved Font; no public-network request; overflow/clipping detection; atomic carousel behavior; retry behavior; immutable Render Output; and Environment Fingerprint.

A Preview is not Final evidence or Export eligibility. Final Render uses one exact Approved Xiaohongshu Version, Approved Design Version, required Approved Assets, eligible registry/theme/font/profile, and a controlled Renderer environment. One invalid page makes the complete Final carousel unavailable.

## 11. Export Acceptance

The Blog Export Package contains:

```text
article.md
manifest.json
assets/
```

The Xiaohongshu Export Package contains:

```text
images/
post.md
references.md
manifest.json
```

Each Export verifies file hashes and exact dependency identity. It contains no Prompt, Raw Output, Secret, temporary URL, or internal diagnostic payload. Exported is not Published; the MVP provides manual download and external manual publication only.

## 12. Failure-path Acceptance

Acceptance includes URL Capture Failure and Pasted Text fallback; Malformed Model Output; Provider Timeout; Research Correction; Human Opinion Skip; Revision Conflict; duplicate Workflow Command; Duplicate Queue Job; Worker Crash; Redis Job Loss; Agent Late Result; Upstream Version Change; Outdated propagation; Asset Failure; Render Retry; Page Refresh; SSE Disconnect; Pause/Resume; and Cancel.

Every failure path is judged by the final domain and workflow state: no duplicate version or promotion, no cancelled Late Result promotion, no false approval, no skipped human Gate, and clear recovery or human next action.

## 13. Security Acceptance

The Vertical Slice includes Authentication, Owner Authorization, Prompt Injection containment, SSRF denial, Upload Quarantine, Secret redaction, Renderer network isolation, Export allowlist behavior, Delete Request, and Restore applying the Deletion Ledger before active data is made available.

A Security Error is a blocking outcome. It cannot be turned into ordinary Retry, Fallback, Warning acknowledgement, or manual bypass.

## 14. UX Acceptance

The Workspace makes the Current Stage and Current Action clear; distinguishes Warning from Blocking Error and Working from Review from Approved; visibly identifies AI Proposals; explains Outdated state; shows failure and Retry status; preserves authoritative state through refresh; and distinguishes Export from Published.

Chat may explain or propose an action, but the structured Workspace and authoritative queries remain the source of product state.

## 15. Accessibility Acceptance

High-level acceptance includes Keyboard navigation, visible focus, form labels, error association, status not communicated by color only, heading hierarchy, alternative text, and accessible progress. The formal accessibility standard, test tooling, and supported browser versions remain Open Implementation Decisions.

## 16. Recovery Acceptance

Recovery acceptance verifies Worker Crash recovery, Redis Loss reconciliation, Provider Outage behavior, Object Storage Failure behavior, Database Restore, Deletion Restore, absence of duplicate Promotion, and the correct final Domain State.

PostgreSQL-backed Domain state remains authoritative; process memory, Queue state, SSE delivery, browser state, and temporary render files do not decide correctness.

## 17. Acceptance Evidence

Every formal Vertical Slice execution retains:

- Release or Build identity;
- test environment;
- input fixture;
- Artifact IDs and Versions;
- Workflow Events;
- Task Results;
- Validation Results;
- Render Fingerprint;
- Export Manifest;
- Failure-path Results;
- Human Reviewer;
- known limitations.

This requirement does not define a persistence Schema or evidence-record format.

## 18. Milestone Application

| Milestone | Acceptance focus |
|---|---|
| M0 | Development environment and quality entry points only |
| M1 | Content Package Thin Slice |
| M2 | Source plus Workflow foundation |
| M3 | Research |
| M4 | Human Opinion plus Blog |
| M5 | Xiaohongshu Content |
| M6 | Complete functional Happy Path including Design, Render, and Export |
| M7 | Failure, Security, Recovery, and Release hardening |
| M8 | Formal Private MVP Release Acceptance |

M6 Happy Path does not satisfy M7 Hardening, and no internal milestone represents formal MVP completion by itself.

## 19. Formal Completion Rule

MVP completion is not page completion, a model that can generate content, an occasional Happy Path, Blog-only behavior, Preview Render, or a downloadable file. It requires a complete, auditable, traceable, and recoverable dual-output loop that reaches both approved Export Packages from formal Sources.

## 20. Open Implementation Decisions

The following remain open: Acceptance Fixture content; Acceptance execution tool; supported browser versions; formal accessibility baseline; performance threshold; cost threshold; human-review sample size; and Acceptance Evidence Record format.

## 21. Decision Traceability

| Area | Accepted Decisions | Primary Sessions |
|---|---|---|
| Source, Research, Human Opinion, Blog, and Xiaohongshu acceptance | DEC-051–DEC-110, DEC-125–DEC-139 | [Session-010](../sessions/session-010.md)–[Session-017](../sessions/session-017.md) |
| Design, Final Render, and Export | DEC-111–DEC-124 | [Session-016](../sessions/session-016.md) |
| Runtime, security, recovery, and topology | DEC-177–DEC-243 | [Session-020](../sessions/session-020.md)–[Session-022](../sessions/session-022.md) |
| Quality and full Vertical Slice | DEC-244–DEC-266 | [Session-023](../sessions/session-023.md) |
| Formal MVP, milestones, release boundary, and completion | DEC-267–DEC-285, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of Decisions remains in the [Canonical Decision Register Index](../decisions/decisions.md).
