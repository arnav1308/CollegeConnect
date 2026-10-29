'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { formatTime } from '@/lib/date';

export interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  is_self: boolean;
  sender_role: 'applicant' | 'respondent';
  sender_display_alias: string;
}

interface TicketChatProps {
  ticketId: string;
  ticketTopic?: string;
  metaInfo?: string;
  disabled?: boolean;
  disabledNotice?: string;
  onMessageSent?: () => void;
}

export default function TicketChat({
  ticketId,
  ticketTopic,
  metaInfo,
  disabled = false,
  disabledNotice,
  onMessageSent,
}: TicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputBody, setInputBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const fetchMessages = async (silent = false) => {
    if (!ticketId) return;
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You are not authorized to view this private thread.');
        }
        if (res.status === 404) {
          throw new Error('Ticket not found.');
        }
        throw new Error('Failed to load message history.');
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setErrorMsg(null);
    } catch (err: any) {
      if (!silent) {
        setErrorMsg(err.message || 'Error fetching messages.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    isFirstLoad.current = true;
    fetchMessages(false);

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isFirstLoad.current ? 'auto' : 'smooth',
      });
      isFirstLoad.current = false;
    }
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputBody.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    setErrorMsg(null);

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      body: trimmed,
      created_at: new Date().toISOString(),
      is_self: true,
      sender_role: 'applicant',
      sender_display_alias: 'You',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputBody('');

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to deliver message.');
      }

      if (data.message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === optimisticId ? data.message : msg))
        );
      }

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send message.');
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      setInputBody(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {ticketTopic && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
            {ticketTopic}
          </h2>
          {metaInfo && <div className="text-xs text-slate-500 mt-0.5">{metaInfo}</div>}
        </div>
      )}

      <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          <strong>Mutual Anonymity:</strong> Encrypted peer thread. Only assigned participants can access.
        </span>
      </div>

      {errorMsg && (
        <div className="m-3 p-3 text-xs bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[520px]">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 py-12">
            <svg className="animate-spin h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 py-12 text-center">
            <p>No messages in this inquiry thread yet.</p>
            <p className="mt-1 text-[11px] text-slate-500">Post the first question below to begin.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.is_self;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {msg.sender_display_alias}
                  </span>
                  <span suppressHydrationWarning className="text-[10px] text-slate-400">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        {disabled ? (
          <div className="p-3 text-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            {disabledNotice || 'Please claim this ticket above before sending a reply.'}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || !inputBody.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export { TicketChat };
