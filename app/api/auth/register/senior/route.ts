import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, college, branch, year, idImageBase64, mimeType } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Full name is required.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid university or personal email is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!college || typeof college !== 'string' || !college.trim()) {
      return NextResponse.json(
        { error: 'College / University name is required.' },
        { status: 400 }
      );
    }

    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return NextResponse.json(
        { error: 'Branch / Specialization is required.' },
        { status: 400 }
      );
    }

    if (!year || typeof year !== 'string' || !year.trim()) {
      return NextResponse.json(
        { error: 'Current or graduation year is required.' },
        { status: 400 }
      );
    }

    if (!idImageBase64 || typeof idImageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Student ID card image is required for senior verification.' },
        { status: 400 }
      );
    }

    const cleanBase64 = idImageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
    if (!cleanBase64) {
      return NextResponse.json(
        { error: 'Invalid ID card image data.' },
        { status: 400 }
      );
    }

    const resolvedMimeType =
      mimeType ||
      (cleanBase64.startsWith('iVBOR')
        ? 'image/png'
        : cleanBase64.startsWith('UklGR')
        ? 'image/webp'
        : 'image/jpeg');

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanCollege = college.trim();
    const cleanBranch = branch.trim();
    const cleanYear = year.trim();

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured on the server.' },
        { status: 500 }
      );
    }

    const promptText = `You are an automated university identity verification assistant.
A student is registering with:
- Full Name: ${cleanName}
- College: ${cleanCollege}
- Branch: ${cleanBranch}

Examine the uploaded image document.
If the document appears to be a student ID card, campus badge, library card, or college credential reasonably consistent with a student profile, return:
{ "verified": true, "reason": "ID verified for ${cleanName} at ${cleanCollege}" }

If it is completely unrelated, blank, or an arbitrary image (like a photo of food or landscape), return:
{ "verified": false, "reason": "Please provide a clear image of your university student ID card." }

Return ONLY the raw JSON object.`;

    let verificationResult: { verified: boolean; reason: string } | null = null;
    let upstreamError: string | null = null;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];

    for (const model of candidateModels) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const geminiResponse = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType: resolvedMimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) {
              verificationResult = JSON.parse(match[0]);
              break;
            }
          }
        } else {
          const errorJson = await geminiResponse.json().catch(() => null);
          if (errorJson?.error?.message) {
            upstreamError = errorJson.error.message;
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          upstreamError = err.message;
        }
      }
    }

    if (!verificationResult) {
      if (upstreamError?.includes('API key not valid')) {
        return NextResponse.json(
          {
            error:
              'Gemini API key is invalid in .env.local. Please check GEMINI_API_KEY.',
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error:
            upstreamError ||
            'AI verification could not process the student ID card. Please ensure the image is clear and try again.',
        },
        { status: 502 }
      );
    }

    if (!verificationResult.verified) {
      return NextResponse.json(
        {
          error:
            verificationResult.reason ||
            'AI Verification rejected the ID card. The details on the card do not match the submitted profile.',
        },
        { status: 400 }
      );
    }

    const userId = `user-senior-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    let matchedInstitution = db
      .prepare('SELECT id FROM institutions WHERE canonical_name LIKE ? OR canonical_name LIKE ? LIMIT 1')
      .get(`%${cleanCollege}%`, `%${cleanCollege.split(' ')[0]}%`) as { id: string } | undefined;

    if (!matchedInstitution) {
      const lower = cleanCollege.toLowerCase();
      if (lower.includes('bombay') || lower.includes('iitb')) {
        matchedInstitution = { id: 'inst-iitb' };
      } else if (lower.includes('delhi') || lower.includes('iitd')) {
        matchedInstitution = { id: 'inst-iitd' };
      } else if (lower.includes('trichy') || lower.includes('nitt')) {
        matchedInstitution = { id: 'inst-nitt' };
      }
    }

    const institutionId = matchedInstitution?.id || null;

    let programmeId: string | null = null;
    if (institutionId) {
      const matchedProg = db
        .prepare('SELECT id FROM programmes WHERE institution_id = ? AND branch_name LIKE ? LIMIT 1')
        .get(institutionId, `%${cleanBranch}%`) as { id: string } | undefined;
      programmeId = matchedProg?.id || null;
    }

    const displayName = `${cleanName} (${cleanCollege} ${cleanBranch})`;

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'student', ?)
    `);

    const insertProfile = db.prepare(`
      INSERT INTO profiles (
        user_id, email, password_hash, display_name, role,
        verified_status, is_verified, availability, college, branch, grad_year,
        institution_id, programme_id, created_at
      )
      VALUES (?, ?, ?, ?, 'student', 1, 1, 1, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertUser.run(userId, normalizedEmail, passwordHash, now);
      insertProfile.run(
        userId,
        normalizedEmail,
        passwordHash,
        displayName,
        cleanCollege,
        cleanBranch,
        cleanYear,
        institutionId,
        programmeId,
        now
      );
    });

    transaction();

    const token = await signToken({
      userId,
      email: normalizedEmail,
      fullName: cleanName,
      displayName,
      role: 'student',
      verified_status: 1,
      institution_id: institutionId,
      programme_id: programmeId,
      college: cleanCollege,
      branch: cleanBranch,
      grad_year: cleanYear,
    });

    const response = NextResponse.json(
      {
        success: true,
        redirectTo: '/rating',
        message: 'Student ID verified and senior registered successfully.',
        verificationReason: verificationResult.reason,
        user: {
          userId,
          email: normalizedEmail,
          fullName: cleanName,
          role: 'student',
          college: cleanCollege,
          branch: cleanBranch,
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
      expires: new Date(0),
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Senior registration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
