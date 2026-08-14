# Blog External Manual Validation Prompt v1

**Status:** Versioned quality artifact
**Applies to:** Later external, manual Provider validation only
**Runtime effect:** None. This prompt does not change the current Fake Provider and does not prove product Provider integration.

## Inputs

Supply the exact current editable Blog Working Copy projection (`title`, `summary`, `markdown`, `contentMode`) and exact Approved Research body. For `creator_led`, also supply the exact current confirmed Human Opinion. The product-owned `publicReferences` and `internalProvenance` exist but are intentionally omitted; do not generate, replace, or infer them.

Before writing, assess Foundation Sufficiency. The supplied foundation must support all four dimensions:

1. a concrete fact or claim;
2. why it matters to the intended reader;
3. a real limit, tradeoff, or uncertainty;
4. an actionable judgment.

This is a pre-call human gate. If any dimension is unsupported, record `insufficient_foundation` in the evaluation and do not request a patch. Never pad missing evidence.

## Output contract

Otherwise return one JSON object, without a fence or explanation, with exactly:

```json
{ "title": "...", "summary": "...", "markdown": "..." }
```

- Produce sample-specific wording, not a generic template.
- `markdown` starts with one `#` title, contains 4–6 functionally distinct body `##` sections, and ends with the exact heading `## References` plus a references list.
- Across the body, make the progression explicit: fact or claim → meaning → limit or tradeoff → action.
- Each body section performs a different reader function; do not restate the same paragraph under new headings.
- Do not generate or replace IDs, Evidence, Provenance, References, plans, or page metadata.

For `research_based`, reject output containing these first-person terms:

- English, Unicode/case-insensitive word boundaries: `I`, `me`, `my`, `mine`, `myself`, `we`, `us`, `our`, `ours`, `ourselves`.
- Chinese substring: `我`, `我们`, `咱们`, `本人`.

For `creator_led`, only express personal judgment supported by the exact confirmed Opinion. Never claim third-party work, testing, or experience as the creator's own.
