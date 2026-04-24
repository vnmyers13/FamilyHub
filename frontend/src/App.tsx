// PURPOSE: Root React component for FamilyHub
// ROLE: Frontend
// MODIFIED: 2026-04-24 — Phase 1.1 setup

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './api/client';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Setup from './pages/Setup';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
