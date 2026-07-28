import { harness } from './harness.js';

/**
 * Vitest global setup: starts the isolated Compose project and the five
 * application artifacts once per run, then guarantees a best-effort teardown
 * (apps stopped, Compose project removed without volume deletion, temp dir gone)
 * whether tests pass, fail, or the setup itself throws.
 *
 * A setup failure rethrows the original error after best-effort cleanup. A
 * teardown failure is forced into the process exit code: Vitest logs
 * globalSetup teardown errors but does not always propagate them to the exit
 * code, so a required cleanup failure can never let `test:integration` return
 * zero. The error is rethrown so it is still reported.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  try {
    await harness.setup();
  } catch (error) {
    await harness.teardown().catch(() => undefined);
    throw error;
  }
  return async () => {
    try {
      await harness.teardown();
    } catch (error) {
      process.exitCode = 1;
      throw error;
    }
  };
}
