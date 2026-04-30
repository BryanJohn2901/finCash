'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import FinanceApp from '@/components/FinanceApp';
import LoginPage from '@/components/LoginPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" aria-hidden />
        <p>Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <FinanceApp />;
}
