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
    // forks is safer than threads on Windows for V8 coverage file merging
    pool: 'forks',
    globals: true,
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, 'tests/setup.ts')],
    reporters: ['default', 'json'],
    outputFile: {
      json: path.resolve(__dirname, 'results/tests/vitest-results.json'),
    },
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      'archive/**',
      '.next/**',
      'tech-stack-docs/**',
      'results/**',
      'scripts/**',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './results/coverage',
      reporter: ['text', 'json', 'json-summary', 'html'],
      // Force-include all source files even if no test imports them
      // Without this, untested files are invisible (not 0%) — misleading
      all: true,
      include: [
        'app/**/*.{ts,tsx}',
        'features/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'config/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.mock.{ts,tsx}',
        'node_modules/**',
        'archive/**',
        '.next/**',
        'results/**',
        'public/**',
        'dist/**',
        'build/**',
        'scripts/**',
        'tests/**',
        'tech-stack-docs/**',
      ],
    },
  },
});
