## 1. Shared Setup

- [x] 1.1 Confirm `NEXT_PUBLIC_BASE_URL` env var exists (or identify the equivalent) for constructing absolute URLs in OG image tags and the sitemap `Sitemap:` directive
- [x] 1.2 Wrap `getRecipeByIdOrSlug` in `React.cache` in `app/recipes/[id]/page.jsx` to deduplicate the DB call between `generateMetadata` and `Page`

## 2. Static Page Metadata

- [x] 2.1 Add `description` to the root `metadata` export in `app/layout.jsx` (e.g., "Discover and share color recipes for OM System and Olympus cameras.")
- [x] 2.2 Add `description` to the `metadata` export in `app/about/page.jsx`
- [x] 2.3 Update `title` and add `description` to the `metadata` export in `app/how-to/page.jsx` (title: "How to Load Color Recipes")
- [x] 2.4 Add `description` to the `metadata` export in `app/login/page.jsx`

## 3. Dynamic Recipe Metadata

- [x] 3.1 Replace the static `export const metadata` in `app/recipes/[id]/page.jsx` with `export async function generateMetadata({ params })`
- [x] 3.2 Implement description fallback: if `recipe.description` is null/empty, return `"Color recipe for OM System / Olympus cameras by <authorName>."`
- [x] 3.3 Add Open Graph fields (`og:title`, `og:description`, `og:image`) — use the primary sample image's `smallUrl` as `og:image`; skip `og:image` if no sample images exist
- [x] 3.4 Ensure the `og:image` URL is absolute (prepend `NEXT_PUBLIC_BASE_URL` if the URL is relative, or confirm CDN URLs are already absolute)
- [x] 3.5 Handle the not-found case: return `{}` from `generateMetadata` when the recipe doesn't exist

## 4. Sitemap

- [x] 4.1 Create `app/sitemap.js` with a default export async function
- [x] 4.2 Query the DB for all recipes, selecting only `uuid` and `slug`
- [x] 4.3 Map each recipe to a sitemap entry: `{ url: '<baseUrl>/recipes/<uuid ?? slug>' }`
- [x] 4.4 Prepend entries for static public pages: `/`, `/about`, `/how-to`
- [x] 4.5 Verify `/sitemap.xml` renders valid XML in the browser (no private routes present)

## 5. Robots

- [x] 5.1 Create `app/robots.js` with a default export function
- [x] 5.2 Return rules: `Allow: /` for all agents, plus `Disallow` for `/my-samples`, `/profile`, `/user`, `/upload`
- [x] 5.3 Include `sitemap` field pointing to the absolute `/sitemap.xml` URL
- [x] 5.4 Verify `/robots.txt` renders correctly in the browser
