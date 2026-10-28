import type { Metadata } from 'next';
import Link from 'next/link';
import { getDemoSession } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'CollegeConnect • Student-Powered College Discovery',
  description:
    'Find your college. Know its reality. Connect with its students. Choose confidently.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDemoSession();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
        {/* Sole Authoritative Navigation Header */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  CC
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  College<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Link
                  href="/admissions"
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Admissions Shortlist
                </Link>
                {session?.role === 'student' && session?.verified_status && (
                  <Link
                    href="/inbox"
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Senior Inbox
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {session.displayName}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {session.role}
                    </span>
                  </div>

                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Switch Persona
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                  >
                    Demo Personas
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
