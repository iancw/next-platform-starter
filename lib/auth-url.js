function normalizeAbsoluteHttpUrl(value, label) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    let url;
    try {
        url = new URL(raw);
    } catch {
        throw new Error(`${label} must be an absolute HTTP(S) URL`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`${label} must be an absolute HTTP(S) URL`);
    }

    url.pathname = '';
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/+$/, '');
}

export function publicAppBaseUrl(requestOrigin) {
    const configured = normalizeAbsoluteHttpUrl(process.env.APP_BASE_URL, 'APP_BASE_URL');
    if (configured) return configured;

    const derived = normalizeAbsoluteHttpUrl(requestOrigin, 'request origin');
    if (derived) return derived;

    throw new Error('Unable to determine public app URL for auth links');
}

export function publicAppUrl(pathOrUrl, requestOrigin) {
    return new URL(pathOrUrl, publicAppBaseUrl(requestOrigin));
}
