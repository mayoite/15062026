import { expect, test, vi } from 'vitest';
import Home from '@/app/(site)/page';

vi.mock('@/features/crm/businessStats', () => ({
  getBusinessStats: vi.fn().mockResolvedValue({
    stats: { 
      activeUsers: 100, 
      generatedPlans: 200, 
      configuredProducts: 300 
    }
  })
}));

test('Home page renders layout structure', async () => {
  const jsx = await Home();
  expect(jsx).toBeDefined();
  expect(jsx.type).toBe('div');
  expect(jsx.props.className).toContain('min-h-screen');
});
