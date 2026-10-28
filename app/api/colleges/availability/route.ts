import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeName = searchParams.get('collegeName');

    if (!collegeName || !collegeName.trim()) {
      return NextResponse.json({ available: false, error: 'collegeName parameter is required' }, { status: 400 });
    }

    const rawName = collegeName.trim();
    const cleanName = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();

    let expandedName = cleanName;
    if (/\bIIT\b/i.test(cleanName)) {
      expandedName = cleanName.replace(/\bIIT\b/gi, 'Indian Institute of Technology');
    } else if (/\bNIT\b/i.test(cleanName)) {
      expandedName = cleanName.replace(/\bNIT\b/gi, 'National Institute of Technology');
    } else if (/\bIIIT\b/i.test(cleanName)) {
      expandedName = cleanName.replace(/\bIIIT\b/gi, 'Indian Institute of Information Technology');
    } else if (/\bBITS\b/i.test(cleanName)) {
      expandedName = cleanName.replace(/\bBITS\b/gi, 'Birla Institute of Technology');
    }

    const seniorQuery = db.prepare(`
      SELECT 
        i.id AS institution_id,
        i.canonical_name,
        p.user_id,
        p.display_name
      FROM institutions i
      JOIN profiles p ON p.institution_id = i.id
      WHERE p.role = 'student'
        AND p.verified_status = 1
        AND (
          i.canonical_name LIKE ?
          OR ? LIKE '%' || i.canonical_name || '%'
          OR i.canonical_name LIKE ?
          OR ? LIKE '%' || i.city || '%'
          OR i.id LIKE ?
        )
      LIMIT 1
    `);

    const seniorMatch = seniorQuery.get(
      `%${cleanName}%`,
      cleanName,
      `%${expandedName}%`,
      cleanName,
      `%${cleanName.toLowerCase()}%`
    ) as { institution_id: string; canonical_name: string; user_id: string; display_name: string } | undefined;

    if (seniorMatch) {
      return NextResponse.json({
        available: true,
        institutionId: seniorMatch.institution_id,
        canonicalName: seniorMatch.canonical_name,
        seniorName: seniorMatch.display_name,
      });
    }

    return NextResponse.json({
      available: false,
    });
  } catch (error: any) {
    console.error('[Senior Availability Check Error]:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to verify senior mentor availability' },
      { status: 500 }
    );
  }
}
