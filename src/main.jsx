import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import EnvMissing from './EnvMissing.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { isSupabaseConfigured } from './lib/supabase.js';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <EnvMissing />
    )}
  </StrictMode>
);
