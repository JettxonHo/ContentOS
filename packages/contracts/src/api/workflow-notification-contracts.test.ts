import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import { parseWorkflowNotificationData, workflowNotificationDataSchema } from './workflow-notification-contracts.js';

describe('Workflow notification contract', () => {
  it('accepts exactly the safe notification payload for an instance or an owned empty Workflow', () => {
    expect(parseWorkflowNotificationData({ workflowInstanceId: null, latestSequence: 0 })).toEqual({
      ok: true,
      value: { workflowInstanceId: null, latestSequence: 0 },
    });
    expect(
      parseWorkflowNotificationData({
        workflowInstanceId: '00000000-0000-4000-8000-000000000010',
        latestSequence: 7,
      }),
    ).toEqual({
      ok: true,
      value: { workflowInstanceId: '00000000-0000-4000-8000-000000000010', latestSequence: 7 },
    });
  });

  it('rejects malformed, non-exact, and unsafe notification values', () => {
    for (const value of [
      { workflowInstanceId: 'not-a-uuid', latestSequence: 0 },
      { workflowInstanceId: '00000000-0000-6000-8000-000000000010', latestSequence: 0 },
      { workflowInstanceId: null, latestSequence: -1 },
      { workflowInstanceId: null, latestSequence: 1.1 },
      { workflowInstanceId: null, latestSequence: '7' },
      { workflowInstanceId: null, latestSequence: 7, privateMarker: 'must-not-pass' },
      { workflowInstanceId: null },
      [],
      null,
    ]) {
      expect(parseWorkflowNotificationData(value).ok).toBe(false);
    }
  });

  it('keeps the portable schema exact under strict Ajv 2020 validation', () => {
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(workflowNotificationDataSchema);
    expect(validate({ workflowInstanceId: null, latestSequence: 0 })).toBe(true);
    expect(validate({ workflowInstanceId: null, latestSequence: 0, extra: true })).toBe(false);
    expect(validate({ workflowInstanceId: 'not-a-uuid', latestSequence: 0 })).toBe(false);
  });
});
