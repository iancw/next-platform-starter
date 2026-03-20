'use server';

import { db } from '../../db/index.ts';
import { authors } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { findOrCreateAuthorForUser, requireUser } from '../../lib/auth.js';

function normalizeOptionalUrl(v) {
    const s = String(v ?? '').trim();
    if (!s) return null;
    return s;
}

export async function updateMyProfileAction(formData) {
    const session = await requireUser();

    const name = String(formData?.get('name') ?? '').trim();
    if (!name) throw new Error('Name is required');

    const instagramLink = normalizeOptionalUrl(formData?.get('instagramLink'));
    const flickrLink = normalizeOptionalUrl(formData?.get('flickrLink'));
    const website = normalizeOptionalUrl(formData?.get('website'));
    const hasKofiLink = formData?.has('kofiLink');
    const kofiLink = hasKofiLink ? normalizeOptionalUrl(formData?.get('kofiLink')) : undefined;

    const author = await findOrCreateAuthorForUser({
        userId: session.user.id,
        email: session.user.email,
        displayName: name
    });

    await db
        .update(authors)
        .set({
            name,
            instagramLink,
            flickrLink,
            website,
            ...(hasKofiLink ? { kofiLink } : {}),
            updatedAt: new Date()
        })
        .where(eq(authors.id, author.id));

    revalidatePath('/profile');
}
