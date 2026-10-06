# Brand from the client's logo

## Vector first
Ask for the vector source: the designer's AI, EPS, SVG or PDF. A logo guide PDF is often all vector and holds every version (full colour, one colour, reverse).

## Check a PDF is really vector (PyMuPDF: `pip install pymupdf`)
```python
import pymupdf
doc = pymupdf.open("logo-guide.pdf")
for i, page in enumerate(doc):
    print(i, "drawings:", len(page.get_drawings()), "images:", len(page.get_images()))
```
- **Drawings and no images:** vector. Go on.
- **Only images:** a bitmap wrapped in a PDF. Ask for the real vector file before tracing anything.

## Export each version to SVG
- `page.get_svg_image()` exports a whole page. That is fine for a page holding one logo, but large and full of other content for a guide sheet.
- For a guide sheet, rebuild each logo from `page.get_drawings()`:
  - keep the items inside that logo's rectangle;
  - write them as `<path>` elements in an SVG whose viewBox is that rectangle;
  - round the coordinates to one decimal.
- **Each drawing's values:**
  - `fill` and `color` (stroke) are 0-to-1 RGB tuples: convert them to hex;
  - when `even_odd` is true, set `fill-rule="evenodd"`, or letter counters and holes fill in;
  - stroked items need `stroke` and `stroke-width` (from `width`).
- Add `role="img"` and an `aria-label`, or use the file through an `<img alt>`.
- **A reverse (white) version:** paint the coloured shapes white. Where white details sat on colour (eyes, pads, lettering holes), use an SVG mask so they become holes, not white paint.
- **Look at each SVG** on white and on the dark brand colour before using it.

## Favicons (with the tokens, so no preview shows the framework's icon)
Run `reference/make-icons.mjs` from the client's repo, twice:
1. `node <skill>/reference/make-icons.mjs --logo public/brand/<logo>.svg`
   - It prints the logo's bounds and its widest empty bands.
   - It gives a suggested `--keep` for each side of each band: a stacked logo's mark sits above or below a row band, and a side-by-side logo's mark sits left or right of a column band.
   - Shapes that paint nothing (hidden layers, no fill and no stroke, off the artboard) are ignored.
2. The same command with `--keep x0,y0,x1,y1` around the mark alone.
   - A wordmark squeezed into a square is unreadable at 16 px.
   - If no part of the logo stands alone, ask the user which part to use.

It writes into the app directory, found the way Next.js finds it (`app/`, else `src/app/`; `--out` overrides):
- `icon.svg`, square, fitted to what the mark actually paints, strokes and shadows included;
- `favicon.ico` (16, 32 and 48 px), replacing create-next-app's default;
- `apple-icon.png` (180 px on white).

Next.js adds the `<link>` tags. Then read the contact sheet it writes, `design-research/icons-preview.png`, which shows each size on a light and a dark tab. If the mark is a blur at 16 px, tell the user; never simplify their logo unasked. Record the command in `docs/DECISIONS.md`, so the icons are made again when the logo changes.

## Colours
- Read the brand colours from the vector fills, not from a screenshot.
- Record them in `docs/DECISIONS.md` with the source.
- If the guide gives CMYK only, convert, then check the converted colour against the client's printed material.

## No logo
Ask the user before designing one. Never invent a logo for the client without being asked.
