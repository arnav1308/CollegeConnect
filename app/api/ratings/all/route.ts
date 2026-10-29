import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = await verifyToken<TokenPayload>(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    const query = `
      SELECT 
        college as collegeName,
        COUNT(id) as total_reviews,
        ROUND(AVG(overall), 1) as overall,
        ROUND(AVG(academics), 1) as academics,
        ROUND(AVG(faculty), 1) as faculty,
        ROUND(AVG(placements), 1) as placements,
        ROUND(AVG(internships), 1) as internships,
        ROUND(AVG(hostel), 1) as hostel,
        ROUND(AVG(mess), 1) as mess,
        ROUND(AVG(campus_life), 1) as campus_life,
        ROUND(AVG(peer_group), 1) as peer_group,
        ROUND(AVG(infrastructure), 1) as infrastructure,
        ROUND(AVG(clubs), 1) as clubs,
        ROUND(AVG(fests), 1) as fests,
        ROUND(AVG(coding_culture), 1) as coding_culture,
        ROUND(AVG(sports), 1) as sports,
        ROUND(AVG(administration), 1) as administration,
        ROUND(AVG(fees), 1) as fees,
        ROUND(AVG(location), 1) as location,
        ROUND(AVG(safety), 1) as safety
      FROM ratings
      GROUP BY college
      ORDER BY overall DESC
    `;

    const rows = db.prepare(query).all();

    return NextResponse.json({
      success: true,
      colleges: rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rated colleges.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

