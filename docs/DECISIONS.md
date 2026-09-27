# Decisions

ADR style: decision, rationale, source. Newest decisions are appended at the end.

## 2026-09-27 Everything installs at user (global) scope
- **Decision:** rules in the user `CLAUDE.md`, the command in the user `commands/`, marketplaces and plugins with `--scope user`, skills with `-g --copy`, GSD with `--global`, MCP servers with `--scope user`. SETUP runs from the home folder, passes the flag on every command even where it is the default, and verifies the scope of every item plus an untouched working directory. README, the paste prompt and SETUP all say so.
- **Rationale:** the kit must apply in every project on the friend's machine; `claude mcp add` defaults to local scope, so relying on defaults would leave servers tied to one folder.
- **Source:** Aaron ("make sure it tells it to install globally so every project does this").

## 2026-09-27 A GitHub repo that is also a plugin marketplace, not a Google Drive md file
- **Decision:** ship the kit as a git repo the friend's Claude clones; the repo doubles as the `aaron-kit` plugin marketplace.
- **Rationale:** a Drive file would reach Claude Code through WebFetch, which answers a prompt against the page with a small model, so Claude would get a summary instead of the exact commands (and WebFetch fails on private URLs). Skills are folders that can hold several files, which one md file cannot carry. A Drive file has no update path, while a repo gives `git pull`, `claude plugin marketplace update` and versioned plugin updates.
- **Source:** kit brief, 2026-09-27; WebFetch behaviour from its tool description.

## 2026-09-27 kit.json is the single source of truth; SETUP.md is the procedure
- **Decision:** items and commands live only in `kit.json`; SETUP reads it; README mirrors it.
- **Rationale:** one place to add items, and SETUP stays stable.
- **Source:** kit brief.

## 2026-09-27 Rules appended to the user CLAUDE.md; /antivibe-docs copied to the user commands/, not shipped in the plugin
- **Decision:** add `files/CLAUDE.md` to `<USER_CLAUDE_DIR>/CLAUDE.md` (appended once; since review round 1 as a marked block, see below); copy `files/commands/antivibe-docs.md` to `<USER_CLAUDE_DIR>/commands/`.
- **Rationale:** the command's name must stay `/antivibe-docs`, the name the rules tell the reader to run; inside the plugin it would be namespaced under `aaron-kit` (plugin skills already show as `aaron-kit:<name>`). The rules must sit in the user `CLAUDE.md` to apply in every project.
- **Source:** kit brief.

## 2026-09-27 Third-party skills and plugins are installed from their source, not copied
- **Decision:** only Aaron's own three skills, the rules and the command are copied into the repo (verbatim, sha256 checked). Everything else installs from its public GitHub or npm source.
- **Rationale:** updates keep flowing from upstream, authorship and licences stay with their owners, the repo stays small, and no stale copies accumulate.
- **Source:** kit brief.

## 2026-09-27 Keys never in the repo
- **Decision:** MCP entries carry placeholders only; the friend's key is typed at install time, passed on the `claude mcp add` line and stored by Claude Code in the friend's own `.claude.json`. SETUP never repeats a key, and verification shows only the Scope and Status lines of `claude mcp get`.
- **Rationale:** the repo may become public and is shared either way; `claude mcp get` prints header and env values (seen with a dummy key).
- **Source:** kit brief; verification run with a dummy key.

## 2026-09-27 The auto-allow permission hook is excluded
- **Decision:** the auto-allow `PermissionRequest` hook (matching every request) is not in the kit.
- **Rationale:** it approves every permission prompt automatically; handing that to someone else removes their main safety check.
- **Source:** kit brief.

## 2026-09-27 Items specific to Aaron's businesses and partners are excluded
- **Decision:** leave out hormozi-advisor, ux-checkmait, the ux-design and ux-review commands, syncing-clickup-projects (and its eval workspace), skills/synced, and the ghl, liquid-sunset, quickbooks and gimp MCP servers, plus all personal session data and credential files. Listed in `kit.json` → `notIncluded` and the README.
- **Rationale:** the friend is not part of Aaron's companies; these items point at Aaron's businesses, accounts, private files or local tools.
- **Source:** kit brief; checked against Aaron's user skills, commands and MCP server names on 2026-09-27.

## 2026-09-27 Repo URL and private vs public (decided later the same day: private, see "The kit is a private GitHub repo" below; then public, see "Repo made public" below)
- **Decision at the time:** not made. The kit assumed `github.com/AaronReginaldOsborne/claude-kit`, which did not exist yet.
- **Options considered:** private (Aaron adds the friend as a collaborator; the friend signs in to GitHub before pasting) or public (works because the repo holds no secrets).
- **Source:** Aaron's call.

## 2026-09-27 Marketplaces are added by HTTPS URL, not owner/repo
- **Decision:** `claude plugin marketplace add https://github.com/<owner>/<repo>.git --scope user`.
- **Rationale:** the shorthand cloned over SSH and failed with "Host key verification failed" in a clean home folder.
- **Source:** verification run.

## 2026-09-27 Skills CLI pinned to 1.7.0, with --copy
- **Decision:** `npx -y skills@1.7.0 add <source> -g -a claude-code -s <names> --copy -y`.
- **Rationale:** pinning keeps the verified flags; `--copy` writes real folders into the user skills folder instead of symlinks into `~/.agents/skills` (per `--help`, and seen in a Windows sandbox home).
- **Source:** `skills --help` and installs into a sandbox home.

## 2026-09-27 Ownership check before each skills add
- **Decision:** ask before a skills add when a same-name folder exists that `skills ls -g --json` does not attribute to the same source.
- **Rationale:** `skills add` overwrote an existing folder, local edits included, without asking.
- **Source:** verification run.

## 2026-09-27 GSD pinned to get-shit-done-cc 1.42.3 (confirmed by Aaron later the same day, see "GSD stays at 1.42.3 with its full profile" below)
- **Decision:** keep 1.42.3, matching Aaron's machine.
- **Rationale:** it installs cleanly with `--claude --global`; the npm package is deprecated and its repo archived in favour of `@opengsd/gsd-core` 1.15.0 (Node 24+), which Aaron has not adopted.
- **Source:** npm registry, the GitHub repo notice, installer runs.

## 2026-09-27 Windows launcher for nano-banana-pro
- **Decision:** ship `files/mcp/nano-banana-pro/` and use it on Windows only.
- **Rationale:** the package's entry check never passes on Windows ("Connection closed"); the launcher answered an MCP initialize.
- **Source:** the launcher Aaron already runs (same code, comments rewritten) and verification runs (Windows; Linux through WSL for the plain npx form).

## 2026-09-27 stitch-design-taste placed in Developer extras
- **Decision:** group it with the design tools.
- **Rationale:** the brief's group list did not place it; it is design help that pairs with the stitch MCP server.
- **Source:** builder's judgement call; Aaron may move it.

## 2026-09-27 The kit carries its own docs framework
- **Decision:** root `CLAUDE.md` and this `docs/` set, for maintainers only; SETUP never installs them.
- **Rationale:** Aaron's global anti-vibe-coding rules apply to every repository he develops in, this one included.
- **Source:** Aaron's global `CLAUDE.md`.

## 2026-09-27 Review round 1: the rules become a marked block, edited by a small Node helper
- **Decision:** SETUP no longer appends the rules with Claude's read and write tools. `tools/kit-files.mjs` (standard-library Node, tested by `tools/kit-files.test.mjs`) adds `files/CLAUDE.md` to the user `CLAUDE.md` between `<!-- claude-kit rules: start ... -->` and `<!-- claude-kit rules: end -->`, reports the state (missing, absent, current, outdated, unmarked, broken, unsupported-encoding), updates the block on a re-run only after the human's yes, and removes it for Undo. The re-run check looks for the text `## Anti-vibe-coding docs framework` anywhere, not for a whole line. `files/CLAUDE.md` itself stays a verbatim copy.
- **Rationale:** reviewers found that "contains the line" could duplicate the rules (the real heading continues with "(required in every repository)"), that append-once never delivered Aaron's rule changes, that Claude's Read tool can cut long files before a rewrite and passes the file through the chat, and that PowerShell 5.1 and bash need different append commands. Node is already required, so one helper works on every OS; it appends bytes, keeps line endings and BOM, and refuses UTF-16 files. It is a file helper, not the installer the MVP scope rules out.
- **Source:** review findings (secrets, install, coldread), 2026-09-27; helper tested on Windows.

## 2026-09-27 Keys are typed in the friend's own terminal by default
- **Decision:** `kit.json` → `keyEntry`: Claude shows one line that reads the key without echo (`read -rs K` in bash/zsh; `Read-Host -AsSecureString` in PowerShell) and passes it to `claude mcp add` as a variable. Pasting the key into the chat is a fallback, offered only after telling the human it then reaches Anthropic, the session history and memory tools. SETUP never writes a key into any file, script or note. Env and header templates are quoted.
- **Rationale:** a pasted key lands in the chat, the local transcript and possibly claude-mem; a typed command line lands in shell history; `<` and `>` left in a command are shell operators and can print the key in an error.
- **Source:** coldread review finding; the bash and PowerShell lines tested with dummy keys in a sandbox.

## 2026-09-27 MCP packages that hold keys are pinned to exact versions
- **Decision:** `@rafarafarafa/nano-banana-pro-mcp@1.0.4`, `meta-ads-mcp@1.0.128` (uvx), and for consistency `@playwright/mcp@0.0.82` and `shadcn@4.21.0`. The Windows launcher pins `@rafarafarafa/nano-banana-pro-mcp` 1.0.4 and `@modelcontextprotocol/sdk` 1.30.0 (both the versions in Aaron's working launcher), ships a `package-lock.json` and installs with `npm ci --prefix`, which also removes the need to `cd` out of the home folder.
- **Rationale:** unpinned `npx`/`uvx` runs whatever was published last, every time Claude Code starts, with the friend's key in its environment. Aaron bumps pins deliberately.
- **Source:** coldread review finding; registry versions checked and each pinned server Connected in a sandbox on 2026-09-27.

## 2026-09-27 Consent: plain disclosures, and three items asked about on their own
- **Decision:** the house rules for coding (rules + `/antivibe-docs`), claude-mem and meta-ads each get their own yes/no, with a plain sentence on what they do (the rules add a `CLAUDE.md` and `docs/` to every code project; claude-mem records every session locally, runs a small background service on this computer (localhost; port 37777 on Windows, a port in the 37700s on macOS/Linux; corrected in review round 3) and uses the friend's Claude usage; meta-ads can change real ad budgets and its token expires). Paid services are named. The group "Tools needing keys" is renamed "Extra connections (some need your own key)" and explains MCP servers and API keys in plain words.
- **Rationale:** the friend may not be a developer, and these items change behaviour in every project or can cost money.
- **Source:** coldread review findings; claude-mem facts from its README, its code and a working install.

## 2026-09-27 Undo, with an install record
- **Decision:** every item in `kit.json` has an `uninstall` command at the same scope, SETUP has an Undo section and the README an Undo paste prompt. SETUP writes `<USER_CLAUDE_DIR>/claude-kit-record.json` (ids and dates only) so Undo removes only what the kit installed and leaves what the friend already had. Old settings backups are not restored by Undo.
- **Rationale:** there was no way back, and restoring an old `.claude.json` would roll back everything else that changed since.
- **Source:** coldread review finding. Uninstall commands verified in a sandbox: plugin uninstall, marketplace remove, skills remove, GSD `--uninstall`, `claude mcp remove`.

## 2026-09-27 An existing local-scope MCP server is offered a user-scope replacement
- **Decision:** when a picked server is already listed, SETUP checks its scope. If it is not user scope, it offers to add the user-scope entry and, on yes, removes the local one (a local entry wins over a user entry of the same name). On no, it is reported as kept.
- **Rationale:** "already there" would have left the server working in one folder only, against the global rule.
- **Source:** coldread review finding; verified in a sandbox (local wins until `claude mcp remove <name> --scope local`).

## 2026-09-27 Node 24 LTS recommended, 22.20 still the minimum
- **Decision:** keep 22.20 as the hard minimum and recommend Node 24 LTS; per-OS install help points macOS to Homebrew or nvm and Linux to nvm or fnm; an `EACCES` from `npm install -g` is explained and fixed only on the human's yes (a user npm prefix), never with sudo.
- **Rationale:** agent-browser 0.27.1 and later require Node 24, so Node 22 silently gets 0.27.0; root-owned npm folders from the nodejs.org macOS installer or distro packages make `npm install -g` fail.
- **Source:** npm registry engines per version; npm's documentation on EACCES; install and coldread review findings.

## 2026-09-27 Keep the kit folder in place
- **Decision:** the README, SETUP's report and `kit.json` tell the friend to keep `~/claude-kit`, and SETUP carries the recovery commands. Switching the aaron-kit marketplace to its git URL is OPEN for Aaron (with the repo private, every marketplace update would then need the friend's git credentials; see "The kit is a private GitHub repo"). Since the repo was made public (2026-09-27) that objection no longer applies; the switch stays OPEN for Aaron.
- **Rationale:** the marketplace is a local directory; moving the folder breaks aaron-kit ("failed to load: cache-miss"), reproduced and recovered in a sandbox.
- **Source:** install review finding; sandbox test 2026-09-27.

## 2026-09-27 GSD profile (decided later the same day: full, see "GSD stays at 1.42.3 with its full profile" below)
- **Decision at the time:** not made. The kit installs GSD's default `full` profile (67 skills, about 12k tokens at the start of every session, per the installer's help), and the Developer extras description says so. `--profile=core` (about 700 tokens) or `standard` are the lighter options; Aaron's own machine has the `full` marker but no gsd-* skills.
- **Source:** coldread review finding; GSD 1.42.3 `bin/install.js` help; sandbox install counted 67 skills.

## 2026-09-27 Review round 2: the working-folder check covers the session folder's whole .claude/
- **Decision:** when the session folder is not the home folder, Step 0.3 snapshots every path under `<folder>/.claude/` with its modified time and size, plus the top-level key names of its `.claude/settings.json` and `.claude/settings.local.json`; Step 5 flags every new, removed or changed path there, except a `settings.local.json` change in which no key other than `permissions` changed. The fixed list (`.mcp.json`, `skills-lock.json`, `.agents/skills/`, a `CLAUDE.md` in the folder itself, `.claude/settings.local.json`) still applies to both folders. The home-folder rules stay: there `~/.claude` is the user Claude folder, whose `settings.json` is expected to change. The snapshot and the comparison are two new commands of `tools/kit-files.mjs` (`snapshot`, `compare`), plus `keys`, which prints JSON key names only. The snapshot file sits in `<USER_CLAUDE_DIR>/claude-kit-snapshot.json` from Step 0.3 to Step 5 and holds paths, times, sizes, key names and a 16-character hash of each settings value (to tell which key changed), never a value; the helper refuses to write it inside a watched path. `scopeRule` (new `sessionFolderClaudeDir`), `verification.workingDirectory`, SETUP Step 0.3 and Step 5, and KIT-001 AC5 say so.
- **Rationale:** the old list missed the main project-scope files: a project-scope plugin install writes `enabledPlugins`, and a project-scope marketplace add writes `extraKnownMarketplaces`, into `<folder>/.claude/settings.json`; a GSD run without `--global` writes a whole `<folder>/.claude/` (commands, agents, hooks, get-shit-done, settings.json); a misplaced command lands in `<folder>/.claude/commands/`. A recursive listing with times differs between PowerShell, GNU find and macOS find, and reading settings files in the chat would expose values such as `env` keys, so the helper does it the same way everywhere. A folder's own modified time is ignored because an atomic save of `settings.local.json` changes it.
- **Source:** review finding (major), 2026-09-27; Claude Code docs, "Install and manage plugins > Choose an install scope" (project scope writes `.claude/settings.json`, local scope `.claude/settings.local.json`); `claude plugin install --help` and `claude plugin marketplace add --help` (user, project, local); GSD 1.42.3 `bin/install.js` (`--local` installs into the current directory). Helper tested by `tools/kit-files.test.mjs` on Windows and run once from PowerShell 5.1.

## 2026-09-27 Marketplace scope is proven by key names, not by the marketplace list
- **Decision:** Step 5 also checks, with `fileHelper keys`, that each kit marketplace is a key of `<USER_CLAUDE_DIR>/settings.json` → `extraKnownMarketplaces` or of `<USER_CLAUDE_DIR>/plugins/known_marketplaces.json` (both are checked; either is enough), and that none is a key of `extraKnownMarketplaces` in the session folder's `.claude/settings.json` or `.claude/settings.local.json` (in the home folder only `settings.local.json`, since `settings.json` is the user file).
- **Rationale:** `claude plugin marketplace list --json` has no scope field, so a project-scope add would pass the old check. Both user files are needed: on a checked machine `claude-plugins-official` was a key of `known_marketplaces.json` but not of `extraKnownMarketplaces`, while the others were in both.
- **Source:** review finding (minor), 2026-09-27; key names (no values) read from a working user `settings.json` and `plugins/known_marketplaces.json`.

## 2026-09-27 The EACCES fix and the gsd-sdk PATH fix are recorded shell changes
- **Decision:** the writes that `cli:agent-browser.ifEacces` makes after the human's yes (`~/.npmrc` gains `prefix`, the new `~/.npm-global/`, and a PATH line in `~/.zshrc` or `~/.bashrc`) are listed in `scopeRule.expectedUserLevelWrites`. Step 6 records the id `npm-prefix` when it was applied (and `gsd-sdk-path` for the GSD fix below). Undo tells the human they stay and reverts them only on a yes (`npm config delete prefix --location user` since review round 3, remove the profile line), last, after the kit's npm packages are gone; `~/.npm-global` needs its own yes.
- **Rationale:** the fix changed user files outside the Claude folder without any record, so neither the working-folder check nor Undo knew about them. Reverting the prefix while packages still live under it would strand them, hence the order and the questions.
- **Source:** review finding (minor), 2026-09-27; npm's `config set` writes the user config file (`~/.npmrc` by default).

## 2026-09-27 GSD verification checks that gsd-sdk runs
- **Decision:** `gsd.verify` and SETUP Step 5 also run `command -v gsd-sdk` (bash, zsh, Git Bash) or `Get-Command gsd-sdk` (PowerShell), in a new terminal if needed. If it is missing, the report says "GSD installed, gsd-sdk not on PATH", shows the lines the installer printed, and changes the shell profile (macOS/Linux) or the user PATH (Windows) only on the human's yes, recorded as `gsd-sdk-path` (`gsd.sdkPath`). The dependency on npm's npx cache goes into `gsd.open` with "re-run the paste prompt" as the recovery.
- **Rationale:** 79 of GSD's 90 workflow files call `gsd-sdk query ...`, but the installer only links the command: on macOS/Linux into the first writable folder under the home folder that is on PATH, else `~/.local/bin` even when that is not on PATH; on Windows into `npm prefix -g`. Every link points at `<npm cache>/_npx/<hash>/node_modules/get-shit-done-cc/bin/gsd-sdk.js` (a symlink on macOS/Linux; `.cmd`, `.ps1` and sh shims running node on that path on Windows). **Correction to the review finding:** `npm cache clean --force` does not break it, since it deletes only `<npm cache>/_cacache`; what breaks it is deleting `<npm cache>/_npx` (newer npm's `npm cache npx rm --force`, deleting npm's cache folder by hand, a clean-up tool). That a re-run restores it was not tested.
- **Source:** review finding (minor), 2026-09-27; GSD 1.42.3 `bin/install.js` (`trySelfLinkGsdSdk`, `trySelfLinkGsdSdkWindows`, the "gsd-sdk is not on your PATH" diagnostic) and `get-shit-done/bin/lib/shell-command-projection.cjs`; npm `lib/commands/cache.js` in 10.9.2 (local) and 12.1.0 (GitHub), and `@npmcli/config` definitions (`cache` → `_cacache`, `npxCache` → `_npx`).

## 2026-09-27 Maintainer sandbox recipe: three more leaks written down
- **Decision:** CLAUDE.md rule 7 and README "Adding an item" step 2 now say: disable claude-mem inside the sandbox (`claude plugin disable claude-mem@thedotmack --scope user`) or set `CLAUDE_MEM_WORKER_PORT` to a free port in `<sandbox>/.claude-mem/settings.json` before any `claude mcp list/get`; put npm's bin folder for the sandbox `npm_config_prefix` first on `PATH` (README step 2 had left this out); never run the PATH-change lines GSD prints during a test; run sandbox checks while no other Claude session is starting.
- **Rationale:** the `mcp list/get` health check starts claude-mem's MCP server, which connects to the worker on 127.0.0.1 at its default port (37777 on Windows), the maintainer's real worker. GSD's Windows suggestion is a permanent user PATH change. A starting session's marketplace auto-refresh updates `lastUpdated` in the real `known_marketplaces.json`, which looks like a leak.
- **Source:** review finding (minor), 2026-09-27; claude-mem 13.0.0 `scripts/mcp-server.cjs` (default port `37700 + uid % 100`, 77 when there is no uid, as on Windows; the port read from `<home>/.claude-mem/settings.json`); `claude plugin disable --help`; GSD's `shell-command-projection.cjs`; the `lastUpdated` field in `known_marketplaces.json`.

## 2026-09-27 The kit is a private GitHub repo (Superseded 2026-09-27 by: repo made public)
- **Decision:** publish the kit as a private repo at `https://github.com/AaronReginaldOsborne/claude-kit`. It is published once Aaron creates it and pushes (it did not exist on 2026-09-27). Aaron invites the friend as a collaborator by GitHub username; the friend accepts the email invite, then signs in once so the HTTPS clone and later pulls work: `gh auth login`, choosing GitHub.com, then HTTPS, then yes to "Authenticate Git with your GitHub credentials?" (`gh auth setup-git` fixes it if they chose SSH), or Git Credential Manager on Windows (the `gh auth login` choices added in review round 3). Until then GitHub answers 404 ("Repository not found" from git), which means no access, not a missing repo; the paste prompt stops and says so. `kit.repoStatus` reads private; the friend's GitHub username stays OPEN (invite pending). The aaron-kit marketplace stays a local folder.
- **Rationale:** Aaron's choice. Public stays possible later, since the repo holds no secrets, no keys and none of Aaron's company items (KIT-010).
- **Source:** Aaron, 2026-09-27.

## 2026-09-27 GSD stays at get-shit-done-cc 1.42.3 with its full profile
- **Decision:** keep `npx -y get-shit-done-cc@1.42.3 --claude --global` with its default (full) profile; no `--profile` flag. The package is deprecated on npm in favour of `@opengsd/gsd-core` (Node 24+); switching is OPEN for Aaron. `kit.json` (`gsd.profile`, `gsd.deprecated`, `gsd.open`, `open`), README and SETUP 4e say so.
- **Rationale:** the same GSD version as Aaron's machine (1.42.3, 33 gsd agents). Unlike Aaron's install, which has no gsd-* skills, the friend gets all 67 gsd-* skills (about 12k tokens per session); the cost stays disclosed in the Developer extras description. (Wording corrected in review round 3: the earlier "matching Aaron's own setup" overstated the match.)
- **OPEN for Aaron:** a lighter profile to match Aaron's install.
- **Source:** Aaron, 2026-09-27.

## 2026-09-27 Review round 3: working-folder check, snapshot timing, CLAUDE_CONFIG_DIR, marketplace check, Undo and wording
- **Decision (helper):** `fileHelper compare` no longer flags a new or removed folder that has contents: its files are compared one by one, and the folder is flagged only when it is empty or something inside it is flagged (listed under `ignored` otherwise). A session folder that had no `.claude/` and gains only a permissions-only `settings.local.json` is now clean. `snapshot` takes `USER_CLAUDE_DIR` as a fourth argument: a folder's `.claude/` is watched whole unless it is `USER_CLAUDE_DIR`, so with `CLAUDE_CONFIG_DIR` pointing elsewhere the home folder's `.claude/` is watched like a project's. The snapshot also keeps the key names under `extraKnownMarketplaces`, and `compare` reports `marketplacesAdded` per settings file. The two literal BOM characters in the helper and the one in its test became `﻿` escapes. New tests in `tools/kit-files.test.mjs` (16 pass).
- **Decision (SETUP):** the snapshot moves from Step 0.3 to a new Step 1b, after the prerequisite check (the helper needs Node) and before the Step 3 backups and any install. The marketplace negative check covers every settings file the snapshot watched (including `HOME_DIR/.claude/settings.json` when `CLAUDE_CONFIG_DIR` points elsewhere) and flags a kit marketplace only when `compare` lists it under `marketplacesAdded`; one that was there before is reported as "found in your project settings, left alone". In 4b, a listed kit marketplace that is not a key of the user `settings.json` → `extraKnownMarketplaces` nor of `known_marketplaces.json` also gets its user-scope `add` (not verified in a sandbox that this add writes the user declaration when the marketplace is already on disk: OPEN in `kit.json`; Step 5 catches it). Rule 2 and `scopeRule.noScopeOption` name the two commands with no scope option (`claude plugin marketplace update`, `agent-browser install`); the npm prefix change and its undo carry `--location user`. Undo tells the human GSD's uninstall leaves `gsd-sdk` and deletes it only on a yes (`gsd.uninstallNote`, `undo.gsdSdkLink`, KIT-013 AC5).
- **Decision (wording):** `gh auth login` instructions say GitHub.com, then HTTPS, then yes to authenticating git, with `gh auth setup-git` as the fix after choosing SSH (removed with the rest of the sign-in steps when the repo was made public, see "Repo made public"). claude-mem's service is "localhost; port 37777 on Windows, a port in the 37700s on macOS/Linux". GSD is "the same version as Aaron's machine; unlike Aaron's install, the friend gets all 67 gsd-* skills (about 12k tokens per session)"; a lighter profile to match Aaron is OPEN for Aaron. CLAUDE.md rule 4 and DATA_MODEL allow excluded item names in the `notIncluded` lists and the maintainer docs, matching KIT-010 AC3; rule 7 says npm's bin folder for the prefix goes first on PATH. `.gitignore` adds `.claude.json`, `.npmrc`, `*.pem`, `id_rsa*`, `*credentials*.json`, `service-account*.json`, `secrets*.json`. Details about Aaron's own machine and workspaces were made neutral ("verified shape", no hook file name, no workspace names); the plain excluded item names stay.
- **Rationale:** reviewers reproduced a false "flagged" for a new `.claude/` holding only approvals; Step 0.3 ran the Node helper before Step 1 checked Node; with `CLAUDE_CONFIG_DIR` set, `~/.claude` is an ordinary folder a project-scope write could reach; a marketplace the friend already had in a project file would have failed Step 5; `claude plugin marketplace update` cannot make a project-only marketplace user-scope; GSD 1.42.3's uninstall has no gsd-sdk step; claude-mem's port differs by OS; the old GSD wording implied the friend's install matched Aaron's.
- **Source:** two independent reviews, 2026-09-27. Checked the same day: `gh auth login --help` and `gh auth setup-git --help` (gh 2.87.3); `claude plugin marketplace update --help` (only `-h`); npm 10.9.2 `npm config --help` (`-L|--location <global|user|project>`) and `lib/commands/config.js` (`keyValues` accepts `key value`); claude-mem 13.0.0 `scripts/mcp-server.cjs` (`37700+(process.getuid?.()??77)%100`); GSD 1.42.3 `bin/install.js` (the `uninstall` function has no gsd-sdk step).

## 2026-09-27 Repo made public
- **Decision:** `https://github.com/AaronReginaldOsborne/claude-kit` is a public repo (created and pushed 2026-09-27). Anyone can clone it over HTTPS with no GitHub account, invite or sign-in, and later pulls need none either. The README's "Before you paste" list drops the GitHub account, invite, `gh auth login` and Git Credential Manager item; "Getting access to the repo" becomes "Where the kit lives"; the friend's-username OPEN item is gone. The paste prompt keeps its behaviour except the private-repo stop: if the clone fails, it stops and shows the error in plain words, and SETUP does the same for a failed pull ("Re-running", "If something goes wrong"). `kit.repoStatus` reads public, `kit.access` says anyone can clone over HTTPS. CLAUDE.md rule 10: everything committed is world-readable, so the no-secrets and no-personal-items rules are absolute. KIT-012 and F5 are BUILT, S10 is DONE. Switching the aaron-kit marketplace to its git URL stays OPEN for Aaron, without the sign-in objection. Supersedes "The kit is a private GitHub repo".
- **Rationale:** the friend needs no GitHub account, invite or sign-in, so the paste prompt is truly copy-paste-and-go. The repo holds no secrets (two independent scans before publishing; the KIT-010 AC1 and AC2 searches found nothing again on 2026-09-27), and commits use the GitHub noreply address (the repo's `user.email`).
- **Source:** Aaron, 2026-09-27.
