import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col font-sans">
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-radial-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            No AI Hallucinations • 100% Deterministic Cutoff Records
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Find your college.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Know its reality.
            </span>{' '}
            Connect with its students.{' '}
            <span className="underline decoration-indigo-400 decoration-wavy decoration-2">
              Choose confidently.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop guessing your future across outdated PDF brochures and unverified Reddit threads.
            CollegeConnect maps your exact rank to official counseling cutoffs and connects you 1-on-1 with verified seniors.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              Get Started for Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/admissions"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-xs"
            >
              Explore Cutoff Engine
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> JoSAA & CSAB Verified Cutoffs
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> 100% Anonymous Communication
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span> Peer-to-Peer State Machine
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Why CollegeConnect Exists
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              The college discovery process is fundamentally broken.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                The Broken Status Quo
              </h3>
              <ul className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  Jumping across messy PDF tables of JoSAA/CSAB cutoffs without clarity on quota, branch, or category shifts.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  Scouring Reddit, Quora, and YouTube where reviews are outdated, promotional, or written by people who never studied there.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  Chaotic WhatsApp/Telegram groups where genuine questions get lost in spam and unwanted personal DMs.
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold mb-4">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                The CollegeConnect Paradigm
              </h3>
              <ul className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <strong>Deterministic Feasibility Engine:</strong> Instant mathematical evaluation against verified historical closing ranks.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <strong>Verified Senior Cohorts:</strong> Questions routed directly to verified students in your specific target institution and branch.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <strong>Ticket State Machine & Privacy:</strong> Handled as private support tickets with guaranteed anonymity on both sides.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              How It Works
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              Three steps from rank to real insight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs mb-4">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Enter Your Rank & Category
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Filter cutoffs by exam (JEE Advanced / JEE Main), category (OPEN, EWS, OBC-NCL, SC, ST), and quota without biased algorithms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs mb-4">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Discover Feasible Programs
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Review opening/closing ranks, calculated safety margins, and feasibility status (Safe, Competitive, Borderline).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs mb-4">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Ask a Verified Senior
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Submit private inquiry tickets about hostel life, professors, coding culture, and placement realities with mutual anonymity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to find where you truly belong?
          </h2>
          <p className="mt-3 text-sm text-indigo-200 max-w-xl mx-auto">
            Join thousands of prospective college students getting unfiltered answers from verified seniors.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-8 py-3.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
