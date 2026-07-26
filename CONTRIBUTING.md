# Contributing to ContentOS

## 1. Contribution model

Every change is driven by one bounded, independently reviewable Work Item. Use the [Work Item template](docs/implementation/work-item-template.md); broad requests such as “implement ContentOS” are not valid Work Items.

## 2. Before starting

1. Read [AGENTS.md](AGENTS.md) and the relevant Current-truth specifications.
2. Confirm the Work Item is Ready and identify its Accepted DEC, contracts, dependencies, and Acceptance Criteria.
3. Inspect the existing repository and confirm allowed and prohibited files/modules.
4. Identify security and migration impact before modifying anything.

## 3. During implementation

- Stay within In Scope; record any required scope change rather than silently adding it.
- Keep the diff reviewable and avoid unrelated refactoring.
- Do not modify Accepted DEC or commit a Secret, temporary file, or `.DS_Store`.
- Run the required checks. Report failures, skipped work, and limitations honestly.
- Follow the approved architecture boundaries, including API-owned state changes and exact Version/Approval semantics.

## 4. Documentation contributions

- **Sessions** preserve historical discussion and are not the normal implementation specification.
- The **Decision Register** records Accepted decisions; do not edit Accepted DEC without an approved decision process.
- **Current-truth specifications** define integrated current product, architecture, security, and quality rules.
- **README** is the first human repository entry point; **AGENTS** is the concise executable rule set for Codex and developers.

Synchronize the affected document when accepted behavior, a contract, operation/recovery procedure, or repository entry guidance changes. An ordinary Bug Fix does not automatically require a DEC.

## 5. Commit guidance

Keep each commit focused on one Work Item and use a clear conventional-style subject, for example `docs: add repository contributor rules`. Never include `.DS_Store`, Secrets, or temporary files. Codex does not create a commit unless the task explicitly asks for one.

## 6. Pull request expectations

Use the [pull-request template](docs/implementation/templates/pull-request-template.md). On GitHub, open the matching native [Pull Request template](.github/pull_request_template.md) after creating the applicable Work Item, Bug, or Decision Review Issue. GitHub forms are an adaptation layer, not a replacement for the authoritative Work Item Contract. A review must identify the Work Item ID, Goal, scope, relevant DEC, verification, security impact, migration impact, documentation changes, known limitations, and confirmation that no unrelated change or Secret is included.

Associate each GitHub branch and Pull Request with one bounded Issue or Work Item. Do not use GitHub automation, branch-protection settings, or a broad branch strategy unless a later authorized Work Item introduces them.

## 7. Bug versus decision change

- A **Bug** is a failure to implement accepted behavior: use the bug flow.
- An **Implementation Detail** stays in a normal Work Item when it does not change accepted behavior.
- A **Scope or Architecture Change** affects MVP scope, domain semantics, workflow, security boundaries, agent responsibility, technical architecture, or a release gate: submit a [Decision Review](docs/implementation/templates/decision-review-template.md) before implementation.

## 8. Review checklist

Review against the [Definition of Done](docs/implementation/work-item-template.md#18-definition-of-done), applicable [Release Gates](docs/quality/release-gates.md), and the Work Item’s Acceptance Criteria. A pass requires evidence, not a statement that the change “looks complete.”
