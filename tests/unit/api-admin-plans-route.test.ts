import { expect, test, vi } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/admin/plans/route';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

vi.mock('@/features/planner/store/plannerPersistence', () => ({
  isPlannerDatabaseConfigured: vi.fn().mockReturnValue(true),
  listPlannerDocumentsAdmin: vi.fn().mockResolvedValue([]),
  patchPlannerDocumentAdmin: vi.fn().mockResolvedValue(null),
  deletePlannerDocument: vi.fn().mockResolvedValue(null),
  planRowToAdminSummary: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrfRequest: vi.fn().mockReturnValue(true),
}));

vi.mock('@/app/api/admin/_lib/server', () => ({
  enforceAdminRateLimit: vi.fn().mockResolvedValue(null),
  requireAdminSession: vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    )
  ),
}));

test('Admin GET requires session', async () => {
  const req = new NextRequest('http://localhost:3000/api/admin/plans');
  const res = await GET(req);
  expect(res.status).toBe(401);
});

test('Admin PATCH requires session', async () => {
  const req = new NextRequest('http://localhost:3000/api/admin/plans', { method: 'PATCH' });
  const res = await PATCH(req);
  expect(res.status).toBe(401);
});

test('Admin DELETE requires session', async () => {
  const req = new NextRequest('http://localhost:3000/api/admin/plans?id=123', { method: 'DELETE' });
  const res = await DELETE(req);
  expect(res.status).toBe(401);
});
