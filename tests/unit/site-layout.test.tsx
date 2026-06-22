import { expect, test, vi } from 'vitest';
import RootLayout from '@/app/(site)/layout';

vi.mock('next-intl/server', () => ({
  getMessages: vi.fn().mockResolvedValue({
    "en-IN": { "hello": "world" }
  })
}));

test('RootLayout renders with children', async () => {
  const children = <div id="test-child">Test Child</div>;
  const jsx = await RootLayout({ children });
  expect(jsx).toBeDefined();
  expect(jsx.type).toBe('html');
  expect(jsx.props.lang).toBe('en-IN');
});
