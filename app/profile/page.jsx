import Link from 'next/link';
import { buttonVariants } from 'components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
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
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Please log in to edit your profile.</CardDescription>
                </CardHeader>
                <CardContent>
                <Link href="/login?redirectTo=%2Fprofile" className={buttonVariants()}>
                    Log in
                </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full">
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        These fields control what’s shown publicly for you as an author profile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <ProfileForm
                    action={updateMyProfileAction}
                    initialValues={{
                        name: author?.name ?? user.name ?? '',
                        instagramLink: author?.instagramLink ?? '',
                        flickrLink: author?.flickrLink ?? '',
                        website: author?.website ?? ''
                    }}
                />
                </CardContent>
            </Card>
        </div>
    );
}
