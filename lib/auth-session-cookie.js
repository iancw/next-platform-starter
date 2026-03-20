export const AUTH_SESSION_COOKIE = 'om_session';
export const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

function nowPlus(ms) {
    return new Date(Date.now() + ms);
}

export function sessionCookieOptions(expiresAt = nowPlus(SESSION_MAX_AGE_MS)) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: expiresAt,
        maxAge: SESSION_MAX_AGE_SECONDS
    };
}

export function refreshSessionCookieIfPresent(request, response) {
    const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
    if (!token) return response;

    response.cookies.set(AUTH_SESSION_COOKIE, token, sessionCookieOptions());
    return response;
}
