// Favicons from the client's logo, so the browser tab shows their brand instead of the framework's default.
// Run from the client's repo (it uses the repo's @playwright/test, installed for QA):
//   node <this skill>/reference/make-icons.mjs --logo public/brand/logo.svg --keep x0,y0,x1,y1
// --logo     the full-colour logo as SVG (reference/brand-from-logo.md)
// --keep     keep only the shapes lying inside this box, in the SVG's own units: the mark alone, without the lettering.
//            A wordmark squeezed into a square is unreadable at 16 px. Run once without --keep: it renders the whole
//            logo and prints the logo's bounds and its widest empty bands, with a suggested --keep for each side of
//            each band (a stacked logo's mark sits above or below a row band, a side-by-side logo's mark left or
//            right of a column band). If the logo has no mark that stands alone, ask the user which part to use.
// --pad      empty space on each side, as a share of the icon's longer side (default 0.04)
// --apple-bg the iPhone home-screen icon's background (default #ffffff; iOS does not show a transparent icon well)
// --out      where to write. By default the Next.js app directory, found the way Next.js finds it: app/, else src/app/.
//            Next.js turns these files into the <link> tags itself:
//              icon.svg        the mark, square, transparent (current browsers)
//              favicon.ico     16, 32 and 48 px PNGs in one ICO (older browsers and tools ask for /favicon.ico)
//              apple-icon.png  180 px on --apple-bg
// --preview  a contact sheet of the results on a light and a dark tab (default design-research/icons-preview.png).
//            READ it. If the mark is a blur at 16 px, tell the user; never simplify or redesign their logo unasked.
// Options take "--name value" or "--name=value".
// How it measures: Chromium parses the SVG, so path syntax, transforms, <use> and <symbol>, nested <svg> and text all
// work. Shapes that paint nothing are ignored (hidden layers, no fill and no stroke, off the artboard). Strokes and
// clip paths count when choosing shapes, and the square is fitted to the pixels the kept shapes actually paint, so
// strokes, markers, masks and filters are not cut off. Fonts and images the SVG links to are not loaded.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const fail = (message) => {
  console.error(`make-icons: ${message}`);
  process.exit(1);
};

// Options. A value may start with "-" (a negative coordinate), never with "--".
const KNOWN = ["logo", "keep", "pad", "apple-bg", "out", "preview"];
const USAGE = "usage: node make-icons.mjs --logo <file.svg> [--keep x0,y0,x1,y1] [--pad 0.04] [--apple-bg #ffffff] [--out <app dir>] [--preview <file.png>]";
const opts = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (!arg.startsWith("--")) fail(`unexpected argument "${arg}"\n${USAGE}`);
  let name = arg.slice(2);
  let value;
  const eq = name.indexOf("=");
  if (eq >= 0) {
    value = name.slice(eq + 1);
    name = name.slice(0, eq);
  } else {
    value = argv[i + 1];
    i++;
  }
  if (!KNOWN.includes(name)) fail(`unknown option --${name}\n${USAGE}`);
  if (value === undefined || value === "" || value.startsWith("--")) fail(`--${name} needs a value\n${USAGE}`);
  opts[name] = value;
}
if (!opts.logo) fail(USAGE);
if (!existsSync(opts.logo)) fail(`no such file: ${opts.logo}`);
const KEEP = opts.keep ? opts.keep.split(",").map((s) => Number(s.trim())) : null;
if (KEEP && (KEEP.length !== 4 || KEEP.some((n) => !Number.isFinite(n)) || KEEP[0] >= KEEP[2] || KEEP[1] >= KEEP[3])) {
  fail("--keep takes four numbers, x0,y0,x1,y1, with x0 < x1 and y0 < y1");
}
const PAD = Number(opts.pad ?? "0.04");
if (!Number.isFinite(PAD) || PAD < 0 || PAD > 0.5) fail("--pad takes a number from 0 to 0.5");
const APPLE_BG = opts["apple-bg"] ?? "#ffffff";
// Next.js looks for app/ before src/app/. Write where it looks, and never create an app folder it would ignore.
let OUT;
if (opts.out) OUT = resolve(opts.out);
else if (existsSync("app")) OUT = resolve("app");
else if (existsSync("src/app")) OUT = resolve("src/app");
else fail("found no app/ or src/app/ here: run it from the project's root, or pass --out");
const PREVIEW = resolve(opts.preview ?? "design-research/icons-preview.png");
const source = readFileSync(opts.logo, "utf8").replace(/^﻿/, ""); // a byte-order mark (Windows editors) is not XML

let chromium;
try {
  ({ chromium } = createRequire(join(process.cwd(), "package.json"))("@playwright/test"));
} catch {
  fail("needs @playwright/test in this project: npm i -D @playwright/test, then npx playwright install chromium");
}
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

// 1. Parse the logo as XML and measure every shape in the root's units. Keep the drawn ones inside --keep, then fit
//    a square to what they paint.
await page.setContent("<!doctype html><html><body style='margin:0'></body></html>");
const cut = await page.evaluate(
  async ({ source, keep, pad }) => {
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    if (parsed.getElementsByTagName("parsererror").length || parsed.documentElement.localName !== "svg") {
      return { error: "the logo is not well-formed SVG" };
    }
    const svg = document.importNode(parsed.documentElement, true);
    document.body.appendChild(svg);

    // The artboard: the viewBox, or, without one, an absolute width and height (the user units are CSS px then).
    let artboard = null;
    const vb = svg.viewBox.baseVal;
    if (svg.hasAttribute("viewBox") && vb && vb.width > 0 && vb.height > 0) {
      artboard = { x0: vb.x, y0: vb.y, x1: vb.x + vb.width, y1: vb.y + vb.height };
    } else {
      const absolute = (v) => v != null && /^\s*[\d.]+\s*(px|mm|cm|in|pt|pc)?\s*$/i.test(v);
      const rect = svg.getBoundingClientRect();
      if (absolute(svg.getAttribute("width")) && absolute(svg.getAttribute("height")) && rect.width > 0 && rect.height > 0) {
        artboard = { x0: 0, y0: 0, x1: rect.width, y1: rect.height };
      }
    }

    const SHAPES = "path, rect, circle, ellipse, line, polyline, polygon, text, use, image";
    const RESOURCES = "defs, clipPath, mask, symbol, pattern, marker";
    // Chromium hands out legacy SVGMatrix objects, which only multiply with each other: work in DOMMatrix throughout.
    const dm = (m) => new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]);
    const toRoot = dm(svg.getScreenCTM()).inverse();
    const mapBox = (m, b) => {
      const corners = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) =>
        new DOMPoint(x, y).matrixTransform(m),
      );
      const xs = corners.map((p) => p.x), ys = corners.map((p) => p.y);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    };
    const meet = (a, b) => ({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });
    const isEmpty = (b) => b.x1 < b.x0 || b.y1 < b.y0;
    const union = (boxes) =>
      boxes.reduce((u, b) => ({ x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) }), {
        x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity,
      });
    const localMatrix = (el) => {
      const list = el.transform && el.transform.baseVal;
      const t = list && list.numberOfItems ? list.consolidate() : null;
      return t ? dm(t.matrix) : new DOMMatrix();
    };

    // The region a clip-path on this element lets through, in root units (null when it has none we can read).
    const clipOf = (el) => {
      const m = /url\(\s*["']?#([^"')\s]+)["']?\s*\)/.exec(getComputedStyle(el).clipPath || "");
      const clip = m && svg.querySelector(`[id="${CSS.escape(m[1])}"]`);
      if (!clip || clip.localName !== "clipPath") return null;
      let base = toRoot.multiply(dm(el.getScreenCTM()));
      if (clip.getAttribute("clipPathUnits") === "objectBoundingBox") {
        const bb = el.getBBox();
        base = base.multiply(new DOMMatrix([bb.width, 0, 0, bb.height, bb.x, bb.y]));
      }
      base = base.multiply(localMatrix(clip));
      const parts = [...clip.children].filter((c) => c.matches(SHAPES)).map((c) => mapBox(base.multiply(localMatrix(c)), c.getBBox()));
      return parts.length ? union(parts) : null;
    };

    // Why a shape paints nothing in place, or null when it is drawn.
    const notDrawn = (el) => {
      if (el.parentElement.closest(RESOURCES)) return "in a definition";
      for (let n = el; n; n = n === svg ? null : n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || parseFloat(cs.opacity) === 0) return "hidden";
      }
      const cs = getComputedStyle(el);
      if (cs.visibility !== "visible") return "hidden";
      if (el.localName !== "use" && el.localName !== "image" && cs.fill === "none" && cs.stroke === "none") return "unpainted";
      return null;
    };

    const shapes = [...svg.querySelectorAll(SHAPES)].map((el) => {
      const reason = notDrawn(el);
      if (reason) return { el, reason };
      const ctm = el.getScreenCTM();
      if (!ctm) return { el, reason: "hidden" };
      const m = toRoot.multiply(dm(ctm));
      const bb = el.getBBox();
      let box = mapBox(m, bb);
      // Strokes reach half their width past the fill.
      const cs = getComputedStyle(el);
      if (cs.stroke !== "none" && el.localName !== "use" && el.localName !== "image") {
        const grow = ((parseFloat(cs.strokeWidth) || 0) / 2) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
        box = { x0: box.x0 - grow, y0: box.y0 - grow, x1: box.x1 + grow, y1: box.y1 + grow };
      }
      if (box.x1 - box.x0 <= 0 && box.y1 - box.y0 <= 0) return { el, reason: "empty" };
      // Clip paths on the shape or on any group above it.
      for (let n = el; n; n = n === svg ? null : n.parentElement) {
        const clip = clipOf(n);
        if (clip) box = meet(box, clip);
      }
      if (isEmpty(box)) return { el, reason: "clipped away" };
      if (artboard && isEmpty(meet(box, artboard))) return { el, reason: "off the artboard" };
      return { el, box };
    });
    const drawn = shapes.filter((s) => s.box);
    const ignored = {};
    for (const s of shapes) if (!s.box && s.reason !== "in a definition") ignored[s.reason] = (ignored[s.reason] || 0) + 1;
    if (drawn.length === 0) return { error: "no drawn shapes found in the logo", ignored };

    // Hints for --keep: the logo's bounds and its widest empty bands across and down.
    const widestGap = (spans) => {
      spans.sort((a, b) => a[0] - b[0]);
      let end = spans[0][1], best = null;
      for (const [s, e] of spans.slice(1)) {
        if (s > end && (!best || s - end > best[1] - best[0])) best = [end, s];
        end = Math.max(end, e);
      }
      return best;
    };
    const bounds = union(drawn.map((s) => s.box));
    const rowBand = widestGap(drawn.map((s) => [s.box.y0, s.box.y1]));
    const columnBand = widestGap(drawn.map((s) => [s.box.x0, s.box.x1]));
    const hints = { bounds, rowBand, columnBand, ignored };

    const inside = (s) => !keep || (s.box.x0 >= keep[0] && s.box.y0 >= keep[1] && s.box.x1 <= keep[2] && s.box.y1 <= keep[3]);
    const kept = drawn.filter(inside);
    if (kept.length === 0) return { error: "no drawn shapes lie inside --keep", ...hints };
    // Drawn shapes outside --keep go, and so does anything off the artboard, which the new square could reveal.
    const remove = shapes.filter((s) => (s.box && !inside(s)) || s.reason === "off the artboard").map((s) => s.el);

    // A kept <use> may point at a shape (or a group) that is going: copy that target into <defs> first, so the
    // clone still renders, and take the id off the original, which still paints in place without it.
    const going = (el) => remove.some((r) => r === el || r.contains(el));
    const referenced = new Set();
    const collect = (text) => {
      for (const m of text.matchAll(/url\(\s*["']?#([^"')\s]+)["']?\s*\)/g)) referenced.add(m[1]);
    };
    for (const el of svg.querySelectorAll("*")) {
      if (going(el)) continue;
      for (const a of el.attributes) {
        if (a.localName === "href" && a.value.startsWith("#")) referenced.add(a.value.slice(1));
        collect(a.value);
      }
      if (el.localName === "style") collect(el.textContent);
    }
    let defs = null;
    const copied = new Set();
    for (const el of remove) {
      for (let n = el; n && n !== svg; n = n.parentElement) {
        if (!n.id || !referenced.has(n.id) || copied.has(n) || n.closest(RESOURCES)) continue;
        if (!defs) {
          defs = document.createElementNS(svg.namespaceURI, "defs");
          svg.insertBefore(defs, svg.firstChild);
        }
        defs.appendChild(n.cloneNode(true));
        n.removeAttribute("id");
        copied.add(n);
      }
    }
    for (const el of remove) el.remove();

    // The root: drop its size and position (the icon sizes itself), and any background it would paint.
    for (const a of ["width", "height", "x", "y"]) svg.removeAttribute(a);
    if (svg.hasAttribute("style")) {
      const rest = svg
        .getAttribute("style")
        .split(";")
        .filter((d) => d.trim() && !/^\s*(width|height|background(-color|-image)?)\s*:/i.test(d))
        .join(";");
      if (rest) svg.setAttribute("style", rest);
      else svg.removeAttribute("style");
    }

    // 2. Fit the square to what the kept shapes paint: render them with a wide margin and find the painted pixels.
    const geo = union(kept.map((s) => s.box));
    const span = Math.max(geo.x1 - geo.x0, geo.y1 - geo.y0) || 1;
    const view = { x: geo.x0 - span / 2, y: geo.y0 - span / 2, w: geo.x1 - geo.x0 + span, h: geo.y1 - geo.y0 + span };
    const scale = 1200 / Math.max(view.w, view.h);
    const W = Math.max(1, Math.round(view.w * scale)), H = Math.max(1, Math.round(view.h * scale));
    svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    svg.setAttribute("width", String(W));
    svg.setAttribute("height", String(H));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    const img = new Image();
    img.src = url;
    let painted = null, touchesEdge = false;
    try {
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      let px0 = W, py0 = H, px1 = -1, py1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (data[(y * W + x) * 4 + 3] > 8) {
            if (x < px0) px0 = x;
            if (x > px1) px1 = x;
            if (y < py0) py0 = y;
            if (y > py1) py1 = y;
          }
        }
      }
      if (px1 >= 0) {
        painted = { x0: view.x + px0 / scale, y0: view.y + py0 / scale, x1: view.x + (px1 + 1) / scale, y1: view.y + (py1 + 1) / scale };
        touchesEdge = px0 === 0 || py0 === 0 || px1 === W - 1 || py1 === H - 1;
      }
    } catch {
      // The browser could not draw it as an image: fall back to the measured shapes.
    }
    URL.revokeObjectURL(url);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    const u = painted || geo;
    const side = Math.max(u.x1 - u.x0, u.y1 - u.y0) * (1 + 2 * pad);
    const decimals = Math.max(2, Math.ceil(-Math.log10(side)) + 4);
    const r = (n) => Number(n.toFixed(decimals));
    svg.setAttribute("viewBox", [(u.x0 + u.x1) / 2 - side / 2, (u.y0 + u.y1) / 2 - side / 2, side, side].map(r).join(" "));
    return {
      svg: new XMLSerializer().serializeToString(svg),
      kept: kept.length,
      dropped: remove.length,
      measuredFromPixels: Boolean(painted),
      touchesEdge,
      ...hints,
    };
  },
  { source, keep: KEEP, pad: PAD },
);

// The hints. Numbers carry enough decimals for the band they describe, bounds round outward, and a suggested cut
// sits mid-band, so a printed suggestion never clips a shape.
if (cut.bounds) {
  const b = cut.bounds;
  const widths = [cut.rowBand, cut.columnBand].filter(Boolean).map(([a, z]) => z - a);
  const d = Math.max(1, ...widths.map((w) => Math.ceil(-Math.log10(w)) + 1));
  const f = 10 ** d;
  const lo = (n) => Number((Math.floor(n * f) / f).toFixed(d));
  const hi = (n) => Number((Math.ceil(n * f) / f).toFixed(d));
  const mid = ([a, z]) => Number(((a + z) / 2).toFixed(d));
  const [x0, y0, x1, y1] = [lo(b.x0), lo(b.y0), hi(b.x1), hi(b.y1)];
  console.log(`logo bounds: x ${x0} to ${x1}, y ${y0} to ${y1}`);
  if (cut.rowBand) {
    const m = mid(cut.rowBand);
    console.log(`widest empty row band: y ${hi(cut.rowBand[0])} to ${lo(cut.rowBand[1])}`);
    console.log(`  a mark above it: --keep ${x0},${y0},${x1},${m}`);
    console.log(`  a mark below it: --keep ${x0},${m},${x1},${y1}`);
  } else console.log("no empty row band");
  if (cut.columnBand) {
    const m = mid(cut.columnBand);
    console.log(`widest empty column band: x ${hi(cut.columnBand[0])} to ${lo(cut.columnBand[1])}`);
    console.log(`  a mark left of it: --keep ${x0},${y0},${m},${y1}`);
    console.log(`  a mark right of it: --keep ${m},${y0},${x1},${y1}`);
  } else console.log("no empty column band");
}
if (cut.ignored && Object.keys(cut.ignored).length) {
  console.log(`ignored (paint nothing): ${Object.entries(cut.ignored).map(([k, n]) => `${n} ${k}`).join(", ")}`);
}
if (cut.error) {
  await browser.close();
  fail(cut.error);
}
mkdirSync(OUT, { recursive: true });
const svg = `${cut.svg}\n`;
writeFileSync(join(OUT, "icon.svg"), svg);
console.log(`icon.svg: ${cut.kept} shapes kept, ${cut.dropped} left out${cut.measuredFromPixels ? "" : " (sized from the shapes: the logo could not be drawn as an image)"}`);
if (cut.touchesEdge) console.log("note: something paints far beyond the kept shapes (a large filter?); check the contact sheet");

// 3. The PNGs, rendered by Chromium at exact pixel sizes (transparent unless a background is given).
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
async function png(size, { background = "transparent", scale = 1 } = {}) {
  const inner = Math.round(size * scale);
  const margin = Math.round((size - inner) / 2);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;background:${background}"><img src="${dataUrl}" width="${inner}" height="${inner}" style="display:block;margin:${margin}px"></body></html>`);
  await page.waitForLoadState("load");
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: background === "transparent" });
}

// An ICO whose entries are PNGs (read by every current browser and by Windows).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

const sizes = [16, 32, 48];
const pngs = [];
for (const size of sizes) pngs.push({ size, data: await png(size) });
writeFileSync(join(OUT, "favicon.ico"), ico(pngs));
console.log(`favicon.ico: ${sizes.join(", ")} px`);
const apple = await png(180, { background: APPLE_BG, scale: 0.78 });
writeFileSync(join(OUT, "apple-icon.png"), apple);
console.log(`apple-icon.png: 180 px on ${APPLE_BG}`);

// 4. The contact sheet: each size at 1x and enlarged 4x (pixelated), on a light and a dark tab, plus the home-screen icon.
const src = (b) => `data:image/png;base64,${b.toString("base64")}`;
const row = (bg, fg) => `<div style="display:flex;align-items:center;gap:20px;padding:16px;background:${bg};color:${fg}">${pngs
  .map(({ size, data }) => `<figure style="margin:0;text-align:center"><img src="${src(data)}" width="${size}" height="${size}"><br><img src="${src(data)}" width="${size * 4}" height="${size * 4}" style="image-rendering:pixelated"><figcaption>${size} px</figcaption></figure>`)
  .join("")}</div>`;
await page.setViewportSize({ width: 760, height: 600 });
await page.setContent(`<html><body style="margin:0;font:13px system-ui,sans-serif">${row("#ffffff", "#333333")}${row("#202124", "#e8eaed")}<div style="padding:16px;background:#dddddd"><img src="${src(apple)}" width="180" height="180" style="border-radius:40px"> apple-icon.png</div></body></html>`);
mkdirSync(dirname(PREVIEW), { recursive: true });
await page.screenshot({ path: PREVIEW, fullPage: true });
console.log(`contact sheet: ${PREVIEW} (read it)`);
await browser.close();
