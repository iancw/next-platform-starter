import { NextResponse } from 'next/server';

export function GET(request) {
    const url = new URL('/login', request.url);
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    if (redirectTo) {
        url.searchParams.set('redirectTo', redirectTo);
    }
    return NextResponse.redirect(url);
}
