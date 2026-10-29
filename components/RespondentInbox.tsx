'use client';

import { useState } from 'react';
import type { TicketStatus, AssignmentStatus } from '@/types';
import { formatDate } from '@/lib/date';
import TicketChat from './TicketChat';

export interface AssignedTicketItem {
  id: string;
  assignment_id: string;
  topic: string;
  question: string;
  ticket_status: TicketStatus;
  assignment_status: AssignmentStatus;
  requested_year: number;
  institution_name: string;
  programme_name: string;
  assigned_at: string;
  applicant_alias: string;
}

interface RespondentInboxProps {
  initialTickets?: AssignedTicketItem[];
  userAuthToken?: string;
}

export default function RespondentInbox({
  initialTickets = [],
  userAuthToken,
}: RespondentInboxProps) {
  const [tickets, setTickets] = useState<AssignedTicketItem[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [inboxError, setInboxError] = useState<string | null>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'pending') return t.assignment_status === 'pending';
    if (filterStatus === 'claimed') return t.ticket_status === 'claimed' || t.assignment_status === 'claimed';
    if (filterStatus === 'resolved') return t.ticket_status === 'resolved';
    return true;
  });

  const handleClaimTicket = async (ticketId: string) => {
    setLoadingAction(true);
    setInboxError(null);

    try {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, ticket_status: 'claimed', assignment_status: 'claimed' }
            : t
        )
      );

      const res = await fetch(`/api/tickets/${ticketId}/claim`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userAuthToken ? { Authorization: `Bearer ${userAuthToken}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to claim ticket on server.');
      }
    } catch (err: any) {
      setInboxError(err.message || 'Failed to claim ticket.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket) return;
    setLoadingAction(true);
    try {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, ticket_status: 'resolved' } : t
        )
      );
    } catch (err: any) {
      setInboxError(err.message || 'Failed to resolve ticket.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Verified Mentor Dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Senior Respondent Inbox
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Incoming inquiries from prospective students routed to your institution & branch cohort.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'pending'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending Offer
          </button>
          <button
            onClick={() => setFilterStatus('claimed')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'claimed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {inboxError && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800">
          {inboxError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No tickets found in this queue. Inquiries routed to your cohort will appear here automatically.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = ticket.id === selectedTicketId;
              const isPending = ticket.assignment_status === 'pending';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                      {ticket.applicant_alias}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : ticket.ticket_status === 'claimed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                          : ticket.ticket_status === 'resolved'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}
                    >
                      {isPending ? 'Action Required' : ticket.ticket_status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {ticket.topic}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ticket.question}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{ticket.programme_name}</span>
                    <span suppressHydrationWarning>{formatDate(ticket.assigned_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeTicket.topic}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                      Year {activeTicket.requested_year}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {activeTicket.institution_name} &bull; {activeTicket.programme_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.assignment_status === 'pending' ? (
                    <button
                      onClick={() => handleClaimTicket(activeTicket.id)}
                      disabled={loadingAction}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {loadingAction ? 'Claiming...' : 'Claim Ticket'}
                    </button>
                  ) : activeTicket.ticket_status !== 'resolved' ? (
                    <button
                      onClick={handleResolveTicket}
                      disabled={loadingAction}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      &check; Resolved
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <TicketChat
                  key={activeTicket.id}
                  ticketId={activeTicket.id}
                  disabled={activeTicket.assignment_status === 'pending'}
                  disabledNotice="Please click 'Claim Ticket' above to accept this inquiry and begin replying."
                  onMessageSent={() => {
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === activeTicket.id ? { ...t, ticket_status: 'answered' } : t
                      )
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-12">
              Select an inquiry ticket on the left to review and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { RespondentInbox };
