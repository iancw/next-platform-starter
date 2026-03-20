import Link from 'next/link';
import { getSession, normalizeRedirectPath } from '../../lib/auth.js';

export const metadata = {
    title: 'Log In'
};

function getErrorMessage(code) {
    switch (String(code ?? '')) {
        case 'invalid_email':
            return 'Please enter a valid email address.';
        case 'missing_token':
            return 'That sign-in link is missing required information.';
        case 'invalid_link':
            return 'That sign-in link is invalid or has already been used.';
        case 'expired_link':
            return 'That sign-in link has expired. Request a new one.';
        case 'unable_to_send':
            return 'Unable to send a sign-in link right now. Please try again.';
        case 'unable_to_sign_in':
            return 'Unable to complete sign-in right now. Please try again.';
        default:
            return '';
    }
}

export default async function LoginPage({ searchParams }) {
    const session = await getSession();
    const resolvedSearchParams = await searchParams;
    const redirectTo = normalizeRedirectPath(resolvedSearchParams?.redirectTo, '/profile');
    const sent = resolvedSearchParams?.sent === '1';
    const error = getErrorMessage(resolvedSearchParams?.error);

    if (session?.user) {
        return (
            <div className="max-w-xl py-12">
                <h1 className="mb-4">Log In</h1>
                <p className="mb-6">You’re already signed in as {session.user.email}.</p>
                <Link href={redirectTo} className="btn">
                    Continue
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl py-12">
            <h1 className="mb-4">Log In</h1>
            <p className="mb-6">
                Enter your email address and OM Recipes will send you a one-time magic link. Sessions roll for 14
                days while you stay active.
            </p>

            {sent ? (
                <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                    Check your email for a sign-in link.
                </div>
            ) : null}

            {error ? (
                <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
            ) : null}

            <form action="/auth/request-link" method="post" className="flex flex-col gap-4">
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-700">Email address</span>
                    <input
                        className="input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                    />
                </label>

                <div className="pt-2">
                    <button type="submit" className="btn">
                        Send Magic Link
                    </button>
                </div>
            </form>
        </div>
    );
}
