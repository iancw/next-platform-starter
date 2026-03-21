import { NextResponse } from 'next/server';
import { publicAppUrl } from '../../../lib/auth-url.js';

export function GET(request) {
    const url = publicAppUrl('/login', request.nextUrl.origin);
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    if (redirectTo) {
        url.searchParams.set('redirectTo', redirectTo);
    }
    return NextResponse.redirect(url);
}
