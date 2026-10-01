export const meta = {
  name: 'client-site-preview-qa',
  description: 'QA a client site preview from five angles, then a skeptic re-tests every finding before the client sees it',
  whenToUse: 'Before sending a client a preview link. Pass args: {url, repo, context}.',
  phases: [
    { title: 'Find', detail: 'five independent checkers against the live preview' },
    { title: 'Verify', detail: "a skeptic re-tests each checker's findings" },
  ],
}

// args: {
//   url: the preview URL (reachable without a login),
//   repo: the local repo path (the agents write only under design-research/qa/),
//   context: a project paragraph you write: what the site is, where the rules live (docs/DECISIONS.md, src/content,
//            and CLAUDE.md if the project has one), what is INTENDED in the preview (samples, pending items, noindex),
//            the test hooks (data-testid / data-step / data-option selectors, how steps animate), and, if the finish
//            posts to a server, a test inbox or "stop before the final submit".
// }
// Run with: Workflow({ scriptPath: "<this skill's folder>/reference/qa-workflow.js", args: { url, repo, context } })
// Before the run, install the test tools in the repo yourself (the agents install nothing):
//   npm i -D @playwright/test @axe-core/playwright   then   npx playwright install chromium webkit
// Without the Workflow tool, run the five LENSES prompts below yourself, one at a time, and re-test each finding the
// way the skeptic prompt says.
const ARGS = typeof args === 'string' ? JSON.parse(args) : args || {}
if (!ARGS.url || !ARGS.repo || !ARGS.context) throw new Error('qa-workflow.js needs args: { url, repo, context }')
const PREVIEW_URL = ARGS.url
const REPO = ARGS.repo

const CONTEXT = `
You are QA-testing the LIVE preview of a client's marketing site before the client is emailed the link.
Preview URL: ${PREVIEW_URL}
Local repo (read-only for you, except design-research/qa/<your-lens>/): ${REPO}

${ARGS.context}

How to run browser checks: Playwright (@playwright/test) and @axe-core/playwright are already installed in
${REPO}/node_modules, with Chromium and WebKit. Do not install anything. Write your scripts and screenshots ONLY under
${REPO}/design-research/qa/<your-lens>/ (git-ignored) and run them from the repo, e.g.
\`cd ${REPO} && node design-research/qa/<lens>/check.mjs\`. Read your screenshots with the Read tool to look at them.
Steps of a multi-step flow animate out, then in: after every Continue, wait for the next step's marker before acting.
A 403 "Vercel Security Checkpoint" page or a Vercel login page means your coverage is blocked, not a site defect: say so
in coverage, slow down, and do not report it as a finding.

Hard rules: do NOT edit anything under src/, docs/, tests/, scripts/ or any config; do NOT commit or push; do NOT send
emails or messages; do NOT follow sms:, tel: or mailto: links; if the finish posts to a server, stop before the final
submit unless the context names a test inbox (and then a "sent" confirmation after a successful response is correct).

Report only real, user-visible or accessibility-relevant problems you actually reproduced, with exact steps. Severity:
blocker (the client or a customer cannot use it, or something false or embarrassing shows), major, minor, nit. Zero
findings is a valid answer. Do not report intended-preview items or planned-but-unbuilt features.`

const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    coverage: { type: 'string', description: 'What you actually tested (pages, viewports, flows, browsers), and anything that blocked you' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          where: { type: 'string' },
          steps: { type: 'string' },
          expected: { type: 'string' },
          actual: { type: 'string' },
          evidence: { type: 'string' },
          likelyCause: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['id', 'title', 'severity', 'where', 'steps', 'expected', 'actual', 'evidence'],
      },
    },
  },
  required: ['lens', 'coverage', 'findings'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          real: { type: 'boolean' },
          reproduced: { type: 'boolean' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          reason: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['id', 'real', 'reproduced', 'severity', 'reason'],
      },
    },
  },
  required: ['verdicts'],
}

const LENSES = [
  {
    key: 'phone',
    prompt: `LENS: phone user (390x844, touch): Chromium with isMobile+hasTouch, and WebKit with devices['iPhone 13'] (already installed; if it will not launch, say so in coverage). Walk every lead-capture path end to end (every choice, every branch that reveals or hides fields, Back keeps answers, close and reopen keeps the draft, service tiles preselect their service, an optional photo upload, required-field errors block Continue). At the finish check the prepared message is complete and correct for your answers, any sms:/mailto: href decodes exactly to it, Copy works (grant clipboard permissions), and nothing claims a booking or a sent message. Exercise any signature interaction with real touch input (CDP Input.dispatchTouchEvent or page.touchscreen). Look at your screenshots for anything broken.`,
  },
  {
    key: 'desktop-keyboard',
    prompt: `LENS: desktop (1440x900) keyboard-only and mouse user, Chromium. Tab through every page (visible focus ring, visual order), complete the lead flow with the keyboard only (letter keys, arrows, Enter, Esc, trapped Tab, focus moves to each new screen and returns to the opener on close; an inline copy must not steal focus on page load). Mouse: every header, footer and in-page link and button goes somewhere sensible; hover states. Also check the pop-up at 1024 and 1920 widths. Report console errors and failed requests (status >= 400) on every page.`,
  },
  {
    key: 'accessibility',
    prompt: `LENS: accessibility. Run @axe-core/playwright (wcag2a, wcag2aa, wcag21a, wcag21aa) on every page at 1440 and 390, on the open pop-up at each step and at the finish, and on any inline copy. Report serious and critical violations with nodes, plus moderate ones that matter. By hand: one h1 per page and sensible heading order; landmarks; every input has an accessible name (a label; a missing HTML name attribute is intended when the flow has no form); errors announced or associated; the dialog's role, aria-modal and name; choice tiles expose radio/checkbox roles with aria-checked; decorative graphics hidden; meaningful alt text; contrast over patterned backgrounds and on pastel tiles; prefers-reduced-motion stops every animation and looping motion has a pause control; 200% zoom loses no content.`,
  },
  {
    key: 'content',
    prompt: `LENS: content accuracy and claims. Extract ALL visible text (every page, every step, the finish, the prepared message) and audit it against the repo's src/content and docs/DECISIONS.md (and CLAUDE.md if the project has one): nothing invented (prices, reviews, statistics, credentials, health claims, the owner's story); quoted policies word for word; no street address or postal code unless the docs record consent (ignore CSS hex colours); nothing claims a booking or a sent message unless a server really sent it; names and contact details consistent everywhere; samples tagged as samples. Proofread: typos, grammar, awkward or contradictory wording, spelling consistent with the client's locale (for example Canadian, British or US English), capitalisation, page titles and meta descriptions. Quote the exact text for each finding.`,
  },
  {
    key: 'visual',
    prompt: `LENS: visual layout and robustness at widths 320, 360, 390, 414, 768, 1024, 1280, 1440 and 1920 (Chromium; WebKit at 390 too, already installed). Full-page screenshots after scrolling through (lazy images), and LOOK at them with Read. Report horizontal page scroll (scrollWidth > innerWidth), overlapping or clipped elements, text overflowing pills or cards, broken or ugly images (cut-outs with floor patches or jagged edges), hero composition problems, marquee edge gaps, sticky header issues, and the pop-up on short screens (390x664, 1280x720: Back/Continue must stay reachable). Measure home page transfer size and load on Fast 3G (CDP Network.emulateNetworkConditions). Report console errors and hydration warnings.`,
  },
]

const results = await pipeline(
  LENSES,
  (lens) => agent(`${CONTEXT}\n\n${lens.prompt}\n\nReturn your findings in the schema; set lens to "${lens.key}".`, { label: `find:${lens.key}`, phase: 'Find', schema: FINDINGS }),
  async (found, lens) => {
    if (!found) return { lens: lens.key, coverage: 'checker failed', confirmed: [], refuted: [], unverified: [] }
    if (!found.findings || found.findings.length === 0) return { lens: lens.key, coverage: found.coverage, confirmed: [], refuted: [], unverified: [] }
    const v = await agent(
      `${CONTEXT}\n\nYou are a SKEPTIC. Another checker (lens: ${lens.key}) reported the findings below. For EACH one, independently try to reproduce it against the live preview with your own script (do not trust their evidence). Mark real=false if you cannot reproduce it, if it is intended behaviour per the docs or the intended-preview items above, if it is out of scope, or if it is a test artefact (e.g. interacting before a step finished animating). Default to real=false when uncertain. Adjust severity to what the client or a customer would actually experience. For real ones, give the smallest correct fix with file paths.\n\nFindings:\n${JSON.stringify(found.findings, null, 2)}`,
      { label: `verify:${lens.key}`, phase: 'Verify', schema: VERDICTS },
    )
    const byId = new Map((v?.verdicts || []).map((x) => [x.id, x]))
    const confirmed = []
    const refuted = []
    const unverified = [] // the skeptic failed or skipped them: neither confirmed nor refuted
    for (const f of found.findings) {
      const verdict = byId.get(f.id)
      if (!verdict) unverified.push({ ...f, note: v ? 'no verdict returned for this id' : 'the skeptic failed' })
      else if (verdict.real) confirmed.push({ ...f, severity: verdict.severity, verifierReason: verdict.reason, fix: verdict.fix || f.suggestedFix })
      else refuted.push({ id: f.id, title: f.title, reason: verdict.reason })
    }
    return { lens: lens.key, coverage: found.coverage, confirmed, refuted, unverified }
  },
)

const all = results.filter(Boolean)
const confirmed = all.flatMap((r) => r.confirmed.map((c) => ({ lens: r.lens, ...c })))
const unverified = all.flatMap((r) => r.unverified.map((u) => ({ lens: r.lens, ...u })))
log(`${confirmed.length} confirmed, ${unverified.length} unverified, across ${all.length} lenses`)
return {
  confirmed,
  unverified,
  perLens: all.map((r) => ({ lens: r.lens, coverage: r.coverage, confirmed: r.confirmed.length, refuted: r.refuted, unverified: r.unverified.length })),
}
