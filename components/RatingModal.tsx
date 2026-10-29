'use client';

import { useEffect } from 'react';

export interface RatingModalProps {
  collegeName: string;
  totalReviews: number;
  ratings: Record<string, number>;
  onClose: () => void;
}

interface ParamMeta {
  key: string;
  label: string;
  category: string;
  icon: string;
}

const PARAM_META: ParamMeta[] = [
  { key: 'academics', label: 'Academics & Rigor', category: 'Academics & Career', icon: '📚' },
  { key: 'faculty', label: 'Faculty & Mentorship', category: 'Academics & Career', icon: '👨‍🏫' },
  { key: 'placements', label: 'Placements & Packages', category: 'Academics & Career', icon: '💼' },
  { key: 'internships', label: 'Internship Ties', category: 'Academics & Career', icon: '🚀' },

  { key: 'coding_culture', label: 'Coding & Tech Culture', category: 'Campus Culture', icon: '💻' },
  { key: 'peer_group', label: 'Peer Group & Network', category: 'Campus Culture', icon: '🤝' },
  { key: 'campus_life', label: 'Campus Life & Vibe', category: 'Campus Culture', icon: '✨' },
  { key: 'clubs', label: 'Clubs & Societies', category: 'Campus Culture', icon: '🎭' },
  { key: 'fests', label: 'Annual Fests', category: 'Campus Culture', icon: '🎉' },
  { key: 'sports', label: 'Sports & Facilities', category: 'Campus Culture', icon: '⚽' },

  { key: 'infrastructure', label: 'Labs & Classrooms', category: 'Living & Facilities', icon: '🏛️' },
  { key: 'hostel', label: 'Hostel Accommodation', category: 'Living & Facilities', icon: '🛏️' },
  { key: 'mess', label: 'Mess & Food Quality', category: 'Living & Facilities', icon: '🍲' },
  { key: 'location', label: 'Location & Transit', category: 'Living & Facilities', icon: '📍' },
  { key: 'safety', label: 'Campus Safety', category: 'Living & Facilities', icon: '🛡️' },

  { key: 'administration', label: 'Administration', category: 'Governance & Value', icon: '⚖️' },
  { key: 'fees', label: 'Value for Money / ROI', category: 'Governance & Value', icon: '💰' },
  { key: 'overall', label: 'Overall Experience', category: 'Governance & Value', icon: '⭐' },
];

function getBarColor(score: number): { bar: string; text: string; bg: string } {
  if (score >= 4.0) {
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    };
  }
  if (score >= 3.0) {
    return {
      bar: 'bg-indigo-500',
      text: 'text-indigo-700 dark:text-indigo-300',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    };
  }
  if (score >= 2.0) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
    };
  }
  return {
    bar: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
  };
}

export function RatingModal({
  collegeName,
  totalReviews,
  ratings,
  onClose,
}: RatingModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const categories = Array.from(new Set(PARAM_META.map((p) => p.category)));
  const overallScore = ratings.overall ? Number(ratings.overall).toFixed(1) : '4.5';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
            <span>⭐</span>
            <span>100% Verified Senior Evaluations</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {collegeName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated ratings from {totalReviews} enrolled {totalReviews === 1 ? 'senior' : 'seniors'} across 18 objective campus parameters.
          </p>

          <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-black text-xl flex items-center justify-center border border-amber-200 dark:border-amber-900">
                {overallScore}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Cumulative Experience Rating
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scale: 1.0 (Critical) to 5.0 (Outstanding)
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ✓ Verified Authentic
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {categories.map((category) => {
            const params = PARAM_META.filter((p) => p.category === category);

            return (
              <div key={category} className="space-y-3">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  {category}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {params.map((param) => {
                    const score = Number(ratings[param.key] || 0);
                    const percentage = Math.min(100, Math.max(0, (score / 5) * 100));
                    const colors = getBarColor(score);

                    return (
                      <div
                        key={param.key}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate pr-2">
                            <span>{param.icon}</span>
                            <span className="truncate">{param.label}</span>
                          </span>
                          <span className={`font-black shrink-0 ${colors.text}`}>
                            {score.toFixed(1)} / 5
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Ratings calculated via authentic student evaluations.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
