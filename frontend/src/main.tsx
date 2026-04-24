// PURPOSE: React application entry point
// ROLE: Frontend
// MODIFIED: 2026-04-24 — Phase 1.1 setup

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
