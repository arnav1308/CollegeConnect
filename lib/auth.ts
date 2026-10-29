import { cookies } from 'next/headers';
import { verifyToken, signToken, type TokenPayload } from './jwt';

export const COOKIE_NAME = 'auth_session';

export interface DemoSession {
  userId: string;
  displayName: string;
  fullName?: string;
  email?: string;
  role: 'applicant' | 'student';
  verified_status: boolean;
  institution_id?: string | null;
  programme_id?: string | null;
  college?: string | null;
  branch?: string | null;
}

export const DEMO_PROFILES: Record<'applicant' | 'student', DemoSession> = {
  applicant: {
    userId: 'user-applicant-1',
    displayName: 'Rahul Sharma (Applicant)',
    fullName: 'Rahul Sharma (Applicant)',
    email: 'applicant@collegeconnect.com',
    role: 'applicant',
    verified_status: false,
    institution_id: null,
    programme_id: null,
  },
  student: {
    userId: 'user-student-senior-1',
    displayName: 'Aman Verma (IIT Bombay CSE)',
    fullName: 'Aman Verma (IIT Bombay CSE)',
    email: 'senior@iitb.ac.in',
    role: 'student',
    verified_status: true,
    institution_id: 'inst-iitb',
    programme_id: 'prog-iitb-cse',
  },
};

export async function setDemoSession(
  role: 'applicant' | 'student',
  customUserId?: string
): Promise<DemoSession> {
  const cookieStore = await cookies();
  const baseProfile = DEMO_PROFILES[role];
  const session: DemoSession = {
    ...baseProfile,
    userId: customUserId || baseProfile.userId,
  };

  const token = await signToken({
    userId: session.userId,
    email: session.email || `${session.userId}@collegeconnect.com`,
    displayName: session.displayName,
    fullName: session.displayName,
    role: session.role,
    verified_status: session.verified_status,
    institution_id: session.institution_id,
    programme_id: session.programme_id,
  });

  cookieStore.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return session;
}

export async function getServerSession(): Promise<(TokenPayload & DemoSession) | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken<TokenPayload>(token);
    if (payload && payload.userId && payload.role) {
      const resolvedName =
        (payload.displayName as string) || (payload.fullName as string) || payload.userId;
      return {
        ...payload,
        userId: payload.userId,
        displayName: resolvedName,
        fullName: (payload.fullName as string) || resolvedName,
        email: payload.email,
        role: payload.role as 'applicant' | 'student',
        verified_status: Boolean(payload.verified_status),
        institution_id: payload.institution_id || null,
        programme_id: payload.programme_id || null,
        college: payload.college || null,
        branch: payload.branch || null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<DemoSession | null> {
  return await getServerSession();
}

export async function getDemoSession(): Promise<DemoSession | null> {
  return await getServerSession();
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });
  cookieStore.set('mock_user_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });
}
