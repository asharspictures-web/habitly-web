import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

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

  const handleGoogle = async () => {
    setError('');
    const result = await onGoogleSignIn();
    if (result?.error) {
      setError(result.error.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <Dumbbell className="text-red-500" size={28} />
          </div>
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

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-[#27272a]" />
          <span className="px-3 text-xs text-zinc-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#27272a]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-[11px] text-zinc-600 text-center mt-6">
          Your data stays tied to your account, not this device.
        </p>
      </div>
    </div>
  );
}
