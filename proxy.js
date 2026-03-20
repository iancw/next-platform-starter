import { NextResponse } from 'next/server';
import { refreshSessionCookieIfPresent } from './lib/auth-session-cookie.js';

export async function proxy(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  return refreshSessionCookieIfPresent(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg (favicon file)
     * - public files (images, etc.)
     */
    // Note: exclude .oes so our /oes/<slug>.oes route handler can serve downloads.
    '/((?!_next/static|_next/image|favicon.svg|images|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.oes).*)',
  ],
};
