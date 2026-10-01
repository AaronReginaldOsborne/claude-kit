"""Cut a subject (a pet, a product) out of a photo shot on a plain background.

Usage:
    python cutout.py input.png output.png [--thresh 26] [--floor auto|warm|grey|none] [--max 900]

Steps:
1. Flood-fill the background from seeds all along the border (PIL ImageDraw.floodfill; no scipy needed), so light
   areas inside the subject are kept. Raise --thresh (e.g. 40) for a grey or slightly uneven background.
2. Keep only the largest opaque island: specks of background noise go.
3. Alpha = not-background, eroded by 1px and softened, then cropped to the subject.
4. Floor cleanup: generators often leave a floor patch or shadow under the feet that survives step 1. In the bottom band
   of the subject, matching pixels that connect to transparency are removed:
   --floor auto : neutral light pixels only (white background; safe for white or cream subjects)
   --floor warm : any light low-saturation pixel (white background; stronger, for saturated subjects such as an
                  apricot poodle or a golden retriever)
   --floor grey : neutral pixels darker than a light subject (mid-grey background, the way to shoot white subjects)
   --floor none : skip
5. Keep the largest island again, crop, then shrink the longest side to at most --max (default 900; never enlarged).
Always look at the result on the real card colour before using it.
"""
import argparse
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SENT = (255, 0, 255)


def remove_background(im: Image.Image, thresh: int) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    work = rgb.copy()
    seeds = [(x, 0) for x in range(0, w, 24)] + [(x, h - 1) for x in range(0, w, 24)]
    seeds += [(0, y) for y in range(0, h, 24)] + [(w - 1, y) for y in range(0, h, 24)]
    for s in seeds:
        if work.getpixel(s) != SENT:
            ImageDraw.floodfill(work, s, SENT, thresh=thresh)
    a = np.asarray(work)
    bg = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.3))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 10 else 0).getbbox()
    return out.crop(box)


def keep_subject(im: Image.Image, scale: int = 4) -> Image.Image:
    """Keep only the largest opaque island (the subject); specks of background noise left by the flood fill go.
    Labelled on a 1/scale grid (fast in plain Python), then grown by one cell so fine fur edges survive."""
    a = np.array(im)
    alpha = a[:, :, 3]
    h, w = alpha.shape
    sh, sw = (h + scale - 1) // scale, (w + scale - 1) // scale
    small = np.zeros((sh, sw), bool)
    ys, xs = np.nonzero(alpha > 128)
    small[ys // scale, xs // scale] = True
    labels = np.zeros((sh, sw), np.int32)
    sizes = [0]
    for y0 in range(sh):
        for x0 in range(sw):
            if small[y0, x0] and not labels[y0, x0]:
                n = len(sizes)
                labels[y0, x0] = n
                q, count = deque([(y0, x0)]), 0
                while q:
                    y, x = q.popleft()
                    count += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = n
                            q.append((ny, nx))
                sizes.append(count)
    if len(sizes) <= 2:
        return im
    keep = labels == int(np.argmax(sizes))
    grown = keep.copy()
    grown[1:, :] |= keep[:-1, :]
    grown[:-1, :] |= keep[1:, :]
    grown[:, 1:] |= keep[:, :-1]
    grown[:, :-1] |= keep[:, 1:]
    full = np.repeat(np.repeat(grown, scale, axis=0), scale, axis=1)[:h, :w]
    a[:, :, 3] = np.where(full, alpha, 0)
    out = Image.fromarray(a)
    return out.crop(out.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox())


def clean_floor(im: Image.Image, mode: str) -> tuple[Image.Image, int]:
    if mode == "none":
        return im, 0
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    rgb = a[:, :, :3] / 255.0
    mx, mn = rgb.max(2), rgb.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    alpha = a[:, :, 3]
    ys, _ = np.nonzero(alpha > 20)
    if mode == "warm":
        band, s_max, v_min = 0.25, 0.16, 0.60
        floorish = (sat < s_max) & (mx > v_min) & (alpha > 0)
    elif mode == "grey":  # shot on mid-grey: the floor and its shadow are neutral and darker than a light subject
        band = 0.25
        floorish = (sat < 0.10) & (mx < 0.72) & (alpha > 0)
    else:  # auto: neutral (not warm) light pixels only
        band, s_max, v_min = 0.14, 0.07, 0.72
        neutral = rgb[:, :, 2] >= rgb[:, :, 0] - 0.015
        floorish = (sat < s_max) & (mx > v_min) & (alpha > 0) & neutral
    top = int(ys.max() - (ys.max() - ys.min()) * band)
    floorish[:top, :] = False
    remove = np.zeros((h, w), bool)
    q = deque()
    for y in range(top, h):
        for x in range(w):
            if not floorish[y, x]:
                continue
            edge = x in (0, w - 1) or y == h - 1
            near_clear = edge or alpha[y, x - 1] < 10 or alpha[y, x + 1] < 10 or (y + 1 < h and alpha[y + 1, x] < 10) or alpha[y - 1, x] < 10
            if near_clear:
                remove[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not remove[ny, nx] and floorish[ny, nx]:
                remove[ny, nx] = True
                q.append((ny, nx))
    new_alpha = alpha.copy()
    new_alpha[remove] = 0
    soft = np.array(Image.fromarray(new_alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    new_alpha = np.minimum(new_alpha, np.where(remove, 0, soft + (new_alpha - soft) * 0.5))
    a[:, :, 3] = new_alpha
    out = Image.fromarray(a.astype(np.uint8))
    box = out.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    return out.crop(box), int(remove.sum())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--thresh", type=int, default=26, help="flood-fill colour tolerance (raise for off-white backgrounds)")
    ap.add_argument("--floor", choices=["auto", "warm", "grey", "none"], default="auto")
    ap.add_argument("--max", type=int, default=900, help="longest side of the output, in pixels")
    args = ap.parse_args()
    cut = keep_subject(remove_background(Image.open(args.input), args.thresh))
    cut, removed = clean_floor(cut, args.floor)
    cut = keep_subject(cut)
    cut.thumbnail((args.max, args.max))
    cut.save(args.output, optimize=True)
    print(f"{args.output} {cut.size} floor pixels removed: {removed}")


if __name__ == "__main__":
    main()
