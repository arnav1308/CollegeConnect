import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCanonicalCollegeName, aggregateRatingsList } from '@/lib/canonical';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeParam = searchParams.get('college');

    if (!collegeParam || !collegeParam.trim()) {
      return NextResponse.json(
        { hasRatings: false, error: 'Query parameter "college" is required.' },
        { status: 400 }
      );
    }

    const cleanCollege = collegeParam.trim();
    const canonicalTarget = getCanonicalCollegeName(cleanCollege);

    const rawRows = db.prepare('SELECT * FROM ratings').all() as any[];
    const aggregated = aggregateRatingsList(rawRows);

    const match = aggregated.find(
      (c) =>
        c.collegeName.toLowerCase() === canonicalTarget.toLowerCase() ||
        c.collegeName.toLowerCase() === cleanCollege.toLowerCase()
    );

    if (!match) {
      return NextResponse.json({
        hasRatings: false,
        college: cleanCollege,
        total_reviews: 0,
      });
    }

    return NextResponse.json({
      hasRatings: true,
      college: match.collegeName,
      total_reviews: match.total_reviews,
      ratings: {
        academics: match.academics,
        faculty: match.faculty,
        placements: match.placements,
        internships: match.internships,
        hostel: match.hostel,
        mess: match.mess,
        campus_life: match.campus_life,
        peer_group: match.peer_group,
        infrastructure: match.infrastructure,
        clubs: match.clubs,
        fests: match.fests,
        coding_culture: match.coding_culture,
        sports: match.sports,
        administration: match.administration,
        fees: match.fees,
        location: match.location,
        safety: match.safety,
        overall: match.overall,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error aggregating ratings.';
    return NextResponse.json({ hasRatings: false, error: message }, { status: 500 });
  }
}
