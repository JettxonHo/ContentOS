# ContentOS Data Classification

**Status:** Current Truth

**Scope:** MVP data sensitivity, ownership, process access, Provider transmission, logging, export, retention, and deletion boundaries

**Last Updated:** 2026-07-27

This document classifies ContentOS data and defines the handling rules that follow from each classification. It defines policy semantics, not database columns, concrete retention periods, IAM rules, encryption products, or automated classification algorithms.

Related current-truth documents:

- [Product Definition](../product/product-definition.md)
- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](../architecture/domain-overview.md)
- [Artifact Versioning](../architecture/artifact-versioning.md)
- [Technical Architecture](../architecture/technical-architecture.md)
- [Process Topology](../architecture/process-topology.md)
- [Workflow Overview](../architecture/workflow-overview.md)
- [Agent Runtime](../architecture/agent-runtime.md)
- [Rendering](../architecture/rendering.md)
- [Security Baseline](security-baseline.md)
- [Source Fetcher](source-fetcher.md)
- [Secret Management](secret-management.md)

---

## 1. Classification Purpose

Data classification determines the minimum handling boundary for:

- Storage and encryption;
- ordinary logging and restricted diagnostics;
- transmission to a Model Provider;
- process and Service Identity access;
- Publishing Export, future User Data Export, and future sharing;
- retention and expiration;
- Delete Request and Purge;
- backup and restore;
- incident investigation and diagnostic access.

Classification describes required protection. It does not grant access, Approval, publication, or ownership. When one object contains multiple classes, the strictest applicable handling rule governs the combined object unless fields are separated into independently protected objects.

## 2. Classification Levels

These six operating levels normalize the five primary classes established by DEC-202 and the separately restricted diagnostic class established by DEC-213.

### 2.1 Public

Information already public by origin or content the user has explicitly approved and chosen to publish. Examples include a public URL, public Source metadata, public Platform Profile data, and the final content the user has deliberately published.

Public origin does not make derived Research, Human Opinion, drafts, internal metadata, or ContentOS copies public.

### 2.2 Internal

Non-public operational metadata that normally does not contain a content body or Credential. Examples include Workflow state, ordinary execution metadata, Schema Version, non-sensitive configuration, validation status, duration, and redacted identifiers.

Internal does not mean suitable for unrestricted external disclosure.

### 2.3 Private User Content

The default class for unpublished user-owned content, derived content, and private deliverables. Examples include Pasted Text, Uploaded Text, Normalized Source, Research, Blog Draft, Xiaohongshu Draft, Design Specification, Assets, and private Render Outputs.

### 2.4 Sensitive User Content

Private user content requiring stricter Provider, access, logging, and retention controls because it may reveal identity, confidential activity, unpublished views, or personal experience. Examples include Raw Human Opinion, personal experience, an unpublished position, a Private Source, and user input containing identity or business information.

### 2.5 Restricted Security Data

Secrets and material that directly grants or protects access. Examples include Session Credentials, Provider and infrastructure Credentials, API Keys, authentication tokens, signed-URL credential material, signing Secrets, and encryption keys.

Restricted Security Data corresponds to the `Secret` class in DEC-202. It is never ordinary application content.

### 2.6 Restricted Diagnostic Data

High-risk execution or investigation evidence requiring separate access, storage, audit, and retention policy. Examples include Raw Model Output, a Full Prompt, full Provider request or response payloads, and security-investigation evidence.

Restricted Diagnostic Data is not ordinary log data. Its restriction comes from both its diagnostic role and the embedded content classes it may contain. It may contain Private User Content, Sensitive User Content, malicious text, or Provider metadata and must be handled to the strictest applicable requirement.

## 3. Data Category Matrix

`Conditional` means a separate policy or exact approved use must permit the operation. `No` is the default and may not be converted to `Yes` by a model, UI state, ordinary retry, or informal operator action.

| Data category | Default classification | Primary owner | Permitted process access | Provider transmission eligibility | Ordinary logging eligibility | Export eligibility | Retention considerations |
|---|---|---|---|---|---|---|---|
| Source Reference | Public when only public URL/metadata; otherwise Private User Content | User | API; Fetcher for assigned Task; Worker by approved reference | Conditional; only Task-required metadata | Redacted ID, classification, status, host hash | Public reference only when approved | Preserve identity and provenance; delete with owned Package scope |
| Raw Snapshot | Private User Content; Sensitive when Source requires it | User | Fetcher write; authorized Source review/extraction path | No by default | ID, hash, size, status only | No | Immutable; restricted storage; included in Purge |
| Extracted Content | Private User Content; Sensitive when inherited | User | Source module; authorized review; no general process access | No before approved normalization | ID, hash, size, result only | No | Separate from Raw Snapshot and Safe Display; purge with Source |
| Normalized Source | Private User Content; Sensitive when inherited | User | API and Source module; Worker only through approved Frozen Input | Conditional for an eligible Agent Run | ID, Version, classification, size | Only approved public references, not the internal body by default | Immutable Versions retained by policy; dependency-aware deletion |
| Research | Private User Content | User | API; authorized Worker; downstream Agents through approved Version | Conditional and minimized | ID, Version, status, validation | Only approved delivery fields and public references | Formal Artifact Versions outlive ordinary diagnostics |
| Raw Human Response | Sensitive User Content | User | API/opinion module; explicitly authorized Agent role only | Conditional; only when responsibility and Provider Data Policy require | No | No by default; never incidental | Stricter access and retention; included in Purge |
| AI Interpretation | Sensitive User Content until confirmed or rejected | User | Opinion module; authorized review path | Conditional for the responsible Run | ID and status only | No | Preserve separation from user statement; purge with Package |
| Confirmed Opinion | Sensitive User Content unless user explicitly changes disclosure intent | User | Authorized downstream Agents and review surfaces | Conditional and minimized | ID, Version, confirmation status | Only user-approved expression, not raw diagnostic context | Versioned; dependency-aware retention and deletion |
| Blog Working Copy | Private User Content | User | API, Blog module, authorized UI | Conditional for responsible Agent revision | ID, revision, status, size | No; only approved Export fields | Mutable head plus immutable Versions; not indefinite diagnostics |
| Xiaohongshu Working Copy | Private User Content | User | API, XHS module, authorized UI | Conditional for responsible Agent revision | ID, revision, status, size | No; only approved Export fields | Same versioning and deletion obligations as Blog |
| Design Specification | Private User Content | User | API, Visual path, Renderer with exact eligible reference | Conditional only for Visual Agent creation/revision | ID, Version, validation | No direct public export unless an approved format later exists | Preserve exact approved dependencies; purge with Package |
| Asset | Private User Content; Sensitive if source content requires | User or system according to Asset ownership | Asset module; scoped Worker/Renderer/Object Storage access | Conditional for generation or transformation Task | ID, hash, MIME, size, status | Approved delivery Asset only | Provenance, licence, references, quarantine, and shared-use checks apply |
| Preview Render | Private User Content | User | API and scoped Renderer/storage paths | No | ID, Render Job, status, size | No | Usually shorter-lived; never formal Export evidence |
| Final Render | Private User Content until user publishes | User | API, scoped Renderer, Export Service | No | ID, hash, status, Environment Fingerprint | Yes, through approved Publishing Export only | Immutable; retain by policy and dependency; purge with Package |
| Export Package | Private User Content until user publishes | User | API, Export Service, authorized download path | No | ID, Version, file hashes, status | Yes; this is the Publishing Export product | Private Object Storage; revoke access and purge with scope |
| Prompt Template | Internal | System/project | Authorized configuration and Worker paths | Yes as runtime instruction, excluding Secrets | ID and Version only | No | Versioned release configuration; preserve applicable execution history |
| Assembled Prompt | Restricted Diagnostic Data; may embed Sensitive User Content | User for embedded content; system for assembly metadata | Assigned Agent Run only; explicit diagnostics | Yes, only to selected Provider for the Run | No | No | Separate restricted retention; delete with related Package/Run |
| Raw Model Output | Restricted Diagnostic Data | User for embedded content; system for execution record | Agent Runtime storage; explicitly authorized diagnostics | No secondary transmission by default | No | No | Restricted, independently retained, audited access, included in Purge |
| Model Telemetry | Internal; Restricted Diagnostic if payload/content is present | System, scoped to user execution | Worker and observability path; authorized diagnostics | Provider supplies minimized values | Redacted usage, latency, status, Provider alias | No | Keep payload-free; separate telemetry and diagnostic retention |
| Workflow Event | Internal; never a content-body container | User-owned Workflow / system record | API, Workflow Executor, authorized UI projection | No | Event type, IDs, status, time | No | Append-only history; distinct from security audit |
| Security Audit Event | Internal with restricted access | System accountability record | Security-authorized API/diagnostic path | No | Minimal event metadata only | No | Append-only, access-controlled; duration remains open |
| Secret Reference | Internal but security-sensitive metadata | System/infrastructure | Only process configuration and authorized resolver | No | Reference ID and access result where safe | No | Does not contain value; retain with configuration history as needed |
| Credential | Restricted Security Data | System/infrastructure | Only the process runtime that requires it | No as Provider data; an Adapter may present it only to its intended authentication endpoint | No | No | Rotation, revocation, expiry, audit; never application backup by design |
| Backup | Inherits the highest included classification | System on behalf of user data owners | Backup and authorized restore identities only | No | Backup ID, status, size, time | No | Encrypted, access-restricted, retention-bound; restore reapplies Deletion Ledger |

## 4. Data Ownership

- User content belongs to the corresponding Owner's private data scope.
- A Service Identity processes data but never becomes its owner.
- A Model Provider does not acquire ownership inside the ContentOS Domain model.
- An Agent Run reading or generating data does not change its classification or ownership.
- The single-user MVP retains `owner_user_id` or equivalent ownership semantics on user-owned root objects.
- System-owned definitions such as Component Registry entries, Platform Profiles, and configuration remain distinguishable from user-owned Artifacts.
- Shared or system-owned dependencies do not permit unrelated private user content to cross Package boundaries.

Ownership, authorship, provenance, and technical custody are separate concepts.

## 5. Provider Transmission Policy

Provider transmission is deny-by-default and follows all of these conditions:

1. Send only the minimum data required by the current Agent responsibility.
2. Send data only to the Provider selected for the eligible Agent Run.
3. Apply the exact versioned Provider Data Policy and record its Version.
4. Never send Secrets, Credentials, Security Audit detail, or internal security policy.
5. Send Raw Human Opinion only when the Agent Spec explicitly requires it and policy permits it; prefer Confirmed Opinion where sufficient.
6. Treat Provider memory and prior model conversation as non-authoritative and never as formal Evidence.
7. Trace each transmission to the Agent Run, Model Call Attempt, Provider Alias, Model Configuration, data classes, and applicable policy.
8. Do not use Fallback to evade Sensitive-data restrictions, a Security Error, or a Safety Refusal.

## 6. Logging Policy

Ordinary logs and traces must not contain:

- complete Source or Artifact bodies;
- Full Prompt or Assembled Prompt;
- Raw Human Opinion;
- Raw Model Output;
- Secret or Credential values;
- Authorization headers or Cookies;
- signed or temporary access URLs;
- Session tokens;
- raw uploaded files or complete Provider payloads.

Ordinary telemetry may contain only the minimum operational facts, including:

- opaque ID or Correlation ID;
- content Hash where appropriate;
- byte or token size;
- classification label;
- state and result category;
- duration and attempt count;
- stable error category;
- redacted metadata and Provider Alias.

Full-content investigation belongs in Restricted Diagnostics, which is disabled by default, explicitly authorized, time-limited, audited, and governed by separate retention.

## 7. Export Policy

- Publishing Export includes only delivery content the user explicitly approved and the allowlisted metadata required for the selected output.
- It excludes Prompt, Raw Model Output, Secret, Credential Reference, internal Workflow state, Security Audit data, local paths, debug bundles, quarantined objects, and temporary URLs.
- Publishing Export, future User Data Export, and future Public Share are separate capabilities with separate purposes and permission models.
- The MVP implements only Publishing Export; User Data Export UX and Public Share remain deferred.
- An Export Package remains Private User Content until the user independently publishes it.
- Export does not automatically publish, share, reclassify, or declassify underlying Source data.

## 8. Retention Principles

- Different data categories may use different versioned Retention Policies.
- Raw Model Output, restricted diagnostics, rejected content, quarantine, temporary files, and Preview Render should be more tightly retained than formal approved Artifact history.
- Historical Version retention does not require indefinite retention of every Prompt, Provider payload, diagnostic record, or temporary object.
- A Delete Request and Purge must cover database records, Object Storage objects, projections, caches, indexes, derived content, restricted diagnostics, and access references within the owned scope.
- Shared dependencies require reference-aware deletion so another protected object is not removed incorrectly.
- Backup Restore must reapply the Deletion Ledger before restored state becomes active.
- Retention does not override immediate access revocation or a valid completed Purge obligation.

This document intentionally defines no duration.

## 9. Data Access Principles

- **Need-to-know:** access exists only for a concrete product, operational, or security purpose.
- **Least privilege:** a Principal receives the minimum operations and data scope required.
- **Deny by default:** missing policy or classification metadata does not imply access.
- **Owner-scoped access:** authenticated user access remains limited to owned resources.
- **Service-specific access:** each process uses a distinct identity and constrained data path.
- **Explicit diagnostic access:** restricted content is not exposed through ordinary Workspace or telemetry paths.
- **Audited restricted access:** Secret access and Restricted Diagnostic access create security-relevant audit evidence.
- **Revalidation at boundaries:** Queue delivery, Task ID, Object Key, temporary URL, or UI visibility never substitutes for Authorization.

## 10. Classification Invariants

- Every Secret is Restricted Security Data.
- Raw Human Opinion never enters ordinary logs or traces.
- Raw Model Output never enters ordinary logs, Publishing Export, or normal Workspace responses.
- Export does not change the classification or ownership of Source data.
- Process access does not change Owner or classification.
- Backup does not exempt data from deletion obligations.
- A temporary or signed URL never becomes a permanent Object Reference.
- A Provider receives only the minimum Task-required data allowed by policy.
- Public Source origin does not make derived user content public.
- A combined object receives at least the strongest handling required by its contained data.
- Classification never creates Approval, Provider eligibility, or publication by itself.

## 11. Open Implementation Decisions

The following remain open and are not selected here:

- Concrete retention durations;
- Restricted Diagnostic Access workflow;
- Provider Data Policy configuration format;
- Backup encryption scheme;
- database representation of Data Classification;
- future User Data Export format.

## 12. Decision Traceability

| Area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Source layers, immutable Snapshot, approved Normalized Source, and input scope | DEC-059–DEC-066 | [Session-011](../sessions/session-011.md) |
| Human Opinion separation, downstream eligibility, provenance, and versioning | DEC-067–DEC-075 | [Session-012](../sessions/session-012.md) |
| Frozen input, Raw Output, Provider configuration, and Secret separation | DEC-129–DEC-130, DEC-177–DEC-197 | [Session-017](../sessions/session-017.md), [Session-020](../sessions/session-020.md) |
| Data classification, minimization, logging, diagnostics, retention, deletion, and export boundaries | DEC-199–DEC-219 | [Session-021](../sessions/session-021.md) |
| PostgreSQL authority, Queue minimization, Object Storage, telemetry privacy, and configuration | DEC-226, DEC-228, DEC-232, DEC-239–DEC-240 | [Session-022](../sessions/session-022.md) |
| Eval data and security/recovery release gates | DEC-253, DEC-259, DEC-262 | [Session-023](../sessions/session-023.md) |
| MVP input, output, privacy, exclusions, and recovery definition | DEC-267–DEC-274, DEC-284–DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
