import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { modeSlotAssignments, recipes } from '../db/schema.ts';

/**
 * Returns all mode slot assignments for a user, with joined recipe data.
 * Rows where recipeId is null indicate the recipe was deleted (cascade-nullified).
 */
export async function getUserModeAssignments(userId) {
    const rows = await db
        .select({
            modePosition: modeSlotAssignments.modePosition,
            colorSlot: modeSlotAssignments.colorSlot,
            recipeId: modeSlotAssignments.recipeId,
            recipeSlug: recipes.slug,
            recipeName: recipes.recipeName,
            authorName: recipes.authorName,
            // Color wheel
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
            // Tone curve
            shadows: recipes.shadows,
            midtones: recipes.midtones,
            highlights: recipes.highlights,
            // White balance
            whiteBalance2: recipes.whiteBalance2,
            whiteBalanceTemperature: recipes.whiteBalanceTemperature,
            whiteBalanceAmberOffset: recipes.whiteBalanceAmberOffset,
            whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset,
        })
        .from(modeSlotAssignments)
        .leftJoin(recipes, eq(modeSlotAssignments.recipeId, recipes.id))
        .where(eq(modeSlotAssignments.userId, userId))
        .orderBy(asc(modeSlotAssignments.modePosition), asc(modeSlotAssignments.colorSlot));

    return rows.map((row) => ({
        modePosition: row.modePosition,
        colorSlot: row.colorSlot,
        recipeId: row.recipeId,
        // recipeId is null and row exists → recipe was deleted (cascade set null)
        recipeNotFound: row.recipeId === null,
        recipeSlug: row.recipeSlug ?? null,
        recipeName: row.recipeName ?? null,
        authorName: row.authorName ?? null,
        colorWheelValues: row.recipeId !== null
            ? [
                  Number(row.yellow ?? 0),
                  Number(row.orange ?? 0),
                  Number(row.orangeRed ?? 0),
                  Number(row.red ?? 0),
                  Number(row.magenta ?? 0),
                  Number(row.violet ?? 0),
                  Number(row.blue ?? 0),
                  Number(row.blueCyan ?? 0),
                  Number(row.cyan ?? 0),
                  Number(row.greenCyan ?? 0),
                  Number(row.green ?? 0),
                  Number(row.yellowGreen ?? 0)
              ]
            : null,
        shadows: row.shadows ?? null,
        midtones: row.midtones ?? null,
        highlights: row.highlights ?? null,
        whiteBalance2: row.whiteBalance2 ?? null,
        whiteBalanceTemperature: row.whiteBalanceTemperature ?? null,
        whiteBalanceAmberOffset: row.whiteBalanceAmberOffset ?? null,
        whiteBalanceGreenOffset: row.whiteBalanceGreenOffset ?? null,
    }));
}

/**
 * Returns all recipes with the fields needed for the mode slot editor:
 * id, recipeName, authorName, whiteBalance2, and the 12 color wheel values.
 */
export async function getAllRecipesForModeEditor() {
    return db
        .select({
            id: recipes.id,
            slug: recipes.slug,
            recipeName: recipes.recipeName,
            authorName: recipes.authorName,
            whiteBalance2: recipes.whiteBalance2,
            whiteBalanceTemperature: recipes.whiteBalanceTemperature,
            whiteBalanceAmberOffset: recipes.whiteBalanceAmberOffset,
            whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset,
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
            yellowGreen: recipes.yellowGreen
        })
        .from(recipes)
        .orderBy(asc(recipes.recipeName));
}
