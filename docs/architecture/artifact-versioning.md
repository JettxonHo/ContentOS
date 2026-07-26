# ContentOS Artifact Versioning

**Status:** Current Truth

**Scope:** Artifact editing, immutable history, Approval, dependencies, recovery, and eligibility

**Last Updated:** 2026-07-27

This document defines the current Artifact version-governance model. It specifies semantics and invariants, not identifier algorithms, persistence layouts, concurrency mechanisms, APIs, or Schema implementations.

---

## 1. Versioning Goals

The versioning model must support:

- Continuous human editing without creating history for every keystroke;
- AI Revision Proposals without silent overwrite;
- Durable immutable history;
- Version-specific Approval;
- Exact upstream dependencies and Provenance;
- Restore without rewriting history;
- Explicit stale and outdated handling;
- Formal Export eligibility;
- Optimistic Concurrency and visible Revision Conflict;
- Reproducible Agent and Render inputs;
- Recovery after retries, cancellation, late results, and upstream changes.

## 2. Stable Identity Layers

ContentOS distinguishes identities by business meaning.

| Identity | Meaning |
|---|---|
| Entity ID | Stable identity of any long-lived domain entity, such as a Content Package, Source Reference, Workflow Instance, or Asset. |
| Artifact ID | Specialized stable Entity ID for one versioned content family, such as one Blog, Research Result, Xiaohongshu output, or Design Specification. |
| Working Copy ID | Identity of a mutable editing object associated with one Artifact. |
| Version ID | Identity of one exact immutable checkpoint within an Artifact family. |
| Execution ID | Identity of operational work, such as a Command, Task, Agent Run, Model Call Attempt, or Render Job. It is not content identity. |
| Record ID | Identity of an append-only decision, relationship, validation, or event, such as an Approval, Dependency, Provenance usage, or Workflow Event. |

Display values such as “Version 3,” “Page 5,” or “Attempt 2” are not global identities. The exact opaque-ID algorithm and storage type are not defined in this document.

## 3. Artifact versus Version

```text
Stable Artifact
├── Mutable Working Copy
├── Immutable Versions
└── Artifact Head
```

- **Artifact** identifies the long-lived logical content asset.
- **Version** records one immutable checkpoint of that Artifact.
- **Working Copy** holds current editable state and may change many times before a Version is created.
- **Artifact Head** records which Working Copy and Versions are relevant to current operations.

A Version cannot be edited directly. Creating a new Version does not modify, delete, renumber, or transfer the meaning of any historical Version.

## 4. Working Copy

A Working Copy semantically contains:

| Element | Meaning |
|---|---|
| Working Copy ID | Stable identity of the current mutable editing object. |
| Artifact ID | Artifact family being edited. |
| Revision | Monotonically increasing editable-state revision used for concurrency and Proposal targeting. |
| Base Version | Immutable Version from which editing began, when one exists. |
| Mutable Body | Current type-specific content under active editing. |
| Autosave state | Whether the latest edit has been durably preserved as Working Copy state. |
| Draft Validation | Validation result for in-progress content; it does not grant formal eligibility. |

Autosave changes only the Working Copy and increments its Revision. It does not create an immutable Version or Approval.

Edits and Proposal application carry the expected Working Copy Revision. If the actual Revision differs, the operation reports a Revision Conflict and must not overwrite the newer state. Conflict resolution is deterministic application behavior, not an LLM judgment.

A Working Copy is not formal history, cannot be approved directly, and cannot be an exact dependency of a formal downstream Version.

## 5. Immutable Version

Every immutable Artifact Version has the following semantics without prescribing storage fields:

| Element | Meaning |
|---|---|
| Version ID | Stable identity of the exact checkpoint. |
| Version Number | User-facing sequence unique within one Artifact. It is not a global reference. |
| Parent Version | Prior Version from which this checkpoint logically developed, when applicable. |
| Body | Frozen type-specific content. |
| Schema Version | Contract version required to interpret and validate the Body. |
| Content Hash | Integrity identity for the frozen content and applicable immutable context. |
| Created By | Domain Actor responsible for creating the checkpoint. |
| Created At | Creation time retained as immutable history. |
| Dependency Snapshot | Exact immutable upstream Versions and roles used by this Version. |

Body, Schema Version, Parent relationship, Content Hash, dependency set, creator, and creation time do not change after Version creation. Any content or dependency change creates another Version.

## 6. Artifact Head

Artifact Head separates four meanings:

```text
Working
Latest Version
Review Candidate
Approved Version
```

| Head meaning | Purpose |
|---|---|
| Working | Identifies the current mutable Working Copy. |
| Latest Version | Identifies the most recently created immutable Version. |
| Review Candidate | Identifies the Version currently presented at a Human Gate. |
| Approved Version | Identifies the approved Version currently authorized for downstream consumption. |

These pointers may refer to different objects or Versions. One ambiguous `current_version_id` cannot represent them all.

Changing a Head pointer changes current operational selection; it does not mutate the referenced Version or erase earlier Head history recorded through Events and Records.

## 7. Version Creation

The conceptual flow from a Working Copy is:

```text
Validate expected Working Copy Revision
→ Validate type-specific Body
→ Freeze exact dependencies and Provenance
→ Create immutable Version
→ Update Latest Version Head
→ Set Review Candidate when policy requires
→ Preserve or reset Working Copy according to Artifact policy
```

Version creation is an explicit checkpoint. Normal typing and autosave do not create Versions. The implementation of atomicity, serialization, persistence, and Head updates is deferred to technical specifications.

## 8. Approval

Approval is an independent append-only Record, not a mutable Boolean on an Artifact or Version.

An Approval:

- Binds one exact immutable Version;
- Records the deciding Actor;
- Records the reviewed Validation Summary;
- Records required Warning Acknowledgements or their references;
- Is created only through an authorized, eligible Human Gate or Command;
- Does not modify the target Version;
- Remains historically true even when a newer Version becomes current.

Eligible Warnings may require explicit acknowledgement. Acknowledgement records that the risk was reviewed; it does not remove the Warning. A Blocking Error prevents Approval and cannot be bypassed with a normal acknowledgement.

A new Version never inherits an older Version's Approval. It requires its own validation and Approval.

## 9. Revision Proposal

An AI Revision Proposal is advice, not a direct edit.

It binds:

- A target Artifact and Working Copy;
- The exact target Working Copy Revision;
- A meaningful content scope;
- Before and proposed content or an equivalent Diff;
- Reason, validation, and originating Agent Run;
- Proposal lifecycle state.

The user may apply all, selectively apply, reject, or request another Proposal. Applying accepted changes creates a new Working Copy Revision; it does not silently create Approval.

If the target Revision or affected content has changed, the Proposal becomes stale or outdated and cannot apply automatically. AI never silently overwrites user edits.

## 10. Dependency Snapshot

Each downstream Version freezes a queryable Dependency Snapshot containing:

- Upstream Artifact identity;
- Exact upstream Version identity;
- Dependency Role;
- Applicable Schema Version;
- Required Validation or Provenance references.

Examples include Research depending on Approved Normalized Source Versions, Blog depending on Approved Research and Confirmed Human Opinion, Design depending on Approved Xiaohongshu plus Theme and Component Registry Versions, and Render Output depending on Approved Design, Assets, and rendering configuration Versions.

Historical work must never resolve dependencies by dynamically reading whichever upstream Version is “currently approved.” A historical Version always points to the Versions it actually used.

## 11. Outdated

Outdated describes current downstream eligibility, not deletion or historical corruption.

- A historical Version remains an accurate record of its Body and original dependencies.
- When a newer upstream Version becomes Approved, affected current downstream Artifacts may become `outdated` according to Dependency and Workflow policy.
- Adding, removing, replacing, or changing a dependency requires a new dependent Version; the old Dependency Snapshot remains unchanged.
- Changes to Platform Profile, Brand Theme, Component Registry, Asset Version, or other versioned inputs may make current dependents outdated when those inputs are formal dependencies.
- An outdated Artifact remains viewable, comparable, downloadable as historical content, and restorable as a new Working Copy, but cannot silently become the new Final Export candidate.
- Outdated is not equivalent to invalid, deleted, or unapproved. A confirmed integrity or security defect uses separate invalidation semantics.

A Renderer upgrade alone does not rewrite or automatically make a historical Design Version outdated. Re-rendering under a new eligible renderer creates a new Render Job and Render Output with its own exact execution dependencies; historical Design and Render Outputs remain preserved.

## 12. Restore

Restore is forward-moving history:

```text
Select Historical Version
→ Create new Working Copy based on it
→ Review or edit
→ Create new immutable Version
→ Optional new Approval
```

Restore never edits or reactivates a historical Version in place and never deletes Versions created after it. The new Version records the historical source through its Parent or restore relationship according to the Artifact Contract.

## 13. Stale Candidate and Late Result

Every Agent Candidate binds a Frozen Input Snapshot.

If an upstream input changes while execution is running:

- The Raw Model Output and execution record are retained;
- A valid Candidate or Version may be retained for audit;
- The input mismatch is recorded;
- The result is marked stale on arrival or an equivalent non-promotable state;
- It does not become the current Review Candidate;
- A new Task may be created or recommended using current inputs.

A result arriving after Task cancellation, supersession, timeout, or replacement is a Late Result. It may be saved as execution history but cannot be promoted unless the original Task remains eligible under current deterministic policy. A Cancelled or superseded Task does not promote its Late Result.

## 14. Promotion

Raw Model Output cannot directly become an Artifact, Review Candidate, Approval, or Workflow action.

Conceptual Candidate Promotion follows:

```text
Persist Raw Output
→ Parse
→ Schema Validation
→ Domain Validation
→ Dependency Validation
→ Workflow Eligibility
→ Create or update Working Copy / create Version according to policy
→ Promote eligible Version to Review Candidate
```

Promotion checks current input eligibility, cancellation and supersession state, duplicate results, idempotency, Blocking Errors, and whether a newer equivalent result has already been selected. Promotion never creates user Approval automatically.

## 15. Export Eligibility

A Version can participate in a formal Export only when:

- The exact Version is Approved;
- Blocking Error count is zero;
- Required Warnings have been handled under policy;
- Its Dependency Snapshot is complete, valid, and eligible;
- Current Workflow Policy permits Export;
- It is not in an Outdated state forbidden for Final Export;
- Required Assets and related configuration Versions are Approved where applicable;
- For Xiaohongshu, the selected Final Render and Export Package use the same approved content, Design, Asset, and render dependency set;
- For Blog, the Export Package is generated from the exact Approved Blog Version.

Preview Render, Draft Working Copy, unapproved Version, partial carousel render, stale Candidate, and invalidated output are not formally export-eligible.

## 16. Archive and Delete Relationship

- **Archive** removes an object from normal active views while preserving Versions, Approvals, dependencies, Provenance, and history.
- **Delete Request** is separate from Archive and begins an authorized, dependency-aware deletion lifecycle.
- **Purge** removes data and objects according to Retention and deletion policy. Purge does not “edit” historical Versions; it removes the relevant owned data scope through a separate lifecycle.
- **Deletion Ledger** prevents purged data from silently re-entering the active system after Backup Restore.

The complete purge algorithm, retention durations, Backup expiry, and storage mechanics belong to Security and data-lifecycle specifications.

## 17. Versioning Examples

### Example A: Research Correction

```text
Research Version 1
→ Human correction in Research Review Working Copy
→ Research Version 2
→ Validate
→ Approve Research Version 2
```

Research Version 1 remains immutable and available.

### Example B: Blog Revision Proposal

```text
Blog Working Copy Revision 7
→ AI Revision Proposal targets Revision 7
→ User selectively applies accepted changes
→ Blog Working Copy Revision 8
→ Create Blog Version 3
```

The Proposal does not directly edit Blog Version 2 or approve Blog Version 3.

### Example C: Upstream Change

```text
Research Version 2 approved
→ Blog Version 3 depends on Research Version 2
→ Research Version 3 approved
→ Blog Version 3 remains historical
→ Blog Artifact becomes Outdated
→ User chooses regeneration
→ New Blog Version 4 depends on Research Version 3
```

Blog Version 3 is neither deleted nor rewritten to claim a Research Version 3 dependency.

## 18. Versioning Invariants

- Version Body is immutable.
- Version ID remains stable and is never recycled.
- Version Number is unique within one Artifact.
- Parent relationship is immutable.
- Approval binds one exact Version.
- Dependency binds exact upstream Versions.
- A Dependency Snapshot cannot be rewritten after Version creation.
- Restore creates a new Working Copy and new Version.
- A stale-on-arrival Candidate cannot be promoted to current Review Candidate.
- A Cancelled or superseded Task cannot promote a Late Result.
- Working Copy Revision increases for every accepted mutable-state change.
- An update with an incorrect expected Revision cannot overwrite current Working Copy state.
- Historical Versions cannot be edited directly by a user, Agent, workflow, or renderer.
- Head pointer changes do not mutate historical Versions.
- New Versions do not inherit Approval.
- Formal Export uses exact approved and eligible dependencies.

## 19. Open Implementation Decisions

The following are not fixed by current Accepted Decisions:

- Exact opaque ID generation algorithm and representation;
- Concurrent allocation mechanism for Version Number within an Artifact;
- Working Copy creation, reset, cleanup, and inactive-retention policy for each Artifact type;
- Lock, lease, compare-and-swap, or other serialization mechanism for Artifact Head updates;
- Content Hash algorithm and exact canonicalization scope;
- Revision Proposal Diff storage format and selective-apply record format;
- Exact internal names for stale-on-arrival and superseded-before-promotion states;
- Complete Dependency Role enumeration;
- Exact policy for preserving versus resetting a Working Copy after Version creation.

These decisions must be made in the relevant Contract or technical specification. They must not change the Accepted semantics in this document without a new Decision when the change affects Domain, Workflow, Security, or release behavior.

## 20. Decision Traceability

| Versioning area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Append-only content and Blog editing | DEC-032, DEC-051–DEC-058 | [Session-007](../sessions/session-007.md), [Session-010](../sessions/session-010.md) |
| Source, Research, and Human Opinion Versions | DEC-059–DEC-075 | [Session-011](../sessions/session-011.md), [Session-012](../sessions/session-012.md) |
| Xiaohongshu, Design, Asset, Render, and Export Versions | DEC-086–DEC-124 | [Session-014](../sessions/session-014.md), [Session-015](../sessions/session-015.md), [Session-016](../sessions/session-016.md) |
| Workflow eligibility, stale results, Promotion, and Approval | DEC-125–DEC-139 | [Session-017](../sessions/session-017.md) |
| Stable identities, Artifact Head, Dependency, Provenance, Archive, and concurrency | DEC-160–DEC-176 | [Session-019](../sessions/session-019.md) |
| Agent Candidate and execution identity | DEC-177–DEC-189, DEC-195–DEC-198 | [Canonical Decision Register Index](../decisions/decisions.md) |
| Security lifecycle and deletion | DEC-199–DEC-220 | [Canonical Decision Register Index](../decisions/decisions.md) |
| MVP core versioning and completion | DEC-271–DEC-272, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of all Decisions is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
