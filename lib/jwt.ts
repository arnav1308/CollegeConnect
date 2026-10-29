import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrethackathonkey';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'applicant' | 'student' | 'moderator';
  fullName?: string;
  displayName?: string;
  verified_status?: boolean | number;
  institution_id?: string | null;
  programme_id?: string | null;
  college?: string | null;
  branch?: string | null;
  grad_year?: string | null;
  [key: string]: unknown;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken<T = TokenPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as T;
  } catch {
    return null;
  }
}
