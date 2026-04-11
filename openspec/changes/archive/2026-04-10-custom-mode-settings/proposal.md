## Why

The OM-3 camera doesn't support naming color profiles, making it difficult to track which recipes are loaded in each mode slot. Users must rely on memory, color wheel visuals, or external notes to manage their settings.

## What Changes

- New "Camera Settings" page added to the site
- Users can view and manage which recipes are assigned to each of the 6 camera mode dial positions (C1–C5 and M/A/P/B)
- Each mode position has 4 color profile slots (Color 1–Color 4)
- Recipe assignment UI with search/filter and slot selection
- Filter recipes by white balance compatibility

## Capabilities

### New Capabilities

- `camera-mode-settings`: Page and data model for viewing and editing recipe assignments across camera mode dial positions and color profile slots

### Modified Capabilities

## Impact

- New database model or table to store user mode slot assignments (mode × slot → recipe)
- New frontend page and components (mode cards, expanded mode editor, recipe search/filter)
- Recipe display components (color wheel, tone curve thumbnails) reused from existing recipe views
- No changes to existing recipe data model
