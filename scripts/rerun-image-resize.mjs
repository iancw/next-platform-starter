/**
 * Manually re-run the image resize function for a specific image record.
 *
 * Usage:
 *   node scripts/rerun-image-resize.mjs --image-id <id>
 *   node scripts/rerun-image-resize.mjs --image-id <id> --dry-run
 *
 * The image must already be finalized (i.e. the original was successfully uploaded
 * to OCI object storage and the DB row has prepared_object_key set). This script
 * invokes the resize function, verifies the resized object appears in the processed
 * bucket, and sets small_url on the images row.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

import {
    getObjectStorageClientFromEnv,
    getObjectStorageNamespaceFromEnv,
    headObject
} from '../lib/oci/objectStorage.js';
import { invokeImageResizeFunction } from '../lib/oci/functionsInvoke.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function usage() {
    return [
        'Usage:',
        '  node scripts/rerun-image-resize.mjs --image-id <id>',
        '  node scripts/rerun-image-resize.mjs --image-id <id> --dry-run',
        '',
        'Options:',
        '  --image-id  Numeric DB id of the image row to re-resize',
        '  --dry-run   Look up and print what would happen without invoking the function',
    ].join('\n');
}

function fail(message) {
    throw new Error(message);
}

function parseArgs(argv) {
    const out = { imageId: null, dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--image-id') {
            out.imageId = String(argv[i + 1] ?? '').trim();
            i++;
        } else if (arg === '--dry-run') {
            out.dryRun = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(usage());
            process.exit(0);
        } else {
            fail(`Unknown argument: ${arg}\n\n${usage()}`);
        }
    }
    if (!out.imageId) {
        fail(`Missing required argument: --image-id\n\n${usage()}`);
    }
    const id = Number.parseInt(out.imageId, 10);
    if (!Number.isFinite(id) || id <= 0) {
        fail(`--image-id must be a positive integer, got: ${out.imageId}`);
    }
    out.imageId = id;
    return out;
}

async function main() {
    dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });

    const { imageId, dryRun } = parseArgs(process.argv.slice(2));

    if (!process.env.NETLIFY_DATABASE_URL) {
        fail('NETLIFY_DATABASE_URL is not set.');
    }

    const ORIGINAL_BUCKET = process.env.OCI_IMAGES_ORIGINAL_BUCKET;
    const RESIZED_BUCKET = process.env.OCI_IMAGES_PROCESSED_BUCKET;

    if (!ORIGINAL_BUCKET) fail('OCI_IMAGES_ORIGINAL_BUCKET is not set.');
    if (!RESIZED_BUCKET) fail('OCI_IMAGES_PROCESSED_BUCKET is not set.');

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const rows = await sql`
        SELECT
            i.id,
            i.uuid,
            i.full_size_url,
            i.small_url,
            i.prepared_object_key,
            i.finalized_at,
            i.author_id,
            i.prepared_recipe_id
        FROM images i
        WHERE i.id = ${imageId}
        LIMIT 1
    `;

    if (rows.length === 0) {
        fail(`No image found with id=${imageId}`);
    }

    const img = rows[0];

    console.log('Image record:');
    console.log(`  id:                  ${img.id}`);
    console.log(`  uuid:                ${img.uuid}`);
    console.log(`  prepared_object_key: ${img.prepared_object_key}`);
    console.log(`  full_size_url:       ${img.full_size_url}`);
    console.log(`  small_url:           ${img.small_url ?? '(null — not yet resized)'}`);
    console.log(`  finalized_at:        ${img.finalized_at ?? '(null — not yet finalized)'}`);

    if (!img.prepared_object_key) {
        fail('Image has no prepared_object_key — cannot locate the original in object storage.');
    }

    if (!img.finalized_at) {
        fail('Image has not been finalized yet (finalized_at is null). The original upload may not have completed.');
    }

    if (img.small_url) {
        console.log('\nsmall_url is already set — image has been resized.');
        console.log('Re-running anyway to verify and (if needed) overwrite small_url.');
    }

    const objectKey = img.prepared_object_key;
    const resizedObjectKey = `600/${objectKey}`;
    const resizedUrl = `/assets/images/600/${objectKey}`;

    if (dryRun) {
        console.log('\n[dry-run] Would invoke resize function with:');
        console.log(`  sourceBucket:      ${ORIGINAL_BUCKET}`);
        console.log(`  objectName:        ${objectKey}`);
        console.log(`  destinationBucket: ${RESIZED_BUCKET}`);
        console.log(`  resizedObjectKey:  ${resizedObjectKey}`);
        console.log(`  would set small_url to: ${resizedUrl}`);
        return;
    }

    console.log(`\nInvoking resize function...`);
    console.log(`  sourceBucket:      ${ORIGINAL_BUCKET}`);
    console.log(`  objectName:        ${objectKey}`);
    console.log(`  destinationBucket: ${RESIZED_BUCKET}`);

    await invokeImageResizeFunction({
        sourceBucket: ORIGINAL_BUCKET,
        objectName: objectKey,
        destinationBucket: RESIZED_BUCKET
    });

    console.log('Resize function invoked successfully. Verifying resized object...');

    const storageClient = getObjectStorageClientFromEnv();
    const namespaceName = getObjectStorageNamespaceFromEnv();

    await headObject({
        client: storageClient,
        namespaceName,
        bucketName: RESIZED_BUCKET,
        objectName: resizedObjectKey
    });

    console.log(`Resized object verified at: ${resizedObjectKey}`);

    await sql`
        UPDATE images
        SET small_url = ${resizedUrl}
        WHERE id = ${imageId}
    `;

    console.log(`\nDone. Set small_url = ${resizedUrl} on image id=${imageId}`);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
});
