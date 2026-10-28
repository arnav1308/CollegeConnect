'use client';

import { useState, useMemo, type FormEvent } from 'react';

export interface CollegeRecommendation {
  collegeName: string;
  branch: string;
  type: 'Public' | 'Private';
  feasibility: 'Safe' | 'Competitive' | 'Borderline';
  aiMatchScore: number;
  holisticReview: string;
}

interface AdmissionsDashboardProps {
  initialExam?: string;
  initialCategory?: string;
  userAuthToken?: string;
}

const BRANCH_OPTIONS = [
  'Computer Science and Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics and Communication Engineering (ECE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering (EE)',
  'Artificial Intelligence and Machine Learning (AI/ML)',
  'Data Science',
  'Aerospace Engineering',
  'Biotechnology',
  'Any',
];

export default function AdmissionsDashboard({
  initialExam = 'JEE Main',
  initialCategory = 'OPEN',
  userAuthToken,
}: AdmissionsDashboardProps) {
  const [examPathway, setExamPathway] = useState(initialExam);
  const [rankInput, setRankInput] = useState<string>('12000');
  const [category, setCategory] = useState(initialCategory);
  const [quota, setQuota] = useState('AI');
  const [primaryBranch, setPrimaryBranch] = useState(
    'Computer Science and Engineering (CSE)'
  );
  const [secondaryBranch, setSecondaryBranch] = useState(
    'Artificial Intelligence and Machine Learning (AI/ML)'
  );

  const [searchFilter, setSearchFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CollegeRecommendation[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedCollegeForTicket, setSelectedCollegeForTicket] = useState<CollegeRecommendation | null>(null);
  const [ticketTopic, setTicketTopic] = useState('');
  const [ticketQuestion, setTicketQuestion] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);
  const [ticketErrorMsg, setTicketErrorMsg] = useState<string | null>(null);

  const handleCalculateShortlist = async (e: FormEvent) => {
    e.preventDefault();
    const parsedRank = parseInt(rankInput, 10);
    if (isNaN(parsedRank) || parsedRank <= 0) {
      setErrorMsg('Please enter a valid positive rank.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admissions/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examPathway,
          rank: parsedRank,
          category,
          quota,
          primaryBranch,
          secondaryBranch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations.');
      }

      setRecommendations(Array.isArray(data) ? data : data.recommendations || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while communicating with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = useMemo(() => {
    if (!recommendations) return [];
    if (!searchFilter.trim()) return recommendations;
    const term = searchFilter.toLowerCase();
    return recommendations.filter(
      (item) =>
        item.collegeName.toLowerCase().includes(term) ||
        item.branch.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.holisticReview.toLowerCase().includes(term)
    );
  }, [recommendations, searchFilter]);

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeForTicket) return;

    setTicketSubmitting(true);
    setTicketErrorMsg(null);
    setTicketSuccessMsg(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_id: 'inst-iitb',
          programme_id: 'prog-iitb-cse',
          requested_year: new Date().getFullYear(),
          topic: ticketTopic,
          question: ticketQuestion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const firstDetailError = data.details
          ? (Object.values(data.details).flat()[0] as string)
          : null;
        throw new Error(firstDetailError || data.error || 'Unable to submit inquiry ticket.');
      }

      setTicketSuccessMsg(data.message || 'Ticket routed successfully to a verified senior!');
      setTimeout(() => {
        setSelectedCollegeForTicket(null);
        setTicketTopic('');
        setTicketQuestion('');
        setTicketSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setTicketErrorMsg(err.message || 'Failed to submit inquiry.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Smart Holistic College Matchmaker
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Holistic Admissions Shortlist
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Intelligently evaluates public & top private institutions balancing cutoffs, coding culture, and placement records.
          </p>
        </div>

        {recommendations && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ✓ Ranked 5 Best-Fit Colleges for Rank {rankInput}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <form onSubmit={handleCalculateShortlist} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Exam Pathway
              </label>
              <select
                value={examPathway}
                onChange={(e) => setExamPathway(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="JEE Main">JEE Main (NITs, IIITs & Private)</option>
                <option value="JEE Advanced">JEE Advanced (IITs)</option>
                <option value="BITSAT">BITSAT (BITS Pilani Campuses)</option>
                <option value="MET / VITEEE">MET / VITEEE / SRMJEEE</option>
                <option value="COMEDK / State CET">COMEDK / State CETs (RVCE, BMS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Your Rank / Score
              </label>
              <input
                type="number"
                min="1"
                required
                value={rankInput}
                onChange={(e) => setRankInput(e.target.value)}
                placeholder="e.g. 14200"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Seat Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="OPEN">OPEN (General / All India)</option>
                <option value="EWS">EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Quota Pool
              </label>
              <select
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="AI">All India (AI)</option>
                <option value="OS">Other State (OS)</option>
                <option value="HS">Home State (HS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Primary Preferred Branch
              </label>
              <select
                value={primaryBranch}
                onChange={(e) => setPrimaryBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={`pri-${branch}`} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                Secondary Preferred Branch
              </label>
              <select
                value={secondaryBranch}
                onChange={(e) => setSecondaryBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={`sec-${branch}`} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Consulting Gemini AI...
                </>
              ) : (
                'Generate Holistic Recommendations'
              )}
            </button>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {recommendations && (
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recommended College Cohorts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Top 5 holistic matches spanning public institutions and premier private universities.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search colleges or branches..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((item, idx) => (
              <div
                key={`${item.collegeName}-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          item.type === 'Public'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                        }`}
                      >
                        {item.type}
                      </span>

                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          item.feasibility === 'Safe'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : item.feasibility === 'Competitive'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        }`}
                      >
                        {item.feasibility}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <span className="text-sm font-extrabold leading-none">{item.aiMatchScore}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-tighter opacity-80 mt-0.5">Match</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.collegeName}
                  </h3>

                  <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {item.branch}
                  </div>

                  <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {item.holisticReview}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Verified Campus Senior Available
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCollegeForTicket(item);
                      setTicketTopic(`Inquiry regarding ${item.branch} at ${item.collegeName}`);
                      setTicketErrorMsg(null);
                      setTicketSuccessMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Ask Senior
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCollegeForTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setSelectedCollegeForTicket(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>

            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Direct Peer Routing
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Ask a Senior at {selectedCollegeForTicket.collegeName}
              </h2>
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{selectedCollegeForTicket.collegeName}</span> &bull; {selectedCollegeForTicket.branch} ({selectedCollegeForTicket.type})
              </div>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Inquiry Topic
                </label>
                <input
                  type="text"
                  required
                  value={ticketTopic}
                  onChange={(e) => setTicketTopic(e.target.value)}
                  placeholder="e.g. Branch change possibilities or hostel amenities"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Specific Question (Anonymous)
                </label>
                <textarea
                  rows={4}
                  required
                  value={ticketQuestion}
                  onChange={(e) => setTicketQuestion(e.target.value)}
                  placeholder="Ask candidly about coding culture, professors, hostels, or attendance rules. Your identity is strictly anonymous."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Anonymity Guaranteed: Support ticket format with private 1-on-1 thread.
              </div>

              {ticketErrorMsg && (
                <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 rounded-xl">
                  {ticketErrorMsg}
                </div>
              )}

              {ticketSuccessMsg && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl">
                  {ticketSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCollegeForTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
                >
                  {ticketSubmitting ? 'Routing Ticket...' : 'Submit Inquiry Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
