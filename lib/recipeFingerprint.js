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

function normWhiteBalance(v) {
    const s = normStr(v);
    if (s == null) return null;
    // Treat "Auto" and "Auto (Keep Warm Colors)" as equivalent
    if (s.toLowerCase().startsWith('auto')) return 'auto';
    return s;
}

function colorPayload(s) {
    return {
        yellow: normInt(s?.yellow),
        orange: normInt(s?.orange),
        orangeRed: normInt(s?.orangeRed),
        red: normInt(s?.red),
        magenta: normInt(s?.magenta),
        violet: normInt(s?.violet),
        blue: normInt(s?.blue),
        blueCyan: normInt(s?.blueCyan),
        cyan: normInt(s?.cyan),
        greenCyan: normInt(s?.greenCyan),
        green: normInt(s?.green),
        yellowGreen: normInt(s?.yellowGreen)
    };
}

function sha256(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Fingerprint: saturation wheel only.
 */
export function computeColorFingerprint(recipeSettings) {
    return sha256(colorPayload(recipeSettings));
}

/**
 * Fingerprint: saturation wheel + highlights/shadows/midtones.
 * Excludes contrast, sharpness, and white balance.
 */
export function computeColorToneFingerprint(recipeSettings) {
    return sha256({
        ...colorPayload(recipeSettings),
        highlights: normInt(recipeSettings?.highlights),
        shadows: normInt(recipeSettings?.shadows),
        midtones: normInt(recipeSettings?.midtones)
    });
}

/**
 * Fingerprint: all settings except white balance.
 * Includes saturation wheel + contrast + sharpness + highlights/shadows/midtones.
 */
export function computeNoWbFingerprint(recipeSettings) {
    return sha256({
        ...colorPayload(recipeSettings),
        contrast: normInt(recipeSettings?.contrast),
        sharpness: normInt(recipeSettings?.sharpness),
        highlights: normInt(recipeSettings?.highlights),
        shadows: normInt(recipeSettings?.shadows),
        midtones: normInt(recipeSettings?.midtones)
    });
}

/**
 * Fingerprint: all settings (saturation wheel + sliders + white balance).
 * Intentionally EXCLUDES shadingEffect and exposureCompensation.
 */
export function computeRecipeFingerprint(recipeSettings) {
    const payload = {
        ...colorPayload(recipeSettings),

        // Sliders
        contrast: normInt(recipeSettings?.contrast),
        sharpness: normInt(recipeSettings?.sharpness),
        highlights: normInt(recipeSettings?.highlights),
        shadows: normInt(recipeSettings?.shadows),
        midtones: normInt(recipeSettings?.midtones),

        // White balance
        whiteBalanceTemperature: normInt(recipeSettings?.whiteBalanceTemperature),
        whiteBalanceAmberOffset: normInt(recipeSettings?.whiteBalanceAmberOffset),
        whiteBalanceGreenOffset: normInt(recipeSettings?.whiteBalanceGreenOffset)
    };

    return sha256(payload);
}
