import Link from 'next/link';
import { and, desc, eq, inArray, notInArray } from 'drizzle-orm';
import MySamplesGrid from '../../components/MySamplesGrid.jsx';
import { db } from '../../db/index.ts';
import { authors, images, recipeSampleImages, recipes } from '../../db/schema.ts';
import { getSession } from '../../lib/auth.js';
import { deleteMySampleImageAction } from './actions.js';

export const metadata = {
    title: 'My Samples'
};

async function getSampleImagesUploadedByUserId({ userId, limit = 500 }) {
    const uploaderRows = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.userId, userId));

    if (uploaderRows.length === 0) return [];

    const uploaderAuthorIds = uploaderRows.map((row) => row.id);

    return db
        .select({
            recipeId: recipes.id,
            recipeUuid: recipes.uuid,
            recipeSlug: recipes.slug,
            recipeName: recipes.recipeName,
            recipeAuthorName: recipes.authorName,
            image: {
                id: images.id,
                smallUrl: images.smallUrl,
                fullSizeUrl: images.fullSizeUrl,
                dimensions: images.dimensions,
                camera: images.camera,
                lens: images.lens
            }
        })
        .from(recipeSampleImages)
        .innerJoin(recipes, eq(recipes.id, recipeSampleImages.recipeId))
        .leftJoin(images, eq(images.id, recipeSampleImages.imageId))
        .where(
            and(
                inArray(recipeSampleImages.authorId, uploaderAuthorIds),
                notInArray(recipes.authorId, uploaderAuthorIds)
            )
        )
        .orderBy(desc(images.createdAt))
        .limit(limit);
}

export default async function Page() {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
        return (
            <>
                <h1 className="mb-4">My Samples</h1>
                <p className="action-text mb-4">Welcome! Please log in to access your protected content.</p>
                <Link href="/login?redirectTo=%2Fmy-samples" className="inline-block px-4 py-2 rounded bg-blue-600 text-white">
                    Log in
                </Link>
            </>
        );
    }

    const uploadedSamples = await getSampleImagesUploadedByUserId({ userId: user.id });

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
            <div className="flex flex-col md:pt-0 md:flex-row items-start justify-between w-full">
                <h1 className="text-3xl font-bold mb-6 flex-shrink-0">My Samples</h1>
            </div>

            {uploadedSamples.length === 0 ? (
                <div className="text-gray-600">
                    <p className="mb-4">You haven’t uploaded any sample images to other authors’ recipes yet.</p>
                    <Link href="/upload" className="text-blue-600 underline">
                        Upload your first sample
                    </Link>
                </div>
            ) : (
                <MySamplesGrid samples={uploadedSamples} deleteSampleAction={deleteMySampleImageAction} />
            )}
        </div>
    );
}
