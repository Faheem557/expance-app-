/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Beautiful Login / Register page — glass morphism dark theme.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, token, isAuthLoading, authError, clearAuthError } = useAuthContext();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Already authenticated — go to dashboard
  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearAuthError();

    if (mode === 'register' && name.trim().length < 2) {
      setLocalError('Name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    const ok =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

    if (ok) navigate('/', { replace: true });
  };

  const errorMsg = localError || authError;

  const features = [
    { icon: '🏦', title: 'Multi-Bank Sync', desc: 'Connect all your accounts in one place' },
    { icon: '📊', title: 'Real-Time Budgets', desc: 'Track spending limits as you go' },
    { icon: '🎯', title: 'Savings Goals', desc: 'Set targets and watch progress grow' },
    { icon: '🤝', title: 'Loan Tracker', desc: 'Manage money lent and borrowed' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              💰
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Real-Time Budget Sync</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Your personal finance command centre</p>
        </div>

        <div className="space-y-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold">{f.title}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Real-Time Budget Sync · Apache-2.0
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>💰</div>
            <span className="text-white font-bold text-xl">Budget Sync</span>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <h1 className="text-white text-2xl font-bold mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {mode === 'login' ? 'Sign in to your financial dashboard' : 'Start managing your finances today'}
            </p>

            {/* Toggle */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setLocalError(''); clearAuthError(); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize"
                  style={{
                    background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                  onFocus={e => (e.target.style.borderColor = '#6366f1')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 mt-2"
                style={{
                  background: isAuthLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isAuthLoading ? 'none' : '0 4px 24px rgba(99,102,241,0.4)',
                }}
              >
                {isAuthLoading
                  ? '⏳ Please wait...'
                  : mode === 'login'
                  ? '→ Sign In'
                  : '→ Create Account'}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setLocalError(''); clearAuthError(); }}
                className="font-medium"
                style={{ color: '#818cf8' }}
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
