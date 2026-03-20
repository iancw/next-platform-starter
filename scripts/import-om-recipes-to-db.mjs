import fs from 'node:fs/promises';
import path from 'node:path';

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

// Load local env for scripts (so `npm run db:import:om-recipes` works without extra shell glue).
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OM_RECIPES_PATH = path.join(REPO_ROOT, 'data', 'om-recipes.json');
const PUBLIC_IMAGES_DIR = path.join(REPO_ROOT, 'public', 'images');
const PUBLIC_OES_DIR = path.join(REPO_ROOT, 'public', 'oes');

function isBlank(v) {
    return v == null || String(v).trim() === '';
}

function toIntOrNull(v) {
    if (isBlank(v)) return null;
    const n = Number.parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
}

function toSmallIntOrNull(v) {
    const n = toIntOrNull(v);
    if (n == null) return null;
    // Postgres smallint range
    if (n < -32768 || n > 32767) return null;
    return n;
}

function slugFromJson(recipe) {
    // JSON already contains a stable, unique `id` we can use.
    return String(recipe.id);
}

function sanitizeForOesPath(str) {
    // Must match scripts/generate-oes-files.js
    return String(str)
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}



function wbFromJson(recipe) {
    const wbRaw = isBlank(recipe.WhiteBalance) ? '' : String(recipe.WhiteBalance).trim();
    const keepWarmRaw = isBlank(recipe.KeepWarm) ? '' : String(recipe.KeepWarm).trim();

    // Auto variants
    if (wbRaw === '') {
        if (keepWarmRaw === '') {
            return {
                whiteBalance2: 'Auto',
                whiteBalanceTemperature: null
            };
        }

        if (keepWarmRaw.toLowerCase() === 'off') {
            return {
                whiteBalance2: 'Auto (Keep Warm Color Off)',
                whiteBalanceTemperature: null
            };
        }

        // Some other string (not expected, but don’t drop it)
        return {
            whiteBalance2: `Auto (${keepWarmRaw})`,
            whiteBalanceTemperature: null
        };
    }

    // Numeric temperature => Custom WB 1
    const wbTemp = toIntOrNull(wbRaw);
    if (wbTemp != null) {
        return {
            whiteBalance2: 'Custom WB 1',
            whiteBalanceTemperature: wbTemp
        };
    }

    // Non-numeric string: preserve text; represents an Auto-ish mode.
    // (temperature must be null because schema expects integer)
    return {
        whiteBalance2: wbRaw,
        whiteBalanceTemperature: null
    };
}

function normalizeAutoLabel(wb2) {
    if (!wb2) return false;
    return String(wb2).trim().toLowerCase().startsWith('auto');
}

async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function resolveSampleImagePublicUrl(recipe) {
    const fileName = recipe.SampleImage;
    if (isBlank(fileName)) return null;

    // Prefer the author/name folder convention if it exists.
    // e.g. public/images/Isaac Mitropoulos/Portra 400/isaacm-portra400.jpg
    const candidate1 = path.join(PUBLIC_IMAGES_DIR, recipe.Author ?? '', recipe.Name ?? '', fileName);
    if (await fileExists(candidate1)) {
        return (
            '/images/' +
            [recipe.Author, recipe.Name, fileName]
                .map((s) => String(s))
                .map(encodeURIComponent)
                .join('/')
        );
    }

    // Fallback: some are stored directly under /public/images
    const candidate2 = path.join(PUBLIC_IMAGES_DIR, fileName);
    if (await fileExists(candidate2)) {
        return '/images/' + encodeURIComponent(String(fileName));
    }

    // Last attempt: scan for a matching filename anywhere under public/images.
    // This is slower but should still be fine for a one-time import.
    // If multiple matches exist, we’ll take the first.
    const allFiles = await listFilesRecursive(PUBLIC_IMAGES_DIR);
    const match = allFiles.find((f) => path.basename(f) === fileName);
    if (match) {
        const rel = path.relative(PUBLIC_IMAGES_DIR, match);
        return (
            '/images/' +
            rel
                .split(path.sep)
                .map(encodeURIComponent)
                .join('/')
        );
    }

    return null;
}

async function listFilesRecursive(dir) {
    const out = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            out.push(...(await listFilesRecursive(full)));
        } else {
            out.push(full);
        }
    }
    return out;
}

async function main() {
    if (!process.env.NETLIFY_DATABASE_URL) {
        throw new Error('NETLIFY_DATABASE_URL is not set.');
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const raw = await fs.readFile(OM_RECIPES_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
        throw new Error('Expected om-recipes.json to be a JSON array');
    }

    const summary = {
        recipesProcessed: 0,
        authorsCreated: 0,
        imagesCreated: 0,
        comparisonLinksCreated: 0,
        sampleImageMissing: []
    };

    // cache inside the run
    const authorIdByName = new Map();
    const authorUuidById = new Map();
    const imageIdByAuthorAndUrl = new Map();

    for (const recipe of data) {
        summary.recipesProcessed++;

        const authorName = String(recipe.Author ?? '').trim();
        const recipeName = String(recipe.Name ?? '').trim();
        const slug = slugFromJson(recipe);
        if (!authorName) {
            throw new Error(`Recipe ${slug ?? recipeName ?? '<unknown>'} is missing Author`);
        }

        // --- authors: find-or-create by name
        // NOTE: there is no unique constraint on authors.name in the current schema.
        // We do an explicit lookup to avoid dupes.
        let authorId = authorIdByName.get(authorName);
        if (!authorId) {
            const existing = await sql`SELECT id, uuid FROM authors WHERE name = ${authorName} LIMIT 1`;
            if (existing.length > 0) {
                authorId = existing[0].id;
                authorUuidById.set(authorId, existing[0].uuid);
            } else {
                const created = await sql`INSERT INTO authors (name) VALUES (${authorName}) RETURNING id, uuid`;
                authorId = created[0].id;
                authorUuidById.set(authorId, created[0].uuid);
                summary.authorsCreated++;
            }
            authorIdByName.set(authorName, authorId);
        }

        // --- recipes: upsert by slug
        const wb = wbFromJson(recipe);
        const wb2IsAuto = normalizeAutoLabel(wb.whiteBalance2);

        const [recipeRow] = await sql`
            INSERT INTO recipes (
                author_id,
                slug,
                recipe_name,
                author_name,
                description,
                yellow,
                orange,
                orange_red,
                red,
                magenta,
                violet,
                blue,
                blue_cyan,
                cyan,
                green_cyan,
                green,
                yellow_green,
                contrast,
                sharpness,
                highlights,
                shadows,
                midtones,
                white_balance_2,
                white_balance_temperature,
                white_balance_amber_offset,
                white_balance_green_offset,
                updated_at
            ) VALUES (
                ${authorId},
                ${slug},
                ${recipeName},
                ${authorName},
                ${isBlank(recipe.Notes) ? null : String(recipe.Notes)},
                ${toSmallIntOrNull(recipe.Yellow)},
                ${toSmallIntOrNull(recipe.Orange)},
                ${toSmallIntOrNull(recipe.OrangeRed)},
                ${toSmallIntOrNull(recipe.Red)},
                ${toSmallIntOrNull(recipe.RedMagenta)},
                ${toSmallIntOrNull(recipe.Magenta)},
                ${toSmallIntOrNull(recipe.Blue)},
                ${toSmallIntOrNull(recipe.BlueCyan)},
                ${toSmallIntOrNull(recipe.Cyan)},
                ${toSmallIntOrNull(recipe.CyanGreen)},
                ${toSmallIntOrNull(recipe.Green)},
                ${toSmallIntOrNull(recipe.GreenYellow)},
                ${toSmallIntOrNull(recipe.Contrast)},
                ${toSmallIntOrNull(recipe.Sharpness)},
                ${toSmallIntOrNull(recipe.Highlights)},
                ${toSmallIntOrNull(recipe.Shadows)},
                ${toSmallIntOrNull(recipe.Mids)},
                ${wb.whiteBalance2},
                ${wb2IsAuto ? null : wb.whiteBalanceTemperature},
                ${toSmallIntOrNull(recipe.WhiteBalanceAmberShift)},
                ${toSmallIntOrNull(recipe.WhiteBalanceGreenShift)},
                now()
            )
            ON CONFLICT (slug) DO UPDATE SET
                author_id = EXCLUDED.author_id,
                recipe_name = EXCLUDED.recipe_name,
                author_name = EXCLUDED.author_name,
                description = EXCLUDED.description,
                yellow = EXCLUDED.yellow,
                orange = EXCLUDED.orange,
                orange_red = EXCLUDED.orange_red,
                red = EXCLUDED.red,
                magenta = EXCLUDED.magenta,
                violet = EXCLUDED.violet,
                blue = EXCLUDED.blue,
                blue_cyan = EXCLUDED.blue_cyan,
                cyan = EXCLUDED.cyan,
                green_cyan = EXCLUDED.green_cyan,
                green = EXCLUDED.green,
                yellow_green = EXCLUDED.yellow_green,
                contrast = EXCLUDED.contrast,
                sharpness = EXCLUDED.sharpness,
                highlights = EXCLUDED.highlights,
                shadows = EXCLUDED.shadows,
                midtones = EXCLUDED.midtones,
                white_balance_2 = EXCLUDED.white_balance_2,
                white_balance_temperature = EXCLUDED.white_balance_temperature,
                white_balance_amber_offset = EXCLUDED.white_balance_amber_offset,
                white_balance_green_offset = EXCLUDED.white_balance_green_offset,
                updated_at = now()
            RETURNING id, uuid
        `;
        const recipeId = recipeRow.id;
        void recipeRow.uuid;

        // --- sample image -> images + recipe_comparison_images
        const publicUrl = await resolveSampleImagePublicUrl(recipe);
        if (!publicUrl) {
            summary.sampleImageMissing.push({
                id: recipe.id,
                author: recipe.Author,
                name: recipe.Name,
                sampleImage: recipe.SampleImage
            });
            continue;
        }

        const imageKey = `${authorId}:${publicUrl}`;
        let imageId = imageIdByAuthorAndUrl.get(imageKey);
        if (!imageId) {
            const existingImage = await sql`
                SELECT id, uuid FROM images WHERE author_id = ${authorId} AND full_size_url = ${publicUrl} LIMIT 1
            `;
            if (existingImage.length > 0) {
                imageId = existingImage[0].id;
            } else {
                const createdImage = await sql`
                    INSERT INTO images (author_id, full_size_url, small_url)
                    VALUES (${authorId}, ${publicUrl}, ${publicUrl})
                    RETURNING id, uuid
                `;
                imageId = createdImage[0].id;
                summary.imagesCreated++;
            }
            imageIdByAuthorAndUrl.set(imageKey, imageId);
        }

        const linkRows = await sql`
            INSERT INTO recipe_comparison_images (recipe_id, image_id, label)
            VALUES (${recipeId}, ${imageId}, ${'Sample'})
            ON CONFLICT DO NOTHING
            RETURNING recipe_id
        `;
        if (linkRows.length > 0) summary.comparisonLinksCreated++;
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
    if (summary.sampleImageMissing.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nMissing sample images (first 25):');
        for (const row of summary.sampleImageMissing.slice(0, 25)) {
            // eslint-disable-next-line no-console
            console.log(`- ${row.id}: ${row.author} / ${row.name} (${row.sampleImage})`);
        }
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    });
}
