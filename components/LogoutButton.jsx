export default function LogoutButton({ returnTo = '/' }) {
    return (
        <form action="/auth/logout" method="post" className="inline-flex">
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="inline-flex px-1.5 py-1 sm:px-3 sm:py-2 cursor-pointer">
                Log out
            </button>
        </form>
    );
}
