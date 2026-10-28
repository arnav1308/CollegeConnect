import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';
import RespondentInbox, { type AssignedTicketItem } from '@/components/RespondentInbox';

export default async function InboxPage() {
  const session = await getDemoSession();

  if (!session) {
    redirect('/login?redirectedFrom=/inbox');
  }

  const isVerifiedStudent = session.role === 'student' && session.verified_status;

  if (!isVerifiedStudent) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Verified Mentors Only
          </h1>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Senior Respondent Inbox is strictly reserved for verified college students answering inquiries routed to their campus cohort.
          </p>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Your Current Role:</span>
              <span className="font-semibold capitalize">{session.role}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Verification Status:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {session.verified_status ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/admissions"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-center"
            >
              Go to Admissions Shortlist
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center"
            >
              Switch to Verified Senior Demo Persona
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const assignmentsStmt = db.prepare(`
    SELECT 
      ta.id AS assignment_id,
      ta.status AS assignment_status,
      ta.assigned_at,
      t.id AS ticket_id,
      t.topic,
      t.question,
      t.status AS ticket_status,
      t.requested_year,
      t.applicant_id,
      i.canonical_name AS institution_name,
      p.degree,
      p.branch_name
    FROM ticket_assignments ta
    JOIN tickets t ON ta.ticket_id = t.id
    JOIN institutions i ON t.institution_id = i.id
    JOIN programmes p ON t.programme_id = p.id
    WHERE ta.respondent_id = ?
    ORDER BY ta.assigned_at DESC
  `);

  const rows = assignmentsStmt.all(session.userId) as any[];

  const formattedTickets: AssignedTicketItem[] = rows.map((r) => {
    const shortHash = r.ticket_id.slice(-5).toUpperCase();
    return {
      id: r.ticket_id,
      assignment_id: r.assignment_id,
      topic: r.topic,
      question: r.question,
      ticket_status: r.ticket_status,
      assignment_status: r.assignment_status,
      requested_year: r.requested_year,
      institution_name: r.institution_name,
      programme_name: `${r.degree} - ${r.branch_name}`,
      assigned_at: r.assigned_at,
      applicant_alias: `Applicant #${shortHash}`,
    };
  });

  return (
    <main className="flex-1">
      <RespondentInbox initialTickets={formattedTickets} userAuthToken={session.userId} />
    </main>
  );
}
