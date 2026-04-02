import { describe, it, expect } from 'vitest';
import {
    computeRecipeFingerprint,
    computeColorFingerprint,
    computeColorToneFingerprint,
    computeNoWbFingerprint
} from '../lib/recipeFingerprint.js';
import crypto from 'node:crypto';

// Canonical settings used as a stable baseline throughout these tests.
const BASE_SETTINGS = {
    yellow: 5, orange: 4, orangeRed: 3, red: 1,
    magenta: 1, violet: 1, blue: 1, blueCyan: 1,
    cyan: 1, greenCyan: 3, green: 4, yellowGreen: 5,
    contrast: -1, sharpness: 3,
    highlights: 2, shadows: -2, midtones: 0,
    whiteBalance2: 'Custom WB 1',
    whiteBalanceTemperature: 5800,
    whiteBalanceAmberOffset: 2,
    whiteBalanceGreenOffset: 1,
};

function expectedHash(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

describe('computeRecipeFingerprint', () => {
    it('returns a 64-character hex string', () => {
        const fp = computeRecipeFingerprint(BASE_SETTINGS);
        expect(fp).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic — same settings produce the same fingerprint', () => {
        expect(computeRecipeFingerprint(BASE_SETTINGS))
            .toBe(computeRecipeFingerprint({ ...BASE_SETTINGS }));
    });

    it('changes when a saturation wheel value changes', () => {
        const fp1 = computeRecipeFingerprint(BASE_SETTINGS);
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, yellow: 0 });
        expect(fp1).not.toBe(fp2);
    });

    it('changes when a tone slider value changes', () => {
        const fp1 = computeRecipeFingerprint(BASE_SETTINGS);
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, shadows: 0 });
        expect(fp1).not.toBe(fp2);
    });

    it('changes when white balance temperature changes', () => {
        const fp1 = computeRecipeFingerprint(BASE_SETTINGS);
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, whiteBalanceTemperature: 4000 });
        expect(fp1).not.toBe(fp2);
    });

    it('treats null and 0 as equivalent for numeric fields (normInt coercion)', () => {
        const withNull = computeRecipeFingerprint({ ...BASE_SETTINGS, highlights: null });
        const withZero = computeRecipeFingerprint({ ...BASE_SETTINGS, highlights: 0 });
        expect(withNull).toBe(withZero);
    });

    it('excludes whiteBalance2 from the fingerprint', () => {
        const fp1 = computeRecipeFingerprint({ ...BASE_SETTINGS, whiteBalance2: 'Custom WB 1' });
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, whiteBalance2: '5300K (Fine Weather)' });
        expect(fp1).toBe(fp2);
    });

    it('excludes whiteBalance2 from the fingerprint', () => {
        const fp1 = computeRecipeFingerprint({ ...BASE_SETTINGS, whiteBalance2: 'Custom WB 1', whiteBalanceTemperature: 5300 });
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, whiteBalance2: '5300K (Fine Weather)', whiteBalanceTemperature: 5300 });
        expect(fp1).toBe(fp2);
    });

    it('excludes exposureCompensation from the fingerprint', () => {
        const fp1 = computeRecipeFingerprint(BASE_SETTINGS);
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, exposureCompensation: '+1.0' });
        expect(fp1).toBe(fp2);
    });

    it('excludes shadingEffect from the fingerprint', () => {
        const fp1 = computeRecipeFingerprint(BASE_SETTINGS);
        const fp2 = computeRecipeFingerprint({ ...BASE_SETTINGS, shadingEffect: 3 });
        expect(fp1).toBe(fp2);
    });

    it('handles a null/undefined input without throwing', () => {
        expect(() => computeRecipeFingerprint(null)).not.toThrow();
        expect(() => computeRecipeFingerprint(undefined)).not.toThrow();
    });

    it('all four fingerprints differ from each other for the same settings', () => {
        const fps = [
            computeColorFingerprint(BASE_SETTINGS),
            computeColorToneFingerprint(BASE_SETTINGS),
            computeNoWbFingerprint(BASE_SETTINGS),
            computeRecipeFingerprint(BASE_SETTINGS)
        ];
        expect(new Set(fps).size).toBe(4);
    });
});

describe('computeColorFingerprint', () => {
    it('returns a 64-character hex string', () => {
        expect(computeColorFingerprint(BASE_SETTINGS)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('changes when a saturation wheel value changes', () => {
        expect(computeColorFingerprint(BASE_SETTINGS))
            .not.toBe(computeColorFingerprint({ ...BASE_SETTINGS, yellow: 0 }));
    });

    it('is unaffected by highlights/shadows/midtones', () => {
        expect(computeColorFingerprint(BASE_SETTINGS))
            .toBe(computeColorFingerprint({ ...BASE_SETTINGS, highlights: 99, shadows: 99, midtones: 99 }));
    });

    it('is unaffected by contrast and sharpness', () => {
        expect(computeColorFingerprint(BASE_SETTINGS))
            .toBe(computeColorFingerprint({ ...BASE_SETTINGS, contrast: 99, sharpness: 99 }));
    });

    it('is unaffected by white balance', () => {
        expect(computeColorFingerprint(BASE_SETTINGS))
            .toBe(computeColorFingerprint({ ...BASE_SETTINGS, whiteBalanceTemperature: 9999 }));
    });
});

describe('computeColorToneFingerprint', () => {
    it('returns a 64-character hex string', () => {
        expect(computeColorToneFingerprint(BASE_SETTINGS)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('changes when a saturation wheel value changes', () => {
        expect(computeColorToneFingerprint(BASE_SETTINGS))
            .not.toBe(computeColorToneFingerprint({ ...BASE_SETTINGS, yellow: 0 }));
    });

    it('changes when highlights/shadows/midtones change', () => {
        expect(computeColorToneFingerprint(BASE_SETTINGS))
            .not.toBe(computeColorToneFingerprint({ ...BASE_SETTINGS, shadows: 99 }));
    });

    it('is unaffected by contrast and sharpness', () => {
        expect(computeColorToneFingerprint(BASE_SETTINGS))
            .toBe(computeColorToneFingerprint({ ...BASE_SETTINGS, contrast: 99, sharpness: 99 }));
    });

    it('is unaffected by white balance', () => {
        expect(computeColorToneFingerprint(BASE_SETTINGS))
            .toBe(computeColorToneFingerprint({ ...BASE_SETTINGS, whiteBalanceTemperature: 9999 }));
    });
});

describe('computeNoWbFingerprint', () => {
    it('returns a 64-character hex string', () => {
        expect(computeNoWbFingerprint(BASE_SETTINGS)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('changes when a saturation wheel value changes', () => {
        expect(computeNoWbFingerprint(BASE_SETTINGS))
            .not.toBe(computeNoWbFingerprint({ ...BASE_SETTINGS, yellow: 0 }));
    });

    it('changes when contrast or sharpness changes', () => {
        expect(computeNoWbFingerprint(BASE_SETTINGS))
            .not.toBe(computeNoWbFingerprint({ ...BASE_SETTINGS, contrast: 99 }));
    });

    it('changes when highlights/shadows/midtones change', () => {
        expect(computeNoWbFingerprint(BASE_SETTINGS))
            .not.toBe(computeNoWbFingerprint({ ...BASE_SETTINGS, midtones: 99 }));
    });

    it('is unaffected by white balance', () => {
        expect(computeNoWbFingerprint(BASE_SETTINGS))
            .toBe(computeNoWbFingerprint({ ...BASE_SETTINGS, whiteBalanceTemperature: 9999 }));
    });
});

describe('computeRecipeFingerprint — golden hash', () => {
    it('produces the expected hash for an all-zeros recipe', () => {
        const settings = {
            yellow: 0, orange: 0, orangeRed: 0, red: 0,
            magenta: 0, violet: 0, blue: 0, blueCyan: 0,
            cyan: 0, greenCyan: 0, green: 0, yellowGreen: 0,
            contrast: 0, sharpness: 0,
            highlights: 0, shadows: 0, midtones: 0,
            whiteBalance2: 'Custom WB 1',
            whiteBalanceTemperature: 0,
            whiteBalanceAmberOffset: 0,
            whiteBalanceGreenOffset: 0,
        };
        const expected = expectedHash({
            yellow: 0, orange: 0, orangeRed: 0, red: 0,
            magenta: 0, violet: 0, blue: 0, blueCyan: 0,
            cyan: 0, greenCyan: 0, green: 0, yellowGreen: 0,
            contrast: 0, sharpness: 0,
            highlights: 0, shadows: 0, midtones: 0,
            whiteBalanceTemperature: 0,
            whiteBalanceAmberOffset: 0,
            whiteBalanceGreenOffset: 0,
        });
        expect(computeRecipeFingerprint(settings)).toBe(expected);
    });
});
