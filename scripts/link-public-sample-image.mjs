import fs from 'node:fs/promises';
import path from 'node:path';

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUBLIC_IMAGES_DIR = path.join(REPO_ROOT, 'public', 'images');

function usage() {
    return [
        'Usage:',
        '  node scripts/link-public-sample-image.mjs --recipe <id|slug|uuid> --image <path-relative-to-repo-root>',
        '',
        'Examples:',
        '  node scripts/link-public-sample-image.mjs --recipe portra-400 --image "public/images/Ian Will/Portra 400/lighthouse.jpg"',
        '  node scripts/link-public-sample-image.mjs --recipe 42 --image "public/images/OM System/Default - 1/lighthouse.jpg"'
    ].join('\n');
}

function fail(message) {
    throw new Error(message);
}

function parseArgs(argv) {
    const out = {
        recipe: '',
        image: '',
        dryRun: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--recipe') {
            out.recipe = String(argv[i + 1] ?? '').trim();
            i++;
            continue;
        }
        if (arg === '--image') {
            out.image = String(argv[i + 1] ?? '').trim();
            i++;
            continue;
        }
        if (arg === '--dry-run') {
            out.dryRun = true;
            continue;
        }
        if (arg === '--help' || arg === '-h') {
            console.log(usage());
            process.exit(0);
        }
        fail(`Unknown argument: ${arg}\n\n${usage()}`);
    }

    if (!out.recipe || !out.image) {
        fail(`Missing required arguments.\n\n${usage()}`);
    }

    return out;
}

function toPublicImageUrl(relativeImagePath) {
    return `/images/${relativeImagePath.split('/').map(encodeURIComponent).join('/')}`;
}

async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function resolveImagePath(imageArg) {
    const candidate = path.resolve(REPO_ROOT, imageArg);

    const relative = path.relative(PUBLIC_IMAGES_DIR, candidate);
    if (
        !relative ||
        relative.startsWith('..') ||
        path.isAbsolute(relative)
    ) {
        fail(`Image path must be inside ${PUBLIC_IMAGES_DIR}`);
    }

    if (!(await pathExists(candidate))) {
        fail(`Image file not found: ${candidate}`);
    }

    return {
        absolutePath: candidate,
        relativePath: relative.split(path.sep).join('/'),
        publicUrl: toPublicImageUrl(relative.split(path.sep).join('/'))
    };
}

async function findRecipe(sql, recipeIdentifier) {
    const recipeId = Number.parseInt(recipeIdentifier, 10);
    const rows = Number.isFinite(recipeId) && String(recipeId) === recipeIdentifier
        ? await sql`
            SELECT
                r.id,
                r.uuid,
                r.slug,
                r.recipe_name,
                r.author_id,
                a.name AS author_name
            FROM recipes r
            INNER JOIN authors a ON a.id = r.author_id
            WHERE r.id = ${recipeId}
               OR r.slug = ${recipeIdentifier}
               OR r.uuid::text = ${recipeIdentifier}
            ORDER BY CASE
                WHEN r.id = ${recipeId} THEN 0
                WHEN r.slug = ${recipeIdentifier} THEN 1
                ELSE 2
            END
            LIMIT 2
        `
        : await sql`
            SELECT
                r.id,
                r.uuid,
                r.slug,
                r.recipe_name,
                r.author_id,
                a.name AS author_name
            FROM recipes r
            INNER JOIN authors a ON a.id = r.author_id
            WHERE r.slug = ${recipeIdentifier}
               OR r.uuid::text = ${recipeIdentifier}
            ORDER BY CASE
                WHEN r.slug = ${recipeIdentifier} THEN 0
                ELSE 1
            END
            LIMIT 2
        `;

    if (rows.length === 0) {
        fail(`Recipe not found for identifier: ${recipeIdentifier}`);
    }
    if (rows.length > 1) {
        fail(`Recipe identifier is ambiguous: ${recipeIdentifier}. Use an exact numeric id or UUID.`);
    }

    return rows[0];
}

async function findOrCreateImage(sql, { authorId, publicUrl, dryRun }) {
    const existing = await sql`
        SELECT id, uuid, author_id, full_size_url, small_url, valid_exif
        FROM images
        WHERE author_id = ${authorId}
          AND (
              full_size_url = ${publicUrl}
              OR (full_size_url IS NULL AND small_url = ${publicUrl})
          )
        LIMIT 1
    `;

    if (existing.length > 0) {
        return {
            image: existing[0],
            created: false
        };
    }

    if (dryRun) {
        return {
            image: {
                id: null,
                uuid: null,
                author_id: authorId,
                full_size_url: null,
                small_url: publicUrl,
                valid_exif: false
            },
            created: true
        };
    }

    const created = await sql`
        INSERT INTO images (
            author_id,
            full_size_url,
            small_url,
            valid_exif
        )
        VALUES (
            ${authorId},
            null,
            ${publicUrl},
            false
        )
        RETURNING id, uuid, author_id, full_size_url, small_url, valid_exif
    `;

    return {
        image: created[0],
        created: true
    };
}

async function ensureRecipeSampleLink(sql, { recipeId, imageId, authorId, dryRun }) {
    const existing = await sql`
        SELECT recipe_id, image_id, author_id
        FROM recipe_sample_images
        WHERE recipe_id = ${recipeId}
          AND image_id = ${imageId}
        LIMIT 1
    `;

    if (existing.length > 0) {
        if (existing[0].author_id !== authorId && !dryRun) {
            await sql`
                UPDATE recipe_sample_images
                SET author_id = ${authorId}
                WHERE recipe_id = ${recipeId}
                  AND image_id = ${imageId}
            `;
            return { created: false, updatedAuthor: true };
        }

        return { created: false, updatedAuthor: false };
    }

    if (dryRun) {
        return { created: true, updatedAuthor: false };
    }

    await sql`
        INSERT INTO recipe_sample_images (recipe_id, image_id, author_id)
        VALUES (${recipeId}, ${imageId}, ${authorId})
    `;

    return { created: true, updatedAuthor: false };
}

async function main() {
    const { recipe: recipeIdentifier, image: imageArg, dryRun } = parseArgs(process.argv.slice(2));

    if (!process.env.NETLIFY_DATABASE_URL) {
        fail('NETLIFY_DATABASE_URL is not set.');
    }

    const imagePath = await resolveImagePath(imageArg);
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const recipe = await findRecipe(sql, recipeIdentifier);

    const { image, created: imageCreated } = await findOrCreateImage(sql, {
        authorId: recipe.author_id,
        publicUrl: imagePath.publicUrl,
        dryRun
    });

    const linkResult = image.id == null
        ? { created: true, updatedAuthor: false }
        : await ensureRecipeSampleLink(sql, {
            recipeId: recipe.id,
            imageId: image.id,
            authorId: recipe.author_id,
            dryRun
        });

    console.log(JSON.stringify({
        ok: true,
        dryRun,
        recipe: {
            id: recipe.id,
            uuid: recipe.uuid,
            slug: recipe.slug,
            recipeName: recipe.recipe_name,
            authorId: recipe.author_id,
            authorName: recipe.author_name
        },
        imageFile: {
            absolutePath: imagePath.absolutePath,
            relativePath: imagePath.relativePath,
            publicUrl: imagePath.publicUrl
        },
        imageRow: {
            id: image.id,
            uuid: image.uuid,
            authorId: image.author_id,
            fullSizeUrl: image.full_size_url,
            smallUrl: image.small_url,
            validExif: image.valid_exif
        },
        imageCreated,
        recipeSampleLinkCreated: linkResult.created,
        recipeSampleLinkAuthorUpdated: linkResult.updatedAuthor
    }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((err) => {
        console.error(err.message || err);
        process.exitCode = 1;
    });
}
