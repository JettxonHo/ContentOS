import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';

import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { waitForReady } from './browser/global-setup.js';
import {
  formatBrowserHarnessSetupError,
  formatBrowserHarnessSetupFailure,
  parseBrowserHarnessErrorOutput,
  type BrowserHarnessSetupRecord,
} from './browser/setup-failure-transport.js';

const CURRENT_SETUP_CATEGORIES = [
  'process-identity-failed',
  'docker-unavailable',
  'build-failed',
  'compose-start-failed',
  'partial-compose-injected',
  'port-resolution-failed',
  'bucket-create-failed',
  'migration-failed',
  'api-start-failed',
  'web-start-failed',
  'ownership-invalid',
  'setup-failed',
] as const;

const COMPATIBILITY_SETUP_CATEGORIES = [
  'harness-preflight-failed',
  'build-preparation-failed',
  'compose-operation-failed',
  'credential-setup-failed',
  'object-storage-provision-failed',
  'origin-allocation-failed',
  'api-launch-failed',
  'web-launch-failed',
  'ready-state-publication-failed',
] as const;

function fakeChild(): EventEmitter & {
  readonly stdout: EventEmitter;
  kill: (signal?: NodeJS.Signals) => boolean;
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
} {
  const child = new EventEmitter() as EventEmitter & {
    readonly stdout: EventEmitter;
    kill: (signal?: NodeJS.Signals) => boolean;
    exitCode: number | null;
    signalCode: NodeJS.Signals | null;
  };
  Object.defineProperty(child, 'stdout', { value: new EventEmitter() });
  child.kill = () => true;
  child.exitCode = null;
  child.signalCode = null;
  return child;
}

const UNCLASSIFIED_RECORD =
  'CONTENTOS_BROWSER_HARNESS_ERROR:setup=unclassified teardown=failed cleanup=root physical=incomplete capsule=preserved\n';

describe('safe Browser Harness setup-record transport', () => {
  it.each([
    ...CURRENT_SETUP_CATEGORIES.map((category) => ({ category, group: 'current' })),
    ...COMPATIBILITY_SETUP_CATEGORIES.map((category) => ({ category, group: 'compatibility' })),
  ])('reconstructs the exact $group setup category: $category', ({ category }) => {
    expect(
      formatBrowserHarnessSetupFailure(new Error(`contentos smoke setup failed: setup=${category} teardown=clean`)),
    ).toBe(`CONTENTOS_BROWSER_HARNESS_ERROR:setup=${category} teardown=clean\n`);
  });

  it('reconstructs a failed record with canonical cleanup fields', () => {
    expect(
      formatBrowserHarnessSetupFailure(
        new Error(
          'contentos smoke setup failed: setup=api-start-failed teardown=failed cleanup=managed-process,compose physical=clean capsule=removed',
        ),
      ),
    ).toBe(
      'CONTENTOS_BROWSER_HARNESS_ERROR:setup=api-start-failed teardown=failed cleanup=managed-process,compose physical=clean capsule=removed\n',
    );
  });

  it('redacts arbitrary Error content and fails closed for non-Error input', () => {
    const sensitive = 'secret-value /private/tmp/contentos-owner-password https://127.0.0.1:443';
    expect(formatBrowserHarnessSetupFailure(new Error(`setup failed: ${sensitive}`))).toBe(UNCLASSIFIED_RECORD);
    expect(formatBrowserHarnessSetupFailure({ message: sensitive })).toBe(UNCLASSIFIED_RECORD);
    expect(
      formatBrowserHarnessSetupFailure(new Error('contentos smoke setup failed: setup=not-allowlisted teardown=clean')),
    ).toBe(UNCLASSIFIED_RECORD);
  });

  it.each([
    '',
    'contentos smoke setup failed: setup=docker-unavailable teardown=clean partial',
    'contentos smoke setup failed: setup=docker-unavailable teardown=failed',
    'contentos smoke setup failed: setup=docker-unavailable teardown=clean\n',
    'contentos smoke setup failed: setup=docker-unavailable teardown=clean\ncontentos smoke setup failed: setup=build-failed teardown=clean',
  ])('fails closed for malformed or partial Integration records: %s', (message) => {
    expect(formatBrowserHarnessSetupFailure(new Error(message))).toBe(UNCLASSIFIED_RECORD);
  });

  it('accepts exactly one complete Browser record and exposes only fixed fields', () => {
    const record = parseBrowserHarnessErrorOutput(
      'child log\nCONTENTOS_BROWSER_HARNESS_ERROR:setup=build-failed teardown=failed cleanup=compose physical=incomplete capsule=preserved\n',
    );
    expect(record).toEqual<BrowserHarnessSetupRecord>({
      setup: 'build-failed',
      teardown: 'failed',
      cleanup: ['compose'],
      physical: 'incomplete',
      capsule: 'preserved',
    });
  });

  it('accepts the fixed unclassified Browser fallback record', () => {
    expect(parseBrowserHarnessErrorOutput(UNCLASSIFIED_RECORD)).toEqual<BrowserHarnessSetupRecord>({
      setup: 'unclassified',
      teardown: 'failed',
      cleanup: ['root'],
      physical: 'incomplete',
      capsule: 'preserved',
    });
  });

  it('formats a fixed Playwright setup error from reconstructed fields only', () => {
    const message = formatBrowserHarnessSetupError(
      parseBrowserHarnessErrorOutput(
        'CONTENTOS_BROWSER_HARNESS_ERROR:setup=api-start-failed teardown=failed cleanup=managed-process physical=incomplete capsule=preserved\n',
      ),
    );
    expect(message).toBe(
      'Browser smoke harness setup failed: setup=api-start-failed teardown=failed cleanup=managed-process physical=incomplete capsule=preserved.',
    );
    expect(message).not.toMatch(/secret|path|url|pid|port|cause|stack|output/i);
  });

  it.each([
    'CONTENTOS_BROWSER_HARNESS_ERROR:setup=unknown teardown=clean\n',
    'CONTENTOS_BROWSER_HARNESS_ERROR:setup=docker-unavailable teardown=failed cleanup=compose physical=clean\n',
    'CONTENTOS_BROWSER_HARNESS_ERROR:setup=docker-unavailable teardown=clean\nCONTENTOS_BROWSER_HARNESS_ERROR:setup=build-failed teardown=clean\n',
    'CONTENTOS_BROWSER_HARNESS_ERROR:setup=docker-unavailable teardown=clean\r\n',
  ])('rejects malformed, partial, or conflicting Browser output: %s', (output) => {
    expect(parseBrowserHarnessErrorOutput(output)).toBeUndefined();
  });
});

describe('Browser global setup record validation', () => {
  it('reports the reconstructed fields for one complete fixed record', async () => {
    const child = fakeChild();
    const ready = waitForReady(child as unknown as ChildProcess);
    child.stdout.emit(
      'data',
      Buffer.from('CONTENTOS_BROWSER_HARNESS_ERROR:setup=build-failed teardown=clean\n', 'utf8'),
    );
    child.emit('exit', 1, null);

    await expect(ready).rejects.toThrow('Browser smoke harness setup failed: setup=build-failed teardown=clean.');
  });

  it('fails closed for malformed or conflicting output', async () => {
    const child = fakeChild();
    const ready = waitForReady(child as unknown as ChildProcess);
    child.stdout.emit(
      'data',
      Buffer.from(
        'CONTENTOS_BROWSER_HARNESS_ERROR:setup=build-failed teardown=clean\nCONTENTOS_BROWSER_HARNESS_ERROR:setup=api-start-failed teardown=clean\n',
        'utf8',
      ),
    );
    child.emit('exit', 1, null);

    await expect(ready).rejects.toThrow(
      'Browser smoke harness setup failed: setup=unclassified teardown=failed cleanup=root physical=incomplete capsule=preserved.',
    );
  });
});

describe('Browser Harness runner catch wiring', () => {
  it('writes the fixed transport record before the safe teardown exit', async () => {
    vi.resetModules();
    const setup = vi
      .fn()
      .mockRejectedValue(new Error('contentos smoke setup failed: setup=api-start-failed teardown=clean'));
    const teardown = vi.fn().mockResolvedValue(undefined);
    vi.doMock('./integration/harness.ts', () => ({ harness: { setup, teardown } }));

    const writes: string[] = [];
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
      return true;
    });
    let observedExitCode: string | number | null | undefined;
    const processExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      observedExitCode = code;
      return undefined as never;
    });
    const signalListeners = new Map([
      ['SIGINT', process.listeners('SIGINT')],
      ['SIGTERM', process.listeners('SIGTERM')],
    ] as const);

    try {
      await import('./browser/harness-runner.ts');
      expect(writes).toEqual(['CONTENTOS_BROWSER_HARNESS_ERROR:setup=api-start-failed teardown=clean\n']);
      expect(observedExitCode).toBe(1);
      expect(teardown).toHaveBeenCalledOnce();
    } finally {
      processExit.mockRestore();
      stdoutWrite.mockRestore();
      vi.doUnmock('./integration/harness.ts');
      vi.resetModules();
      for (const [signal, listeners] of signalListeners) {
        for (const listener of process.listeners(signal)) {
          if (!listeners.includes(listener)) process.removeListener(signal, listener);
        }
      }
    }
  });
});
