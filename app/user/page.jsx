import Link from 'next/link';
import { getSession } from '../../lib/auth.js';

export default async function Page() {
    const session = await getSession();
    const user = session?.user;
    const author = session?.author;

    if (!user) {
        return (
            <div className="max-w-xl py-12">
                <h1 className="mb-4">User</h1>
                <p className="mb-6">You’re not signed in.</p>
                <Link href="/login?redirectTo=%2Fuser" className="btn">
                    Log In
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-xl py-12">
            <h1 className="mb-4">User</h1>
            <div className="action-card">
                <p>Email: {user.email}</p>
                <p>Name: {user.name}</p>
                <p>Author UUID: {author?.uuid ?? 'Not created yet'}</p>
            </div>
        </div>
    );
}
