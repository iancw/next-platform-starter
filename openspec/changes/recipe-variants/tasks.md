## 1. Database Schema

- [ ] 1.1 Add `variant_label` (TEXT, nullable) column to `recipes` table in `db/schema.ts`
- [ ] 1.2 Add `recipe_variants` table to `db/schema.ts` with `primary_recipe_id`, `variant_recipe_id`, `created_by_author_id`, `created_at`, PK, and UNIQUE constraint on `variant_recipe_id`
- [ ] 1.3 Add Drizzle relations for `recipe_variants` (recipesRelations, authorsRelations)
- [ ] 1.4 Generate and apply migration for the schema changes

## 2. Data Access Layer

- [ ] 2.1 Create `lib/recipe-variants.js` with `getVariantsForRecipe(recipeId)` — returns all variant recipes for a given primary
- [ ] 2.2 Add `getPrimaryForRecipe(recipeId)` — returns the primary recipe if the given recipe is a variant
- [ ] 2.3 Add `createVariantLink({ primaryRecipeId, variantRecipeId, createdByAuthorId })` with validation (no self-link, no nested variants, no duplicate link)
- [ ] 2.4 Add `deleteVariantLink({ primaryRecipeId, variantRecipeId, requestingAuthorId })` — enforces primary-author-only deletion
- [ ] 2.5 Add `swapPrimary({ oldPrimaryId, newPrimaryId, requestingAuthorId })` — atomic transaction, same-author-only enforcement

## 3. Search API

- [ ] 3.1 Update `/recipes/search` route to LEFT JOIN `recipe_variants` and include `primaryRecipeId`, `primaryRecipeName`, `primaryAuthorName` in results so cards can render attribution

## 4. Recipe Cards

- [ ] 4.1 Update `RecipeSimpleCard` to display "variant of [name] by [author]" attribution link when `primaryRecipeId` is present in recipe data
- [ ] 4.2 Update `RecipeCard` (detail/modal view) to display the same attribution link

## 5. Recipe Detail Page

- [ ] 5.1 Update `getRecipeByIdOrSlug` in `app/recipes/[id]/page.jsx` to fetch variants (via `getVariantsForRecipe`) and primary (via `getPrimaryForRecipe`)
- [ ] 5.2 Add Variants section to the detail page rendering variant recipe names, authors, and links
- [ ] 5.3 Add attribution section to the detail page when the recipe is itself a variant
- [ ] 5.4 Add "Remove variant link" action for the primary recipe author (calls `deleteVariantLink`)
- [ ] 5.5 Add "Link as variant" UI for recipe authors on their own recipe detail page (form to input primary recipe UUID/slug)
- [ ] 5.6 Add "Set as primary" action for same-author variant groups (calls `swapPrimary`)

## 6. Upload Flow

- [ ] 6.1 After EXIF parse in the upload flow, run near-match detection: find recipes where `noWbFingerprint` matches, or compute Manhattan distance across numeric fields for candidates within threshold (≤ 10)
- [ ] 6.2 If a near-match is found, surface a dismissable suggestion card in the upload UI identifying the similar recipe and offering a "Link as variant" checkbox/button
- [ ] 6.3 If the author accepts the suggestion, create the variant link automatically after the recipe is saved

## 7. Server Actions

- [ ] 7.1 Add `linkAsVariantAction(variantRecipeId, primaryRecipeId)` server action with auth checks
- [ ] 7.2 Add `removeVariantLinkAction(primaryRecipeId, variantRecipeId)` server action with auth checks
- [ ] 7.3 Add `swapVariantPrimaryAction(oldPrimaryId, newPrimaryId)` server action with auth checks
