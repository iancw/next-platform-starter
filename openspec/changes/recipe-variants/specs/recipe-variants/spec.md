## ADDED Requirements

### Requirement: Variant author can link their recipe to an original
Any author SHALL be able to declare their own recipe a variant of another recipe, establishing a directional attribution relationship. The variant author creates the link; no approval from the primary (original) author is required.

#### Scenario: Author links their recipe as a variant
- **WHEN** an authenticated author submits a variant link from their recipe to another recipe
- **THEN** a `recipe_variants` row is created with `primary_recipe_id` = the original recipe, `variant_recipe_id` = the author's recipe, and `created_by_author_id` = the linking author
- **THEN** the author's recipe card displays an attribution link to the original recipe

#### Scenario: Author cannot link a recipe they do not own
- **WHEN** an author attempts to declare another author's recipe as a variant
- **THEN** the system MUST reject the request with an authorization error

#### Scenario: A recipe cannot be a variant of itself
- **WHEN** an author attempts to link a recipe as a variant of itself
- **THEN** the system MUST reject the request with a validation error

#### Scenario: A recipe cannot be a variant of more than one original
- **WHEN** an author attempts to link a recipe that is already declared as a variant of another recipe
- **THEN** the system MUST reject the request and inform the author that the recipe is already linked

#### Scenario: A recipe that is already a primary cannot become a variant
- **WHEN** an author attempts to declare a recipe as a variant, but that recipe already has variants linked to it
- **THEN** the system MUST reject the request (flat structure enforced — no nesting)

### Requirement: Variant recipe displays attribution in the grid and detail view
A recipe that is a variant of another SHALL display a visible attribution link ("variant of [Recipe Name] by [Author]") on its recipe card in the grid and on its detail page.

#### Scenario: Variant card shows attribution in grid
- **WHEN** a variant recipe appears in the recipe grid
- **THEN** its card MUST display a link back to the primary recipe including the primary recipe's name and author name

#### Scenario: Standalone recipe shows no attribution
- **WHEN** a recipe with no variant relationship appears in the grid
- **THEN** no attribution link is displayed

#### Scenario: Variant detail page shows attribution
- **WHEN** a user visits the detail page of a variant recipe
- **THEN** the page MUST display the primary recipe's name and author with a navigable link

### Requirement: Primary recipe detail page lists its variants
A recipe that is the primary in one or more variant relationships SHALL display a Variants section on its detail page listing all linked variant recipes.

#### Scenario: Primary detail page shows variants
- **WHEN** a user visits the detail page of a recipe that has variants
- **THEN** the page MUST show a Variants section listing each variant recipe's name, author, and a link to its detail page

#### Scenario: No variants section when recipe has no variants
- **WHEN** a user visits the detail page of a recipe with no variant relationships
- **THEN** no Variants section is displayed

### Requirement: Primary author can remove a variant link
The author of the primary (original) recipe SHALL be able to remove any variant link from their recipe's detail page, breaking the association.

#### Scenario: Primary author removes a variant link
- **WHEN** the authenticated primary recipe author removes a variant link from their detail page
- **THEN** the `recipe_variants` row is deleted
- **THEN** the former variant recipe's card no longer shows an attribution link
- **THEN** the former variant recipe remains in the grid as a standalone recipe

#### Scenario: Non-owner cannot remove a variant link
- **WHEN** a user who is not the primary recipe's author attempts to remove a variant link
- **THEN** the system MUST reject the request with an authorization error

### Requirement: Same-author primary swap
When an author owns both the primary and variant recipes in a group, they SHALL be able to designate a different recipe as the new primary, making the original a variant of the new one.

#### Scenario: Author swaps primary within their own variant group
- **WHEN** an author who owns all recipes in a variant group designates a different recipe as primary
- **THEN** the operation completes atomically: the new primary has no `variant_recipe_id` entry, and all former siblings (including the old primary) are recorded as variants of the new primary

#### Scenario: Cross-author primary swap is not permitted
- **WHEN** an author attempts to swap the primary of a variant group that includes recipes owned by other authors
- **THEN** the system MUST reject the request

### Requirement: Variant label for display disambiguation
A recipe MAY have an optional `variant_label` (e.g. "Warm", "Cool", "v2") used to disambiguate it when displayed alongside siblings in the primary recipe's Variants section.

#### Scenario: Variant label shown in variants list
- **WHEN** a variant recipe has a non-empty `variant_label`
- **THEN** the Variants section on the primary detail page displays the label instead of the full recipe name for that variant

#### Scenario: Full recipe name used when no label set
- **WHEN** a variant recipe has no `variant_label`
- **THEN** the Variants section on the primary detail page displays the recipe's full `recipe_name`

### Requirement: Near-match suggestion at upload time
During recipe upload, if the parsed settings closely match an existing recipe, the system SHALL surface a non-blocking suggestion prompting the author to consider linking their upload as a variant.

#### Scenario: Near-match detected during upload
- **WHEN** a recipe is uploaded whose numeric settings have a total Manhattan distance ≤ 10 from an existing recipe's settings (excluding shadingEffect and exposureCompensation)
- **THEN** the upload UI displays a dismissable suggestion identifying the similar recipe and offering a one-click option to link as a variant

#### Scenario: No near-match found during upload
- **WHEN** no existing recipe is within the similarity threshold
- **THEN** the upload proceeds normally with no suggestion shown

#### Scenario: Author dismisses the suggestion
- **WHEN** the author dismisses the near-match suggestion
- **THEN** the recipe is created as a standalone recipe with no variant link
