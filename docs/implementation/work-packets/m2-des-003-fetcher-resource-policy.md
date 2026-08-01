# Decision Review — M2-DES-003

- **Title:** First-release Public URL Fetcher Resource Policy
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Human authority approved Option B on 2026-08-01; this remains planning authority only
- **Date:** 2026-08-01
- **Base commit:** `d76d18a1998e501290999130c42fae61d179283e` (`d76d18a`)
- **Issue:** [#49](https://github.com/JettxonHo/ContentOS/issues/49)
- **Branch:** `codex/m2-des-003-fetcher-resource-policy`
- **Allowed change:** this document only; no Fetcher, Source, Workflow, Queue, API, migration, configuration, dependency, or application implementation

This review selects the first-release resource and response policy that a later public URL Fetcher implementation must enforce. It completes only the values and categories left open by the Current-truth Fetcher boundary and the accepted connection-binding decision. It does not select a parser, an extraction library, a URL API, a Task Contract, a Queue Contract, a persistence Schema, or implementation code.

## Proposed change

Adopt a deliberately narrow first-release **single-attempt text snapshot policy**:

```text
one active public capture per Fetcher process
  → one Fetch Task attempt
  → initial request plus at most five validated redirects
  → bounded response headers and encoded bytes
  → bounded streaming decompression
  → only supported text response types
  → complete verified immutable snapshot or explicit failure
```

The Fetcher must make **no automatic network retry**. A transient failure remains an explicit classified result. A later, authorized owner Retry Command may create a new Task attempt only through the approved Workflow/API authority and must execute the entire policy again from the submitted URL. A security block can never become retryable success.

## Change category

- [ ] MVP scope
- [ ] Domain semantics
- [x] Workflow — explicit retry boundary and Task resource budget
- [x] Security boundary — external-input, denial-of-service, and response-eligibility controls
- [ ] Technical architecture
- [ ] Agent responsibility
- [ ] Release Gate

## 1. Authority and current gap

The proposal preserves, rather than changes, the following accepted rules:

| Constraint                                                                                                     | Authority                                                 | Consequence                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public `http` and `https` URL capture is an MVP Source input; failure has explicit manual fallback             | DEC-059–DEC-066, DEC-268                                  | The policy may bound one capture, but cannot remove Pasted Text, allowed file upload, preserve, remove, or explicit Retry paths.                 |
| URL, DNS, address, connection, port, redirect, response, and extraction policy are separate controls           | Source Fetcher §§4–10                                     | These limits do not weaken per-hop validation or silently select URL/connection behavior.                                                        |
| A Raw Snapshot is immutable; partial/interrupted data cannot become a successful Snapshot                      | DEC-061, DEC-163; Source Fetcher §§9 and 12               | Limit exhaustion destroys the in-flight capture/quarantine object and records a failure; it cannot publish partial Source evidence.              |
| Security error is distinct and cannot be bypassed by retry, fallback, headers, proxying, or Browser automation | DEC-207, DEC-245, DEC-259; Source Fetcher §§5, 14, and 16 | Validation, SSRF, TLS, redirect, and policy failures have no automatic retry.                                                                    |
| Fetcher has one restricted public-egress responsibility and minimum state access                               | DEC-221, DEC-230–DEC-232; M2-DES-002                      | Resource limits do not grant general network, database, Source, or Workflow authority.                                                           |
| Queue is delivery only; PostgreSQL/owning Use Cases determine Task truth and recovery                          | DEC-226, DEC-228–DEC-229, DEC-238, M2-DES-002             | A delivery redelivery is not permission to make another external request after a terminal result.                                                |
| First Fetcher transport binds each connection to a validated address and handles redirects manually            | M2-DES-001                                                | Every attempted hop remains subject to full normalization, address policy, numeric connection binding, TLS/Host identity, and no-proxy controls. |

`docs/security/source-fetcher.md` §8 and §17 deliberately leave exact timeouts, size limits, redirect limit, content-type allowlist, and retry policy open. M2-DES-001 also leaves these values open before `M2-FETCH-001` can become Ready. This review closes that gap without introducing a new dependency, provider, service, or public capability.

## 2. External technical evidence

- Node's supported HTTP client controls include `maxHeaderSize`, `AbortSignal`, a request timeout, and streamed response handling. It does not impose this product's complete body, decompression, redirect, or total-task policy, so ContentOS must set those controls explicitly. [Node HTTP v24](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html#httprequestoptions-callback)
- Node documents that its HTTP interfaces can receive large or chunked messages and must be consumed as streams. The Fetcher must therefore stop the stream as soon as a bound is exceeded instead of accumulating response data in memory. [Node HTTP v24](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html)
- OWASP's Node SSRF guidance calls for short timeouts, no automatic redirects, and no automatic retries. ContentOS already requires manual per-hop redirect validation; the no-automatic-retry rule removes a second route to repeated public egress. [OWASP SSRF Prevention in Node.js](https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs.html)

The numerical values below are a conservative ContentOS MVP policy choice, not values mandated by Node or OWASP. They are chosen for readable text/HTML capture by one private owner, a small failure blast radius, bounded memory/storage/network use, and deterministic local tests.

## 3. Options considered

| Option                                                                                     | Safety and recovery                                                                                                                                                                  | MVP usefulness                                                                         | Outcome       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------- |
| A. Leave client defaults and retry behavior to the later implementation                    | Defaults can be unbounded or vary by runtime; chunked/compressed bodies and retry loops would remain an implementation guess.                                                        | Superficially flexible, but not reviewable or testable as a security boundary.         | Reject.       |
| B. Single-attempt, bounded text snapshot policy                                            | Explicit upper bounds, no hidden retries, per-hop redirect validation, streaming abort, and deterministic classified failures. The owner retains explicit Retry and manual fallback. | Supports ordinary public HTML and text without media, browser automation, or crawling. | **Accepted.** |
| C. Browser-like or media-friendly capture with larger/unbounded bodies and automatic retry | Raises public-egress, storage, decompression, CPU, and external-site impact before M2 has a validated recovery/abuse budget.                                                         | Broadens capture behavior beyond the smallest M2 Source foundation.                    | Reject.       |

## 4. Selected first-release policy

### 4.1 Request, redirect, and concurrency budget

| Policy                            | Required value                                                                                                               | Enforcement and failure                                                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public capture concurrency        | **1 active URL capture per Fetcher process**                                                                                 | Do not open another public capture while one is active. Queue delivery waits for capacity; it does not bypass the limit.                                                          |
| HTTP method and request body      | **GET only; no body**                                                                                                        | Any caller-supplied method/body is rejected before transport.                                                                                                                     |
| Automatic network retry           | **0**                                                                                                                        | No retry after DNS, connection, TLS, response, body, Object Storage, or extraction failure. Owner Retry is a separate authorized Workflow action and repeats the complete policy. |
| Redirects                         | **at most 5 redirects** per capture attempt, therefore at most **6 HTTP requests**                                           | Each hop is independently normalized, resolved, destination-checked, bound, and response-checked. A sixth redirect fails as `redirect_limit_exceeded`.                            |
| Redirect response                 | Only `301`, `302`, `303`, `307`, or `308` with exactly one usable `Location` value                                           | Missing, empty, malformed, ambiguous, unsafe, looped, or unsupported redirect data is a classified redirect failure. Redirect bodies are never snapshot content.                  |
| Final response status             | **200 only**                                                                                                                 | Any other non-redirect status is `fetch_failed`; it cannot become a Source Snapshot.                                                                                              |
| Total capture deadline            | **30 seconds** from the first resolver/connection action until final response validation and verified immutable object write | Abort all in-flight sockets, streams, decompression, and storage work. A timeout cannot publish a partial Snapshot.                                                               |
| TCP connection deadline           | **5 seconds** per hop                                                                                                        | Timeout is a classified `timeout` failure under the 30-second total cap.                                                                                                          |
| TLS handshake deadline            | **5 seconds** per HTTPS hop                                                                                                  | Certificate/hostname failure is `validation_blocked`; a time expiry is `timeout`.                                                                                                 |
| Response-header deadline          | **10 seconds** after a connected request is sent, per hop                                                                    | Abort before body processing and record `timeout`.                                                                                                                                |
| Response-body inactivity deadline | **10 seconds** after each received body byte, per final response                                                             | Abort a stalled stream and record `timeout`; this never extends the 30-second total deadline.                                                                                     |

All timers are monotonic, enforced with abort/destroy behavior, and compose by earliest deadline. The implementation must not rely on a Node default timeout or treat a timeout event as aborting unless it actually tears down the request and stream.

### 4.2 Response metadata and byte budget

| Policy                    | Required value                                                                | Enforcement and failure                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response header bytes     | **16 KiB maximum**                                                            | Set an explicit client response-header limit. Oversize/malformed headers fail as `fetch_failed`; do not log raw headers.                                                                           |
| Response header fields    | **100 maximum**                                                               | Reject excess/ambiguous headers before body use.                                                                                                                                                   |
| Allowed final media types | `text/html`, `text/plain`, `text/markdown`                                    | Compare the parsed media type case-insensitively; parameters such as `charset` are metadata, not a bypass. Missing, invalid, or other media types fail as `unsupported_content`. No MIME sniffing. |
| Encoded response body     | **2 MiB maximum**                                                             | If `Content-Length` exceeds the cap, reject before reading. For chunked/unknown length, stream-count bytes and destroy immediately when the cap is exceeded.                                       |
| Content coding            | `identity`, `gzip`, `deflate`, or `br`; **one coding only**                   | An absent `Content-Encoding` is `identity`. Reject unknown or stacked/multi-value coding as `unsupported_content`; never delegate decoding to an unbounded implicit client feature.                |
| Decoded body              | **8 MiB maximum**                                                             | Decode as a stream; terminate both decoder and source as soon as the cap is exceeded.                                                                                                              |
| Expansion ratio           | **20:1 maximum** decoded bytes to encoded bytes, after the first encoded byte | Terminate when the ratio exceeds the cap even if the decoded body remains below 8 MiB. This prevents compression-bomb behavior.                                                                    |
| Empty final body          | **Reject**                                                                    | A zero-byte `200` response is `fetch_failed`; it is not a usable Source Candidate.                                                                                                                 |

The immutable Raw Snapshot, when successful, preserves the bounded transferred response bytes plus safe content-coding and integrity evidence in private scoped storage. Extraction consumes a separately bounded decoded stream. The implementation must verify the immutable object write and the required integrity reference before reporting success. It must delete or quarantine in-flight temporary objects on every terminal failure without promoting them to a Source Snapshot.

### 4.3 Failure and retry semantics

| Condition                                                                                                                                                  | Required result                                                                   | Automatic retry                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| URL, hostname, address, port, proxy, connection-peer, TLS identity, redirect policy, malformed/ambiguous response control, or content-coding policy denial | `validation_blocked` or `redirect_blocked`, with a stable safe error code         | Never.                                                                                         |
| Header/body/decompression/ratio limit or unsupported media type                                                                                            | `too_large` or `unsupported_content`                                              | Never.                                                                                         |
| Any deadline expiry                                                                                                                                        | `timeout`                                                                         | Never.                                                                                         |
| Network/transport interruption, DNS transient failure, non-200 response, Object Storage verification failure, or empty body                                | `fetch_failed`                                                                    | Never in this first release.                                                                   |
| Deterministic extraction failure after a complete verified Snapshot                                                                                        | `extraction_failed`                                                               | Never as a network retry; later extraction policy may define a separate safe reprocess action. |
| Owner decides to retry an eligible transient failure                                                                                                       | A new authorized Workflow Task/attempt; full policy starts from the submitted URL | Not automatic; no prior DNS/redirect/socket/evidence is reused as authority.                   |

The later Workflow policy may decide which `fetch_failed` or `timeout` outcomes expose an owner Retry action. It must never expose Retry for a security denial merely to change headers, proxy, user agent, network route, or Browser behavior. A Queue redelivery, Fetcher restart, lease expiry, or duplicate result is not an owner Retry and must not make a second public request after the Task reaches a terminal result.

### 4.4 Operational and evidence constraints

- All limits are Fetcher-owned typed policy constants in the later implementation; no browser input, Queue payload, Source URL, or unvalidated environment variable can raise them.
- The implementation may report only safe, bounded evidence: Task/correlation identity, hop count, response media-type category, encoded/decoded byte counts, duration, failure category/code, and redacted destination classification. It must not record full URLs with sensitive query values, raw headers, body bytes, Object Storage keys, temporary URLs, Cookies, credentials, claims, or proxy data.
- Resource-limit, timeout, response-type, and any later owner-level Retry-policy exhaustion results remain ordinary classified Fetcher outcomes. Security policy denials remain distinct Security Errors and existing audit/alert rules still apply.
- No limit changes Source Approval, Source Version eligibility, Object Storage privacy, API ownership, Queue authority, or human gates.

## 5. Required implementation split and tests

This approval authorizes planning of only the following later, independently reviewable boundaries:

1. a Fetcher transport/resource-policy module that enforces these limits over the M2-DES-001 connection-binding boundary, with deterministic local HTTP/HTTPS fixtures;
2. a separate Task/Gateway/Workflow result Contract that maps the policy's classified results without granting Fetcher general state writes; and
3. a later Source Snapshot handoff that proves complete object integrity and no partial promotion.

`M2-FETCH-001` remains **Not Ready**. It still depends on a Ready Workflow/Task foundation, Gateway Task/claim/result Contract, Source URL capture Contract, migration plan, object-store scoped-write Contract, and fixtures. This review does not authorize merging those objectives into one change.

A later Ready Work Item must prove at least:

- 1 active capture rejects or defers a second concurrent capture;
- exactly five safe redirects are accepted as hops and the sixth fails without a seventh request;
- each deadline aborts the transport and no partial Snapshot is promoted;
- `Content-Length`, chunked bytes, decoded bytes, expansion ratio, headers, header count, content coding, media type, empty body, and non-200 paths fail closed as specified;
- compressed inputs at and below each limit can stream successfully without full-body memory buffering;
- no automatic retry occurs for any failure, and an explicit owner Retry later starts fresh policy evidence only through the Workflow/API boundary;
- logs, Queue payloads, browser responses, and audit evidence exclude secrets, raw bodies, full sensitive URLs, headers, and object references; and
- existing DNS binding, TLS, no-proxy, per-hop redirect, Object Storage integrity, cancellation, late-result, duplicate, and Source-Approval invariants remain intact.

## 6. Explicit non-goals

This review does not select or implement:

- a Fetcher HTTP library, resolver implementation, parser/extractor, Safe Display sanitizer, HTML/Markdown decoder, User-Agent value, port policy, URL API DTO, API route, or browser UI;
- a Workflow Template Schema, Task/Outbox/Event table, Queue payload, claim authentication protocol, lease duration, dispatch/reconciliation mechanism, SSE contract, or migration;
- a Source type migration, Source Version creation path, Source Approval behavior, model/Agent capability, crawling, page subresource loading, JavaScript execution, login/paywall/CAPTCHA bypass, PDF/media/image capture, or publishing;
- a production concurrency/rate-limit deployment plan, distributed per-host budget, cache, proxy, CDN, service mesh, external identity product, or new package/provider; or
- any modification to Accepted DEC, Current-truth, existing Source capture, existing Object Storage behavior, applications, packages, configuration, or dependencies.

## 7. Accepted outcome and approval boundary

### Accepted policy

Human authority accepted Option B on 2026-08-01: the single-attempt text snapshot policy above, including one active public capture, maximum five redirects, a 30-second total deadline, 2 MiB encoded/8 MiB decoded/20:1 expansion bounds, the three-type text allowlist, final `200` only, and no automatic network retry.

This is conservative by design. It keeps the first public-egress capability narrow, testable, and recoverable while preserving user-directed Retry and manual fallback. Expanding media types, size/concurrency/timing bounds, automatic retry, or capture behavior must be considered in a later bounded security review or Ready Work Item; it is not an implementation convenience.

### Whether a new DEC is required

No new DEC is required if Option B is accepted: it supplies first-release values inside an explicitly open implementation-policy area and preserves the accepted Source, Workflow, security, process, and stack boundaries. A new DEC is required if a later proposal changes MVP input scope, adds a provider/proxy/service/SDK, grants a new identity or state authority, enables browser-like capture/crawling, or weakens a security invariant.

### Approval boundary

```text
ACCEPTED
```

This approval authorizes creation of narrow Ready Work Packets only; it does not authorize implementation. `M2-FETCH-001` and the workflow foundations remain Not Ready until their own Contracts, migrations, fixtures, and acceptance criteria are fixed.

## 8. Verification record

This Decision Review adds no runtime code, network access, dependency, migration, Queue, Workflow, Task, Source persistence behavior, or Secret. Before review publication it must pass:

- `corepack pnpm exec prettier --check docs/implementation/work-packets/m2-des-003-fetcher-resource-policy.md`;
- `corepack pnpm format:check`;
- `corepack pnpm repository:check`;
- `git diff --check`; and
- exact changed-file/Git status inspection.
