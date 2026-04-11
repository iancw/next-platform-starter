## Context

The app serves recipe sample images, comparison images, and how-to guide screenshots. Images are currently delivered as unoptimized JPEGs and PNGs — either via raw `<img>` tags or via the Next.js `Image` component with `unoptimized={true}`. Remote images are proxied through a Next.js route handler (`/assets/images/[variant]/[...objectKey]`) that fetches from OCI Object Storage. The result is large payloads, no format negotiation, and no lazy loading on image-heavy pages.

Key files:
- `next.config.js` — no `images` config present
- `components/SampleGallery.jsx` — raw `<img>` tags for sample and comparison grids
- `components/MySamplesGrid.jsx` — raw `<img>` tag for user sample grid
- `app/how-to/page.jsx` — raw `<img>` tags for 5.5MB of PNG screenshots
- `components/recipe-card.jsx` — Next.js `Image` with `unoptimized={true}`
- `components/recipe-simple-card.jsx` — Next.js `Image` with `unoptimized={true}`

## Goals / Non-Goals

**Goals:**
- Enable Next.js automatic WebP/AVIF conversion for all images
- Remove `unoptimized` flags and configure remote domain allowlist
- Replace raw `<img>` tags with Next.js `Image` component across all components
- Add `sizes` props for responsive delivery
- Mark above-the-fold images with `priority` to avoid lazy loading them

**Non-Goals:**
- Manually converting PNG files to WebP ahead of time (Next.js handles this at request time)
- Changing the OCI storage backend or the `/assets/images/` proxy route
- Adding pagination to `MySamplesGrid` (separate concern)
- Changing image upload or processing logic

## Decisions

### Use Next.js built-in image optimization rather than a separate CDN

Next.js image optimization (`next/image`) serves optimized, format-negotiated images (WebP/AVIF) on-the-fly, caching the result. The proxied `/assets/images/` URLs pass through localhost, so Next.js can intercept and optimize them without any CDN setup.

**Alternative considered:** Pre-converting images to WebP at upload time. Rejected because it requires changes to the upload pipeline and won't help existing stored images.

### Configure `remotePatterns` to allow optimization of OCI proxy URLs

The `/assets/images/` route is a relative path on the same origin (no external domain). This means Next.js image optimization works without any domain configuration for the proxied images. However, the `next.config.js` `images` block should still be added explicitly to document intent and allow future remote domains if needed.

**Why this works:** Next.js `Image` with a relative `src` (e.g. `/assets/images/600/...`) is treated as a local URL and optimized by default.

### Use `fill` layout for gallery images, fixed dimensions for cards

- `RecipeSimpleCard` already uses `fill` with a sized container — keep this pattern, just remove `unoptimized`
- `SampleGallery` thumbnails: use `fill` inside a fixed-aspect-ratio container
- `RecipeCard` preview: switch to `fill` inside a constrained container instead of fixed `width/height` to handle variable-dimension images properly
- How-to images: use `width` and `height` with `style={{ width: '100%', height: 'auto' }}` to maintain aspect ratio while being responsive

### Sizes prop values

Standard responsive breakpoints for this app (Tailwind-based):
- Recipe grid cards: `(min-width: 1536px) 24rem, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw`
- Gallery thumbnails: `(min-width: 1024px) 200px, (min-width: 768px) 150px, 120px`
- How-to images: `(min-width: 1024px) 800px, 100vw`

## Risks / Trade-offs

- **Risk: `fill` layout requires a positioned parent** → Ensure all parent containers have `position: relative` and explicit dimensions. The gallery and grid components already use fixed-height containers, so this should be low-risk.
- **Risk: `SampleGallery` uses dynamic `displaySrc` that rewrites `/original/` to `/1200/`** → This logic can stay as-is; the URL fed to Next.js `Image` will still be optimized. No change needed to URL-rewriting logic.
- **Risk: How-to images are large PNGs that may take time to optimize on first request** → Next.js caches optimized versions after the first request. First-load for maintainers will be slower; subsequent loads for all users will be fast.
- **Risk: The `priority` prop disables lazy loading** → Only apply `priority` to the first visible image per page (e.g., the first recipe card on the home page grid). All others should lazy-load.

## Migration Plan

1. Update `next.config.js` to add `images` configuration block
2. Update each component file one at a time, replacing `<img>` or fixing `<Image>` props
3. Test locally: verify images load, check Network tab for WebP delivery and proper sizes
4. No rollback complexity — changes are isolated to rendering components; the storage backend is unchanged
