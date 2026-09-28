import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { X, Lock, Mail, ShieldAlert, CheckCircle2, User, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase keys are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
      );
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          setSuccessMsg('Account created successfully!');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 800);
        } else {
          setSuccessMsg('Registration submitted! Please check your email to confirm your account, then log in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          setSuccessMsg('Signed in successfully!');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-[#DCE2DE] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECE9] bg-[#F7F9F8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16232E] text-[#B9852A] flex items-center justify-center font-bold text-sm">
              SR
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#16232E]">
                {mode === 'signin' ? 'Sign In to School Register' : 'Create Teacher / Admin Account'}
              </h2>
              <p className="text-xs text-[#5B6B78]">
                {mode === 'signin'
                  ? 'Access your cloud-synced school records'
                  : 'Start storing and retrieving class data securely'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#788896] hover:text-[#16232E] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Notice if Supabase keys missing */}
        {!isSupabaseConfigured && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Supabase Connection Required</span>
              To enable cloud login and persistence, set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> in your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> file.
            </div>
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-[#E8ECE9] px-6 mt-2">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              mode === 'signin'
                ? 'border-[#B9852A] text-[#16232E]'
                : 'border-transparent text-[#788896] hover:text-[#16232E]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-[#B9852A] text-[#16232E]'
                : 'border-transparent text-[#788896] hover:text-[#16232E]'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#16232E] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#788896] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#DCE2DE] rounded-lg focus:outline-none focus:border-[#16232E] focus:ring-1 focus:ring-[#16232E] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#16232E] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#788896] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#DCE2DE] rounded-lg focus:outline-none focus:border-[#16232E] focus:ring-1 focus:ring-[#16232E] transition-all"
              />
            </div>
            {mode === 'signup' && (
              <span className="text-[11px] text-[#788896] mt-1 block">
                Minimum 6 characters
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#16232E] hover:bg-[#203140] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Connecting to Supabase...</span>
            ) : mode === 'signin' ? (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 text-[#B9852A]" />
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 text-[#B9852A]" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#788896] hover:text-[#16232E] underline"
            >
              Continue in Guest / Offline Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
