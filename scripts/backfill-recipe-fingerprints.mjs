import 'dotenv/config';
import { db } from '../db/index.ts';
import { recipes } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { computeRecipeFingerprint } from '../lib/recipeFingerprint.js';

async function main() {
    const rows = await db
        .select({
            id: recipes.id,

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

            whiteBalance2: recipes.whiteBalance2,
            whiteBalanceTemperature: recipes.whiteBalanceTemperature,
            whiteBalanceAmberOffset: recipes.whiteBalanceAmberOffset,
            whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset
        })
        .from(recipes);

    let updated = 0;
    for (const r of rows) {
        const fp = computeRecipeFingerprint(r);
        // eslint-disable-next-line no-await-in-loop
        await db.update(recipes).set({ recipeFingerprint: fp, updatedAt: new Date() }).where(eq(recipes.id, r.id));
        updated++;
    }

    console.log(`Backfilled ${updated} recipe fingerprints`);
}

await main();
