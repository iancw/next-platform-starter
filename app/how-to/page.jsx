import { Markdown } from '../../components/markdown';

export const metadata = {
    title: 'How-to'
};

const content = `
# Contents

- [Load a recipe via OES file in OM Workspace](#oes)
- [Load a recipe into your camera using a JPG image](#camera-upload)

<a id="oes"></a>
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


<a id="camera-upload"></a>
# Load a recipe into your camera using a JPG image

OM System cameras store recipe settings in the EXIF data of straight-out-of-camera JPG files.
OM Workspace can read that EXIF data and send the recipe directly into your camera — no manual entry required.

> **Note:** Loading a recipe this way will **not** transfer the white balance settings from the recipe. You will need to set those manually on the camera.

### Steps

<ol>
<li>In OM Workspace, open the <strong>Camera</strong> menu and select <strong>Load Color/Monochrome Profile</strong>.
<figure>
  <img src="/images/how-to/om-camera-upload-1.png" alt="OM Workspace: Camera menu — Load Color/Monochrome Profile" class="w-full max-w-3xl rounded border border-neutral-800" />
  <figcaption class="mt-2 text-sm text-neutral-400">OM Workspace: Camera → Load Color/Monochrome Profile.</figcaption>
</figure>
</li>
<li>Select the recipe image JPG file you downloaded from this site.
<figure>
  <img src="/images/how-to/om-camera-upload-2.png" alt="OM Workspace: selecting the recipe JPG file" class="w-full max-w-3xl rounded border border-neutral-800" />
  <figcaption class="mt-2 text-sm text-neutral-400">Select the straight-out-of-camera JPG containing the recipe.</figcaption>
</figure>
</li>
<li>Click <strong>Next</strong>.</li>
<li>When prompted, connect your camera via USB and select <strong>MTP</strong> mode on the camera. <em>(Tip: It can help to wait until OM Workspace asks you to connect before plugging in — connecting too early sometimes causes it to hang indefinitely.)</em></li>
<li>Select which <strong>Custom Mode</strong> slot(s) and <strong>Color Profile</strong> slot to load the recipe into.
<figure>
  <img src="/images/how-to/om-camera-upload-3.png" alt="OM Workspace: selecting Custom Mode and Color Profile slots" class="w-full max-w-3xl rounded border border-neutral-800" />
  <figcaption class="mt-2 text-sm text-neutral-400">Choose which Custom Mode and Color Profile slots to write the recipe to.</figcaption>
</figure>
</li>
<li>Click <strong>Load</strong>.</li>
</ol>
`;

export default function HowToPage() {
    return (
        <div className="mx-auto w-full max-w-4xl px-8 py-10">
            <Markdown content={content} />
        </div>
    );
}
