
# Website
- Search bar
- Render the recipe
    - Wheel
    - Curves
    - White balance
    - other settings
- Render against samples
- Upload recipe
    - Upload JPG file
    - Upload OES file

# Use cases
- Find recipe by name
- Find recipe by author
- Find recipes with compatible white balance settings
- Find recipe by author
- View recipe details/settings
- Download recipe OES/JPG for use
- View recipe applied to sample images
- Compare recipes
    - Show multiple versions of the same image — comparing recipes across the same image
- See one recipe across many sample shots
    - Golden hour
    - Mid day
    - Overcast
    - Portraits / people
    - Nature / green
    - Nature / reds
    - Urban / street

# Database
- Recipe
    - id
    - user_id
    - slug
    - Recipe Name
    - Author Name
    - Description
    - Yellow
    - Orange
    - OrangeRed
    - Red
    - Magenta
    - Violet
    - Blue
    - BlueCyan
    - Cyan
    - GreenCyan
    - Green
    - YellowGreen
    - Contrast
    - Sharpness
    - Shading Effect
    - Highlights
    - Shadows
    - Midtones
    - White Balance 2
    - White Balance Temperature
    - White Balance Amber Offset
    - White Balance Green Offset
    - Exposure Compensation
- Recipe_community_samples
    - recipe_id
    - image_id
    - author_id
- Recipe_author_samples
    - recipe_id
    - image_id
    - author_id
- Image
    - id
    - author_id
    - Dimensions
    - Camera
    - Lens
    - Original file size
    - Exif String
    - Link to full size version
    - Link to small version
- Author
  - id
  - oidc_sub
  - name
  - instagram_link
  - flickr_link
  - website
  - kofi_link

# Recipe Rules
- Color saturation goes from +5 to -5
    - Yellow #FCF750
    - Orange #DBA12A
    - OrangeRed #CC1210
    - Red #CD076B
    - Magenta #970AA0
    - Violet #7710E8
    - Blue #3054E0
    - BlueCyan #5392EB
    - Cyan #83E7EB
    - CyanGreen #87EE77
    - Green #9DEE3A
    - GreenYellow #CBEE3A
- Shadows, Mids, Highs go from -7 to +7
- Shading effect goes from -5 to +5
- Sharpness goes from -2 to +2
- Contrast goes from -2 to +2


# Image processing flow
- Upload -> pending-recipe blob -> Function (exiftool, OES, recipe JSON) -> processed-recipe-blob -> User confirmation -> Database


# Recipe Upload flow

- Drag image
- Send to action
  - Read exif
  - Return recipe JSON
- Populate recipe card -- show wheel & settings & stuff
- Enable the Save button
- Store original image as blob or object storage
- Generate OES, store as blob or object storage
- Process image into smaller version
