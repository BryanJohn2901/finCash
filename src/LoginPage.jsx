import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirm) {
        setError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email.trim(), password);
        if (err) {
          setError(err.message);
          return;
        }
      } else {
        const { data, error: err } = await signUp(email.trim(), password);
        if (err) {
          setError(err.message);
          return;
        }
        if (data?.session) {
          setMessage('Conta criada. Você já pode usar o app.');
        } else {
          setMessage(
            'Conta criada. Se o projeto exigir confirmação por e-mail, verifique sua caixa de entrada antes de entrar.'
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden>
          👛
        </div>
        <h1 className="auth-title">finCash</h1>
        <p className="auth-sub">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
              setMessage(null);
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
              setMessage(null);
            }}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="auth-email">
            E-mail
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="auth-field"
          />

          <label className="auth-label" htmlFor="auth-password">
            Senha
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            className="auth-field"
            style={{ marginBottom: mode === 'register' ? 12 : 16 }}
          />

          {mode === 'register' && (
            <>
              <label className="auth-label" htmlFor="auth-confirm">
                Confirmar senha
              </label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                className="auth-field"
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          {error && <p className="auth-msg-error">{error}</p>}
          {message && <p className="auth-msg-success">{message}</p>}

          <button type="submit" disabled={busy} className="auth-submit">
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
