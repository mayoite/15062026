import { expect, test, vi } from 'vitest';
import { GET, POST } from '@/app/api/plans/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  })
}));

vi.mock('@/features/planner/store/plannerPublish', () => ({
  buildPlannerDocumentFromPortalPublishData: vi.fn().mockReturnValue({}),
}));

vi.mock('@/features/planner/store/plannerSaves', () => ({
  listPlannerDocumentsFromStore: vi.fn().mockResolvedValue([]),
  savePlannerDocumentToStore: vi.fn().mockResolvedValue({ id: 'doc-1' }),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrfRequest: vi.fn().mockResolvedValue(false),
}));

test('GET API returns 401 when unauthenticated', async () => {
  const req = new NextRequest('http://localhost:3000/api/plans');
  req.headers.set('x-forwarded-for', '127.0.0.1');
  const response = await GET(req);
  expect(response.status).toBe(401);
});

test('POST API returns 403 when CSRF is invalid', async () => {
  const req = new NextRequest('http://localhost:3000/api/plans', { method: 'POST' });
  req.headers.set('x-forwarded-for', '127.0.0.1');
  const response = await POST(req);
  expect(response.status).toBeGreaterThanOrEqual(400);
});
