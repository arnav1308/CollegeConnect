'use client';

import { useState, useEffect, Suspense, type FormEvent } from 'react';
import Link from 'next/link';

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      if (res.status === 404) {
        throw new Error('404 Error: The API route is missing. Dev server restarting.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectedFrom = searchParams?.get('redirectedFrom');

      let destination = data.redirectTo || '/admissions';
      if (data.user?.role === 'applicant') {
        destination = redirectedFrom && redirectedFrom !== '/inbox' ? redirectedFrom : '/admissions';
      } else if (data.user?.role === 'student') {
        destination = '/inbox';
      }

      window.location.href = destination;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      const urlPassword = params.get('password');
      const urlError = params.get('error');

      if (urlError) {
        setError(urlError);
        window.history.replaceState({}, '', '/login');
      } else if (urlEmail && urlPassword) {
        window.history.replaceState({}, '', '/login');
        setEmail(urlEmail);
        setPassword(urlPassword);
        executeLogin(urlEmail, urlPassword);
      }
    }
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    const emailEl = form.elements.namedItem('email') as HTMLInputElement | null;
    const passwordEl = form.elements.namedItem('password') as HTMLInputElement | null;
    const submitEmail = (emailEl?.value || email || '').trim();
    const submitPassword = passwordEl?.value || password || '';

    if (!submitEmail || !submitPassword) {
      setError('Please enter both your email and password.');
      return;
    }

    await executeLogin(submitEmail, submitPassword);
  };

  const handleQuickLogin = async (loginEmail: string, loginPass = 'password123') => {
    setEmail(loginEmail);
    setPassword(loginPass);
    await executeLogin(loginEmail, loginPass);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {error && (
        <div className="p-4 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md flex items-start gap-2.5">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Instant 1-Click Login
        </label>
        <div className="space-y-2 text-xs">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickLogin('nandchahal.arnav@gmail.com', 'Hans@3481')}
            className="w-full p-3.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-left transition-all cursor-pointer group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                🎓 Arnav Nandchahal (Your Account)
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                Sign In & Enter →
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              nandchahal.arnav@gmail.com • Opens Admissions Shortlist
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin('applicant@collegeconnect.com', 'password123')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40 text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Rahul Sharma</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">Demo →</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Applicant Persona</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin('senior@iitb.ac.in', 'password123')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40 text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Aman Verma</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">Demo →</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">IITB Senior Persona</div>
            </button>
          </div>
        </div>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
            Or Sign In With Email & Password
          </span>
        </div>
      </div>

      <form action="/api/auth/login" method="POST" onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@college.edu or name@example.com"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In to CollegeConnect'
          )}
        </button>
      </form>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
            Need an account?
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/register/applicant"
          className="w-full block text-left p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                🎓
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Register as College Applicant
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Shortlist dream colleges & ask seniors questions
                </p>
              </div>
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
              Start →
            </span>
          </div>
        </Link>

        <Link
          href="/register/senior"
          className="w-full block text-left p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                🏛️
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Register as Verified Senior (Campus ID Verification)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant campus ID verification for student mentors
                </p>
              </div>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
              Verify →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            CC
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            CollegeConnect
          </span>
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Verified Student Network • Secure Sessions
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Sign In to Your Account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Sign in to access your admissions recommendations or mentor inquiry tickets.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <Suspense fallback={<div className="text-center p-8 text-slate-500 text-sm">Loading login...</div>}>
          <LoginFormContent />
        </Suspense>

        <div className="mt-6 text-center text-xs text-slate-400">
          Official JoSAA & CSAB Counseling Cutoffs • Privacy-First Student Conversations
        </div>
      </div>
    </div>
  );
}
