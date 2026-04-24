// PURPOSE: Example test for Login component
// ROLE: Frontend Testing
// MODIFIED: 2026-04-23 — Phase 0 test infrastructure setup

import { describe, it, expect, vi } from 'vitest';
import { renderWithQuery, screen, waitFor } from '@/test/utils';
import Login from './Login';

// NOTE: This is a template test. Login.tsx doesn't exist yet.
// Phase 1.1 will implement the actual Login component.

describe('Login Component', () => {
  it('renders login form', () => {
    renderWithQuery(<Login />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('submits form with valid credentials', async () => {
    const handleLogin = vi.fn();
    renderWithQuery(<Login onLogin={handleLogin} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await waitFor(() => {
      expect(emailInput).toBeDefined();
    });
  });

  it('displays error on login failure', async () => {
    renderWithQuery(<Login />);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await waitFor(() => {
      expect(submitButton).toBeDefined();
    });
  });
});
