/**
 * Upload comparison images to the database.
 *
 * Usage:
 *   node scripts/upload-comparison-images.mjs --slug <recipe-slug> --dir <path/to/comparisons>
 *
 * The --dir path should point to a comparisons/ folder whose files are named
 * <label>.jpg (or .jpeg / .png / .webp). The label is derived from the filename
 * (without extension) and stored in recipe_comparison_images.label.
 *
 * The public URL stored in the images table is computed relative to the
 * project's `public/` directory, so the dir must be inside `public/`.
 *
 * Author ID is hardcoded to 19 (the site owner who took all comparison images).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const AUTHOR_ID = 19;
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function parseArgs(argv) {
    const args = argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--slug' && args[i + 1]) result.slug = args[++i];
        else if (args[i] === '--dir' && args[i + 1]) result.dir = args[++i];
    }
    return result;
}

function publicUrlFromAbsPath(absPath) {
    const rel = path.relative(PUBLIC_DIR, absPath);
    if (rel.startsWith('..')) {
        throw new Error(`Path is outside public/: ${absPath}`);
    }
    return '/' + rel.split(path.sep).map(encodeURIComponent).join('/');
}

function labelFromFilename(filename) {
    return path.basename(filename, path.extname(filename));
}

async function main() {
    const { slug, dir } = parseArgs(process.argv);

    if (!slug || !dir) {
        console.error('Usage: node scripts/upload-comparison-images.mjs --slug <recipe-slug> --dir <path/to/comparisons>');
        process.exitCode = 1;
        return;
    }

    if (!process.env.NETLIFY_DATABASE_URL) {
        throw new Error('NETLIFY_DATABASE_URL is not set.');
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const absDir = path.resolve(dir);

    // Verify the directory exists
    try {
        await fs.access(absDir);
    } catch {
        throw new Error(`Directory not found: ${absDir}`);
    }

    // Look up recipe by slug
    const recipeRows = await sql`SELECT id FROM recipes WHERE slug = ${slug} LIMIT 1`;
    if (recipeRows.length === 0) {
        throw new Error(`No recipe found with slug: ${slug}`);
    }
    const recipeId = recipeRows[0].id;
    console.log(`Recipe: ${slug} (id=${recipeId})`);

    // Scan the comparisons directory for image files
    const entries = await fs.readdir(absDir, { withFileTypes: true });
    const imageFiles = entries
        .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
        .map((e) => path.join(absDir, e.name))
        .sort();

    if (imageFiles.length === 0) {
        console.log('No image files found in directory.');
        return;
    }

    console.log(`Found ${imageFiles.length} image(s):`);

    let imagesCreated = 0;
    let linksCreated = 0;
    let skipped = 0;

    for (const filePath of imageFiles) {
        const publicUrl = publicUrlFromAbsPath(filePath);
        const label = labelFromFilename(filePath);

        // Find or create image row
        const existing = await sql`
            SELECT id FROM images
            WHERE author_id = ${AUTHOR_ID} AND small_url = ${publicUrl}
            LIMIT 1
        `;

        let imageId;
        if (existing.length > 0) {
            imageId = existing[0].id;
        } else {
            const [created] = await sql`
                INSERT INTO images (author_id, small_url)
                VALUES (${AUTHOR_ID}, ${publicUrl})
                RETURNING id
            `;
            imageId = created.id;
            imagesCreated++;
        }

        // Link to recipe
        const linkResult = await sql`
            INSERT INTO recipe_comparison_images (recipe_id, image_id, label)
            VALUES (${recipeId}, ${imageId}, ${label})
            ON CONFLICT DO NOTHING
            RETURNING recipe_id
        `;

        if (linkResult.length > 0) {
            linksCreated++;
            console.log(`  + ${label} (image_id=${imageId}, new_image=${existing.length === 0})`);
        } else {
            skipped++;
            console.log(`  ~ ${label} (already linked, skipped)`);
        }
    }

    console.log(`\nDone. images_created=${imagesCreated}, links_created=${linksCreated}, skipped=${skipped}`);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
