import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Full name is required.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const userId = `user-app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'applicant', ?)
    `);

    const insertProfile = db.prepare(`
      INSERT INTO profiles (
        user_id, email, password_hash, display_name, role,
        verified_status, is_verified, availability, created_at
      )
      VALUES (?, ?, ?, ?, 'applicant', 0, 0, 1, ?)
    `);

    const transaction = db.transaction(() => {
      insertUser.run(userId, normalizedEmail, passwordHash, now);
      insertProfile.run(userId, normalizedEmail, passwordHash, cleanName, now);
    });

    transaction();

    const token = await signToken({
      userId,
      email: normalizedEmail,
      fullName: cleanName,
      displayName: cleanName,
      role: 'applicant',
      verified_status: 0,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Applicant registered successfully.',
        user: {
          userId,
          email: normalizedEmail,
          fullName: cleanName,
          role: 'applicant',
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'auth_session',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: 'mock_user_session',
      value: '',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

