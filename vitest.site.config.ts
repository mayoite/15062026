import { defineConfig } from 'vitest/config';
import path from 'path';

import {
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COMMON_EXCLUDE,
  VITEST_COVERAGE_DIRS,
  VITEST_REPORT_PATHS,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
} from './vitest.shared';

export default defineConfig({
  resolve: {
    alias: {
      '@/types': path.resolve(VITEST_REPO_ROOT, 'config/database/types'),
      '@/app': path.resolve(VITEST_REPO_ROOT, 'app'),
      '@/components': path.resolve(VITEST_REPO_ROOT, 'components'),
      '@/data': path.resolve(VITEST_REPO_ROOT, 'data'),
      '@/features': path.resolve(VITEST_REPO_ROOT, 'features'),
      '@/lib': path.resolve(VITEST_REPO_ROOT, 'lib'),
      '@/stores': path.resolve(VITEST_REPO_ROOT, 'archive/state/state'),
      '@': VITEST_REPO_ROOT,
    },
  },
  test: {
    pool: 'forks',
    globals: true,
    environment: 'happy-dom',
    setupFiles: [VITEST_SETUP_FILE],
    reporters: ['default', 'json'],
    outputFile: {
      json: VITEST_REPORT_PATHS.site.json,
    },
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: [...VITEST_COMMON_EXCLUDE],
    coverage: {
      provider: 'v8',
      reportsDirectory: VITEST_COVERAGE_DIRS.site,
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // Site-logic scope (see plans/SITE-COVERAGE.md).
      include: [
        'lib/site-data/**/*.{ts,tsx}',
        'lib/catalog/**/*.{ts,tsx}',
        'lib/configurator/**/*.ts',
        'features/catalog/**/*.{ts,tsx}',
        'features/shared/**/*.{ts,tsx}',
        'features/site-assistant/**/*.{ts,tsx}',
        'features/ops/**/*.{ts,tsx}',
        'features/ai/aiAdvisor.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      // Ratcheted 2026-06-15 after S5 — ~5–8 pts below measured site rollup (~97% stmts).
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
