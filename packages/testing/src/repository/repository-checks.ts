/**
 * Dependency-free repository integrity checks for ContentOS M0-CI-001.
 *
 * This module is intentionally self-contained (only `node:` imports, no local
 * relative imports) so it can be executed directly by Node 24's built-in
 * TypeScript type-stripping as a CLI:
 *
 *   node packages/testing/src/repository/repository-checks.ts [--docs|--decisions|--secrets] [root]
 *
 * The pure check functions are also imported by the Vitest suite in this
 * package. They operate on a repository root plus an explicit list of tracked
 * files so they stay deterministic, network-independent, and credential-free;
 * `listTrackedFiles` is the only git-dependent piece.
 *
 * Output discipline: failures print only the kind, the file, the reference
 * (for link/Decision checks), the detector (for secret checks), and a short
 * problem category. The matched secret value and complete source lines are never
 * printed.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface LinkFinding {
  file: string;
  reference: string;
  problem: string;
}

export interface DecisionFinding {
  file: string;
  reference?: string;
  problem: string;
}

export interface SecretFinding {
  detector: string;
  file: string;
  line: number;
}

export interface RunResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

/** Canonical Decision Register covers exactly DEC-001 through DEC-295. */
export const EXPECTED_DEC_COUNT = 295;
/** Path of the canonical register relative to the repository root. */
export const DECISION_REGISTER = join('docs', 'decisions', 'decisions.md');

const DEC_INDEX_ROW_RE = /^\| *\[DEC-(\d{3})\]/;
const DEC_REF_RE = /DEC-([0-9]+)/g;
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
const URL_SCHEME_RE = /^[a-z][a-z\d+.-]*:/i;
const BINARY_PROBE_BYTES = 8000;

/** A bounded set of high-confidence credential / private-key detectors. */
const SECRET_DETECTORS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'aws-access-key-id', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'github-token', re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: 'github-fine-grained-pat', re: /github_pat_[A-Za-z0-9_]{40,}/ },
  { name: 'slack-token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'google-api-key', re: /AIza[0-9A-Za-z_-]{35}/ },
];

function decId(id: number): string {
  return `DEC-${String(id).padStart(3, '0')}`;
}

/** Spawns a process, accumulates output, and resolves on close. */
function run(cmd: string, args: string[]): Promise<RunResult> {
  return new Promise((result) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', () => result({ ok: false, code: -1, stdout, stderr }));
    child.on('close', (code) => result({ ok: code === 0, code: code ?? -1, stdout, stderr }));
  });
}

/** Returns the Git-tracked files under `root` as repository-relative POSIX paths. */
export async function listTrackedFiles(root: string): Promise<string[]> {
  const result = await run('git', ['-C', root, 'ls-files']);
  if (!result.ok) {
    throw new Error(`git ls-files failed (exit ${result.code})`);
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

interface ParsedLink {
  raw: string;
  localPath: string;
}

/**
 * Extracts the local path from a markdown link destination, or returns null
 * when the destination is external, fragment-only, empty, or malformed.
 */
function parseLocalLink(rawTarget: string): ParsedLink | null {
  let dest = rawTarget.trim();
  const angle = /^<(.*)>$/.exec(dest);
  if (angle) {
    dest = angle[1] ?? '';
  } else {
    // Strip an optional title: [text](url "title") -> url
    dest = dest.split(/\s+/)[0] ?? '';
  }
  if (dest === '' || dest.startsWith('#')) {
    return null;
  }
  if (URL_SCHEME_RE.test(dest)) {
    return null;
  }
  const withoutFragment = dest.split('#')[0] ?? '';
  const withoutQuery = withoutFragment.split('?')[0] ?? '';
  if (withoutQuery === '') {
    return null;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    throw new Error('malformed URL encoding');
  }
  return { raw: rawTarget, localPath: decoded };
}

/**
 * Markdown files excluded as link-check sources. The historical session archive
 * (`docs/sessions/**`) is an immutable discussion record (DEC-290), not
 * current-truth documentation; its image/asset references were never committed
 * and cannot be repaired without editing a prohibited historical file. Links
 * from current-truth documents INTO session files are still validated as link
 * targets.
 */
const LINK_CHECK_SOURCE_EXCLUDES = ['docs/sessions/'];

function isExcludedLinkSource(rel: string): boolean {
  return LINK_CHECK_SOURCE_EXCLUDES.some((prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix));
}

/**
 * Verifies that every local link destination in tracked Markdown resolves to an
 * existing path inside the repository. External URLs and fragment-only links are
 * ignored; query and fragment components do not affect resolution; URL-encoded
 * paths are decoded; links cannot escape the repository root. The immutable
 * historical session archive is excluded as a link source.
 */
export function checkMarkdownLinks(root: string, files: string[]): LinkFinding[] {
  const findings: LinkFinding[] = [];
  for (const rel of files) {
    if (!rel.endsWith('.md') || isExcludedLinkSource(rel)) {
      continue;
    }
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      continue;
    }
    const text = readFileSync(abs, 'utf8');
    MARKDOWN_LINK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MARKDOWN_LINK_RE.exec(text)) !== null) {
      const rawTarget = match[2] ?? '';
      let parsed: ParsedLink | null;
      try {
        parsed = parseLocalLink(rawTarget);
      } catch {
        findings.push({ file: rel, reference: rawTarget, problem: 'malformed URL encoding' });
        continue;
      }
      if (parsed === null) {
        continue;
      }
      const resolved = resolve(root, dirname(rel), parsed.localPath);
      const relToRoot = relative(root, resolved);
      if (relToRoot.startsWith('..') || isAbsolute(relToRoot)) {
        findings.push({ file: rel, reference: parsed.raw, problem: 'link escapes the repository' });
        continue;
      }
      if (!existsSync(resolved)) {
        findings.push({ file: rel, reference: parsed.raw, problem: 'local link target not found' });
      }
    }
  }
  return findings;
}

/**
 * Verifies canonical Decision Register continuity (exactly one index entry for
 * DEC-001 through DEC-295, no missing or duplicate entries) and that every
 * DEC-NNN reference in tracked Markdown resolves to the canonical range.
 */
export function checkDecisionRegister(root: string, files: string[]): DecisionFinding[] {
  const findings: DecisionFinding[] = [];
  const registerAbs = join(root, DECISION_REGISTER);

  const indexIds: number[] = [];
  if (existsSync(registerAbs)) {
    const text = readFileSync(registerAbs, 'utf8');
    for (const line of text.split('\n')) {
      const match = DEC_INDEX_ROW_RE.exec(line);
      if (match) {
        indexIds.push(Number.parseInt(match[1] ?? '', 10));
      }
    }
  } else {
    findings.push({ file: DECISION_REGISTER, problem: 'canonical Decision Register not found' });
  }

  const indexSet = new Set<number>();
  const duplicates = new Set<number>();
  for (const id of indexIds) {
    if (indexSet.has(id)) {
      duplicates.add(id);
    } else {
      indexSet.add(id);
    }
  }
  for (const id of duplicates) {
    findings.push({ file: DECISION_REGISTER, reference: decId(id), problem: 'duplicate canonical Decision entry' });
  }
  for (let id = 1; id <= EXPECTED_DEC_COUNT; id += 1) {
    if (!indexSet.has(id)) {
      findings.push({ file: DECISION_REGISTER, reference: decId(id), problem: 'missing canonical Decision entry' });
    }
  }
  for (const id of indexSet) {
    if (id < 1 || id > EXPECTED_DEC_COUNT) {
      findings.push({
        file: DECISION_REGISTER,
        reference: decId(id),
        problem: 'canonical entry outside range DEC-001-DEC-295',
      });
    }
  }

  const canonical = new Set<number>();
  for (let id = 1; id <= EXPECTED_DEC_COUNT; id += 1) {
    canonical.add(id);
  }
  for (const rel of files) {
    if (!rel.endsWith('.md')) {
      continue;
    }
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      continue;
    }
    const text = readFileSync(abs, 'utf8');
    DEC_REF_RE.lastIndex = 0;
    const reported = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = DEC_REF_RE.exec(text)) !== null) {
      const digits = match[1] ?? '';
      const id = Number.parseInt(digits, 10);
      if (!canonical.has(id)) {
        const reference = `DEC-${digits}`;
        if (!reported.has(reference)) {
          reported.add(reference);
          findings.push({ file: rel, reference, problem: 'Decision reference not in canonical range DEC-001-DEC-295' });
        }
      }
    }
  }
  return findings;
}

/**
 * Scans tracked text files for a bounded set of high-confidence credential and
 * private-key forms. Binary files are skipped. Only the detector name, file, and
 * line number are returned; the matched value is never captured or printed.
 */
export function scanSecrets(root: string, files: string[]): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const rel of files) {
    const abs = join(root, rel);
    let buffer: Buffer;
    try {
      buffer = readFileSync(abs);
    } catch {
      continue;
    }
    const probe = buffer.subarray(0, Math.min(buffer.length, BINARY_PROBE_BYTES));
    if (probe.includes(0)) {
      continue;
    }
    const text = buffer.toString('utf8');
    const lines = text.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) {
        continue;
      }
      for (const detector of SECRET_DETECTORS) {
        if (detector.re.test(line)) {
          findings.push({ detector: detector.name, file: rel, line: index + 1 });
          break;
        }
      }
    }
  }
  return findings;
}

interface CheckOutcome {
  label: string;
  lines: string[];
}

function report(outcomes: CheckOutcome[]): void {
  for (const outcome of outcomes) {
    for (const line of outcome.lines) {
      console.error(`repository-check ${outcome.label}: ${line}`);
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let root = process.cwd();
  let mode = 'all';
  const positional: string[] = [];
  for (const arg of argv) {
    if (arg === '--docs') {
      mode = 'docs';
    } else if (arg === '--decisions') {
      mode = 'decisions';
    } else if (arg === '--secrets') {
      mode = 'secrets';
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 0) {
    root = resolve(positional[0] ?? process.cwd());
  }

  const files = await listTrackedFiles(root);
  const outcomes: CheckOutcome[] = [];

  if (mode === 'all' || mode === 'docs') {
    outcomes.push({
      label: 'doc-link',
      lines: checkMarkdownLinks(root, files).map((f) => `${f.file}: ${f.reference}: ${f.problem}`),
    });
  }
  if (mode === 'all' || mode === 'decisions') {
    outcomes.push({
      label: 'decision',
      lines: checkDecisionRegister(root, files).map(
        (f) => `${f.file}${f.reference ? `: ${f.reference}` : ''}: ${f.problem}`,
      ),
    });
  }
  if (mode === 'all' || mode === 'secrets') {
    outcomes.push({
      label: 'secret',
      lines: scanSecrets(root, files).map((f) => `${f.detector}: ${f.file}:${f.line}`),
    });
  }

  report(outcomes);
  const total = outcomes.reduce((sum, outcome) => sum + outcome.lines.length, 0);
  if (total > 0) {
    process.exit(1);
  }
}

const entryPath = process.argv[1];
const modulePath = fileURLToPath(import.meta.url);

// Run the CLI only when this file is executed directly (e.g.
// `node repository-checks.ts`), not when imported by the test suite.
if (entryPath !== undefined && resolve(entryPath) === modulePath) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`repository-check error: ${message.split('\n')[0] ?? ''}`);
    process.exit(1);
  });
}
