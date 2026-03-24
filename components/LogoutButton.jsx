import { buttonVariants } from 'components/ui/button';

export default function LogoutButton({ returnTo = '/' }) {
    return (
        <form action="/auth/logout" method="post" className="inline-flex">
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
                type="submit"
                className={buttonVariants({
                    variant: 'ghost',
                    className:
                        'rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground'
                })}
            >
                Log out
            </button>
        </form>
    );
}
