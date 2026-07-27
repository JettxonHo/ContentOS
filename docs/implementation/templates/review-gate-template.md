# ContentOS Independent Review Gate Template

**Status:** Template

**Purpose:** Independent review of a completed Work Packet before an authorized commit or Pull Request

The reviewer examines repository evidence independently. The only review outcomes are `PASS`, `NEEDS CHANGES`, and `BLOCKED`.

## Required review process

The Review Agent must:

1. Confirm the Work Item, Issue, branch, base commit, executor scope, and working-tree state.
2. Read the Work Packet, referenced Accepted DEC, Current-truth sources, and relevant existing implementation.
3. Inspect the real Git diff, changed-file list, untracked files, and generated-artifact status.
4. Compare every Acceptance Criterion, allowed-file boundary, non-goal, security requirement, and Git restriction with the actual change.
5. Run the specified verification commands independently, including required failure-path checks where practical and safe.
6. Verify Current-truth compliance and identify any authority conflict, scope expansion, Secret, local path, or unapproved dependency.
7. Treat the Completion Report as an index; reconcile it with actual evidence and record discrepancies.

Do not change implementation while reviewing. A correction is returned as a bounded Correction Packet; the Implementation Agent then owns the repository writes again.

## Review record

```markdown
# INDEPENDENT REVIEW GATE

## Identification

- Work Item:
- Issue:
- Branch:
- Base Commit:
- Reviewer:
- Review Date:

## Inputs Inspected

- Work Packet:
- Completion Report:
- Canonical Sources:
- Real Diff / Repository State:

## Verification Run Independently

- `command`
  - result:

## Acceptance Criteria Review

| Criterion | Independent evidence | Result: PASS / FAIL / BLOCKED |
| --------- | -------------------- | ----------------------------- |
|           |                      |                               |

## Scope and File-boundary Review

## Current-truth and DEC Compliance

## Security, Secret, and Local-path Review

## Dependency, Migration, and Generated-artifact Review

## Failure-path Review

## Findings

-

## Review Result

PASS / NEEDS CHANGES / BLOCKED

## Required Next Action

For `PASS`, record whether an authorized commit, push, or Pull Request may proceed. For `NEEDS CHANGES`, issue a Correction Packet with the failed criterion, evidence, permitted files, and re-verification. For `BLOCKED`, record the blocker and the Human decision or external change required.
```

## Outcome rules

- **PASS** requires evidence for every applicable Acceptance Criterion and required verification. It does not grant merge authority; the Human decides whether to merge.
- **NEEDS CHANGES** means the Work Item remains active. Do not commit, push, or create a Pull Request until the correction is independently reviewed as `PASS`, unless the Human explicitly authorizes an exception.
- **BLOCKED** means a safe decision cannot be made. Use `HUMAN_DECISION_REQUIRED` when the blocker requires Human authority. Do not silently substitute a component, lower a criterion, or approve partial evidence.
