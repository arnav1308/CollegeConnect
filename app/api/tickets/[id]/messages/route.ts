import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const PostMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message body cannot be empty')
    .max(5000, 'Message body exceeds 5000 characters limit')
    .trim(),
});

function verifyTicketPrivacyAccess(ticketId: string, userId: string) {
  const checkStmt = db.prepare(`
    SELECT 
      t.id AS ticket_id,
      t.applicant_id,
      t.status AS ticket_status,
      ta.respondent_id,
      ta.status AS assignment_status
    FROM tickets t
    LEFT JOIN ticket_assignments ta ON ta.ticket_id = t.id
    WHERE t.id = ?
  `);

  const row = checkStmt.get(ticketId) as
    | {
        ticket_id: string;
        applicant_id: string;
        ticket_status: string;
        respondent_id: string | null;
        assignment_status: string | null;
      }
    | undefined;

  if (!row) {
    return { notFound: true, authorized: false };
  }

  const isApplicant = row.applicant_id === userId;
  const isRespondent = row.respondent_id === userId;

  if (!isApplicant && !isRespondent) {
    return { notFound: false, authorized: false };
  }

  return {
    notFound: false,
    authorized: true,
    role: isApplicant ? ('applicant' as const) : ('respondent' as const),
    ticketData: row,
  };
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: ticketId } = await Promise.resolve(context.params);
    const session = await getDemoSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Demo session not found' },
        { status: 401 }
      );
    }

    const authCheck = verifyTicketPrivacyAccess(ticketId, session.userId);

    if (authCheck.notFound) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!authCheck.authorized || !authCheck.ticketData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You are not authorized to view this private inquiry thread',
        },
        { status: 403 }
      );
    }

    const messagesStmt = db.prepare(`
      SELECT 
        id, 
        ticket_id, 
        sender_user_id, 
        body, 
        created_at 
      FROM ticket_messages 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `);

    const rows = messagesStmt.all(ticketId) as Array<{
      id: string;
      ticket_id: string;
      sender_user_id: string;
      body: string;
      created_at: string;
    }>;

    const sanitizedMessages = rows.map((msg) => {
      const isSenderSelf = msg.sender_user_id === session.userId;
      const isSenderApplicant = msg.sender_user_id === authCheck.ticketData!.applicant_id;

      return {
        id: msg.id,
        body: msg.body,
        created_at: msg.created_at,
        is_self: isSenderSelf,
        sender_role: isSenderApplicant ? 'applicant' : 'respondent',
        sender_display_alias: isSenderSelf
          ? 'You'
          : isSenderApplicant
          ? 'Applicant (Anonymous)'
          : 'Verified Senior (Mentor)',
      };
    });

    return NextResponse.json(
      {
        success: true,
        ticket_id: ticketId,
        messages: sanitizedMessages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Ticket Messages GET Privacy SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while retrieving messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: ticketId } = await Promise.resolve(context.params);
    const session = await getDemoSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Demo session not found' },
        { status: 401 }
      );
    }

    const authCheck = verifyTicketPrivacyAccess(ticketId, session.userId);

    if (authCheck.notFound) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!authCheck.authorized || !authCheck.ticketData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You are not authorized to post in this private inquiry thread',
        },
        { status: 403 }
      );
    }

    const rawBody = await req.json();
    const validation = PostMessageSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { body } = validation.data;
    const messageId = `msg-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const insertMessageStmt = db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, sender_user_id, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMessageStmt.run(messageId, ticketId, session.userId, body, now);

    if (authCheck.role === 'respondent' && authCheck.ticketData.ticket_status !== 'resolved') {
      const updateTicketStmt = db.prepare(`
        UPDATE tickets 
        SET status = 'answered', updated_at = ? 
        WHERE id = ?
      `);
      updateTicketStmt.run(now, ticketId);
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: messageId,
          body,
          created_at: now,
          is_self: true,
          sender_role: authCheck.role,
          sender_display_alias: 'You',
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Ticket Messages POST Privacy SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while posting message' },
      { status: 500 }
    );
  }
}
