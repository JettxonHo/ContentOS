# ContentOS Security Baseline

**Status:** Current Truth

**Scope:** MVP security goals, identity and trust boundaries, input containment, audit, deletion, recovery, and release-blocking requirements

**Last Updated:** 2026-07-27

This document defines the minimum security behavior ContentOS must preserve from M0 onward. It specifies current security rules and invariants, not an Authentication library, concrete IAM policy, firewall syntax, event Schema, retention duration, encryption product, or implementation code.

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
- [Data Classification](data-classification.md)
- [Source Fetcher](source-fetcher.md)
- [Secret Management](secret-management.md)

---

## 1. Security Goals

ContentOS must provide:

- **Private by default:** creation, generation, rendering, and Export do not create public access.
- **Least privilege:** each Principal and process receives only the operations, data, network, and Secrets needed for its responsibility.
- **Deny by default:** unspecified access, capability, file type, destination, export field, or transition is rejected.
- **Owner isolation:** every user-owned root is Owner-scoped even in the single-user MVP.
- **External input containment:** public Sources, uploads, pasted text, external metadata, Assets, Tool output, and Provider output are untrusted.
- **Untrusted model output:** model output is Candidate material without execution, Approval, or Domain write authority.
- **Auditable privileged action:** security-sensitive access and mutations create distinct Security Audit evidence.
- **Protected transport and storage:** production trust-boundary traffic uses protected transport, and persistent private data, Backups, and Secret storage use appropriate at-rest encryption.
- **Secure deletion and restore behavior:** Purge covers owned and derived active data; Restore reapplies the Deletion Ledger before activation.
- **No silent security degradation:** a Security Error cannot be converted into an ordinary Warning, Retry, Fallback, or manual bypass.

## 2. MVP Threat Model

The baseline addresses at least these threats:

| Threat | Boundary and required containment |
|---|---|
| Unauthorized user access | Browser/API boundary: authentication, secure Session, server-side Authorization, and denial by default |
| Owner data crossover | Query, Command, Object, download, upload, Workflow, and diagnostics boundaries: Owner checks on every protected operation |
| Session theft | Browser/API boundary: protected Session Credential, expiry, revocation, secure transport, and no token logging |
| Secret leakage | Configuration/runtime boundary: Secret Layer, per-process references, redaction, no Git/Queue/Prompt/Export inclusion |
| Prompt Injection | Source/Provider boundary: content/instruction separation, no default tools, minimal Context, typed output, deterministic checks, human gates |
| SSRF | Fetcher/public network boundary: URL, DNS, connection, redirect, port, size, and destination policy |
| Malicious upload | Upload/quarantine boundary: allowlist, validation, isolation, no execution, cleanup |
| Unsafe Markdown or HTML | Display/render boundary: raw/safe separation, sanitization, allowlists, no arbitrary active content |
| Remote image tracking | Browser/Fetcher/Object Storage boundary: no uncontrolled browser loading; proxy or internalize under explicit policy |
| Model output requesting privileged action | Agent Runtime/Executor boundary: output remains Candidate or Proposal; deterministic Authorization and policy required |
| Queue replay | Queue/Worker boundary: Task ID is not authority; reload PostgreSQL truth; idempotency, lease, cancellation, and eligibility checks |
| Duplicate Promotion | Candidate/Artifact boundary: stable identity and atomic duplicate prevention |
| Stale or cancelled result Promotion | Agent/Workflow boundary: Promotion rechecks exact dependencies, cancellation, supersession, and current eligibility |
| Renderer external request | Renderer/network boundary: public egress disabled; any attempt is a Blocking security signal |
| Export data leakage | Export boundary: construct from an explicit field and file allowlist, never a directory or Object prefix |
| Backup restoring deleted data | Restore/active-system boundary: reapply Deletion Ledger and verify final Domain state before availability |

The principal trust boundaries are Browser ↔ API, API/Application ↔ PostgreSQL/Object Storage, Fetcher ↔ public Internet, Worker/Agent Runtime ↔ Model Provider, Renderer ↔ controlled render inputs, Queue ↔ Workers, and restricted diagnostics ↔ authorized operators. Crossing any boundary requires validation, appropriate identity and Authorization, data minimization, bounded resources, redaction, error handling, and audit where applicable.

## 3. Identity Model

```text
User Principal
Agent Principal
System Principal
Service Identity
```

- **User Principal:** an authenticated human identity. Authentication alone does not prove ownership of a requested object.
- **Agent Principal:** the logical Agent identity recorded as a Domain Actor for Candidate production. It does not inherit all user permissions or receive general technical credentials.
- **System Principal:** deterministic application behavior such as Workflow policy, dependency propagation, reconciliation, or a scheduled lifecycle action, acting within an explicit system authority.
- **Service Identity:** a process-level technical identity such as API, Worker, Fetcher, Renderer, or a bounded executor. It receives only the permissions required by that process responsibility.

A Model Provider is an external processor, not a ContentOS Principal. A Domain Actor records who or what caused a Domain action; it does not itself grant infrastructure access. Every protected user action requires both a valid authenticated User Principal and successful Owner/operation Authorization.

## 4. Authentication Baseline

- A network-accessible single-user MVP still requires formal Authentication.
- The product uses a secure, expiring, revocable Session and server-side Session validation.
- Session Credentials never enter frontend logs, ordinary server logs, traces, Queue payloads, or Export.
- Every privileged action requires a current valid identity; sensitive actions may require explicit confirmation.
- Authentication failure, missing state, expired Session, and revoked Session deny the operation.
- Repeated login attempts require bounded abuse protection.
- Production transport is protected; simplified loopback-only development behavior is not the production model.

No Authentication library or credential method is selected here.

## 5. Authorization Baseline

- Authorization is enforced server-side at every protected read and mutation.
- User-owned roots and their derived objects are resolved within Owner scope.
- Object-level checks apply to opaque IDs; unguessable IDs are not Authorization.
- Workflow Commands require Actor, target, ownership, Expected Revision, current state, dependency, and Workflow Policy checks.
- Upload, download, Object access, temporary URL generation, and Export retrieval require Authorization.
- Approval and Warning acknowledgement require an authorized human and an exact eligible target Version.
- Restricted diagnostic access requires separate explicit Authorization and a Security Audit Event.
- A Task ID, Queue Job, signed URL, local UI state, or hidden button does not authorize access.
- UI visibility improves safety but never replaces server-side enforcement.

## 6. Process and Service Isolation

The modular monolith has five deployable processes with independent security boundaries:

| Process | Required security boundary |
|---|---|
| `web` | No database, Redis, Object Storage administration, Provider, or server-side Secret Credential; all authoritative operations go through API |
| `api` | Authenticates and authorizes external Domain writes; no arbitrary public Source fetch; never exposes Provider Credentials to Browser |
| `worker` | Reads only assigned Task and frozen inputs; may resolve approved Provider Credentials; does not approve, publish, or obtain unrestricted storage administration |
| `fetcher` | Controlled public HTTP/HTTPS egress and scoped quarantine/Snapshot access; no Model Credentials, Human Opinion access, or general Domain writes |
| `renderer` | Exact approved input/output access; no public network, Model Credentials, Raw Human Opinion, Approval, or canonical-content mutation |

Each process uses a distinct Credential Reference. API is the external authoritative Domain-write entry point. Internal execution may write only through the owning use case and its scoped contract; process separation does not create microservices or separate Domain truth.

## 7. External Input Trust Boundary

The following are untrusted by default:

- Public Web Content;
- uploaded files;
- Pasted Text;
- Tool or Capability output;
- Model Output;
- generated or uploaded Assets;
- external headers and metadata.

Untrusted data cannot directly:

- become a Workflow Command or execute a privileged operation;
- grant a Capability or Secret;
- modify security, routing, Workflow, or retention policy;
- become an Approved Artifact or Asset;
- execute arbitrary HTML, CSS, JavaScript, iframe, plugin, macro, or code;
- enter Publishing Export without explicit validation, approval, and allowlist selection.

Validation reduces risk but does not change the origin history or grant trust beyond the validated purpose.

## 8. Prompt Injection Defense

Prompt Injection uses layered containment:

```text
External Source / System Instruction Separation
+ Untrusted-content Framing
+ Context Minimization
+ Tool Default Off
+ Capability Gateway
+ Structured Candidate Output
+ Deterministic Command Validation
+ Authentication and Permission Checks
+ Schema and Domain Validation
+ Human Approval
+ Audit and Adversarial Tests
```

Source content is supplied only as data and cannot modify the System instruction, request Tools, create a Workflow Command, access another Package, or change output authority. Model Output remains a Candidate or Command Proposal. A single defensive Prompt cannot completely solve Prompt Injection; permission reduction and deterministic boundaries limit the consequence of model failure.

## 9. Upload Baseline

- MVP allowlist: `.md` and `.txt` only.
- Every upload has a bounded size; the numeric limit remains open.
- Validate encoding, safe filename, extension/MIME consistency, applicable content signature, and parser resource bounds.
- New uploads enter quarantine and are not normal Source objects before validation succeeds.
- Files never execute and filenames never define trusted filesystem paths.
- Failed or abandoned validation produces a formal failure and lifecycle cleanup under retention policy.
- Unvalidated, rejected, or quarantined content cannot enter Agent Context, rendering, download, or Export.
- Adding a file format requires a dedicated security review.

## 10. Markdown, HTML and Remote Resource Safety

- Markdown is sanitized and treated as content, not executable code.
- Arbitrary Script, executable Markdown plugin, event handler, active form, Service Worker, and uncontrolled iframe are prohibited.
- Raw Source HTML and Safe Display are separate objects or representations; Raw HTML is never inserted as trusted application DOM.
- Remote images and resources follow an explicit policy: controlled Fetcher proxy/download into private storage, or rejection. Browser direct loading is not the default.
- Any future Export HTML uses a strict element, attribute, protocol, and resource allowlist plus sanitization and security headers.
- Renderer accepts only controlled Component output, approved local resources, registered bindings, and bounded runtime behavior.
- Model-generated HTML is not a canonical MVP Artifact and cannot bypass the same controls.

## 11. Model and Agent Security

- Model Output is always an untrusted Candidate with no execution or Approval authority.
- Agents have no direct database mutation, Shell, filesystem, unrestricted Internet, Secret Store exploration, or Workflow Command access.
- Provider transmission includes only the minimum Agent-required data permitted by the Provider Data Policy.
- Tool access is disabled by default; any allowed capability is typed, allowlisted, authorized, budgeted, and audited through a Capability Gateway.
- A Security Error, Safety Refusal, or disallowed data class cannot be bypassed by Fallback, Repair, Provider switching, or ordinary retry.
- Agent Spec, Prompt Template, Model Configuration, Runtime Policy, Validation Profile, and Capability policy are versioned.
- ContentOS neither requests nor stores hidden Chain of Thought. A structured public explanation may be stored only when its Contract requires it.
- Raw Output is persisted under restricted policy before Parse and never treated as normal telemetry.

## 12. Queue and Workflow Security

- Queue payloads contain Task identity and minimum routing metadata, not complete user content or Secrets.
- A Task ID or Queue Job does not grant access.
- Worker reloads authoritative Task, ownership scope, frozen inputs, cancellation, lease, dependencies, and current eligibility from PostgreSQL before work and Promotion.
- Duplicate Job delivery is expected and handled idempotently.
- A Late Result is retained only as execution evidence unless it still passes cancellation, supersession, dependency, duplicate, and Workflow eligibility checks.
- A Cancelled result cannot be promoted.
- Idempotency Key prevents duplicate effects but never replaces Authentication or Authorization.
- Redis and BullMQ are transport and coordination systems, not identity, Domain, Workflow, Approval, or Artifact truth.
- A Security Error cannot enter the ordinary Retry or Skip path.

## 13. Object Storage Security

- Buckets or containers are private by default.
- Private Object Storage and its Backups use appropriate at-rest encryption; the concrete deployment mechanism remains open.
- Quarantine and formal object paths are separated by permission and lifecycle state.
- Temporary access URLs are object-specific, scoped, short-lived, generated only after Authorization, and excluded from ordinary logs.
- Object keys contain no Secrets and are not treated as authorization tokens.
- PostgreSQL stores durable Object References, hashes, classification, ownership, and lifecycle metadata; signed URLs are never permanent references.
- Publishing Export uses a file and field allowlist, not recursive directory or prefix packaging.
- Purge removes owned objects and corresponding active references, while dependency checks protect genuinely shared objects.
- Renderer and Fetcher receive only the storage prefixes and operations required by assigned work.

No Object Storage product or exact policy syntax is selected here.

## 14. Logging, Telemetry and Diagnostics

- Application logs are structured, redacted JSON.
- Correlation IDs connect HTTP, Command, Task, Agent Run, Model Call, Promotion, Render, Export, and errors without copying content.
- Ordinary logs and traces exclude complete Source, Prompt, Human Opinion, Artifact body, Raw Output, upload, Secret, Cookie, authorization material, and temporary URL.
- Restricted Diagnostics are disabled by default and separate from normal monitoring export.
- Restricted diagnostic access is time-limited, purpose-bound, explicitly authorized, and audited.
- Security Audit Event and Workflow Event use distinct contracts and access policy even if infrastructure is shared.
- Redaction is centralized where practical and is verified through tests.

## 15. Security Audit Events

The security audit catalog must cover at least:

- login failure and relevant Session events;
- Authorization denial;
- Secret access, rotation, revocation, or security configuration change;
- Restricted Diagnostic access;
- human Approval and Warning acknowledgement where security-relevant;
- Publishing Export creation or download;
- Delete Request creation and confirmation;
- Purge start, completion, and failure;
- Backup Restore and Deletion Ledger reapplication;
- unusual or blocked Source Fetch, including SSRF-policy denial;
- unsafe upload denial.

Security Audit Events are append-only, access-restricted, redacted, and attributable to a Principal, resource, time, and Correlation ID. The concrete Event Schema remains open.

## 16. Archive, Delete and Purge

```text
Archive
Delete Request
Purge
```

- **Archive** removes an object from normal active views while preserving history, dependencies, Authorization requirements, and stored data.
- **Delete Request** is an explicit, authorized request that starts impact analysis, user confirmation, pending-deletion state, and asynchronous execution. It blocks new processing within the affected scope according to policy.
- **Purge** removes the owned active database data, Object Storage objects, derived content, Raw Output, projections, cache, indexes, delivery access, and Share access within the confirmed scope.

Purge is dependency-aware and must not delete a protected shared dependency. Progress and failure remain visible until verification succeeds. A deletion failure cannot be marked complete. A minimal Tombstone and Deletion Ledger may remain without user content to prevent replay or restoration. Archive is not deletion; Delete Request is not completed Purge.

## 17. Backup and Restore Security

- Backups are encrypted and accessible only to dedicated least-privilege backup/restore identities.
- Backup metadata, restore initiation, completion, and failure are audited.
- Restore occurs into a controlled state and reapplies the Deletion Ledger before the system becomes active.
- Restore does not automatically reactivate Public Share, expired temporary URLs, revoked Sessions, or revoked Credentials.
- Restore validates database/object consistency, Artifact Heads, dependencies, Approvals, hashes, Outbox state, and archived/deleted behavior.
- A Recovery Drill verifies the final Domain state, not merely that a database process started.
- Backup retention may delay physical expiry of deleted bytes, but it must never return purged data to active use.

## 18. Security Release Gates

The following conditions are Blocking:

- Unauthorized access;
- Owner data crossover;
- Secret leakage;
- Approval bypass;
- Prompt Injection obtaining a Capability or privileged action;
- SSRF access to loopback, private, link-local, metadata, reserved, or otherwise restricted destinations;
- Renderer unauthorized public-network request;
- Publishing Export containing internal, unrelated, restricted diagnostic, or security data;
- Delete or Purge incorrectly marked complete;
- deleted data restored into the active system.

Blocking conditions cannot be offset by average quality scores, accepted as ordinary Warnings, or released through a routine manual override. Critical or High unresolved security failures block release.

## 19. Security Invariants

- User content and delivery objects are private by default.
- Authentication and Authorization remain separate checks.
- Every Service Identity is least-privilege and process-specific.
- Model Output has no execution, Approval, or direct Domain write authority.
- External input is untrusted by default.
- Secret values never enter Git, ordinary logs, Queue payloads, Prompt, Artifact, or Export.
- A Security Error has no ordinary bypass, Retry, Fallback, Skip, or “continue anyway” path.
- Renderer has no public egress.
- Backup does not exempt data from deletion obligations.
- High-risk Capability changes require a dedicated security review and adversarial tests.
- Task identity, Object Key, opaque ID, UI state, and signed URL never replace Authorization.
- Raw Snapshot and Raw HTML never become Safe Display directly.
- Publishing Export, User Data Export, Public Share, and Published state remain separate.

## 20. Open Implementation Decisions

The following remain open and are not selected here:

- Authentication library;
- Session storage;
- passwordless or local-credential method;
- CSRF strategy;
- concrete security-header configuration;
- whether malware scanning enters the MVP;
- Security Audit Event retention duration;
- backup encryption implementation;
- Purge Job algorithm;
- deployment implementation of data-at-rest encryption.

## 21. Decision Traceability

| Area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Source, opinion, Artifact, and dependency trust boundaries | DEC-059–DEC-075, DEC-125–DEC-139 | [Session-011](../sessions/session-011.md), [Session-012](../sessions/session-012.md), [Session-017](../sessions/session-017.md) |
| Agent Runtime, Candidate authority, tools, Raw Output, and Secrets | DEC-177–DEC-198 | [Session-020](../sessions/session-020.md) |
| Security, privacy, identities, input safety, audit, retention, deletion, and restore | DEC-199–DEC-220 | [Session-021](../sessions/session-021.md) |
| Process isolation, PostgreSQL/Queue/Object Storage authority, Renderer, telemetry, and configuration | DEC-221, DEC-226, DEC-228–DEC-240 | [Session-022](../sessions/session-022.md) |
| Deterministic tests, zero-tolerance invariants, and security/recovery gates | DEC-244–DEC-250, DEC-259, DEC-262 | [Session-023](../sessions/session-023.md) |
| Private MVP, scope exclusions, horizontal security, hardening, and recovery | DEC-267–DEC-285, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
