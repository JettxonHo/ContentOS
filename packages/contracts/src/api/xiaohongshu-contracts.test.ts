import { describe, expect, it } from 'vitest';
import { parseEditXiaohongshuRequest } from './xiaohongshu-contracts.js';
describe('Xiaohongshu HTTP contracts', () => {
  it('requires an exact positive revision and object body', () => {
    expect(parseEditXiaohongshuRequest({ expectedRevision: 1, body: {} }).ok).toBe(true);
    expect(parseEditXiaohongshuRequest({ expectedRevision: 0, body: {} }).ok).toBe(false);
    expect(parseEditXiaohongshuRequest({ expectedRevision: 1, body: {}, extra: true }).ok).toBe(false);
  });
});
