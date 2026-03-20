import Link from 'next/link';

export default function LoginButton({ redirectTo = '/profile' }) {
    return (
        <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="inline-flex px-1.5 py-1 sm:px-3 sm:py-2">
            Log in
        </Link>
    );
}
