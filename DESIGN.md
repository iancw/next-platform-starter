
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
    - Settings
        - color
        - contrast
        - sharpness
        - curves
            - shadow
            - mid
            - high
        - grain
        - shading effect
    - Name
    - Description
    - Recommended settings
    - Author
    - Rating (number of likes)
    - Original image (link to original image shared)
    - Sample images (list of links to image files)
    - Comments (list of comments left by others)
- Author
    - Name
    - Email
    - Instagram handle
    - Website
    - Forum link

# Recipe Rules
- Color saturation goes from +5 to -5
    - Yellow #FCF750
    - Orange #DBA12A
    - OrangeRed #CC1210
    - Red #CD076B
    - RedMagenta #970AA0
    - Magenta #7710E8
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
