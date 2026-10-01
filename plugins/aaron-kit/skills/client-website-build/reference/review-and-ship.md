# Review loop, preview deploy, QA and the client email

## Review loop (after every visible change)
- **Start a local server with the preview flags:**
  - bash: `PREVIEW_FIXTURES=1 NEXT_PUBLIC_PREVIEW=1 npx next dev -p 3310`
  - PowerShell: `$env:PREVIEW_FIXTURES="1"; $env:NEXT_PUBLIC_PREVIEW="1"; npx next dev -p 3310`
- **Run the screenshot script:**
  - `node <skill>/reference/snap.mjs --base http://localhost:3310 --pages "home,services,book"`
  - It writes the first screen and the full page of each page at 1440x900 and 390x844 (touch). It reports sideways overflow and console errors, and carries on past a failing page. Output goes to `design-research/snaps/`, which is git-ignored.
- **Walk the questionnaire too.** Copy `snap.mjs` into the repo and add a walk with sample answers that shoots every step and the finish. After every Continue, wait for `[data-step="<next>"]` plus about 450ms.
- **Check widths 320, 360, 768, 1024, 1440 and 2560** for sideways scroll (`document.scrollingElement.scrollWidth - innerWidth`).
- **Read every screenshot.** Split tall phone shots into columns so they stay legible. Fix, re-shoot, repeat.
- **Build both ways:**
  - `next build` with the flags and without;
  - in the production build, the fixture route's `.nft.json` lists no sample files, and no page HTML mentions `dev-fixtures`, "Sample" or a pending tagline;
  - run `next start` without the flags once and look at the hero: the live version must look finished, with the logo where the photos will go.
- **Definition of done before the client sees it:**
  - typecheck, lint, unit tests and `next build` pass;
  - the Playwright walkthrough passes;
  - axe shows no serious or critical violations;
  - pages have titles and descriptions.
- **Before launch:** JSON-LD for the business type (name, area and phone matching the client's Google Business Profile), a sitemap, robots, an Open Graph image and a privacy page.

## Preview deploy (on the user's word)
1. **The repo:** `gh repo create <owner>/<name> --private --source . --remote origin`. Push the production branch first, so it becomes the default, then the work branch.
2. **The Vercel project.** With the Vercel MCP, call `create_project` with `teamId` (find it with `list_teams`), and in `requestBody`:
   - `name`;
   - `framework: "nextjs"`;
   - `gitRepository: { type: "github", repo: "<owner>/<name>" }`;
   - `environmentVariables`: `{ key: "NEXT_PUBLIC_PREVIEW", value: "1", type: "plain", target: ["preview"] }`, and the same for `PREVIEW_FIXTURES`;
   - `ssoProtection: null` if the client must open previews without a Vercel account. Tell the user this makes previews viewable by anyone with the link; previews are still `noindex`.
   - Then `update_project` with `enablePreviewFeedback: false`, so Vercel's comment toolbar doesn't float over the page for the client.
3. **Build both branches, production first.** The pushes in step 1 came before the project existed, so nothing has deployed yet.
   - Deploy the production branch with `create_deployment` (a `gitSource` for that ref), then the work branch the same way, or push to it again.
   - The first deployment of a new project becomes production whatever its branch, which is why production goes first. Later work-branch pushes deploy as previews.
4. **Without the MCP:** use the Vercel CLI (`npx vercel link`, `npx vercel git connect`, `npx vercel env add NAME preview`). If the CLI's saved sign-in has expired, `npx vercel whoami` refreshes it.
5. **The client link** is the branch alias, `<project>-git-<work-branch>-<team-slug>.vercel.app`. Check it:
   - every page answers 200;
   - the HTML has `<meta name="robots" content="noindex, nofollow">` (Vercel's own `x-robots-tag` on previews proves nothing about the app);
   - the samples load;
   - the production alias answers 404 for the sample route.
6. **Record** the repo, the project id, the link and the env setup in `docs/DECISIONS.md`. Production stays on the user's word.

## QA before the client sees it
- **The preview must be reachable without a login** (step 2), or QA tests a login page.
- **Install the test tools in the repo, as devDependencies, and commit them.** The QA agents do not install anything.
  - `npm i -D @playwright/test @axe-core/playwright`
  - then `npx playwright install chromium webkit`
- **Run the workflow:**
  - `Workflow({ scriptPath: "<skill>/reference/qa-workflow.js", args: { url, repo, context } })`;
  - without the Workflow tool, or without the user's opt-in to multi-agent runs, run the five lens prompts in `qa-workflow.js` yourself, one at a time, then re-test each finding the way its skeptic prompt says.
- **Write `context` for the project:**
  - what the site is;
  - where the rules live (`docs/DECISIONS.md`, `src/content`, and `CLAUDE.md` if the project has one);
  - what is intended in the preview (samples, pending items, noindex);
  - the test hooks (`data-testid`, `data-step`, `data-option`) and that steps animate;
  - if the finish posts to a server, a test inbox, or a note to stop before the final submit.
- **Fix** everything it confirms, push, and spot-check the fixes on the new preview (a keyboard walk and a width sweep).
- **Space out heavy runs.** A burst of automated traffic from one machine can trip Vercel's Security Checkpoint for that machine: headless browsers then get a 403 "Security Checkpoint" page. Check from another network (the Vercel MCP's `web_fetch_vercel_url`) before treating it as an outage.

## The client email (on the user's word)
- Find the client's thread. Ask the user if there is none, and confirm the connected mail account is the one the thread lives in.
- Reply in the thread, with "Re: <original subject>" and no stacked Re's. Draft it first unless the user said to send.
- Plain text, short, warm, in the user's voice, signed with the user's name.
- Cover:
  - the link;
  - two or three things to try: the questionnaire (say what its finish does; with a text finish, testing it texts the client's own number and nothing is sent until they press Send) and the signature interaction;
  - that the photos are samples until real ones arrive;
  - what you need from them (a tagline pick, the domain, the price list, real photos with consent, answers to open questions);
  - that it is a preview link, not the live site.
- Never claim anything the site can't do, and never promise dates the user hasn't given.
