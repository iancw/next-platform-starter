import Link from 'next/link';
import { buttonVariants } from 'components/ui/button';

export default function LoginButton({ redirectTo = '/profile' }) {
    return (
        <Link
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            className={buttonVariants({ variant: 'outline' })}
        >
            Log in
        </Link>
    );
}
