# Feature tickets

IDs are stable; never renumber. Status: BUILT (written and verified per command, not yet run end to end), PLANNED, or DONE (verified in the repo itself).

## KIT-001 Global-only install (BUILT)
- AC1: every install, update and uninstall command in `kit.json` carries an explicit scope flag (`--scope user`, `-g`, `--global`, `npm install -g` / `npm uninstall -g`, `--location user` on `npm config set prefix` and `npm config delete prefix`) or targets a folder inside the user Claude folder (`npm ci --prefix "<USER_CLAUDE_DIR>/mcp/nano-banana-pro"`). The only commands with no scope option (`kit.json` → `scopeRule.noScopeOption`) are `claude plugin marketplace update [<name>]`, which refreshes marketplaces already declared, and `agent-browser install`, which writes only to `~/.agent-browser/`.
- AC2: after a run, `claude plugin list --json` shows every kit plugin with `"scope": "user"` and `"enabled": true`.
- AC3: `claude mcp get <name>` shows `Scope: User config (available in all your projects)` for every added server, unless the human chose to keep an existing local entry (reported under Skipped).
- AC4: every kit skill is a folder with a `SKILL.md` under `<USER_CLAUDE_DIR>/skills`, and `npx -y skills@1.7.0 ls -g --json` shows it with `"scope": "global"`.
- AC5: `fileHelper compare` against the Step 1b snapshot (taken after the prerequisite check, before any backup or install) prints `"result":"clean"`: none of `kit.json` → `scopeRule.mustNotAppearInWorkingDirectory` appears, disappears or changes in the session folder or the home folder, and no file under a watched `.claude/` is new, removed or changed (`scopeRule.sessionFolderClaudeDir`): the session folder's when it is not the home folder, and the home folder's when `USER_CLAUDE_DIR` does not resolve to `HOME_DIR/.claude` (`CLAUDE_CONFIG_DIR` set elsewhere; the snapshot is given `USER_CLAUDE_DIR`). A `.claude/settings.local.json` change in which no key other than `permissions` changed (the human's approvals) and a new folder whose files were all compared and none flagged (for example a new session `.claude/` holding only such a `settings.local.json`) are listed under `ignored` and are not a failure. Changes inside `USER_CLAUDE_DIR` are not checked. The snapshot file is gone after Step 5. Covered by `tools/kit-files.test.mjs`.
- AC6: every kit marketplace in `claude plugin marketplace list --json` is also a key of `<USER_CLAUDE_DIR>/settings.json` → `extraKnownMarketplaces` or of `<USER_CLAUDE_DIR>/plugins/known_marketplaces.json` (4b runs its user-scope add when it is listed but in neither), and no kit marketplace is new since the snapshot in `extraKnownMarketplaces` of a watched settings file (each watched folder's `.claude/settings.local.json`, and its `.claude/settings.json` unless that `.claude/` is `USER_CLAUDE_DIR`, so `HOME_DIR/.claude/settings.json` too when `CLAUDE_CONFIG_DIR` points elsewhere): `fileHelper compare` lists none under `marketplacesAdded`. One that was there before the run is reported as "found in your project settings, left alone" (key names only, via `fileHelper keys` and `compare`).

## KIT-002 Rules and command (BUILT)
- AC1: a missing `<USER_CLAUDE_DIR>/CLAUDE.md` is created with the rules block; an existing one gets the block appended once with its earlier bytes unchanged; after a second run `rules-status` reports `current` and `"headingCount":1`.
- AC2: `<USER_CLAUDE_DIR>/commands/antivibe-docs.md` exists after install and `/antivibe-docs` runs under that name; a different existing file is replaced only after the human says yes, and is backed up first.
- AC3: when `files/CLAUDE.md` changes, a re-run reports `outdated`, asks, and after a yes `rules-status` reports `current` with text outside the block unchanged.
- AC4: `node --test tools/kit-files.test.mjs` passes.

## KIT-003 Backups and no overwrite (BUILT)
- AC1: timestamped copies of `CLAUDE.md` and `settings.json` (and `.claude.json` when MCP servers are picked) exist before the first change.
- AC2: a same-name skill that the skills CLI did not install from the same source is not overwritten without a yes.
- AC3: on a re-run, a kit skill with a file modified more than a minute after its `updatedAt` in `~/.agents/.skill-lock.json` is not re-added without a yes.

## KIT-004 Group choice and consent (BUILT)
- AC1: the human sees four groups in plain words, Core recommended, MCP servers offered one by one, and is told that some services charge for use.
- AC2: only items in the picked groups are installed.
- AC3: the house rules (rules + command), claude-mem and meta-ads are each installed only after their own yes to the question in `kit.json`.

## KIT-005 Keys (BUILT)
- AC1: a key is asked for only for a picked server; a server without a key is skipped and listed under "needs a key".
- AC2: no key appears in the kit folder (`git -C ~/claude-kit status --porcelain --ignored` shows no new files, and a search of the folder for the key-shaped patterns in KIT-010 AC1 finds nothing), in `claude-kit-record.json`, in the report, or in verification output.
- AC3: by default the human types the key into their own terminal through the `keyEntry.selfRun` line; the key reaches the chat only if the human chooses the paste fallback after hearing where it then goes.

## KIT-006 Prerequisites (BUILT)
- AC1: a missing claude, git or node (or node older than 22.20) stops the run with the install help for the detected OS and the restart instruction (`prerequisiteStop`).
- AC2: Bun is required only when claude-mem is picked; uv only when meta-ads is picked.
- AC3: on Node older than 24 the human is told that Node 24 LTS is recommended, and the run continues.

## KIT-007 Idempotent update (BUILT)
- AC1: a second run finishes with no duplicate marketplaces, plugins, MCP entries or rule blocks.
- AC2: after Aaron raises the aaron-kit version and pushes, a re-run leaves the friend on the new version (`claude plugin list --json`).

## KIT-008 Report and restart (BUILT)
- AC1: the run ends with installed / already there / skipped / needs a key / failed lists, the "keep the claude-kit folder" line when aaron-kit is installed, and the restart instruction.
- AC2: `<USER_CLAUDE_DIR>/claude-kit-record.json` exists after the run and lists the ids it installed and the ids it found already there.

## KIT-009 Windows nano-banana-pro (BUILT)
- AC1: on Windows, after the three launcher steps (copy, `npm ci --prefix`, add), `claude mcp list` shows nano-banana-pro as Connected.

## KIT-010 No secrets or personal/company items in the repo (DONE)
- AC1: a regex search of the repo for key-shaped strings (`sk-`, `AIza`, `ghp_`, `pit-`, `EAA` or `Bearer ` followed by 16 or more key characters) finds nothing.
- AC2: no absolute path into a user's home folder appears in the repo (regex `(C:[/\\]Users[/\\]|/Users/|/home/)[A-Za-z]` finds nothing).
- AC3: the names of Aaron's companies and partners (the maintainer searches for each, case-insensitively) appear nowhere in the repo except inside the excluded item names `ux-checkmait` and `liquid-sunset`, and those names appear only where excluded items are listed (`kit.json` → `notIncluded`, the README "Not included" table and the maintainer files); never in a file SETUP installs (`files/`, `plugins/`, `tools/`).
- AC4: no file of a `notIncluded` item exists in the repo.

## KIT-011 Verbatim copies (DONE)
- AC1: `files/commands/antivibe-docs.md` and every file under `plugins/aaron-kit/skills/` (four skills; `client-website-build` has a `reference/` folder) have the same sha256 as their originals in Aaron's user Claude folder at the time of copying. `files/CLAUDE.md` has the same sha256 as the original with its "Design from real product UIs" section cut (from the blank lines before that heading to the next level-2 heading or the end of the file), ending in one newline: that section names a company item (Aaron, 2026-10-06). Check: `node -e "const f=require('fs'),h=s=>require('crypto').createHash('sha256').update(s).digest('hex');const o=f.readFileSync(process.argv[1],'utf8').replace(/\n+## Design from real product UIs[^\n]*\n[\s\S]*?(?=\n## |$)/,'').replace(/\n*$/,'\n');console.log(h(o)===h(f.readFileSync('files/CLAUDE.md','utf8'))?'match':'differs')" ~/.claude/CLAUDE.md`
- AC2: `claude plugin validate .` and `claude plugin validate ./plugins/aaron-kit --strict` pass.

## KIT-012 Repo access (BUILT: the repo is public, Aaron's decision 2026-09-27; created and pushed 2026-09-27)
- AC1: an anonymous `git clone https://github.com/AaronReginaldOsborne/claude-kit` succeeds: no GitHub account and no stored credentials (for example `GIT_TERMINAL_PROMPT=0 git -c credential.helper= clone https://github.com/AaronReginaldOsborne/claude-kit`), and a later `git pull --ff-only` in that clone succeeds the same way.
- AC2: if git is missing, the friend's Claude stops and says to install it from https://git-scm.com/downloads; if the clone fails (or, on a re-run, the pull), it stops and shows the error in plain words.

## KIT-013 Undo (BUILT)
- AC1: every item in `kit.json` has an `uninstall` command at user scope.
- AC2: after the Undo paste, every id in `installedByKit` that the human chose is gone (plugin list, marketplace list, skills `ls -g`, GSD `VERSION` absent, `claude mcp list`, `rules-status` reports `absent` or `missing`), and every id in `foundAlreadyThere` is still present.
- AC3: Undo removes only the kit's marked rules block; a file whose rules are `unmarked` is left untouched.
- AC4: a recorded shell change (`npm-prefix`, `gsd-sdk-path`) is still in place after Undo unless the human said yes to reverting it; after a yes, `npm config delete prefix --location user` has run, `npm config get prefix` no longer prints `~/.npm-global` (expanded) and the kit's PATH line is gone from the shell profile.
- AC5: after GSD's uninstall the human is told the `gsd-sdk` command is still there (GSD 1.42.3's uninstall never removes it); it is deleted only after their yes, only when the record lists `gsd` as installed by the kit and the command points into `get-shit-done-cc` (`kit.json` → `gsd.uninstallNote`).

## KIT-014 Existing local-scope MCP server (BUILT)
- AC1: when a picked server already exists at local scope, the human is told it works in one folder only and offered the user-scope entry; after a yes, `claude mcp get <name>` shows `Scope: User config`.

## KIT-015 GSD and its gsd-sdk command (BUILT)
- AC1: after a run with Developer extras, `<USER_CLAUDE_DIR>/get-shit-done/VERSION` reads `1.42.3`, `<USER_CLAUDE_DIR>/agents` holds 33 `gsd-*.md` files, and no `--profile` was passed (default full profile).
- AC2: `command -v gsd-sdk` (bash, zsh, Git Bash) or `Get-Command gsd-sdk` (PowerShell) finds it, in a new terminal if needed; otherwise the report says "GSD installed, gsd-sdk not on PATH" and shows the installer's printed lines, and the shell profile or user PATH is changed only after the human's yes, which the record lists as `gsd-sdk-path`.
