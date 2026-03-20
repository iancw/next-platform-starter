import Link from 'next/link';

export default function LogoutButton() {
    return (
        <Link href="/auth/logout" className="inline-flex px-1.5 py-1 sm:px-3 sm:py-2">
            Log out
        </Link>
    );
}
