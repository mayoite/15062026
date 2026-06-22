import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import PortalPlanPageView from '@/features/planner/portal/PortalPlanPageView';
import type { PlannerDocument } from '@/features/planner/model';

test('renders not found state for null document', () => {
  render(<PortalPlanPageView document={null} />);
  expect(screen.getByText('Plan not found')).toBeInTheDocument();
});

test('renders plan details for valid document', () => {
  const doc: PlannerDocument = {
    id: 'doc-1',
    title: 'Awesome Layout',
    name: 'Layout v1',
    projectName: 'Acme Project',
    clientName: null,
    preparedBy: null,
    updatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    roomWidthMm: 10000,
    roomDepthMm: 8000,
    itemCount: 15,
    seatTarget: 5,
    unitSystem: 'metric',
    status: 'active',
    thumbnailUrl: null,
    sceneJson: JSON.stringify({
      version: 1,
      room: { widthMm: 10000, depthMm: 8000 },
      items: [
        { id: 'i1', name: 'Desk A', category: 'Furniture', sizeMm: { widthMm: 1200, depthMm: 600, heightMm: 750 }, rotationDeg: 0, positionMm: { x: 0, y: 0, z: 0 } }
      ]
    })
  };
  render(<PortalPlanPageView document={doc} />);
  expect(screen.getByText('Awesome Layout')).toBeInTheDocument();
  expect(screen.getByText(/Acme Project/)).toBeInTheDocument();
  // itemCount renders in its own <dd>
  expect(screen.getByText('15')).toBeInTheDocument();
  // status and unitSystem render in their own <dd> elements
  expect(screen.getByText('metric')).toBeInTheDocument();
  expect(screen.getByText('active')).toBeInTheDocument();
});
