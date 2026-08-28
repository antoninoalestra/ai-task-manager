// components/AuthModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { User, X, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-opacity">
      {/* Backdrop overlay clickable */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-[#131722] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[85dvh] sm:max-h-[90vh] flex flex-col z-10 animate-slide-up-sheet sm:animate-none">
        
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-slate-600/80 rounded-full" />
        </div>

        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#090a0f]/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200">
              {mode === 'login' ? 'Accedi al tuo Profilo' : 'Crea nuovo Profilo'}
            </h2>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher Accedi / Registrati */}
        <div className="p-1 mx-5 mt-4 bg-[#1b2130] border border-white/10 rounded-xl flex items-center shrink-0">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[38px] touch-manipulation active:scale-95 ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[38px] touch-manipulation active:scale-95 ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {mode === 'register' && (
            <div>
              <label className="block mb-1 font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. marco_rossi"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#1b2130] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-xs"
              />
            </div>
          )}

          <div>
            <label className="block mb-1 font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              {mode === 'login' ? 'Email o Username *' : 'Email *'}
            </label>
            <input
              type={mode === 'register' ? 'email' : 'text'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'register' ? 'nome@esempio.it' : 'Username o email...'}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#1b2130] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#1b2130] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-xs"
            />
          </div>

          <div className="pb-safe pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50 text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'login' ? 'Accedi' : 'Crea Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
