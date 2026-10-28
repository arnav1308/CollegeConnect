'use client';

import { useState } from 'react';
import Link from 'next/link';
import TicketChat from './TicketChat';

export interface ApplicantTicketItem {
  id: string;
  topic: string;
  question: string;
  status: string;
  created_at: string;
  updated_at: string;
  requested_year: number;
  institution_name: string;
  programme_name: string;
  assignment_status: string | null;
  respondent_name: string | null;
  message_count: number;
}

interface ApplicantTicketsViewProps {
  initialTickets: ApplicantTicketItem[];
  applicantName: string;
}

export default function ApplicantTicketsView({
  initialTickets,
  applicantName,
}: ApplicantTicketsViewProps) {
  const [tickets, setTickets] = useState<ApplicantTicketItem[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  );

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const getStatusBadge = (ticket: ApplicantTicketItem) => {
    if (ticket.status === 'resolved') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Resolved
        </span>
      );
    }
    if (ticket.status === 'answered') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
          Senior Replied
        </span>
      );
    }
    if (ticket.status === 'claimed' || ticket.assignment_status === 'claimed') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
          In Discussion
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
        Awaiting Senior
      </span>
    );
  };

  if (tickets.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          No Support Tickets Yet
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          You haven&apos;t asked any questions to verified seniors yet. Generate your admissions shortlist to discover colleges with enrolled campus mentors.
        </p>
        <Link
          href="/admissions"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md hover:shadow-indigo-500/25"
        >
          <span>Find Colleges & Ask a Senior</span>
          <span>&rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Applicant Inquiry Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Senior Mentor Inquiries
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track private, anonymous conversations with verified campus seniors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/60 dark:border-indigo-900"
          >
            <span>+ New College Inquiry</span>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {tickets.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {ticket.institution_name}
                  </span>
                  {getStatusBadge(ticket)}
                </div>

                <h3 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 line-clamp-1">
                  {ticket.topic}
                </h3>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ticket.question}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ticket.programme_name}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeTicket.institution_name}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                      Year {activeTicket.requested_year}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Topic: {activeTicket.topic} &bull; {activeTicket.programme_name}
                  </div>
                </div>

                <div>
                  {getStatusBadge(activeTicket)}
                </div>
              </div>

              <div className="flex-1">
                <TicketChat
                  key={activeTicket.id}
                  ticketId={activeTicket.id}
                  ticketTopic={activeTicket.topic}
                  metaInfo={`${activeTicket.institution_name} • ${activeTicket.programme_name}`}
                  onMessageSent={() => {
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === activeTicket.id
                          ? { ...t, message_count: t.message_count + 1 }
                          : t
                      )
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-12">
              Select an inquiry ticket on the left to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ApplicantTicketsView };
