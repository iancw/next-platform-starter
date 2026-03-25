import { uploadDisabled } from 'utils';
import { Alert } from 'components/alert';
import { Markdown } from 'components/markdown';
import RecipeUpload from './RecipeUpload';
import { getSession } from '../../lib/auth.js';
import LoginButton from 'components/LoginButton';
import { Badge } from 'components/ui/badge';
import { Card, CardContent } from 'components/ui/card';

export const metadata = {
    title: 'Upload'
};

const explainer = `
Upload a sample image for your recipe -- must be a JPG straight out of an OM-3, Pen-F, or E-P7.
`;

const uploadDisabledText = `
Sorry! Uploads are disabled right now.
`;

export default async function Page() {
    const session = await getSession();
    const user = session?.user;

    return (
        <div className="flex w-full flex-col gap-8 pb-10 pt-2">
            {uploadDisabled ? (
                <Alert className="mb-6">
                    <Markdown content={uploadDisabledText} />
                </Alert>
            ) : null}
            <Card className="overflow-hidden border-border/60 bg-card/80">
                <CardContent className="space-y-4 p-6 lg:p-8">
                    <Badge>Upload</Badge>
                    <div className="space-y-3">
                        <h1 className="max-w-3xl">Upload Recipe Samples</h1>
                        <Markdown content={explainer} className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg" />
                    </div>
                </CardContent>
            </Card>
            {!uploadDisabled &&
                <>
                    {user ? (
                        <RecipeUpload initialAuthor={session?.author?.name ?? user?.name ?? ''} />
                    ) : (
                        <>
                        <p className="action-text">
                            Welcome! Please log in to access your protected content.
                        </p>
                        <LoginButton redirectTo="/upload" />
                        </>
                    )}
                </>
            }
        </div>
    );
}
