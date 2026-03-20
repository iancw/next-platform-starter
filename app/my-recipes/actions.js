'use server';

import { db } from '../../db/index.ts';
import { authors, recipeComparisonImages, recipeSampleImages, recipes } from '../../db/schema.ts';
import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '../../lib/auth.js';
import { deleteOrphanedImagesByIds } from '../../lib/oci/deleteOrphanedImages.js';

export async function deleteMyRecipeAction(formData) {
    const recipeIdRaw = formData?.get('recipeId');
    const recipeId = Number(recipeIdRaw);
    const confirmName = String(formData?.get('confirmName') ?? '').trim();

    const session = await requireUser();
    if (!Number.isFinite(recipeId)) throw new Error('Invalid recipe id');

    // Load recipe and ensure ownership + confirm text.
    const authorRows = await db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.userId, session.user.id));

    if (authorRows.length === 0) throw new Error('Author record not found');
    const authorIds = authorRows.map((row) => row.id);

    const recipeRows = await db
        .select({ id: recipes.id, authorId: recipes.authorId, recipeName: recipes.recipeName })
        .from(recipes)
        .where(and(eq(recipes.id, recipeId), inArray(recipes.authorId, authorIds)))
        .limit(1);

    if (recipeRows.length === 0) throw new Error('Recipe not found');

    const recipeRow = recipeRows[0];
    if (!confirmName || confirmName !== recipeRow.recipeName) {
        throw new Error('Confirmation text did not match recipe name');
    }

    // Gather potentially-associated image ids before deleting the recipe.
    const [sampleImageIds, comparisonImageIds] = await Promise.all([
        db
            .select({ imageId: recipeSampleImages.imageId })
            .from(recipeSampleImages)
            .where(eq(recipeSampleImages.recipeId, recipeId)),
        db
            .select({ imageId: recipeComparisonImages.imageId })
            .from(recipeComparisonImages)
            .where(eq(recipeComparisonImages.recipeId, recipeId))
    ]);

    const associatedImageIds = Array.from(
        new Set(
            [...sampleImageIds, ...comparisonImageIds]
                .map((r) => r.imageId)
                .filter((v) => v != null)
        )
    );

    // Delete the recipe row (join rows will cascade).
    const deleted = await db.delete(recipes).where(eq(recipes.id, recipeId)).returning({ id: recipes.id });

    // If we didn't delete anything (wrong owner / already deleted), don't touch images.
    if (deleted.length > 0 && associatedImageIds.length > 0) {
        await deleteOrphanedImagesByIds(associatedImageIds);
    }

    revalidatePath('/my-recipes');
    redirect('/my-recipes');
}
