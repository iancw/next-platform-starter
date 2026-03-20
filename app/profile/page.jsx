import Link from 'next/link';
import { getSession } from '../../lib/auth.js';
import { updateMyProfileAction } from './actions';
import { ProfileForm } from './profile-form';

export const metadata = {
    title: 'Profile'
};

export default async function Page() {
    const session = await getSession();
    const user = session?.user;
    const author = session?.author;

    if (!user) {
        return (
            <>
                <h1 className="mb-4">Profile</h1>
                <p className="action-text mb-4">Please log in to edit your profile.</p>
                <Link href="/login?redirectTo=%2Fprofile" className="inline-block px-4 py-2 rounded bg-blue-600 text-white">
                    Log in
                </Link>
            </>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
            <div className="max-w-xl w-full">
                <h1 className="text-3xl font-bold mb-6">Profile</h1>

                <p className="text-gray-600 mb-6">
                    These fields control what’s shown publicly for you as an author profile.
                </p>

                <ProfileForm
                    action={updateMyProfileAction}
                    initialValues={{
                        name: author?.name ?? user.name ?? '',
                        instagramLink: author?.instagramLink ?? '',
                        flickrLink: author?.flickrLink ?? '',
                        website: author?.website ?? ''
                    }}
                />
            </div>
        </div>
    );
}
