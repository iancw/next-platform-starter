## ADDED Requirements

### Requirement: Camera Settings page exists and is accessible to logged-in users
The system SHALL provide a "Camera Settings" page accessible to authenticated users that displays their mode dial configuration.

#### Scenario: Logged-in user visits Camera Settings
- **WHEN** an authenticated user navigates to the Camera Settings page
- **THEN** the page displays six mode position cards: C1, C2, C3, C4, C5, and P/A/S/M/B

#### Scenario: Unauthenticated user visits Camera Settings
- **WHEN** an unauthenticated user navigates to the Camera Settings page
- **THEN** the system redirects them to the login page

### Requirement: Mode position cards display current slot assignments
Each mode position card SHALL display the 4 color profile slots (Color 1–Color 4) and any recipes currently assigned to them.

#### Scenario: Mode with assigned recipes
- **WHEN** a user views a mode position card that has recipes assigned
- **THEN** each occupied slot shows the recipe name, author name, and a small color wheel thumbnail

#### Scenario: Mode with empty slots
- **WHEN** a user views a mode position card that has no recipe assigned to a slot
- **THEN** that slot is shown as empty with a placeholder indicator

### Requirement: Expanding a mode card reveals the slot editor
The system SHALL allow users to expand a mode card to access a full slot assignment editor.

#### Scenario: User expands a mode card
- **WHEN** a user clicks on a mode position card
- **THEN** the card expands in place to show the slot editor with all 4 slot rows, a recipe search bar, and a filtered recipe list

#### Scenario: User collapses a mode card
- **WHEN** a user clicks the expanded mode card again (or a close control)
- **THEN** the card collapses back to the summary view

### Requirement: Users can search recipes within the slot editor
The slot editor SHALL include a search bar that filters the recipe list by name or author.

#### Scenario: User types in the search bar
- **WHEN** a user types text into the search bar in an expanded mode card
- **THEN** the recipe list is filtered to show only recipes whose name or author name contains the search text

#### Scenario: User clears the search bar
- **WHEN** a user clears the search bar
- **THEN** the full recipe list is shown

### Requirement: Search results should not show recipes that are already assigned to slots

### Requirement: Mode cards should stay wide enough to show most of the recipe title, about 550px

### Requirement: Users can filter recipes by white balance compatibility
The slot editor SHALL provide a white balance filter to narrow down compatible recipes. The white balance compatibility shall be evaluated
based on recipe white balance settings -- color temperature and amber/green offsets. This should be a checkbox to either constraint white balance so
all recipes have the same settings, or allow recipes with any whitebalance. When checked, available recipes are only show if they are compatible
with already selected recipes. If no recipes are already selected, all recipes are shown. If multiple recipes are selected that have incompatible white balance settings, the one in the largest color slot number is used.

#### Scenario: User applies a white balance filter
- **WHEN** a user selects a white balance preset from the filter control
- **THEN** the recipe list is filtered to show only recipes using that white balance setting

#### Scenario: User removes the white balance filter
- **WHEN** a user selects "All" or clears the white balance filter
- **THEN** the recipe list shows all recipes regardless of white balance

### Requirement: Users can assign a recipe to a specific slot
The system SHALL allow users to assign a recipe to one of the 4 color profile slots within a mode position.

#### Scenario: User assigns a recipe to an empty slot
- **WHEN** a user clicks a recipe in the filtered list and selects a slot number (1–4)
- **THEN** the system saves the assignment and the slot row updates to show the assigned recipe

#### Scenario: User replaces an existing slot assignment
- **WHEN** a user assigns a recipe to a slot that already has a recipe
- **THEN** the system replaces the existing assignment with the new recipe

#### Scenario: Assignment persists across sessions
- **WHEN** a user assigns a recipe to a slot and later returns to the Camera Settings page
- **THEN** the assignment is still shown

### Requirement: Users can remove a recipe from a slot
The system SHALL allow users to clear a recipe assignment from any slot.

#### Scenario: User removes a recipe from a slot
- **WHEN** a user clicks the unassign/clear control on an occupied slot row
- **THEN** the system removes the assignment and the slot row shows as empty

### Requirement: Data model stores one assignment per user per slot
The system SHALL enforce that each (user, modePosition, colorSlot) combination maps to at most one recipe.

#### Scenario: Upsert on duplicate assignment
- **WHEN** the system saves a recipe assignment for a slot that already has a recipe
- **THEN** the existing assignment is replaced (upsert semantics)

### Requirement: Deleted recipes are gracefully handled in slot views
The system SHALL handle the case where an assigned recipe has been deleted.

#### Scenario: Assigned recipe is deleted
- **WHEN** a recipe assigned to a slot is deleted from the system
- **THEN** the slot shows an indicator that the recipe is no longer available (e.g., "Recipe not found") rather than an error

### Requirement: Mode cards show color wheel, white balance amber/green offset graphs along with recipe name
Each mode card should show small versions of color wheel, white balance amber/green offset graphs. 

### Requirement: Slot rows show show color wheel, white balance amber/green offset graphs along with recipe name

Each slot row show color wheel, white balance amber/green offset graphs along with recipe name

### Requirement: Tone curve component must support being resized to a very small size
The tone curve component should be updated to support re-sizing properly
