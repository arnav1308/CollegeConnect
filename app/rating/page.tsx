'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RatingParamConfig {
  key: string;
  label: string;
  category: string;
  description: string;
  icon: string;
}

const RATING_PARAMETERS: RatingParamConfig[] = [
  {
    key: 'academics',
    label: 'Academics & Curriculum',
    category: 'Academics & Career',
    description: 'Course relevance, syllabus depth, exam fairness, and research opportunities.',
    icon: '📚',
  },
  {
    key: 'faculty',
    label: 'Faculty & Mentorship',
    category: 'Academics & Career',
    description: 'Professor accessibility, pedagogical quality, and academic guidance.',
    icon: '👨‍🏫',
  },
  {
    key: 'placements',
    label: 'Placements & Packages',
    category: 'Academics & Career',
    description: 'Company visitation, median packages, and career development support.',
    icon: '💼',
  },
  {
    key: 'internships',
    label: 'Internship Opportunities',
    category: 'Academics & Career',
    description: 'Summer internships, industrial training ties, and research stipends.',
    icon: '🚀',
  },

  {
    key: 'coding_culture',
    label: 'Coding & Tech Culture',
    category: 'Campus Culture',
    description: 'Competitive programming, open-source communities, and hackathon presence.',
    icon: '💻',
  },
  {
    key: 'peer_group',
    label: 'Peer Group & Network',
    category: 'Campus Culture',
    description: 'Talent density, batch drive, alumni network strength, and collaboration.',
    icon: '🤝',
  },
  {
    key: 'campus_life',
    label: 'Campus Life & Vibe',
    category: 'Campus Culture',
    description: 'Day-to-day vibrant energy, social freedom, and holistic environment.',
    icon: '✨',
  },
  {
    key: 'clubs',
    label: 'Clubs & Societies',
    category: 'Campus Culture',
    description: 'Active student clubs covering tech, arts, debate, robotics, and social causes.',
    icon: '🎭',
  },
  {
    key: 'fests',
    label: 'Annual Fests & Events',
    category: 'Campus Culture',
    description: 'Scale, budget, celebrity nights, and student autonomy in organizing fests.',
    icon: '🎉',
  },
  {
    key: 'sports',
    label: 'Sports & Fitness',
    category: 'Campus Culture',
    description: 'Sports grounds, gymnasium equipment, swimming pools, and inter-college meets.',
    icon: '⚽',
  },

  {
    key: 'infrastructure',
    label: 'Campus Infrastructure',
    category: 'Living & Facilities',
    description: 'Air-conditioned lecture halls, modern computing labs, library, and Wi-Fi.',
    icon: '🏛️',
  },
  {
    key: 'hostel',
    label: 'Hostel Accommodation',
    category: 'Living & Facilities',
    description: 'Room cleanliness, occupancy ratios, washroom maintenance, and electricity.',
    icon: '🛏️',
  },
  {
    key: 'mess',
    label: 'Mess & Food Hygiene',
    category: 'Living & Facilities',
    description: 'Nutritional balance, dietary variety, canteen availability, and food safety.',
    icon: '🍲',
  },
  {
    key: 'location',
    label: 'Location & Connectivity',
    category: 'Living & Facilities',
    description: 'Proximity to metro/airports, tech hubs, city recreation, and travel ease.',
    icon: '📍',
  },
  {
    key: 'safety',
    label: 'Campus Safety & Health',
    category: 'Living & Facilities',
    description: '24/7 security surveillance, women safety policies, and on-campus medical center.',
    icon: '🛡️',
  },

  {
    key: 'administration',
    label: 'Administration & Governance',
    category: 'Governance & Value',
    description: 'Bureaucracy levels, student redressal, transparency, and responsiveness.',
    icon: '⚖️',
  },
  {
    key: 'fees',
    label: 'Value for Money / Fees',
    category: 'Governance & Value',
    description: 'Tuition and living fee ROI relative to learning and placement returns.',
    icon: '💰',
  },
  {
    key: 'overall',
    label: 'Overall College Satisfaction',
    category: 'Governance & Value',
    description: 'Your holistic retrospective endorsement of choosing this college.',
    icon: '⭐',
  },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor (1)',
  2: 'Below Avg (2)',
  3: 'Average (3)',
  4: 'Good (4)',
  5: 'Exceptional (5)',
};

export default function SeniorRatingPage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [collegeName, setCollegeName] = useState<string>('Your University');
  const [seniorName, setSeniorName] = useState<string>('Verified Senior');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    async function fetchSeniorProfile() {
      try {
        const res = await fetch('/api/ratings');
        if (res.ok) {
          const data = await res.json();
          if (data.college) setCollegeName(data.college);
          if (data.displayName) setSeniorName(data.displayName);
          if (data.ratings) {
            const existing: Record<string, number> = {};
            for (const param of RATING_PARAMETERS) {
              if (data.ratings[param.key]) {
                existing[param.key] = Number(data.ratings[param.key]);
              }
            }
            setRatings(existing);
          }
        }
      } catch {
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchSeniorProfile();
  }, []);

  const handleSelectRating = (paramKey: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [paramKey]: score,
    }));
    setError(null);
  };

  const completedCount = Object.keys(ratings).filter((k) => ratings[k] >= 1 && ratings[k] <= 5).length;
  const isAllCompleted = completedCount === RATING_PARAMETERS.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllCompleted) {
      setError(`Please complete all 18 parameters before submitting. (${completedCount}/${RATING_PARAMETERS.length} completed)`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college: collegeName,
          ...ratings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ratings.');
      }

      setSuccess('Ratings submitted successfully! Redirecting to Senior Inbox...');
      setTimeout(() => {
        window.location.href = data.redirectTo || '/inbox';
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const categories = Array.from(new Set(RATING_PARAMETERS.map((p) => p.category)));

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading verified rating portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Verified Senior Review Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Rate Your Campus Experience
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                You are reviewing <span className="font-bold text-slate-900 dark:text-white">{collegeName}</span> as <span className="font-semibold text-emerald-600 dark:text-emerald-400">{seniorName}</span>. Your evaluations are cryptographically authenticated and aggregated to guide aspiring applicants.
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Progress
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {completedCount} <span className="text-sm font-semibold text-slate-400">/ 18</span>
              </div>
              <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / 18) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md flex items-start gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 leading-snug">{error}</div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 leading-snug">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {categories.map((cat) => {
            const paramsInCat = RATING_PARAMETERS.filter((p) => p.category === cat);

            return (
              <div
                key={cat}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{cat}</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  {paramsInCat.map((param) => {
                    const currentScore = ratings[param.key] || 0;

                    return (
                      <div
                        key={param.key}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{param.icon}</span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {param.label}
                            </span>
                            {currentScore > 0 && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                {currentScore}/5
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {param.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const isSelected = currentScore === score;

                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => handleSelectRating(param.key, score)}
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-500/40'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                                }`}
                                title={RATING_LABELS[score]}
                              >
                                <span>{score}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="sticky bottom-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {isAllCompleted ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All 18 parameters rated. Ready to submit!
                </span>
              ) : (
                <span>
                  Please complete the remaining <strong className="text-slate-900 dark:text-white">{18 - completedCount}</strong> parameters to enable submission.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/inbox"
                className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                Skip for now →
              </Link>

              <button
                type="submit"
                disabled={!isAllCompleted || isSubmitting}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Submitting ratings...</span>
                  </>
                ) : (
                  'Submit Ratings & Go to Inbox →'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

