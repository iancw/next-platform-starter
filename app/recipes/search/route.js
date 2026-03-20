import { db } from '../../../db/index.ts';
import { authors, images, recipeComparisonImages, recipeSampleImages, recipes } from '../../../db/schema.ts';
import { eq, ilike, inArray, or } from 'drizzle-orm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase();

  // Limit results to keep responses snappy.
  const limit = Math.min(Number(searchParams.get('limit') ?? 500), 2000);

  const where = query
    ? or(
        ilike(recipes.recipeName, `%${query}%`),
        ilike(recipes.authorName, `%${query}%`),
        ilike(recipes.description, `%${query}%`)
      )
    : undefined;

  // Fetch the base recipe rows first, then attach image arrays.
  // This avoids a huge Cartesian product when joining multiple image join tables.
  //
  // Response shape (per recipe):
  // {
  //   ...recipeFields,
  //   comparisonImages: [{ id, smallUrl, fullSizeUrl, dimensions, camera, lens, label? }],
  //   sampleImages: [{ id, smallUrl, fullSizeUrl, dimensions, camera, lens }]
  // }
  const baseRecipes = await db
    .select({
      id: recipes.id,
      uuid: recipes.uuid,
      slug: recipes.slug,
      recipeName: recipes.recipeName,
      authorName: recipes.authorName,
      description: recipes.description,

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
      whiteBalanceGreenOffset: recipes.whiteBalanceGreenOffset,
      authorSocial: {
        instagram: authors.instagramLink,
        flickr: authors.flickrLink,
        website: authors.website,
        kofi: authors.kofiLink
      }
    })
    .from(recipes)
    .leftJoin(authors, eq(authors.id, recipes.authorId))
    .where(where)
    .limit(limit);

  const recipeIds = baseRecipes.map((r) => r.id);
  if (recipeIds.length === 0) return Response.json([]);

  const [comparisonRows, sampleRows] = await Promise.all([
    db
      .select({
        recipeId: recipeComparisonImages.recipeId,
        label: recipeComparisonImages.label,
        image: {
          id: images.id,
          smallUrl: images.smallUrl,
          fullSizeUrl: images.fullSizeUrl,
          dimensions: images.dimensions,
          camera: images.camera,
          lens: images.lens
        }
      })
      .from(recipeComparisonImages)
      .leftJoin(images, eq(images.id, recipeComparisonImages.imageId))
      .where(inArray(recipeComparisonImages.recipeId, recipeIds)),

    db
      .select({
        recipeId: recipeSampleImages.recipeId,
        image: {
          id: images.id,
          smallUrl: images.smallUrl,
          fullSizeUrl: images.fullSizeUrl,
          dimensions: images.dimensions,
          camera: images.camera,
          lens: images.lens
        },
        author: {
          id: authors.id,
          uuid: authors.uuid,
          name: authors.name,
          instagramLink: authors.instagramLink,
          flickrLink: authors.flickrLink,
          website: authors.website,
          kofiLink: authors.kofiLink
        }
      })
      .from(recipeSampleImages)
      .leftJoin(images, eq(images.id, recipeSampleImages.imageId))
      .leftJoin(authors, eq(authors.id, recipeSampleImages.authorId))
      .where(inArray(recipeSampleImages.recipeId, recipeIds))
  ]);

  /**
   * Group join rows into a stable, de-duped list per recipe.
   * Drizzle returns `image: null` if the join doesn't resolve; we skip those.
   */
  function groupByRecipeId(rows, mapRow) {
    const grouped = new Map();
    for (const row of rows) {
      const recipeId = row.recipeId;
      const mapped = mapRow(row);
      if (!mapped) continue;

      let list = grouped.get(recipeId);
      if (!list) {
        list = [];
        grouped.set(recipeId, list);
      }

      // De-dupe by image id when possible.
      if (mapped?.id != null && list.some((x) => x?.id === mapped.id)) continue;
      list.push(mapped);
    }
    return grouped;
  }

  const comparisonByRecipeId = groupByRecipeId(comparisonRows, (row) => {
    if (!row.image?.id) return null;
    return { ...row.image, label: row.label };
  });

  const sampleImagesByRecipeId = groupByRecipeId(sampleRows, (row) => {
    if (!row.image?.id) return null;
    return { ...row.image, sampleAuthor: row.author ?? null };
  });

  const results = baseRecipes.map((r) => ({
    ...r,
    comparisonImages: comparisonByRecipeId.get(r.id) ?? [],
    sampleImages: sampleImagesByRecipeId.get(r.id) ?? []
  }));

  // Keep the old recipe field set, but now with image arrays.
  return Response.json(results);
}
