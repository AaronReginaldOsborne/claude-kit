"""Cut a subject (a pet, a product) out of a photo shot on a plain background.

Usage:
    python cutout.py input.png output.png [--matte flood|green] [--thresh 26] [--floor auto|warm|grey|none] [--max 900]

--matte green is for a subject shot on chroma-key green (#00FF00), the way to shoot white or near-white subjects. The
background is everything joined to the border through screen-like pixels, shadows on the screen included, so the lit
floor and its shadows drop out, and a hole that shows lit screen is cleared too. The outline is unmixed from the
screen and green spill is removed everywhere, which also shifts creams and yellows toward peach and orange: nothing
green, yellow or gold on a green screen. Deep shadow on the subject itself (under the chest, between the legs) stays
dark, so check under the subject at 2x and regenerate or retouch if it shows. Then step 2 and the resize below apply.
The default, --matte flood, is for a white or mid-grey backdrop, tuned with --thresh and --floor:

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
   --floor grey : neutral pixels darker than a light subject (mid-grey background; for light subjects, shooting on
                  green and using --matte green leaves no grey halo)
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


def _grow(mask: np.ndarray, px: int) -> np.ndarray:
    """The mask grown by px pixels (px >= 1)."""
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(2 * px + 1))) > 127


def green_matte(im: Image.Image, band: int = 2, rim: int = 2) -> Image.Image:
    """For a subject shot on a chroma-key green backdrop (the way to shoot white or near-white subjects).
    1. The screen's colour is the median of the green pixels along the border.
    2. Background is everything joined to the border, or to an enclosed patch of lit screen (a hole, a gap between
       legs), through screen-like pixels: green in proportion to their own brightness, as the screen is, so a shadow
       on the screen (a darker green) is background too. Near-black pixels count only when green leads them, so a
       black nose or eye at the outline stays.
    3. Everything else is the subject and stays opaque, including fur tinted green by bounce light under a chin.
    4. The outline: background within `band` px of the subject, and the subject's own `rim` px, get a soft alpha from
       the subject's coverage, with a dead zone so the glow a light subject throws on the screen stays clear, and
       their colour is unmixed from the screen. Background farther out is fully clear.
    5. Despill: green is capped at the average of red and blue, which takes green bounce light off white and tan fur.
       It also shifts creams and yellows toward peach or orange (cream 245,235,200 becomes 245,222,200), and anything
       green on the subject turns grey or vanishes."""
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w = rgb.shape[:2]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = g - np.maximum(r, b)  # high on the screen, zero or below on fur and skin
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    border_excess = border[:, 1] - np.maximum(border[:, 0], border[:, 2])
    screen = np.median(border[border_excess > 18], axis=0) if (border_excess > 18).any() else np.array([0.0, 255.0, 0.0])
    s_ex = max(float(screen[1] - max(screen[0], screen[2])), 1.0)
    s_ratio = s_ex / max(float(screen[1]), 1.0)
    ratio = excess / np.maximum(g, 1.0)  # brightness-free: a shadow on the screen keeps the screen's ratio
    green_led_dark = (np.maximum(np.maximum(r, g), b) < 30) & (g >= np.maximum(r, b) + 4)
    screenlike = ((ratio >= 0.5 * s_ratio) & (g >= 12)) | green_led_dark
    # .copy(): an image made by fromarray can share the array's read-only memory, and floodfill would then write nowhere.
    mask = Image.fromarray((screenlike * 255).astype(np.uint8), "L").copy()
    for seed in [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]:
        if mask.getpixel(seed) == 255:
            ImageDraw.floodfill(mask, seed, 128)
    for y, x in np.argwhere((np.asarray(mask) == 255) & (excess >= 0.8 * s_ex)):  # enclosed lit screen
        if mask.getpixel((int(x), int(y))) == 255:
            ImageDraw.floodfill(mask, (int(x), int(y)), 128)
    background = np.asarray(mask) == 128
    subject = ~background
    coverage = 1 - np.clip(excess / s_ex, 0, 1)  # exact for a mix of a neutral subject and the lit screen
    coverage_r = 1 - np.clip(ratio / s_ratio, 0, 1)  # shadow-proof
    ramp = 1 - np.clip((excess - 0.15 * s_ex) / (0.6 * s_ex), 0, 1)
    ramp_r = np.clip((coverage_r - 0.25) / 0.6, 0, 1)
    edge = background & _grow(subject, band)
    outline = subject & _grow(background, rim)
    alpha = np.where(subject, 1.0, 0.0)
    alpha = np.where(edge, np.minimum(ramp, ramp_r), alpha)
    alpha = np.where(outline, np.where(green_led_dark, 0.0, np.minimum(np.maximum(ramp, 0.5), coverage_r)), alpha)
    alpha = np.where(alpha < 0.04, 0.0, np.where(alpha > 0.96, 1.0, alpha))
    # Unmix the screen from the outline: subject = (pixel - (1 - coverage) * screen) / coverage.
    c = np.clip(coverage, 0.05, 1)[..., None]
    unmix = (((alpha > 0) & (alpha < 1)) | outline)[..., None]
    rgb = np.where(unmix, (rgb - (1 - c) * screen) / c, rgb).clip(0, 255)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    g = np.minimum(g, (r + b) / 2)
    out = Image.fromarray(np.dstack([r, g, b, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")
    return out.crop(out.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox())


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
    ap.add_argument("--matte", choices=["flood", "green"], default="flood", help="flood: white or mid-grey backdrop (default; tune with --thresh and --floor); green: chroma-key green backdrop, the way to shoot white or near-white subjects (--thresh and --floor are not used)")
    ap.add_argument("--max", type=int, default=900, help="longest side of the output, in pixels")
    args = ap.parse_args()
    if args.matte == "green":
        cut, removed = keep_subject(green_matte(Image.open(args.input))), 0
    else:
        cut = keep_subject(remove_background(Image.open(args.input), args.thresh))
        cut, removed = clean_floor(cut, args.floor)
        cut = keep_subject(cut)
    cut.thumbnail((args.max, args.max))
    cut.save(args.output, optimize=True)
    print(f"{args.output} {cut.size} floor pixels removed: {removed}")


if __name__ == "__main__":
    main()
