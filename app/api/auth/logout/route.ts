import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function clearSessionAndRespond(redirectUrl?: string) {
  const response = redirectUrl
    ? NextResponse.redirect(redirectUrl, { status: 303 })
    : NextResponse.json({ success: true, message: 'Logged out successfully.' });

  response.cookies.set({
    name: 'auth_session',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set({
    name: 'mock_user_session',
    value: '',
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const accept = req.headers.get('accept') || '';
  const url = new URL(req.url);

  if (contentType.includes('application/json') || accept.includes('application/json')) {
    return clearSessionAndRespond();
  }

  return clearSessionAndRespond(new URL('/login', url.origin).toString());
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return clearSessionAndRespond(new URL('/login', url.origin).toString());
}
