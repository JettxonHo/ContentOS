import { spawn, type ChildProcess } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import {
  captureManagedProcessIdentity,
  inspectManagedProcess,
  sameManagedProcessIdentity,
  stopPendingManagedProcess,
  stopManagedProcess,
  type ManagedProcessIdentity,
} from './integration/process-identity.js';

const HEX_64 = /^[0-9a-f]{64}$/;

function spawnSleeper(ignoreSigterm: boolean): ChildProcess {
  const script = ignoreSigterm
    ? "process.on('SIGTERM', () => undefined); setInterval(() => undefined, 1000);"
    : 'setInterval(() => undefined, 1000);';
  const child = spawn(process.execPath, ['-e', script], { detached: true, stdio: 'ignore' });
  child.unref();
  return child;
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitUntilDead(pid: number, timeoutMs = 8_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

async function forceKill(child: ChildProcess): Promise<void> {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    // already gone
  }
  await waitUntilDead(child.pid, 3_000);
}

// A bounded group-gone poll used to accelerate the SIGKILL-escalation test while
// still exercising the real probe/signal/inspect operations.
async function fastWaitForGone(pgid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + Math.min(timeoutMs, 800);
  while (Date.now() < deadline) {
    try {
      process.kill(-pgid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

describe('managed process identity', () => {
  it('supports deterministic post-spawn capture-failure injection', async () => {
    await expect(captureManagedProcessIdentity(45, 'api', { injectFailure: true })).rejects.toThrow(
      'managed-process-identity-capture-failed',
    );
  });

  it('captures a complete identity for a detached process-group leader', async () => {
    const child = spawnSleeper(false);
    try {
      const pid = child.pid;
      expect(pid).toBeTypeOf('number');
      const identity = await captureManagedProcessIdentity(pid, 'api');
      expect(identity.pid).toBe(pid);
      expect(identity.pgid).toBe(pid);
      expect(identity.role).toBe('api');
      expect(identity.startIdentity).toMatch(HEX_64);
      expect(identity.executableFingerprint).toMatch(HEX_64);
      expect(identity.commandFingerprint).toMatch(HEX_64);
    } finally {
      await forceKill(child);
    }
  });

  it('returns undefined when inspecting a pid that no longer exists', async () => {
    const child = spawnSleeper(false);
    const pid = child.pid;
    expect(pid).toBeTypeOf('number');
    await forceKill(child);
    expect(await waitUntilDead(pid!)).toBe(true);
    expect(await inspectManagedProcess(pid!, 'api')).toBeUndefined();
  });

  it('compares every identity field', () => {
    const base: ManagedProcessIdentity = {
      role: 'api',
      pid: 1,
      pgid: 1,
      startIdentity: 'a'.repeat(64),
      executableFingerprint: 'b'.repeat(64),
      commandFingerprint: 'c'.repeat(64),
    };
    expect(sameManagedProcessIdentity(base, { ...base })).toBe(true);
    expect(sameManagedProcessIdentity(base, { ...base, role: 'web' })).toBe(false);
    expect(sameManagedProcessIdentity(base, { ...base, pid: 2 })).toBe(false);
    expect(sameManagedProcessIdentity(base, { ...base, pgid: 2 })).toBe(false);
    expect(sameManagedProcessIdentity(base, { ...base, startIdentity: 'd'.repeat(64) })).toBe(false);
    expect(sameManagedProcessIdentity(base, { ...base, executableFingerprint: 'd'.repeat(64) })).toBe(false);
    expect(sameManagedProcessIdentity(base, { ...base, commandFingerprint: 'd'.repeat(64) })).toBe(false);
  });

  it('stops the exact process when the recorded identity still matches', async () => {
    const child = spawnSleeper(false);
    try {
      const pid = child.pid!;
      const identity = await captureManagedProcessIdentity(pid, 'api');
      await stopManagedProcess(identity);
      expect(await waitUntilDead(pid)).toBe(true);
    } finally {
      await forceKill(child);
    }
  });

  it('fails closed on a forged identity and leaves an unrelated live process untouched', async () => {
    const child = spawnSleeper(false);
    try {
      const pid = child.pid!;
      // Wait until the process is observable before forging a record against it.
      const real = await captureManagedProcessIdentity(pid, 'api');
      expect(real.pid).toBe(pid);
      const forged: ManagedProcessIdentity = {
        role: 'api',
        pid,
        pgid: pid,
        startIdentity: 'f'.repeat(64),
        executableFingerprint: 'f'.repeat(64),
        commandFingerprint: 'f'.repeat(64),
      };
      await expect(stopManagedProcess(forged)).rejects.toThrow('managed-process-identity-mismatch');
      // The unrelated process must not have been signalled.
      expect(isAlive(pid)).toBe(true);
    } finally {
      await forceKill(child);
    }
  });

  it('escalates from SIGTERM to SIGKILL for a process that ignores SIGTERM', async () => {
    const child = spawnSleeper(true);
    try {
      const pid = child.pid!;
      const identity = await captureManagedProcessIdentity(pid, 'api');
      await stopManagedProcess(identity, { waitForGone: fastWaitForGone });
      expect(await waitUntilDead(pid)).toBe(true);
    } finally {
      await forceKill(child);
    }
  });

  it('clears pending ownership when the exact group is already gone', async () => {
    const calls: string[] = [];
    await stopPendingManagedProcess(
      { pid: 42, pgid: 42 },
      {
        probeGroup: () => {
          calls.push('probe');
          return 'gone';
        },
        signalGroup: () => {
          calls.push('signal');
          return 'error';
        },
        waitForGone: async () => {
          calls.push('wait');
          return false;
        },
      },
    );
    expect(calls).toEqual(['probe']);
  });

  it('escalates pending ownership from TERM to KILL and confirms disappearance', async () => {
    const signals: NodeJS.Signals[] = [];
    let probes = 0;
    await stopPendingManagedProcess(
      { pid: 43, pgid: 43 },
      {
        probeGroup: () => {
          probes += 1;
          return 'alive';
        },
        signalGroup: (_pgid, signal) => {
          signals.push(signal);
          return 'ok';
        },
        waitForGone: async (_pgid, timeoutMs) => {
          expect(timeoutMs).toBe(signals.length === 1 ? 7_000 : 5_000);
          return signals.length === 2;
        },
      },
    );
    expect(signals).toEqual(['SIGTERM', 'SIGKILL']);
    expect(probes).toBe(1);
  });

  it('fails closed when pending group disappearance cannot be proven', async () => {
    const signals: NodeJS.Signals[] = [];
    await expect(
      stopPendingManagedProcess(
        { pid: 44, pgid: 44 },
        {
          probeGroup: () => 'alive',
          signalGroup: (_pgid, signal) => {
            signals.push(signal);
            return 'ok';
          },
          waitForGone: async () => false,
        },
      ),
    ).rejects.toThrow('managed-process-still-alive');
    expect(signals).toEqual(['SIGTERM', 'SIGKILL']);
  });
});
