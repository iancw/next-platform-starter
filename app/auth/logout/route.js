import { NextResponse } from 'next/server';
import { logoutCurrentSession, normalizeRedirectPath } from '../../../lib/auth.js';

export async function GET(request) {
    const returnTo = normalizeRedirectPath(request.nextUrl.searchParams.get('returnTo'), '/');
    await logoutCurrentSession();
    return NextResponse.redirect(new URL(returnTo, request.url));
}
