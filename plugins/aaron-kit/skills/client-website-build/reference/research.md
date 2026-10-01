# Research: find references, then let the user pick ONE

Goal: a contact sheet the user can react to in a minute. Show visible candidates first, and build only after the pick.
- Borrow patterns, never assets: no logos, photos, illustrations or fonts.
- Keep every third-party screenshot in a git-ignored folder (`design-research/`) and cite the sources in `docs/DECISIONS.md`.

## 1. Find the references (3 to 6 in all, including 1 or 2 local competitors)
- **Leaders:** search the niche on Awwwards, Siteinspire or Land-book, plus "best <niche> website" (WebSearch).
- **Local competitors:** search the business type and city on Google Maps.
- **Dribbble:** app and landing-page concepts count. The first build's winning reference was a pet-grooming app concept, used for a website.

## 2. Capture them (Playwright only)
Install Playwright in the client repo (`npm i -D @playwright/test`, then `npx playwright install chromium`). Then, from the repo, on one line:

```
node <skill>/reference/capture-references.mjs --out design-research --site "leader-a=https://…" --site "rival-b=https://…" --dribbble "bakery-website,bakery-landing-page,cake-shop-website"
```

It writes, under `--out`:
- each site at 1440 and 390 (the first screen plus one more);
- `contact-sheet-desktop.png` and `contact-sheet-phone.png`;
- for Dribbble, `dribbble/search-<query>.png`, `dribbble/shots.json` (each shot's link and title) and `dribbble/sheet.png`.

Record the link of the shot the user picks; `shots.json` has it.

## 3. Present (one message)
- The contact sheets (paths, or one page embedding them if you can publish one).
- 2 to 4 named directions. For each: its source, the patterns you would borrow, and its catch.
- 2 or 3 signature interactions (see `design-kit.md`).
- Sample photos yes or no (see `sample-photos.md`).
- Any open questions.

Wait for the pick, then record it in `docs/DECISIONS.md` with the URLs.

## 4. After the pick: components for that direction only
- **The 21st.dev MCP** (if connected):
  - `search` with `type: "component"` returns metadata only, for free;
  - `get_component` with the result's `id` returns the code. It is paid (a daily allowance), so check for a paywall result;
  - without the MCP, browse 21st.dev, or use shadcn components and build the pattern yourself.
- **Queries that found what the first build used:**
  - "bold playful hero with image collage and big typography";
  - "rotating circular text badge sticker" (Spinning Text With Icon);
  - "infinite marquee scrolling text band";
  - "multi-step questionnaire form with progress" (Segmented Progress Questionnaire, id 29790);
  - "scratch card reveal image on drag" (Scratch To Reveal, Magic UI, id 1508);
  - "confetti celebration burst" (Confetti, motion.dev, id 24692);
  - "how it works three steps process section" (How It Works Steps, id 26891);
  - "simple footer with contact info and links" (Agency Footer, id 21474).
- **Adapt, don't paste:**
  - rebuild in the project's tokens;
  - remove anything the brief doesn't support;
  - pass the React Compiler lint rules (no components created in render, no setState in effects, no ref reads in render, no `Date.now()` or `performance.now()` called in render);
  - put the source and id in a comment at the top of the file.
