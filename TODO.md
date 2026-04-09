# Security  Findings

  - High: the upload finalize action trusts client-supplied recipeId and objectKey more than it should. In app/upload/actions.js:496, it
    only checks that imageId belongs to the supplied authorId (app/upload/actions.js:517), then accepts any objectKey that exists in the
    original bucket (app/upload/actions.js:529) and inserts the sample against whatever recipeId was posted (app/upload/actions.js:562). A
    caller who invokes the server action directly could attach an image to an arbitrary recipe, or point their image row at an existing
    object they did not upload. That is the main issue I’d fix before making this public.
  - Medium: the magic-link request endpoint has no throttling, captcha, or abuse controls. app/auth/request-link/route.js:19 accepts
    unauthenticated POSTs and lib/auth.js:173 will create a token and send email for any valid address. Once public, this can be used for
    email spam, cost amplification, and mailbox flooding.
  - Medium: upload validation is weak against resource abuse. The server-side check in app/upload/actions.js:267 trusts client-reported MIME
    type / filename and I did not find a server-enforced max file size. The resize function then downloads the whole object into memory in
    oci-functions/image-resize-fn/func.py:110 and processes it with Wand in oci-functions/image-resize-fn/func.py:132. That makes oversized
    or malformed uploads an avoidable DoS path.


# Features
- [x] Save recipes for later, combine this with ranking. Ranking = number of saves
- [ ] Similarity search ... given a recipe, show similar recipes. During upload and perhaps otherwise
- [x] Feature: Liking recipes, sort by order of likes
- [x] Refactor frontend to use shadcn components and styling
- [x] Feature: User saves favorite recipes
- [ ] Feature: Commenting on recipes
- [ ] Feature: Notifications for activity on your recipes


