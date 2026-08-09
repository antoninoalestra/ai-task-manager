// components/AuthModal.jsx
'use client';

import { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { identifier: email || username, password }
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Autenticazione fallita');
      }

      if (data.user) {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#111520] border border-[#1e2638] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header Modal Minimal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2638] bg-[#0b0d14]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-300 stroke-current" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
              <circle cx="12" cy="7" r="4" strokeWidth="2"/>
            </svg>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-white">
              {mode === 'login' ? 'Accedi al tuo Profilo' : 'Crea nuovo Profilo'}
            </h2>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tab Switcher Accedi / Registrati */}
        <div className="p-1.5 m-6 mb-2 bg-[#0e111a] border border-[#1e2638] rounded-xl flex items-center">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-2 p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 stroke-current shrink-0 text-red-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. marco_rossi"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
              />
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              {mode === 'login' ? 'Email o Username *' : 'Email *'}
            </label>
            <input
              type={mode === 'register' ? 'email' : 'text'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'register' ? 'nome@esempio.it' : 'Username o email...'}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-300 uppercase tracking-wider text-[10px]">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e111a] border border-[#1e2638] text-white placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 disabled:opacity-50 text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
            <span>{mode === 'login' ? 'Accedi' : 'Crea Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
