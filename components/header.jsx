import Link from 'next/link';
import LogoutButton from 'components/LogoutButton';
import LoginButton from 'components/LoginButton';
import { Badge } from 'components/ui/badge';
import { getSession } from 'lib/auth.js';
import { cn } from 'lib/cn';

const publicNavItems = [
    { linkText: 'Recipes', href: '/' },
    { href: '/how-to', linkText: 'How-to' },
    { href: '/about', linkText: 'About' }
];

const authedNavItems = [
    { linkText: 'Recipes', href: '/' },
    { linkText: 'Upload', href: '/upload' },
    { linkText: 'Samples', href: '/my-samples' },
    { linkText: 'Profile', href: '/profile' },
    { href: '/how-to', linkText: 'How-to' },
    { href: '/about', linkText: 'About' }
];

export async function Header() {
    const session = await getSession();
    const user = session?.user;
    const visibleNavItems = user ? authedNavItems : publicNavItems;

    return (
        <header className="sticky top-0 z-40 -mx-4 mb-8 border-b border-border/70 bg-background/85 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="no-underline">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="rounded-md px-2.5 py-1 tracking-[0.22em]">
                                OM
                            </Badge>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                                    OM Recipes
                                </span>
                                <span className="text-base font-semibold text-foreground">Color Recipe Library</span>
                            </div>
                        </div>
                    </Link>
                </div>
                {!!visibleNavItems?.length && (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                        <ul className="flex flex-wrap gap-2">
                            {visibleNavItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'inline-flex items-center rounded-full px-3 py-2 text-sm no-underline transition-colors',
                                            'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        )}
                                    >
                                        {item.linkText}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div>{user ? <LogoutButton /> : <LoginButton />}</div>
                    </div>
                )}
            </nav>
        </header>
    );
}
