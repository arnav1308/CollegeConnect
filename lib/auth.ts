import { cookies } from 'next/headers';

export const COOKIE_NAME = 'mock_user_session';

export interface DemoSession {
  userId: string;
  displayName: string;
  role: 'applicant' | 'student';
  verified_status: boolean;
  institution_id?: string | null;
  programme_id?: string | null;
}

export const DEMO_PROFILES: Record<'applicant' | 'student', DemoSession> = {
  applicant: {
    userId: 'user-applicant-1',
    displayName: 'Rahul Sharma (Applicant)',
    role: 'applicant',
    verified_status: false,
    institution_id: null,
    programme_id: null,
  },
  student: {
    userId: 'user-student-senior-1',
    displayName: 'Aman Verma (IIT Bombay CSE)',
    role: 'student',
    verified_status: true,
    institution_id: 'inst-iitb',
    programme_id: 'prog-iitb-cse',
  },
};

/**
 * Sets the mock user session cookie
 */
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

  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return session;
}

/**
 * Retrieves and parses the mock user session from cookies
 */
export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie.value) as DemoSession;
    if (!parsed.userId || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears the demo session cookie
 */
export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });
}
