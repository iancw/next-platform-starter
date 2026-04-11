## ADDED Requirements

### Requirement: robots.txt permits public routes
The app SHALL expose a `/robots.txt` via `app/robots.js` that allows all user agents to crawl public routes by default.

#### Scenario: Default allow rule
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the response contains a rule permitting all user agents (`User-agent: *`) with `Allow: /`

### Requirement: robots.txt disallows private routes
The `/robots.txt` SHALL disallow crawling of authenticated-only routes: `/my-samples`, `/profile`, `/user`, and `/upload`.

#### Scenario: Private routes are disallowed
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the response contains `Disallow` directives for `/my-samples`, `/profile`, `/user`, and `/upload`

### Requirement: robots.txt references the sitemap
The `/robots.txt` SHALL include a `Sitemap:` directive pointing to the absolute URL of `/sitemap.xml`.

#### Scenario: Sitemap directive present
- **WHEN** a crawler fetches `/robots.txt`
- **THEN** the response contains a `Sitemap:` line with the absolute URL `https://<domain>/sitemap.xml`

#### Scenario: robots.txt returns plain text
- **WHEN** `/robots.txt` is fetched
- **THEN** the response has `Content-Type: text/plain`
