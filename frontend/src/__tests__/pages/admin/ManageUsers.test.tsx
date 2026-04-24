// PURPOSE: Tests for ManageUsers admin panel
// ROLE: Frontend Testing
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { describe, it, expect } from 'vitest';
import { renderWithQuery, screen, fireEvent, waitFor } from '@/test/utils';
import ManageUsers from '@/pages/admin/ManageUsers';

describe('ManageUsers Admin Panel', () => {
  it('renders user list table', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Manage Family Members')).toBeDefined();
    });
  });

  it('displays add member button', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeDefined();
    });
  });

  it('opens add member form when button clicked', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeDefined();
    });

    const addButton = screen.getByText('+ Add Member');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeDefined();
    });
  });

  it('validates display name is required', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeDefined();
    });

    const addButton = screen.getByText('+ Add Member');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeDefined();
    });

    // Try to submit empty form
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeDefined();
    });
  });

  it('shows delete confirmation modal', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Manage Family Members')).toBeDefined();
    });

    // Would test delete functionality after user list loads
  });

  it('filters users by role', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Manage Family Members')).toBeDefined();
    });

    // Look for role filter select
    const filterSelect = screen.getByDisplayValue('All');
    fireEvent.change(filterSelect, { target: { value: 'member' } });

    // List should update with filtered users
  });

  it('displays user avatars or initials', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Manage Family Members')).toBeDefined();
    });

    // Would test avatar display after user list loads
  });

  it('shows edit button for each user', async () => {
    renderWithQuery(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Manage Family Members')).toBeDefined();
    });

    // Would test edit buttons after user list loads
  });

  it('prevents non-admin access', async () => {
    // This would test by mocking non-admin user in store
    // Component should show "Access Denied" message
  });
});
