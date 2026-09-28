import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase';
import { Mail, Lock, ArrowRight, ShieldCheck, Database, GraduationCap, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onContinueGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onContinueGuest,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not properly configured. Check your .env configuration.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session?.user) {
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            onLoginSuccess(data.session?.user);
          }, 600);
        } else {
          setSuccessMsg(
            'Account registration submitted! If confirmation is required, check your email inbox to verify before signing in.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          setSuccessMsg('Signed in successfully! Loading your classes...');
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 400);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4 animate-fade">
      <div className="w-full max-w-md bg-white border border-[#DCE2DE] rounded-2xl shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#16232E] text-white p-7 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#B9852A]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="w-13 h-13 mx-auto mb-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#B9852A] shadow-inner">
            <GraduationCap className="w-7 h-7" />
          </div>

          <h2 className="font-serif-title font-semibold text-2xl text-white tracking-tight">
            School Register
          </h2>
          <p className="text-xs text-[#93A0AA] mt-1">
            Teacher Gradebook &amp; Exam Intelligence System
          </p>

          {/* Database connection badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-tag bg-white/10 text-emerald-300 border border-white/15">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud DB Active</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E8ECE9] bg-[#FAFBF9]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'border-[#B9852A] text-[#16232E] bg-white'
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
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-[#B9852A] text-[#16232E] bg-white'
                : 'border-transparent text-[#788896] hover:text-[#16232E]'
            }`}
          >
            Create Teacher Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#DCE2DE] rounded-lg focus:outline-none focus:border-[#16232E] focus:ring-1 focus:ring-[#16232E] transition-all bg-[#FAFBF9] focus:bg-white"
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
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#DCE2DE] rounded-lg focus:outline-none focus:border-[#16232E] focus:ring-1 focus:ring-[#16232E] transition-all bg-[#FAFBF9] focus:bg-white"
              />
            </div>
            {mode === 'signup' && (
              <span className="text-[11px] text-[#788896] mt-1 block">
                At least 6 characters
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#16232E] hover:bg-[#203140] text-white text-xs font-semibold tracking-wide uppercase rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Connecting to Database...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In &amp; Sync Records</span>
                <ArrowRight className="w-4 h-4 text-[#B9852A]" />
              </>
            ) : (
              <>
                <span>Register &amp; Create Database</span>
                <ArrowRight className="w-4 h-4 text-[#B9852A]" />
              </>
            )}
          </button>

          {/* Guest / Demo Option */}
          <div className="pt-3 border-t border-[#E8ECE9] text-center">
            <button
              type="button"
              onClick={onContinueGuest}
              className="text-xs text-[#5B6B78] hover:text-[#16232E] font-medium underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Continue in Guest Mode (Offline / Sample Data)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
