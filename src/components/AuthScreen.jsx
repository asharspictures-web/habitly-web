import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function AuthScreen({ onSignIn, onSignUp, onGoogleSignIn }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    const result = mode === 'signin'
      ? await onSignIn(email, password)
      : await onSignUp(email, password, fullName);

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error.message || 'Something went wrong. Please try again.');
      return;
    }

    if (mode === 'signup') {
      setNotice('Account created! Check your email to confirm, or sign in now if confirmation is disabled.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="Habitly Logo"
            className="w-14 h-14 rounded-2xl object-cover border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.25)] mb-4"
          />
          <h1 className="text-2xl font-black text-white">Habitly</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {mode === 'signin' ? 'Welcome back — sign in to continue' : 'Create your account'}
          </p>
        </div>

        <div className="flex bg-[#09090b] border border-[#27272a] rounded-2xl p-1.5 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setNotice(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${mode === 'signin' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setNotice(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${mode === 'signup' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-[#09090b] border border-[#27272a] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#09090b] border border-[#27272a] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#09090b] border border-[#27272a] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
          {notice && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{notice}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-[11px] text-zinc-600 text-center mt-6">
          Your data stays tied to your account, not this device.
        </p>
      </div>
    </div>
  );
}
