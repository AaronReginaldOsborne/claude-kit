# Sample photos while the client's photos are pending

**Ask the user first, at the pick.** Say why: the design needs real-looking subjects to judge. Say where they will show: only in the review preview, never on the live site, named as samples in their alt text and in the review email.

On the live site, a sample never stands in for the client's real work: no before and after pairs, portfolio pieces, products they sell, or reviews. For a business that sells what it makes (a bakery's cakes), every product photo on the live site must be the client's own. Samples stay in the preview, and the review email says they are placeholders.

## Generate (an image-generation tool, e.g. the nano-banana-pro MCP's `generate_image`)
- **Prompt formula that cuts out cleanly:** "Photorealistic studio photo of <subject>, <finished or groomed state>, <pose> and looking at the camera, <one small accessory in the brand colours>. Soft even studio lighting, full body, centred, isolated on a pure plain <background> with no floor and no shadow, generous empty space around it. High detail, sharp focus, commercial <niche> photography."
- **Background:**
  - white for saturated subjects (an apricot or golden dog, a chocolate cake);
  - flat chroma-key green (#00FF00) for white or near-white subjects (a white cat, white icing, meringue).
  - On green, nothing on the subject or its props may be green, yellow or gold:
    - the key treats green as background, so a green bow turns grey inside the subject and vanishes at its edge;
    - the spill removal shifts yellow and gold toward orange, and creams toward peach.
    - A gold accessory goes on a subject shot on white.
  - A light subject on white loses its edges and keeps floor patches. On mid-grey it keeps a grey halo and a shadow patch.
- **Settings:** aspect ratio 3:4 for upright subjects and 4:3 for lying or wide ones, at about 1K.
- **Accessories in the brand colours make it feel custom.** The first build's hero was a small dog wearing a bandana in the brand colours.
- **A before and after demo pair must line up exactly.** Generate the clean "after", then paint the "before" over it in code (mud blobs and specks, for example). Two separate generations never line up.

## Cut out: `reference/cutout.py` (needs Pillow and numpy)
Each command goes on one line:
```
python <skill>/reference/cutout.py sample.png cutout.png --matte green                 # light subject shot on chroma-key green
python <skill>/reference/cutout.py sample.png cutout.png --floor warm                  # saturated subject on white
python <skill>/reference/cutout.py sample.png cutout.png                               # fallback: a light subject already shot on white
python <skill>/reference/cutout.py sample.png cutout.png --thresh 40 --floor grey      # fallback: a light subject already shot on mid-grey
```
The steps on white or grey:
1. Flood-fill the background from the border.
2. Keep only the largest subject: specks of background noise go.
3. Soften the edge and crop.
4. Remove the floor patch and shadow under the feet.
5. Crop again and shrink to at most 900px.

On green (`--matte green`), steps 1, 3 and 4 become one:
- The background is everything joined to the border through screen-like pixels, shadows on the screen included.
  - So the lit floor and its shadows drop out.
  - A hole that shows lit screen is cleared too.
- The outline gets a soft edge, unmixed from the screen.
- Green spill is removed everywhere (green is capped at the average of red and blue), which also shifts creams toward peach.
- Deep shadow on the subject itself (under the chest, between the legs) stays dark.

Look at every result on the real card colour, at 2x zoom as well: halos, spill and dark patches under the subject hide at 1x. Regenerate or retouch what shows.

## Make them small
Convert to WebP. The first build went from about 4.5 MB to about 280 KB:
```python
from PIL import Image
Image.open("cutout.png").save("cutout.webp", "WEBP", quality=84, method=6)
```

## Keep them preview-only
- **`src/content/preview.ts`:**
  - `export const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";`
  - each sample as `{ src: "/dev-fixtures/preview/<file>.webp", width, height, alt: "Sample photo: …" }`.
- **`src/app/dev-fixtures/[...path]/route.ts`:**
  - serves `tests/fixtures/<folder>/<file>` only when `PREVIEW_FIXTURES === "1"`;
  - allows two path parts, a known folder, and `^[a-z0-9-]+\.(png|webp)$` only;
  - sets the content type, with `cache-control: public, max-age=3600`;
  - answers 404 otherwise.
- **`next.config.ts`** (file tracing follows the route's `path.join`, so be explicit both ways, and keep your other settings in `base`):
  ```ts
  import type { NextConfig } from "next";

  const base: NextConfig = {
    /* the project's other settings */
  };
  const FIXTURE_ROUTE = "/dev-fixtures/\\[\\.\\.\\.path\\]";
  const preview = process.env.PREVIEW_FIXTURES === "1";

  export default preview
    ? {
        ...base,
        outputFileTracingIncludes: { [FIXTURE_ROUTE]: ["./tests/fixtures/preview/*.webp"] },
        outputFileTracingExcludes: { [FIXTURE_ROUTE]: ["./tests/fixtures/preview/*.png"] }, // raw sources stay home
      }
    : { ...base, outputFileTracingExcludes: { [FIXTURE_ROUTE]: ["./tests/fixtures/**/*"] } };
  ```
  Verify with the route's `.next/server/app/dev-fixtures/[...path]/route.js.nft.json`: only the served files in a preview build, none in a production build.
- **Components:**
  - `PREVIEW ? <Image src={sample.src} alt={sample.alt} unoptimized … /> : <the logo or an icon>`;
  - `unoptimized` because the samples come from a route, not `public/`;
  - no visible "Sample" tag on the photos: the alt text and the review email say they are samples. The first build's tags on every photo were removed as clutter.
- **The layout:** `robots: { index: false, follow: false }` in the metadata when `PREVIEW`.
- **Vercel:** set both flags on the Preview environment only.

## The client's real photos
- Originals stay in a git-ignored folder. Only the copies an import script writes enter the repo. The script must:
  - auto-orient;
  - strip all metadata, GPS included (phone photos carry the location of a shop or a home);
  - write web sizes in WebP or AVIF;
  - for a before and after pair, apply the same crop to both.
- Get consent from anyone pictured, and from pet owners for their pets' photos. Record it in `docs/DECISIONS.md`.
