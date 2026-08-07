import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

type BraceExpansion = {
  (input: string, options?: { max?: number; maxLength?: number }): string[];
  EXPANSION_MAX: number;
  EXPANSION_MAX_LENGTH: number;
  expand: BraceExpansion;
};

type MinimatchModule =
  | ((input: string, pattern: string, options?: { nobrace?: boolean }) => boolean)
  | {
      minimatch(input: string, pattern: string, options?: { nobrace?: boolean }): boolean;
    };

interface MinimatchContext {
  name: string;
  require: NodeRequire;
  version: string;
}

const rootRequire = createRequire(import.meta.url);
const requireFromEslint = createRequire(rootRequire.resolve('eslint/package.json'));
const requireFromFileEntryCache = createRequire(requireFromEslint.resolve('file-entry-cache/package.json'));
const requireFromGlob = createRequire(requireFromFileEntryCache.resolve('glob/package.json'));
const requireFromTypeScriptEslint = createRequire(rootRequire.resolve('typescript-eslint/package.json'));
const requireFromTypeScriptEstree = createRequire(
  requireFromTypeScriptEslint.resolve('@typescript-eslint/typescript-estree/package.json'),
);

const minimatchContexts: MinimatchContext[] = [
  { name: 'legacy ESLint', require: requireFromEslint, version: '3.1.5' },
  { name: 'current ESLint transitive', require: requireFromGlob, version: '9.0.9' },
  { name: 'modern TypeScript ESLint', require: requireFromTypeScriptEstree, version: '10.2.5' },
];

function matches(minimatch: MinimatchModule, input: string, pattern: string, options?: { nobrace?: boolean }): boolean {
  return typeof minimatch === 'function'
    ? minimatch(input, pattern, options)
    : minimatch.minimatch(input, pattern, options);
}

describe('ESLint brace-expansion compatibility', () => {
  it('converges every installed ESLint minimatch context on the patched safe release', () => {
    for (const context of minimatchContexts) {
      const minimatchPackage = context.require('minimatch/package.json') as { version: string };
      const braceExpansionPackage = context.require('brace-expansion/package.json') as { version: string };
      const braceExpansion = context.require('brace-expansion') as BraceExpansion;

      expect(minimatchPackage.version, context.name).toBe(context.version);
      expect(braceExpansionPackage.version, context.name).toBe('5.0.9');
      expect(context.require.resolve('brace-expansion/package.json'), context.name).toContain(
        '/node_modules/brace-expansion/package.json',
      );
      expect(typeof braceExpansion, context.name).toBe('function');
      expect(braceExpansion.expand, context.name).toBe(braceExpansion);
      expect(braceExpansion.EXPANSION_MAX, context.name).toBe(100_000);
      expect(braceExpansion.EXPANSION_MAX_LENGTH, context.name).toBe(4_000_000);
    }
  });

  it('preserves representative matching behavior for legacy and current minimatch generations', () => {
    const matchingCases = [
      ['README.md', 'README.md', undefined, true],
      ['src/index.ts', 'src/*.ts', undefined, true],
      ['src/nested/index.ts', 'src/*.ts', undefined, false],
      ['src/feature.ts', 'src/{feature,other}.ts', undefined, true],
      ['chapter-2.md', 'chapter-{1..3}.md', undefined, true],
      ['packages/core/src/index.ts', 'packages/*/src/*.ts', undefined, true],
      ['notes.txt', '*.md', undefined, false],
      ['file-{a,b}.ts', 'file-{a,b}.ts', { nobrace: true }, true],
    ] as const;

    for (const context of minimatchContexts) {
      const minimatch = context.require('minimatch') as MinimatchModule;

      for (const [input, pattern, options, expected] of matchingCases) {
        expect(matches(minimatch, input, pattern, options), context.name).toBe(expected);
      }
    }
  });

  it('keeps expansion bounded with explicit small max and maxLength values', () => {
    const braceExpansion = requireFromEslint('brace-expansion') as BraceExpansion;

    expect(braceExpansion('prefix-{a,b,c}', { max: 2, maxLength: 16 })).toEqual(['prefix-a', 'prefix-b']);
    expect(braceExpansion('{a,b,c}{d,e,f}', { max: 4, maxLength: 6 })).toEqual(['ad', 'ae', 'af']);
  });
});
