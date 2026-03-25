# Features
- [x] Save recipes for later, combine this with ranking. Ranking = number of saves
- [ ] Similarity search ... given a recipe, show similar recipes. During upload and perhaps otherwise
- [x] Feature: Liking recipes, sort by order of likes
- [x] Refactor frontend to use shadcn components and styling
- [ ] Limit number of samples and recipes per author
- [x] Feature: User saves favorite recipes
- [ ] Feature: Commenting on recipes
- [ ] Feature: Notifications for activity on your recipes

# Completed Features
- [x] Set up auth in frontend app for upload page
- [x] Try out function
- [x] Set up database
- [x] Create Author profile page (name, social links, id, picture)
- [x] Create upload page (requires login)
- [x] Clean up data in DB (change "Sample" to "Lighthouse golden hour", drop fullSizeUrl from all current images)
- [x] Add OES link to the image, make it match the slug
- [x] Filters to show various sample images or original images
- [x] Feature: Manage your sample images after uploading
- [x] Upload multiple images, automatically determine which recipe they match
- [x] Community samples
- [x] Recipe similarity

# Pre-Deploy Features
- [ ] Add instructions on uploading image to camera
- [x] Test uploading resized images to camera

# Tasks
- [x] Set up unique authors and author emails for current recipes. Add a note when you log in to claim a particular recipe by emailing help@om-recipes.com
- [x] Set up budgets in OCI compartment to limit spend
- [ ] Add lighthouse samples to all images
- [ ] Add other types of samples to all images
- [ ] Track down original images for authors
- [ ] Post announcements on boards & sites
- [x] Fuzzy match on white balance name (auto vs keep warm colors ... call it a match still)
- [x] Don't allow images processed by OM Workspace -- exif data is incorrect (but do allow them for comparisons)
- [x] Render links for recipe
- [ ] Looks like we aren't saving exif string in DB with images, we should
- [ ] Disable image download when image doesn't have sample string (e.g. as with dave herring's and possibly other samples)

# Bugs
- [x] There are two recipes pages and one throws errors ... reconsile /recipes/app and app
- [x] Log In button doesn't change after logout right away, needs extra refresh
- [x] Log in button isn't aligned properly
- [x] Hide kofi link on profile page
- [x] Update profile button always enabled, should be clear when you've saved changes
- [x] Set up email for help@om-recipes.com
- [x] Author links don't work for ... authors who aren't me
- [x] Constrain height of portrait pictures to match height of landscap images for visual consistency

# Deployment
- [x] Configure database and other environnment variables
- [x] Push main (squash merge)
