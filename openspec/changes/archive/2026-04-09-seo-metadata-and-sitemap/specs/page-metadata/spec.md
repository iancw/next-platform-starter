## ADDED Requirements

### Requirement: Static pages have descriptive metadata
Each static server-rendered page (`/`, `/about`, `/how-to`, `/login`) SHALL export a `metadata` object that includes both a `title` and a `description` field. The root layout SHALL define a site-level `description` as a default.

#### Scenario: About page has title and description
- **WHEN** a crawler or browser fetches `/about`
- **THEN** the page `<title>` is `"About | OM Recipes"` and a `<meta name="description">` tag is present with non-empty content

#### Scenario: How-to page has title and description
- **WHEN** a crawler or browser fetches `/how-to`
- **THEN** the page `<title>` is `"How to Load Color Recipes | OM Recipes"` (or similar descriptive title) and a `<meta name="description">` tag is present

#### Scenario: Root layout description fallback
- **WHEN** a page does not define its own `description`
- **THEN** the root layout's default `description` is used in the rendered `<meta name="description">` tag

### Requirement: Recipe detail pages have dynamic metadata
`/recipes/[id]` SHALL export a `generateMetadata` function that returns a `title` equal to the recipe's name, a `description` derived from the recipe's description field (or a generated fallback), and Open Graph tags.

#### Scenario: Recipe with description
- **WHEN** a crawler fetches `/recipes/<id>` for a recipe that has a non-empty description
- **THEN** the `<title>` contains the recipe name, and `<meta name="description">` contains the recipe's description text

#### Scenario: Recipe without description uses fallback
- **WHEN** a crawler fetches `/recipes/<id>` for a recipe whose `description` is null or empty
- **THEN** `<meta name="description">` contains a generated string referencing the recipe name and author name

#### Scenario: Unknown recipe returns empty metadata
- **WHEN** `generateMetadata` is called with an id that does not match any recipe
- **THEN** an empty object `{}` is returned (Next.js renders no metadata tags rather than erroring)

### Requirement: Recipe detail pages have Open Graph tags
`/recipes/[id]` SHALL include `og:title`, `og:description`, and (when a sample image is available) `og:image` in its generated metadata.

#### Scenario: Recipe with primary sample image
- **WHEN** a crawler fetches `/recipes/<id>` for a recipe that has a primary sample image
- **THEN** the page includes an `og:image` meta tag whose content is the absolute URL of the primary sample image's `smallUrl`

#### Scenario: Recipe without sample image omits og:image
- **WHEN** a crawler fetches `/recipes/<id>` for a recipe that has no sample images
- **THEN** the page does NOT include an `og:image` meta tag

#### Scenario: og:image URL is absolute
- **WHEN** an `og:image` tag is rendered for a recipe detail page
- **THEN** the URL begins with `https://` and is not a relative path

### Requirement: generateMetadata and Page share one DB call per request
The `getRecipeByIdOrSlug` function SHALL be wrapped with `React.cache` so that `generateMetadata` and the `Page` component do not each trigger an independent DB query for the same recipe within a single request.

#### Scenario: Single DB round-trip per recipe page request
- **WHEN** Next.js renders `/recipes/<id>` (running both `generateMetadata` and `Page`)
- **THEN** `getRecipeByIdOrSlug` is invoked only once at the DB level for that request
