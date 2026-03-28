import { describe, expect, it } from 'vitest';
import {
    comparisonImageSelectionValue,
    getAvailableComparisonImageLabels,
    getRecipeDownloadImage,
    getPrimarySampleImage,
    getRecipePreviewImage,
    SAMPLE_IMAGE_SELECTION
} from '../lib/recipe-image-selection.js';

describe('recipe image selection helpers', () => {
    it('collects unique comparison labels across recipes', () => {
        const labels = getAvailableComparisonImageLabels([
            {
                comparisonImages: [
                    { id: 1, label: 'lighthouse' },
                    { id: 2, label: 'watch hill' }
                ]
            },
            {
                comparisonImages: [
                    { id: 3, label: 'Lighthouse' },
                    { id: 4, label: '  city  ' }
                ]
            }
        ]);

        expect(labels).toEqual(['city', 'lighthouse', 'watch hill']);
    });

    it('returns the primary sample image when sample is selected', () => {
        const recipe = {
            sampleImages: [{ id: 'sample-1' }, { id: 'sample-2', isPrimary: true }],
            comparisonImages: [{ id: 'comparison-1', label: 'lighthouse' }]
        };

        expect(getRecipePreviewImage(recipe, SAMPLE_IMAGE_SELECTION)).toEqual({ id: 'sample-2', isPrimary: true });
    });

    it('falls back to the first sample image when none are primary', () => {
        const recipe = {
            sampleImages: [{ id: 'sample-1' }, { id: 'sample-2' }]
        };

        expect(getPrimarySampleImage(recipe)).toEqual({ id: 'sample-1' });
    });

    it('returns the matching comparison image by label', () => {
        const recipe = {
            sampleImages: [{ id: 'sample-1' }],
            comparisonImages: [
                { id: 'comparison-1', label: 'watch hill' },
                { id: 'comparison-2', label: 'Lighthouse' }
            ]
        };

        expect(
            getRecipePreviewImage(recipe, comparisonImageSelectionValue('lighthouse'))
        ).toEqual({ id: 'comparison-2', label: 'Lighthouse' });
    });

    it('returns null when the selected comparison label is missing', () => {
        const recipe = {
            sampleImages: [{ id: 'sample-1' }],
            comparisonImages: [{ id: 'comparison-1', label: 'watch hill' }]
        };

        expect(
            getRecipePreviewImage(recipe, comparisonImageSelectionValue('lighthouse'))
        ).toBeNull();
    });

    it('returns the first sample image with valid exif for downloads', () => {
        const recipe = {
            sampleImages: [
                { id: 'sample-1', validExif: false },
                { id: 'sample-2', validExif: true },
                { id: 'sample-3', validExif: true }
            ]
        };

        expect(getRecipeDownloadImage(recipe)).toEqual({ id: 'sample-2', validExif: true });
    });

    it('returns null when no sample image has valid exif', () => {
        const recipe = {
            sampleImages: [
                { id: 'sample-1', validExif: false },
                { id: 'sample-2' }
            ]
        };

        expect(getRecipeDownloadImage(recipe)).toBeNull();
    });
});
