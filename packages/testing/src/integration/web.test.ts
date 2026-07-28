import { describe, expect, it } from 'vitest';

import { requireState } from './env.js';

describe('web smoke', () => {
  it('responds over loopback with a successful HTTP status', async () => {
    const state = requireState();
    const response = await fetch(state.webOrigin);

    expect(response.ok).toBe(true);
  });
});
