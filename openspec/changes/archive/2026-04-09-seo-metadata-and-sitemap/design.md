## Context

The app is Next.js (App Router) with a Postgres database via Drizzle ORM. Recipe detail pages (`/recipes/[id]`) are server components with full DB access. Static pages (`/about`, `/how-to`, `/login`) already export a `metadata` object but have no `description`. The homepage (`/`) is a `"use client"` component and is **out of scope** for this change.

Next.js App Router has a first-class metadata API (`export const metadata` and `export async function generateMetadata`) that writes `<title>`, `<meta>`, and Open Graph tags server-side — no third-party library needed.

## Goals / Non-Goals

**Goals:**
- Every server-rendered page has a meaningful `<title>` and `<meta name="description">`
- Recipe detail pages have dynamic titles, descriptions, and Open Graph image tags sourced from DB data
- `/sitemap.xml` lists all public recipe URLs plus static pages
- `/robots.txt` permits public routes and disallows private ones

**Non-Goals:**
- Homepage SSR refactor — the `"use client"` homepage is not changed
- Structured data / JSON-LD schema markup
- Twitter Card tags (Open Graph tags cover the same use case for most platforms)
- Canonical URL tags

## Decisions

### Use Next.js built-in metadata API, not a third-party library

Next.js App Router's `metadata` / `generateMetadata` exports handle `<title>`, `<meta>`, and Open Graph out of the box with no extra dependencies. The alternative (`next-seo`) predates App Router and adds unnecessary complexity.

### `generateMetadata` on recipe pages reuses existing DB query logic

`app/recipes/[id]/page.jsx` already has `getRecipeByIdOrSlug`. `generateMetadata` will call the same function (same params signature) — it runs in a separate request lifecycle but Next.js deduplicates the DB call via `React.cache` if we wrap the function. We will wrap `getRecipeByIdOrSlug` in `React.cache` so the two calls (metadata + page) share one DB round-trip.

**Alternative considered:** Fetch only the fields needed for metadata (name, description, image) in a separate lightweight query. Rejected because the deduplication via `React.cache` achieves the same result with less code.

### Open Graph image: use `smallUrl` of the primary sample image

Recipe pages may have multiple sample images. The primary sample image (`isPrimary: true`) is the most representative. Its `smallUrl` is already a CDN-hosted, resized URL appropriate for OG previews. If no primary image exists, fall back to the first sample image; if no images, omit `og:image`.

### `app/sitemap.js` queries all recipes at request time (no build-time snapshot)

A dynamic `sitemap.js` runs on each Googlebot request (which is infrequent). This keeps the sitemap always current without a build step. Recipes are fetched as `{ uuid, slug, updatedAt }` — only the columns needed for the URL and `lastModified` field.

**Risk:** If the recipe table grows very large (tens of thousands), the sitemap could be slow or exceed the 50 MB / 50,000 URL sitemap limit. At current scale this is not a concern; a sitemap index approach can be added later if needed.

### `app/robots.js` disallows private routes

Private routes (`/my-samples`, `/profile`, `/user`, `/upload`) require authentication and return no indexable content. Disallowing them prevents wasted crawl budget and avoids Google indexing login redirects.

## Risks / Trade-offs

- **`React.cache` deduplication only works within a single request.** If Next.js ever runs `generateMetadata` and `Page` in different requests (e.g., with edge streaming), there will be two DB calls instead of one. This is acceptable — it degrades to slightly more DB load, not incorrect behavior.
- **Sitemap `lastModified`:** Recipes don't currently have an `updatedAt` column surfaced in the query. We can use the current date as a conservative fallback, or omit `lastModified` entirely. Omitting is simpler and Google treats it as optional.
- **OG image URL must be absolute.** Next.js `generateMetadata` with a relative URL will not produce a valid `og:image`. We must construct an absolute URL using the `NEXT_PUBLIC_BASE_URL` env var (or equivalent).
