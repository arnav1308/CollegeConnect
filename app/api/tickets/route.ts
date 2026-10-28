import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';
import type { TicketStatus } from '@/types';

const CreateTicketSchema = z.object({
  institutionId: z.string().optional(),
  institution_id: z.string().optional(),
  programme_id: z.string().optional(),
  requested_year: z.number().int().min(2020).max(2030).optional().default(2024),
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters')
    .max(150, 'Topic cannot exceed 150 characters')
    .optional(),
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(5000, 'Question cannot exceed 5000 characters')
    .optional(),
  body: z
    .string()
    .min(3, 'Message body must be at least 3 characters')
    .max(5000, 'Message body cannot exceed 5000 characters')
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getDemoSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Demo session not found. Please log in.' },
        { status: 401 }
      );
    }

    if (session.role !== 'applicant') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only applicants can submit inquiry tickets.' },
        { status: 403 }
      );
    }

    const applicantId = session.userId;
    const rawBody = await req.json();
    const validation = CreateTicketSchema.safeParse(rawBody);

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

    const {
      institutionId,
      institution_id,
      programme_id,
      requested_year,
      topic: rawTopic,
      question: rawQuestion,
      body: rawMessageBody,
    } = validation.data;

    const targetInstitutionInput = institutionId || institution_id || 'inst-iitb';
    const messageContent = rawQuestion || rawMessageBody || 'Campus admission and curriculum inquiry.';
    const topic = rawTopic && rawTopic.trim().length >= 2 ? rawTopic.trim() : 'Campus & Curriculum Inquiry';

    let targetInstitutionId = targetInstitutionInput;
    const instCheck = db.prepare('SELECT id FROM institutions WHERE id = ?').get(targetInstitutionId) as { id: string } | undefined;
    if (!instCheck) {
      const defaultInst = db.prepare('SELECT id FROM institutions LIMIT 1').get() as { id: string } | undefined;
      targetInstitutionId = defaultInst?.id || 'inst-iitb';
    }

    let targetProgrammeId = programme_id;
    if (targetProgrammeId) {
      const progCheck = db
        .prepare('SELECT id FROM programmes WHERE id = ? AND institution_id = ?')
        .get(targetProgrammeId, targetInstitutionId);
      if (!progCheck) {
        targetProgrammeId = undefined;
      }
    }

    if (!targetProgrammeId) {
      const defaultProg = db
        .prepare('SELECT id FROM programmes WHERE institution_id = ? LIMIT 1')
        .get(targetInstitutionId) as { id: string } | undefined;
      targetProgrammeId = defaultProg?.id;
    }

    if (!targetProgrammeId) {
      const anyProg = db.prepare('SELECT id, institution_id FROM programmes LIMIT 1').get() as
        | { id: string; institution_id: string }
        | undefined;
      targetProgrammeId = anyProg?.id || 'prog-iitb-cse';
      targetInstitutionId = anyProg?.institution_id || targetInstitutionId;
    }

    const candidateStmt = db.prepare(`
      SELECT user_id, programme_id 
      FROM profiles 
      WHERE role = 'student' 
        AND verified_status = 1 
        AND availability = 1 
        AND institution_id = ?
        AND user_id != ?
      ORDER BY (CASE WHEN programme_id = ? THEN 0 ELSE 1 END) ASC
      LIMIT 1
    `);

    const candidate = candidateStmt.get(targetInstitutionId, applicantId, targetProgrammeId) as
      | { user_id: string; programme_id: string }
      | undefined;

    const initialStatus: TicketStatus = candidate ? 'assigned' : 'submitted';
    const now = new Date().toISOString();
    const ticketId = `ticket-${crypto.randomUUID().slice(0, 8)}`;
    const messageId = `msg-${crypto.randomUUID().slice(0, 8)}`;

    const insertTicketStmt = db.prepare(`
      INSERT INTO tickets (id, applicant_id, institution_id, programme_id, requested_year, topic, question, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTicketStmt.run(
      ticketId,
      applicantId,
      targetInstitutionId,
      targetProgrammeId,
      requested_year,
      topic,
      messageContent,
      initialStatus,
      now,
      now
    );

    const insertMessageStmt = db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, sender_user_id, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMessageStmt.run(messageId, ticketId, applicantId, messageContent, now);

    let assignmentCreated = false;
    if (candidate) {
      const assignmentId = `asgn-${crypto.randomUUID().slice(0, 8)}`;
      const insertAssignmentStmt = db.prepare(`
        INSERT INTO ticket_assignments (id, ticket_id, respondent_id, assigned_at, status, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `);

      insertAssignmentStmt.run(assignmentId, ticketId, candidate.user_id, now, now);
      assignmentCreated = true;
    }

    return NextResponse.json(
      {
        success: true,
        ticket_id: ticketId,
        message: assignmentCreated
          ? 'Ticket submitted and routed to a verified senior in your target cohort.'
          : 'Ticket submitted. Awaiting matching with an available senior.',
        ticket: {
          id: ticketId,
          topic,
          status: initialStatus,
          institution_id: targetInstitutionId,
          programme_id: targetProgrammeId,
          requested_year,
          created_at: now,
        },
        assignment: {
          assigned: assignmentCreated,
          status: assignmentCreated ? 'pending' : null,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Ticket Creation & Message Persistence SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing ticket creation' },
      { status: 500 }
    );
  }
}
