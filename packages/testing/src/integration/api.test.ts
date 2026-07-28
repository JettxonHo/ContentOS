import { describe, expect, it } from 'vitest';

import { requireState } from './env.js';

describe('api smoke', () => {
  it('GET /health/live returns the exact liveness contract over loopback', async () => {
    const state = requireState();
    const response = await fetch(`${state.apiOrigin}/health/live`);

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({ status: 'ok', service: 'api' });
  });
});
