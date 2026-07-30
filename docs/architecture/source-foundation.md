# ContentOS Source Foundation

**Status:** Current Truth

**Scope:** Source domain model, persistence, object storage, and the first Source API boundary

**Last Updated:** 2026-07-29

This document records the architectural foundation introduced by `M2-SRC-001 — Pasted-text Source Capture and Approval Foundation`. It does not introduce URL Fetcher, file upload, Workflow Engine, Queue, Agent, Research, Render, Export, or publishing behavior.

Related documents: [Domain Overview](domain-overview.md), [Artifact Versioning](artifact-versioning.md), [Technical Architecture](technical-architecture.md), [Repository Structure](repository-structure.md), [Security Baseline](../security/security-baseline.md), [Data Classification](../security/data-classification.md), [Integration Smoke Harness](../quality/integration-smoke-harness.md), and the [Roadmap](../implementation/roadmap.md).

---

## 1. Purpose

The Source Foundation lets the authenticated owner add a Pasted Text Source to an active Content Package, preserve original bytes as one immutable private Raw Snapshot, review a revision-controlled Normalized Source Working Copy, create immutable Normalized Source Versions, and explicitly approve one exact Version as the only future Research-eligible input.

## 2. Domain objects

A Source is not one row or one JSON object. It is a composite of distinct objects with different lifecycle semantics:

| Object           | Mutability  | Purpose                                                                                 |
| ---------------- | ----------- | --------------------------------------------------------------------------------------- |
| Source Reference | Immutable   | Stable identity, ownership, role, and capture type                                      |
| Raw Snapshot     | Immutable   | Metadata for the exact original bytes stored privately in Object Storage                |
| Working Copy     | Mutable     | Revision-controlled normalized review body; editing never overwrites Raw Snapshot bytes |
| Source Version   | Immutable   | A named, content-hashed snapshot of the Working Copy; cannot be overwritten or deleted  |
| Source Head      | Mutable     | Distinct pointers: Working Copy, Latest Version, Review Candidate, Approved Version     |
| Source Approval  | Append-only | Records that one exact eligible Version was human-approved; duplicates are rejected     |

Head is not one "current" pointer. It distinguishes Working Copy, Latest Version, Review Candidate, and Approved Version as separate fields, following the artifact-versioning invariant.

## 3. Role and limit rules

- A Content Package may have at most one `primary` Source.
- A Content Package may have at most five `supporting` Sources.
- Role limits are enforced inside a database transaction using `SELECT ... FOR UPDATE` on the Content Package row.
- The only supported Source type is `pasted_text`; the only supported capture type is `pasted_text`.

## 4. Byte and text bounds

Pasted text is bounded by UTF-8 byte length:

- `PASTED_TEXT_MAX_BYTES = 100_000` (reversible implementation detail in `packages/core/src/source/source-values.ts`).
- Empty, whitespace-only, oversized, embedded-NUL, and non-well-formed Unicode text (including lone UTF-16 surrogates) are rejected at both the HTTP boundary and the Domain layer. Supplementary-plane Unicode scalar values remain valid.
- The same Unicode rule applies to optional Source labels. Their 200-character limit is counted as Unicode scalar values, matching JSON Schema `maxLength` and PostgreSQL `char_length`, rather than JavaScript UTF-16 code units. Core validates body and label before any Object Storage write, so PostgreSQL-incompatible text has no object or database side effect.
- The exact original bytes are preserved separately in Object Storage as one immutable Raw Snapshot.
- The Normalized Working Copy body is the editable review representation; it starts as the captured text and may diverge through edits.

## 5. ObjectStore Port and S3 adapter

The Source domain defines a framework-independent `ObjectStore` Port in `packages/core/src/source/object-store.ts`. It exposes:

- `putImmutable` — store owner-scoped immutable bytes and return `storageKey`, `sha256`, and `byteSize`.
- `readForIntegrity` — verify actual bytes, actual SHA-256, stored SHA-256 metadata, byte size, and the fixed content type against one expected immutable-object record.
- `deleteForCompensation` — delete an object only to compensate a failed initial database creation.

The `packages/object-storage` package implements this Port using `@aws-sdk/client-s3@3.1096.0`:

- Object keys follow the opaque pattern `sources/{ownerUserId}/{contentPackageId}/{sourceId}/raw/{snapshotId}`. No user-controlled path segment is accepted.
- Immutable-put semantics use one conditional `PutObject` request with `If-None-Match: *`; a collision is rejected and never overwrites existing bytes.
- SHA-256 and byte size are stored as object metadata and verified with actual bytes and the fixed content type on read.
- Compensation delete is used only when a database write fails after a successful object put. Compensation failure surfaces `SOURCE_COMPENSATION_FAILED` and is never reported as success.
- If the database acknowledgement is lost, exact capture identity is reconciled first. A matching committed graph succeeds, confirmed absence permits compensation, and an unknown or mismatched outcome retains immutable evidence and returns an internal reconciliation failure.
- No public ACL, signed URL, or browser-direct object access exists.

## 6. Persistence

The second additive forward migration (`migrations/0002_soft_war_machine.sql`) creates six tables:

- `sources` — Source Reference with role, type, capture type, and label.
- `source_raw_snapshots` — immutable Raw Snapshot metadata with SHA-256 and byte size constraints.
- `source_working_copies` — mutable Working Copy with revision-based optimistic concurrency and the last checkpointed revision.
- `source_versions` — immutable Version with sequential `version_number`, `parent_version_id`, `content_hash`, `schema_version`, and exact `raw_snapshot_id` dependency.
- `source_heads` — per-Source Head with `working_copy_id`, `latest_version_id`, `review_candidate_version_id`, and `approved_version_id`.
- `source_approvals` — append-only Approval records with a unique constraint on `(source_id, approved_version_id)`.

Normalized Working Copy and Version bodies are PostgreSQL `jsonb` objects with the exact `{ "text": string }` representation. JSON Schema and Core reject NUL and lone surrogates before persistence; PostgreSQL's JSON/UTF-8 boundary independently rejects the same invalid encodings, while supplementary-plane scalar values round-trip. Composite unique keys and foreign keys keep every child, lineage/dependency, head pointer, and approval bound to the same Source and owner scope; one Raw Snapshot per Source and global storage-key uniqueness are enforced. `approved_by_id = owner_user_id` is a database check. All queries use parameterized Drizzle expressions. No user-controlled object key or filesystem path is constructed from request input.

Creating a Version checkpoints one precise Working Copy revision. Sequential or concurrent retries for that unchanged revision are rejected; a later edit advances the revision and permits the next immutable Version. Capture, edit, Version, and Approval transactions lock and re-check the owning Content Package lifecycle before committing. Source reads and writes are unavailable once the Package is archived.

## 7. Configuration

Object Storage configuration is loaded through typed fail-fast validation in `packages/config`:

- `ApiConfig.objectStorage` — non-secret configuration: endpoint, region, bucket, `forcePathStyle`.
- `ApiSecrets.objectStorageAccessKey` and `ApiSecrets.objectStorageSecretKey` — private credentials that never appear in public config, logs, or error messages.

Missing or malformed object-storage configuration causes the API to fail before accepting any work.

## 8. API boundary

Protected Source routes live under `/v1/content-packages/:packageId/sources`:

| Method | Path                             | Purpose                                            |
| ------ | -------------------------------- | -------------------------------------------------- |
| POST   | `/`                              | Capture a Pasted Text Source for an active Package |
| GET    | `/`                              | List Sources using an opaque keyset cursor         |
| GET    | `/:sourceId`                     | Get one Source with Head state                     |
| GET    | `/:sourceId/working-copy`        | Get the Normalized Working Copy review body        |
| PATCH  | `/:sourceId/working-copy`        | Edit the Working Copy using `expectedRevision`     |
| POST   | `/:sourceId/versions`            | Create an immutable Version from the Working Copy  |
| GET    | `/:sourceId/versions`            | List immutable Versions                            |
| GET    | `/:sourceId/versions/:versionId` | Get one exact immutable Version body for review    |
| POST   | `/:sourceId/approval`            | Approve one exact eligible Version                 |

Responses never include storage keys, credentials, temporary URLs, or raw object-store responses. The list endpoint returns only Source Reference fields without working-copy bodies or snapshot details.

## 9. Error mapping

Source failures map into the existing stable error envelope:

| Error code                       | HTTP status | Condition                                             |
| -------------------------------- | ----------- | ----------------------------------------------------- |
| `SOURCE_NOT_FOUND`               | 404         | Source does not exist or is not owned by the caller   |
| `CONTENT_PACKAGE_NOT_FOUND`      | 404         | Content Package is unknown or not owned by the caller |
| `CONTENT_PACKAGE_STATE_CONFLICT` | 409         | An owned Content Package is archived                  |
| `SOURCE_REVISION_CONFLICT`       | 409         | `expectedRevision` does not match the stored revision |
| `SOURCE_ROLE_LIMIT_EXCEEDED`     | 409         | Second Primary or sixth Supporting Source             |
| `SOURCE_STATE_CONFLICT`          | 409         | Other Source state conflict                           |
| `SOURCE_VERSION_NOT_FOUND`       | 404         | Referenced Version does not exist                     |
| `SOURCE_VERSION_NOT_ELIGIBLE`    | 409         | Version exists but is not eligible for Approval       |
| `SOURCE_ALREADY_APPROVED`        | 409         | Duplicate Approval for the same Version               |
| `SOURCE_VERSION_ALREADY_EXISTS`  | 409         | This Working Copy revision was already checkpointed   |
| `INVALID_REQUEST`                | 422         | Invalid input at the HTTP boundary                    |
| `INTERNAL_ERROR`                 | 500         | Capture, compensation, or reconciliation failure      |

## 10. Security invariants

- Pasted Text and all Source bodies are private, untrusted data.
- Working Copy edits use the structured `{ "text": string }` request body and are validated at the HTTP boundary, then re-enforced by Core byte, whitespace, NUL, and Unicode-scalar rules. Before Version creation and Approval, an API-composed Ajv 2020-12 adapter validates the exact persisted body through the Core validator Port; Core does not depend on Ajv.
- Every protected operation requires the existing Session and owner authorization; opaque IDs never substitute for authorization.
- Object keys are opaque, owner-scoped, and constructed only from server-generated IDs.
- No Source body, credential, object-store response, signed URL, full request, or object key appears in ordinary logs or errors.
- Private bucket/object access only; no public ACL and no browser-direct object fetch.
- Raw Snapshot and Normalized review representation remain distinct objects.
- Approval is human-only, exact-Version-bound, append-only, and cannot be inferred from successful capture or Version creation. Its deterministic validation summary binds the validated Version schema and content hash.

## 11. Schema contract

The persisted Normalized Source body uses JSON Schema 2020-12:

- Schema file: `schemas/source/normalized-source-v1.json`.
- TypeScript interface: `NormalizedSourceBody` in `packages/contracts/src/source/normalized-source-body.ts`.
- Schema version constant: `source/normalized/v1`.
- A synchronization test in `packages/contracts/src/api/source-contracts.test.ts` validates that the TypeScript boundary type and the JSON Schema document agree.

## 12. Decision traceability

This foundation follows DEC-059–DEC-063 (Source model, inputs, limits, snapshots, and Approval), DEC-126–DEC-128 (Workflow template and separate state/execution records), DEC-133–DEC-135 (structured Commands, concurrency/idempotency, and the Workflow Event Log), DEC-161–DEC-176 (identity, versioning, persistence, API, and Outbox conventions), DEC-199 (private-by-default and least privilege), DEC-207 (Raw Source and safe-review separation), DEC-226 (PostgreSQL authority), DEC-232–DEC-233 (private Object Store and versioned JSON Schema), DEC-245 (deterministic validation), DEC-247 (layered test strategy), DEC-259 (zero-tolerance invariants), DEC-268 (MVP Source input boundary), DEC-271–DEC-272 (human gates and versioned Artifact core), DEC-280 (Source/runtime foundations before the first Agent), DEC-287–DEC-292 (Work Item, repository, and scope governance), and DEC-293 (recoverable formal MVP completion). The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
