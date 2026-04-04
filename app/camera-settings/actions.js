'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '../../db/index.ts';
import { modeSlotAssignments } from '../../db/schema.ts';
import { requireUser } from '../../lib/auth.js';

const VALID_MODE_POSITIONS = new Set(['c1', 'c2', 'c3', 'c4', 'c5', 'pasmb']);
const VALID_COLOR_SLOTS = new Set([1, 2, 3, 4]);

function validateArgs(modePosition, colorSlot) {
    if (!VALID_MODE_POSITIONS.has(modePosition)) {
        throw new Error('Invalid mode position');
    }
    const slot = Number(colorSlot);
    if (!VALID_COLOR_SLOTS.has(slot)) {
        throw new Error('Invalid color slot');
    }
    return slot;
}

export async function upsertModeSlotAssignment(modePosition, colorSlot, recipeId) {
    const session = await requireUser();
    const userId = session.user.id;
    const slot = validateArgs(modePosition, colorSlot);
    const normalizedRecipeId = Number(recipeId);
    if (!Number.isFinite(normalizedRecipeId) || normalizedRecipeId <= 0) {
        throw new Error('Invalid recipe id');
    }

    await db
        .insert(modeSlotAssignments)
        .values({ userId, modePosition, colorSlot: slot, recipeId: normalizedRecipeId })
        .onConflictDoUpdate({
            target: [modeSlotAssignments.userId, modeSlotAssignments.modePosition, modeSlotAssignments.colorSlot],
            set: { recipeId: normalizedRecipeId }
        });

    revalidatePath('/camera-settings');
}

export async function clearModeSlotAssignment(modePosition, colorSlot) {
    const session = await requireUser();
    const userId = session.user.id;
    const slot = validateArgs(modePosition, colorSlot);

    await db
        .delete(modeSlotAssignments)
        .where(
            and(
                eq(modeSlotAssignments.userId, userId),
                eq(modeSlotAssignments.modePosition, modePosition),
                eq(modeSlotAssignments.colorSlot, slot)
            )
        );

    revalidatePath('/camera-settings');
}
