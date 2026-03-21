import { getSession } from '../../../lib/auth.js';
import { recipeExists, toggleSavedRecipeForUser } from '../../../lib/recipe-saves.js';

export async function POST(request) {
    const session = await getSession();
    const userId = session?.user?.id ?? null;

    if (userId == null) {
        const body = await request.json().catch(() => ({}));
        const redirectTo = typeof body?.redirectTo === 'string' && body.redirectTo.trim() ? body.redirectTo.trim() : '/';
        return Response.json(
            {
                error: 'Authentication required',
                loginUrl: `/login?redirectTo=${encodeURIComponent(redirectTo)}`
            },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => ({}));
    const recipeId = Number(body?.recipeId);
    if (!Number.isFinite(recipeId)) {
        return Response.json({ error: 'Invalid recipe id' }, { status: 400 });
    }

    if (!(await recipeExists(recipeId))) {
        return Response.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const result = await toggleSavedRecipeForUser({ userId, recipeId });
    return Response.json(result);
}
