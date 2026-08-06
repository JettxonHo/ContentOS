# ContentOS Secret Management

**Status:** Current Truth

**Scope:** MVP Secret representation, provisioning, process access, runtime use, rotation, revocation, audit, and incident boundaries

**Last Updated:** 2026-08-06

This document defines how ContentOS handles Secrets without placing Secret values in Domain data, application content, source control, logs, Queue payloads, Prompts, or Exports. It defines policy and lifecycle semantics, not a local Secret tool, production Secret Store, Credential Reference format, cloud product, or implementation code.

Related current-truth documents:

- [Technical Architecture](../architecture/technical-architecture.md)
- [Process Topology](../architecture/process-topology.md)
- [Agent Runtime](../architecture/agent-runtime.md)
- [Rendering](../architecture/rendering.md)
- [Data Classification](data-classification.md)
- [Security Baseline](security-baseline.md)
- [Source Fetcher](source-fetcher.md)

---

## 1. Secret Management Goals

ContentOS requires:

- no Secret value in Git or Repository files;
- no Secret value in ordinary logs, traces, metrics, or error responses;
- least-privilege Secret access;
- process-specific Credential resolution;
- support for rotation, version transition, expiry, and revocation;
- auditable Secret access and lifecycle changes;
- strict separation between local-development and production Credentials;
- fail-fast behavior when a required Secret cannot be resolved safely;
- no Secret propagation through Domain, Agent, Queue, rendering, or Export data paths.

## 2. Secret versus Secret Reference

```text
Secret
Secret Reference
Runtime Configuration
Non-secret Configuration
```

- **Secret:** the credential value or cryptographic material that grants access or protects confidentiality/integrity. It is Restricted Security Data.
- **Secret Reference:** a non-secret identifier that tells an authorized runtime resolver which Secret to obtain. It grants no access by itself.
- **Runtime Configuration:** process startup configuration that may contain a Secret Reference and non-secret settings but never the Secret value in durable application configuration.
- **Non-secret Configuration:** ordinary versioned or deployment settings such as Provider Alias, endpoint policy, timeout category, or feature behavior that contain no Credential.

Domain objects, Model Configuration, and long-lived application configuration store only Secret References. The Secret value is resolved only inside the process runtime that must use it. A Secret Reference is still security-sensitive metadata and should not expose unnecessary store path, account, tenant, environment, or infrastructure topology.

## 3. Secret Categories

The baseline covers at least:

- PostgreSQL Database Credential;
- Redis Credential;
- Object Storage Credential;
- Model Provider API Key;
- Session and Authentication Secret;
- encryption key;
- TLS private key;
- signing Secret;
- Fetcher Gateway service Secret;
- future Image Provider Credential.

Future OAuth refresh tokens, webhook signing Secrets, or third-party integration Credentials enter the same boundary only after the dedicated security review required for those capabilities.

## 4. Process-specific Secret Access

| Process    | Minimum required Secret access                                                                                                                                                                         | Explicitly prohibited or not held by default                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `web`      | None; browser-visible configuration is non-secret                                                                                                                                                      | All server Secrets, database/Redis/Object Storage Credentials, Provider keys, signing and encryption keys                               |
| `api`      | Only API-owned database/session/signing/encryption and scoped Object access required by its use cases; Fetcher Gateway service Secret                                                                  | Provider Credentials exposed to Browser; Fetcher or Renderer identity; universal storage administration                                 |
| `worker`   | Scoped database/Queue/Object access and only approved Provider Credential References required for assigned Agent work                                                                                  | Universal Object Storage administration; Fetcher or Renderer identity; unrelated Provider keys; automatic Approval or publish authority |
| `fetcher`  | Fetcher Gateway service Secret and the explicitly approved Gateway API origin; its unregistered M2-FETCH-001B preparation boundary has a separate scoped Object Storage identity for later runtime use | Model or Image Provider keys; Human Opinion access; general database Credential; signing or export Credentials                          |
| `renderer` | Only its Queue/state path and scoped approved-input/render-output Object Storage Credential                                                                                                            | Model or Image Provider keys; public-fetch Credential; Raw Human Opinion; general database or storage administration                    |

Each process resolves only the Secrets declared by its typed startup configuration. API never returns a Provider Credential to the Browser. Worker access to a Provider key does not give the Agent or model access to that key; only the Adapter uses the value for the intended request.

## 5. Local Development

- `.env.example`, if later created through an approved implementation task, contains variable names and non-secret placeholders only.
- Real `.env` and local override files are never committed.
- Local and production Secrets are distinct and cannot be copied as a default setup path.
- Fake Provider and deterministic fixtures are the default safe development path.
- Unit, integration, Workflow, and ordinary local tests do not require real Provider Credentials.
- Documentation and fixtures never use values that resemble valid real keys, private keys, signed URLs, Cookies, or tokens.
- Local process boundaries still preserve separate configuration ownership even when processes run on one machine.

This document does not create configuration files or select a local Secret tool.

## 6. Production Provisioning

- Secrets are delivered through a controlled deployment environment, Secret Store, or equivalent injection mechanism.
- Container images and build artifacts contain no production Secret.
- Secret values are not written to ordinary configuration files, Domain tables, migration files, or release manifests.
- Each process resolves only the exact Secrets it needs at startup or approved runtime use.
- Missing, inaccessible, malformed, or incompatible required Secret causes fail-fast startup or a safe unavailable state; it does not fall back to a hardcoded or broad Credential.
- Provisioning and access policy preserve environment separation, Service Identity, rotation, and audit.
- Backup of application databases does not become a hidden Provider-Secret backup through application design.

No production Secret Manager is selected here.

## 7. Runtime Use

- A Secret value exists in process memory only for the shortest practical use and is not retained in Domain objects or execution manifests.
- Never interpolate a Secret into log messages, metric labels, trace attributes, error details, filenames, Object keys, or user-visible output.
- Never place a Secret in an Agent Prompt, Frozen Input Snapshot, Raw Model Output, Workflow Event, Queue payload, Artifact, Render input, Export, or Eval dataset.
- Provider Adapter resolves an approved Credential Reference outside the model-facing Context and uses it only for the intended Provider request.
- Error normalization and exception handling redact authorization material before persistence or client response.
- A subprocess, Browser, Fetcher, Renderer, model, or Tool receives no inherited Secret environment beyond its explicit process contract.
- `CONTENTOS_FETCHER_GATEWAY_SECRET` is injected only into the API and Fetcher
  process contracts. The API compares its SHA-256 digest in constant time;
  the opaque claim is sent only in the private Heartbeat header and only its
  hash is persisted. `CONTENTOS_FETCHER_GATEWAY_API_ORIGIN` is non-secret and
  is restricted to the approved loopback HTTP(S) origin.
- The Fetcher Object Storage identity uses only
  `CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY` and
  `CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY` with the matching Fetcher-only
  endpoint, region, bucket, and path-style settings. `M2-FETCH-001C` also
  requires the separate `CONTENTOS_FETCHER_REDIS_URL`; none of these settings
  fall back to API or Worker credentials, and the Fetcher never receives
  `DATABASE_URL`.
- A signed URL is temporary credential material: it is short-lived, scoped, excluded from ordinary logs, and never a permanent Object Reference.

## 8. Rotation and Revocation

- A Secret can rotate without modifying Domain Artifacts, historical Versions, Prompt Templates, or Agent Specs.
- New/old-version overlap, if required, is bounded, intentional, and audited.
- Compromised or unnecessary Credentials can be revoked immediately without waiting for ordinary release cadence.
- Rotation records the Secret Reference, category, responsible Principal, time, result, and affected service scope without recording the value.
- Historical Agent Runs retain only their Model Configuration Version or Credential Reference, never the historical Secret value.
- Runtime reload or restart behavior is defined by the selected implementation and verified before production use.
- The disposition of in-flight Tasks during rotation or emergency revocation remains an Open Implementation Decision; no Task may continue by silently substituting an unauthorized Credential.

## 9. Logging and Telemetry

Ordinary logs, traces, metrics, error reports, and Security Audit Event payloads never contain:

- Secret values;
- authorization headers;
- Cookies;
- Session tokens;
- signed URLs or their signatures;
- Provider API Keys;
- database URLs containing Credentials;
- TLS or other private keys.

They may contain, when operationally necessary and appropriately redacted:

- opaque Secret Reference ID;
- Provider Alias;
- requesting Service Identity;
- access allowed/denied/error result;
- rotation, revocation, or expiry event category;
- stable redacted error category and Correlation ID.

Security audit proves the operation occurred without copying the Secret into the audit system.

## 10. Queue, Database and Object Storage

- Queue payloads never contain a Secret value, Cookie, authorization header, or signed URL.
- Application and Domain database tables never store Secret values; they may store an opaque Secret Reference where the Contract requires it.
- Object bodies and Object metadata do not contain infrastructure Secret values.
- Object keys contain no Secret and grant no authority by themselves.
- Signed URLs are ephemeral access mechanisms, not durable Domain references.
- Backups of PostgreSQL, Redis state, or Object metadata should not contain Provider Secret values because the application never persists them there.
- Storage access Credentials are process-scoped; Worker, Fetcher, Renderer, and API do not share universal administration access.
- Deletion of user content does not delete unrelated infrastructure Secrets, while Credential revocation remains a separate security lifecycle.

## 11. Secret Detection

The implementation and release process must eventually include:

- Repository Secret scanning;
- CI Secret scanning;
- `.gitignore` protection for local Secret files;
- checks that examples and documentation contain placeholders only;
- log-redaction tests for known credential paths and error cases;
- checks that Queue, Export, Prompt, and generated manifests exclude Secret fields;
- review of staged changes and build artifacts before release.

No scanning tool is selected here. A detected Secret is a security incident: deleting the visible line or file is not sufficient because history, logs, caches, artifacts, and external systems may still contain the value.

## 12. Secret Incident Response

```text
Detect
→ Revoke
→ Rotate
→ Audit exposure
→ Remove from active systems
→ Review Git history and logs
→ Validate recovery
```

- Contain affected access and stop unsafe use.
- Revoke the exposed Credential before treating cleanup as complete.
- Rotate dependent Credentials when compromise scope is uncertain.
- Audit processes, Provider requests, storage access, logs, build artifacts, and external exposure.
- Remove the value from active configuration, artifacts, logs, and caches under the applicable incident process.
- Review Git history and published artifacts even if the current working tree is clean.
- Validate that replacement Credentials work only in intended process scopes and the revoked value no longer works.
- Preserve minimal investigation evidence without copying the Secret into the incident record.

This is the minimum lifecycle, not a complete Incident Runbook.

## 13. Secret Management Invariants

- Secret values never enter Git.
- Secret values never enter ordinary logs, traces, metrics, or client error responses.
- Secret values never enter Queue payloads.
- Secret values never enter Prompt, Input Snapshot, model-facing Context, or Raw Model Output by design.
- Secret values never enter Artifact, Render Output, Publishing Export, User Data Export, or Public Share.
- A process obtains only the Secrets required for its responsibility.
- Secret Reference and Secret value remain separate.
- Missing required Secret causes fail-fast behavior, never hardcoded fallback.
- Rotation never rewrites historical Artifact or Agent Run content.
- Exposure requires revocation and recovery validation, not only hiding or deleting the visible value.
- Web, Fetcher, and Renderer have no Model Provider Credential.
- The Fetcher Gateway Secret is never stored in a Task, Queue payload, URL,
  log, error response, OpenAPI document, or Object.
- Signed URL never becomes a long-lived Object Reference.

## 14. Open Implementation Decisions

The following remain open and are not selected here:

- local Secret tool;
- production Secret Store;
- Credential Reference format;
- Secret cache behavior;
- rotation overlap mechanism;
- signed URL TTL;
- encryption-key hierarchy;
- TLS termination ownership.

## 15. Decision Traceability

| Area                                                                                                     | Accepted Decisions                                 | Primary historical sources                |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Model Configuration Credential Reference and Secret separation                                           | DEC-180, DEC-197                                   | [Session-020](../sessions/session-020.md) |
| Private-by-default, identities, Secret Layer, encryption, redaction, and security review                 | DEC-199–DEC-203, DEC-210–DEC-220                   | [Session-021](../sessions/session-021.md) |
| Process isolation, Queue minimization, Object Storage, telemetry, typed configuration, and Fake Provider | DEC-221, DEC-228, DEC-230–DEC-232, DEC-239–DEC-242 | [Session-022](../sessions/session-022.md) |
| Zero-tolerance leakage and security/recovery release gates                                               | DEC-245, DEC-250, DEC-259, DEC-262, DEC-264        | [Session-023](../sessions/session-023.md) |
| M0 boundary, horizontal security, hardening, and release recovery                                        | DEC-278, DEC-284–DEC-285, DEC-291–DEC-293          | [Session-024](../sessions/session-024.md) |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
