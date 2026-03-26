export const SAMPLE_IMAGE_SELECTION = 'sample';

export function comparisonImageSelectionValue(label) {
    const normalizedLabel = typeof label === 'string' ? label.trim() : '';
    return normalizedLabel ? `comparison:${normalizedLabel}` : null;
}

function normalizeLabel(label) {
    return typeof label === 'string' ? label.trim().toLowerCase() : '';
}

export function getComparisonLabelFromSelection(selection) {
    if (typeof selection !== 'string') return null;
    if (!selection.startsWith('comparison:')) return null;

    const label = selection.slice('comparison:'.length).trim();
    return label || null;
}

export function getAvailableComparisonImageLabels(recipesList) {
    const seen = new Set();
    const labels = [];

    for (const recipe of recipesList ?? []) {
        for (const image of recipe?.comparisonImages ?? []) {
            const rawLabel = typeof image?.label === 'string' ? image.label.trim() : '';
            if (!rawLabel) continue;

            const normalized = normalizeLabel(rawLabel);
            if (!normalized || seen.has(normalized)) continue;

            seen.add(normalized);
            labels.push(rawLabel);
        }
    }

    return labels.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function formatComparisonImageLabelForDisplay(label) {
    const normalizedLabel = typeof label === 'string' ? label.trim() : '';
    if (!normalizedLabel) return '';

    return normalizedLabel
        .replace(/[-_]/g, ' ')
        .replace(/\b\w+/g, (word) => {
            const [first = '', ...rest] = word;
            return first.toUpperCase() + rest.join('').toLowerCase();
        });
}

export function getRecipePreviewImage(recipe, selection = SAMPLE_IMAGE_SELECTION) {
    if (selection === SAMPLE_IMAGE_SELECTION) {
        return recipe?.sampleImages?.[0] ?? null;
    }

    const comparisonLabel = getComparisonLabelFromSelection(selection);
    if (!comparisonLabel) {
        return recipe?.sampleImages?.[0] ?? null;
    }

    const normalizedTarget = normalizeLabel(comparisonLabel);
    return (
        recipe?.comparisonImages?.find(
            (image) => normalizeLabel(image?.label) === normalizedTarget
        ) ?? null
    );
}

export function getRecipeDownloadImage(recipe) {
    return (
        recipe?.sampleImages?.find((image) => image?.validExif === true) ?? null
    );
}
