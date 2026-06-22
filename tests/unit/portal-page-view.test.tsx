import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import PortalPageView from '@/features/planner/portal/PortalPageView';
import type { PlannerSaveSummary } from '@/features/planner/store/plannerSaves';

test('renders missing configuration state when not configured', () => {
  render(<PortalPageView databaseConfigured={false} plans={[]} />);
  expect(screen.getByText(/Planner storage is not configured yet/i)).toBeInTheDocument();
});

test('renders empty state when no plans exist', () => {
  render(<PortalPageView databaseConfigured={true} plans={[]} userName="Alice" />);
  expect(screen.getByText("Alice's plans")).toBeInTheDocument();
  expect(screen.getByText('No saved plans yet')).toBeInTheDocument();
});

test('renders list of plans', () => {
  const plans: PlannerSaveSummary[] = [
    {
      id: 'plan-123',
      user_id: '00000000-0000-4000-8000-000000000002',
      name: 'Office Alpha',
      project_name: 'HQ Reno',
      client_name: null,
      prepared_by: null,
      item_count: 42,
      room_width_mm: 5000,
      room_depth_mm: 5000,
      seat_target: 5,
      unit_system: 'metric',
      thumbnail_url: null,
      updated_at: '2025-01-01T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
    }
  ];
  render(<PortalPageView databaseConfigured={true} plans={plans} userName="Bob" />);
  expect(screen.getByText("Bob's plans")).toBeInTheDocument();
  expect(screen.getByText('Office Alpha')).toBeInTheDocument();
  expect(screen.getByText('HQ Reno')).toBeInTheDocument();
  expect(screen.getByText('42 items')).toBeInTheDocument();
});
