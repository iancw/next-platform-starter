- [x] Implement upload actions
- [x] Fix rendering after drop (remove empty parens, remove Download OES Link)
- [x] Is Vignetting still there? And EV comp?
- [x] Add my recipes page, allowing you to delete recipes, edit notes, etc.
- [ ] Better confirmation when updating profiel page
- [ ] Better experience when image matches existing image
- [ ] Resizing function
- [ ] Left/Right arrows for recipes



# What needs to be done before it's ready to ship?

## Improve login experience

It shows "Log in to dev-kpfvi3d10iz34a1o to continue to OM Recipes." which ... is weird. But dev I guess.  Let's ignore for now. I'll research more later.

## Implement Profile page

Let you set your name, insta links, etc. Don't show all the auth0 details. Only show form to edit fields in the authors schema.

## Upload page form improvements

- Fix styling of input fields.
- Prepopulate fields with your author name and perhaps a name from the EXIF?

## Upload checks

- Only accept JPGs with the exif data
- If recipe matches existing recipe, don't create a duplicate, but offer to attach image as community sample
  - Match should be evaluated usign recipe settings only (color saturation levels, shadows/midtones/highlights, contrast, sharpness, and white balance related settings) Ignore Shading Effect and Exposure Compensation for matching purposes.

## Image resizing / loading improvements

- Try netlify image CDN system?

## Recipe deletion improvements

- Ensure all loose ends are cleaned up.
  - Delete image(s) from object storage
  - Delete images from DB
  - Delete associated sample images
- Confirm deletion, showing number of community samples & etc.
  - Or do we disallow deletion? Only allow it in dev mode?

## My Recipes improvements

- Remove the red X
- Remove "upload new" button (link in the header is good enough)

## Recipe dedicated page

- Directly link to specific recipe
- Shows the delete button if you own it, clicking shows dialog requiring you to type the recipe name to delete
- Allows edits if you own it / has an Update button
- Shows all community samples and comparison samples as carosel
