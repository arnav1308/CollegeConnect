import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import db from '@/lib/db';
import { getDemoSession } from '@/lib/auth';
import type { RouteTicketResponse, TicketStatus } from '@/types';

const CreateTicketSchema = z.object({
  institution_id: z.string().optional().default('inst-iitb'),
  programme_id: z.string().optional().default('prog-iitb-cse'),
  requested_year: z.number().int().min(2020).max(2030).optional().default(2024),
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters')
    .max(150, 'Topic cannot exceed 150 characters')
    .trim(),
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(3000, 'Question cannot exceed 3000 characters')
    .trim(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from mock session
    const session = await getDemoSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Demo session not found. Please log in.' },
        { status: 401 }
      );
    }

    const applicantId = session.userId;

    // 2. Validate request payload
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

    const { institution_id, programme_id, requested_year, topic, question } = validation.data;

    // 3. Relational integrity check (SQLite) with demo fallback
    let targetInstitutionId = institution_id;
    let targetProgrammeId = programme_id;

    const progStmt = db.prepare('SELECT id, institution_id FROM programmes WHERE id = ? AND institution_id = ?');
    const programmeCheck = progStmt.get(targetProgrammeId, targetInstitutionId);

    if (!programmeCheck) {
      // Fallback to default verified mentor's cohort in demo mode
      const defaultProg = db.prepare('SELECT id, institution_id FROM programmes LIMIT 1').get() as any;
      if (defaultProg) {
        targetProgrammeId = defaultProg.id;
        targetInstitutionId = defaultProg.institution_id;
      }
    }

    // 4. Ticket Cohort Routing Engine: Match with Verified Student Respondent
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

    // 5. Create Ticket Record in SQLite
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
      question,
      initialStatus,
      now,
      now
    );

    // 6. Assign to matched student if found
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

    // 7. Privacy-First Anonymous Response
    const responsePayload: RouteTicketResponse = {
      success: true,
      message: assignmentCreated
        ? 'Ticket submitted and routed to a verified senior in your target cohort.'
        : 'Ticket submitted. Awaiting matching with an available senior.',
      ticket: {
        id: ticketId,
        topic,
        status: initialStatus,
        institution_id,
        programme_id,
        requested_year,
        created_at: now,
      },
      assignment: {
        assigned: assignmentCreated,
        status: assignmentCreated ? 'pending' : null,
      },
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err: any) {
    console.error('[Ticket Routing SQLite Exception]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing ticket routing' },
      { status: 500 }
    );
  }
}
