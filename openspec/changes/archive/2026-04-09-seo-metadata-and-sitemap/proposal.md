## Why

Recipe pages have no meaningful `<title>` or `<meta description>`, there is no sitemap to help Google discover them, and no `robots.txt` to guide crawlers — all of which suppress organic search visibility for a site whose value is its library of shareable, linkable recipes.

## What Changes

- **Dynamic metadata on recipe detail pages**: `generateMetadata` replaces the static `title: 'Recipe'` export, using the recipe name as the page title, the recipe description (or a generated fallback) as the meta description, and the primary sample image for Open Graph.
- **Descriptive metadata on all static pages**: `layout.jsx`, `about/page.jsx`, `how-to/page.jsx`, and `login/page.jsx` gain a `description` field and site-level Open Graph defaults.
- **`app/sitemap.js`**: Dynamic sitemap listing all public recipe URLs (`/recipes/[uuid-or-slug]`) plus static pages, enabling faster and more complete Googlebot indexing.
- **`app/robots.js`**: `robots.txt` that allows all public routes and disallows authenticated/private routes (`/my-samples`, `/profile`, `/user`, `/upload`).
- **Open Graph tags on recipe pages**: `og:title`, `og:description`, and `og:image` (primary sample image URL) added via `generateMetadata`.

## Capabilities

### New Capabilities

- `page-metadata`: Dynamic and static Next.js metadata (title, description, Open Graph) across all pages
- `sitemap`: Auto-generated `/sitemap.xml` listing all public recipe and static page URLs
- `robots`: `/robots.txt` permitting public routes and blocking private ones

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `app/layout.jsx` — add site-level `description` and Open Graph defaults to the root `metadata` export
- `app/recipes/[id]/page.jsx` — replace static `metadata` export with `generateMetadata`; reads recipe from DB (reuses existing `getRecipeByIdOrSlug` logic)
- `app/about/page.jsx`, `app/how-to/page.jsx`, `app/login/page.jsx` — add `description` to each page's `metadata` export
- `app/sitemap.js` — new file; queries DB for all recipe UUIDs/slugs
- `app/robots.js` — new file; no DB dependency
- No API changes, no schema changes, no dependency additions
