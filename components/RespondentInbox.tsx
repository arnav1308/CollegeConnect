'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { TicketStatus, AssignmentStatus } from '@/types';

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

export interface TicketThreadMessage {
  id: string;
  sender_role: 'applicant' | 'respondent';
  sender_display_alias: string;
  body: string;
  created_at: string;
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

  const [messages, setMessages] = useState<TicketThreadMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (activeTicket) {
      setMessages([
        {
          id: 'initial-question',
          sender_role: 'applicant',
          sender_display_alias: activeTicket.applicant_alias,
          body: activeTicket.question,
          created_at: activeTicket.assigned_at,
        },
      ]);
    }
  }, [selectedTicketId, activeTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      if (userAuthToken) {
        await fetch(`/api/tickets/${ticketId}/claim`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAuthToken}`,
          },
        });
      }
    } catch (err: any) {
      setInboxError(err.message || 'Failed to claim ticket.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setSendingReply(true);
    setInboxError(null);

    const newMessage: TicketThreadMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'respondent',
      sender_display_alias: 'You (Verified Senior)',
      body: replyText.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      setMessages((prev) => [...prev, newMessage]);
      setReplyText('');

      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, ticket_status: 'answered' } : t
        )
      );

      if (userAuthToken) {
        await fetch(`/api/tickets/${activeTicket.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAuthToken}`,
          },
          body: JSON.stringify({ body: newMessage.body }),
        });
      }
    } catch (err: any) {
      setInboxError(err.message || 'Could not deliver response message.');
    } finally {
      setSendingReply(false);
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
                    <span>{new Date(ticket.assigned_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
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
                    {activeTicket.institution_name} • {activeTicket.programme_name}
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
                      ✓ Resolved
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>
                  <strong>Strict Privacy Protected:</strong> Applicants cannot see your identity, student ID, or personal data.
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px] bg-white dark:bg-slate-900">
                {messages.map((msg) => {
                  const isSenior = msg.sender_role === 'respondent';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSenior ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {msg.sender_display_alias}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isSenior
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {activeTicket.assignment_status === 'pending' ? (
                  <div className="p-3 text-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    Please click <strong>"Claim Ticket"</strong> above to accept this inquiry and begin replying.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your anonymous reply to the prospective student..."
                      disabled={sendingReply}
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                    >
                      {sendingReply ? 'Sending...' : 'Reply'}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select an inquiry ticket on the left to review and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
