// PURPOSE: Dashboard page placeholder
// ROLE: Frontend Pages
// MODIFIED: 2026-04-24 — Phase 1.1 setup

import { useAuthStore } from '../stores/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      {user ? (
        <p>Welcome, {user.username}!</p>
      ) : (
        <p>Please log in to see your dashboard.</p>
      )}
      <p>Dashboard implementation coming in Phase 1.2</p>
    </div>
  );
}
