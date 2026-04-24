// PURPOSE: PIN pad component for quick login
// ROLE: Frontend Components
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { useState } from 'react';

interface PINPadProps {
  onSubmit: (pin: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function PINPad({ onSubmit, disabled = false, error = '' }: PINPadProps) {
  const [pin, setPin] = useState('');
  const [displayPin, setDisplayPin] = useState('');

  const handleButtonClick = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
      setDisplayPin(displayPin + '●');
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setDisplayPin(displayPin.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
    }
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div>
      {/* Display area */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '2em',
          letterSpacing: '8px',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {displayPin || ''}
      </div>

      {/* Error message */}
      {error && <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}

      {/* PIN grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
        {buttons.map((digit) => (
          <button
            key={digit}
            onClick={() => handleButtonClick(digit)}
            disabled={disabled || pin.length >= 6}
            style={{
              padding: '15px',
              fontSize: '1.5em',
              fontWeight: 'bold',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: disabled || pin.length >= 6 ? 'not-allowed' : 'pointer',
              backgroundColor: 'white',
              opacity: disabled || pin.length >= 6 ? 0.5 : 1,
            }}
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {/* Backspace - full width on left */}
        <button
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          style={{
            padding: '15px',
            fontSize: '1.2em',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: disabled || pin.length === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: 'white',
            opacity: disabled || pin.length === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>

        {/* Empty space */}
        <div />

        {/* Submit - right side */}
        <button
          onClick={handleSubmit}
          disabled={disabled || pin.length < 4}
          style={{
            padding: '15px',
            fontSize: '1.2em',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: disabled || pin.length < 4 ? 'not-allowed' : 'pointer',
            backgroundColor: pin.length >= 4 && !disabled ? '#4f46e5' : '#ccc',
            color: 'white',
          }}
        >
          ✓ OK
        </button>
      </div>

      {/* Info text */}
      <p style={{ fontSize: '0.9em', color: '#666', marginTop: '15px', textAlign: 'center' }}>
        Enter 4-6 digit PIN
      </p>
    </div>
  );
}
