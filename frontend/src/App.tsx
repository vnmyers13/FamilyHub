// PURPOSE: Root React component for FamilyHub
// ROLE: Frontend
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient, { axiosInstance } from './api/client';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Setup from './pages/Setup';

function AppRoutes({ setupRequired }: { setupRequired: boolean }) {
  if (setupRequired) {
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  const [setupRequired, setSetupRequired] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axiosInstance.get('/auth/setup/status');
        setSetupRequired(!response.data.setup_complete);
      } catch (err) {
        // If error, assume setup is required
        setSetupRequired(true);
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes setupRequired={setupRequired} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
