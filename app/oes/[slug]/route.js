import { db } from '../../../db/index.ts';
import { recipes } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

import { makeOESXml } from '../../../lib/oes.js';

function isBlank(v) {
    return v == null || String(v).trim() === '';
}

function stripOesExt(slugParam) {
    const s = String(slugParam ?? '');
    return s.toLowerCase().endsWith('.oes') ? s.slice(0, -4) : s;
}

export async function GET(request, { params }) {
    const url = new URL(request.url);
    // When accessing /oes/<slug>.oes, this route is /oes/[slug] and the suffix is left in the pathname.
    // Example: pathname "/oes/foo.oes" => params.slug === "foo.oes" (in prod)
    // Turbopack dev can be quirky here, so we fall back to parsing the pathname.
    const resolvedParams = await params;

    if (isBlank(resolvedParams?.slug)) {
        return new Response('Bad Request: missing slug', { status: 400 });
    }

    const slug = stripOesExt(resolvedParams.slug);

    const rows = await db
        .select({
            slug: recipes.slug,

            yellow: recipes.yellow,
            orange: recipes.orange,
            orangeRed: recipes.orangeRed,
            red: recipes.red,
            magenta: recipes.magenta,
            violet: recipes.violet,
            blue: recipes.blue,
            blueCyan: recipes.blueCyan,
            cyan: recipes.cyan,
            greenCyan: recipes.greenCyan,
            green: recipes.green,
            yellowGreen: recipes.yellowGreen,

            contrast: recipes.contrast,
            sharpness: recipes.sharpness,
            highlights: recipes.highlights,
            shadows: recipes.shadows,
            midtones: recipes.midtones,

            shadingEffect: recipes.shadingEffect,
            exposureCompensation: recipes.exposureCompensation,

            whiteBalance2: recipes.whiteBalance2,
            whiteBalanceTemperature: recipes.whiteBalanceTemperature,
            whiteBalanceAmberOffset: recipes.whiteBalanceAmberOffset,
            whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset
        })
        .from(recipes)
        .where(eq(recipes.slug, slug))
        .limit(1);

    if (rows.length === 0) {
        return new Response('Not Found', { status: 404 });
    }

    const recipeSettings = rows[0];
    const xml = makeOESXml(recipeSettings);

    return new Response(xml, {
        status: 200,
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'content-disposition': `attachment; filename="${slug}.oes"`,
            'cache-control': 'public, max-age=3600'
        }
    });
}
