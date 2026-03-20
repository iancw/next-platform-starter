import crypto from 'node:crypto';

function normInt(v) {
    if (v == null) return 0;
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.trunc(n);
}

function normStr(v) {
    const s = String(v ?? '').trim();
    return s || null;
}

/**
 * Compute a stable fingerprint for recipe matching.
 *
 * Includes ONLY:
 * - Saturation wheel values
 * - shadows/midtones/highlights
 * - contrast, sharpness
 * - white balance settings
 *
 * Intentionally EXCLUDES:
 * - shadingEffect
 * - exposureCompensation
 */
export function computeRecipeFingerprint(recipeSettings) {
    const payload = {
        // Saturation wheel
        yellow: normInt(recipeSettings?.yellow),
        orange: normInt(recipeSettings?.orange),
        orangeRed: normInt(recipeSettings?.orangeRed),
        red: normInt(recipeSettings?.red),
        magenta: normInt(recipeSettings?.magenta),
        violet: normInt(recipeSettings?.violet),
        blue: normInt(recipeSettings?.blue),
        blueCyan: normInt(recipeSettings?.blueCyan),
        cyan: normInt(recipeSettings?.cyan),
        greenCyan: normInt(recipeSettings?.greenCyan),
        green: normInt(recipeSettings?.green),
        yellowGreen: normInt(recipeSettings?.yellowGreen),

        // Sliders
        contrast: normInt(recipeSettings?.contrast),
        sharpness: normInt(recipeSettings?.sharpness),
        highlights: normInt(recipeSettings?.highlights),
        shadows: normInt(recipeSettings?.shadows),
        midtones: normInt(recipeSettings?.midtones),

        // White balance
        whiteBalance2: normStr(recipeSettings?.whiteBalance2),
        whiteBalanceTemperature: normInt(recipeSettings?.whiteBalanceTemperature),
        whiteBalanceAmberOffset: normInt(recipeSettings?.whiteBalanceAmberOffset),
        whiteBalanceGreenOffset: normInt(recipeSettings?.whiteBalanceGreenOffset)
    };

    const json = JSON.stringify(payload);
    return crypto.createHash('sha256').update(json).digest('hex');
}
