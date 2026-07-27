import js from '@eslint/js';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{ts,tsx,mts,cts}'];
const nodeFiles = [
  'apps/{api,worker,fetcher,renderer}/**/*.{js,mjs,cjs,ts,mts,cts}',
  'packages/**/src/**/*.{js,mjs,cjs,ts,mts,cts}',
  '*.{js,mjs,cjs}',
];
const webConfig = nextCoreWebVitals.map((config) => ({
  ...config,
  files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
  settings: {
    ...config.settings,
    next: {
      ...config.settings?.next,
      rootDir: 'apps/web/',
    },
    react: {
      ...config.settings?.react,
      version: '19.2',
    },
  },
}));

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'apps/web/.next/**',
      'apps/web/next-env.d.ts',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...webConfig,
  {
    files: sourceFiles,
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: globals.node,
    },
  },
);
