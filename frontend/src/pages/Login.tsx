// PURPOSE: Family member login page with PIN and password options
// ROLE: Frontend Pages
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PINPad from '../components/PINPad';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  pin_hash?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // Fetch family members
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/users');
        return response.data.users;
      } catch (err) {
        return [];
      }
    },
    retry: false,
  });

  // Countdown lockout timer
  useEffect(() => {
    if (!lockoutTime) return;

    const interval = setInterval(() => {
      setLockoutTime((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setError('');
    setPassword('');
    setFailedAttempts(0);
  };

  const handlePINSubmit = async (pin: string) => {
    if (!selectedUser) return;

    if (lockoutTime) {
      setError(`Too many attempts. Try again in ${lockoutTime}s`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login/pin', {
        user_id: selectedUser.id,
        pin,
      });

      const { access_token, refresh_token, user } = response.data;
      setTokens(access_token, refresh_token);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setFailedAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 5) {
          setLockoutTime(60);
        }
        return newAttempts;
      });
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (lockoutTime) {
      setError(`Too many attempts. Try again in ${lockoutTime}s`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: selectedUser.email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;
      setTokens(access_token, refresh_token);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setFailedAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 5) {
          setLockoutTime(60);
        }
        return newAttempts;
      });
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (usersLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // User selection screen
  if (!selectedUser) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Select your family member account</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px' }}>
          {usersData && usersData.length > 0 ? (
            usersData.map((user: User) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                style={{
                  padding: '20px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#4f46e5';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f5f3ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2em',
                      fontWeight: 'bold',
                      margin: '0 auto 10px',
                    }}
                  >
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', fontSize: '1em' }}>
                  {user.display_name}
                </p>
              </button>
            ))
          ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>No family members found</p>
          )}
        </div>
      </div>
    );
  }

  // PIN or password entry screen
  const usesPIN = selectedUser && !!selectedUser.pin_hash;

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <button
        onClick={() => setSelectedUser(null)}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 12px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '30px',
        }}
      >
        ← Change User
      </button>

      <h1 style={{ marginBottom: '10px' }}>Welcome, {selectedUser.display_name}</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {usesPIN ? 'Enter your PIN' : 'Enter your password'}
      </p>

      {usesPIN ? (
        <PINPad onSubmit={handlePINSubmit} disabled={loading || !!lockoutTime} error={error} />
      ) : (
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !!lockoutTime}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box',
                opacity: loading || lockoutTime ? 0.5 : 1,
              }}
            />
          </div>

          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

          {failedAttempts > 0 && !lockoutTime && (
            <p style={{ color: '#ff9800', marginBottom: '15px', fontSize: '0.9em' }}>
              {5 - failedAttempts} attempts remaining
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !!lockoutTime}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || lockoutTime ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              opacity: loading || lockoutTime ? 0.5 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  );
}
