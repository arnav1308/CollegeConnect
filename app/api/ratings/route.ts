import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const RATING_FIELDS = [
  'academics',
  'faculty',
  'placements',
  'internships',
  'hostel',
  'mess',
  'campus_life',
  'peer_group',
  'infrastructure',
  'clubs',
  'fests',
  'coding_culture',
  'sports',
  'administration',
  'fees',
  'location',
  'safety',
  'overall',
] as const;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = await verifyToken<TokenPayload>(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json(
        { error: 'Only verified seniors can access this resource.' },
        { status: 403 }
      );
    }

    interface DbProfile {
      college: string | null;
      display_name: string | null;
    }

    const profile = db
      .prepare('SELECT college, display_name FROM profiles WHERE user_id = ?')
      .get(payload.userId) as DbProfile | undefined;

    const existing = db
      .prepare('SELECT * FROM ratings WHERE senior_id = ?')
      .get(payload.userId);

    const college = profile?.college || payload.college || 'Your University';

    return NextResponse.json({
      college,
      displayName: profile?.display_name || payload.displayName || 'Verified Senior',
      ratings: existing || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch ratings status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = await verifyToken<TokenPayload>(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json(
        { error: 'Only verified seniors can submit college ratings.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsedRatings: Record<string, number> = {};
    for (const field of RATING_FIELDS) {
      const val = Number(body[field]);
      if (!val || val < 1 || val > 5 || !Number.isInteger(val)) {
        return NextResponse.json(
          { error: `Parameter '${field}' is required and must be an integer between 1 and 5.` },
          { status: 400 }
        );
      }
      parsedRatings[field] = val;
    }

    let college = (payload.college as string) || '';
    if (!college) {
      const profile = db
        .prepare('SELECT college FROM profiles WHERE user_id = ?')
        .get(payload.userId) as { college: string | null } | undefined;
      college = profile?.college || '';
    }

    if (!college) {
      const inst = db
        .prepare(`
          SELECT i.canonical_name 
          FROM profiles p 
          JOIN institutions i ON p.institution_id = i.id 
          WHERE p.user_id = ?
        `)
        .get(payload.userId) as { canonical_name: string } | undefined;
      college = inst?.canonical_name || (body.college as string) || 'Indian Institute of Technology Bombay';
    }

    const insertStmt = db.prepare(`
      INSERT INTO ratings (
        senior_id, college, academics, faculty, placements, internships, hostel, mess,
        campus_life, peer_group, infrastructure, clubs, fests, coding_culture, sports,
        administration, fees, location, safety, overall, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(senior_id) DO UPDATE SET
        college = excluded.college,
        academics = excluded.academics,
        faculty = excluded.faculty,
        placements = excluded.placements,
        internships = excluded.internships,
        hostel = excluded.hostel,
        mess = excluded.mess,
        campus_life = excluded.campus_life,
        peer_group = excluded.peer_group,
        infrastructure = excluded.infrastructure,
        clubs = excluded.clubs,
        fests = excluded.fests,
        coding_culture = excluded.coding_culture,
        sports = excluded.sports,
        administration = excluded.administration,
        fees = excluded.fees,
        location = excluded.location,
        safety = excluded.safety,
        overall = excluded.overall,
        created_at = datetime('now')
    `);

    insertStmt.run(
      payload.userId,
      college,
      parsedRatings.academics,
      parsedRatings.faculty,
      parsedRatings.placements,
      parsedRatings.internships,
      parsedRatings.hostel,
      parsedRatings.mess,
      parsedRatings.campus_life,
      parsedRatings.peer_group,
      parsedRatings.infrastructure,
      parsedRatings.clubs,
      parsedRatings.fests,
      parsedRatings.coding_culture,
      parsedRatings.sports,
      parsedRatings.administration,
      parsedRatings.fees,
      parsedRatings.location,
      parsedRatings.safety,
      parsedRatings.overall
    );

    return NextResponse.json({
      success: true,
      message: 'Ratings submitted successfully.',
      redirectTo: '/inbox',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit ratings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

