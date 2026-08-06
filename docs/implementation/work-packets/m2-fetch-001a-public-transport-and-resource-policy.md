# M2-FETCH-001A — Public Transport and Resource Policy

**Status:** Completed

**Issue:** [#91](https://github.com/JettxonHo/ContentOS/issues/91)

**PR:** [#92](https://github.com/JettxonHo/ContentOS/pull/92)

**Completion merge:** `551217c130f6717f4b8891ce76de1fa124bf8ee0` (`feat: add public URL transport policy (#92)`)

**Branch:** `codex/m2-fetch-001a-public-transport`

**Base commit:** `79e0ff5ec2a1880929da5e341b15402417535172`

## Identification

- Work Item: `M2-FETCH-001A`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `gpt-5.6-terra`
- Reasoning: `XHigh` actual
- Thread: `/root/fetch001a_implementation`
- Runtime Model Status: `VERIFIED`

## Goal

Implement one Fetcher-private Node.js 24 transport that retrieves a public
HTTP or HTTPS text response under the accepted connection and resource policy,
then exposes one bounded streaming `VerifiedFetchResponse` to
`M2-FETCH-001B`. This item does not register the transport in the Fetcher
process or execute a Queue Task.

## Canonical sources

- [M2-DES-001 — Public URL Fetcher Connection Binding](m2-des-001-public-url-fetcher-connection-binding.md)
- [M2-DES-003 — Fetcher Resource Policy](m2-des-003-fetcher-resource-policy.md)
- [M2-DES-006 — Deterministic Fetcher Candidate Extraction](m2-des-006-fetcher-candidate-extraction.md)
- [Source Fetcher Security Boundary](../../security/source-fetcher.md)
- [Process Topology](../../architecture/process-topology.md)
- [Issue #91](https://github.com/JettxonHo/ContentOS/issues/91)

Relevant Accepted Decisions: DEC-059–DEC-066, DEC-199, DEC-206–DEC-207,
DEC-214, DEC-221, DEC-228–DEC-232, DEC-239–DEC-240, DEC-245, DEC-249,
DEC-259, DEC-262, DEC-268, DEC-280, DEC-284–DEC-285, and DEC-287–DEC-293.

## Current truth

- `public-url-connection/v1` and `public-url-resource/v1` are the current Claim
  policy versions.
- The API already owns Claim, Heartbeat, Result, object-integrity verification,
  and Source evidence promotion. The Worker owns dispatch and lease recovery.
- The Fetcher remains a configuration-only lifecycle skeleton. It has no Queue
  consumer, Gateway client, public request, or Object Storage writer.
- Node 24 standard-library DNS, TCP, TLS, HTTP, and decompression primitives are
  the accepted transport mechanism. No HTTP, DNS, proxy, or browser SDK is
  approved.
- The first release accepts public HTTP port 80 and HTTPS port 443 only, uses
  the fixed User-Agent `ContentOS-Fetcher/1.0`, and performs no automatic
  network retry.

## Internal contract

The folder `apps/fetcher/src/public-url-transport/` is one deep module. Its
public index exposes only the values required by later Fetcher orchestration;
resolver, address, socket, TLS, response, decompression, and timer helpers stay
internal.

Conceptually, the public seam is:

```ts
interface CaptureBudget {
  readonly startedAtMonotonicMs: number;
  readonly absoluteDeadlineMonotonicMs: number;
  readonly signal: AbortSignal;
  remainingMs(): number;
}

interface VerifiedFetchResponse {
  readonly budget: CaptureBudget;
  readonly finalUrl: string;
  readonly redirects: readonly {
    status: 301 | 302 | 303 | 307 | 308;
    url: string;
  }[];
  readonly responseStatus: 200;
  readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
  readonly declaredCharset: string | null;
  readonly contentEncoding: 'identity' | 'gzip' | 'deflate' | 'br';
  consume(sinks: {
    onEncoded(chunk: Uint8Array): Promise<void>;
    onDecoded(chunk: Uint8Array): Promise<void>;
  }): Promise<{ encodedByteSize: number; decodedByteSize: number }>;
  dispose(): void;
}

interface PublicUrlTransport {
  fetch(submittedUrl: string): Promise<VerifiedFetchResponse>;
}
```

Names may be refined during the red-green loop, but the observable contract
must preserve these properties:

- the body is one-shot and streamed with backpressure to both sinks; it is not
  exposed as an unbounded full-body buffer;
- the transport owns the socket, decoder, abort, and cleanup lifecycle;
- the 30-second monotonic budget starts immediately before the first resolver
  action, or before numeric connection for an IP literal;
- `fetch` and `consume` share the same timer and AbortSignal, reject when that
  budget expires, and destroy all transport-owned sockets and streams;
- the same budget and AbortSignal remain observable by 001B so it cannot reset
  the deadline before immutable-object verification; and
- `dispose` is idempotent, shortens rather than extends resource lifetime, and
  releases any response not fully consumed.

001C owns the Fetcher process's one-active-capture scheduling and the
`try/finally` that disposes this response after 001B finishes. 001A does not
own Queue-consumer capacity and does not claim that it can force an arbitrary
external Promise to settle; 001B must honor the supplied AbortSignal while it
performs its bounded sinks and object verification.

The response and its URLs are private in-memory values. They are not ordinary
telemetry and must not be included in failure messages.

## Fixed transport and resource policy

| Policy            | Required value                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Schemes / ports   | Public HTTP `80`; public HTTPS `443`; explicit default forms allowed; all other ports denied          |
| Request           | GET, no body, no caller headers, no Cookie or Authorization, fixed `ContentOS-Fetcher/1.0` User-Agent |
| Proxy             | No proxy or global dispatcher; reject non-empty standard proxy environment and Node proxy flags       |
| Concurrency       | Not owned by 001A; 001C enforces one active public capture per Fetcher process                        |
| Retry             | No automatic network retry and no second address attempt after connection failure                     |
| Redirect          | At most five redirects / six requests; only 301, 302, 303, 307, 308 with exactly one usable Location  |
| Final response    | Status 200 only; body non-empty                                                                       |
| Total deadline    | 30 seconds through the future verified immutable write                                                |
| Per-hop deadlines | TCP 5 seconds; TLS 5 seconds; response headers 10 seconds; final body inactivity 10 seconds           |
| Headers           | 16 KiB and 100 fields maximum                                                                         |
| Media             | `text/html`, `text/plain`, `text/markdown`; no sniffing                                               |
| Content coding    | One of `identity`, `gzip`, `deflate`, `br`                                                            |
| Body              | 2 MiB encoded, 8 MiB decoded, maximum 20:1 expansion                                                  |

Use monotonic time and earliest-deadline aborts. Policy values are typed
constants; external input, Queue data, and environment variables cannot raise
them.

## Destination and connection requirements

1. Parse one controlled URL representation, reject credentials, remove the
   fragment from the request identity, and derive Host/SNI only from the
   normalized URL.
2. Reject noncanonical numeric host forms, IPv4-mapped IPv6, zone identifiers,
   and localhost aliases. Address classification uses the exact v1 snapshot
   below; do not add speculative hostname catalogues or retrieve a policy list
   dynamically at runtime.
3. For a hostname, use a controlled `node:dns/promises` Resolver path and
   evaluate every usable A and AAAA answer. Any restricted or indeterminate
   answer rejects the complete set. Do not use reverse DNS as an allow signal.
4. Select one allowed address deterministically, connect to that numeric address
   and family, and compare the observed peer with the selected address. Never
   perform a hidden hostname lookup or a second connection attempt.
5. For HTTPS hostnames, wrap the preconnected socket with native CA validation,
   canonical-host SNI, and certificate identity verification. For HTTPS IP
   literals, omit SNI and verify the certificate against the IP identity.
6. Use a fresh nonpooled connection per hop. Redirects are resolved relative to
   the current URL and repeat the entire policy.

### Exact public-address policy snapshot

The v1 classifier is a reviewed code constant based on the IANA IPv4 and IPv6
Special-Purpose Address Registries last updated 2025-10-09. More-specific
allow entries take precedence over broader deny entries. A registry update is
a separate maintenance review; production fetching never downloads this list.

- IPv4 denies `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`,
  `169.254.0.0/16`, `172.16.0.0/12`, `192.0.0.0/24`, `192.0.2.0/24`,
  `192.88.99.0/24`, `192.168.0.0/16`, `198.18.0.0/15`,
  `198.51.100.0/24`, `203.0.113.0/24`, `224.0.0.0/4`, and `240.0.0.0/4`.
  The globally reachable anycast addresses `192.0.0.9/32` and
  `192.0.0.10/32` are the only allow overrides inside `192.0.0.0/24`.
- IPv6 first requires membership in the public Global Unicast block
  `2000::/3`. Inside that block it denies `2001::/23`, `2001:2::/48`,
  `2001:10::/28`, `2001:db8::/32`, `2002::/16`, and `3fff::/20`. The only
  allow overrides inside `2001::/23` are `2001:1::1/128`,
  `2001:1::2/128`, `2001:1::3/128`, `2001:3::/32`,
  `2001:4:112::/48`, `2001:20::/28`, and `2001:30::/28`.
- Everything else covered by a deny entry, outside IPv6 `2000::/3`, mapped,
  noncanonical, or indeterminate is rejected. This covers loopback, private or
  unique-local, link-local, multicast, unspecified, documentation,
  benchmarking, metadata, translation, discard-only, deprecated, and reserved
  destinations without a second heuristic list.

References:
[IANA IPv4 Special-Purpose Address Registry](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml)
and
[IANA IPv6 Special-Purpose Address Registry](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml).

## Failure contract

Expose only stable typed failures with safe code text. Never retain a raw socket,
TLS, DNS, decoder, URL, header, body, query, proxy value, or stack in an ordinary
error message.

| Category              | Safe code             | 001A conditions                                                                                                |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `validation_blocked`  | `VALIDATION_BLOCKED`  | URL, port, address, proxy, peer, or TLS policy denial                                                          |
| `redirect_blocked`    | `REDIRECT_BLOCKED`    | Invalid, unsafe, looped, ambiguous, or excessive redirect                                                      |
| `unsupported_content` | `UNSUPPORTED_CONTENT` | Unsupported media type or content coding                                                                       |
| `too_large`           | `TOO_LARGE`           | Header-field, encoded, decoded, or ratio limit                                                                 |
| `timeout`             | `TIMEOUT`             | Any enforced deadline                                                                                          |
| `fetch_failed`        | `FETCH_FAILED`        | DNS/transport interruption, malformed or oversized header bytes, decompression failure, non-200, or empty body |

`extraction_failed` belongs to 001B. Server-derived package, role, and object
integrity failures cannot be produced by this module.

## Test seams and fixtures

The accepted seams are the public transport handle and the provider adapters
for resolution, numeric connection, TLS wrapping, monotonic clock/timers, and
response streaming. Tests verify behavior at those seams, not private helper
call graphs.

- Production loopback and restricted-address rejection is tested separately
  from local fixture transport.
- A small local UDP DNS fixture proves the Node Resolver adapter collects A and
  AAAA answers without external DNS.
- Local HTTP fixtures bind ephemeral loopback ports. Explicit test adapters map
  an already policy-approved synthetic public address to the local socket while
  preserving the selected/observed-peer assertions. Production adapters cannot
  receive that override.
- Local HTTPS fixtures generate an ephemeral self-signed `fixture.test`
  certificate and key in a repository-external temporary directory through the
  locally available OpenSSL-compatible CLI. No key/certificate is committed,
  no external network or package is used, and an unavailable generator is a
  visible test failure rather than a skipped assertion.
- The fixture CA is trusted only through an injected test TLS adapter. The
  production adapter exposes no caller-controlled CA or verification bypass.

Use representative real boundaries: the exact address-policy allow/deny
overrides, public success, restricted/mixed DNS, peer mismatch, HTTP and HTTPS
identity, relative/cross-origin redirect, redirect loop/limit, proxy rejection,
final status/media/coding, header and body limits, compression ratio, the four
deadlines, one-shot consumption, explicit disposal, sink failure, and cleanup.
Do not build an exhaustive matrix of impossible internal objects. 001C, not
001A, tests one-active-capture capacity.

## Allowed files

- `apps/fetcher/src/public-url-transport/**`
- `docs/security/source-fetcher.md`
- `docs/architecture/repository-structure.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-packets/m2-fetch-001a-public-transport-and-resource-policy.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

All other files are forbidden, including `apps/fetcher/src/main.ts`, package
manifests, `pnpm-lock.yaml`, Core, Contracts, Config, Database, Object Storage,
API, Worker, Web, Renderer, migrations, Schema, Compose, and CI.

## Implementation requirements

1. Work test-first in vertical slices at the accepted public/provider seams.
2. Keep Node transport code out of Domain Core and public Contracts.
3. Do not register the module in the running Fetcher skeleton.
4. Do not use ordinary `fetch`, automatic redirects, proxy environment, global
   agents/dispatchers, pooled sockets, caller headers, or runtime policy
   overrides.
5. Stream-count and abort encoded and decoded paths at the first violated bound;
   never fabricate a partial success.
6. Synchronize `source-fetcher.md` so accepted connection, resource, port,
   User-Agent, and extraction choices are no longer listed as open. State
   clearly which parts are implemented and which remain unavailable.
7. Mark this Work Packet and Roadmap item `In Review` only after all required
   evidence passes. Keep top-level M2 `In Progress`, M2-FETCH-001 incomplete,
   and 001B/001C not started.

## Acceptance criteria

1. The production path binds every connection to one validated numeric address
   and rejects restricted/mixed evidence or peer mismatch.
2. Host and TLS identity are derived from the normalized URL, native
   verification remains enabled, and no caller credential/header/proxy path
   exists.
3. Every redirect repeats the complete policy, with the accepted count, status,
   Location, loop, and final-status rules.
4. Every fixed deadline, header/body/media/coding/ratio/empty-body limit is
   enforced with real abort and stable failure classification.
5. The response is one-shot and streaming; `fetch`, `consume`, timeout, sink
   failure, and `dispose` release their transport resources, while neither the
   response nor 001B can extend its Capture Budget.
6. Local HTTP, HTTPS, and DNS fixtures prove the real provider seams without
   public network access or a production security bypass.
7. Failure evidence is redacted and all failure paths release sockets, streams,
   timers, and temporary certificate material.
8. No Queue, Gateway call, Object Storage write, Candidate extraction, Result
   submission, Source mutation, runtime registration, dependency, or migration
   is introduced.
9. Existing unit, integration, process-lifecycle, documentation, and repository
   checks pass.
10. Documentation accurately describes an internal transport foundation, not a
    working public URL Fetcher.

## Required verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- targeted Fetcher unit tests
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `git diff --check`
- exact file scope, package/lockfile, Secret, local-path, generated-artifact,
  process, socket, temporary-directory, and Git-status inspection

## Git permissions

- Commit: No
- Push: No
- Draft Pull Request: No
- Mark Pull Request Ready: No
- Merge: No

The Orchestrator performs Git publication only after independent `PASS`.

## Escalation conditions

Return `HUMAN_DECISION_REQUIRED` before changing any accepted scheme, port,
limit, retry, identity, proxy, dependency, public protocol, security boundary,
or Acceptance Criterion. Report ordinary implementation or environmental
failures truthfully without selecting a substitute component.

## Documentation updates

Synchronize only the allowed Current-truth and repository-status documents.
M2 remains `In Progress`; this item cannot claim Queue-to-Gateway Fetcher
execution, immutable Snapshot write, Result submission, or Source completion.

## Completion verification

All required verification evidence passed before this packet moved to `In
Review`. Review Round #1 added focused proxy and test-boundary coverage. Its red
phases reproduced the confirmed DNS completeness, timeout-classification,
TLS-classification, canonical-identity, compressed-empty, and
accepted-response-cleanup defects before correcting them. Review Round #2
traced the repeated Node proxy-flag miss to ad-hoc regular-expression matching
against serialized `NODE_OPTIONS`; it replaced that check with bounded token
parsing and normalized Node option-name comparison. The final focused Fetcher
suite passed 54 tests; the process-capable unit suite and full quality gate
passed 36 files / 332 tests, and the isolated process-capable integration
harness passed 20 files / 158 tests and cleaned its owned resources. Frozen
install, workspace resolution, typecheck, documentation/repository/Secret
checks, diff check, and final scope/residue inspection also passed.

The initial sandboxed unit-suite attempt could not spawn `ps` for the
managed-process identity tests (`EPERM`); the unchanged suite passed with
process-capable execution. The initial sandboxed integration setup failed before
tests started; the unchanged process-capable harness passed. During the first
implementation round, one final DNS-normalization refinement briefly failed
Fetcher typecheck because Node's numeric family result needed explicit narrowing;
the minimal type correction and all subsequent focused and full gates passed.
Independent review passed, and the work item was completed through PR #92 as
squash merge `551217c130f6717f4b8891ce76de1fa124bf8ee0` (`feat: add public URL
transport policy (#92)`). M2 remains In Progress, `M2-FETCH-001` remains
incomplete, `M2-FETCH-001B` and `M2-FETCH-001C` remain Not Started, and real
Fetcher execution remains unavailable.
