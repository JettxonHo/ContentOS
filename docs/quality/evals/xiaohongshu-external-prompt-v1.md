# Xiaohongshu External Manual Validation Prompt v1

**Status:** Versioned quality artifact
**Applies to:** Later external, manual Provider validation only
**Runtime effect:** None. This prompt does not change the current Fake Provider and does not prove product Provider integration.

## Inputs

Supply the exact current Xiaohongshu Plan and editable Working Copy, including all eight existing page IDs in Plan order, the exact title candidates, content mode, and current Approved Research. For `creator_led`, also supply the exact confirmed Human Opinion. Product-owned References and immutable page traceability fields must be preserved; do not generate, replace, reorder, or infer them.

Use the same pre-call Foundation Sufficiency gate as Blog: the foundation must support a concrete fact or claim, why it matters, a limit or tradeoff, and an actionable judgment. If it does not, record `insufficient_foundation` in the evaluation and do not request a patch. Never pad.

## Output contract

Otherwise return one JSON object, without a fence or explanation, with exactly:

```json
{
  "selectedPlatformTitle": "<one existing candidate>",
  "coverTitle": "...",
  "coverSubtitle": null,
  "pages": [{ "id": "<existing page ID>", "heading": "...", "content": "..." }],
  "caption": "...",
  "cta": "...",
  "hashtags": ["#标签"]
}
```

- Include all eight existing page IDs exactly once, in their existing order.
- Give the eight pages distinct narrative roles: promise, context, mechanism, evidence, consequence, limit/tradeoff, practical action, and closing judgment.
- Make every page sample-specific. A page must advance the narrative rather than repeat the same claim.
- This is not a Blog split into eight cards: headings, density, transitions, caption, and CTA must form a native swipe sequence.
- `selectedPlatformTitle` is one supplied candidate. `coverSubtitle` is exactly `null`.
- Do not generate or replace page IDs, Plan, title candidates, References, purpose, emphasis, density, visual brief, Research bindings, Opinion Version binding, or profile metadata.

For `research_based`, reject output containing these first-person terms:

- English, Unicode/case-insensitive word boundaries: `I`, `me`, `my`, `mine`, `myself`, `we`, `us`, `our`, `ours`, `ourselves`.
- Chinese substring: `我`, `我们`.

For `creator_led`, only express personal judgment supported by the exact confirmed Opinion and its prohibition statement.
