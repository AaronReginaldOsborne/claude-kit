// WCAG 2.x contrast for the colour pairs a design uses. Edit PAIRS (or pass a JSON file of the same shape) and run:
//   node <this skill>/reference/contrast.mjs [pairs.json]
// Each pair: [label, foreground hex, background hex, kind], where kind is
//   "text"  normal text, needs 4.5:1
//   "large" text 24px and up, or about 19px bold, needs 3:1
//   "ui"    icons that carry meaning, input borders, focus rings, needs 3:1
// Colours are opaque 3- or 6-digit hex. Record the results in docs/DECISIONS.md. A FAIL needs a darker (or lighter)
// colour, not a smaller claim.
import { readFileSync } from "node:fs";

// Illustrative pairs (a deep teal brand and an amber accent on a tinted page, with pastel icon tiles). Replace them
// with your design's colours.
let PAIRS = [
  ["body text on page", "#14212b", "#eef6f5", "text"],
  ["muted text on page", "#4b5a63", "#eef6f5", "text"],
  ["muted text on white", "#4b5a63", "#ffffff", "text"],
  ["brand teal on page", "#094b4c", "#eef6f5", "text"],
  ["white on brand teal", "#ffffff", "#094b4c", "text"],
  ["ink on amber button", "#14212b", "#f2b544", "text"],
  ["amber on brand teal", "#f2b544", "#094b4c", "text"],
  ["teal tile icon", "#094b4c", "#dff1ef", "ui"],
  ["amber tile icon", "#7a4b00", "#fdf0d5", "ui"],
  ["coral tile icon", "#a3402a", "#fde8e3", "ui"],
  ["sage tile icon", "#2f6a2a", "#e6f2e1", "ui"],
  ["violet tile icon", "#563f9c", "#efeafb", "ui"],
  ["input border on white", "#7f929b", "#ffffff", "ui"],
  ["error text on white", "#b3261e", "#ffffff", "text"],
];
if (process.argv[2]) PAIRS = JSON.parse(readFileSync(process.argv[2], "utf8"));

const NEED = { text: 4.5, large: 3, ui: 3 };
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((x) => x + x).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
for (const [label, fg, bg, kind] of PAIRS) {
  if (!(kind in NEED)) {
    console.log(`ERROR  ${label}: kind must be "text", "large" or "ui", not ${JSON.stringify(kind)}`);
    failures++;
    continue;
  }
  if (!HEX.test(fg) || !HEX.test(bg)) {
    console.log(`ERROR  ${label}: colours must be opaque 3- or 6-digit hex (got ${fg} on ${bg}); flatten any transparency first`);
    failures++;
    continue;
  }
  const r = ratio(fg, bg);
  const ok = r >= NEED[kind];
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (needs ${NEED[kind]})  ${label}  ${fg} on ${bg}`);
}
console.log(failures ? `\n${failures} pair(s) fail or are invalid.` : "\nEvery pair passes.");
process.exitCode = failures ? 1 : 0;
