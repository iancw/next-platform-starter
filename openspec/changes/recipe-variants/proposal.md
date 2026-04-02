## Why

When users upload sample images with slightly different EXIF settings, the system creates a new independent recipe — which can fragment attribution and obscure the original author's work. The community also produces intentional variations of existing recipes (e.g. same color grading, different white balance) that belong together but currently appear as unrelated entries.

## What Changes

- Add a `recipe_variants` join table linking a variant recipe to its primary (original) recipe
- Add a `variant_label` field to recipes for short discriminators ("Warm", "Cool", "v2") used when displaying siblings
- Any author can declare their recipe a variant of another recipe, as an act of attribution
- Variant recipes remain visible in the main grid — no suppression — but display a link back to the original
- Primary recipe detail pages gain a "Variants" section listing related recipes
- The original (primary) author can remove an unwanted variant link from their recipe's detail page
- Same-author variants support a "swap primary" operation so an author can designate a newer revision as canonical

## Capabilities

### New Capabilities

- `recipe-variants`: The variant relationship — creating, displaying, and managing links between a variant recipe and its original

### Modified Capabilities

- (none — no existing specs to update)

## Impact

- **DB schema**: new `recipe_variants` table; new `variant_label` column on `recipes`
- **Migrations**: one new migration for the schema changes
- **Search API** (`/recipes/search`): include variant metadata in results so cards can render the attribution link
- **Recipe detail page** (`/recipes/[id]`): add Variants section
- **Recipe cards** (`RecipeSimpleCard`, `RecipeCard`): render "variant of X" attribution when applicable
- **Upload flow** (`/upload`): at upload time, surface near-match suggestions so authors can link instead of creating a duplicate
- **Author permissions**: variant author creates the link; primary author can remove it
