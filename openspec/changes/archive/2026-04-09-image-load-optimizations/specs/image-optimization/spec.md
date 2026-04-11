## ADDED Requirements

### Requirement: Next.js Image component used for all images
All images in the application SHALL use the Next.js `Image` component (`next/image`) rather than raw HTML `<img>` tags. The `unoptimized` prop SHALL NOT be set to `true` on any `Image` component.

#### Scenario: Recipe simple card renders optimized image
- **WHEN** the home page recipe grid is rendered
- **THEN** each recipe card image uses `next/image` without `unoptimized`

#### Scenario: Sample gallery renders optimized thumbnails
- **WHEN** a recipe detail page is loaded with sample images
- **THEN** thumbnail images in `SampleGallery` use `next/image` without `unoptimized`

#### Scenario: My samples grid renders optimized images
- **WHEN** the my-samples page is loaded
- **THEN** images in `MySamplesGrid` use `next/image` without `unoptimized`

#### Scenario: How-to guide renders optimized step images
- **WHEN** the how-to page is loaded
- **THEN** all step screenshot images use `next/image` without `unoptimized`

### Requirement: Images served in modern format (WebP/AVIF)
The application SHALL deliver images in WebP or AVIF format to browsers that support them, falling back to the original format otherwise. This SHALL be handled automatically by Next.js image optimization.

#### Scenario: Browser receives WebP for supported client
- **WHEN** a modern browser requests a recipe image
- **THEN** the response Content-Type is `image/webp` or `image/avif`

### Requirement: Responsive image sizes declared
All `Image` components with variable display sizes SHALL include a `sizes` prop matching the component's responsive layout breakpoints.

#### Scenario: Recipe grid cards declare sizes
- **WHEN** `RecipeSimpleCard` renders an image
- **THEN** the `Image` component has a `sizes` prop reflecting responsive breakpoints

#### Scenario: Gallery thumbnails declare sizes
- **WHEN** `SampleGallery` renders thumbnail images
- **THEN** each `Image` component has a `sizes` prop

#### Scenario: How-to images declare sizes
- **WHEN** the how-to page renders step images
- **THEN** each `Image` component has a `sizes` prop

### Requirement: Above-the-fold images are not lazy loaded
The first visible image on image-heavy pages SHALL use the `priority` prop to preload eagerly. All other images SHALL lazy-load by default (Next.js `Image` default behavior).

#### Scenario: First recipe card on home page is prioritized
- **WHEN** the home page renders its recipe grid
- **THEN** the first recipe card image has `priority={true}`

#### Scenario: Non-first images lazy load
- **WHEN** multiple images are rendered in a grid or gallery
- **THEN** only the first image has `priority={true}`; all others use default lazy loading

### Requirement: Remote image domains configured in next.config.js
The `next.config.js` SHALL include an `images` configuration block documenting the allowed image sources. The internal `/assets/images/` proxy route SHALL be treated as a local (same-origin) source and not require a remote pattern entry.

#### Scenario: next.config.js has images block
- **WHEN** `next.config.js` is read
- **THEN** it contains an `images` key with at minimum a `formats` array specifying `['image/avif', 'image/webp']`
