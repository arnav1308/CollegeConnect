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

// Helper: Authorize membership using manual SQL queries in SQLite
function verifyTicketAccess(ticketId: string, userId: string) {
  // Check if user is the applicant
  const ticketStmt = db.prepare('SELECT id, applicant_id, status FROM tickets WHERE id = ?');
  const ticket = ticketStmt.get(ticketId) as { id: string; applicant_id: string; status: string } | undefined;

  if (!ticket) {
    return { authorized: false, notFound: true };
  }

  if (ticket.applicant_id === userId) {
    return { authorized: true, role: 'applicant' as const, ticket };
  }

  // Check if user is the assigned respondent
  const assignmentStmt = db.prepare(`
    SELECT id, respondent_id, status 
    FROM ticket_assignments 
    WHERE ticket_id = ? AND respondent_id = ?
  `);
  const assignment = assignmentStmt.get(ticketId, userId) as
    | { id: string; respondent_id: string; status: string }
    | undefined;

  if (assignment && (assignment.status === 'claimed' || assignment.status === 'pending')) {
    return { authorized: true, role: 'respondent' as const, ticket, assignment };
  }

  return { authorized: false, notFound: false };
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

    // Manual SQLite Membership Verification
    const access = verifyTicketAccess(ticketId, session.userId);

    if (access.notFound) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You are not authorized to view this private inquiry thread',
        },
        { status: 403 }
      );
    }

    // Retrieve thread messages chronologically
    const messagesStmt = db.prepare(`
      SELECT id, ticket_id, sender_user_id, body, created_at 
      FROM ticket_messages 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `);

    const rows = messagesStmt.all(ticketId) as any[];

    // Sanitize aliases to preserve mutual anonymity
    const sanitizedMessages = rows.map((msg) => {
      const isSenderSelf = msg.sender_user_id === session.userId;
      const isSenderApplicant = msg.sender_user_id === access.ticket?.applicant_id;

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
    console.error('[Ticket Messages GET SQLite Exception]:', err);
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

    // Manual SQLite Membership Verification
    const access = verifyTicketAccess(ticketId, session.userId);

    if (access.notFound) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (!access.authorized) {
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

    // Insert message into SQLite
    const insertMessageStmt = db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, sender_user_id, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMessageStmt.run(messageId, ticketId, session.userId, body, now);

    // If respondent replied on a claimed ticket, advance status to 'answered'
    if (access.role === 'respondent' && access.ticket?.status === 'claimed') {
      const updateTicketStmt = db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?');
      updateTicketStmt.run('answered', now, ticketId);
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: messageId,
          body,
          created_at: now,
          sender_role: access.role,
          sender_display_alias: 'You',
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Ticket Messages POST SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while posting message' },
      { status: 500 }
    );
  }
}
