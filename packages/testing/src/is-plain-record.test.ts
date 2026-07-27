import { describe, expect, it } from 'vitest';

import { isPlainRecord } from './is-plain-record.js';

describe('isPlainRecord', () => {
  it('accepts ordinary and null-prototype records', () => {
    expect(isPlainRecord({ ready: true })).toBe(true);
    expect(isPlainRecord(Object.create(null))).toBe(true);
  });

  it('rejects values that do not represent plain records', () => {
    expect(isPlainRecord(null)).toBe(false);
    expect(isPlainRecord(['value'])).toBe(false);
    expect(isPlainRecord(new Date())).toBe(false);
  });
});
