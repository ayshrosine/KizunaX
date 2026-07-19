import React, { useState } from 'react';
import { apiClient } from '../api';
import '../styles.css';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response =
        mode === 'login'
          ? await apiClient.login(email, password)
          : await apiClient.register(email, password, fullName);
      apiClient.setToken(response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin();
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? 'Invalid credentials' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div className="login-card kx-fade-in">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">K</div>
          <h2>KizunaX</h2>
          <p>
            {mode === 'login'
              ? 'Your AI-powered identity vault'
              : 'Create your secure identity vault'}
          </p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="login-field">
              <label className="kx-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="kx-input"
              />
            </div>
          )}

          <div className="login-field">
            <label className="kx-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
              className="kx-input"
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label className="kx-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="kx-input"
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="kx-alert kx-alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="kx-btn kx-btn-primary kx-btn-lg login-submit"
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="kx-spinner" style={{ width: '18px', height: '18px', marginBottom: 0 }} />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="login-footer">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <span className="link" onClick={() => { setMode('register'); setError(null); }}>
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="link" onClick={() => { setMode('login'); setError(null); }}>
                Sign in
              </span>
            </>
          )}
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--kx-border)',
          }}
        >
          {['🤖 AI Categorization', '🔒 Multi-tenant', '☁️ Cloud Mirror'].map((tag) => (
            <span key={tag} className="kx-tag" style={{ fontSize: '0.6875rem' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
