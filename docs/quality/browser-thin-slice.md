# M1 Browser Thin Slice

**Status:** Implementation Baseline
**Scope:** The bounded M1 owner-browser scenario, pinned runtime, isolation, security assertions, cleanup, and explicit exclusions
**Last Updated:** 2026-08-07

This document records the browser scenario introduced by `M1-WEB-001` and its in-review `M2-WF-004B` companion. It verifies the first private UI → API → Domain → PostgreSQL → UI loop plus native credentialed EventSource delivery; it is not a broad product E2E suite and does not compose M2 Workflow UI.

Related documents: [Integration Smoke Harness](integration-smoke-harness.md), [CI Skeleton](ci-skeleton.md), [Test Strategy](test-strategy.md), [Content Package Foundation](../architecture/content-package-foundation.md), [Authentication Foundation](../security/authentication-foundation.md), and the [Roadmap](../implementation/roadmap.md).

## 1. Command and runtime

Run:

```bash
corepack pnpm exec playwright install chromium
corepack pnpm test:browser
```

The root pins `@playwright/test` to `1.62.0`. Only its pinned Chromium revision is selected. The committed configuration uses one headless Chromium worker and disables screenshots, traces, video, HTML reports, retries, and repository-local output.

The command is Docker-dependent and intentionally excluded from `corepack pnpm check`. CI installs Chromium plus its required runner libraries before invoking the same command.

## 2. Scenario

The single deterministic scenario proves:

- an unauthenticated owner is redirected to Login;
- an incorrect password produces one generic error, clears the password field, and restores focus;
- a correct password creates an HttpOnly, SameSite=Strict session through exact-Origin CORS;
- Dashboard shows the empty state and keeps unavailable Settings visibly disabled;
- a package can be created once even when submission is triggered twice;
- Workspace shows truthful stages, including active Package Source Intake for Paste, `.md`/`.txt` upload, and one URL-capture record; Source review/Approval and Workflow Timeline UI remain unavailable;
- metadata edits persist across a browser refresh;
- a stale revision is rejected and the owner can reload the authoritative revision;
- Archive requires explicit confirmation, preserves one archived package, and is not Delete; and
- logout revokes the session and a protected Workspace route returns to Login.

The typed Web client always uses `credentials: include`, maps the common API error envelope, and stores no token, password, or API response in browser storage.

The M2-WF-004B companion signs in through the existing owner flow, creates an
isolated Package fixture, receives the exact initial
`workflow-notification/v1` Event through native Chromium `EventSource` with
credentials, then closes the connection. It deliberately does not instantiate
the reusable recovery controller in the M1 Workspace or add visible Workflow
status UI.

## 3. Isolation and cleanup

The browser global setup delegates to the existing integration harness in a separate Node process so Playwright's TypeScript loader cannot change the harness module semantics. The harness:

- creates a unique `contentos-smoke-*` Compose project;
- replaces all service data mounts with `tmpfs`;
- binds API, Web, PostgreSQL, Redis, and object storage to ephemeral IPv4-loopback ports;
- creates random credentials in the OS temp directory only;
- applies the three reviewed migrations in the current journal to the disposable PostgreSQL instance; and
- starts the built Web and API artifacts with process-specific configuration.

Teardown stops both application process groups, removes only the unique Compose project, and deletes its exact `mkdtemp` run directory and temporary credentials. The command wrapper only propagates signals and exit status; it owns no smoke directory and performs no recursive cleanup. It never reads, mounts, changes, or deletes the `contentos-local` named volumes.

## 4. Failure behavior

Any browser assertion, setup, process cleanup, Compose cleanup, or temporary-file cleanup failure returns non-zero. Cleanup remains required on both passing and failing paths.

Two test-only switches provide deterministic verification:

- `CONTENTOS_BROWSER_INJECT_FAILURE=1` fails the browser assertion path after setup.
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE=1` completes real cleanup, then forces teardown to report failure.

Neither switch changes product behavior or emits a credential.

## 5. Security and accessibility boundary

The scenario checks the browser/API Origin boundary and cookie flags. Runtime configuration accepts only an IPv4-loopback API origin outside production and requires HTTPS in production. `CONTENTOS_API_ORIGIN` is public browser configuration and must never contain a Secret.

The M1 UI uses explicit labels, semantic headings, keyboard-focus indicators, live error/status regions, and disabled-state semantics. React text rendering remains the escaping boundary for owner-supplied metadata; the Web client never uses raw HTML injection.

## 6. Explicit exclusions

This baseline does not test or implement Source capture, Workflow execution, Queue behavior, Agent Runtime, Research, content generation, Render, Export, publishing, multi-user behavior, deployment, or production browsers. It does not create tables, migrations, Domain semantics, or a second data-access path.

## 7. Decision traceability

This implementation follows the accepted private single-user, API-owned mutation, exact-version/revision, Archive-not-Delete, deterministic-test, and milestone-gate decisions recorded in the [Canonical Decision Register](../decisions/decisions.md). No new Decision is introduced.
