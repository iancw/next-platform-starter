import { NextResponse } from 'next/server';
import { logoutCurrentSession, normalizeRedirectPath } from '../../../lib/auth.js';
import { publicAppUrl } from '../../../lib/auth-url.js';

export async function GET(request) {
    const returnTo = normalizeRedirectPath(request.nextUrl.searchParams.get('returnTo'), '/');
    await logoutCurrentSession();
    return NextResponse.redirect(publicAppUrl(returnTo, request.nextUrl.origin));
}
