## Why

Images throughout the app are served without Next.js optimization — using raw `<img>` tags or the Next.js `Image` component with `unoptimized={true}` — resulting in large, uncompressed files being transferred to users on every page load. The how-to page alone loads 5.5MB of PNGs, and recipe grids load dozens of unoptimized JPEGs with no lazy loading.

## What Changes

- Replace HTML `<img>` tags in `SampleGallery`, `MySamplesGrid`, and the how-to page with Next.js `Image` component
- Remove `unoptimized` flag from `RecipeCard` and `RecipeSimpleCard` and configure remote image domains in `next.config.js`
- Add `priority` prop to above-the-fold images on the home page and recipe detail page
- Add proper `sizes` prop to all image components for responsive delivery
- Convert large how-to PNG files to WebP format (or rely on Next.js auto-conversion)
- Add `loading="lazy"` behavior via Next.js Image defaults for below-fold images

## Capabilities

### New Capabilities
- `image-optimization`: Next.js Image component usage with domain configuration, responsive sizing, lazy loading, and format conversion (WebP) across all image-rendering components

### Modified Capabilities

## Impact

- `components/SampleGallery.jsx` — replace `<img>` tags, add sizes and lazy loading
- `components/MySamplesGrid.jsx` — replace `<img>` tag, add sizes
- `app/how-to/page.jsx` — replace `<img>` tags with Next.js Image component
- `components/recipe-card.jsx` — remove `unoptimized`, add proper `sizes`
- `components/recipe-simple-card.jsx` — remove `unoptimized`
- `next.config.js` — add `images.remotePatterns` to allow optimization of OCI storage URLs
