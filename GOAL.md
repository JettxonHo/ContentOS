# GOAL-MVP-VALIDATE-001 — Validate Real Product Value

**Status:** Proposed — activation requires reviewed PR, required CI, and squash merge
**Human direction:** Corrected 2026-08-13; `DO NOT PUBLISH OR START V0`
**Planning baseline:** `main@28eb85ba5bd4b3f44457577bbe97e6c7204dda4e`
**Repository:** `JettxonHo/ContentOS`
**Single Work Item:** [Issue #299](https://github.com/JettxonHo/ContentOS/issues/299)
**Authority:** DEC-294, DEC-295, current Product/Security/Quality specifications, and `AGENTS.md`

## Proposal status and authority

This unmerged file is not active execution authority. Current `main` has no active post-MVP Goal. `GOAL-MVP-TEXT-001` remains completed historical evidence; it is not an executable plan.

Only an explicitly authorized planning commit/PR, required CI, and squash merge may activate `GOAL-MVP-VALIDATE-001`. Planning, Issue #299, and later activation do not by themselves authorize a Provider call, credential use, cost, V0 execution, or publication of validation results.

## Audit conclusion

Latest `main` has strong deterministic Fake Provider and current-path acceptance evidence, but it has no product-integrated real-Provider execution seam. Adding that seam would conflict with this Goal's fastest validation scope because current Provider execution/Secret ownership belongs to Worker while the necessary durable execution path does not yet exist.

This Goal therefore implements no Provider Adapter, configuration, Queue, Workflow, Agent Runtime, or product behavior. It validates value by making bounded real-Provider calls manually outside ContentOS, then entering the real structured content through the existing Working Copy editors before normal Version, Approval, and Export operations.

## Outcome

Produce one evidence-backed answer to this question:

> With one separately authorized real Provider, can a human use the existing private text-first product across 3–5 representative Content Packages to turn real structured outputs into trustworthy, editable, useful, and meaningfully different approved Blog and Xiaohongshu exports at an explicitly bounded cost?

The evidence validates the existing editing, review, Approval, and Export product loop with real model content. It does **not** prove product-integrated Provider execution, background Agent behavior, adoption, retention, market demand, production readiness, deployment, or M6.

## In scope

- one separately approved real Provider, model, and manual invocation method used outside all ContentOS processes;
- 3–5 representative non-sensitive Content Packages spanning supported Source types and both Creator-led and Research-based modes across the set;
- bounded manual Provider requests for the Research, Blog, and Xiaohongshu fields that the current Working Copy editors can accept, based only on approved non-sensitive Package material;
- manual entry of the real structured outputs through existing Research, Blog, and Xiaohongshu Working Copy editing capabilities;
- existing checkpoint Version, validation, exact human Approval, provenance/references review, and `article.md` / `post.md` / `pages.json` export behavior;
- per-Package records of manual intervention, edit amount, content value, errors, latency, usage, and cost;
- explicit human judgments for task completion, trust, editing value, reuse value, output usefulness, and acceptable effort; and
- one concise validation report plus one independent review of the evidence and documentation diff.

## Existing-product scaffold

If the current UI requires its deterministic Fake Provider to initialize an editable Working Copy, that output may be used only as product scaffolding. Real Provider content is mapped only into fields the current editors expose: Research summary/item text/open questions; Blog title/summary/Markdown; and Xiaohongshu cover copy/page headings/page content/Caption/CTA/hashtags, plus selection among existing platform-title candidates where applicable.

Non-editable IDs, item kinds, evidence bindings, dependencies, public references/provenance, page purpose/emphasis/density/visual brief, and platform-title candidate sets remain existing product state. The human must verify that entered content remains supported by those bindings. These scaffold fields and any untouched Fake content are excluded from real-model quality judgment and cannot count as real-Provider evidence.

An optional Fake-only walkthrough may verify local setup and the observation template before any paid call. It is not a counted Package and cannot complete this Goal.

## Out of scope

- a product-integrated Provider Adapter, Provider configuration, Provider SDK, Provider tests, API/Worker composition change, or application-process access to Provider credentials;
- new tables, columns, migrations, domain objects, persistent evaluation models, queues, Jobs, Workflow types, Agent Runtime, or generic Agent infrastructure;
- autonomous tools, multi-agent/provider platforms, generalized routing, Prompt-management infrastructure, or production telemetry;
- M6, Design, image generation, Renderer, rich export, deployment, publishing, backup/restore, or production operations;
- more than one real Provider or automatic model comparison;
- private credentials or sensitive participant/source content in Git, ContentOS processes, Issues, reports, screenshots, logs, prompts retained as evidence, or exports;
- an unapproved product fix discovered during validation; and
- any postmerge reconciliation Goal, Issue, Work Packet, or Acceptance Record.

## Activation and execution gates

1. This proposed Goal and Issue #299 receive one independent planning review.
2. The planning diff receives only documentation static checks, then waits for explicit commit/PR authorization. Required CI and squash merge activate the Goal; before merge it remains Proposed.
3. After activation, the user separately approves the exact Provider, model, manual client or invocation method, credential custody, per-call/request limits, maximum total spend, and exact 3–5 non-sensitive Package set.
4. Credentials remain solely in the separately authorized user-controlled Provider client/session outside the repository and every ContentOS process. They are never pasted into Codex, shell commands recorded as evidence, Issues, reports, exports, or application configuration.
5. The executor revalidates latest main, a clean isolated worktree, local product configuration with no Provider credential, input classification, and the approved call/cost ceiling.
6. The user explicitly sends `START V0`; until then no Provider call, credential access, Docker, Browser, or product validation run begins.
7. Any need for a product Adapter, new table, migration, Queue, Workflow type, Agent Runtime, M6 capability, deployment action, or broader Provider platform stops the Work Item for direction.

## Manual real-Provider protocol

- The human copies only the minimum approved non-sensitive Source/Research/Opinion context into the authorized external Provider interface.
- Each request asks only for the existing editor-visible fields listed above; it does not ask the Provider to invent immutable IDs/bindings or to approve, mutate, or operate ContentOS.
- The human records model identity, start/end time, reported usage, cost, and redacted error category without retaining credentials or unnecessary raw request/response transcripts in repository evidence.
- The human enters the returned structured content into the corresponding existing Working Copy, then reviews and edits it inside ContentOS.
- ContentOS remains authoritative only for the manually entered Working Copy, immutable Version, human Approval, dependencies, provenance/references, and exported files. The external call has no product execution authority.

## Evidence contract

For every one of the 3–5 counted Packages, the report records:

- source/content-mode classification without reproducing sensitive material;
- exact product build plus Provider/model identity, invocation count, elapsed time, reported usage, and cost;
- completion or failure at every product stage and every manual intervention;
- which editable fields received real content, which remained product scaffold, which were materially edited, approximate edit amount, and editing time;
- human judgments for trust, content value, editing value, reuse value, output usefulness, and acceptable effort, clearly labeled as judgments;
- whether both approved exports are useful and non-identical expressions of the same Content Foundation; and
- product defects, manual-process errors, Provider errors, content-quality concerns, and limitations as separate categories.

The separately authorized 3–5 Package set is fixed before `START V0`. Every selected Package must receive at least one bounded real-Provider attempt and have the attempt, stage outcomes, and human judgments recorded honestly. A failed or incomplete selected Package remains in the denominator; it cannot be removed or replaced with another sample.

A **complete dual-output Package** reaches exact Research, Blog, and Xiaohongshu Approvals and produces all three exports. Goal completion and the product-value verdict are separate:

- the Goal may complete after all selected Packages have been genuinely attempted and recorded, even when fewer than three Packages complete the dual-output path;
- `Product Value Supported` or `Product Value Mixed` is permitted only when at least three selected Packages complete that full path; and
- when fewer than three selected Packages complete it, the verdict must be `Product Value Not Supported` or `Product Value Blocked`.

Fake output cannot fill missing evidence. The executor must not swap samples, apply an unapproved product fix, or create a recovery Goal or reconciliation path to pursue a favorable verdict. No adoption claim or generalized quality claim is inferred beyond the observed fixed sample.

## Completion

This Goal completes only after:

1. one separately authorized real Provider is manually used outside ContentOS for all 3–5 approved Packages within the approved cost ceiling;
2. every selected Package has a real attempt and records stage outcomes, intervention, edit amount, errors, latency, usage, cost, and explicit human value judgments, including failures and incomplete paths;
3. the report records how many Packages reached exact Research, Blog, and Xiaohongshu Approvals plus all three exports;
4. the report applies the threshold above: at least three complete Packages are required for `Product Value Supported` or `Product Value Mixed`; fewer than three requires `Product Value Not Supported` or `Product Value Blocked`;
5. the report explicitly states that product-integrated Provider execution was not tested;
6. documentation checks, one independent evidence review, required report PR CI, and squash merge pass; and
7. Issue #299 is closed based on that same merged validation work.

The activation PR and later validation-report PR remain within this one Goal and one Issue. The report PR is the Goal's planned evidence delivery, not a postmerge reconciliation Goal. No reconciliation Goal or Issue is created.

An incomplete selected Package does not by itself prevent Goal completion after all fixed samples were genuinely attempted and recorded; it lowers the completion count and constrains the verdict. An unattempted selected Package keeps the Goal incomplete. Neither outcome authorizes sample replacement, an unapproved fix, M6, data-model work, a recovery Goal, or a reconciliation path.
