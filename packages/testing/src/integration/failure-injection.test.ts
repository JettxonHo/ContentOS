import { describe, expect, it } from 'vitest';

// Harness-only failure-injection switch. When unset (the default), this test
// passes and the smoke run is green. Setting CONTENTOS_SMOKE_INJECT_FAILURE=1
// forces this test to fail with a non-zero exit, which exercises the
// failure-path contract: a required failure must return non-zero and the
// global teardown must still remove the isolated Compose project with no residue.
// It does not touch application or production code.
describe('failure injection', () => {
  it('honors the harness-only failure switch (CONTENTOS_SMOKE_INJECT_FAILURE must be unset)', () => {
    expect(process.env.CONTENTOS_SMOKE_INJECT_FAILURE ?? '').toBe('');
  });
});
