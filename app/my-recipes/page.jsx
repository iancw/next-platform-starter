import Link from 'next/link';
import { getSession } from '../../lib/auth.js';
import { db } from '../../db/index.ts';
import { authors, images, recipeComparisonImages, recipeSampleImages, recipes } from '../../db/schema.ts';
import { eq, inArray, desc } from 'drizzle-orm';

export const metadata = {
    title: 'My Recipes'
};

/**
 * Fetch recipes owned by the currently logged-in first-party user.
 * Ownership rule: authors.user_id === session.user.id.
 *
 * We hydrate image arrays similarly to app/recipes/search/route.js to keep UI consistent.
 */
async function getRecipesOwnedByUserId({ userId, limit = 500 }) {
    // Base recipes
    const baseRecipes = await db
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

            createdAt: recipes.createdAt
        })
        .from(recipes)
        .innerJoin(authors, eq(authors.id, recipes.authorId))
        .where(eq(authors.userId, userId))
        .orderBy(desc(recipes.createdAt))
        .limit(limit);

    const recipeIds = baseRecipes.map((r) => r.id);
    if (recipeIds.length === 0) return [];

    const [comparisonRows, sampleRows] = await Promise.all([
        db
            .select({
                recipeId: recipeComparisonImages.recipeId,
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
            .where(inArray(recipeComparisonImages.recipeId, recipeIds)),

        db
            .select({
                recipeId: recipeSampleImages.recipeId,
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
            .where(inArray(recipeSampleImages.recipeId, recipeIds))
    ]);

    function groupByRecipeId(rows, mapRow) {
        const grouped = new Map();
        for (const row of rows) {
            const recipeId = row.recipeId;
            const mapped = mapRow(row);
            if (!mapped) continue;

            let list = grouped.get(recipeId);
            if (!list) {
                list = [];
                grouped.set(recipeId, list);
            }

            if (mapped?.id != null && list.some((x) => x?.id === mapped.id)) continue;
            list.push(mapped);
        }
        return grouped;
    }

    const comparisonByRecipeId = groupByRecipeId(comparisonRows, (row) => {
        if (!row.image?.id) return null;
        return { ...row.image, label: row.label };
    });

    const sampleImagesByRecipeId = groupByRecipeId(sampleRows, (row) => {
        if (!row.image?.id) return null;
        return { ...row.image, sampleAuthor: row.author ?? null };
    });

    return baseRecipes.map((r) => ({
        ...r,
        comparisonImages: comparisonByRecipeId.get(r.id) ?? [],
        sampleImages: sampleImagesByRecipeId.get(r.id) ?? []
    }));
}

export default async function Page() {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
        return (
            <>
                <h1 className="mb-4">My Recipes</h1>
                <p className="action-text mb-4">Welcome! Please log in to access your protected content.</p>
                <Link href="/login?redirectTo=%2Fmy-recipes" className="inline-block px-4 py-2 rounded bg-blue-600 text-white">
                    Log in
                </Link>
            </>
        );
    }

    const owned = await getRecipesOwnedByUserId({ userId: user.id });

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
            <div className="flex flex-col md:pt-0 md:flex-row items-start justify-between w-full">
                <h1 className="text-3xl font-bold mb-6 flex-shrink-0">My Recipes</h1>
            </div>

            {owned.length === 0 ? (
                <div className="text-gray-600">
                    <p className="mb-4">You don’t have any recipes yet.</p>
                    <Link href="/upload" className="text-blue-600 underline">
                        Upload your first recipe
                    </Link>
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
                    {owned.map((r) => (
                        <li key={r.uuid ?? r.slug} className="p-0">
                            <div
                                className="recipe-simple-card"
                                style={{
                                    position: 'relative',
                                    border: '1px solid #eee',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    margin: '1rem auto',
                                    background: '#fafbfc',
                                    maxWidth: '600px',
                                    width: '100%'
                                }}
                            >
                                <Link href={`/recipes/${encodeURIComponent(r.uuid ?? r.slug)}`} className="block">
                                    {/* Preview image (prefer first sample image) */}
                                    {(() => {
                                        const preview = r?.sampleImages?.[0] ?? null;
                                        const src = preview?.smallUrl ?? preview?.fullSizeUrl ?? null;
                                        if (!src) return null;
                                        return (
                                            <img
                                                src={src}
                                                alt={`${r.recipeName} sample`}
                                                style={{
                                                    borderRadius: '6px',
                                                    maxWidth: '100%',
                                                    height: 'auto',
                                                    marginBottom: '0.75rem'
                                                }}
                                            />
                                        );
                                    })()}

                                    <h3 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.35rem', lineHeight: 1.1 }}>
                                        {r.recipeName}
                                    </h3>
                                    <div style={{ color: '#555' }}>
                                        <div style={{ fontSize: '0.95rem' }}>{r.authorName}</div>
                                        {r.description ? (
                                            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                                                {String(r.description).slice(0, 200)}
                                                {String(r.description).length > 200 ? '…' : ''}
                                            </div>
                                        ) : null}
                                    </div>
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
