import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

async function handleClaim(req: NextRequest, context: RouteContext) {
  try {
    const { id: ticketId } = await Promise.resolve(context.params);

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // 1. Verify mock session
    const session = await getDemoSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Demo session not found' },
        { status: 401 }
      );
    }

    if (session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only verified student mentors may claim tickets' },
        { status: 403 }
      );
    }

    const respondentId = session.userId;
    const now = new Date().toISOString();

    // 2. Atomic SQLite Update: Check changes to ensure no race condition
    const updateAssignmentStmt = db.prepare(`
      UPDATE ticket_assignments
      SET status = 'claimed', updated_at = ?
      WHERE ticket_id = ?
        AND respondent_id = ?
        AND status = 'pending'
    `);

    const info = updateAssignmentStmt.run(now, ticketId, respondentId);

    // If changes === 0, the ticket assignment was either already claimed, cancelled, or not pending
    if (info.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict: This ticket has already been claimed or is no longer in a pending offer state for your account.',
        },
        { status: 409 }
      );
    }

    // 3. Update the parent ticket status to 'claimed'
    const updateTicketStmt = db.prepare(`
      UPDATE tickets
      SET status = 'claimed', updated_at = ?
      WHERE id = ?
    `);

    updateTicketStmt.run(now, ticketId);

    return NextResponse.json(
      {
        success: true,
        message: 'Ticket claimed successfully. You may now communicate privately with the applicant.',
        ticket_id: ticketId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Ticket Claim SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing ticket claim' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handleClaim(req, context);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return handleClaim(req, context);
}
