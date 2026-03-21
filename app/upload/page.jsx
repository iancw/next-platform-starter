import { uploadDisabled } from 'utils';
import { Alert } from 'components/alert';
import { Markdown } from 'components/markdown';
import RecipeUpload from './RecipeUpload';
import { getSession } from '../../lib/auth.js';
import LoginButton from 'components/LoginButton';

export const metadata = {
    title: 'Upload'
};

const explainer = `
Upload a sample image for your recipe -- either a JPG straight out of your camera, or something produced by OM Workspace.
`;

const uploadDisabledText = `
Sorry! Uploads are disabled right now.
`;

export default async function Page() {
    const session = await getSession();
    const user = session?.user;

    return (
        <>
            {uploadDisabled ? (
                <Alert className="mb-6">
                    <Markdown content={uploadDisabledText} />
                </Alert>
            ) : null}
            <h1 className="mb-8">Recipes</h1>
            <Markdown content={explainer} className="mb-12" />
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
        </>
    );
}
