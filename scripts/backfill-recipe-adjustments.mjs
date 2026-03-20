import fs from 'node:fs/promises';
import path from 'node:path';

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

// Load local env for scripts (so `node scripts/backfill-recipe-adjustments.mjs` works locally).
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OM_RECIPES_PATH = path.join(REPO_ROOT, 'data', 'om-recipes.json');

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

/**
 * JSON values look like: "+0.3", "-0.7", "0", "".
 * DB stores tenths of a stop as smallint.
 *
 * Examples:
 *  "+0.3" -> 3
 *  "-0.7" -> -7
 */
function exposureCompToTenthsOrNull(v) {
    if (isBlank(v)) return null;
    const n = Number.parseFloat(String(v));
    if (!Number.isFinite(n)) return null;
    return toSmallIntOrNull(Math.round(n * 10));
}

function parseArgs(argv) {
    const args = {
        dryRun: false,
        onlyMissing: false,
        limit: null
    };

    for (const a of argv) {
        if (a === '--dry-run') args.dryRun = true;
        else if (a === '--only-missing') args.onlyMissing = true;
        else if (a.startsWith('--limit=')) {
            const n = Number.parseInt(a.split('=')[1] ?? '', 10);
            args.limit = Number.isFinite(n) ? n : null;
        }
    }
    return args;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

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
        recipesInJson: data.length,
        recipesMatchedInDb: 0,
        recipesNotFoundInDb: 0,
        rowsUpdated: 0,
        rowsNoop: 0,
        rowsWouldUpdate: 0,
        missingInDb: []
    };

    let processed = 0;
    for (const recipe of data) {
        processed++;
        if (args.limit != null && processed > args.limit) break;

        const slug = String(recipe.id ?? '').trim();
        if (!slug) continue;

        const desiredShadingEffect = toSmallIntOrNull(recipe.Vignette) ?? 0;
        const desiredExposureComp = exposureCompToTenthsOrNull(recipe.ExposureCompensation) ?? 0;

        const existingRows = await sql`
            SELECT id, shading_effect, exposure_compensation
            FROM recipes
            WHERE slug = ${slug}
            LIMIT 1
        `;

        if (existingRows.length === 0) {
            summary.recipesNotFoundInDb++;
            summary.missingInDb.push({ slug, author: recipe.Author, name: recipe.Name });
            continue;
        }

        summary.recipesMatchedInDb++;
        const existing = existingRows[0];

        const existingShading = Number(existing.shading_effect);
        const existingExposure = Number(existing.exposure_compensation);

        const needsUpdate =
            existingShading !== desiredShadingEffect || existingExposure !== desiredExposureComp;

        // If onlyMissing: only update when DB values are both zero.
        const shouldUpdate = args.onlyMissing
            ? existingShading === 0 && existingExposure === 0 && needsUpdate
            : needsUpdate;

        if (!shouldUpdate) {
            summary.rowsNoop++;
            continue;
        }

        if (args.dryRun) {
            summary.rowsWouldUpdate++;
            continue;
        }

        const updated = await sql`
            UPDATE recipes
            SET shading_effect = ${desiredShadingEffect},
                exposure_compensation = ${desiredExposureComp},
                updated_at = now()
            WHERE id = ${existing.id}
            RETURNING id
        `;

        if (updated.length > 0) summary.rowsUpdated++;
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
    if (summary.missingInDb.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nRecipes present in JSON but not found in DB (first 25):');
        for (const row of summary.missingInDb.slice(0, 25)) {
            // eslint-disable-next-line no-console
            console.log(`- ${row.slug}: ${row.author} / ${row.name}`);
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
