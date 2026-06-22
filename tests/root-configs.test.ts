// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl/plugin', () => {
  const mockPlugin = () => (config: object) => ({ ...config });
  return { default: mockPlugin };
});

import nextConfig from '../next.config.js';
import vitestConfig from '../vitest.config';

describe('Root Configurations', () => {
  describe('next.config.js', () => {
    it('should export a valid next configuration object or function', () => {
      expect(nextConfig).toBeDefined();
      expect(['object', 'function']).toContain(typeof nextConfig);
    });
  });

  describe('postcss.config.mjs', () => {
    it('should export a valid postcss configuration', async () => {
      const postcssConfig = await import('../postcss.config.mjs');
      expect(postcssConfig.default).toBeDefined();
    });
  });

  describe('vitest.config.ts', () => {
    it('should export a valid vitest configuration', () => {
      expect(vitestConfig).toBeDefined();
      expect(vitestConfig.test).toBeDefined();
      expect(vitestConfig.test?.environment).toBe('happy-dom');
    });
  });
});
