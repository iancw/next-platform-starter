## 1. Database Schema

- [x] 1.1 Add `modeSlotAssignments` table to Drizzle schema with columns: `userId`, `modePosition` (enum: c1–c5, mapb), `colorSlot` (1–4), `recipeId` (nullable FK to recipes)
- [x] 1.2 Set composite primary key on `(userId, modePosition, colorSlot)` and add FK constraint on `recipeId` with cascade-nullify on recipe delete
- [x] 1.3 Run and verify Drizzle migration

## 2. Data Access Layer

- [x] 2.1 Add `getUserModeAssignments(userId)` query that returns all assignments with joined recipe name, author name, and color wheel data
- [x] 2.2 Add `upsertModeSlotAssignment(userId, modePosition, colorSlot, recipeId)` server action
- [x] 2.3 Add `clearModeSlotAssignment(userId, modePosition, colorSlot)` server action
- [x] 2.4 Ensure server actions call `requireUser()` for auth and `revalidatePath('/camera-settings')`

## 3. Camera Settings Page

- [x] 3.1 Create `/app/camera-settings/page.jsx` as a server component that loads assignments for the current user and renders the six mode cards
- [x] 3.2 Add auth redirect: if no user session, redirect to `/login`
- [x] 3.3 Add link to Camera Settings page in site navigation

## 4. Mode Card Components

- [x] 4.1 Create `ModeCard` component that accepts a mode position label, its 4 slot assignments, and displays name/author/color-wheel thumbnail per occupied slot
- [x] 4.2 Add expand/collapse toggle to `ModeCard` — clicking the card shows the slot editor inline
- [x] 4.3 Create `SlotRow` component that shows the current assignment (or empty state) with an unassign button
- [x] 4.4 `ModeCard` displays color-wheel, tone curve, white balance amber/green offset graph, and recipe name
- [x] 4.6 Update the tone curve component to support resizing properly, so it scales the whole graph properly when used in small size mode card or slot row
- [x] 4.7 Do not show the tone curve in mode card or SlotRow
- [x] 4.8 Mode card should prefer to stay 550px
- [x] 4.9 Label for the non custom mode card should be `P/A/S/M/B`
- [x] 4.10 Slot rows should include a link to the recipe detail page

## 5. Slot Editor

- [x] 5.1 Create `SlotEditor` component with a search bar (client component) that filters a recipe list by name or author
- [x] 5.2 Add white balance filter control (dropdown of WB presets) that further narrows the recipe list
- [x] 5.3 Display each recipe in the filtered list with name, author, and small color wheel thumbnail
- [x] 5.4 Add slot selector (buttons 1–4) that appears when a recipe row is selected, and calls the upsert server action on click
- [x] 5.5 Connect unassign button in `SlotRow` to the clear server action
- [x] 5.6 Make white balance filter check all recipe white balance settings (including temperature and amber/green offset)
- [x] 5.7 Make white balance filter a checkbox named "Only compatible white balance"
- [x] 5.8 Make RecipeRow in slot editor include the white balance amber/green offset graphic
- [x] 5.9 Search results should not include recipes already assigned to slots
- [x] 5.10 RecipeRows should include a link to the recipe detail page

## 6. Deleted Recipe Handling

- [x] 6.1 In `getUserModeAssignments`, handle null `recipeId` (cascade-nullified) by returning a sentinel indicating "recipe not found"
- [x] 6.2 In `SlotRow`, render "Recipe not found" placeholder for null-recipe slots instead of throwing an error

## 7. Testing & Verification

- [x] 7.1 Verify all 6 mode cards render on the page for a logged-in user
- [x] 7.2 Verify assigning a recipe to a slot persists after page reload
- [x] 7.3 Verify replacing a slot assignment works (upsert)
- [x] 7.4 Verify clearing a slot works
- [x] 7.5 Verify search and white balance filter narrow the recipe list correctly
- [x] 7.6 Verify unauthenticated access redirects to login
