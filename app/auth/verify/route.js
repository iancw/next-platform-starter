import { NextResponse } from 'next/server';
import { consumeMagicLink } from '../../../lib/auth.js';

const PUBLIC_ERROR_CODES = {
    missing_token: 'missing_token',
    invalid_link: 'invalid_link',
    expired_link: 'expired_link',
    unable_to_sign_in: 'unable_to_sign_in'
};

export async function GET(request) {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', PUBLIC_ERROR_CODES.missing_token);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const result = await consumeMagicLink({
            token,
            ipAddress: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
        });

        return NextResponse.redirect(new URL(result.redirectTo, request.url));
    } catch (error) {
        const message = String(error?.message ?? '');
        let errorCode = PUBLIC_ERROR_CODES.unable_to_sign_in;

        if (message.includes('invalid or has already been used')) {
            errorCode = PUBLIC_ERROR_CODES.invalid_link;
        } else if (message.includes('expired')) {
            errorCode = PUBLIC_ERROR_CODES.expired_link;
        }

        console.error('Magic link verification failed', {
            error: message || String(error)
        });

        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', errorCode);
        return NextResponse.redirect(loginUrl);
    }
}
