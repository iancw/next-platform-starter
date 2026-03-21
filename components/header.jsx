import Link from 'next/link';
import LogoutButton from 'components/LogoutButton';
import LoginButton from 'components/LoginButton';
import { getSession } from 'lib/auth.js';

const publicNavItems = [
    { linkText: 'Recipes', href: '/' },
    { href: '/how-to', linkText: 'How-to' }
];

const authedNavItems = [
    { linkText: 'Recipes', href: '/' },
    { linkText: 'Upload', href: '/upload' },
    { linkText: 'My Samples', href: '/my-samples' },
    { linkText: 'Profile', href: '/profile' },
    { href: '/how-to', linkText: 'How-to' }
];

export async function Header() {
    const session = await getSession();
    const user = session?.user;
    const visibleNavItems = user ? authedNavItems : publicNavItems;

    return (
        <nav className="flex flex-wrap items-center justify-end w-full gap-4 pt-6 pb-3">
            {!!visibleNavItems?.length && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {visibleNavItems.map((item, index) => (
                        <li key={index}>
                            <Link href={item.href} className="inline-flex px-1.5 py-1 sm:px-3 sm:py-2">
                                {item.linkText}
                            </Link>
                        </li>
                    ))}
                    {user ? <li key='header-logout-btn'><LogoutButton /> </li>: <li key='header-login-btn'> <LoginButton /> </li>}
                </ul>
            )}
        </nav>
    );
}
