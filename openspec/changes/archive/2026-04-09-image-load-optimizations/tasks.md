## 1. Configuration

- [x] 1.1 Add `images` block to `next.config.js` with `formats: ['image/avif', 'image/webp']`

## 2. Recipe Card Components

- [x] 2.1 Remove `unoptimized` from `RecipeSimpleCard` (`components/recipe-simple-card.jsx`) — verify `sizes` prop is already correct
- [x] 2.2 Remove `unoptimized` from `RecipeCard` (`components/recipe-card.jsx`), switch to `fill` layout inside a positioned container, add `sizes` prop

## 3. Sample Gallery

- [x] 3.1 Replace `<img>` tags in `SampleGallery` (`components/SampleGallery.jsx`) with Next.js `Image`, add `fill` layout and `sizes` prop for thumbnails
- [x] 3.2 Add `priority` to the first image in the gallery grid; all others lazy-load by default

## 4. My Samples Grid

- [x] 4.1 Replace `<img>` tag in `MySamplesGrid` (`components/MySamplesGrid.jsx`) with Next.js `Image`, add `fill` layout and `sizes` prop

## 5. How-To Page

- [x] 5.1 Replace `<img>` tags in `app/how-to/page.jsx` with Next.js `Image`, using explicit `width`/`height` and `style={{ width: '100%', height: 'auto' }}` for responsive layout

## 6. Home Page Priority

- [x] 6.1 Pass a `priority` prop to the first `RecipeSimpleCard` on the home page (`app/page.jsx`) so the first above-the-fold image is preloaded
