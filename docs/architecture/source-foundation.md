# ContentOS Source Foundation

**Status:** Current Truth

**Scope:** Source domain model, persistence, object storage, and the first Source API boundary

**Last Updated:** 2026-07-31

This document records the architectural foundation introduced by `M2-SRC-001 — Pasted-text Source Capture and Approval Foundation` and extended by `M2-SRC-002 — .md/.txt File-upload Source Capture and Upload Quarantine`. It does not introduce URL Fetcher, Workflow Engine, Queue, Agent, Research, Render, Export, or publishing behavior.

Related documents: [Domain Overview](domain-overview.md), [Artifact Versioning](artifact-versioning.md), [Technical Architecture](technical-architecture.md), [Repository Structure](repository-structure.md), [Security Baseline](../security/security-baseline.md), [Data Classification](../security/data-classification.md), [Integration Smoke Harness](../quality/integration-smoke-harness.md), and the [Roadmap](../implementation/roadmap.md).

---

## 1. Purpose

The Source Foundation lets the authenticated owner add a Pasted Text Source or a `.md`/`.txt` file-upload Source to an active Content Package, preserve original bytes as one immutable private Raw Snapshot, review a revision-controlled Normalized Source Working Copy, create immutable Normalized Source Versions, and explicitly approve one exact Version as the only future Research-eligible input.

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
- The supported Source types are `pasted_text` and `uploaded_text`; the supported capture types are `pasted_text` and `uploaded_text`. Each MVP input path uses one value in both dimensions; the `.md` vs `.txt` distinction is carried by the Raw Snapshot content type. Role limits apply across capture types.

## 4. Byte and text bounds

Pasted text is bounded by UTF-8 byte length:

- `PASTED_TEXT_MAX_BYTES = 100_000` (reversible implementation detail in `packages/core/src/source/source-values.ts`).
- Empty, whitespace-only, oversized, embedded-NUL, and non-well-formed Unicode text (including lone UTF-16 surrogates) are rejected at both the HTTP boundary and the Domain layer. Supplementary-plane Unicode scalar values remain valid.
- The same Unicode rule applies to optional Source labels. Their 200-character limit is counted as Unicode scalar values, matching JSON Schema `maxLength` and PostgreSQL `char_length`, rather than JavaScript UTF-16 code units. Core validates body and label before any Object Storage write, so PostgreSQL-incompatible text has no object or database side effect.
- The exact original bytes are preserved separately in Object Storage as one immutable Raw Snapshot.
- The Normalized Working Copy body is the editable review representation; it starts as the captured text and may diverge through edits.

## 5. File-upload capture and Upload Quarantine

`M2-SRC-002` adds the second MVP input path (DEC-268): the owner uploads one `.md` or `.txt` file through the protected multipart route `POST /v1/content-packages/:packageId/sources/upload` (parts: `file`, `role`, optional `label`). On success the flow joins the pasted-text pipeline unchanged: one Source Reference (`source_type = capture_type = uploaded_text`), one immutable Raw Snapshot of the exact original file bytes, one Normalized Working Copy seeded from the validated decoded text, and the same Version/Head/Approval semantics.

### 5.1 Upload Quarantine model

Per DEC-208 and Security Baseline §9, uploads pass a request-scoped Upload Quarantine gate in Core (`packages/core/src/source/upload.ts`) before any Object Storage or database side effect:

1. **Filename:** well-formed Unicode, 1–255 bytes, no path separators, no NUL or C0/C1 control characters; final extension (case-insensitive) must be `.md` or `.txt`. Filenames never define filesystem paths — the entire flow is in-memory. Defense is layered: the multipart transport (busboy) additionally reduces filenames to their basename, compliant clients sanitize before sending, and Core rejects separator/control characters as a transport-independent invariant.
2. **Declared-MIME consistency:** accepted declared Content-Type values are `text/plain`, `text/markdown`, `application/octet-stream`, or absent (parameters ignored); anything else is denied.
3. **Size:** `UPLOAD_FILE_MAX_BYTES = 100_000` raw bytes — a reversible implementation detail matching the pasted-text bound and inside the existing snapshot byte-size constraint. The Security Baseline leaves the numeric limit open; this is the MVP value.
4. **Encoding:** strict UTF-8 decode; invalid sequences denied; one leading U+FEFF BOM is stripped from the normalized text only (the Raw Snapshot preserves the exact original bytes, including BOM and CRLF); NUL and lone surrogates denied; decoded text must be non-empty after trim and within the normalized text bound.
5. **Label:** when no explicit label is supplied, the sanitized filename stem (≤200 scalar values) becomes the label. Explicit labels obey the standard label rules. The raw filename itself is not persisted in this foundation.

A denied upload creates zero persisted state (the quarantine buffer is released; lifecycle cleanup is trivial). Every unsafe upload denial emits one structured diagnostic line prefixed `security-audit category=unsafe-upload-denial` carrying only safe fields (correlation id, owner id, denial keyword, allowlisted extension token, byte size) — never filename text, upload body, paths, or credentials. A persistent object-store quarantine path and malware scanning remain open (Security Baseline §20) and are not selected here.

### 5.2 Upload Raw Snapshot content types

| Extension | Stored Raw Snapshot content type |
| --------- | -------------------------------- |
| `.txt`    | `text/plain; charset=utf-8`      |
| `.md`     | `text/markdown; charset=utf-8`   |

The `ObjectStore` Port accepts a content type from exactly this two-value allowlist (`SOURCE_SNAPSHOT_CONTENT_TYPES`); adapters reject other values and verify the stored type on integrity reads.

### 5.3 Multipart transport

The API registers `@fastify/multipart@10.1.0` (MIT; official Fastify plugin; bounded choice justified in the M2-SRC-002 Work Packet) with transport limits: one file part, bounded fields, and `fileSize = UPLOAD_FILE_MAX_BYTES + 1`. The one-byte headroom exists because busboy truncates at the limit; without it an oversized file would be silently truncated into an at-bound file. With headroom, oversized files are detected and formally denied; Core re-enforces the exact 100,000-byte bound before any side effect, so the transport limits are a backstop only. Quarantine denials return `422 INVALID_REQUEST` with stable `details[].keyword` values: `upload-file-missing`, `upload-too-many-files`, `upload-file-size`, `upload-file-extension`, `upload-file-name`, `upload-media-type`, `upload-encoding`, `upload-file-empty`, `upload-field-invalid`, `upload-field-limit`. No new API error codes are introduced.

## 6. ObjectStore Port and S3 adapter

The Source domain defines a framework-independent `ObjectStore` Port in `packages/core/src/source/object-store.ts`. It exposes:

- `putImmutable` — store owner-scoped immutable bytes under an allowlisted snapshot content type (`text/plain; charset=utf-8` or `text/markdown; charset=utf-8`) and return `storageKey`, `sha256`, `byteSize`, and `contentType`.
- `readForIntegrity` — verify actual bytes, actual SHA-256, stored SHA-256 metadata, byte size, and the allowlisted content type against one expected immutable-object record.
- `deleteForCompensation` — delete an object only to compensate a failed initial database creation.

The `packages/object-storage` package implements this Port using `@aws-sdk/client-s3@3.1096.0`:

- Object keys follow the opaque pattern `sources/{ownerUserId}/{contentPackageId}/{sourceId}/raw/{snapshotId}`. No user-controlled path segment is accepted.
- Immutable-put semantics use one conditional `PutObject` request with `If-None-Match: *`; a collision is rejected and never overwrites existing bytes.
- SHA-256 and byte size are stored as object metadata and verified with actual bytes and the allowlisted content type on read.
- Compensation delete is used only when a database write fails after a successful object put. Compensation failure surfaces `SOURCE_COMPENSATION_FAILED` and is never reported as success.
- If the database acknowledgement is lost, exact capture identity is reconciled first. A matching committed graph succeeds, confirmed absence permits compensation, and an unknown or mismatched outcome retains immutable evidence and returns an internal reconciliation failure.
- No public ACL, signed URL, or browser-direct object access exists.

## 7. Persistence

The second additive forward migration (`migrations/0002_soft_war_machine.sql`) creates six tables:

- `sources` — Source Reference with role, type, capture type, and label.
- `source_raw_snapshots` — immutable Raw Snapshot metadata with SHA-256 and byte size constraints.
- `source_working_copies` — mutable Working Copy with revision-based optimistic concurrency and the last checkpointed revision.
- `source_versions` — immutable Version with sequential `version_number`, `parent_version_id`, `content_hash`, `schema_version`, and exact `raw_snapshot_id` dependency.
- `source_heads` — per-Source Head with `working_copy_id`, `latest_version_id`, `review_candidate_version_id`, and `approved_version_id`.
- `source_approvals` — append-only Approval records with a unique constraint on `(source_id, approved_version_id)`.

Normalized Working Copy and Version bodies are PostgreSQL `jsonb` objects with the exact `{ "text": string }` representation. JSON Schema and Core reject NUL and lone surrogates before persistence; PostgreSQL's JSON/UTF-8 boundary independently rejects the same invalid encodings, while supplementary-plane scalar values round-trip. Composite unique keys and foreign keys keep every child, lineage/dependency, head pointer, and approval bound to the same Source and owner scope; one Raw Snapshot per Source and global storage-key uniqueness are enforced. `approved_by_id = owner_user_id` is a database check. All queries use parameterized Drizzle expressions. No user-controlled object key or filesystem path is constructed from request input.

The third additive forward migration (`migrations/0003_absent_prism.sql`, M2-SRC-002) relaxes exactly three check constraints and changes nothing else: `sources_source_type_check` and `sources_capture_type_check` accept `pasted_text` and `uploaded_text`; `source_raw_snapshots_content_type_check` accepts `text/plain; charset=utf-8` and `text/markdown; charset=utf-8`. No columns, indexes, data, or other constraints change; existing rows remain valid and no backfill is needed.

Creating a Version checkpoints one precise Working Copy revision. Sequential or concurrent retries for that unchanged revision are rejected; a later edit advances the revision and permits the next immutable Version. Capture, edit, Version, and Approval transactions lock and re-check the owning Content Package lifecycle before committing. Source reads and writes are unavailable once the Package is archived.

## 8. Configuration

Object Storage configuration is loaded through typed fail-fast validation in `packages/config`:

- `ApiConfig.objectStorage` — non-secret configuration: endpoint, region, bucket, `forcePathStyle`.
- `ApiSecrets.objectStorageAccessKey` and `ApiSecrets.objectStorageSecretKey` — private credentials that never appear in public config, logs, or error messages.

Missing or malformed object-storage configuration causes the API to fail before accepting any work.

## 9. API boundary

Protected Source routes live under `/v1/content-packages/:packageId/sources`:

| Method | Path                             | Purpose                                               |
| ------ | -------------------------------- | ----------------------------------------------------- |
| POST   | `/`                              | Capture a Pasted Text Source for an active Package    |
| POST   | `/upload`                        | Capture a `.md`/`.txt` file-upload Source (multipart) |
| GET    | `/`                              | List Sources using an opaque keyset cursor            |
| GET    | `/:sourceId`                     | Get one Source with Head state                        |
| GET    | `/:sourceId/working-copy`        | Get the Normalized Working Copy review body           |
| PATCH  | `/:sourceId/working-copy`        | Edit the Working Copy using `expectedRevision`        |
| POST   | `/:sourceId/versions`            | Create an immutable Version from the Working Copy     |
| GET    | `/:sourceId/versions`            | List immutable Versions                               |
| GET    | `/:sourceId/versions/:versionId` | Get one exact immutable Version body for review       |
| POST   | `/:sourceId/approval`            | Approve one exact eligible Version                    |

The JSON capture route remains `pasted_text`-only; `uploaded_text` capture is only available through the multipart upload route. Responses never include storage keys, credentials, temporary URLs, or raw object-store responses. The list endpoint returns only Source Reference fields without working-copy bodies or snapshot details.

## 10. Error mapping

Source failures map into the existing stable error envelope:

| Error code                                | HTTP status | Condition                                             |
| ----------------------------------------- | ----------- | ----------------------------------------------------- |
| `SOURCE_NOT_FOUND`                        | 404         | Source does not exist or is not owned by the caller   |
| `CONTENT_PACKAGE_NOT_FOUND`               | 404         | Content Package is unknown or not owned by the caller |
| `CONTENT_PACKAGE_STATE_CONFLICT`          | 409         | An owned Content Package is archived                  |
| `SOURCE_REVISION_CONFLICT`                | 409         | `expectedRevision` does not match the stored revision |
| `SOURCE_ROLE_LIMIT_EXCEEDED`              | 409         | Second Primary or sixth Supporting Source             |
| `SOURCE_STATE_CONFLICT`                   | 409         | Other Source state conflict                           |
| `SOURCE_VERSION_NOT_FOUND`                | 404         | Referenced Version does not exist                     |
| `SOURCE_VERSION_NOT_ELIGIBLE`             | 409         | Version exists but is not eligible for Approval       |
| `SOURCE_ALREADY_APPROVED`                 | 409         | Duplicate Approval for the same Version               |
| `SOURCE_VERSION_ALREADY_EXISTS`           | 409         | This Working Copy revision was already checkpointed   |
| `INVALID_REQUEST`                         | 422         | Invalid input at the HTTP boundary                    |
| `INVALID_REQUEST` (+ `details[].keyword`) | 422         | Upload Quarantine denial (stable `upload-*` keywords) |
| `INTERNAL_ERROR`                          | 500         | Capture, compensation, or reconciliation failure      |

## 11. Security invariants

- Pasted Text, uploaded files, and all Source bodies are private, untrusted data.
- Uploads pass the request-scoped Upload Quarantine gate (§5) before any Object Storage or database side effect; denied uploads create zero persisted state, and each unsafe denial emits one `security-audit category=unsafe-upload-denial` diagnostic with safe fields only.
- Uploaded files never execute, filenames never define filesystem paths, and no user-controlled object key is constructed from upload input.
- Working Copy edits use the structured `{ "text": string }` request body and are validated at the HTTP boundary, then re-enforced by Core byte, whitespace, NUL, and Unicode-scalar rules. Before Version creation and Approval, an API-composed Ajv 2020-12 adapter validates the exact persisted body through the Core validator Port; Core does not depend on Ajv.
- Every protected operation requires the existing Session and owner authorization; opaque IDs never substitute for authorization.
- Object keys are opaque, owner-scoped, and constructed only from server-generated IDs.
- No Source body, credential, object-store response, signed URL, full request, or object key appears in ordinary logs or errors.
- Private bucket/object access only; no public ACL and no browser-direct object fetch.
- Raw Snapshot and Normalized review representation remain distinct objects.
- Approval is human-only, exact-Version-bound, append-only, and cannot be inferred from successful capture or Version creation. Its deterministic validation summary binds the validated Version schema and content hash.

## 12. Schema contract

The persisted Normalized Source body uses JSON Schema 2020-12:

- Schema file: `schemas/source/normalized-source-v1.json`.
- TypeScript interface: `NormalizedSourceBody` in `packages/contracts/src/source/normalized-source-body.ts`.
- Schema version constant: `source/normalized/v1`.
- A synchronization test in `packages/contracts/src/api/source-contracts.test.ts` validates that the TypeScript boundary type and the JSON Schema document agree.

## 13. Decision traceability

This foundation follows DEC-059–DEC-063 (Source model, inputs, limits, snapshots, and Approval), DEC-066 (human fallback paths for failed capture), DEC-126–DEC-128 (Workflow template and separate state/execution records), DEC-133–DEC-135 (structured Commands, concurrency/idempotency, and the Workflow Event Log), DEC-161–DEC-176 (identity, versioning, persistence, API, and Outbox conventions), DEC-199 (private-by-default and least privilege), DEC-207 (Raw Source and safe-review separation), DEC-208 (upload allowlist, quarantine, and content validation), DEC-214 (Security Audit Event separation), DEC-226 (PostgreSQL authority), DEC-232–DEC-233 (private Object Store and versioned JSON Schema), DEC-245 (deterministic validation), DEC-247 (layered test strategy), DEC-259 (zero-tolerance invariants), DEC-268 (MVP Source input boundary), DEC-271–DEC-272 (human gates and versioned Artifact core), DEC-280 (Source/runtime foundations before the first Agent), DEC-287–DEC-292 (Work Item, repository, and scope governance), and DEC-293 (recoverable formal MVP completion). The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
