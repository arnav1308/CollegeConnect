import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPrefixes = ['/admissions', '/inbox', '/applicant-tickets', '/rating', '/rated-colleges'];
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    const authSessionCookie = request.cookies.get('auth_session');
    let userPayload: TokenPayload | null = null;

    if (authSessionCookie?.value) {
      userPayload = await verifyToken<TokenPayload>(authSessionCookie.value);
    }

    if (!userPayload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userPayload.userId);
    requestHeaders.set('x-user-role', userPayload.role);
    if (userPayload.email) {
      requestHeaders.set('x-user-email', userPayload.email);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admissions/:path*',
    '/inbox/:path*',
    '/applicant-tickets/:path*',
    '/rating/:path*',
    '/rated-colleges/:path*',
  ],
};
