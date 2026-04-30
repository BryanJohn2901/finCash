'use client';

import { StrictMode } from 'react';
import App from '@/components/App';
import EnvMissing from '@/components/EnvMissing';
import { AuthProvider } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Page() {
  return (
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
}
