import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@/types': path.resolve(__dirname, 'config/database/types'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/data': path.resolve(__dirname, 'data'),
      '@/features': path.resolve(__dirname, 'features'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/stores': path.resolve(__dirname, 'archive/state/state'),
      '@': path.resolve(__dirname),
    },
  },
  test: {
    pool: 'forks',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    reporters: ['default', 'json'],
    outputFile: {
      json: path.resolve(__dirname, 'results/tests/vitest-site-results.json'),
    },
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: [
      'node_modules',
      'archive',
      '.next',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './results/coverage-site',
      // Site-logic scope (see plans/SITE-COVERAGE.md).
      include: [
        'data/site/**/*.{ts,tsx}',
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
