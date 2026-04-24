// PURPOSE: MSW server setup for API mocking in tests
// ROLE: Frontend Testing
// MODIFIED: 2026-04-23 — Phase 0 test infrastructure setup

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
