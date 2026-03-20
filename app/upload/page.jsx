import { getNetlifyContext, uploadDisabled } from 'utils';
import { Markdown } from 'components/markdown';
import { ContextAlert } from 'components/context-alert';
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
            <ContextAlert
                addedChecksFunction={(ctx) => {
                    return uploadDisabled ? uploadDisabledText : null;
                }}
                className="mb-6"
            />
            <h1 className="mb-8">Recipes</h1>
            {!!getNetlifyContext() && (
                <>
                    <Markdown content={explainer} className="mb-12" />
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
            )}
        </>
    );
}
