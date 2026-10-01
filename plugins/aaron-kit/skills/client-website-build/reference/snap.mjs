// Review-loop screenshots at 1440x900 and 390x844 (touch): for every page, the first screen and the full page
// (after scrolling through, so lazy images and scroll-in reveals load, the way a visitor sees them).
// Run from the client's repo against a running server (with the preview flags if the design uses samples):
//   node <this skill>/reference/snap.mjs --base http://localhost:3310 --pages "home,services,book" --out design-research/snaps
// Pages are names without slashes ("home" is the front page), so Git Bash on Windows cannot rewrite them into paths.
// Then READ every image. Tall phone pages read better split into columns.
// For a multi-step flow (the questionnaire), copy this file into the repo as scripts/snap.mjs and add a walk with
// sample answers. After every Continue, wait for the next [data-step="<id>"] plus about 450ms: steps animate out,
// then in, and a script that acts early photographs (or clicks) the old screen.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("@playwright/test");

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = opt("base", "http://localhost:3310").replace(/\/$/, "");
const PAGES = opt("pages", "home")
  .split(",")
  .map((p) => p.trim().replace(/^\/+|\/+$/g, ""))
  .filter((p, i, all) => all.indexOf(p) === i)
  .map((p) => (p === "" || p === "home" ? "/" : `/${p}`));
const OUT = resolve(opt("out", "design-research/snaps"));
mkdirSync(OUT, { recursive: true });

async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => window.innerHeight * 0.8);
  for (let y = 0; y < h; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
for (const view of [
  { key: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { key: "phone", viewport: { width: 390, height: 844 }, mobile: true },
]) {
  const ctx = await browser.newContext({ viewport: view.viewport, isMobile: view.mobile, hasTouch: view.mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${view.key}] page error:`, e.message));
  page.on("console", (m) => m.type() === "error" && console.log(`[${view.key}] console error:`, m.text().slice(0, 200)));
  for (const path of PAGES) {
    const slug = path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-");
    try {
      const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(OUT, `${slug}-${view.key}-top.png`) });
      await scrollThrough(page);
      await page.screenshot({ path: join(OUT, `${slug}-${view.key}-full.png`), fullPage: true });
      const overflow = await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
      console.log(`${view.key} ${path}: http ${resp ? resp.status() : "?"}, sideways overflow ${overflow}px`);
    } catch (e) {
      console.log(`${view.key} ${path}: FAILED, ${String(e.message).split(/\r?\n/)[0].slice(0, 160)}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log("snaps in", OUT);
