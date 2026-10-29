'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RatingModal } from '@/components/RatingModal';

export interface RatedCollegeItem {
  collegeName: string;
  total_reviews: number;
  overall: number;
  academics: number;
  faculty: number;
  placements: number;
  internships: number;
  hostel: number;
  mess: number;
  campus_life: number;
  peer_group: number;
  infrastructure: number;
  clubs: number;
  fests: number;
  coding_culture: number;
  sports: number;
  administration: number;
  fees: number;
  location: number;
  safety: number;
}

interface RatedCollegesViewProps {
  initialColleges: RatedCollegeItem[];
}

export function RatedCollegesView({ initialColleges }: RatedCollegesViewProps) {
  const [colleges] = useState<RatedCollegeItem[]>(initialColleges);
  const [search, setSearch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<RatedCollegeItem | null>(null);

  const filteredColleges = useMemo(() => {
    if (!search.trim()) return colleges;
    const q = search.toLowerCase();
    return colleges.filter((c) => c.collegeName.toLowerCase().includes(q));
  }, [colleges, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Verified Campus Reviews
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Community-Rated Colleges
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real evaluations submitted by verified enrolled seniors across 18 objective campus dimensions.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rated colleges..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredColleges.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-xs">
            ⭐
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Ratings Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No community ratings match your query. Explore our admissions shortlist to find matching colleges.
          </p>
          <div>
            <Link
              href="/admissions"
              className="inline-flex px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Go to Admissions Shortlist →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((item) => {
            const overallNumber = Number(item.overall || 0).toFixed(1);

            return (
              <div
                key={item.collegeName}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.total_reviews} {item.total_reviews === 1 ? 'Verified Review' : 'Verified Reviews'}
                    </span>

                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 shrink-0 shadow-2xs">
                      <span className="text-base font-black leading-none">{overallNumber}</span>
                      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80 mt-0.5">/ 5.0</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.collegeName}
                  </h2>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-500">📚 Academics</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Number(item.academics || 0).toFixed(1)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-500">💼 Placements</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Number(item.placements || 0).toFixed(1)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-500">💻 Coding</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Number(item.coding_culture || 0).toFixed(1)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-500">✨ Campus Life</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Number(item.campus_life || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedCollege(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Detailed Ratings</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCollege && (
        <RatingModal
          collegeName={selectedCollege.collegeName}
          totalReviews={selectedCollege.total_reviews}
          ratings={{
            overall: selectedCollege.overall,
            academics: selectedCollege.academics,
            faculty: selectedCollege.faculty,
            placements: selectedCollege.placements,
            internships: selectedCollege.internships,
            hostel: selectedCollege.hostel,
            mess: selectedCollege.mess,
            campus_life: selectedCollege.campus_life,
            peer_group: selectedCollege.peer_group,
            infrastructure: selectedCollege.infrastructure,
            clubs: selectedCollege.clubs,
            fests: selectedCollege.fests,
            coding_culture: selectedCollege.coding_culture,
            sports: selectedCollege.sports,
            administration: selectedCollege.administration,
            fees: selectedCollege.fees,
            location: selectedCollege.location,
            safety: selectedCollege.safety,
          }}
          onClose={() => setSelectedCollege(null)}
        />
      )}
    </div>
  );
}

export default RatedCollegesView;

