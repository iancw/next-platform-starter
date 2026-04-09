const BASE_URL = (process.env.APP_BASE_URL ?? '').replace(/\/+$/, '');

export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/my-samples', '/profile', '/user', '/upload']
        },
        sitemap: `${BASE_URL}/sitemap.xml`
    };
}
