# Decision Review — M2-DES-007

- **Title:** Durable Owner-visible URL Intake Projection
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Human authority approved Option A on
  2026-08-07
- **Date:** 2026-08-07
- **Base commit:** `13adfb7d05e3bc041c35b8ee0b755c6758b3ba51`
- **Issue:** [#114](https://github.com/JettxonHo/ContentOS/issues/114)
- **Branch:** `codex/m2-web-001a-ready-design`
- **Allowed change:** this document only. It does not add an API, Web UI,
  dependency, Schema, migration, or runtime behavior.

This review resolves one blocking interface choice for `M2-WEB-001A — Source
Intake Workspace`: how the owner can still see a submitted URL and its progress
or failure after a browser refresh, before or without a formal Source being
created.

## Proposed change

Add one authenticated, owner-scoped, read-only URL intake projection under the
existing Package boundary:

```text
GET /v1/content-packages/:packageId/url-capture-requests
```

The projection returns the current v1 URL intake record, if one exists. It
exposes only the submitted URL, requested Source role, owner-facing progress,
safe failure classification, formal Source ID after success, and timestamps.
It does not expose Queue, Claim, lease, attempt, Object Storage, redirect,
Header, SQL, or provider details.

## Change category

- [ ] MVP scope
- [ ] Domain semantics
- [ ] Workflow
- [x] Security boundary — return the private submitted URL only to its owner
- [ ] Agent responsibility
- [x] Technical architecture — add one public owner-scoped read Contract
- [ ] Release Gate

## 1. Current accepted rule and evidence

The following accepted boundaries remain authoritative:

- DEC-199 and DEC-200 require private-by-default data, server-side
  Authentication, Authorization, and owner scope.
- DEC-224 places explicit REST and OpenAPI Contracts at the NestJS + Fastify
  API boundary.
- DEC-234 keeps REST reads authoritative; SSE only notifies the browser that a
  refresh may be needed.
- DEC-280 requires M2 to establish Source intake and Approval before the first
  Agent.
- [MVP Scope](../../product/mvp-scope.md) includes URL, pasted text, `.md`, and
  `.txt` Source intake with human review.
- [Workflow Overview](../../architecture/workflow-overview.md) keeps
  PostgreSQL authoritative for Workflow and Task state.
- [Source Fetcher Security Boundary](../../security/source-fetcher.md) treats a
  submitted URL as private, untrusted input and forbids an ordinary bypass of
  Fetcher validation.

The implementation already persists the required facts in
`url_source_references`, `url_capture_requests`, `workflow_tasks`, and
`url_capture_results`. A successful URL capture creates the formal Source with
the existing Source Reference ID. A failed capture deliberately creates no
formal Source.

The existing Source collection therefore cannot represent a pending or failed
URL request. The generic Workflow projection can show Task progress and a safe
failure category, but it deliberately omits the submitted URL and request
identity.

## 2. Problem and rationale

`M2-WEB-001A` requires URL progress and failure to remain visible and allows the
user to create an independent pasted-text or upload Source as a manual
fallback. Without a durable URL intake read:

- a page can show a just-submitted URL only from temporary browser memory;
- refreshing loses the association between that URL and its Task state;
- a failed URL disappears from the formal Source list because no Source was
  created; and
- mixing the failed request into the Source list would falsely claim that a
  formal Source exists.

The database already contains the truth needed by this view. A new read
projection is smaller and more accurate than changing persistence or broadening
the meaning of Source.

## 3. Options considered

| Option                                                   | Benefit                                                                                        | Cost / risk                                                                                                                     | Outcome          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| A. Add a bounded owner-scoped URL intake read projection | Restores pending/failed intake after refresh without changing Source semantics or persistence. | Adds one public REST Contract that returns a private submitted URL to its owner.                                                | **Accepted.**    |
| B. Use only the generic Workflow projection              | No new endpoint.                                                                               | Cannot identify or display the persisted submitted URL after refresh; does not meet the durable failure-visibility requirement. | Not recommended. |
| C. Return pending/failed URL requests as pseudo-Sources  | One combined list.                                                                             | Conflates an intake attempt with a formal Source and makes Source IDs/state misleading.                                         | Rejected.        |

## 4. Recommended bounded contract

The later Ready Work Item may add this response:

```ts
interface UrlCaptureIntakeResource {
  readonly id: string;
  readonly role: 'primary' | 'supporting';
  readonly submittedUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type UrlCaptureIntakeStateResource =
  | {
      readonly status: 'queued' | 'running';
      readonly failure: null;
      readonly sourceId: null;
    }
  | {
      readonly status: 'failed';
      readonly failure: WorkflowFailureResource;
      readonly sourceId: null;
    }
  | {
      readonly status: 'succeeded';
      readonly failure: null;
      readonly sourceId: string;
    };

type UrlCaptureIntakeItemResource = UrlCaptureIntakeResource & UrlCaptureIntakeStateResource;

interface UrlCaptureIntakeCollectionResponse {
  readonly data: {
    readonly items: readonly UrlCaptureIntakeItemResource[];
  };
}
```

Contract rules:

1. The current fixed v1 Workflow permits at most one URL capture request for a
   Package, so `items` contains zero or one item. No cursor, limit, or future
   Retry abstraction is added.
2. `workflow_tasks.state = 'leased'` maps to owner-facing `running`; Queue and
   lease terminology is not public UI state.
3. `failure` reuses the existing exact safe Workflow failure union. It is
   required only for `failed`; `queued`, `running`, and `succeeded` return null.
4. `sourceId` is required only for `succeeded`, after the existing URL result
   path has created a formal Source. It is null for all other states. A failed
   request remains an intake record, not a Source.
5. `updatedAt` comes from the authoritative Task timestamp; no synthetic
   browser timestamp is introduced.
6. The query is read-only, owner- and Package-rooted, and parameterized. Missing
   and cross-owner Packages remain indistinguishable.
7. The owner may read the URL intake record for an active or archived Package,
   matching the existing read-only Workflow projection. This preserves a
   terminal `package_archived` failure as historical intake evidence. It does
   not open formal Source collection or Source-body reads for archived
   Packages; changing those existing Source semantics is outside this review.
8. The response omits Task ID, Workflow IDs, attempt number, Claim/lease data,
   Outbox state, Result IDs, final URL, redirects, Object keys, Candidate body,
   Headers, Secrets, SQL, and provider errors.

## 5. Fallback boundary

All accepted failures remain visible through the safe failure union. A manual
fallback does not retry, override, or mark the URL capture successful. It uses
the existing pasted-text or `.md`/`.txt` upload command to create a separate
formal Source under the normal role and capacity rules.

The UI must describe that distinction. It must not imply that validation or
SSRF rejection was bypassed, and it must retain the failed URL intake record
after a fallback Source is created.

## 6. Impact

### Product and scope

The change supports the already planned Source Intake Workspace. It adds no new
Source type, Retry action, Research behavior, Agent, publishing, or Approval
automation.

### Domain / contracts / migration

One read port, Contract, repository projection, controller method, and OpenAPI
entry would be added by the later Work Item. Existing tables already contain
the required facts; no Schema, migration, backfill, or state mutation is
needed. Formal Source semantics remain unchanged.

### Security and operations

The submitted URL is private and may contain sensitive path/query data. It is
returned only through the authenticated owner-scoped API and must not enter
logs, SSE notifications, generic errors, or diagnostic evidence. No new hash,
redaction framework, or speculative defensive mechanism is introduced.

### Quality and release

Tests must prove owner scope, missing/cross-owner indistinguishability, the four
owner-facing discriminated states, safe failure mapping, success-to-Source
binding, active and archived Package reads, exact response shape, and zero
mutation. Browser evidence must prove refresh recovery and that manual fallback
creates an independent Source while the failed URL record remains visible.

## 7. Affected documents and Work Items

This accepted choice must be carried into the later Ready packet for
`M2-WEB-001A`. Implementation may update the existing API/Workflow/Repository
Current-truth documents and bilingual repository entry guidance only where the
accepted behavior changes.

`M2-WEB-001B` remains responsible for Working Copy editing, Version history,
precise Approval, URL Candidate review, and Timeline presentation.

## 8. Required review

- An independent Definition-of-Ready review is still required after approval
  and after the full `M2-WEB-001A` Work Packet is prepared.
- No runtime implementation begins before that independent review returns
  `PASS` with no Blocking Design Question.

## 9. Outcome

- [x] Accepted
- [ ] Rejected
- [ ] Deferred

Accepted result:

```text
ACCEPTED — Option A
```

Human authority approved Option A on 2026-08-07. No new Canonical DEC is
required because this is a bounded public read mechanism inside the already
accepted owner-scoped Source intake and Workflow boundaries. A proposal to
expose URLs across owners, change archived Package semantics, add Retry, or
treat failed intake as a Source would require a new review.

## 10. Verification record

This review changes documentation only. Before publication it must pass:

- focused Prettier check for this document;
- `corepack pnpm check:docs`;
- `corepack pnpm repository:check`;
- `git diff --check`; and
- exact changed-file and Git-status inspection.
