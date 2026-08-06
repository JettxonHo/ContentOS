# ContentOS Source Fetcher Security Boundary

**Status:** Current Truth

**Scope:** MVP public-URL validation, safe fetch, immutable capture, extraction, review Candidate, and failure boundaries

**Last Updated:** 2026-08-02

This document defines how ContentOS safely converts a user-supplied public URL into an immutable Raw Snapshot and a Safe Source Candidate. It defines security and responsibility boundaries, not an HTTP library, DNS-pinning algorithm, concrete timeout, exact byte limit, parser, or implementation code.

Related current-truth documents:

- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](../architecture/domain-overview.md)
- [Artifact Versioning](../architecture/artifact-versioning.md)
- [Technical Architecture](../architecture/technical-architecture.md)
- [Process Topology](../architecture/process-topology.md)
- [Workflow Overview](../architecture/workflow-overview.md)
- [Agent Runtime](../architecture/agent-runtime.md)
- [Data Classification](data-classification.md)
- [Security Baseline](security-baseline.md)
- [Secret Management](secret-management.md)

---

## 1. Fetcher Purpose

The Fetcher owns only:

- URL parsing, normalization, and validation;
- bounded Safe Fetch of supported public resources;
- redirect handling with per-hop revalidation;
- immutable Raw Snapshot creation;
- controlled deterministic extraction;
- production of a Safe Source Candidate and explicit Fetch result.

The Fetcher does not own:

- Research or factual interpretation;
- Agent planning or general Tool access;
- Workflow or Source Approval;
- arbitrary-site Browser automation;
- login, paywall, CAPTCHA, region, or Access Control bypass;
- automatic secondary-link crawling;
- direct creation of an approved Normalized Source Version.

## 2. Fetcher Trust Boundary

The submitted URL, parsed host, DNS response, resolved address, redirects, response headers, body, HTML, text, media references, and metadata are all untrusted.

The Fetcher:

- has controlled public HTTP/HTTPS egress;
- uses an independent least-privilege Service Identity;
- has no Model Provider Credential;
- cannot read Human Opinion, Research, Blog, Xiaohongshu, or unrelated Package content;
- has no general Domain write, Approval, Export, or Workflow Command authority;
- receives only an assigned Fetch Task and minimum policy/configuration metadata;
- writes only to scoped quarantine, Snapshot, extraction, and result paths;
- produces output that still requires validation, user Review, Version creation, and Approval.

The M2-WF-003C lease-expiry boundary is Worker-owned reconciliation only. It
does not give the Fetcher PostgreSQL access, consume a Queue Job, make a
network request, submit a result, create Source evidence, or write Object
Storage. A recovered Task is merely eligible for the next private Claim after
the existing API Gateway checks it again.

A successful network response establishes only that bytes were fetched under policy. It does not establish factual truth, safety for display, or Source Approval.

## 3. Supported Source Scope

The MVP Fetcher supports:

- public `http` and `https` URLs;
- content accessible without login or user Cookie forwarding;
- ordinary text or HTML responses within policy;
- a bounded redirect chain;
- explicit failure with Pasted Text fallback.

It does not bypass Access Control and does not guarantee capture of JavaScript-heavy pages. Authenticated capture, automated Browser navigation, paywall bypass, arbitrary crawling, and complex media acquisition are outside the baseline MVP.

## 4. URL Validation

Before a request, the Fetcher applies a deny-by-default URL policy:

- allow only the approved `http` and `https` schemes;
- parse and normalize the URL using one controlled representation;
- validate hostname syntax and destination policy;
- apply an explicit port policy;
- reject user information or Credentials embedded in the URL;
- drop the fragment from the network request while retaining the submitted reference separately if needed for provenance;
- consider IDN, Unicode normalization, punycode, dot, case, and ambiguous-host forms before policy evaluation;
- reject malformed, missing-host, internal-alias, and unsupported forms;
- preserve both the original Source Reference and normalized request identity without silently replacing one with the other.

URL syntax validity never replaces DNS, address, connection, and redirect validation.

## 5. SSRF Protection

The Fetcher blocks destinations in or resolving to:

- loopback ranges;
- private network ranges;
- link-local ranges;
- multicast ranges;
- unspecified, reserved, documentation, benchmarking, and other non-public ranges as required by policy;
- cloud metadata and platform-control endpoints;
- localhost and internal-service aliases;
- prohibited ports and non-HTTP schemes;
- restricted targets expressed through alternative IPv4 or IPv6 forms;
- IPv4-mapped IPv6, numeric, encoded, mixed, shortened, or otherwise ambiguous representations;
- DNS rebinding from an initially public address to a restricted destination;
- any redirect target that fails the same policy.

Every redirect destination and the final connection address require revalidation. Validation at initial submission time alone is insufficient. A connection that cannot be proven to target an allowed public destination fails closed.

## 6. DNS and Connection Policy

- Resolve the normalized hostname through the controlled Fetcher path.
- Evaluate every usable resolved address against the destination policy.
- Ensure the actual connection target remains consistent with the validated address policy.
- Re-evaluate when DNS results change or another connection attempt resolves again.
- Do not trust `Host` or other request headers as proof of destination identity.
- Do not let a proxy, alternate resolver, SDK redirect mode, or environment setting bypass SSRF policy.
- Treat mixed allowed/restricted resolution conservatively and fail closed when policy cannot establish a safe connection.
- Record only the minimum redacted resolution and policy evidence required for diagnosis and audit.

The exact DNS pinning and connection-binding mechanism remains open.

## 7. Redirect Policy

- Redirect count is bounded.
- Every hop is parsed, normalized, resolved, and validated as a fresh destination.
- Restricted schemes and ports are blocked.
- Relative redirects are resolved against the current validated URL before checking.
- Cross-origin redirects receive the complete policy; same-origin redirects are not exempt.
- Redirect loops and limit exhaustion return explicit failure.
- The Fetch record preserves submitted URL, redirect chain metadata, and final URL as distinct facts.
- The final URL is never silently presented as though it were the original user reference.
- Cookies, authorization material, and sensitive headers are not forwarded across redirects.

## 8. Request Policy

- The baseline uses safe read behavior only; user-controlled methods and request bodies are not supported.
- Headers are controlled by Fetcher policy; users cannot provide arbitrary headers.
- User Cookies, Browser Sessions, internal authorization headers, and infrastructure Credentials are never forwarded.
- Connection, response, and total Task time are bounded.
- Response body, decompressed size, header size, and relevant parser resources are bounded.
- Content type is validated against an explicit allowlist before text extraction.
- Compression ratios and decompressed bytes are constrained to prevent compression bombs.
- Rate, concurrency, retry, and total redirect behavior are bounded.
- TLS verification and protected transport remain enabled for HTTPS.

Exact numeric limits remain Open Implementation Decisions.

## 9. Response Handling

- A successfully captured Raw Snapshot is immutable; refetch creates another Snapshot identity.
- Preserve only required response evidence and metadata, including Source Reference, normalized/final URL, time, status, applicable headers, content type, size, hash, and redirect facts.
- Reject or fail responses that violate size, duration, protocol, type, or integrity policy.
- Binary or unsupported content does not enter text extraction disguised as text.
- An error, block, login, CAPTCHA, empty shell, or access-denied page must not be silently represented as successful article content.
- Raw HTML, text extraction, metadata, and Safe Display representation remain separate.
- Raw Source bytes are evidence, not executable or trusted display content.
- Partial or interrupted bodies cannot become successful immutable Snapshots unless an explicit future Contract defines and labels partial evidence.

## 10. Extraction

- Extraction is deterministic or otherwise tightly controlled and resource-bounded.
- Script, style, iframe, event handler, active form, plugin, Service Worker, tracking resource, and other dangerous nodes do not enter Safe Display.
- Extracted links, author, dates, titles, Open Graph fields, structured data, and other metadata remain untrusted Candidate facts.
- Extracted Content is not an Approved Source.
- The user reviews and corrects a Normalized Source Working Copy before an immutable Normalized Source Version becomes eligible for Approval.
- Research consumes only an exact Approved Normalized Source Version.
- Extraction failure is preserved as a result category and never replaced by fabricated content.

No extraction or sanitization library is selected here.

## 11. Prompt Injection Containment

- Instructions inside a Source are data, regardless of formatting or claims of authority.
- Source content cannot modify System instructions, Agent Spec, Prompt Template, Provider Data Policy, or security configuration.
- Source content cannot request or grant a Tool, Capability, Secret, network call, or Workflow Command.
- Source links and text do not automatically trigger another fetch, redirect outside the current validated response flow, or create a Supporting Source.
- Extracted content remains untrusted after sanitization; sanitization controls active content, not semantic Prompt Injection.
- The Research Agent receives only an exact Approved Normalized Source Version under Frozen Input and Context policy.
- Model output derived from Source data remains a Candidate and must pass independent validation and human gates.

## 12. Storage Boundaries

- Raw Snapshot is stored in restricted private Object Storage under immutable identity.
- Quarantine and failed or unvalidated objects are separated from formal Source objects by state and permission.
- Safe Source Candidate, Extracted Content, Safe Display, and Raw Snapshot are separate representations with explicit references.
- PostgreSQL stores authoritative Object Reference, ownership, classification, status, hashes, provenance, and lifecycle metadata.
- Temporary URLs are generated only for authorized bounded access and never stored as the permanent Object Reference.
- The Fetcher can write only to its assigned Source/quarantine paths and cannot browse arbitrary objects.
- Delete Request and Purge cover Snapshot, Extracted Content, Safe representation, temporary objects, and database references within the owned scope.
- A failed Object Storage write cannot be promoted as a usable Source result.

## 13. Fetch Result States

Fetcher results distinguish at least these conceptual outcomes:

- **Accepted for processing:** capture passed network and response policy and may proceed to extraction/review.
- **Fetch failed:** transport or response retrieval did not complete.
- **Validation blocked:** URL, destination, request, redirect, or other security policy denied the operation.
- **Unsupported content:** response type or representation is outside MVP scope.
- **Too large:** response or decompressed representation exceeded policy.
- **Timeout:** a bounded time limit expired.
- **Redirect blocked:** a hop, loop, scheme, destination, or count violated policy.
- **Extraction failed:** capture exists but controlled extraction did not produce a valid Candidate.
- **Awaiting review:** Safe Source Candidate exists but is not an Approved Normalized Source Version.

These are semantic distinctions, not a selected persisted Enum.

`M2-SRC-003` implements the API-owned recording of these outcomes. The Fetcher submits an exact-shape `fetcher-result/v1` payload to the private Result route using the gateway Secret and the current opaque claim; the API persists one terminal Result per Task and maps the seven Fetcher-supplied failure categories one-to-one to stable safe codes. Package-archive, role-capacity, and object-integrity outcomes are server-derived and cannot be submitted by the Fetcher. A failure Result Event carries only safe Task/Source identifiers, attempt, category, and code; the Gateway response carries the safe identifiers, attempt, terminal state, result category, optional Source ID, and duplicate marker, but never the persisted `safe_code`. Neither boundary exposes a URL, host, object key, claim, Secret, Candidate body, or raw error. A verified success must pass immutable-object integrity before any Source evidence is promoted; a failure never creates a Source, Working Copy, Version, or Approval.

## 14. Failure and Fallback

- Failure and security denial are formal, observable outcomes with stable categories and user-safe explanations.
- Fetch failure never creates a fake success, empty approved Source, or inferred article body.
- The user may supply Pasted Text or an allowed `.md`/`.txt` upload instead.
- Manual fallback still creates a formal Source Reference, Working Copy, immutable Normalized Source Version, Review, and Approval history.
- A security block cannot be bypassed through unlimited Retry, another User-Agent, user-supplied headers, Cookie forwarding, proxy selection, Browser automation, or manual override.
- Only eligible transient failures receive bounded automatic retry.
- Preserving the original URL for later does not mark the Source captured or approved.

## 15. Logging and Audit

Ordinary Fetcher telemetry may record:

- Source Reference ID and Task ID;
- Correlation ID;
- host hash or redacted host metadata;
- result and policy-denial category;
- response size and content type category;
- duration and attempt count;
- redirect count;
- redacted final-destination classification;
- stable error code.

Ordinary logs must not contain complete Source bodies, Cookies, Credentials, authorization headers, signed URLs, full response headers, full query strings carrying sensitive material, or Raw Snapshot bytes. Unusual security denials, including SSRF attempts, create or contribute to a distinct Security Audit Event under policy.

## 16. Fetcher Invariants

- Fetcher never reads Human Opinion.
- Fetcher has no Model Provider Credential.
- Every redirect is revalidated under the SSRF policy.
- The actual connection target must remain inside the validated public-address policy.
- Raw Snapshot is immutable and refetch creates a new Snapshot.
- Extracted Content and Safe Source Candidate do not become Approved automatically.
- Instructions in Source content have no execution, Tool, Command, or policy authority.
- A Security Block cannot be bypassed through Retry, Fallback, headers, Cookies, proxying, or Browser automation.
- User Cookies and internal Credentials are never forwarded.
- Fetcher never accesses restricted networks or internal services.
- Fetch failure can use Pasted Text or approved upload fallback without fabricating capture success.
- Raw Source and Safe Display remain separate.
- Temporary URL never becomes a permanent Object Reference.

## 17. Open Implementation Decisions

The following remain open and are not selected here:

- HTTP client;
- DNS pinning method;
- exact timeout;
- exact response and decompressed size limit;
- redirect limit;
- extraction library;
- content-type allowlist;
- retry policy;
- future strategy for JavaScript-heavy pages.

## 18. Decision Traceability

| Area | Accepted Decisions | Primary historical sources |
|---|---|---|
| Source layers, immutable Raw Snapshot, allowed inputs, approved normalization, and fallback | DEC-059–DEC-066 | [Session-011](../sessions/session-011.md) |
| Frozen Task input, failure, and Promotion eligibility | DEC-129–DEC-139 | [Session-017](../sessions/session-017.md) |
| Untrusted Context and tool/capability boundaries | DEC-177, DEC-185, DEC-190–DEC-192 | [Session-020](../sessions/session-020.md) |
| Private-by-default, principals, Prompt Injection, SSRF, safe display, upload, and security review | DEC-199–DEC-209, DEC-220 | [Session-021](../sessions/session-021.md) |
| Fetcher process, Queue minimization, identity, Object Storage, configuration, and telemetry | DEC-221, DEC-228, DEC-230–DEC-232, DEC-239–DEC-240 | [Session-022](../sessions/session-022.md) |
| Deterministic security, Queue, and SSRF release gates | DEC-245, DEC-249, DEC-259, DEC-262 | [Session-023](../sessions/session-023.md) |
| Public URL scope, staged implementation, horizontal security, and resilient MVP | DEC-268, DEC-280, DEC-284–DEC-285, DEC-293 | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
