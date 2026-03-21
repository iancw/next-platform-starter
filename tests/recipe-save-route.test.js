import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server.js';

vi.mock('../lib/auth.js', () => ({
    getSession: vi.fn()
}));

vi.mock('../lib/recipe-saves.js', () => ({
    recipeExists: vi.fn(),
    toggleSavedRecipeForUser: vi.fn()
}));

import { getSession } from '../lib/auth.js';
import { recipeExists, toggleSavedRecipeForUser } from '../lib/recipe-saves.js';
import { POST as saveRecipeRoutePost } from '../app/recipes/save/route.js';

describe('recipe save route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns a login URL when the viewer is not authenticated', async () => {
        vi.mocked(getSession).mockResolvedValue(null);

        const request = new NextRequest('https://www.omrecipes.dev/recipes/save', {
            method: 'POST',
            body: JSON.stringify({
                recipeId: 123,
                redirectTo: '/recipes/abc?id=123'
            }),
            headers: {
                'content-type': 'application/json'
            }
        });

        const response = await saveRecipeRoutePost(request);

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: 'Authentication required',
            loginUrl: '/login?redirectTo=%2Frecipes%2Fabc%3Fid%3D123'
        });
        expect(recipeExists).not.toHaveBeenCalled();
        expect(toggleSavedRecipeForUser).not.toHaveBeenCalled();
    });

    it('toggles the saved state for an authenticated user', async () => {
        vi.mocked(getSession).mockResolvedValue({
            user: {
                id: 42
            }
        });
        vi.mocked(recipeExists).mockResolvedValue(true);
        vi.mocked(toggleSavedRecipeForUser).mockResolvedValue({ isSaved: true });

        const request = new NextRequest('https://www.omrecipes.dev/recipes/save', {
            method: 'POST',
            body: JSON.stringify({
                recipeId: 123,
                redirectTo: '/recipes/abc'
            }),
            headers: {
                'content-type': 'application/json'
            }
        });

        const response = await saveRecipeRoutePost(request);

        expect(recipeExists).toHaveBeenCalledWith(123);
        expect(toggleSavedRecipeForUser).toHaveBeenCalledWith({
            userId: 42,
            recipeId: 123
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ isSaved: true });
    });
});
