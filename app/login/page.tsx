import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setDemoSession } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ redirectedFrom?: string }> | { redirectedFrom?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const redirectedFrom = resolvedSearchParams?.redirectedFrom;

  // Server Action for Applicant Demo
  async function loginAsApplicant() {
    'use server';
    await setDemoSession('applicant');
    redirect(redirectedFrom || '/admissions');
  }

  // Server Action for Senior Mentor Demo
  async function loginAsSenior() {
    'use server';
    await setDemoSession('student');
    redirect(redirectedFrom || '/inbox');
  }

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

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Zero-Cloud SQLite • Hackathon Demo Mode
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Select Your Demo Persona
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          One-click instant login with hardcoded SQLite test sessions. No credentials or external networks required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          {/* Persona 1: Applicant */}
          <form action={loginAsApplicant}>
            <button
              type="submit"
              className="w-full text-left p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    🎓
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      Demo as College Applicant
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      User: <strong>Rahul Sharma</strong> • Target: JEE Rank 120
                    </p>
                  </div>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 border-t border-indigo-100 dark:border-indigo-900/40 pt-2.5">
                Explore cutoff shortlists, evaluate margins, and ask anonymous questions to campus seniors.
              </div>
            </button>
          </form>

          {/* Persona 2: Verified Senior Mentor */}
          <form action={loginAsSenior}>
            <button
              type="submit"
              className="w-full text-left p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    🏛️
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      Demo as Verified Senior
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      User: <strong>Aman Verma</strong> • IIT Bombay CSE 3rd Year
                    </p>
                  </div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 border-t border-emerald-100 dark:border-emerald-900/40 pt-2.5">
                Access the Senior Inbox, claim pending inquiry tickets, and reply anonymously to juniors.
              </div>
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Powered by local SQLite (`database.sqlite`) • Zero network round-trips
        </div>
      </div>
    </div>
  );
}
