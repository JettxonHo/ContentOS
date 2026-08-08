import { formatHarnessCleanupRecord, harness } from './harness.js';

/**
 * Emits one bounded teardown record, then rethrows the exact original error.
 * This is a narrow seam for deterministic transport testing in this private
 * harness source; cleanup execution remains owned by `harness.teardown()`.
 */
export function emitHarnessTeardownFailure(error: unknown): never {
  process.exitCode = 1;
  process.stderr.write(`${formatHarnessCleanupRecord(error)}\n`);
  throw error;
}

/**
 * Vitest global setup: starts the isolated Compose project and the five
 * application artifacts once per run, then guarantees a complete teardown
 * attempt (apps stopped, Compose project removed without volume deletion, temp dir gone)
 * whether tests pass, fail, or the setup itself throws.
 *
 * Setup returns a stable combined setup/teardown classification. A teardown
 * failure is forced into the process exit code: Vitest logs
 * globalSetup teardown errors but does not always propagate them to the exit
 * code, so a required cleanup failure can never let `test:integration` return
 * zero. The error is rethrown so it is still reported.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  await harness.setup();
  return async () => {
    try {
      await harness.teardown();
    } catch (error) {
      emitHarnessTeardownFailure(error);
    }
  };
}
