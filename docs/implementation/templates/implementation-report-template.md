# ContentOS Implementation Completion Report Template

**Status:** Template

**Purpose:** Implementation-to-independent-review evidence handoff

The report is an evidence index. The Review Agent must inspect the actual repository state and must not approve based on this report alone. Never include Secrets, private content, full prompts, temporary URLs, or credentials.

```markdown
# IMPLEMENTATION COMPLETION REPORT

## Identification

- Work Item:
- Issue:
- Branch:
- Base Commit:
- Execution Profile:
- Logical Role:
- Actual Model: # Report only when observable; otherwise `UNVERIFIED_RUNTIME_MODEL`.
- Reasoning:
- Thread:
- Runtime Model Status: VERIFIED | UNVERIFIED_RUNTIME_MODEL
- Runtime Configuration: # Report only verified facts.

## Implementation Summary

## Files Changed

- `path`
  - reason:

## Tests Added or Updated

-

## Commands Executed

- `command`
  - result:

## Acceptance Criteria Evidence

| Criterion | Evidence | Result: PASS / FAIL / BLOCKED |
| --------- | -------- | ----------------------------- |
|           |          |                               |

## Failure-path Verification

-

## Scope Check

## Forbidden Files Check

## Dependency Changes

## Secret and Local-path Check

## Generated-artifact Check

## Known Limitations

## Incomplete Items

## Final Git Status

State whether an authorized commit, push, or draft Pull Request was created.
Publication evidence does not count as independent approval or merge authority.

## DEC Required

Yes / No. If yes, stop implementation and identify the required Human decision; do not create or alter a DEC.

## Recommended Review Result

READY FOR INDEPENDENT REVIEW / BLOCKED
```
