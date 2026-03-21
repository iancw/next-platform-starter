import { describe, expect, it } from 'vitest';
import { normalizeRedirectPath } from '../lib/redirect-path.js';

describe('normalizeRedirectPath', () => {
    it('preserves safe relative paths', () => {
        expect(normalizeRedirectPath('/upload?draft=1#top')).toBe('/upload?draft=1#top');
    });

    it('strips auth tokens from redirect query strings', () => {
        expect(normalizeRedirectPath('/upload?token=abc123&draft=1')).toBe('/upload?draft=1');
        expect(normalizeRedirectPath('/profile?code=xyz&tab=settings')).toBe('/profile?tab=settings');
    });

    it('rejects external or protocol-relative redirects', () => {
        expect(normalizeRedirectPath('https://evil.example/test', '/profile')).toBe('/profile');
        expect(normalizeRedirectPath('//evil.example/test', '/profile')).toBe('/profile');
    });
});
