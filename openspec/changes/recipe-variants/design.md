## Context

Recipes are currently independent entities — no relationships between them. The schema has a sophisticated multi-level fingerprint system (`recipeFingerprint`, `noWbFingerprint`, `colorToneFingerprint`, `colorFingerprint`) that can detect exact matches at different granularities, but nothing for near-matches or explicit variant relationships.

The community produces intentional variations (e.g. OMTC Warm / OMTC Cool — identical except white balance) that currently appear as unrelated recipes. Any author can declare their recipe a variant of another as an act of attribution. All recipes remain visible in the grid; variants simply render an attribution link back to the original.

Stack: Next.js app router, Drizzle ORM, Postgres (Neon), Tailwind + shadcn/ui.

## Goals / Non-Goals

**Goals:**
- Explicit, author-declared variant relationships (not auto-detected)
- Attribution display on variant recipe cards and detail pages
- Variants section on primary recipe detail pages
- Primary author can remove unwanted variant links
- Same-author "swap primary" so a revision can become canonical
- Surface near-match suggestions at upload time (fuzzy fingerprint, not automated linking)

**Non-Goals:**
- Automatic variant linking (no system-created relationships without author action)
- Nested variants (variants of variants) — flat structure only, one level deep
- Hiding variants from search/browse — all recipes remain visible
- Moderation or approval workflow for cross-author variant links

## Decisions

### 1. Join table, not a self-referential FK on recipes

**Decision:** New `recipe_variants` table with `primary_recipe_id` and `variant_recipe_id`.

**Rationale:** A self-referential `primary_recipe_id` column on `recipes` requires cascade-updating all sibling rows when swapping primary (all variants' `primary_recipe_id` must be repointed). A join table makes the relationship an explicit entity, simplifies queries, and naturally supports the "created_by" audit trail.

**Alternative considered:** `primary_recipe_id` nullable FK on `recipes`. Simpler reads, but swap operation is O(n siblings) writes and prone to inconsistency without a transaction.

**UNIQUE constraint on `variant_recipe_id`:** A recipe can be a variant of exactly one primary. No many-to-many variant graphs.

### 2. `variant_label` lives on the recipe, not the join table

**Decision:** Add nullable `variant_label TEXT` to `recipes`.

**Rationale:** The label describes the recipe itself ("Warm", "Cool", "v2"), not the relationship. Storing it on the recipe means it's available without joining `recipe_variants` in any context where the recipe is fetched — simpler queries everywhere.

**Alternative considered:** `label` column on `recipe_variants`. Would require joining to get the label in most display contexts.

### 3. All variants remain visible in grid — no suppression

**Decision:** Search and browse return all recipes regardless of variant status.

**Rationale:** Authors who link their recipe as a variant are making an attribution gesture voluntarily. Hiding their recipe would disincentivize the behavior. The attribution link on the card is sufficient signal.

### 4. Fuzzy near-match suggestion at upload time (not hard detection)

**Decision:** At upload, if a near-match recipe is found (using existing fingerprint layers as the first pass, then a Manhattan distance check on numeric fields for candidates), surface a non-blocking suggestion: "This recipe looks similar to X — want to link it as a variant?"

**Rationale:** Autodetection without user confirmation risks incorrect links. The suggestion respects authorial intent while solving the "accidental duplicate" problem.

**Threshold:** Candidates where `noWbFingerprint` matches (exact non-WB match) are strong suggestions. For fuzzier matches, sum of absolute differences across all numeric settings ≤ 10 is a reasonable starting threshold to tune.

### 5. Removal rights — primary author only, no approval gate

**Decision:** The variant author creates the link freely. The primary (original) author can delete it from their recipe's detail page. No approval step.

**Rationale:** The variant author is deferring to the original — the act is inherently respectful. An approval gate adds friction that discourages attribution. The primary author retains a removal right to prevent unwanted associations.

### 6. Swap primary — same-author only

**Decision:** An author can designate a different recipe as primary within a variant group they own. Cross-author primary swaps are not supported.

**Rationale:** Cross-author swap is complex — Author B's recipe being a variant of Author A's is a declared attribution; the direction shouldn't be reversible by Author A alone. Same-author swap is a simple revision workflow.

**Swap operation (atomic transaction):**
1. Collect all variant_recipe_ids where primary = old_primary
2. Delete all rows where primary_recipe_id = old_primary
3. Insert (new_primary → old_primary) and (new_primary → each former sibling)

## Risks / Trade-offs

**Orphaned variant links if primary recipe is deleted** → `ON DELETE CASCADE` on `primary_recipe_id` removes the link. The variant recipe itself is unaffected and becomes standalone again.

**Variant of a variant** → `UNIQUE (variant_recipe_id)` prevents a variant from also being a primary in the same table. A recipe that is already a variant cannot itself have variants declared against it (enforced at the application layer with a clear error message).

**Near-match threshold tuning** → The Manhattan distance threshold (≤ 10) is a starting point. Too tight = misses real variants. Too loose = false positives. Should be configurable and tunable after real-world usage.

**Attribution removed but card still shows** → If a primary author removes the link, the variant card no longer shows the attribution. The variant recipe remains in the grid as a standalone recipe. No notification to the variant author (keep it simple for now).

## Migration Plan

1. Add `variant_label` column to `recipes` (nullable, no default) — backward compatible, no data migration needed
2. Create `recipe_variants` table with FK constraints
3. No backfill required — existing recipes start with no variant relationships
4. Deploy: standard Drizzle migration, no downtime risk

## Open Questions

- **Upload-time suggestion UX**: Where exactly in the upload flow does the near-match suggestion appear? After parse, before submit? As a dismissable callout? Needs UI design.
- **Notification to primary author**: Should the original author receive any notification when someone links to their recipe as a variant? Out of scope for now but worth revisiting.
- **Variant label required or optional**: If the variant_label is null, the variants list on the primary page just shows the full recipe_name. Is that acceptable or should the label be required when creating a link?
