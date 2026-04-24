// PURPOSE: Setup wizard page placeholder
// ROLE: Frontend Pages
// MODIFIED: 2026-04-24 — Phase 1.1 setup

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Setup() {
  const navigate = useNavigate();
  const [familyName, setFamilyName] = useState('');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // API call will be implemented in Phase 1.2
      console.log('Setup:', { familyName, timezone, adminEmail });
      // navigate('/dashboard');
    } catch (err) {
      console.error('Setup failed:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Welcome to FamilyHub</h1>
      <p>Let's set up your family account</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="familyName">Family Name:</label>
          <input
            id="familyName"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g., The Smith Family"
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="timezone">Timezone:</label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Paris">Europe/Paris</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="adminEmail">Admin Email:</label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="adminPassword">Password:</label>
          <input
            id="adminPassword"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit">Complete Setup</button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        Setup implementation coming in Phase 1.2
      </p>
    </div>
  );
}
