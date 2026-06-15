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
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
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
      reportsDirectory: './results/coverage',
      // Vitest-only scope: planner logic under test today (no app/route harness).
      include: ['features/planner/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        statements: 76,
        branches: 68,
        functions: 72,
        lines: 78,
      },
    },
  },
});