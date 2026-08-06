# Decision Review — M2-DES-006

- **Title:** Deterministic Fetcher Candidate Extraction
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Human authority approved Option A on 2026-08-06
- **Date:** 2026-08-06
- **Base commit:** `2d10da0d677c35a97165ceec00ef2f3e1bd282c0` (`2d10da0`)
- **Issue:** [#86](https://github.com/JettxonHo/ContentOS/issues/86)
- **Branch:** `codex/m2-fetch-001-ready-design`
- **Allowed change:** this document only. It does not implement Fetcher execution, add a dependency, or change runtime behavior.

This review resolves the last blocking extraction choice for the first public
URL Fetcher. It records a narrow parser and decoding policy so later
implementation Work Items can be independently Ready. It does not authorize a
single combined Fetcher implementation.

## Proposed change

Use `parse5@8.0.1` to parse supported HTML into a non-executing tree and derive
one deterministic plain-text Candidate. Do not add Readability, a browser DOM,
Safe HTML rendering, JavaScript execution, subresource loading, or a handwritten
HTML parser.

The first release also fixes the remaining small transport-to-extraction
parameters:

- only standard destination ports are allowed: `80` for HTTP and `443` for
  HTTPS, including their explicit URL forms;
- a fixed ContentOS-controlled User-Agent is sent; user input and environment
  variables cannot override request headers;
- absent charset or `utf-8`/`utf8` is decoded as strict UTF-8; another declared
  charset or invalid UTF-8 is `unsupported_content`;
- `text/plain` and `text/markdown` use the same bounded UTF-8 text path without
  HTML parsing; and
- the existing Candidate limit remains non-empty and at most 100,000 UTF-8
  bytes.

These are first-release implementation parameters inside the already accepted
public URL, resource, Result, and Source boundaries. They do not broaden MVP
Source types or add a new product capability.

## Change category

- [ ] MVP scope
- [ ] Domain semantics
- [ ] Workflow
- [x] Security boundary — deterministic treatment of untrusted HTML and text
- [ ] Agent responsibility
- [x] Technical architecture — one bounded parser dependency and extraction seam
- [ ] Release Gate

## 1. Current accepted rule and evidence

The following authority is already fixed:

| Authority                                                                                                                                                   | Constraint preserved by this review                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-059–DEC-066, DEC-163, DEC-199, DEC-207–DEC-209, DEC-221, DEC-230–DEC-232, DEC-245, DEC-249, DEC-259, DEC-268, DEC-280, DEC-284–DEC-285, DEC-287–DEC-293 | A URL capture produces private, immutable evidence and an untrusted review Candidate; it never produces Approval, executes page instructions, or gains general Domain authority. |
| [Source Fetcher Security Boundary](../../security/source-fetcher.md)                                                                                        | Only public HTTP/HTTPS text or HTML is in scope. Extraction is deterministic and bounded. Raw bytes, extracted text, and any future Safe Display are separate representations.   |
| [M2-DES-001](m2-des-001-public-url-fetcher-connection-binding.md)                                                                                           | Every actual connection binds to a validated public numeric address, preserves Host/TLS identity, rejects proxy bypass, and validates every redirect hop.                        |
| [M2-DES-003](m2-des-003-fetcher-resource-policy.md)                                                                                                         | One attempt has fixed timing, redirect, header, encoded/decoded byte, media-type, compression, and retry limits.                                                                 |
| [M2-DES-005](m2-des-005-fetcher-execution-gateway.md) and [M2-SRC-003](m2-src-003-url-capture-result-source-evidence.md)                                    | The Fetcher receives one claimed Task through the API-owned Gateway and submits the existing exact `fetcher-result/v1` contract; PostgreSQL remains authoritative.               |

Later Accepted DEC governs an actual conflict. This review changes no Accepted
DEC and creates no new lifecycle relation.

Current implementation evidence:

- the Fetcher remains a configuration-only lifecycle skeleton;
- the Worker publishes but does not consume the fixed BullMQ Job;
- Claim, Heartbeat, Result, immutable-object verification, and Source evidence
  attachment already exist in the API-owned boundary; and
- no HTML parser or Fetcher public transport dependency currently exists.

## 2. Problem and rationale

The accepted boundaries allow `text/html`, `text/plain`, and `text/markdown`,
but they intentionally did not choose how HTML becomes a reviewable Candidate.
The choice affects correctness and the external-input boundary:

- returning raw HTML as Candidate text would mix evidence markup with the
  normalized review representation;
- regular expressions or a handwritten partial parser do not reliably model
  HTML error recovery or text-node boundaries;
- a Readability/DOM stack adds heuristic article selection and substantially
  more runtime behavior than M2 needs; and
- the first vertical slice needs deterministic, reviewable text, not a browser
  rendering or a claim that the main article was identified perfectly.

`parse5@8.0.1` is an MIT-licensed HTML parser with a non-executing tree model.
The selected use is limited to parsing already bounded, strictly decoded HTML
and walking that tree. It neither fetches subresources nor executes scripts.

## 3. Options considered

| Option                                                   | Benefit                                                                                                | Cost / risk                                                                                                                                           | Outcome                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| A. `parse5@8.0.1` plus a small deterministic text walker | Standards-compatible parsing, one bounded dependency, no execution environment, stable local fixtures. | Does not provide article-ranking heuristics; navigation and boilerplate may remain in the first Candidate.                                            | **Accepted.**             |
| B. Readability plus a DOM implementation                 | Better article-focused extraction on some pages.                                                       | Adds heuristic behavior, a larger dependency/runtime surface, more tuning, and false-positive/false-negative policy before the basic slice is proven. | Deferred; not part of M2. |
| C. Regular-expression or handwritten HTML parsing        | No dependency.                                                                                         | Fragile HTML handling and an avoidable custom parser maintenance burden.                                                                              | Rejected.                 |

## 4. Accepted extraction contract

### 4.1 Inputs

The extractor receives only a fully retrieved final response that has already
passed the accepted URL, connection, redirect, status, media-type, encoded
size, decoding, decoded-size, compression-ratio, and total-deadline policies.
It does not receive a URL to fetch and cannot initiate network access.

The input is one of:

- strictly decoded UTF-8 for `text/html`;
- strictly decoded UTF-8 for `text/plain`; or
- strictly decoded UTF-8 for `text/markdown`.

No MIME sniffing, charset guessing, browser decoding, Markdown rendering, or
embedded-resource retrieval is introduced.

### 4.2 HTML behavior

For `text/html`, parse with `parse5` and traverse in document order. Text from
`script`, `style`, `noscript`, `template`, `iframe`, `object`, `embed`, `svg`,
and `canvas` subtrees is excluded. The first release does not inspect event
handlers, URLs, microdata, Open Graph, JSON-LD, or CSS because none of those
fields enters the plain-text Candidate.

The walker:

- emits decoded text-node content only;
- uses stable whitespace collapsing and block-boundary line breaks;
- performs no article scoring or site-specific selector logic;
- never executes code or returns HTML; and
- validates the final Candidate through the existing
  `source/normalized/v1` rules.

This exclusion list is intentionally small and plausible. The implementation
must not grow a catalogue of speculative node, property, proxy, or parser
object cases unless a real parser boundary or regression requires it.

### 4.3 Plain text and Markdown behavior

`text/plain` and `text/markdown` remain text. They pass through deterministic
line-ending normalization and the same Candidate whitespace/size validation.
Markdown is not rendered, converted to HTML, or interpreted as executable
instructions.

### 4.4 Result behavior

- a non-empty Candidate within the existing 100,000 UTF-8 byte limit may be
  submitted as the success variant of `fetcher-result/v1` together with the
  already required immutable Snapshot evidence;
- empty or invalid extracted text is `extraction_failed`;
- unsupported or invalid charset is `unsupported_content`;
- Candidate overflow is `too_large`;
- no failure fabricates text or mutates Source state directly; and
- the user still reviews the Working Copy before Version creation and
  Approval.

No new digest or hash mechanism is introduced. The implementation uses only
the integrity and claim-binding values already required by accepted contracts.

## 5. Module and dependency boundary

The later implementation places the deterministic extraction contract in a
shared framework-independent package and the `parse5` adapter in the Fetcher
application or another explicitly approved provider-facing module. Domain Core
must not depend on `parse5`, HTTP, DNS, TLS, BullMQ, or the S3 SDK.

Only `parse5@8.0.1` is approved as a new production dependency for this
extraction capability. The package is MIT licensed. Adding a DOM simulator,
Readability library, charset detector, sanitizer, browser runtime, alternate
parser, proxy client, or crawling SDK requires a separate bounded review.

## 6. Required implementation split

`M2-FETCH-001` is divided into three sequential, independently reviewable Work
Items:

1. `M2-FETCH-001A — Public Transport and Resource Policy`: URL normalization,
   public-address policy, numeric connection binding, TLS identity, manual
   redirects, and the accepted request/response limits against deterministic
   local HTTP/HTTPS/DNS fixtures. No Queue consumer or production result
   submission.
2. `M2-FETCH-001B — Candidate Extraction and Scoped Snapshot Writer`:
   `parse5` extraction, strict text decoding, scoped immutable Snapshot write,
   and construction of an exact success/failure Result value. No BullMQ
   consumer or Task lifecycle orchestration.
3. `M2-FETCH-001C — Queue-to-Gateway Fetcher Orchestration`: BullMQ consumer,
   Claim/Heartbeat/Result client, one-active-capture lifecycle, shutdown, and
   end-to-end isolated runtime evidence using 001A/001B. No new transport,
   extraction, Source, or Workflow semantics.

Each item requires its own Ready Work Packet and Issue. No item may silently
absorb UI, owner Retry, Source Version/Approval, Agent, Renderer, deployment,
browser capture, or JavaScript-heavy-page support.

## 7. Impact

### Product and scope

Public text/HTML URL capture remains the same MVP Source input. Candidate
quality is deliberately baseline-quality and human-reviewable; the decision
does not promise article-main-content accuracy.

### Domain / contracts / migration

No Schema, migration, API DTO, Queue envelope, Event, Result version, Source
state, Snapshot key, Candidate schema, or Approval rule changes. A future
implementation adds only internal typed ports and one parser dependency.

### Security and operations

Untrusted HTML remains inert data. Fetcher public egress, private Gateway
identity, scoped Object Storage access, and existing Result integrity checks
remain separate controls. Review and tests must be proportional: cover the
real external boundaries and accepted limits, not exhaustive impossible-case
matrices.

### Quality and release

Ready Work Items must include deterministic fixtures for representative HTML,
plain text, Markdown, charset rejection, excluded active-content subtrees,
empty extraction, Candidate limit, and no external resource loading. Full
integration evidence is required only in 001C after the lower modules are
merged.

## 8. Outcome and approval boundary

```text
ACCEPTED — Option A
```

Human authority approved Option A on 2026-08-06. No new DEC is required because
this selects a bounded implementation mechanism inside the existing Fetcher
security and Source contracts. A later proposal needs Decision Review if it
adds browser execution, crawling, authenticated capture, heuristic automatic
promotion, a new provider/service, or changes Source Approval or MVP input
scope.

This approval authorizes preparation of the three Ready Work Packets in §6.
It does not authorize implementation until the relevant packet has no Blocking
Design Question.

## 9. Verification record

This review changes documentation only. Before publication it must pass:

- `corepack pnpm exec prettier --check docs/implementation/work-packets/m2-des-006-fetcher-candidate-extraction.md`;
- `corepack pnpm format:check`;
- `corepack pnpm check:docs`;
- `corepack pnpm repository:check`;
- `git diff --check`; and
- exact changed-file and Git-status inspection.
