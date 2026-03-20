'use server';
import { db } from '../../db/index.ts';
import { images, recipeComparisonImages, recipeSampleImages, recipes } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
    getObjectStorageClientFromEnv,
    getObjectStorageNamespaceFromEnv,
    headObject,
    createPreauthenticatedRequest
} from '../../lib/oci/objectStorage.js';
import { invokeImageResizeFunction } from '../../lib/oci/functionsInvoke.js';
import { ResizeTimeoutError } from './errors.js';

import { computeRecipeFingerprint } from '../../lib/recipeFingerprint.js';
import { findOrCreateAuthorForUser, requireUser } from '../../lib/auth.js';

const ORIGINAL_BUCKET = process.env.OCI_IMAGES_ORIGINAL_BUCKET;
const RESIZED_BUCKET = process.env.OCI_IMAGES_PROCESSED_BUCKET;
const RESIZE_TIMEOUT_MS = Math.max(0, Number(process.env.IMAGE_RESIZE_TIMEOUT_MS ?? 90000));
const RESIZE_INVOKE_MAX_ATTEMPTS = Math.max(1, Number(process.env.IMAGE_RESIZE_INVOKE_ATTEMPTS ?? 3));
const RESIZE_RETRY_DELAY_MS = Math.max(0, Number(process.env.IMAGE_RESIZE_RETRY_DELAY_MS ?? 1500));

function withResizeTimeout(promise, timeoutMs) {
    if (!timeoutMs || timeoutMs <= 0) return promise;
    let timer;
    return new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            reject(new ResizeTimeoutError(timeoutMs));
        }, timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

function shouldRetryResizeInvoke(err) {
    const message = String(err?.message ?? '').toLowerCase();
    const detailsStatus = err?.details?.status;
    const metadataCode = err?.details?.metadata?.statusCode;
    const explicitStatus = err?.statusCode;
    const status =
        typeof explicitStatus === 'number'
            ? explicitStatus
            : typeof detailsStatus === 'number'
              ? detailsStatus
              : typeof metadataCode === 'number'
                ? metadataCode
                : null;

    return status === 503 || message.includes('server too busy') || message.includes('503');
}

function sleep(ms) {
    if (!ms) return Promise.resolve();
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function invokeResizeWithRetry({ sourceBucket, objectName, destinationBucket, timeoutMs }) {
    let lastError;
    for (let attempt = 1; attempt <= RESIZE_INVOKE_MAX_ATTEMPTS; attempt += 1) {
        try {
            return await withResizeTimeout(
                invokeImageResizeFunction({
                    sourceBucket,
                    objectName,
                    destinationBucket,
                    timeoutMs
                }),
                timeoutMs
            );
        } catch (err) {
            lastError = err;
            const canRetry = shouldRetryResizeInvoke(err);
            if (!canRetry || attempt === RESIZE_INVOKE_MAX_ATTEMPTS) {
                break;
            }
            await sleep(RESIZE_RETRY_DELAY_MS * attempt);
        }
    }
    throw lastError;
}

// OES files are generated dynamically on request at /oes/<slug>.oes

function isBlank(v) {
    return v == null || String(v).trim() === '';
}

function slugify(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

async function uniqueRecipeSlug(base) {
    let slug = base;
    for (let i = 1; i < 1000; i++) {
        const existing = await db.select({ slug: recipes.slug }).from(recipes).where(eq(recipes.slug, slug)).limit(1);
        if (existing.length === 0) return slug;
        slug = `${base}-${i + 1}`;
    }
    throw new Error('Unable to generate a unique slug');
}

function inferImageExtension(file) {
    const name = String(file?.name ?? '');
    const m = name.match(/\.([a-zA-Z0-9]+)$/);
    if (!m) return 'jpg';
    const ext = m[1].toLowerCase();
    // Keep it conservative.
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'tif', 'tiff'].includes(ext)) return ext;
    return 'jpg';
}

function originalUrlForKey(key) {
    return `/assets/images/original/${key}`;
}

function fiveMinutesFromNow() {
    return new Date(Date.now() + 5 * 60 * 1000);
}

function normalizeSha256(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

async function findExistingImageAssociationBySha(sha256) {
    if (!sha256) return null;

    const existing = await db
        .select({ id: images.id })
        .from(images)
        .where(eq(images.sha256Hash, sha256))
        .limit(1);

    if (existing.length === 0) return null;

    const imageId = existing[0].id;

    const [sampleRows, comparisonRows] = await Promise.all([
        db
            .select({
                recipeId: recipes.id,
                recipeSlug: recipes.slug,
                recipeUuid: recipes.uuid,
                recipeName: recipes.recipeName
            })
            .from(recipeSampleImages)
            .innerJoin(recipes, eq(recipeSampleImages.recipeId, recipes.id))
            .where(eq(recipeSampleImages.imageId, imageId))
            .limit(1),
        db
            .select({
                recipeId: recipes.id,
                recipeSlug: recipes.slug,
                recipeUuid: recipes.uuid,
                recipeName: recipes.recipeName
            })
            .from(recipeComparisonImages)
            .innerJoin(recipes, eq(recipeComparisonImages.recipeId, recipes.id))
            .where(eq(recipeComparisonImages.imageId, imageId))
            .limit(1)
    ]);

    if (sampleRows.length > 0) {
        return {
            ...sampleRows[0],
            imageId,
            duplicateType: 'sample'
        };
    }

    if (comparisonRows.length > 0) {
        return {
            ...comparisonRows[0],
            imageId,
            duplicateType: 'comparison'
        };
    }

    return {
        imageId,
        recipeId: null,
        recipeSlug: null,
        recipeUuid: null,
        recipeName: null,
        duplicateType: null
    };
}

// Always be sanitizing data in real sites!
export async function prepareRecipeUploadAction({ parameters }) {
    try {
        const session = await requireUser();

        const { author, name, notes, links, imageMeta, recipeSettings } = parameters ?? {};

        if (isBlank(author) || isBlank(name)) {
            return { ok: false, error: 'Author Name and Recipe Name are required' };
        }
        if (!imageMeta) return { ok: false, error: 'Image metadata is required' };
        if (!recipeSettings) {
            return { ok: false, error: 'Recipe settings (parsed from EXIF) are required' };
        }

        // Enforce maker notes presence: require Color Profile Settings + Tone Level.
        // These are necessary to produce a valid OM recipe match.
        if (!recipeSettings?.hasColorProfileSettings) {
            return {
                ok: false,
                error: 'No recipe found. Upload straight out of camera JPGs from OM-3, Pen-F, or E-P7 cameras.'
            };
        }
        if (!recipeSettings?.hasToneLevel) {
            return {
                ok: false,
                error: 'Missing required maker notes: Tone Level'
            };
        }

        // Server-side validation: only accept JPEG uploads.
        // (Client should already filter, but do not trust it.)
        const contentType = String(imageMeta?.type ?? '').toLowerCase();
       const filename = String(imageMeta?.name ?? '').toLowerCase();
       const isJpeg = contentType === 'image/jpeg' || filename.endsWith('.jpg') || filename.endsWith('.jpeg');
       if (!isJpeg) {
           return { ok: false, error: 'Only JPEG (.jpg/.jpeg) images are accepted' };
       }

        const imageSha = normalizeSha256(imageMeta?.sha256);
        if (!imageSha) {
            return {
                ok: false,
                error: 'Image checksum missing or invalid. Please reselect the file and try again.'
            };
        }

        const duplicate = await findExistingImageAssociationBySha(imageSha);
        if (duplicate) {
            const sampleLabel =
                duplicate.duplicateType === 'comparison'
                    ? 'a comparison image'
                    : 'a sample image';

            let errorMessage = `This image is already on OM Recipes as ${sampleLabel}`;
            if (duplicate.recipeName) {
                errorMessage += ` for "${duplicate.recipeName}"`;
            }

            const recipeIdentifier = duplicate.recipeSlug || duplicate.recipeUuid || duplicate.recipeId;
            if (recipeIdentifier) {
                errorMessage += `. View it at /recipes/${recipeIdentifier}.`;
            } else {
                errorMessage += '.';
            }

            return {
                ok: false,
                error: errorMessage,
                duplicate: {
                    recipeId: duplicate.recipeId,
                    recipeSlug: duplicate.recipeSlug,
                    recipeUuid: duplicate.recipeUuid,
                    duplicateType: duplicate.duplicateType,
                    imageId: duplicate.imageId
                }
            };
        }

        const authorRow = await findOrCreateAuthorForUser({
            userId: session.user.id,
            email: session.user.email,
            displayName: author
        });
        const authorId = authorRow.id;
        const authorUuid = authorRow.uuid;

        const recipeFingerprint = computeRecipeFingerprint(recipeSettings);

        // Dedupe: match existing recipe by fingerprint (settings-only).
        const existingRecipe = await db
            .select({
                id: recipes.id,
                uuid: recipes.uuid,
                slug: recipes.slug,
                recipeName: recipes.recipeName,
                authorName: recipes.authorName
            })
            .from(recipes)
            .where(eq(recipes.recipeFingerprint, recipeFingerprint))
            .limit(1);

        const shouldCreateRecipe = existingRecipe.length === 0;
        const recipeId = shouldCreateRecipe ? null : existingRecipe[0].id;
        const recipeUuid = shouldCreateRecipe ? null : existingRecipe[0].uuid;
        const slug = shouldCreateRecipe ? null : existingRecipe[0].slug;

        let createdRecipeId = recipeId;
        let createdRecipeUuid = recipeUuid;
        let createdSlug = slug;

        if (shouldCreateRecipe) {
            const baseSlug = `${slugify(author)}_${slugify(name)}`;
            createdSlug = await uniqueRecipeSlug(baseSlug);

            // --- db writes
            const recipeRow = await db
                .insert(recipes)
                .values({
                    authorId,
                    slug: createdSlug,
                    recipeName: String(name),
                    authorName: String(author),
                    description: isBlank(notes) ? null : String(notes),

                    recipeFingerprint,

                    yellow: recipeSettings.yellow,
                    orange: recipeSettings.orange,
                    orangeRed: recipeSettings.orangeRed,
                    red: recipeSettings.red,
                    magenta: recipeSettings.magenta,
                    violet: recipeSettings.violet,
                    blue: recipeSettings.blue,
                    blueCyan: recipeSettings.blueCyan,
                    cyan: recipeSettings.cyan,
                    greenCyan: recipeSettings.greenCyan,
                    green: recipeSettings.green,
                    yellowGreen: recipeSettings.yellowGreen,

                    contrast: recipeSettings.contrast,
                    sharpness: recipeSettings.sharpness,
                    highlights: recipeSettings.highlights,
                    shadows: recipeSettings.shadows,
                    midtones: recipeSettings.midtones,

                    // these aren’t currently parsed into recipeSettings; default 0
                    shadingEffect: 0,
                    exposureCompensation: 0,

                    whiteBalance2: recipeSettings.whiteBalance2,
                    whiteBalanceTemperature: recipeSettings.whiteBalanceTemperature,
                    whiteBalanceAmberOffset: recipeSettings.whiteBalanceAmberOffset,
                    whiteBalanceGreenOffset: recipeSettings.whiteBalanceGreenOffset
                })
                .returning({ id: recipes.id, uuid: recipes.uuid, slug: recipes.slug });

            createdRecipeId = recipeRow[0].id;
            createdRecipeUuid = recipeRow[0].uuid;
        }

        if (!createdRecipeId || !createdSlug) {
            throw new Error('Internal error: missing recipe id/slug');
        }

        const imageRow = await db
            .insert(images)
            .values({
                authorId,
                // set after upload so we can include UUID in the object key
                fullSizeUrl: null,
                // async resize means this may not exist immediately, but URL is deterministic
                smallUrl: null,
                originalFileSize: imageMeta?.size || null,
                sha256Hash: imageSha
            })
            .returning({ id: images.id, uuid: images.uuid });

        const imageId = imageRow[0].id;
        const imageUuid = imageRow[0].uuid;

        // --- uploads
        const ext = inferImageExtension(imageMeta);
        const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
        const objectKey = `authors/${authorUuid}/recipes/${createdSlug}/${imageUuid}.${normalizedExt}`;

        const namespaceName = getObjectStorageNamespaceFromEnv();
        const client = getObjectStorageClientFromEnv();

        const parUrl = await createPreauthenticatedRequest({
            client,
            namespaceName,
            bucketName: ORIGINAL_BUCKET,
            objectName: objectKey,
            accessType: 'ObjectWrite',
            expiresAt: fiveMinutesFromNow(),
            name: `upload-${imageUuid}`
        });

        // TODO: store links somewhere (schema doesn’t include yet)
        void links;

        return {
            ok: true,
            parUrl,
            objectKey,
            authorId,
            shouldCreateRecipe,
            slug: createdSlug,
            recipeId: createdRecipeId,
            imageId,
            recipeUuid: createdRecipeUuid,
            imageUuid,
            authorUuid,
            matchedRecipe: shouldCreateRecipe ? null : existingRecipe[0]
        };
    } catch (e) {
        console.error(e);
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function checkImageDuplicateAction({ parameters }) {
    try {
        await requireUser();

        const sha = normalizeSha256(parameters?.sha256);
        if (!sha) {
            return { ok: false, error: 'Invalid image checksum' };
        }

        const duplicate = await findExistingImageAssociationBySha(sha);
        if (!duplicate) {
            return { ok: true, duplicate: null };
        }

        return {
            ok: true,
            duplicate: {
                recipeId: duplicate.recipeId,
                recipeSlug: duplicate.recipeSlug,
                recipeUuid: duplicate.recipeUuid,
                recipeName: duplicate.recipeName,
                duplicateType: duplicate.duplicateType
            }
        };
    } catch (e) {
        console.error(e);
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function finalizeRecipeUploadAction({ parameters }) {
    try {
        await requireUser();

        const {
            recipeId,
            imageId,
            authorId,
            shouldCreateRecipe,
            objectKey,
            originalFileSize
        } = parameters ?? {};

        if (!recipeId || !imageId || !authorId || !objectKey) {
            return { ok: false, error: 'Missing required finalize parameters' };
        }

        // Ensure the image row belongs to the authorId (basic safety check).
        const img = await db
            .select({ id: images.id, authorId: images.authorId, smallUrl: images.smallUrl })
            .from(images)
            .where(eq(images.id, imageId))
            .limit(1);
        if (img.length === 0) return { ok: false, error: 'Image record not found' };
        if (img[0].authorId !== authorId) return { ok: false, error: 'Not authorized' };

        const namespaceName = getObjectStorageNamespaceFromEnv();
        const client = getObjectStorageClientFromEnv();

        // Verify the object exists (helps surface CORS/PAR issues and avoids dangling DB URLs).
        try {
            const headRes = await headObject({
                client,
                namespaceName,
                bucketName: ORIGINAL_BUCKET,
                objectName: objectKey
            });

            // Best-effort validation.
            const len = Number(headRes?.contentLength);
            if (Number.isFinite(len) && originalFileSize != null && Number(originalFileSize) > 0 && len !== Number(originalFileSize)) {
                return {
                    ok: false,
                    error: `Uploaded object size mismatch (expected ${originalFileSize}, got ${len})`
                };
            }
        } catch (e) {
            return {
                ok: false,
                error: `Upload not found in storage (did the direct upload fail or PAR expire?): ${e?.message || String(e)}`
            };
        }

        const fullSizeUrl = originalUrlForKey(objectKey);
        await db
            .update(images)
            .set({
                fullSizeUrl,
                originalFileSize: originalFileSize ?? null
            })
            .where(eq(images.id, imageId));

        await db
            .insert(recipeSampleImages)
            .values({ recipeId, imageId, authorId })
            .onConflictDoNothing();

        const resizedUrl = `/assets/images/600/${objectKey}`;
        const resizedObjectName600 = `600/${objectKey}`;

        const resizeStatus = {
            resizeAttempted: false,
            resizeSucceeded: false,
            resizeSkipped: false
        };

        if (img[0].smallUrl) {
            resizeStatus.resizeSkipped = true;
            resizeStatus.resizeSucceeded = true;
            return { ok: true, fullSizeUrl, ...resizeStatus };
        }

        try {
            resizeStatus.resizeAttempted = true;
            await invokeResizeWithRetry({
                sourceBucket: ORIGINAL_BUCKET,
                objectName: objectKey,
                destinationBucket: RESIZED_BUCKET,
                timeoutMs: RESIZE_TIMEOUT_MS
            });

            try {
                await headObject({
                    client,
                    namespaceName,
                    bucketName: RESIZED_BUCKET,
                    objectName: resizedObjectName600
                });
            } catch (verifyErr) {
                const wrapped = new Error(
                    `Resized object verification failed: ${verifyErr?.message || String(verifyErr)}`
                );
                wrapped.__verify_error = true;
                throw wrapped;
            }

            await db
                .update(images)
                .set({
                    smallUrl: resizedUrl
                })
                .where(eq(images.id, imageId));

            resizeStatus.resizeSucceeded = true;
        } catch (err) {
            let errorType = 'invoke_error';
            if (err instanceof ResizeTimeoutError) {
                errorType = 'timeout';
            } else if (err?.__verify_error) {
                errorType = 'verify_error';
            }
            const warnMessage = err?.message ?? String(err);
            const warnDetails = err?.details ?? (typeof err === 'object' ? err : null);
            const warnPreview = err?.preview ?? null;
            const warnCause = err?.cause ?? null;
            console.warn('Image resize failed', {
                error: warnMessage,
                message: warnMessage,
                errorType,
                details: warnDetails,
                preview: warnPreview,
                cause: warnCause,
                imageId,
                objectKey,
                bucket: RESIZED_BUCKET,
                authorId,
                recipeId
            });
        }

        return { ok: true, fullSizeUrl, ...resizeStatus };
    } catch (e) {
        console.error(e);
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function findRecipeMatchAction({ parameters }) {
    try {
        await requireUser();

        const { recipeSettings } = parameters ?? {};
        if (!recipeSettings) {
            return { ok: false, error: 'Recipe settings are required' };
        }

        const recipeFingerprint = computeRecipeFingerprint(recipeSettings);
        const existing = await db
            .select({
                id: recipes.id,
                uuid: recipes.uuid,
                slug: recipes.slug,
                recipeName: recipes.recipeName,
                authorName: recipes.authorName
            })
            .from(recipes)
            .where(eq(recipes.recipeFingerprint, recipeFingerprint))
            .limit(1);

        if (existing.length === 0) {
            return { ok: true, match: null };
        }

        return { ok: true, match: existing[0] };
    } catch (e) {
        console.error(e);
        return { ok: false, error: e?.message || String(e) };
    }
}
