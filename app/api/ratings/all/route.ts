import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { verifyToken, type TokenPayload } from '@/lib/jwt';
import { aggregateRatingsList } from '@/lib/canonical';

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

    const rawRows = db.prepare('SELECT * FROM ratings').all() as any[];
    const colleges = aggregateRatingsList(rawRows);

    return NextResponse.json({
      success: true,
      colleges,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rated colleges.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
