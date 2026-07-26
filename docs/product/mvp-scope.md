# ContentOS MVP Scope

**Status:** Current Truth

**Scope:** Formal MVP product boundary

**Last Updated:** 2026-07-27

This document defines what the formal ContentOS MVP includes, excludes, and must prove. It describes product behavior and release boundaries, not database tables, queue design, frameworks, or deployment implementation.

---

## 1. MVP Definition

ContentOS MVP is a **single-user, desktop-first Personal AI Content Studio** that transforms Sources through a reviewable, traceable, and recoverable workflow into:

```text
Approved Blog Export
+
Approved Xiaohongshu Export
```

The MVP validates a complete dual-output content-production loop. It is not complete merely because pages exist, an Agent returns text, or one happy-path demonstration succeeds.

## 2. MVP User

The MVP serves one individual content creator or one product or operations professional who creates content. The user is expected to review, correct, edit, and approve AI-assisted work.

Multi-user collaboration and organization administration are outside the MVP.

## 3. MVP Product Form

The MVP is a **Private Web Application** with a desktop-first structured Workspace. Codex may be used to implement the product, but Codex is not the product runtime or user interface.

Mobile support is limited to viewing and lightweight review actions. Full Research, Blog, Xiaohongshu, Design, Diff, and provenance editing remain desktop-first.

## 4. Supported Inputs

The formal MVP supports:

- Public HTTP/HTTPS URL;
- Pasted Text;
- `.md` file;
- `.txt` file.

Pasted and uploaded content enters the formal Source model; it is not used only as temporary Prompt context. A failed URL capture must remain a visible failure and may fall back to Pasted Text rather than creating a false successful Source.

## 5. Source Limits

Each Content Package contains:

```text
1 Primary Source
+
0–5 Supporting Sources
```

The MVP does not promise successful extraction from authenticated pages or every JavaScript-dependent website. Source capture must preserve the original or raw representation, produce a normalized version for review, retain origin and capture metadata, and keep derived AI content separate.

Exact parser behavior and resource limits beyond Accepted security and input boundaries are **Open Implementation Decisions** for the relevant Source and Security specifications.

## 6. Research Scope

MVP Research includes at least:

- Summary;
- Important Facts and Claims;
- Source Evidence and locators;
- Tensions and Open Questions;
- Items needing verification;
- Primary and Supporting Source usage;
- Provenance references.

The user can Accept, Correct, Exclude, or mark an item as Needs Verification. Research review uses a Mutable Working Copy and produces a new immutable Version when corrected. Approval binds an exact Research Version; AI does not edit an Approved Research Version in place.

Only reviewed Research may support downstream output. Uncertainty can be represented honestly but cannot be promoted to a confirmed fact without support.

## 7. Human Opinion Scope

The MVP supports focused Question Cards, a limited contextual conversation, and explicit user confirmation:

```text
Raw User Response
→ AI Interpretation
→ User Confirmation
→ Confirmed Opinion Statement
```

The user may correct, reject, skip, or stop opinion collection. Creator-led Mode requires relevant Confirmed Human Opinion. Research-based Mode is a valid path when Human Opinion is skipped or unavailable.

AI Interpretation is not user opinion and cannot independently authorize first-person content. Research-based outputs must not fabricate personal beliefs, experiences, team experience, or creator-specific judgment.

## 8. Blog Scope

The Blog branch uses Approved Research plus a Confirmed Human Opinion Version or Research-based Mode. It includes:

- Blog planning and Draft generation;
- Title, Summary, Markdown Body, References, public Citations, internal Provenance, dependencies, Content Mode, and Schema Version;
- Markdown editing and preview;
- Autosaved Working Copy;
- Optimistic Concurrency and visible Revision Conflict;
- AI Revision Proposal, Diff, and Selective Apply;
- Immutable Version history, validation, and Approval;
- Citation and Provenance review;
- Manual Export.

Markdown is the sole canonical Blog body format in the MVP. Outline, table of contents, and similar structures may be derived but do not form another editable body truth.

The MVP does not include a public Blog site, automatic deployment, automatic publication, or a PersonalBlog API requirement.

## 9. Xiaohongshu Scope

The Xiaohongshu branch independently consumes the Approved Content Foundation rather than using Blog as its default source. It includes:

- A Packaging Plan followed by a platform-native Artifact;
- Platform Title Candidates and Selected Platform Title;
- Cover Title and optional Cover Subtitle;
- A 6–10 page carousel, with 8 pages as the default recommendation;
- Stable page identity, Page Purpose, structured page content, emphasis, density, visual brief, and provenance;
- Caption, CTA, Hashtag suggestions, and public References;
- Structured editing, page ordering, Revision Proposals, validation, Version history, and Approval.

Platform Title, Cover Title, Cover Subtitle, and Page Heading remain separate fields. Caption is an independent content unit and must not simply repeat all carousel pages.

The branch has its own Working Copy, immutable Versions, Artifact Head, Approval, dependencies, and outdated state. Visual work begins only from an Approved Xiaohongshu Version.

## 10. Design and Render Scope

MVP visual production uses:

```text
Approved Xiaohongshu Version
→ Structured Design Specification
→ Versioned registered Components, Brand Theme, and Approved Assets
→ Preview
→ Design Approval
→ Deterministic Final Render
```

The user can preview pages, choose among compatible registered Components, adjust allowed visual parameters, review Assets, request a new Design, and approve an exact Design Version.

The Design layer must not become a second editable source for Xiaohongshu text. Content changes return to the Xiaohongshu Editor and may make existing Design and Render outputs outdated.

Generated images may support communication but cannot carry critical Chinese text, exact numbers, precise diagrams, required attribution, or other information that must remain deterministic. Generated Assets require review, provenance, and Approval.

Final Render produces complete PNG carousel output, validates the full page set, and fails atomically when any required page is invalid. Detailed renderer technology and process topology belong to future architecture specifications, not this product scope.

## 11. Export Scope

The formal MVP requires both approved Export Packages.

### Blog Export

```text
article.md
manifest.json
assets/
```

The package carries portable Markdown, Artifact and Version identity, dependency information, file integrity data, Export time, and package Contract Version. Asset references are portable rather than dependent on temporary storage URLs.

### Xiaohongshu Export

```text
images/
post.md
references.md
manifest.json
```

- `images/` contains the complete approved carousel;
- `post.md` contains the selected Platform Title, Caption, CTA, and Hashtags;
- `references.md` contains public references;
- `manifest.json` records relevant Versions, dependencies, file hashes, and Export information.

Export is manual. ContentOS does not authenticate with or publish to PersonalBlog or Xiaohongshu in the MVP.

```text
Exported ≠ Published
```

## 12. Workspace Scope

The current first-level pages are:

1. Dashboard;
2. New Content Package;
3. Content Package Workspace;
4. Settings.

Dashboard, New Content Package, and Content Package Workspace are the three core work Surfaces established for the vertical slice. Settings is a fourth first-level page added and confirmed by later Accepted Decisions. This preserves the earlier “three core Surfaces” meaning without omitting the current first-level Settings page.

The Content Package Workspace is the core interface and includes:

- Package Header and Stage Navigation;
- Current Action and parallel branch state;
- Dedicated Source, Research, Human Opinion, Blog, Xiaohongshu, Design, and Render / Export editors;
- Validation Summary, Version history, Workflow timeline, and Advanced Details;
- A contextual Chief Editor Panel.

Structured editors are canonical. Chat may explain state and create Revision or Workflow Command Proposals, but it cannot silently change an Artifact or create Approval.

## 13. Workflow Scope

The MVP uses one fixed, versioned Workflow Template and deterministic execution. It supports:

- Workflow Instance and node state;
- Current Action and legal Commands;
- Task and Agent Run state;
- Human Gates;
- Pause, Resume, Cancel, Retry, and policy-limited Skip;
- Warning and Blocking Error semantics;
- Workflow Timeline;
- Parallel Blog and Xiaohongshu branches;
- Idempotent Commands and duplicate-work protection;
- Late-result protection;
- Failure recovery without treating Chat history as state.

LLM assistance may plan bounded content work, explain state, and propose actions. It does not run an unrestricted autonomous loop, approve work, modify workflow policy, or call arbitrary tools.

## 14. Versioning and Approval Scope

The following are required MVP product capabilities:

- Mutable Working Copy;
- Immutable Version;
- Artifact Head;
- Approval;
- Dependency;
- Provenance;
- Revision Proposal;
- Outdated State;
- Optimistic Concurrency;
- Human Review Gates;
- Manual Export.

An Artifact Head distinguishes at least the Working Copy, Latest Version, Review Candidate, and Approved Version. A single current pointer must not collapse these meanings.

Approval binds an exact immutable Version and records the user Actor and Validation Summary. Approval does not mutate the Version and cannot proceed while a Blocking Error exists.

Downstream Artifacts reference exact upstream Versions. When a newer upstream Version is approved, historical downstream work remains accessible but affected current candidates become outdated and require explicit review or regeneration. An outdated Artifact cannot silently become a new Final Export candidate.

Provenance must connect Research to Source Evidence, Human Opinion to the original response, content claims to Research or confirmed opinion, Design to Xiaohongshu content, and Render output to approved Design and Assets.

## 15. Security Baseline

The formal MVP is private by default and requires a product-level security baseline covering:

- Authentication, secure session handling, and owner authorization;
- Service identities and Secret References;
- Provider data boundaries and Prompt Injection containment;
- Safe URL handling and SSRF protection;
- Upload quarantine, validation, and controlled access;
- Markdown sanitization;
- Private Asset storage and temporary scoped access;
- Export allowlisting and log redaction;
- Security audit records;
- Archive, deletion request, backup, restore verification, and deletion tracking.

Security controls are introduced with the feature that creates the risk and are hardened before release. Exact mechanisms and acceptance criteria belong to the future Security Current-truth specifications. They are not defined here as new implementation choices.

## 16. Quality Baseline

The MVP quality baseline covers:

- Static and contract validation;
- Domain, Validator, repository, migration, and API integration tests;
- Workflow scenario and recovery tests;
- Controlled fake-provider behavior and Agent evaluation sets;
- Render regression fixtures and full-carousel validation;
- A complete vertical-slice fixture;
- Security and recovery gates;
- A recorded release evaluation.

Quality is assessed at the complete workflow boundary, not only at individual pages or model calls. Exact tools, test framework, dataset contents, and numeric thresholds are **Open Implementation Decisions** for the Quality specifications, unless already constrained by an Accepted Decision.

## 17. Explicit Out-of-scope

The formal MVP excludes:

### Product and organization

- Multi-user Collaboration;
- Organization / Team features;
- Public Registration;
- Public Share;
- Automatic Publishing;
- Publishing Schedule;
- Analytics Dashboard;
- Workflow Builder;
- Agent Marketplace;
- Plugin Platform;
- Template Marketplace;
- Free-form Design Canvas.

### Inputs and integrations

- PDF;
- Office files;
- OCR;
- Audio;
- Video;
- Email Import;
- Cloud-drive Integration;
- Authenticated browser automation.

### Agent autonomy

- Autonomous Web Search;
- Unrestricted Tool Calling;
- Agent-created sub-agents;
- Self-modifying Agent Specs, Prompts, or Workflow;
- Automatic Approval.

Detailed infrastructure exclusions and topology boundaries will be maintained by the future Technical Architecture specification. This product document does not select or expand infrastructure.

## 18. Internal Milestone versus Formal MVP

A Blog-only vertical slice is an **internal Milestone**, not the formal ContentOS MVP.

The formal MVP requires:

```text
Approved Blog Export
+
Approved Xiaohongshu Export
```

Both outputs use the same Approved Content Foundation but are independently generated, edited, versioned, validated, and approved. An internal milestone may prove one branch earlier, but it must not be presented as completion of the product's formal MVP promise.

## 19. MVP Completion Definition

The MVP is complete when one user can start with supported Sources and finish a complete, reviewable, traceable, and recoverable dual-output workflow that produces both required Approved Export Packages.

Completion requires correct state through at least:

- Page refresh and application resume;
- Duplicate Commands and duplicate work delivery;
- Provider or task failure;
- Worker interruption;
- Dispatch-layer loss and recovery;
- Upstream Version change;
- Cancellation, retry, and late result handling.

Completion is not equivalent to:

- Completing the UI pages;
- Receiving model-generated text;
- Producing drafts without Approval;
- Exporting only one branch;
- Demonstrating one unrecoverable happy path.

## 20. Initial Success Signals

MVP validation focuses on:

- **Task Completion:** both Approved Exports are reached;
- **Content Trust:** Source, evidence, opinion, Version, dependency, and Export lineage are understandable;
- **Editing Value:** the system reduces research, rewriting, restructuring, packaging, and layout effort;
- **Reuse Value:** one Content Foundation yields two useful platform-native expressions;
- **Reliability:** failure, retry, history, outdated state, and recovery behavior remain correct.

Candidate observations include Package completion, time to dual Export, corrections, Human Opinion skip rate, edit distance, revision count, first-attempt success, schema repair, render failure, recovery outcomes, and repeat Package creation.

Numeric targets are **Not defined by current Accepted Decisions**.

## 21. Scope-change Governance

After Session-024:

- A bug is a failure to implement already accepted behavior and normally does not require a new DEC.
- An implementation detail may change through a bounded Work Item only when it does not alter product scope, domain semantics, workflow, security boundary, Agent responsibility, technical architecture, or release gate.
- A change to MVP scope, domain model, workflow, Version semantics, security, Agent responsibility, approved technology direction, deployment model, or release gate requires a new Decision Record before implementation.

Open Questions and Open Implementation Decisions must not be silently promoted into product requirements. New inputs, outputs, public access, publishing, collaboration, or generic platform capabilities require explicit scope review.

## 22. Decision Traceability

| MVP scope area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Product form, user, inputs, and formal outputs | DEC-267–DEC-270 | [Session-024](../sessions/session-024.md) |
| Human Review, Versioning, dependencies, and provenance | DEC-032, DEC-067–DEC-075, DEC-150–DEC-155, DEC-271–DEC-272 | [Session-012](../sessions/session-012.md), [Session-018](../sessions/session-018.md), [Session-024](../sessions/session-024.md) |
| Blog Artifact and Export boundary | DEC-043–DEC-050 | [Session-009](../sessions/session-009.md) |
| Xiaohongshu content boundary | DEC-086–DEC-097 | [Session-014](../sessions/session-014.md) |
| Workspace and product Surfaces | DEC-040, DEC-140–DEC-159, DEC-273 | [Session-008](../sessions/session-008.md), [Session-018](../sessions/session-018.md), [Session-024](../sessions/session-024.md) |
| MVP exclusions and implementation boundary | DEC-036–DEC-042, DEC-274–DEC-275 | [Session-008](../sessions/session-008.md), [Session-024](../sessions/session-024.md) |
| Completion and initial success | DEC-293–DEC-294 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of all Decisions is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
