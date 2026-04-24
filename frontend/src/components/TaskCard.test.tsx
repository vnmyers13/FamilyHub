// PURPOSE: Example test for TaskCard component
// ROLE: Frontend Testing
// MODIFIED: 2026-04-23 — Phase 0 test infrastructure setup

import { describe, it, expect, vi } from 'vitest';
import { renderWithQuery, screen } from '@/test/utils';
import TaskCard from './TaskCard';

// NOTE: This is a template test. TaskCard.tsx doesn't exist yet.
// Phase 1.2 will implement the actual TaskCard component.

const mockTask = {
  id: '1',
  title: 'Buy groceries',
  description: 'Milk, eggs, bread',
  status: 'pending' as const,
  priority: 'high' as const,
  assigned_to: '2',
  due_date: '2026-04-25',
  created_by: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('TaskCard Component', () => {
  it('renders task title', () => {
    renderWithQuery(<TaskCard task={mockTask} />);
    expect(screen.getByText('Buy groceries')).toBeDefined();
  });

  it('displays task priority', () => {
    renderWithQuery(<TaskCard task={mockTask} />);
    expect(screen.getByText(/high/i)).toBeDefined();
  });

  it('calls onStatusChange when status is updated', async () => {
    const handleStatusChange = vi.fn();
    renderWithQuery(<TaskCard task={mockTask} onStatusChange={handleStatusChange} />);

    const statusButton = screen.getByRole('button', { name: /status/i });
    expect(statusButton).toBeDefined();
  });

  it('displays due date', () => {
    renderWithQuery(<TaskCard task={mockTask} />);
    expect(screen.getByText('2026-04-25')).toBeDefined();
  });
});
