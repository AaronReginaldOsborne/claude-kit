---
name: client-website-build
description: Use when building or redesigning a small-business client's marketing website (Next.js on Vercel), such as a new client site, a site the user calls boring, plain or generic or says lacks a "wow factor", or a preview link of a client's site to send them. Not for web apps, dashboards or portals, sites you only host, or SEO-only and copy-only edits.
---

# Client website build

A recipe for client marketing sites that look custom, not templated, and stay honest. It comes from a real build in 2026 for a small pet-grooming business. The user rejected the first, generic version, then called the rebuilt one "really good".

**What made it work:**
- **One strong reference that the user picked,** rebuilt in the client's own brand. Generic polish did not do it.
- **Real-looking subjects** standing in flat pastel cards, breaking out of the top: the pets in that build, the cakes for a bakery, the client's products.
- **Small, purposeful motion:** a spinning badge, a marquee band, two floating chips, one finish moment. All of it pauses.
- **One signature interaction,** and a multi-step questionnaire instead of a form.
- **A tight loop:** screenshots at desktop and phone width, actually looked at, fixed, then an independent QA pass before the client saw anything.

**Rules for every step:**
- Never invent prices, reviews, testimonials, statistics, credentials, health or dietary claims, or the client's story.
- Every client fact lives in a content file with its source. Pending facts render nothing on the live site (`reference/content-model.md`).
- `reference/…` paths are in this skill's folder (the base directory shown when the skill loads). `docs/…` and `src/…` paths are in the client's repo.
- In PowerShell, write the skill path out in full: PowerShell passes `~` to programs literally.

## Steps
0. **Set up first.**
   - **Stop and ask, in one message:**
     - the repo name and location, and the branch model (for example, work on `develop` and merge to `main` only on the user's word);
     - where the client's material is (email thread, shared folder, logo file), and whether they have answered an intake (if not, run the `first-website` skill first, if you have it);
     - where website requests should go: text, email, phone, or online orders (`reference/questionnaire.md`);
     - whether their street address may be published (a home business often says no, a shopfront yes);
     - their logo as vector (`reference/brand-from-logo.md`).
   - **Then create the project:**
     - the folder, with Next.js scaffolded in it (`npx create-next-app@latest`);
     - a first commit on the production branch, then the work branch;
     - `design-research/` in `.gitignore` and in ESLint's `globalIgnores` (QA runs save downloaded bundles there, which lint would report);
     - `docs/DECISIONS.md`, a dated log with one entry per decision and its source, starting with these answers.
1. **Research, then let the user pick ONE direction (stop and ask).** Follow `reference/research.md`.
   - Show visible candidates fast: a contact sheet of 3 to 6 references, with the patterns you would borrow from each.
   - In the same message:
     - offer 2 or 3 signature interactions;
     - ask whether preview-only sample photos are OK (step 6);
     - list any open questions.
   - Build nothing until the user picks.
2. **Write the plan; the client approves it before any page is built (stop and ask).**
   - In `docs/`, draft these six from the intake, step 0 and the pick, in words the client can read:

     | File | What it settles |
     |---|---|
     | `PRD.md` | Every page and feature, who it is for, and what counts as done. Anything missing from it is out of scope. |
     | `ARCHITECTURE.md` | What the site runs on, where it is hosted, and every service it connects to (email, booking, CRM, analytics). |
     | `USER_FLOWS.md` | Every page and click: what comes next, what happens when the questionnaire is sent, and where a visitor lands when something fails. |
     | `DESIGN.md` | The design brief: colours, fonts, logo use, and how buttons, headings and forms look, from the brand and the pick. |
     | `DATA_MODEL.md` | What the site collects about visitors and the client, where each answer is kept or sent, who can read it, and for how long. Never skip it, even for a site with no database. |
     | `BUILD_PLAN.md` | The stages, what each delivers, and where the client signs off before the next starts: at least this plan, and the preview before launch. |

   - On the user's word, send the client one plain-language plan made from the six (the user picks email, PDF or a shared doc) and ask for a yes or changes on each part.
   - Record each yes in `docs/DECISIONS.md` with its date and the client's words.
   - Count the yeses. Six: go to step 3. Three to five: write or fix the rest and ask again. Two or fewer: nothing is decided yet, so stop and tell the user.
   - The user's "go ahead" after step 1 and a client deadline both lead here, not to step 3. Drafting the six is quick; rebuilding pages the client never agreed to is not.
3. **Design system from the brand and the pick.**
   - Tokens come in the client's colours. Type, spacing, radius, one motif and the CTA style come from the picked reference, rebuilt in their brand.
   - Check every text and icon pair with `reference/contrast.mjs`.
   - Make the favicons from the logo's mark (`reference/make-icons.mjs`, explained in `reference/brand-from-logo.md`).
   - No decorative gradients or glow blobs: flat colours only.
   - `reference/design-kit.md` is the worked example, not a default.
4. **Compose the pages** in the client's words.
   - Adapt components (21st.dev, shadcn) into the project's tokens, and name each source in a comment at the top of its file.
   - Add one signature interaction (`reference/design-kit.md`).
   - If your setup has UX house rules or a UX review command, apply them to every form, message, button, focus style and motion.
5. **Lead capture** is the multi-step questionnaire (`reference/questionnaire.md`), with its logic in pure, unit-tested functions.
6. **Photos.**
   - With the user's yes from step 1, generate preview-only samples and cut them out (`reference/sample-photos.md`). A sample never stands in for the client's real work on the live site.
   - Real photos stay in a git-ignored folder. Only copies made by an import script that strips metadata (GPS included) enter the repo.
7. **Review loop until it is right** (`reference/review-and-ship.md`).
   - Take screenshots at 1440 and 390: the first screen, the full page and every questionnaire step.
   - Read every screenshot, fix, and repeat.
   - Then build without the preview flags and confirm the live version looks finished and carries no samples.
8. **Deploy a preview, on the user's word** (`reference/review-and-ship.md`): a private repo and a Vercel project, with the preview flags on the Preview environment only.
9. **QA before the client sees it** (`reference/review-and-ship.md`, QA).
   - Run `reference/qa-workflow.js` against the preview URL: five lenses, with every finding re-tested by a skeptic.
   - Without the Workflow tool or the user's opt-in to multi-agent runs, run the five lens prompts yourself, one at a time.
   - Fix what it confirms, push, and re-check on the new preview.
10. **The client email, on the user's word.** Write it in the user's voice, in the existing thread (`reference/review-and-ship.md`).

## Stop and ask (bundle each into one message)
1. Step 0, before the repo exists.
2. Step 1, before any UI code: the direction, the signature interaction, sample photos yes or no, and the open questions.
3. Step 2, before the plan goes to the client; then step 3 waits for all six yeses.
4. Before the first push or deploy.
5. Before sending the client anything.

At the end, report:
- the preview link;
- what QA found and fixed;
- what is still open;
- the email you sent or drafted.

## Lessons from the first build
- A centred serif hero with floating bubbles had no "wow factor". One bold, picked reference fixed it.
- Random gradients and glows on the pages had to be removed.
- Example clutter in labels (like "Custom cake (e.g. birthdays)") was cut. Keep names short.
- Generating images without saying why first got pushback. Ask at step 1.
- The first preview went out with the framework's default favicon, and the user caught it. Make the icons with the tokens.
- A "Sample" tag on every sample photo read as clutter and was removed. The alt text and the review email say they are samples.
- The user asked where the photos were on the live site. Say plainly, before any production push, that samples show only on the preview link.
- A single long booking form gave way to the questionnaire.
- QA traffic from one machine can trip Vercel's Security Checkpoint for that machine only: headless browsers then get a 403 page. Check from another network before worrying, and space out test runs.
