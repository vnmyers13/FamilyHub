// PURPOSE: Tests for SetupWizard component
// ROLE: Frontend Testing
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { describe, it, expect, vi } from 'vitest';
import { renderWithQuery, screen, fireEvent, waitFor } from '@/test/utils';
import Setup from '@/pages/Setup';

describe('SetupWizard Component', () => {
  it('renders welcome step initially', () => {
    renderWithQuery(<Setup />);
    expect(screen.getByText('Welcome to FamilyHub')).toBeDefined();
    expect(screen.getByText('Get Started')).toBeDefined();
  });

  it('navigates through steps', async () => {
    renderWithQuery(<Setup />);

    // Click Get Started
    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);

    // Should show family information step
    await waitFor(() => {
      expect(screen.getByText('Family Information')).toBeDefined();
    });
  });

  it('validates required fields', async () => {
    renderWithQuery(<Setup />);

    // Get to step 2
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Family Information')).toBeDefined();
    });

    // Try to continue without family name
    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Family name is required')).toBeDefined();
    });
  });

  it('shows password validation error', async () => {
    renderWithQuery(<Setup />);

    // Navigate to step 3
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Family Information')).toBeDefined();
    });

    // Fill family info
    const familyInput = screen.getByPlaceholderText('e.g., The Smith Family') as HTMLInputElement;
    fireEvent.change(familyInput, { target: { value: 'Test Family' } });

    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]);

    // Move to step 3
    await waitFor(() => {
      expect(screen.getByText('Admin Account')).toBeDefined();
    });

    // Enter short password
    const passwordInput = screen.getByPlaceholderText('At least 8 characters') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: '1234' } });

    const reviewButtons = screen.getAllByText('Review');
    fireEvent.click(reviewButtons[0]);

    // Should show password error
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    });
  });

  it('displays review summary before submission', async () => {
    renderWithQuery(<Setup />);

    // Navigate through all steps with valid data
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Family Information')).toBeDefined();
    });

    // Fill step 2
    const familyInput = screen.getByPlaceholderText('e.g., The Smith Family') as HTMLInputElement;
    fireEvent.change(familyInput, { target: { value: 'Smith Family' } });

    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]);

    // Fill step 3
    await waitFor(() => {
      expect(screen.getByText('Admin Account')).toBeDefined();
    });

    const emailInput = screen.getByPlaceholderText('your@email.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });

    const passwordInput = screen.getByPlaceholderText('At least 8 characters') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const reviewButtons = screen.getAllByText('Review');
    fireEvent.click(reviewButtons[0]);

    // Should show review step
    await waitFor(() => {
      expect(screen.getByText('Review Setup')).toBeDefined();
      expect(screen.getByText('Smith Family')).toBeDefined();
      expect(screen.getByText('admin@example.com')).toBeDefined();
    });
  });

  it('back button navigates to previous step', async () => {
    renderWithQuery(<Setup />);

    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Family Information')).toBeDefined();
    });

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should be back at welcome
    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeDefined();
    });
  });

  it('shows progress bar', () => {
    renderWithQuery(<Setup />);

    // Check for progress indicator
    expect(screen.getByText('Step 1 of 4')).toBeDefined();
  });
});
