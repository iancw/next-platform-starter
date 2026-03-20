import { notFound } from 'next/navigation';
import { getSession } from '../../../lib/auth.js';
import { db } from '../../../db/index.ts';
import { authors, images, recipeComparisonImages, recipeSampleImages, recipes } from '../../../db/schema.ts';
import { eq, or } from 'drizzle-orm';
import RecipeCard from '../../../components/recipe-card.jsx';
import SampleGallery from '../../../components/SampleGallery.jsx';
import { deleteMyRecipeAction } from '../../my-recipes/actions';
import { deleteRecipeSampleImageAction, updateRecipeAction } from './actions';

export const metadata = {
    title: 'Recipe'
};

async function getRecipeByIdOrSlug(idOrSlug) {
    const v = String(idOrSlug ?? '').trim();
    if (!v) return null;
    // We treat the route param as either a uuid or a slug.
    const rows = await db
        .select({
            id: recipes.id,
            uuid: recipes.uuid,
            slug: recipes.slug,
            recipeName: recipes.recipeName,
            authorName: recipes.authorName,
            description: recipes.description,

            yellow: recipes.yellow,
            orange: recipes.orange,
            orangeRed: recipes.orangeRed,
            red: recipes.red,
            magenta: recipes.magenta,
            violet: recipes.violet,
            blue: recipes.blue,
            blueCyan: recipes.blueCyan,
            cyan: recipes.cyan,
            greenCyan: recipes.greenCyan,
            green: recipes.green,
            yellowGreen: recipes.yellowGreen,

            contrast: recipes.contrast,
            sharpness: recipes.sharpness,
            highlights: recipes.highlights,
            shadows: recipes.shadows,
            midtones: recipes.midtones,

            shadingEffect: recipes.shadingEffect,
            exposureCompensation: recipes.exposureCompensation,

            whiteBalance2: recipes.whiteBalance2,
            whiteBalanceTemperature: recipes.whiteBalanceTemperature,
            whiteBalanceAmberOffset: recipes.whiteBalanceAmberOffset,
            whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset,

            authorId: recipes.authorId,
            authorSocial: {
                instagram: authors.instagramLink,
                flickr: authors.flickrLink,
                website: authors.website,
                kofi: authors.kofiLink
            }
        })
        .from(recipes)
        .leftJoin(authors, eq(authors.id, recipes.authorId))
        // Avoid generating a query with empty parameters which can surface as
        // "params: ,,1" in neon/drizzle errors when the route param is missing.
        .where(or(eq(recipes.slug, v), eq(recipes.uuid, v)))
        .limit(1);

    if (rows.length === 0) return null;
    const base = rows[0];

    const recipeId = base.id;

    const [comparisonRows, sampleRows] = await Promise.all([
        db
            .select({
                label: recipeComparisonImages.label,
                image: {
                    id: images.id,
                    smallUrl: images.smallUrl,
                    fullSizeUrl: images.fullSizeUrl,
                    dimensions: images.dimensions,
                    camera: images.camera,
                    lens: images.lens
                }
            })
            .from(recipeComparisonImages)
            .leftJoin(images, eq(images.id, recipeComparisonImages.imageId))
            .where(eq(recipeComparisonImages.recipeId, recipeId)),

        db
            .select({
                image: {
                    id: images.id,
                    smallUrl: images.smallUrl,
                    fullSizeUrl: images.fullSizeUrl,
                    dimensions: images.dimensions,
                    camera: images.camera,
                    lens: images.lens
                },
                author: {
                    id: authors.id,
                    uuid: authors.uuid,
                    name: authors.name,
                    instagramLink: authors.instagramLink,
                    flickrLink: authors.flickrLink,
                    website: authors.website,
                    kofiLink: authors.kofiLink
                }
            })
            .from(recipeSampleImages)
            .leftJoin(images, eq(images.id, recipeSampleImages.imageId))
            .leftJoin(authors, eq(authors.id, recipeSampleImages.authorId))
            .where(eq(recipeSampleImages.recipeId, recipeId))
    ]);

    const comparisonImages = (comparisonRows ?? [])
        .map((r) => (r.image?.id ? { ...r.image, label: r.label } : null))
        .filter(Boolean);
    const sampleImages = (sampleRows ?? [])
        .map((r) => {
            if (!r?.image?.id) return null;
            return { ...r.image, sampleAuthor: r.author ?? null };
        })
        .filter(Boolean);

    return {
        ...base,
        comparisonImages,
        sampleImages
    };
}

async function getAuthedAuthorIds() {
    const session = await getSession();
    const userId = session?.user?.id ?? null;
    if (userId == null) return [];

    const rows = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.userId, userId));

    return rows.map((row) => row.id);
}

export default async function Page({ params }) {
    // Next.js 16+ passes `params` as a Promise in some runtimes.
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    const resolvedParams = await params;
    const id = decodeURIComponent(resolvedParams?.id ?? '');
    const recipe = await getRecipeByIdOrSlug(id);
    if (!recipe) return notFound();

    const authedAuthorIds = await getAuthedAuthorIds();
    const isOwner = authedAuthorIds.includes(recipe.authorId);

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
            <div className="mt-2">
                <RecipeCard
                    recipe={recipe}
                    isOwner={isOwner}
                    updateRecipeAction={updateRecipeAction}
                    deleteRecipeAction={deleteMyRecipeAction}
                />
            </div>

            <SampleGallery
                images={recipe.sampleImages}
                title="Sample images"
                canDelete={isOwner}
                recipeId={recipe.id}
                recipeName={recipe.recipeName}
                deleteImageAction={deleteRecipeSampleImageAction}
            />
            <SampleGallery images={recipe.comparisonImages} title="Comparison images" />
        </div>
    );
}
