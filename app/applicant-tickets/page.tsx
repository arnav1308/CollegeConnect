import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';
import { ApplicantTicketsView, type ApplicantTicketItem } from '@/components/ApplicantTicketsView';

export const dynamic = 'force-dynamic';

export default async function ApplicantTicketsPage() {
  const session = await getDemoSession();

  if (!session || !session.userId) {
    redirect('/login?redirectedFrom=/applicant-tickets');
  }

  if (session.role !== 'applicant') {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Applicant Account Required
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You are currently signed in as <strong>{session.displayName}</strong> ({session.role}). Support inquiry creation and tracking is reserved for student applicants.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/inbox"
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
          >
            Go to Senior Inbox
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Switch to Applicant Persona
          </Link>
        </div>
      </div>
    );
  }

  const stmt = db.prepare(`
    SELECT 
      t.id,
      t.topic,
      t.question,
      t.status,
      t.created_at,
      t.updated_at,
      t.requested_year,
      i.canonical_name AS institution_name,
      COALESCE(p.branch_name, 'General Engineering') AS programme_name,
      ta.status AS assignment_status,
      COALESCE(resp.display_name, 'Verified Senior Mentor') AS respondent_name,
      (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) AS message_count
    FROM tickets t
    JOIN institutions i ON i.id = t.institution_id
    LEFT JOIN programmes p ON p.id = t.programme_id
    LEFT JOIN ticket_assignments ta ON ta.ticket_id = t.id
    LEFT JOIN profiles resp ON resp.user_id = ta.respondent_id
    WHERE t.applicant_id = ?
    ORDER BY t.created_at DESC
  `);

  const tickets = stmt.all(session.userId) as ApplicantTicketItem[];

  return (
    <main className="flex-1">
      <ApplicantTicketsView
        initialTickets={tickets}
        applicantName={session.displayName}
      />
    </main>
  );
}
