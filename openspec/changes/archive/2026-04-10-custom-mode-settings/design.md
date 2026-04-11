## Context

The OM-3 has a mode dial with 6 programmable positions: C1–C5 (custom modes) and M/A/P/B (shared position). Each position can hold 4 color profiles (Color 1–Color 4). Currently there is no way to track or document which recipe is loaded in each slot — users rely on memory or external notes.

The site already has users (magic-link auth), authors, recipes, and a saved-recipes feature. This feature adds a new personal "Camera Settings" page where logged-in users can document their mode dial configuration.

## Goals / Non-Goals

**Goals:**
- Allow logged-in users to assign recipes to camera mode positions and color profile slots
- Display the assignment in a visual layout mirroring the physical mode dial
- Support recipe search and filtering (including by white balance compatibility) when selecting recipes for slots
- Reuse existing recipe display components (SaturationWheel, tone curve)

**Non-Goals:**
- No syncing with the actual camera (no OES import/export of the full mode config)
- No multi-camera support (one configuration per user, not per camera body)
- No public sharing of camera configurations
- No notifications or reminders to update the configuration

## Decisions

### Data Model: Flat assignment table

A single `modeSlotAssignments` table with columns `(userId, modePosition, colorSlot, recipeId)` where:
- `modePosition` is an enum or short string: `c1`, `c2`, `c3`, `c4`, `c5`, `mapb`
- `colorSlot` is an integer 1–4
- `recipeId` is a nullable FK to `recipes`

**Alternatives considered:**
- Storing assignments as a JSON blob on the user row — rejected because it makes querying, joining to recipe data, and validating constraints harder.
- A `cameraConfigs` parent table with child rows — unnecessary complexity; one config per user is enough for now.

Composite primary key on `(userId, modePosition, colorSlot)` ensures one recipe per slot. Upsert semantics on save (insert or replace).

### UI: Cards with inline expansion

Six cards (C1–C5, M/A/P/B) displayed in a grid. Each shows the 4 assigned recipe names with color wheel thumbnails. Clicking a card expands it in-place to show a slot editor with recipe search.

**Alternatives considered:**
- Drag-and-drop assignment — too cumbersome on mobile; rejected.
- Modal editor — adds navigation complexity; inline expansion is simpler and keeps context.
- Dropdowns per slot — clean on mobile, but can't show recipe previews while browsing. Chosen approach: recipe search list with thumbnail previews where user clicks to assign to a specific numbered slot.

### Recipe selection: Search + slot buttons

When a card is expanded, user sees 4 slot rows (each showing current assignment or empty), a search bar, and a filtered list of recipes. Clicking a recipe row shows slot selector buttons (1, 2, 3, 4) to assign it to that slot. Removing an assignment is done via a clear/unassign button per slot.

White balance compatibility filter: computed from the recipe's `whiteBalance` settings against a "current WB" toggle the user can set (e.g. Auto, Daylight, etc.). There are two options: one is to constrain available recipe list to only recipes with exactly the same white balance temperature and amber/green offsets. The second option is to not constrain; to show all recipes regardless of white balance compatibility. 

### Data fetching: Server components + server actions

Page loads all assignments for the user via a server component. Slot updates use server actions with `revalidatePath()`. No client-side state management library needed; React's built-in state handles expansion and search filtering.

## Risks / Trade-offs

- **Stale recipe references**: If a recipe is deleted, the FK should either cascade-nullify or cascade-delete the assignment. Cascade nullify preserves the slot structure but shows "Recipe not found" — acceptable.
- **No camera validation**: Users can assign any recipe to any slot regardless of actual camera capabilities. This is intentional (it's a notes tool), but documentation should be clear.
- **Single config per user**: If the user has multiple OM-3 bodies, they can't track them separately. Acceptable for v1.

## Migration Plan

1. Add `modeSlotAssignments` table via Drizzle migration
2. Deploy schema migration (no data migration needed — table starts empty)
3. Deploy new page and components
4. No rollback complexity — new page, no changes to existing tables
