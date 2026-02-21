import { Markdown } from '../../components/markdown';

export const metadata = {
    title: 'How-to'
};

const content = `
# How to use OM Workspace batch processing files (.OES)

This site includes downloadable **OM Workspace batch processing files** (with the extension **.OES**). These allow you
to load the recipe settings into OM Workspace and apply them to any rawo (.ORF) file. An **OES** file is an **OM Workspace preset**
you can load to apply a saved set of image adjustments (including the *Color Profile / Color Recipe* settings used by OM System cameras).


A Batch Processing (.OES) file can't be loaded directly into the camera. There is a different workflow for that,
which uses straight-out-of-camera JPG images from a compatible camera. Unfortunately JPGs
 rendered by OM Workspace don't have the correct settings in the EXIF of the exported JPG,
 so those files can't be used to load a recipe direclty into the camera.


## Download an OES file from this site

1. Open a recipe.
2. Find the **OM Workspace Batch Processing File** link/button.
3. Save the .OES file somewhere you can find again (e.g., Downloads).

## Load an OES file in OM Workspace

The exact menu names can vary slightly by OM Workspace version, but the workflow is generally:

1. Open **OM Workspace**.
2. Select a raw photo (.ORF) or group of photos
3. Click the floppy disk icon in the lower right, it will show "Save Batch Processing File" and "Load Batch Processing File" options
<figure>
  <img
    src="/images/how-to/om-wkspc-oes-load.png"
    alt="OM Workspace: loading an .OES preset file"
    class="w-full max-w-3xl rounded border border-neutral-800"
  />
  <figcaption class="mt-2 text-sm text-neutral-400">
    OM Workspace: load/import the downloaded .OES file.
  </figcaption>
</figure>
4. Choose "Load Batch Processing File"
4. Select the downloaded OES file
5. Settings are now applied and visible in the Edit pane


<figure>
  <img
    src="/images/how-to/om-wkspc-oes-open.png"
    alt="OM Workspace: opening the preset/batch processing panel"
    class="w-full max-w-3xl rounded border border-neutral-800"
  />
  <figcaption class="mt-2 text-sm text-neutral-400">
    OM Workspace: open the preset / batch processing area.
  </figcaption>
</figure>

### Tip: apply to many photos (batch)

If you want to use the same look on multiple images, select multiple photos first, then apply the loaded preset so the settings are applied in one go.
`;

export default function HowToPage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-8 py-10">
            <Markdown content={content} />
        </div>
    );
}
