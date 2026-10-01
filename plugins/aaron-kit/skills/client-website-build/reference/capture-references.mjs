// Capture reference sites and Dribbble search results, then build contact sheets, with Playwright only.
// Run it from the client's repo (Playwright is loaded from there: npm i -D @playwright/test, npx playwright install chromium):
//   node <this skill>/reference/capture-references.mjs --out design-research \
//     --site "studio-a=https://example.com" --site "rival-b=https://example.org" \
//     --dribbble "bakery-website,bakery-landing-page"
// Writes:
//   <out>/<name>-desktop.png and <name>-phone.png  (above the fold plus one screen, at 1440 and 390)
//   <out>/captures.json, <out>/contact-sheet-desktop.png, <out>/contact-sheet-phone.png
//   <out>/dribbble/search-<query>.png, <out>/dribbble/shots.json (links, titles, images), <out>/dribbble/sheet.png
// Keep <out> git-ignored: third-party screenshots never enter the repo. Cite the sources in docs/DECISIONS.md.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("@playwright/test");

const argv = process.argv.slice(2);
const opt = (name) => argv.flatMap((a, i) => (a === `--${name}` && argv[i + 1] ? [argv[i + 1]] : []));
const OUT = resolve(opt("out")[0] ?? "design-research");
// A --site value is "name=url" or just a URL (whose own "?a=b" must not be read as a name).
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
const SITES = opt("site").map((s) => {
  const i = s.indexOf("=");
  const named = i > 0 && !s.slice(0, i).includes("://");
  const url = named ? s.slice(i + 1) : s;
  return [slug(named ? s.slice(0, i) : new URL(url).hostname.replace(/^www\./, "")), url];
});
const QUERIES = (opt("dribbble")[0] ?? "").split(",").map((q) => q.trim()).filter(Boolean);
if (SITES.length === 0 && QUERIES.length === 0) {
  console.log('Nothing to do. Pass --site "name=url" (repeatable) and/or --dribbble "query1,query2".');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { key: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { key: "phone", viewport: { width: 390, height: 844 }, mobile: true },
];
const DISMISS = ["Accept", "Accept all", "I agree", "Got it", "Close", "No thanks", "No, thanks"];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function dismissOverlays(page) {
  for (const label of DISMISS) {
    const b = page.getByRole("button", { name: label, exact: false }).first();
    if (await b.isVisible().catch(() => false)) await b.click({ timeout: 1500 }).catch(() => {});
  }
  await page.keyboard.press("Escape").catch(() => {});
}

// A contact sheet is a plain HTML grid of the screenshots, screenshotted in turn (no image library needed).
async function sheet(browser, tiles, file, cols, tileW) {
  if (tiles.length === 0) return;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:16px;background:#d9dce1;font:15px/1.3 system-ui,sans-serif;display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:16px;align-items:start}
    figure{margin:0;background:#fff}figcaption{background:#111;color:#fff;padding:8px 10px}img{display:block;width:${tileW}px}
  </style>${tiles.map((t) => `<figure><figcaption>${esc(t.label)}</figcaption><img src="${pathToFileURL(t.file).href}"></figure>`).join("")}`;
  const htmlFile = file.replace(/\.png$/, ".html");
  writeFileSync(htmlFile, html);
  const page = await browser.newPage({ viewport: { width: cols * (tileW + 16) + 16, height: 800 } });
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "load" });
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  console.log("wrote", file, `${tiles.length} tiles`);
}

const browser = await chromium.launch();

if (SITES.length > 0) {
  const results = [];
  for (const [name, url] of SITES) {
    for (const v of VIEWS) {
      const ctx = await browser.newContext({ viewport: v.viewport, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const file = join(OUT, `${name}-${v.key}.png`);
      let status;
      try {
        const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(3500);
        await dismissOverlays(page);
        await page.waitForTimeout(600);
        // The hero and the first section are what get compared.
        await page.screenshot({ path: file, clip: { x: 0, y: 0, width: v.viewport.width, height: v.viewport.height * 2 }, fullPage: true });
        status = resp ? `http ${resp.status()}` : "no response";
      } catch (e) {
        status = "failed: " + String(e.message).split("\n")[0].slice(0, 120);
      }
      results.push({ name, url, view: v.key, file, status });
      console.log(name, v.key, status);
      await ctx.close();
    }
  }
  writeFileSync(join(OUT, "captures.json"), JSON.stringify(results, null, 2));
  const ok = (view) => results.filter((r) => r.view === view && r.status.startsWith("http")).map((r) => ({ file: r.file, label: `${r.name} · ${r.url}` }));
  await sheet(browser, ok("desktop"), join(OUT, "contact-sheet-desktop.png"), 3, 720);
  await sheet(browser, ok("phone"), join(OUT, "contact-sheet-phone.png"), 6, 300);
}

if (QUERIES.length > 0) {
  const dir = join(OUT, "dribbble");
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const all = [];
  const tiles = [];
  for (const q of QUERIES) {
    const page = await ctx.newPage();
    const file = join(dir, `search-${q}.png`);
    try {
      await page.goto(`https://dribbble.com/search/${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(4000);
      await dismissOverlays(page);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1440, height: 2000 }, fullPage: true });
      const shots = await page.evaluate(() =>
        [...document.querySelectorAll("li.shot-thumbnail, li[data-thumbnail-id]")].slice(0, 12).map((li) => {
          const a = li.querySelector("a.shot-thumbnail-link, a[href*='/shots/']");
          const img = li.querySelector("img");
          return { href: a ? new URL(a.getAttribute("href"), location.origin).href : null, title: (a?.textContent || img?.alt || "").trim().slice(0, 90), img: img?.currentSrc || img?.src || null };
        }),
      );
      all.push({ q, shots });
      tiles.push({ file, label: `dribbble: ${q}` });
      console.log("dribbble", q, shots.length, "shots");
    } catch (e) {
      console.log("dribbble", q, "failed:", String(e.message).split("\n")[0].slice(0, 120));
    }
    await page.close();
  }
  writeFileSync(join(dir, "shots.json"), JSON.stringify(all, null, 2));
  await sheet(browser, tiles, join(dir, "sheet.png"), 2, 900);
  await ctx.close();
}

await browser.close();
