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
- Actual Model / Runtime Configuration: # Report only when verified; otherwise state `Not verified`.

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

## DEC Required

Yes / No. If yes, stop implementation and identify the required Human decision; do not create or alter a DEC.

## Recommended Review Result

READY FOR INDEPENDENT REVIEW / BLOCKED
```
