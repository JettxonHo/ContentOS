const INTEGRATION_SETUP_PREFIX = 'contentos smoke setup failed: ';
const BROWSER_ERROR_PREFIX = 'CONTENTOS_BROWSER_HARNESS_ERROR:';

const SETUP_CATEGORIES = [
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

const CLEANUP_CATEGORIES = [
  'managed-process',
  'process-control',
  'object-storage',
  'compose',
  'compose-verify',
  'root',
  'synthetic',
] as const;

type SetupCategory = (typeof SETUP_CATEGORIES)[number];
type CleanupCategory = (typeof CLEANUP_CATEGORIES)[number];
type PhysicalState = 'clean' | 'incomplete';
type CapsuleState = 'removed' | 'preserved';

export type BrowserHarnessSetupRecord =
  | {
      readonly setup: SetupCategory;
      readonly teardown: 'clean';
    }
  | {
      readonly setup: SetupCategory;
      readonly teardown: 'failed';
      readonly cleanup: readonly CleanupCategory[];
      readonly physical: PhysicalState;
      readonly capsule: CapsuleState;
    }
  | {
      readonly setup: 'unclassified';
      readonly teardown: 'failed';
      readonly cleanup: readonly ['root'];
      readonly physical: 'incomplete';
      readonly capsule: 'preserved';
    };

const UNKNOWN_BROWSER_ERROR_RECORD =
  'CONTENTOS_BROWSER_HARNESS_ERROR:setup=unclassified teardown=failed cleanup=root physical=incomplete capsule=preserved';

const INTEGRATION_SETUP_RECORD_PATTERN =
  /^contentos smoke setup failed: setup=([a-z-]+) teardown=(clean|failed)(?: cleanup=([a-z,-]+) physical=(clean|incomplete) capsule=(removed|preserved))?$/;
const BROWSER_SETUP_RECORD_PATTERN =
  /^CONTENTOS_BROWSER_HARNESS_ERROR:setup=([a-z-]+) teardown=(clean|failed)(?: cleanup=([a-z,-]+) physical=(clean|incomplete) capsule=(removed|preserved))?$/;

function isSetupCategory(value: string): value is SetupCategory {
  return (SETUP_CATEGORIES as readonly string[]).includes(value);
}

function isCleanupCategory(value: string): value is CleanupCategory {
  return (CLEANUP_CATEGORIES as readonly string[]).includes(value);
}

function parseCleanupCategories(value: string | undefined): readonly CleanupCategory[] | undefined {
  if (!value) return undefined;
  const categories: CleanupCategory[] = [];
  const parts = value.split(',');
  if (parts.length === 0) return undefined;
  let previousIndex = -1;
  for (const part of parts) {
    if (!isCleanupCategory(part)) return undefined;
    const index = CLEANUP_CATEGORIES.indexOf(part);
    if (index <= previousIndex) return undefined;
    previousIndex = index;
    categories.push(part);
  }
  return categories;
}

function parseRecordLine(
  line: string,
  pattern: RegExp,
  allowUnclassified = false,
): BrowserHarnessSetupRecord | undefined {
  const match = pattern.exec(line);
  if (!match) return undefined;

  const [, setup, teardown, cleanupValue, physical, capsule] = match;
  if (!setup || !teardown) return undefined;
  const unclassified = setup === 'unclassified';
  if ((!isSetupCategory(setup) && !(allowUnclassified && unclassified)) || (unclassified && teardown !== 'failed')) {
    return undefined;
  }

  if (unclassified) {
    if (cleanupValue !== 'root' || physical !== 'incomplete' || capsule !== 'preserved') return undefined;
    return unknownRecord();
  }

  if (teardown === 'clean') {
    return cleanupValue === undefined && physical === undefined && capsule === undefined
      ? { setup, teardown: 'clean' }
      : undefined;
  }

  const cleanup = parseCleanupCategories(cleanupValue);
  if (!cleanup || !physical || !capsule) return undefined;
  return {
    setup,
    teardown: 'failed',
    cleanup,
    physical: physical as PhysicalState,
    capsule: capsule as CapsuleState,
  };
}

function formatRecord(record: BrowserHarnessSetupRecord): string {
  if (record.teardown === 'clean') {
    return `${BROWSER_ERROR_PREFIX}setup=${record.setup} teardown=clean`;
  }
  return `${BROWSER_ERROR_PREFIX}setup=${record.setup} teardown=failed cleanup=${record.cleanup.join(',')} physical=${record.physical} capsule=${record.capsule}`;
}

function unknownRecord(): BrowserHarnessSetupRecord {
  return {
    setup: 'unclassified',
    teardown: 'failed',
    cleanup: ['root'],
    physical: 'incomplete',
    capsule: 'preserved',
  };
}

/**
 * Parses only the exact sanitized setup error emitted by the Integration
 * Harness. The returned value contains allowlisted fields only.
 */
export function parseIntegrationHarnessSetupFailure(error: unknown): BrowserHarnessSetupRecord | undefined {
  if (!(error instanceof Error)) return undefined;
  try {
    if (!error.message.startsWith(INTEGRATION_SETUP_PREFIX) || /[\r\n]/.test(error.message)) return undefined;
    return parseRecordLine(error.message, INTEGRATION_SETUP_RECORD_PATTERN);
  } catch {
    return undefined;
  }
}

/**
 * Reconstructs one fixed, LF-terminated Browser record from a sanitized
 * Integration setup error. Every unknown input uses the fixed fail-closed
 * record and never forwards arbitrary error content.
 */
export function formatBrowserHarnessSetupFailure(error: unknown): string {
  const record = parseIntegrationHarnessSetupFailure(error) ?? unknownRecord();
  return `${formatRecord(record)}\n`;
}

/**
 * Parses one fixed Browser record line. This is intentionally separate from
 * the output-tail parser so callers cannot accidentally accept a partial line.
 */
export function parseBrowserHarnessErrorLine(line: string): BrowserHarnessSetupRecord | undefined {
  if (!line || /[\r\n]/.test(line)) return undefined;
  return parseRecordLine(line, BROWSER_SETUP_RECORD_PATTERN, true);
}

/**
 * Finds exactly one complete, non-conflicting Browser record in a bounded
 * output tail. Lines that mention the Browser record prefix but fail the exact
 * grammar invalidate the tail; unrelated diagnostic lines are ignored.
 */
export function parseBrowserHarnessErrorOutput(output: string): BrowserHarnessSetupRecord | undefined {
  if (typeof output !== 'string' || !output.endsWith('\n')) return undefined;

  const records: BrowserHarnessSetupRecord[] = [];
  for (const line of output.split('\n').slice(0, -1)) {
    if (!line.includes(BROWSER_ERROR_PREFIX)) continue;
    const record = parseBrowserHarnessErrorLine(line);
    if (!record) return undefined;
    records.push(record);
  }
  return records.length === 1 ? records[0] : undefined;
}

/**
 * Formats the safe fields used by Playwright global setup. It accepts only the
 * typed record returned by this module and therefore cannot include arbitrary
 * child output.
 */
export function formatBrowserHarnessSetupError(record: BrowserHarnessSetupRecord | undefined): string {
  const safeRecord = record ?? unknownRecord();
  return `Browser smoke harness setup failed: ${formatRecord(safeRecord).slice(BROWSER_ERROR_PREFIX.length)}.`;
}

export { BROWSER_ERROR_PREFIX, UNKNOWN_BROWSER_ERROR_RECORD };
