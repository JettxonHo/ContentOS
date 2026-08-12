import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  checkDecisionRegister,
  checkMarkdownLinks,
  EXPECTED_DEC_COUNT,
  listTrackedFiles,
  scanSecrets,
} from './repository-checks.js';

const SCRIPT_PATH = fileURLToPath(new URL('./repository-checks.ts', import.meta.url));

function decId(id: number): string {
  return `DEC-${String(id).padStart(3, '0')}`;
}

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'contentos-repo-check-'));
}

function git(dir: string, ...args: string[]): void {
  execFileSync('git', ['-C', dir, ...args], { stdio: ['ignore', 'ignore', 'ignore'] });
}

function writeRegister(dir: string, ids: number[]): void {
  const registerDir = join(dir, 'docs', 'decisions');
  mkdirSync(registerDir, { recursive: true });
  const header = `# Register\n\n- Indexed decisions: **${EXPECTED_DEC_COUNT}**\n- Numeric range: **DEC-001–DEC-${String(EXPECTED_DEC_COUNT).padStart(3, '0')}**\n\n## 8. Decision Index\n\n| ID | Title | Status | Source | Summary | Reason | Impact |\n|---|---|---|---|---|---|---|\n`;
  const rows = ids
    .map((id) => `| [${decId(id)}](decisions-001.md) | title | Accepted | src | summary | reason | impact |`)
    .join('\n');
  writeFileSync(join(registerDir, 'decisions.md'), `${header}${rows}\n`);
}

// Synthetic high-confidence credentials are composed from fragments at runtime
// so the test source never contains a contiguous, scanner-recognizable value.
function composeAwsKey(): string {
  return 'AK' + 'IA' + '0123456789ABCDEF';
}

function composePrivateKey(): string {
  return ['-----', 'BEGIN ', 'OPENSSH PRIVATE KEY', '-----'].join('');
}

describe('checkMarkdownLinks', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes for existing targets and ignores external URLs, fragment-only links, and encoded paths', () => {
    writeFileSync(join(dir, 'a.md'), '[b](b.md) [ext](https://example.com) [frag](#section) [enc](c%20d.md)\n');
    writeFileSync(join(dir, 'b.md'), 'ok');
    writeFileSync(join(dir, 'c d.md'), 'ok');
    expect(checkMarkdownLinks(dir, ['a.md'])).toEqual([]);
  });

  it('flags a missing local target', () => {
    writeFileSync(join(dir, 'a.md'), '[b](missing.md)\n');
    const findings = checkMarkdownLinks(dir, ['a.md']);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.problem).toBe('local link target not found');
    expect(findings[0]?.reference).toBe('missing.md');
  });

  it('flags a link that escapes the repository', () => {
    writeFileSync(join(dir, 'a.md'), '[x](../../../../etc/hosts)\n');
    const findings = checkMarkdownLinks(dir, ['a.md']);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.problem).toBe('link escapes the repository');
  });

  it('strips query and fragment before resolving', () => {
    writeFileSync(join(dir, 'a.md'), '[b](b.md?version=1#section)\n');
    writeFileSync(join(dir, 'b.md'), 'ok');
    expect(checkMarkdownLinks(dir, ['a.md'])).toEqual([]);
  });

  it('excludes the historical session archive as a source but still validates links into it', () => {
    mkdirSync(join(dir, 'docs', 'sessions'), { recursive: true });
    mkdirSync(join(dir, 'docs', 'quality'), { recursive: true });
    writeFileSync(join(dir, 'docs', 'sessions', 'session-x.md'), '![img](./assets/missing.png)\n');
    writeFileSync(join(dir, 'docs', 'quality', 'q.md'), '[session](../sessions/session-x.md)\n');
    expect(checkMarkdownLinks(dir, ['docs/sessions/session-x.md', 'docs/quality/q.md'])).toEqual([]);
  });
});

describe('checkDecisionRegister', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes when the register has exactly DEC-001 through DEC-295 and references resolve', () => {
    const ids = Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1);
    writeRegister(dir, ids);
    writeFileSync(join(dir, 'doc.md'), 'See DEC-001 and DEC-295 for context.\n');
    expect(checkDecisionRegister(dir, ['docs/decisions/decisions.md', 'doc.md'])).toEqual([]);
  });

  it('reports a missing canonical entry', () => {
    const ids = Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1).filter((id) => id !== 50);
    writeRegister(dir, ids);
    const findings = checkDecisionRegister(dir, ['docs/decisions/decisions.md']);
    expect(
      findings.some(
        (finding) => finding.reference === 'DEC-050' && finding.problem === 'missing canonical Decision entry',
      ),
    ).toBe(true);
  });

  it('reports a duplicate canonical entry', () => {
    const ids = Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1);
    ids.push(7);
    writeRegister(dir, ids);
    const findings = checkDecisionRegister(dir, ['docs/decisions/decisions.md']);
    expect(
      findings.some(
        (finding) => finding.reference === 'DEC-007' && finding.problem === 'duplicate canonical Decision entry',
      ),
    ).toBe(true);
  });

  it('reports a canonical entry outside the DEC-001-DEC-295 range', () => {
    const ids = Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1);
    ids.push(296);
    writeRegister(dir, ids);
    const findings = checkDecisionRegister(dir, ['docs/decisions/decisions.md']);
    expect(findings.some((finding) => finding.reference === 'DEC-296')).toBe(true);
  });

  it('reports an incorrect declared Decision count', () => {
    const ids = Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1);
    writeRegister(dir, ids);
    const register = join(dir, 'docs', 'decisions', 'decisions.md');
    const text = readFileSync(register, 'utf8').replace('Indexed decisions: **295**', 'Indexed decisions: **294**');
    writeFileSync(register, text);
    const findings = checkDecisionRegister(dir, ['docs/decisions/decisions.md']);
    expect(findings.some((finding) => finding.problem === 'declared indexed Decision count must be 295')).toBe(true);
  });

  it('reports a Decision reference that is outside the canonical range', () => {
    writeRegister(
      dir,
      Array.from({ length: EXPECTED_DEC_COUNT }, (_, index) => index + 1),
    );
    writeFileSync(join(dir, 'doc.md'), 'Invalid reference DEC-300.\n');
    const findings = checkDecisionRegister(dir, ['docs/decisions/decisions.md', 'doc.md']);
    expect(findings.some((finding) => finding.reference === 'DEC-300')).toBe(true);
  });

  it('reports when the canonical register file is absent', () => {
    const findings = checkDecisionRegister(dir, []);
    expect(findings.some((finding) => finding.problem === 'canonical Decision Register not found')).toBe(true);
  });
});

describe('scanSecrets', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes for ordinary words and explicit placeholders', () => {
    writeFileSync(join(dir, 'a.txt'), 'the secret token placeholder replace-with-a-key password value config\n');
    expect(scanSecrets(dir, ['a.txt'])).toEqual([]);
  });

  it('skips binary files safely', () => {
    const buffer = Buffer.concat([Buffer.from(`${composeAwsKey()}\n`, 'utf8'), Buffer.from([0])]);
    writeFileSync(join(dir, 'bin.dat'), buffer);
    expect(scanSecrets(dir, ['bin.dat'])).toEqual([]);
  });

  it('detects a high-confidence credential without exposing its value', () => {
    const secret = composeAwsKey();
    writeFileSync(join(dir, 'a.txt'), `line one\nconfig key=${secret}\nline three\n`);
    const findings = scanSecrets(dir, ['a.txt']);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.detector).toBe('aws-access-key-id');
    expect(findings[0]?.line).toBe(2);
    expect(JSON.stringify(findings)).not.toContain(secret);
  });

  it('detects a private key block', () => {
    writeFileSync(join(dir, 'k.txt'), `${composePrivateKey()}\n`);
    const findings = scanSecrets(dir, ['k.txt']);
    expect(findings.some((finding) => finding.detector === 'private-key-block')).toBe(true);
  });
});

describe('listTrackedFiles (git integration)', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
    git(dir, 'init');
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns only git-tracked files', async () => {
    writeFileSync(join(dir, 'tracked.txt'), 'tracked\n');
    writeFileSync(join(dir, 'untracked.txt'), 'untracked\n');
    git(dir, 'add', 'tracked.txt');
    const files = await listTrackedFiles(dir);
    expect(files).toContain('tracked.txt');
    expect(files).not.toContain('untracked.txt');
  });
});

describe('repository-checks CLI', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function runCli(...args: string[]): { code: number; stdout: string; stderr: string } {
    const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
      cwd: dir,
      encoding: 'utf8',
    });
    return { code: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  }

  it('exits non-zero for a tracked synthetic secret without printing the value', () => {
    const secret = composeAwsKey();
    writeFileSync(join(dir, 'leak.txt'), `config=${secret}\n`);
    git(dir, 'init');
    git(dir, 'add', 'leak.txt');
    const outcome = runCli('--secrets', dir);
    expect(outcome.code).not.toBe(0);
    expect(outcome.stderr).not.toContain(secret);
    expect(outcome.stdout).not.toContain(secret);
  });

  it('exits zero on a clean repository', () => {
    writeFileSync(join(dir, 'README.md'), '# clean\n');
    git(dir, 'init');
    git(dir, 'add', 'README.md');
    const outcome = runCli('--docs', dir);
    expect(outcome.code).toBe(0);
  });
});
