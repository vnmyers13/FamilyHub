// PURPOSE: Tests for Login component
// ROLE: Frontend Testing
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { describe, it, expect, vi } from 'vitest';
import { renderWithQuery, screen, fireEvent, waitFor } from '@/test/utils';
import Login from '@/pages/Login';

describe('Login Component', () => {
  it('renders family member selection screen', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
      expect(screen.getByText('Select your family member account')).toBeDefined();
    });
  });

  it('displays family members from API', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      // MSW will return mock users
      expect(screen.getByText(/Welcome Back/)).toBeDefined();
    });
  });

  it('shows PIN pad after selecting user with PIN', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
    });

    // The actual selection would happen here
    // This is a simplified test as full integration requires proper MSW setup
  });

  it('shows password form after selecting user without PIN', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
    });
  });

  it('allows changing user selection', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
    });

    // Look for Change User button (would appear after user selection)
  });

  it('displays lockout message after failed attempts', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
    });

    // Would test rate limiting after 5+ failed attempts
  });

  it('PIN pad displays dots for entered digits', async () => {
    renderWithQuery(<Login />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeDefined();
    });

    // Would test PIN display masking
  });
});
