# Decision Review — M2-DES-001

- **Title:** Public URL Fetcher Connection-Binding Decision Review
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Option B approved by the Human decision authority; this records an implementation direction, not Fetcher implementation authority
- **Role:** Decision Review Agent
- **Date:** 2026-08-01
- **Base commit:** `b71fc34cfe4c02b165ddce9baad2539c67bdd511` (`b71fc34`)
- **Review origin:** `main`
- **Approval record:** [Issue #45](https://github.com/JettxonHo/ContentOS/issues/45), Human decision authority approval in this task on 2026-08-01
**Allowed change:** this document only; no Fetcher, Source, Workflow, Queue, Worker, Web UI, or migration implementation

This review uses the repository Decision Review convention in [`decision-review-template.md`](../templates/decision-review-template.md). It records a bounded recommendation for the open DNS-pinning and actual-connection-binding decision in the Current-truth Fetcher boundary. It does not create or accept a new DEC and does not claim that Fetcher capability exists.

## Proposed change

Select a no-new-infrastructure, no-new-network-SDK mechanism for the future Fetcher to validate a public HTTP/HTTPS URL and bind each actual TCP/TLS connection to an address that was validated for that exact redirect hop.

The proposed choice stays inside the accepted Fetcher responsibility and does not alter the MVP input scope, Source lifecycle, Workflow semantics, or process topology. The Human decision authority approved Option B on 2026-08-01. This closes the connection-binding mechanism decision only; it does not close the separate Fetcher state-access or bounded resource-policy questions.

## Change category

- [ ] MVP scope
- [ ] Domain semantics
- [ ] Workflow
- [x] Security boundary — connection binding is the security-sensitive subject of this review; the existing boundary is preserved
- [ ] Agent responsibility
- [x] Technical architecture — a bounded standard-library transport abstraction is recommended; no new process or infrastructure is introduced
- [ ] Release Gate

## 1. Identification and authority

### Current accepted rule and evidence

The authoritative Current-truth rule is [`docs/security/source-fetcher.md`](../../security/source-fetcher.md) §5–§8 and §16–§17:

- only public `http` and `https` capture is in MVP scope;
- URL syntax, DNS, address, connection, port, response, and redirect policy are separate controls;
- loopback, private, link-local, multicast, unspecified, reserved, documentation, benchmarking, metadata, internal aliases, ambiguous address forms, IPv4-mapped IPv6, and unsafe redirects are denied;
- all usable DNS answers are evaluated, mixed allowed/restricted resolution is handled conservatively, and the actual connection target must remain within the validated public-address policy;
- every redirect is re-parsed, re-resolved, and revalidated;
- user Cookies, Authorization, arbitrary Headers, proxy selection, and Browser automation cannot bypass policy;
- the exact DNS-pinning and connection-binding mechanism is explicitly still open.

The relevant Accepted DEC groups are:

| Area                                                         | Accepted DEC                                | Constraint carried into this review                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source identity, immutable evidence, MVP inputs, fallback    | DEC-059–DEC-066, DEC-268                    | Public URL is a Source input; Raw Snapshot is distinct and immutable; failed URL capture has a manual fallback and cannot fabricate success.            |
| Identity, Versions, Heads, Approval, storage                 | DEC-161, DEC-163, DEC-165, DEC-167, DEC-169 | A fetch result is evidence for the Source pipeline; it does not itself create Approval or overwrite history.                                            |
| Privacy, input containment, Source safety, audit             | DEC-199, DEC-207–DEC-209, DEC-214           | External URL material is untrusted; Raw Snapshot and Safe Review representations remain separate; security denials are distinct audit evidence.         |
| Process and storage boundaries                               | DEC-221, DEC-228, DEC-230–DEC-232           | Fetcher is a separate least-privilege process with controlled public egress and scoped private Object Storage access; PostgreSQL remains authoritative. |
| Telemetry and configuration                                  | DEC-239–DEC-240                             | Logs are structured and redacted; process configuration is typed and fail-fast; Secrets are not part of this transport.                                 |
| Deterministic rules, recovery, zero tolerance, release gates | DEC-245, DEC-249, DEC-259, DEC-262          | Deterministic security rules are tested; SSRF, security-error bypass, and unrecoverable failure are blocking conditions.                                |
| M2 order and Work Item governance                            | DEC-280, DEC-287–DEC-293                    | Source/runtime foundations precede Agents; scope, contracts, tests, and security boundaries must be explicit before implementation.                     |

Later Accepted DEC governs an actual conflict. No conflict was found between these DEC and the recommendation below. The review does not edit `docs/decisions/**`, Sessions, or Accepted DEC.

### Current repository evidence

- `HEAD` and `origin/main` are both `b71fc34`; the worktree was clean before this document was added.
- Node.js is `v24.18.0`; Corepack pnpm is `11.17.0`.
- `apps/fetcher/src/main.ts` is still a lifecycle skeleton. There is no URL fetch, DNS policy, connection binder, redirect handler, or Raw Snapshot capture implementation.
- Existing Source behavior is limited to pasted text and `.md`/`.txt` upload capture and approval. It must remain unchanged by this review.

### First-party runtime evidence

This review uses only official Node.js v24 documentation for the runtime capability assessment:

- [`dnsPromises.lookup` and `Resolver` APIs](https://nodejs.org/download/release/latest-v24.x/docs/api/dns.html) provide address resolution APIs, including all-address results and an independent resolver. Node also warns that `lookup` uses an operating-system facility and is not necessarily a DNS protocol query; the recommendation therefore uses an explicit `Resolver` path for the Fetcher policy rather than treating `lookup` as a security control.
- [`http.request` options](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html#httprequestoptions-callback) expose a custom `lookup` and `createConnection` boundary. The recommendation does not rely on the default hostname resolution path.
- [Node HTTP Agent and built-in proxy support](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html#class-httpagent) document that proxy behavior can be enabled from environment variables. The recommendation uses a dedicated direct transport and rejects proxy-enabled Fetcher runtime configuration.
- [`net.createConnection`](https://nodejs.org/download/release/latest-v24.x/docs/api/net.html#netcreateconnectionoptions-connectlistener) can initiate a TCP connection to a supplied host/address.
- [`tls.connect`](https://nodejs.org/download/release/latest-v24.x/docs/api/tls.html#tlsconnectoptions-callback) accepts an already connected socket, keeps certificate verification enabled by default, and supports explicit `servername`/`checkServerIdentity` behavior for TLS identity.

## 2. Problem statement

### Why URL validation, DNS preflight, and ordinary `fetch(url)` are insufficient

URL parsing establishes only that a string can be interpreted as a URL. It does not prove that the destination is public, that all DNS answers are permitted, or that the eventual socket will use the checked address.

A DNS preflight followed by ordinary `fetch(url)` has a time-of-check/time-of-use gap. The later client may resolve the hostname again, select a different address, reuse a pooled connection, follow a redirect, use a configured proxy, or otherwise choose a route that the preflight never validated. This is precisely the unsafe pattern that this review must not approve.

Node's ordinary `fetch`/default HTTP path is therefore not the proposed security boundary. The future Fetcher must own the complete sequence: normalize one hop, resolve one hop, classify every answer, create one socket to a validated numeric address, preserve HTTP/TLS identity separately, and handle redirects manually.

### Threat and required control matrix

| Threat                                        | Failure mode                                                                                                                          | Required control in the future Fetcher                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DNS rebinding                                 | Initial validation sees a public address, while the later connection resolves the same name to a private or loopback address.         | Never connect by hostname after validation. Connect to a selected numeric address from the validated evidence; if a later attempt re-resolves, create new evidence and re-run the complete policy.                                                                    |
| Mixed DNS answers                             | A hostname returns both public and restricted A/AAAA answers and the client selects whichever is convenient.                          | Evaluate all usable answers. Fail closed when any answer is restricted or policy cannot establish a safe set. Do not silently discard the restricted answer.                                                                                                          |
| Loopback/private/link-local/reserved/metadata | A public-looking URL reaches local services, cloud metadata, platform control, or non-routable space.                                 | Deterministic address policy covering IPv4 and IPv6 categories, including mapped/encoded/ambiguous forms; reject before connection and verify the connected peer.                                                                                                     |
| IP literal bypass                             | A user avoids DNS policy with decimal, hexadecimal, shortened, mapped, bracketed, or otherwise ambiguous address syntax.              | Canonicalize and classify IP literals before any request. Allow only explicit canonical public forms under the same address policy; reject ambiguous and IPv4-mapped IPv6 representations.                                                                            |
| Internal aliases                              | `localhost`, local names, internal suffixes, or resolver-provided aliases point to protected networks.                                | Deny known local/special/internal alias forms and classify the resolved addresses. A hostname is never trusted merely because its spelling is not obviously private.                                                                                                  |
| Redirect bypass                               | A permitted URL redirects to a private host, a different scheme/port, a loop, or an unbounded chain.                                  | Disable automatic redirects. Resolve `Location` relative to the current URL and perform the complete validation and connection-binding sequence for every hop.                                                                                                        |
| Proxy bypass                                  | `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, Node proxy flags, or a global dispatcher routes traffic through an unvalidated intermediary. | Use a dedicated direct transport, never the global agent/dispatcher, do not accept user proxy settings, and fail fast when proxy-enabled runtime configuration is present.                                                                                            |
| Host confusion                                | A request connects to one address but sends a misleading or attacker-controlled `Host` header.                                        | Derive one controlled authority from the normalized URL. Do not accept arbitrary request headers. The Host value is an HTTP virtual-host selector, never proof of the TCP destination.                                                                                |
| SNI confusion                                 | TLS connects to a numeric address but presents a different name, disables verification, or checks the wrong certificate identity.     | For hostname URLs, use the normalized canonical hostname as SNI and certificate identity while the TCP socket uses the validated numeric address. Keep CA and hostname verification enabled. For IP literals, omit SNI and verify the certificate for the IP literal. |
| Cross-hop credential leakage                  | Cookies, Authorization, or arbitrary headers cross an origin or redirect.                                                             | Fetch is bounded read-only GET behavior with no user headers, cookies, credentials, request body, or proxy credentials.                                                                                                                                               |

## 3. Authority and invariants

### Responsibility boundaries

| Boundary       | Owns                                                                                                                                                                                                                           | Must not do                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API            | Authentication, owner authorization, Source/Package commands, Task creation through the owning use case, and safe user-facing failure/fallback presentation.                                                                   | Perform public URL fetch inline, accept arbitrary fetch headers, or turn a Fetcher result into Approval.                                               |
| Fetcher        | URL parsing/normalization, destination policy, DNS evidence, actual connection binding, bounded read-only response retrieval, per-hop redirect validation, immutable Raw Snapshot handoff, and explicit result classification. | Read Human Opinion or Research, call Model Providers, follow arbitrary links, bypass access controls, approve a Source, or write general Domain state. |
| Object Storage | Private scoped storage of immutable Raw Snapshot bytes and integrity metadata through the existing `ObjectStore` Port.                                                                                                         | Provide public ACLs, browser-direct access, permanent signed-URL references, or accept an unverified/partial successful snapshot.                      |
| Source         | Own Source Reference, Raw Snapshot metadata, Working Copy, Versions, Heads, and human Approval semantics.                                                                                                                      | Treat bytes fetched by the Fetcher as an Approved Normalized Source Version automatically.                                                             |
| Workflow       | Own Task/Node/Workflow coordination, retry eligibility, cancellation, lease/reconciliation, and user-visible progress once its separate foundation exists.                                                                     | Be invented inside this connection-binding review or let Queue state replace PostgreSQL truth.                                                         |

### Non-negotiable invariants

1. The Fetcher process has controlled public HTTP/HTTPS egress, no Model Provider Credential, no Human Opinion access, no general Domain-write authority, and only scoped Snapshot/quarantine access.
2. The accepted scheme scope remains public `http` and `https`. No authenticated capture, browser automation, arbitrary crawling, or access-control bypass is introduced.
3. Every request hop has one canonical normalized URL identity, one destination-policy decision, one complete resolution evidence set, and one connection-binding result.
4. The actual TCP peer must equal the selected address from the validated evidence. A socket created from the hostname, a proxy connection, or an opaque default client path is not proof of binding.
5. HTTPS certificate verification remains enabled. Hostname URLs use the canonical hostname for SNI and certificate identity; the connected TCP address remains the validated numeric address.
6. The Host header is derived by the Fetcher from the normalized authority. User Cookies, Authorization, proxy credentials, and arbitrary Headers never participate.
7. Redirects are manual and per-hop. Same-origin redirects are not exempt from policy; cross-origin redirects do not inherit credentials because no credentials exist.
8. A security denial is a formal observable Security Error. Retry, fallback, provider switching, user-agent changes, browser automation, or manual override cannot turn it into success.
9. A Raw Snapshot is created only after the complete response passes transport, size, duration, protocol, content-type, and integrity policy and the immutable object write has been verified. Partial bytes never become a successful Snapshot.
10. A Fetcher result is not a Source Approval. Research remains eligible only for an exact human-approved Normalized Source Version.

## 4. Options considered

### Summary comparison

| Option                                                                                            | Actual connection binding                                                                                                                                                  | DNS / redirects / identity                                                                                                                                                                                               | Proxy and headers                                                                                                                                              | Dependencies, governance, testing, and recovery                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. URL syntax/DNS precheck, then ordinary `fetch(url)`                                            | **No.** The later client owns resolution and connection selection; preflight is not binding.                                                                               | Cannot prove that the connection used the checked answer. Automatic redirect/default dispatcher behavior can bypass per-hop policy. Host/SNI are controlled by the client path rather than one Fetcher binding contract. | May inherit a global dispatcher or proxy-enabled runtime; arbitrary default request behavior is too broad.                                                     | No new package, but fails the Current-truth SSRF invariant and cannot be accepted or recovered as a safe Fetch result.                                                                    |
| B. Node 24 standard library with Fetcher-owned resolution, address policy, and connection binding | **Yes, conditionally and testably.** Resolve all answers, classify them, connect to a validated numeric address, and verify the connected peer before response acceptance. | Manual redirect loop; fresh evidence per hop. Native TLS verification with canonical hostname SNI and controlled Host authority. No second hostname resolution after binding.                                            | Dedicated direct transport; no global agent/dispatcher, no proxy environment participation, no user headers/cookies/credentials.                               | No new dependency or infrastructure. Deterministic unit/security tests plus local socket tests can prove the invariant; failures remain classified and retryable only when policy allows. |
| C. New third-party HTTP/DNS SDK, proxy, or external SSRF service                                  | **Potentially, but only if the new component provides a verified bind-to-address contract.** A generic SDK or proxy alone does not prove it.                               | Must still specify per-hop validation, TLS SNI/certificate identity, Host authority, and DNS evidence. An external service introduces another trust boundary and may obscure evidence.                                   | Proxy changes the destination path and may make the intermediary the actual peer; user/environment proxy behavior must still be denied or explicitly governed. | Violates the no-new-dependency/infrastructure constraint for this task. Requires separate package/provider/license/security/architecture review and new failure/recovery evidence.        |

### Option A — precheck then ordinary `fetch(url)`

Reject. URL parsing and a DNS preflight are useful validators but not a connection-binding mechanism. The ordinary request can resolve again, connect to another address, follow redirects, reuse a connection, or route through a proxy/global dispatcher. A passing preflight therefore cannot support the claim “the actual connection was bound to the verified public address.” It also makes it difficult to preserve auditable DNS and connection evidence for each hop.

### Option B — Node 24 standard library with explicit binding

Approved by the Human decision authority. The future implementation should define framework-independent Fetcher-owned abstractions with this sequence:

1. **Submission and normalization:** preserve the submitted reference separately; parse one controlled URL representation; reject credentials, fragments for network use, unsupported schemes, ambiguous host forms, known local/internal aliases, and disallowed ports. Use one canonical ASCII hostname/authority for policy, DNS, Host, and TLS identity; never replace the original provenance reference.
2. **Destination policy:** if the host is an IP literal, canonicalize and classify it directly. For a hostname, resolve both applicable address families through a controlled Node resolver path and collect all usable answers. Reject loopback, private, link-local, multicast, unspecified, reserved, documentation, benchmarking, metadata, mapped, and otherwise restricted addresses. Reject the whole resolution when any usable answer is restricted or when the answer set is indeterminate. Do not use reverse DNS as an allow signal.
3. **Binding:** choose an address from the validated public set under a deterministic bounded attempt policy. Create the TCP socket with the numeric address and expected family, not the hostname. After connect, compare the socket's observed remote address/family with the selected validated address; mismatch is a Security Error. Do not re-resolve while retrying addresses from the same evidence. If a fresh resolution is needed, record fresh evidence and re-run the full policy.
4. **TLS identity:** for HTTPS hostname URLs, wrap the already connected TCP socket with native TLS verification, `rejectUnauthorized` enabled, and the canonical hostname as SNI/certificate identity. For HTTPS IP literals, do not send an IP as SNI; let native certificate verification validate the IP identity and fail if the certificate does not match. Never disable CA or hostname verification.
5. **HTTP identity:** send a controlled GET with a Host authority derived from the normalized URL, including a port only when the normalized authority requires it. Do not accept caller-supplied Headers, Cookies, Authorization, request bodies, or proxy credentials. The Host header selects the virtual host; it is not used as evidence that the TCP peer is safe.
6. **Transport policy:** use the standard-library `http`/`https` request boundary with a Fetcher-owned `createConnection`/bound-socket factory or equivalent direct transport abstraction. Do not use ordinary `fetch(url)` or a global agent/dispatcher. Use one fresh bound connection per request hop; connection pooling and reuse are out of the first implementation boundary unless separately proven safe.
7. **Redirects:** do not enable automatic redirect following. Resolve each `Location` against the current normalized URL, then repeat normalization, destination policy, resolution, binding, TLS/Host identity, and response policy. Store submitted reference, hop metadata, and final URL as distinct facts. A loop, prohibited hop, policy failure, or limit exhaustion is formal failure.
8. **Proxy configuration:** construct the direct transport so Node proxy support is not enabled. The Fetcher must not invoke global proxy configuration, inherit `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` (including lowercase forms), or accept proxy flags. Fail fast on a proxy-enabled Fetcher runtime rather than silently accepting an environment-dependent route. `ALL_PROXY`/`all_proxy` and equivalent application-level proxy settings are also denied even if not consumed by Node core.

Node 24 supplies the socket, resolver, request, and TLS primitives; it does not supply ContentOS's address classification, internal-alias policy, redirect policy, response bounds, or evidence model. Those remain deterministic Fetcher-owned code and contracts, with no package installation.

### Option C — new SDK, proxy, or external service

Reject for this Work Item. A third-party client can be considered only if it exposes a verifiable numeric-address connection hook, preserves native TLS identity semantics, permits manual redirect control, disables proxy inheritance, and exposes enough evidence for the required tests. A generic HTTP client, DNS library, proxy, or SSRF SaaS does not automatically meet those conditions. Introducing one would require a separate bounded dependency/provider and security review; it is neither installed nor selected here.

## 5. Recommendation

### Recommended decision

**Recommend Option B: a Fetcher-owned, Node 24 standard-library transport that resolves and classifies every hop, then binds the actual socket to a validated numeric public address.**

This is the smallest reversible choice that satisfies the explicit Current-truth invariant without a new infrastructure product, proxy, service, HTTP SDK, or DNS SDK. It is also the only compared option that can make the required claim auditable: the resolution evidence, selected address, observed connected peer, TLS identity result, and redirect hop can be tested as one bounded sequence.

This approval is not Fetcher implementation approval. `M2-FETCH-001` remains Not Ready until its separate blocking design questions are closed in a Ready Work Item.

### Required abstraction boundary, without code

The implementation should keep these concepts separate; names are illustrative and are not final API, database, Queue, or enum contracts:

- **URL submission / normalization:** original reference, normalized request identity, canonical host/authority, scheme, port decision, and fragment/provenance distinction.
- **Destination policy:** allowed, denied, or indeterminate result with a stable reason category and redacted policy evidence.
- **Resolution provider:** all usable A/AAAA address evidence for one canonical hostname, with resolver outcome and timing; it does not decide whether an address is safe.
- **Address policy:** deterministic classification of IPv4, IPv6, IP literal, mapped, reserved, metadata, and ambiguous forms; it does not open sockets.
- **Connection binder:** consumes one validated address set and creates a numeric-address socket; it verifies the observed peer and never performs an unvalidated hostname connection.
- **TLS binder:** wraps the already connected socket, preserving canonical hostname SNI/certificate identity and native verification semantics.
- **Bound HTTP transport:** emits only Fetcher-controlled read requests over the bound socket and returns response metadata/body streams within resource policy.
- **Redirect controller:** owns hop limits and re-enters normalization, resolution, policy, binding, TLS, and response validation for every hop.
- **Fetch result/evidence:** returns a semantic result and minimum redacted evidence; it does not create Source Approval or mutate Workflow truth.

### HTTP and HTTPS decision

Both public HTTP and HTTPS remain allowed because that is the accepted MVP input scope. Both schemes use the same destination, address, port, redirect, proxy, header, size, and timeout policy. HTTPS adds native certificate and hostname/IP identity validation. An HTTPS-to-HTTP redirect is not treated as a credential leak because Fetcher sends no credentials or user headers, but any such hop must still pass the complete policy. Changing the accepted scheme set or adding an HTTPS-only rule would require its own scope/security decision.

### IPv4, IPv6, IP literal, and mixed-resolution decision

- Canonical public IPv4 literals may be considered directly under the address policy.
- Canonical public IPv6 literals may be considered directly under the address policy; zone identifiers and ambiguous spellings are denied.
- IPv4-mapped IPv6 and alternate numeric/encoded/shortened representations are denied rather than normalized into a second policy path.
- Hostnames are evaluated across all usable IPv4 and IPv6 answers. A mixed answer containing any restricted or indeterminate address fails closed; an all-public set may be used only through numeric-address binding.
- HTTPS hostname connections use the canonical hostname for SNI and certificate identity. HTTPS IP-literal connections omit SNI and must pass native IP certificate validation.

### DNS rebinding decision

The Fetcher never relies on a “public at check time” statement. It captures a complete answer set, validates it, and connects to a numeric address from that set. A later DNS change cannot redirect that already-bound socket. Any new resolution attempt creates new evidence and is rejected unless the new complete answer set independently passes. No automatic client behavior may perform a hidden second hostname resolution.

## 6. Proposed bounded contract for `M2-FETCH-001`

This is an interface-level proposal only. It deliberately does not define database tables, final API routes, Queue payloads, persisted enum names, Workflow Schema, or fixed numeric limits that Current-truth leaves open.

### URL submission input

- One user-supplied URL reference plus the assigned Fetch Task/owner context required by the existing process boundary.
- Read-only retrieval only; no caller-selected method, request body, Cookie, Authorization, proxy, arbitrary Header, Browser Session, or credential.
- The Fetcher receives the minimum policy/configuration metadata needed for the assigned task.

### Original reference and normalized request identity

Maintain both:

- **Original reference:** the submitted value retained for provenance and user-facing retry/fallback context, subject to safe redaction when logged.
- **Normalized request identity:** the canonical URL used for one network hop, with normalized scheme, canonical hostname/authority, explicit port decision, path/query representation, and fragment removed from the network request.

The final URL and every redirect hop remain distinct from the original reference. Canonicalization must account for Unicode/IDN, punycode, case, trailing dots, user information, bracketed IPv6, zone identifiers, and ambiguous host forms before policy evaluation.

### Destination-policy result

The result must communicate, conceptually:

- the normalized hop identity;
- allowed, denied, or indeterminate outcome;
- public-address classification evidence or a safe denial reason;
- scheme/port policy result;
- whether a proxy or unsupported request feature was denied;
- the correlation and hop context needed to diagnose the decision without exposing content or credentials.

No policy result grants a connection by itself. Only a subsequent binder may create a socket from an allowed result.

### DNS resolution evidence

For hostname hops, retain minimum evidence for one resolution attempt:

- canonical hostname and hop context;
- resolver path and queried address families;
- complete usable answer set or a safe resolution failure;
- per-address family and public/restricted/indeterminate classification;
- evidence timestamp and bounded attempt context;
- redacted/hash representation for ordinary diagnostics.

Raw DNS payloads, full resolver configuration, and private diagnostic material are not ordinary logs. A mixed allowed/restricted result is not reduced to the allowed subset.

### Connection-binding result

For each attempted connection, the conceptual result includes:

- the selected validated address and family;
- the connection evidence identity it came from;
- the observed connected peer address/family and comparison result;
- HTTP or HTTPS transport result;
- for HTTPS, native certificate-authority and hostname/IP identity result, canonical SNI decision, and authorization result;
- a safe failure category when binding or TLS fails.

The result is unsuccessful if the observed peer differs from the validated selection, if TLS verification fails, if the transport uses a proxy, or if the request path performs hidden hostname resolution.

### Redirect-hop evidence

For every hop, preserve distinct metadata for:

- source hop identity;
- response redirect status and bounded Location interpretation;
- normalized target identity;
- target destination-policy and resolution result;
- target connection-binding result;
- final response or redirect failure category.

Location values are untrusted input. Credentials, unsupported schemes, prohibited ports, loops, and policy failures are formal results. Redirect response bodies are not successful Source content.

### Stable failure categories

Use the existing semantic distinction from `source-fetcher.md`, not an ad hoc success/failure Boolean. Future API/Domain/Workflow contracts may map these concepts into their own versioned shapes:

- invalid or unsupported URL reference;
- disallowed scheme, host form, port, or destination;
- DNS resolution failure or indeterminate/mixed answer;
- connection-binding or peer-mismatch failure;
- TLS verification or identity failure;
- redirect blocked, looped, or limit-exhausted;
- transport failure;
- timeout;
- response policy failure;
- unsupported content;
- response/decoded body too large;
- extraction failure;
- object-storage or integrity failure.

Security denials remain Security Errors and are not ordinary transient failures. Only eligible transient failures may be retried under the later Workflow policy.

### Safe diagnostics

Ordinary logs may contain only minimum redacted facts such as Source/Task/Correlation identity, hop index, scheme, host hash or safe host metadata, result category, address family/classification, redirect count, bounded size/duration, and attempt count. They must not contain complete URLs with sensitive query data, Source bodies, Cookies, Authorization, proxy credentials, full response headers, signed URLs, or Raw Snapshot bytes.

Unusual destination denials and suspected SSRF attempts contribute to a distinct Security Audit Event under the existing policy. Restricted evidence is separately authorized and audited; it is not promoted into ordinary telemetry by this review.

### Raw Snapshot and failure rule

- Create the immutable Raw Snapshot only after the final response has completely passed request, connection, TLS, redirect, response, content-type, size, decompression, timeout, and integrity policy and the private object write has been verified.
- A partial/interrupted body, failed object write, failed integrity check, blocked redirect, DNS rebinding signal, or security denial cannot create a usable Snapshot or fake Source success.
- A failed URL capture returns an explicit classified failure and exposes the accepted manual paths: retry when eligible, paste text, upload `.md`/`.txt`, preserve the URL for later, or remove the Source. No fallback bypasses a Security Error.

## 7. Ready / Not Ready assessment for `M2-FETCH-001`

### Current status

**`M2-FETCH-001`: Not Ready.** The connection-binding mechanism is now approved, but the separate bounded resource-policy and Fetcher state-access questions remain unresolved. Creating implementation code before those questions are closed in a Ready Work Item would still silently choose open design details.

### Conditional Ready boundary after remaining blockers close

After the remaining blocking design questions are explicitly closed, a Ready Work Item may be created with this bounded scope:

- implement the Fetcher-owned normalization, destination policy, resolver evidence, numeric-address connection binder, native TLS identity handling, controlled Host authority, direct no-proxy transport, manual redirect loop, bounded response handling, result evidence, and deterministic tests;
- integrate only with the existing Source/ObjectStore Ports and the already accepted Fetcher process boundary;
- preserve original URL reference, redirect/final URL distinction, immutable Raw Snapshot rules, and manual fallback;
- choose exact reversible timeout, size, content-type, retry, and redirect-limit values as Work Item implementation details without changing the accepted security categories or MVP scope;
- document the accepted mechanism in the Current-truth Fetcher specification as part of the future Ready Work Item.

### Proposed file and module boundary for the future Work Item

The future Work Item must name exact paths, but its boundary should be limited to:

**Allowed modules/files, subject to final Work Packet naming:**

- `apps/fetcher/**` for process composition and Fetcher-owned transport/policy implementation;
- a narrowly named framework-independent Source/Fetcher Port area only if an existing owning module contract requires it;
- Fetcher unit/security tests and isolated local integration fixtures;
- `packages/testing/**` only for Fetcher-specific deterministic test support;
- the Fetcher Current-truth documentation and a new M2-FETCH Work Packet.

**Prohibited unless separately authorized:**

- `apps/web/**`, public Source UI, or browser-side fetch behavior;
- inline public fetching in `apps/api/**` or API-owned bypasses;
- `apps/worker/**`, Agent, Research, Provider, Browser, Renderer, or publishing work;
- new `packages/database/**` migrations, new Source tables, or direct cross-module writes;
- generic Workflow/Queue/Outbox/SSE implementation or a new Workflow authority;
- `docs/decisions/**`, Sessions, or Accepted DEC edits;
- any new dependency, proxy, SSRF service, DNS service, or infrastructure product without a separate approved review.

### Required future tests and evidence

The Work Item must select static, unit, validator, security, local integration, failure-injection, and relevant object-storage tests. It must include the test strategy in §8 and prove that failure leaves no persisted Source/Snapshot state. It must not use a real public-web fetch as its only or primary pass evidence.

### Blocking Design Questions

The following must be closed before `M2-FETCH-001` can be marked Ready:

1. Exact reversible resource values and content-type policy for the first Fetcher Work Item, while preserving the accepted bounded categories.
2. The already-open Fetcher state-access mechanism and its minimum Task/Source contract; it must not invent generic Workflow persistence here.
3. A separate Workflow foundation review for Workflow persistence/API/Schema/enum/Task/Outbox/Queue/SSE decisions. Those questions are not solved by this connection-binding review and must not be folded into `M2-FETCH-001`.

If the Human rejects Option B, requests a proxy/provider/SDK, changes the scheme or destination policy, or changes the Fetcher process/permission boundary, the next action is a new Decision Review and possibly a new DEC before implementation.

## 8. Test strategy proposal

All tests are deterministic and use fake resolver/binder evidence or loopback-only controlled fixtures. No real public-web fetch is a pass requirement or completion claim.

### Destination and address policy

- Reject IPv4 and IPv6 loopback, private, link-local, multicast, unspecified, reserved, documentation, benchmarking, metadata, and other restricted destinations.
- Reject known local/internal aliases and malformed/ambiguous hostname forms.
- Cover canonical IPv4 literals and canonical public IPv6 literals.
- Reject IPv4-mapped IPv6, zone identifiers, encoded/shortened/numeric alternate forms, and equivalent restricted representations.
- Cover hostnames with IPv4-only, IPv6-only, and mixed public answers.
- Mixed public/restricted DNS answers fail closed even when a public answer is available.

### DNS rebinding and connection binding

- A resolver that returns public on the first call and restricted on a later call cannot cause a request to reach the restricted address; the first request uses only the validated numeric address.
- A fresh resolution after an attempted retry is revalidated as a complete answer set.
- The socket peer address/family must match the selected validated address; injected mismatch fails closed.
- Hostname connections never invoke a hidden second DNS resolution after the binder has selected an address.

### Redirects and identity

- Revalidate every relative, absolute, same-origin, and cross-origin redirect hop.
- Reject redirects to loopback/private/link-local/reserved/metadata targets, unsupported schemes, prohibited ports, userinfo, loops, and limit exhaustion.
- Verify HTTP Host authority is derived from the normalized hop, not from user input or the connected IP.
- Verify HTTPS hostname hops preserve canonical hostname SNI and native certificate identity while connecting to the validated numeric address.
- Verify HTTPS IP-literal hops omit SNI and use native IP certificate validation.

### Proxy and request policy

- Proxy-related environment variables and Node proxy flags cannot influence the Fetcher transport.
- A configured global proxy/global dispatcher is not used.
- User Cookies, Authorization, proxy credentials, arbitrary Headers, request bodies, and non-read methods are rejected or absent from the Fetcher contract.

### Resource and response policy

- Timeout, response/header/body/decompressed-size, content-type, and redirect-limit failures are formal bounded failures.
- Partial/interrupted bodies cannot produce a successful Raw Snapshot.
- Unsupported, login, CAPTCHA, empty-shell, or access-denied responses are not silently represented as article content.
- Object Storage write/integrity failure cannot produce a persisted successful Source/Snapshot reference.

### Fallback and persistence

- URL failure exposes retry/manual fallback/preserve/remove choices without security bypass.
- Every failed capture path creates no fake Source success and no usable Raw Snapshot.
- Security denial is not converted to Warning, ordinary retry, or manual override.
- A successful Raw Snapshot is immutable; a refetch creates a new Snapshot identity under the existing Source rules.

## 9. Explicit non-goals and limitations

This review does not implement or decide:

- HTML extraction, sanitization, Safe Display, remote-resource internalization, malware scanning, or content safety beyond the Fetcher network/response boundary;
- Workflow Template, Workflow Instance, Node, Task, Outbox, BullMQ, Lease, Reconciliation, SSE, Polling, or Timeline persistence/API/Schema/enum behavior;
- Source UI, Research, Agents, Model Providers, Prompt handling, Browser automation, Renderer, Export, or publishing;
- authenticated URLs, Cookies, paywall/CAPTCHA/region/Access Control bypass, arbitrary crawling, link following, or autonomous search;
- a third-party HTTP/DNS package, proxy, SSRF SaaS, cloud DNS service, or new infrastructure product;
- exact timeout, response-size, decompressed-size, content-type, retry, and redirect-limit numbers;
- production firewall syntax, service-account/IAM policy syntax, deployment vendor, or network-provider selection;
- any claim that the current Fetcher is usable or that a public URL has been fetched.

The recommendation also has a known implementation limitation: Node core provides networking primitives, not a ready-made “public IP” classifier. The future Fetcher must implement and test the deterministic IPv4/IPv6 policy itself. If that policy cannot be implemented and independently tested without a new dependency, implementation must stop and return `HUMAN_DECISION_REQUIRED` rather than silently weaken the address policy.

## 10. Decision Review outcome

### Decision recorded

The Human decision authority approved Option B on 2026-08-01: a future `M2-FETCH-001` must use Fetcher-owned resolution and destination policy, numeric-address TCP binding, preconnected-socket TLS with canonical hostname identity, controlled Host authority, direct no-proxy transport, and manual per-hop redirect validation.

The approval preserves the current public HTTP/HTTPS scope, Fetcher process boundary, private storage, Source lifecycle, human Approval, and release gates. It does not authorize code or turn `M2-FETCH-001` into a Ready Work Item.

### Formal outcome

- [x] Accepted
- [ ] Rejected
- [ ] Deferred

### Whether a new DEC is required

**Not required for the decision as accepted**, because it preserves the accepted public HTTP/HTTPS scope, existing process isolation, private storage, Source lifecycle, human Approval, and release gates; it selects an explicitly open implementation mechanism. Human approval is recorded in this review and in Issue #45; the later Ready Work Item must retain this traceability.

A new DEC is required if the accepted outcome instead adds infrastructure, a proxy/provider/SDK, changes the scheme or destination policy, changes Fetcher identity/egress, changes Source/Workflow authority, changes an Accepted security invariant, or changes a release gate. This review does not make any such change.

### M2-FETCH-001 status

**Not Ready at review close.** It becomes eligible for Ready assessment only after closure of the separate Workflow/state-access and bounded resource-policy questions. No M2-FETCH-001 implementation, Work Item creation, or capability claim is authorized by this document alone.

## 11. Verification record

### Commands and results

The following read-only checks were performed before this document was added:

- `git status --short --branch` — `main`, clean at review start, tracking `origin/main`.
- `git log -1 --format='%H%n%h%n%ad%n%D' --date=iso-strict` — base `b71fc34cfe4c02b165ddce9baad2539c67bdd511`, dated 2026-08-01, `HEAD -> main`.
- `node --version` — `v24.18.0`.
- `corepack pnpm --version` — `11.17.0`.
- Repository search — confirmed the Fetcher application is a lifecycle skeleton and no URL-fetch/DNS-binding implementation exists.
- Official Node.js v24 documentation review — confirmed the standard-library resolver, request connection, TCP, TLS, and proxy-control primitives cited in §1.

The following checks are required after adding this document and are recorded by the final task report:

- `corepack pnpm repository:check`
- `corepack pnpm format:check`
- `git diff --check`
- exact changed-file and Git status inspection

No implementation, migration, public fetch, real-public-network capture, Queue run, or Source persistence test was executed by this Decision Review.

## 12. Files changed

Only this new file is authorized:

- `docs/implementation/work-packets/m2-des-001-public-url-fetcher-connection-binding.md`

No Accepted DEC, Session, Current-truth source, application code, package dependency, migration, API, Queue, Workflow, UI, or Git commit was changed by this review.
