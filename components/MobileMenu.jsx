'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from 'lib/cn';
import { buttonVariants } from 'components/ui/button';

export default function MobileMenu({ navItems, isLoggedIn }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    {open ? (
                        <>
                            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                        </>
                    ) : (
                        <>
                            <line x1="3" y1="5"  x2="17" y2="5"  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                        </>
                    )}
                </svg>
            </button>

            {open && (
                <div style={{ flexBasis: '100%' }} className="pb-3 pt-1">
                    <ul className="flex flex-col">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={close}
                                    className="block rounded-full px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground"
                                >
                                    {item.linkText}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-1 px-1">
                        {isLoggedIn ? (
                            <form action="/auth/logout" method="post">
                                <input type="hidden" name="returnTo" value="/" />
                                <button
                                    type="submit"
                                    className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                    Log out
                                </button>
                            </form>
                        ) : (
                            <Link
                                href="/login?redirectTo=%2Fprofile"
                                onClick={close}
                                className={buttonVariants({ variant: 'outline' })}
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
