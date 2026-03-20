Implement the upload recipe action. This is what the UploadRecipe component should call when the upload action is clicked.

It should accept as input:
1. The image File
2. The recipe settings that were parsed from the image File exif (no need to re-parse)
3. The authorname/recipename/notes/links data from the form field
4. Currenly logged in user


It should do the following:
1. Generate a unique URL-friendly slug string for the recipe (author_name_recipe_name)
2. Store the image file as a blob in a store caled 'original-images' with the slug as key
3. Generate an OES file and store it as a blob in a blob store called 'oes-files' with the slug as key
4. Add recipe to the database
5. Add image to database
5. Add entry to recipe_sample_images that links this image to the new recipe


We will also need to implement something that serves the images and OES files from blob storage through URLs, ideally fronted by a CDN. That can be a separate task. For the URLs, we can use /oes/{slug}.oes. For the images we can use /images/{author_id}/{slug}.jpg.
