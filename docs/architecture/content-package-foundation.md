# Content Package Foundation

**Status:** Active implementation baseline
**Scope:** M1 owner-scoped Content Package identity, metadata, persistence, API, and Artifact identity invariants
**Last Updated:** 2026-07-28

This document records the bounded foundation introduced by `M1-CP-001`. It implements Content Package metadata and identity only. It does not implement Source, Workflow, Queue, Agent, Research, Human Opinion, publishing content, rendering, export, Approval, Artifact bodies, or public sharing.

## 1. Aggregate and metadata

A Content Package is the owner-scoped aggregate entry for one content project. Its current metadata is:

- opaque UUID identity assigned by the server;
- authenticated owner identity assigned by the server and never accepted from a client body;
- title, optional description, and content mode (`deferred`, `creator_led`, or `research_based`);
- one or both requested MVP outputs (`blog`, `xiaohongshu`);
- lifecycle (`active` or `archived`);
- positive monotonic metadata revision and timestamps.

Creation begins at revision `1` in the active lifecycle. Metadata updates and Archive each require the caller's `expectedRevision` and advance the revision by one. A stale revision returns a conflict and cannot overwrite a newer state.

Archive is an explicit lifecycle transition, not Delete. Archived packages remain directly readable and can be listed with the archived filter, but cannot be edited or archived again. There is no Delete or Purge endpoint in this baseline.

## 2. Owner boundary

Every repository read and mutation includes the authenticated owner identity. A package belonging to another owner is indistinguishable from an absent package: get, update, and archive return the same not-found response. List returns only the current owner's rows. API responses do not expose `owner_user_id`.

## 3. Protected API

All endpoints require the server-side Session established by `M1-SEC-001`:

| Method  | Path                                | Behavior                                            |
| ------- | ----------------------------------- | --------------------------------------------------- |
| `POST`  | `/v1/content-packages`              | Create an owner-scoped package.                     |
| `GET`   | `/v1/content-packages`              | List by active/archived/all with keyset pagination. |
| `GET`   | `/v1/content-packages/{id}`         | Read one owner-scoped package.                      |
| `PATCH` | `/v1/content-packages/{id}`         | Update metadata with `expectedRevision`.            |
| `POST`  | `/v1/content-packages/{id}/archive` | Archive with `expectedRevision`.                    |

List order is stable and descending by `(created_at, id)`. Its cursor is opaque to callers, versioned internally, bounded in length, and validated before use. The default filter is active, the default page size is `20`, and the maximum is `50`.

Requests use the common versioned error envelope. Invalid input is `422`; absent or other-owner identities are `404`; stale revisions and invalid lifecycle transitions are `409`. Error payloads do not reflect submitted metadata, credentials, SQL, or exception details.

## 4. Persistence and migration

PostgreSQL remains authoritative. `migrations/0001_large_donald_blake.sql` creates `content_packages` after the immutable Session migration. Database checks preserve the bounded mode, output, lifecycle, revision, title, description, and archive-state invariants. API startup does not run migrations automatically.

The Drizzle repository maps rows to Domain values at the adapter boundary. Update and Archive use one owner-, identity-, lifecycle-, and revision-scoped SQL update. A zero-row result is classified through a new owner-scoped read and never weakens non-disclosure.

## 5. Artifact identity foundation

The Domain package also defines the separate identities and head references for Artifact, Working Copy, immutable Version, and Artifact Head. This preserves the accepted distinction between mutable work, immutable history, review candidate, and approved version. `M1-CP-001` deliberately stores no Artifact body and creates no Approval behavior or Artifact persistence.

## 6. Verification boundary

Deterministic unit tests cover metadata normalization, revision and archive invariants, owner-scoped use cases, stale-write classification, and the Artifact identity rules. The isolated integration harness applies both reviewed migrations and exercises authentication, create/get/update/list/archive, stale revision rejection, owner non-disclosure, and cleanup against disposable PostgreSQL.

This is an API and persistence integration test for the bounded Content Package foundation. It is not a browser test, full product end-to-end test, Source/Workflow test, Agent Eval, Queue test, or release gate.
