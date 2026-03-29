function isBlank(value) {
    return value == null || String(value).trim() === '';
}

function normalizeOffset(value) {
    if (value == null) return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.trunc(parsed);
}

function normalizeTemperature(value) {
    if (isBlank(value)) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.trunc(parsed);
}

function normalizeLabel(value) {
    if (isBlank(value)) return null;
    return String(value).trim();
}

export function getEquivalentWhiteBalance(recipe) {
    const temperature = normalizeTemperature(recipe?.whiteBalanceTemperature);
    const amberOffset = normalizeOffset(recipe?.whiteBalanceAmberOffset);
    const greenOffset = normalizeOffset(recipe?.whiteBalanceGreenOffset);
    const label = normalizeLabel(recipe?.whiteBalance2);

    if (temperature != null) {
        return {
            type: 'temperature',
            temperature,
            amberOffset,
            greenOffset,
            label,
            normalizedLabel: label == null ? null : label.toLowerCase(),
            key: `temperature:${temperature}|amber:${amberOffset}|green:${greenOffset}`
        };
    }

    if (label == null) {
        return {
            type: 'none',
            temperature: null,
            amberOffset,
            greenOffset,
            label: null,
            normalizedLabel: null,
            key: null
        };
    }

    const normalizedLabel = label.toLowerCase();
    const type = normalizedLabel.startsWith('auto') ? 'auto' : 'preset';
    const keyPrefix = type === 'auto' ? 'auto' : `preset:${normalizedLabel}`;

    return {
        type,
        temperature: null,
        amberOffset,
        greenOffset,
        label,
        normalizedLabel,
        key: `${keyPrefix}|amber:${amberOffset}|green:${greenOffset}`
    };
}

export function shareEquivalentWhiteBalance(left, right) {
    const a = getEquivalentWhiteBalance(left);
    const b = getEquivalentWhiteBalance(right);
    return a.key != null && a.key === b.key;
}
