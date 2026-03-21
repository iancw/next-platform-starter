import { afterEach, describe, expect, it } from 'vitest';
import { publicAppBaseUrl, publicAppUrl } from '../lib/auth-url.js';
import { sessionCookieOptions } from '../lib/auth-session-cookie.js';

const ORIGINAL_ENV = {
    APP_BASE_URL: process.env.APP_BASE_URL,
    AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV
};

describe('auth URL + cookie config', () => {
    afterEach(() => {
        process.env.APP_BASE_URL = ORIGINAL_ENV.APP_BASE_URL;
        process.env.AUTH_COOKIE_DOMAIN = ORIGINAL_ENV.AUTH_COOKIE_DOMAIN;
        process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
    });

    it('prefers APP_BASE_URL over request origin for auth links', () => {
        process.env.APP_BASE_URL = 'https://www.omrecipes.dev/some/path?ignored=1';

        expect(publicAppBaseUrl('https://deploy-preview-123--om-recipes.netlify.app')).toBe('https://www.omrecipes.dev');
    });

    it('falls back to the request origin when APP_BASE_URL is unset', () => {
        delete process.env.APP_BASE_URL;

        expect(publicAppBaseUrl('https://om-recipes.netlify.app')).toBe('https://om-recipes.netlify.app');
    });

    it('builds canonical absolute URLs for auth redirects', () => {
        process.env.APP_BASE_URL = 'https://om-recipes.com';

        expect(publicAppUrl('/profile?sent=1', 'https://69bdf745c00f6d0008987b3d--om3-recipes.netlify.app').toString()).toBe(
            'https://om-recipes.com/profile?sent=1'
        );
    });

    it('adds the configured cookie domain in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.AUTH_COOKIE_DOMAIN = '.omrecipes.dev';

        expect(sessionCookieOptions(new Date('2026-03-20T00:00:00.000Z'))).toMatchObject({
            domain: 'omrecipes.dev',
            secure: true,
            path: '/',
            sameSite: 'lax',
            httpOnly: true
        });
    });

    it('omits cookie domain when AUTH_COOKIE_DOMAIN is unset', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.AUTH_COOKIE_DOMAIN;

        expect(sessionCookieOptions()).not.toHaveProperty('domain');
    });
});
