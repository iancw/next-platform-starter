const SAFE_REDIRECT_ORIGIN = 'https://om-recipes.local';
const STRIPPED_REDIRECT_PARAMS = new Set([
    'token',
    'access_token',
    'refresh_token',
    'id_token',
    'code'
]);

export function normalizeRedirectPath(value, fallback = '/') {
    const candidate = String(value ?? '').trim();
    if (!candidate.startsWith('/')) return fallback;
    if (candidate.startsWith('//')) return fallback;

    let url;
    try {
        url = new URL(candidate, SAFE_REDIRECT_ORIGIN);
    } catch {
        return fallback;
    }

    if (url.origin !== SAFE_REDIRECT_ORIGIN) {
        return fallback;
    }

    for (const param of STRIPPED_REDIRECT_PARAMS) {
        url.searchParams.delete(param);
    }

    return `${url.pathname}${url.search}${url.hash}`;
}
