# claude-kit

Aaron's Claude Code setup, packaged so a friend's Claude Code can install it by itself: the anti-vibe-coding rules and the `/antivibe-docs` command, Aaron's own skills as a plugin, a set of public plugins and skills, GSD, and optional MCP servers that use the friend's own keys.

**Everything installs globally (user scope), so it works in every project on the machine; nothing is installed into a single project.**

The kit holds no secrets: no keys, tokens, account files or history. Keys are entered at install time, by default in the friend's own terminal, and stored only in the friend's own Claude Code config.

## Before you paste

- **A terminal with Claude Code in it.** Mac: open Terminal. Windows: open PowerShell (not Command Prompt). Linux: open your terminal. Type `cd ~` and press Enter (this puts you in your home folder), then type `claude` and press Enter. If you use Claude Code only in the desktop app or in VS Code, install the command-line version first: https://code.claude.com/docs/en/setup.
- **git.** Type `git --version`. If it is not found: Mac, run `xcode-select --install`; Windows and Linux, https://git-scm.com/downloads. Then close the terminal, open a new one and start again.
- Claude will ask before each command it runs, and may ask whether to trust your home folder: answer Yes. It checks Node.js and the rest itself and tells you what to install if something is missing.

## The paste prompt

Paste this into Claude Code:

```text
Clone https://github.com/AaronReginaldOsborne/claude-kit into a folder called claude-kit in my home folder (if it is already there, pull the latest instead). If git is missing, stop and tell me to install it from https://git-scm.com/downloads. If the clone fails, stop and show me the error in plain words. Then read claude-kit/SETUP.md and do every step in it, in order. Install everything globally, at user scope, so it works in every project, never inside the current project. Ask me which groups I want, ask me for my own keys only for the tools I pick, and never save my keys in the kit folder. When you are done, tell me what was installed, what was skipped and what still needs a key, and tell me to restart Claude Code.
```

Answer its questions, then quit and restart Claude Code. **Keep the `claude-kit` folder in your home folder afterwards: Aaron's skills load from it, and moving or deleting it breaks them.**

## What it installs

You pick groups; Core is the recommended start. In plain words:

- **Core:** Aaron's skills for new client websites, launch checks and SEO; habits for planning, debugging and testing; a skill for making your own skills; Word, Excel, PowerPoint and PDF skills. Asked separately: **house rules for coding**, which make Claude add and keep up a `CLAUDE.md` file and a `docs/` folder (plan, scope, decisions) in every code project it works in, including other people's; skip them if you mostly work in someone else's code.
- **Developer extras:** a project workflow (GSD), tools for design, databases, deployment and browser automation. GSD, as installed, adds about 12,000 tokens to the start of every Claude session. Asked separately: **claude-mem**, which records every session in every project into a local database on your computer, runs a small background service, and uses extra Claude sessions (your usage) to summarise your work.
- **Marketing and content:** SEO and AI-search audits, planning for AI video and voice-over, Higgsfield image and video skills. The skills are free; the video and image services they write for are paid and need your own accounts.
- **Extra connections (some need your own key):** optional connections that let Claude use outside services, picked one by one. An API key is a password-like code you get from that service's website. Gemini image generation and 21st.dev can charge your account, and meta-ads can change real ad budgets (Claude asks before each action; read each request).

The detail, for Aaron and the curious (exact items and commands are in `kit.json`):

| Group | What is in it |
|---|---|
| **Core** (recommended) | `aaron-kit` plugin (skills: first-website, production-readiness, seo-strategy, client-website-build), superpowers, skill-creator, document-skills (Word, Excel, PowerPoint, PDF); asked separately: the anti-vibe-coding rules (a marked block appended to `~/.claude/CLAUDE.md`) and the `/antivibe-docs` command |
| **Developer extras** | GSD 1.42.3, the same version as Aaron's machine, with its default full profile (33 agents, 67 skills, hooks, status line, the `gsd-sdk` command; unlike Aaron's install, you get all 67 gsd-* skills, about 12k tokens per session), context-mode, ui-ux-pro-max, vercel, supabase-postgres-best-practices, agent-browser (plus its CLI and a Chrome download), find-skills, stitch-design-taste; asked separately: claude-mem (needs Bun; data in `~/.claude-mem`, a small background service on this computer: localhost, port 37777 on Windows, a port in the 37700s on macOS/Linux) |
| **Marketing and content** | ai-seo, seo-audit; ai-video, ai-voiceover, captions-and-clipping, heygen, kling, luma, synthesia, talking-head-and-piece-to-camera, veo-3; eight Higgsfield skills (need a Higgsfield account) |
| **Extra connections** | MCP servers, picked one at a time: context7, playwright, shadcn (no key); stitch, 21st, meta-ads, nano-banana-pro (your own key; packages pinned to exact versions) |

Needs: Claude Code CLI and git before you paste (see above); Node.js 22.20 or newer, with Node 24 LTS recommended (agent-browser gets an older version on Node 22). Bun only for claude-mem, uv only for meta-ads. SETUP checks Node, Bun and uv itself and stops with an install link if one is missing.

Privacy: the kit collects nothing. The skills CLI it runs sends an install event (the skill names, their source and the CLI version) to its maker, Vercel; to turn that off, set the environment variable `DO_NOT_TRACK=1` in your terminal before you start `claude` (read in the CLI's code, version 1.7.0).

## Where the kit lives

The kit lives in a **public** GitHub repo, https://github.com/AaronReginaldOsborne/claude-kit (Aaron's decision, 2026-09-27; published 2026-09-27). Anyone with the link can install it: no GitHub account or sign-in is needed, for the first download or for later updates.

## Updating

- **The friend:** paste the same prompt again. SETUP pulls the latest kit, updates the marketplaces, plugins, skills and GSD, asks before refreshing a skill you edited, asks before updating the rules block if Aaron changed the rules, leaves existing MCP servers alone, adds anything newly picked, and asks for a restart.
- **Aaron, when he changes the kit:** push to the repo, then tell the friend to re-run the prompt.

## Undo

Paste this into Claude Code, started in your home folder:

```text
Read claude-kit/SETUP.md in my home folder and follow its "Undo" section: remove what the kit installed, asking me which groups to remove, and leave everything else alone.
```

It removes only what the kit itself installed (it keeps a record in `~/.claude/claude-kit-record.json`), leaves the backups, and asks before deleting any data folder. GSD's own uninstall leaves its `gsd-sdk` command behind; Claude asks before deleting it. If setup changed your npm settings or added a PATH line to your shell profile (only ever after you said yes), those stay unless you say to undo them.

## Adding an item (Aaron)

1. Put it in the right section of `kit.json` (`marketplaces` + `plugins`, `skills`, `mcpServers`, `cliTools` or `files`) with the exact command, including its scope flag (`--scope user`, `-g`, `--global`), and its `uninstall` command. Add its id to a group's `items`. Pin exact versions for anything that runs with a key; Aaron bumps those pins deliberately.
2. Check the command before you commit: its `--help`, a `--list` dry run, or an install into a throwaway home. For that, set `HOME` (and on Windows `USERPROFILE`), `CLAUDE_CONFIG_DIR` for `claude` commands, and `npm_config_prefix` for `npm -g`, all to folders inside an empty test folder, and **put npm's bin folder for that prefix first on `PATH`** (the prefix itself on Windows, `<prefix>/bin` on macOS and Linux), so programs installed with `npm -g` in the test run before your real ones. Known leaks to avoid:
   - Native programs such as the agent-browser binary ignore `HOME` and `USERPROFILE` on Windows, so do not run their download steps in a test.
   - **Never run the PATH-change lines GSD prints during a test** (on Windows its PowerShell line changes your real user PATH permanently).
   - With claude-mem installed in the test home, `claude mcp list` and `claude mcp get` health-check its server, which talks to the claude-mem worker on 127.0.0.1 at its default port (37777 on Windows): your **real** worker, if one is running. Before any `mcp list/get`, run `claude plugin disable claude-mem@thedotmack --scope user` in the test home, or set `CLAUDE_MEM_WORKER_PORT` to a free port in `<test home>/.claude-mem/settings.json`.
   - Run tests while no other Claude session is starting: a starting session refreshes marketplaces and updates `lastUpdated` in your real `~/.claude/plugins/known_marketplaces.json`, which looks like a leak but is not one.

   Anything you could not check goes under `open` in `kit.json`.
3. One of your own skills: copy its folder into `plugins/aaron-kit/skills/<name>/`, then **raise `version`** in `plugins/aaron-kit/.claude-plugin/plugin.json`. Without a version bump, `claude plugin update` tells the friend they are already up to date. Run `claude plugin validate .` and `claude plugin validate ./plugins/aaron-kit --strict`.
4. Only change SETUP.md if the new item needs a new kind of step.
5. Commit, push, and have the friend re-run the prompt.

## Files

```text
kit.json                      source of truth: groups, commands, uninstall commands, MCP templates (placeholders only), OPEN items
SETUP.md                      instructions for the friend's Claude Code (install, re-run, undo)
tools/kit-files.mjs           small Node helper: adds, updates or removes the rules block in ~/.claude/CLAUDE.md, snapshots and re-checks the working folders, prints JSON key names (never values)
.claude-plugin/marketplace.json   this repo is the "aaron-kit" plugin marketplace
plugins/aaron-kit/            the aaron-kit plugin (plugin.json + four skills, copied verbatim)
files/CLAUDE.md               the anti-vibe-coding rules (added to ~/.claude/CLAUDE.md as a marked block)
files/commands/antivibe-docs.md   the /antivibe-docs command
files/mcp/nano-banana-pro/    Windows-only launcher for the nano-banana-pro MCP server (exact versions + lockfile)
CLAUDE.md, docs/              rules and docs for editing the kit itself (not installed on the friend's machine)
```

## Not included

| Item | Why not |
|---|---|
| hormozi-advisor skill | Built for Aaron's company; depends on his own private files |
| ux-checkmait skill, ux-design and ux-review commands | The house UI rules of Aaron's company; company-specific |
| syncing-clickup-projects skill and its eval workspace | Wired to Aaron's own project-management workspaces |
| skills/synced | Comes from each person's own claude.ai account |
| The auto-allow PermissionRequest hook | Approves every permission prompt automatically; too risky to hand on |
| MCP servers ghl, liquid-sunset, quickbooks, gimp | Tied to Aaron's businesses, accounts or local tools |
| Token and credential files | Secrets, never shared |
| history, projects, memory, permissions | Personal session data and Aaron's own approvals |
| claude.ai connectors (Gmail, Drive, Calendar, Notion, Figma...) | Per account: connect your own in claude.ai under Settings > Connectors |

## OPEN

- **aaron-kit by git URL:** adding the aaron-kit marketplace by its git URL would mean the local folder no longer matters. The earlier objection, that every marketplace update would need the friend's GitHub sign-in, no longer applies now that the repo is public. Not tried; Aaron to decide.
- **GSD profile:** the kit installs GSD's default full profile. Unlike Aaron's install, which has no gsd-* skills, the friend gets all 67 gsd-* skills (about 12k tokens per session). A lighter profile to match Aaron's install is Aaron's call.
- **GSD Core:** the kit keeps `get-shit-done-cc` 1.42.3, the same version as Aaron's machine, with its default full profile (decided 2026-09-27). npm marks that package as deprecated in favour of `@opengsd/gsd-core` (1.15.0, needs Node 24+, same `--claude --global` flags; its old GitHub repo is archived). Switching is Aaron's call.
- **gsd-sdk and npm's npx cache:** the `gsd-sdk` command points into npm's npx cache, so deleting that cache folder breaks GSD commands (`npm cache clean --force` does not touch it). Re-running the paste prompt should bring it back; not tested.
- **agent-browser CLI:** `agent-browser install` (the Chrome download) was never run in a test, because on Windows it writes into the real home folder even inside a throwaway one.
- **macOS:** no command has been run on a Mac yet; the checks ran on Windows (Git Bash and PowerShell) and, for one server, Linux through WSL.
- **playwright MCP on a machine with no browser:** not tested.
- **Higgsfield CLI on Windows:** the skills install their CLI with a `curl | sh` script; a Windows route was not checked.
- **PowerShell with an npm-installed `claude.ps1`:** PowerShell can drop the `--` in `claude mcp add`; documented behaviour, not reproduced (SETUP says to use `claude.cmd` or Git Bash).
- **Video skills' companions:** some social-media video skills mention skills that are not in the kit (veo-3, for example, reads brand-profile). They install without them, and Aaron runs the same set; how well each works without its companions was not checked.
