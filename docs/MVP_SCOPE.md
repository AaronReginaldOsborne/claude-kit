# MVP scope (kit v1.0.0)

## In
- Anti-vibe-coding rules added once to the user `CLAUDE.md` as a marked block (updated on a re-run only after a yes); `/antivibe-docs` copied to the user `commands/`. Both asked about on their own inside Core.
- `aaron-kit` plugin (first-website, production-readiness, seo-strategy) served from this repo as a local-directory marketplace; the friend keeps the clone in place.
- Public plugins (8 plugins in all with aaron-kit): superpowers, skill-creator, vercel (claude-plugins-official); context-mode; claude-mem (asked about on its own); document-skills; ui-ux-pro-max.
- Public skills via the skills CLI 1.7.0, installed from their sources (23): agent-browser, find-skills, supabase-postgres-best-practices, stitch-design-taste, ai-seo, seo-audit, nine video/voice skills, eight Higgsfield skills.
- GSD 1.42.3 (global, default full profile; the same version as Aaron's machine; unlike Aaron's install, the friend gets all 67 gsd-* skills, about 12k tokens per session) and the agent-browser CLI.
- Optional MCP servers with the friend's own keys (7), pinned to exact versions: context7, playwright, shadcn (no key); stitch, 21st, meta-ads, nano-banana-pro (key, typed in the friend's own terminal by default; Windows launcher for nano-banana-pro).
- Four pickable groups in plain words, Core recommended, paid services named; backups; idempotent re-run as update; verification that every item is global (marketplaces proven by key names in the user settings files) and the working folders are untouched (the session folder's whole `.claude/` when it is not the home folder); an install record, including the shell changes the human said yes to; Undo.
- `tools/kit-files.mjs`, the helper that edits the rules block, snapshots and re-checks the working folders, and prints JSON key names without values.

## Out
- Everything under `notIncluded` in `kit.json` (Aaron's company skills, commands and MCP servers, the auto-allow hook, credentials, personal session data, claude.ai connectors).
- Copies of third-party skills or plugins in this repo.
- An automated installer script (the friend's Claude executes SETUP.md instead; the helper only edits the rules block and inspects files: it installs nothing).
- A lighter GSD profile (decided 2026-09-27: the kit keeps the default full profile). A lighter profile to match Aaron's install, which has no gsd-* skills, is OPEN for Aaron.
- A switch to GSD Core (`@opengsd/gsd-core`): OPEN, Aaron's call.

## Release: public repo created and pushed 2026-09-27
- `https://github.com/AaronReginaldOsborne/claude-kit` is public (Aaron's decision, 2026-09-27): the friend's Claude clones it over HTTPS with no GitHub account, invite or sign-in (KIT-012). The end-to-end dry run on a clean machine (BUILD_PLAN S9) is still to do.
