import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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

    const inst = db
      .prepare(
        "SELECT canonical_name FROM institutions WHERE canonical_name LIKE ? OR ? LIKE ('%' || canonical_name || '%') LIMIT 1"
      )
      .get(`%${cleanCollege}%`, cleanCollege) as { canonical_name: string } | undefined;

    const canonicalName = inst?.canonical_name || '';

    const words = cleanCollege.split(/\s+/).filter((w) => w.length > 3);
    const token = words.length > 0 ? words[words.length - 1] : cleanCollege;

    const query = `
      SELECT 
        COUNT(id) AS total_reviews,
        ROUND(AVG(academics), 1) AS academics,
        ROUND(AVG(faculty), 1) AS faculty,
        ROUND(AVG(placements), 1) AS placements,
        ROUND(AVG(internships), 1) AS internships,
        ROUND(AVG(hostel), 1) AS hostel,
        ROUND(AVG(mess), 1) AS mess,
        ROUND(AVG(campus_life), 1) AS campus_life,
        ROUND(AVG(peer_group), 1) AS peer_group,
        ROUND(AVG(infrastructure), 1) AS infrastructure,
        ROUND(AVG(clubs), 1) AS clubs,
        ROUND(AVG(fests), 1) AS fests,
        ROUND(AVG(coding_culture), 1) AS coding_culture,
        ROUND(AVG(sports), 1) AS sports,
        ROUND(AVG(administration), 1) AS administration,
        ROUND(AVG(fees), 1) AS fees,
        ROUND(AVG(location), 1) AS location,
        ROUND(AVG(safety), 1) AS safety,
        ROUND(AVG(overall), 1) AS overall
      FROM ratings
      WHERE 
        college LIKE ? 
        OR (? != '' AND college LIKE ?)
        OR (? != '' AND college LIKE ?)
    `;

    interface AggregationRow {
      total_reviews: number;
      academics: number | null;
      faculty: number | null;
      placements: number | null;
      internships: number | null;
      hostel: number | null;
      mess: number | null;
      campus_life: number | null;
      peer_group: number | null;
      infrastructure: number | null;
      clubs: number | null;
      fests: number | null;
      coding_culture: number | null;
      sports: number | null;
      administration: number | null;
      fees: number | null;
      location: number | null;
      safety: number | null;
      overall: number | null;
    }

    const row = db.prepare(query).get(
      `%${cleanCollege}%`,
      canonicalName,
      `%${canonicalName}%`,
      token,
      `%${token}%`
    ) as AggregationRow | undefined;

    if (!row || !row.total_reviews || row.total_reviews === 0) {
      return NextResponse.json({
        hasRatings: false,
        college: cleanCollege,
        total_reviews: 0,
      });
    }

    return NextResponse.json({
      hasRatings: true,
      college: cleanCollege,
      total_reviews: row.total_reviews,
      ratings: {
        academics: row.academics ?? 0,
        faculty: row.faculty ?? 0,
        placements: row.placements ?? 0,
        internships: row.internships ?? 0,
        hostel: row.hostel ?? 0,
        mess: row.mess ?? 0,
        campus_life: row.campus_life ?? 0,
        peer_group: row.peer_group ?? 0,
        infrastructure: row.infrastructure ?? 0,
        clubs: row.clubs ?? 0,
        fests: row.fests ?? 0,
        coding_culture: row.coding_culture ?? 0,
        sports: row.sports ?? 0,
        administration: row.administration ?? 0,
        fees: row.fees ?? 0,
        location: row.location ?? 0,
        safety: row.safety ?? 0,
        overall: row.overall ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error aggregating ratings.';
    return NextResponse.json({ hasRatings: false, error: message }, { status: 500 });
  }
}
