// PURPOSE: Setup wizard for first-time family creation
// ROLE: Frontend Pages
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../api/client';
import { useAuthStore } from '../stores/authStore';

type SetupStep = 1 | 2 | 3 | 4;

export default function SetupWizard() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const [step, setStep] = useState<SetupStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Welcome
  // Step 2: Family details
  const [familyName, setFamilyName] = useState('');
  const [timezone, setTimezone] = useState('America/Chicago');

  // Step 3: Admin account
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Step 4: Summary
  const [submitted, setSubmitted] = useState(false);

  const validateStep = (currentStep: SetupStep): boolean => {
    setError('');

    if (currentStep === 2) {
      if (!familyName.trim()) {
        setError('Family name is required');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (!adminEmail.trim() || !adminEmail.includes('@')) {
        setError('Valid email is required');
        return false;
      }
      if (adminPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return false;
      }
      setPasswordError('');
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep((step + 1) as SetupStep);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as SetupStep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/setup', {
        family_name: familyName,
        timezone,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });

      const { access_token, refresh_token, user } = response.data;
      setTokens(access_token, refresh_token);
      setUser(user);
      setSubmitted(true);

      // Navigate to dashboard after brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Progress bar */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px' }}>
          Step {step} of 4
        </div>
        <div style={{ height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / 4) * 100}%`,
              backgroundColor: '#4f46e5',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div>
          <h1 style={{ marginBottom: '10px' }}>Welcome to FamilyHub</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            A family organization system with calendar sync, task management, and photo sharing.
          </p>
          <p style={{ marginBottom: '20px' }}>Let's set up your family account in just a few steps.</p>
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1em',
            }}
          >
            Get Started
          </button>
        </div>
      )}

      {/* Step 2: Family details */}
      {step === 2 && (
        <div>
          <h1 style={{ marginBottom: '20px' }}>Family Information</h1>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="familyName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Family Name *
            </label>
            <input
              id="familyName"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smith Family"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="timezone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Timezone *
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box',
              }}
            >
              <option value="America/Chicago">America/Chicago (Central)</option>
              <option value="America/New_York">America/New_York (Eastern)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
              <option value="America/Denver">America/Denver (Mountain)</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>
          </div>

          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Admin account */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <h1 style={{ marginBottom: '20px' }}>Admin Account</h1>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Create your admin account to manage the family setup.
          </p>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="adminEmail" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email Address *
            </label>
            <input
              id="adminEmail"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="adminPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password *
            </label>
            <input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="At least 8 characters"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box',
              }}
            />
            {passwordError && <p style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>{passwordError}</p>}
          </div>

          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Review
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Summary & Confirm */}
      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <h1 style={{ marginBottom: '20px' }}>Review Setup</h1>

          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '0.9em' }}>Family Name</p>
              <p style={{ margin: '0', fontSize: '1.1em', fontWeight: 'bold' }}>{familyName}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '0.9em' }}>Timezone</p>
              <p style={{ margin: '0', fontSize: '1.1em', fontWeight: 'bold' }}>{timezone}</p>
            </div>

            <div>
              <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '0.9em' }}>Admin Email</p>
              <p style={{ margin: '0', fontSize: '1.1em', fontWeight: 'bold' }}>{adminEmail}</p>
            </div>
          </div>

          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || submitted}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || submitted ? 'not-allowed' : 'pointer',
                opacity: loading || submitted ? 0.5 : 1,
              }}
            >
              {loading ? 'Setting up...' : submitted ? 'Done!' : 'Create Family'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
