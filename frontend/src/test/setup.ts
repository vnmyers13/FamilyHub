// PURPOSE: Vitest setup and global configuration
// ROLE: Frontend Testing
// MODIFIED: 2026-04-23 — Phase 0 test infrastructure setup

import '@testing-library/jest-dom';
import { server } from '../api/msw/server';
import { expect, afterAll, afterEach, beforeAll, vi } from 'vitest';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Suppress console errors in tests (optional)
vi.spyOn(console, 'error').mockImplementation(() => {});
