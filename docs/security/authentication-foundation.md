# ContentOS Authentication Foundation

**Status:** Implementation Baseline
**Scope:** M1 single-user owner authentication, server-side Sessions, API protection, configuration, and operational boundaries
**Last Updated:** 2026-08-07

This document records the bounded authentication foundation introduced by `M1-SEC-001`. It implements no registration, password reset, role administration, external identity provider, JWT, Content Package behavior, or Web login screen.

Related documents: [Security Baseline](security-baseline.md), [Secret Management](secret-management.md), [Repository Structure](../architecture/repository-structure.md), [Integration Smoke Harness](../quality/integration-smoke-harness.md), and the [Roadmap](../implementation/roadmap.md).

## 1. Identity and Session model

- One configured owner is represented by an opaque UUID User Principal.
- The owner password exists at runtime only as user input; configuration stores a versioned `scrypt` hash Secret.
- Login issues 32 cryptographically random bytes encoded as an opaque cookie credential.
- PostgreSQL stores only the SHA-256 hash of that credential, with Session ID, owner UUID, creation time, expiry time, and optional revocation time.
- Missing, unknown, expired, or revoked credentials all produce the same unauthenticated boundary.
- Authentication establishes the principal. Later owner authorization remains a distinct check.

## 2. HTTP boundary

The API exposes:

| Endpoint               | Behavior                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `POST /v1/auth/login`  | Validates the bounded body, throttles repeated failures, creates an expiring Session, and sets the cookie. |
| `GET /v1/auth/session` | Returns safe principal and expiry metadata only for a valid Session.                                       |
| `POST /v1/auth/logout` | Revokes the persisted Session and clears the cookie.                                                       |
| `GET /openapi.json`    | Publishes the current REST contract without adding an interactive documentation UI dependency.             |

The cookie is `HttpOnly`, `SameSite=Strict`, and scoped to `/`. `Secure` is mandatory in production and intentionally disabled only in local/test HTTP mode. Unsafe requests must carry the exact configured Web Origin. Credentialed wildcard CORS is not used.

All failures use API error envelope version `1`, include a correlation identifier, and omit stacks, SQL, exception text, passwords, cookies, hashes, and database URLs.

The Workflow notification stream authenticates and owner-scopes once before
committing its private SSE response. It retains neither the cookie credential
nor a periodic Session lookup: the authenticated Session expiry bounds the
stream lifetime, and the browser closes it on disposal. A stream completion is
not a state response; recovery reads the owner-scoped REST Workflow projection.

## 3. Configuration and Secrets

`.env.example` lists placeholders only. API startup validates the environment mode, loopback bind address, exact Web Origin, owner UUID, Session TTL, cookie security mode, PostgreSQL URL, and supported password-hash format before listening. Invalid configuration fails startup with the configuration key and a safe reason, never the supplied value.

Generate a hash interactively:

```bash
corepack pnpm auth:hash-password
```

Do not put the plaintext password in arguments, shell history, Git, logs, or documentation. The command emits only the encoded hash for later Secret injection.

## 4. Migration boundary

`migrations/0000_unusual_midnight.sql` is the first product migration. It creates only `auth_sessions` and its indexes. Drizzle maintains its migration journal separately. API startup never applies migrations automatically; an operator supplies `DATABASE_URL` and runs:

```bash
corepack pnpm db:migrate
```

The committed migration is forward-only and the runner is repeatable against an already-current database. M1 integration tests apply it only to a disposable `tmpfs` PostgreSQL instance.

## 5. Verification boundary

Unit tests cover password hashing and verification, random credential hashing, Session creation/authentication/revocation/expiry, configuration validation, shared contracts, and throttling. The integration harness verifies migration repeatability, database authentication, persisted hash-only credentials, login/session/logout, expiry, revocation, replay denial, cookie attributes, Origin denial, OpenAPI, security headers, error redaction, and runtime cleanup.

This baseline does not select a production Secret provider, implement distributed throttling, create a multi-user identity model, or complete the M1 product slice.
