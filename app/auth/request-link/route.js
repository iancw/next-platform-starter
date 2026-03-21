import { NextResponse } from 'next/server';
import { normalizeRedirectPath, sendMagicLinkEmail } from '../../../lib/auth.js';
import { publicAppUrl } from '../../../lib/auth-url.js';

const PUBLIC_ERROR_CODES = {
    invalid_email: 'invalid_email',
    unable_to_send: 'unable_to_send'
};

function redirectWithParams(request, values) {
    const url = publicAppUrl('/login', request.nextUrl.origin);
    for (const [key, value] of Object.entries(values)) {
        if (value == null || value === '') continue;
        url.searchParams.set(key, String(value));
    }
    return NextResponse.redirect(url);
}

export async function POST(request) {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '');
    const redirectTo = normalizeRedirectPath(formData.get('redirectTo'), '/profile');

    try {
        await sendMagicLinkEmail({
            email,
            baseUrl: request.nextUrl.origin,
            redirectTo,
            requestedIp: request.headers.get('x-forwarded-for'),
            requestedUserAgent: request.headers.get('user-agent')
        });

        return redirectWithParams(request, {
            sent: '1',
            redirectTo
        });
    } catch (error) {
        const message = String(error?.message ?? '');
        const errorCode =
            message === 'Please enter a valid email address'
                ? PUBLIC_ERROR_CODES.invalid_email
                : PUBLIC_ERROR_CODES.unable_to_send;

        console.error('Magic link request failed', {
            error: message || String(error),
            email
        });

        return redirectWithParams(request, {
            error: errorCode,
            redirectTo
        });
    }
}
