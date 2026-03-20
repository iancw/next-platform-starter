import { neon } from '@netlify/neon';
import dotenv from 'dotenv';
import path from 'node:path';

// Load local env for scripts (so `node scripts/backfill-recipe-oes-urls.mjs` works locally).
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function sanitize(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/[^a-zA-Z0-9 _]/g, '')
        .replace(/\s+/g, '_');
}

function makeOesUrl(recipe) {
    return `/oes/${sanitize(recipe.authorName)}/${sanitize(recipe.recipeName)}/${sanitize(
        recipe.authorName
    )}_${sanitize(recipe.recipeName)}.oes`;
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

    const summary = {
        recipesScanned: 0,
        rowsNoop: 0,
        rowsWouldUpdate: 0,
        rowsUpdated: 0,
        missingRequiredFields: 0
    };

    // We stream through with LIMIT/OFFSET in chunks, since the table should be small but we
    // still want to avoid loading everything into memory.
    const pageSize = 250;
    let offset = 0;

    while (true) {
        const rows = await sql`
            SELECT id, author_name, recipe_name
            FROM recipes
            ORDER BY id ASC
            LIMIT ${pageSize}
            OFFSET ${offset}
        `;

        if (rows.length === 0) break;
        offset += rows.length;

        for (const row of rows) {
            summary.recipesScanned++;
            if (args.limit != null && summary.recipesScanned > args.limit) break;

            const authorName = row.author_name;
            const recipeName = row.recipe_name;

            if (!authorName || !recipeName) {
                summary.missingRequiredFields++;
                continue;
            }

            // oes_url column removed; script no longer applies
            summary.rowsNoop++;
        }

        if (args.limit != null && summary.recipesScanned >= args.limit) break;
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    });
}
