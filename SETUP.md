# Claude Kit setup

> **For the human:** you do not need to read past this box. Paste the prompt from README.md into Claude Code, opened in your home folder, and answer its questions.
> Claude will show you the plan, let you pick what to install, ask for your own keys only for the tools you pick, and copy your Claude settings files (CLAUDE.md, settings.json, and .claude.json when you add connections) before changing them. It will ask before each command it runs; answer Yes.
> Everything installs for your whole computer (every project), and you restart Claude Code at the end. The "Undo" section at the bottom removes what the kit added.

---

## Instructions for Claude

You are installing this kit on the human's machine. `kit.json`, in the same folder as this file, is the source of truth: take every command, name, path and flag from it. This file tells you the order and the rules. Do every step. Where a step says ask, ask and wait.

### The rules (read before doing anything)

1. **Global only.** Everything installs at USER (global) scope so it applies in every project on this machine. Never install at project or local scope. Rules go into the user Claude folder's `CLAUDE.md`, never a project `CLAUDE.md`. The command goes into the user Claude folder's `commands/`. Plugins use `--scope user`, skills use the skills CLI's `-g`, GSD uses `--global`, MCP servers use `--scope user`.
2. **Pass the scope flag on every command, every time**, exactly as written in `kit.json`, even where it looks like the default. (`claude mcp add` defaults to *local* scope; the explicit flag is what makes it global.) Two commands have no scope option at all, so run them as written: `claude plugin marketplace update` (it refreshes marketplaces already declared) and `agent-browser install` (it writes only to `~/.agent-browser/`); see `kit.json` → `scopeRule.noScopeOption`.
3. **Work from the home folder, not inside a project.** Run every command with the home folder as the working directory, so nothing lands in a project's `.claude/`. If your session's working directory is not the home folder, prefix every command with `cd ~ &&` (bash/zsh) or `Set-Location $HOME;` (PowerShell).
4. **Never overwrite the human's files.** Back up first (Step 3). Append rather than replace. When a file or skill folder already exists and differs, ask before replacing it.
5. **Keys belong to the human.** Ask for a key only for a server they picked, and use `kit.json` → `keyEntry` (the human runs a line in their own terminal by default). Never write a key into any file, script, note or record, the kit folder included. Never repeat it back in chat or print it in a summary. Skip any server they have no key for and list it at the end.
6. **Do not improvise.** Use only the commands in `kit.json`. Translating shell syntax into the current shell is expected and is not improvising: run the steps of a list one after another, and turn `&&` or `||` into the current shell's form (Windows PowerShell 5.1 has neither). If a prerequisite is missing, tell the human how to install it and stop (Step 1). If one item's command fails, show the error, mark that item failed, and continue with the next item. Do not invent a workaround; the only fixes allowed are the ones in "If something goes wrong".
7. **Give long commands time.** Run install commands with a 10-minute timeout (marketplace clones, first-time `npx` downloads, GSD, `agent-browser install` and `claude mcp list`, which health-checks every server, can pass the default 2 minutes). If one times out, check its state (`claude plugin marketplace list --json`, `claude plugin list --json`, `npx -y skills@1.7.0 ls -g --json`) before retrying once.
8. **Safe to re-run.** Every step checks what is already there first. A second run updates instead of duplicating (see "Re-running" at the end).

### Step 0: Find your bearings

1. Detect the OS: macOS, Linux, or Windows. On Windows, note whether your shell is Git Bash or PowerShell and use that shell's syntax throughout. In PowerShell, run `Get-Command claude`: if it shows a `.ps1` file rather than `claude.exe`, use `claude.cmd` wherever a command says `claude` (see `keyEntry.selfRun.powershellShim`).
2. Set these values for the rest of the run (resolve them to absolute paths; do not rely on `~` inside command arguments on Windows):
   - `HOME_DIR`: the human's home folder.
   - `USER_CLAUDE_DIR`: the value of the `CLAUDE_CONFIG_DIR` environment variable if it is set, otherwise `HOME_DIR/.claude`.
   - `KIT_DIR`: the folder that holds this `SETUP.md` (normally `HOME_DIR/claude-kit`).
   - `SESSION_DIR`: your session's working directory (it may be the home folder itself).
3. If `USER_CLAUDE_DIR/claude-kit-record.json` exists, read it: it says what an earlier run installed (`kit.json` → `record`).

### Step 1: Check prerequisites

Run each `check` in `kit.json` → `prerequisites` (a list is run one command at a time):

- `claude`, `git`, `node` (with `npx`) are always required. `node` must be 22.20 or newer. If it is older than 24, tell the human in one sentence that Node 24 LTS is recommended (agent-browser gets an older version on Node 22), and carry on.
- `bun` is required only if claude-mem will be installed; `uv` only if meta-ads will be added. Check these after the human picks (Step 2).
- `python` never blocks setup. If it is missing and ui-ux-pro-max or document-skills is chosen, mention that some of their features use Python 3.

If a required tool is missing or too old: tell the human in one plain sentence what is missing, give the `installHelp` line for their OS, then say `kit.json` → `prerequisiteStop` in plain words (install it, quit Claude Code, close the terminal window, open a new one, go to the home folder, start `claude`, paste the prompt again), and stop.

### Step 1b: Snapshot the working folders

Only once `claude`, `git` and `node` have passed Step 1 (the helper needs Node), and before any backup or install: run `kit.json` → `fileHelper.commands.snapshot` with `HOME_DIR`, `SESSION_DIR` and `USER_CLAUDE_DIR` (pass `SESSION_DIR` even when it is the home folder). It writes `USER_CLAUDE_DIR/claude-kit-snapshot.json`. It watches the home folder by the list in `scopeRule.mustNotAppearInWorkingDirectory` and, when `SESSION_DIR` is not the home folder, that folder by the same list; in each, unless its `.claude/` is `USER_CLAUDE_DIR`, it also records every path under that `.claude/` with its modified time, the key names of its `.claude/settings.json` and `.claude/settings.local.json`, and the marketplace names under their `extraKnownMarketplaces` (`scopeRule.sessionFolderClaudeDir`). So when `CLAUDE_CONFIG_DIR` points somewhere other than `HOME_DIR/.claude`, the home folder's `.claude/` is watched like a project's. It stores key names only, never values; do not open those files yourself. You compare against it in Step 5.

### Step 2: Show the plan and let the human pick

Tell the human, in plain words (use each group's `plainWords` from `kit.json`), what the four groups are:

1. **Core** (recommended)
2. **Developer extras**
3. **Marketing and content**
4. **Extra connections (some need your own key)**: the MCP servers. Offer each one separately; say which need no key (context7, playwright, shadcn) and which need their own key (stitch, 21st, meta-ads, nano-banana-pro).

Also say, in one sentence each: everything installs for the whole computer, not just one project; and some of these services charge for use (the groups' `plainWords` say which). Recommend Core if they are unsure. Wait for their choice.

Then, for each picked group, ask its `askSeparately` questions word for word and wait for a yes or no to each: the house rules for coding (`file:rules` and `file:antivibe-docs`) inside Core, and claude-mem inside Developer extras. An item they say no to is skipped ("their choice"). For meta-ads, read its `what` line to them before they decide.

Then run the `onlyIf` prerequisite checks for what they picked (bun for claude-mem, uv for meta-ads). If one is missing, give its link and either stop (with `prerequisiteStop`), or, if the human prefers, drop that one item and carry on.

### Step 3: Back up before changing anything

Make timestamped copies next to the originals, using a stamp like `20260927-141500`. Only copy files that exist; never move or delete anything. Copy with the shell (`cp` on macOS, Linux and Git Bash; `Copy-Item` in PowerShell), so the contents never pass through the chat.

- `USER_CLAUDE_DIR/CLAUDE.md` → `USER_CLAUDE_DIR/CLAUDE.md.bak-<stamp>`
- `USER_CLAUDE_DIR/settings.json` → `USER_CLAUDE_DIR/settings.json.bak-<stamp>` (plugins and GSD change this file)
- If any MCP server was picked: the user-level `.claude.json` (`HOME_DIR/.claude.json`, or `CLAUDE_CONFIG_DIR/.claude.json` when that is set) → the same name plus `.bak-<stamp>`. Do not open or print its contents: it holds credentials.

Tell the human where the backups are. These copies are a safety net, not the undo path: see "Undo".

### Step 4: Install, in this order

Install only the items in the groups the human picked (`kit.json` → `groups[].items`), minus any `askSeparately` item they declined. Keep a running list of each item's result: installed, already there, updated, skipped (and why), failed (and the error), needs a key. Note for each whether the kit installed it now or found it already there; Step 6 records this.

**4a. Files (Core)** — use the kit's file helper (`kit.json` → `fileHelper`), which works the same in every shell and never passes the file through the chat. Follow `kit.json` → `files`:

- `file:rules` → run `fileHelper.commands.rulesStatus` and act on the `state` it prints, exactly as `files[file:rules].behaviour` says: `missing` or `absent` → `rulesAdd`; `current` or `unmarked` → already there; `outdated` → ask, `rulesUpdate` only on yes; `broken` → failed, tell the human; `unsupported-encoding` → skipped, tell the human the file is not UTF-8. Do not open and rewrite the file with your own tools.
- `file:antivibe-docs` → compare with `fileHelper.commands.same` (kit copy, then target). `missing`: create `USER_CLAUDE_DIR/commands/` if needed and copy the file with the shell. `same`: skip. `different`: tell the human in one sentence and ask; replace only on yes, after backing the old file up as `antivibe-docs.md.bak-<stamp>`.

**4b. Plugin marketplaces** — run `claude plugin marketplace list --json` once. For each marketplace a chosen plugin needs (`kit.json` → `plugins[].marketplace`):

- Already listed by that name: run `claude plugin marketplace update <name>`. Then check that it is declared at user scope with `fileHelper.commands.keys` (key names only): it must be a key of `extraKnownMarketplaces` in `USER_CLAUDE_DIR/settings.json` or a key of `USER_CLAUDE_DIR/plugins/known_marketplaces.json`. If it is neither (it is known only from a project or local setting), also run its `add` command, which carries `--scope user`.
- Not listed: run its `add` command from `kit.json` → `marketplaces`. For `aaron-kit`, replace `<KIT_DIR_ABSOLUTE>` with the absolute path of `KIT_DIR`. Always use the HTTPS `.git` URLs as written (the `owner/repo` shorthand clones over SSH and fails without GitHub SSH keys).

**4c. Plugins** — for each chosen plugin, run its `install` command from `kit.json` → `plugins` exactly (it ends in `--scope user`). "Already installed (scope: user)" counts as already there. On a re-run, follow it with `claude plugin update <plugin>@<marketplace> --scope user`.

**4d. Skills (skills CLI)** — for each chosen `skills:` item in `kit.json` → `skills`:

1. First run `npx -y skills@1.7.0 ls -g --json` once and keep the result.
2. For every name in the item, check whether `USER_CLAUDE_DIR/skills/<name>` already exists. The add command overwrites an existing folder without asking. If a folder exists and the `ls -g --json` result does not show that name with the same `source`, it is the human's own skill: ask before continuing, and on no, drop that name from the command.
3. If the folder exists and does come from the same source (a re-run), apply `kit.json` → `skillsCli.editCheck`: if the human changed the skill since it was installed, ask before re-adding, and on no, drop that name.
4. Run the item's `install` command as written (`-g -a claude-code -s <names> --copy -y`), minus any dropped names.
5. The skills CLI also writes `HOME_DIR/.agents/.skill-lock.json`. That is its user-level record and is expected. It must not add skill folders to `HOME_DIR/.agents/skills` or create anything in the working directory.

**4e. GSD (Developer extras)** — run `kit.json` → `gsd.install` exactly: `npx -y get-shit-done-cc@1.42.3 --claude --global`. Never add `--force-statusline` or a `--profile`: the kit installs the default full profile on purpose (`gsd.profile`). It installs into `USER_CLAUDE_DIR` and puts a `gsd-sdk` command in a user-level folder (where: `kit.json` → `scopeRule.expectedUserLevelWrites`). Keep its output: if it prints "gsd-sdk is not on your PATH", Step 5 shows those lines to the human. Do not run any PATH-change line it prints now; Step 5 and `gsd.sdkPath` say when. Tell the human that npm marks this package as deprecated and that GSD now lives on as GSD Core (`gsd.deprecated`); install 1.42.3 anyway, since that is what the kit pins.

**4f. CLI tools** — if `skills:agent-browser` was chosen, also run `cli:agent-browser`'s `install` steps, one after the other. Tell the human first that the second step downloads a copy of Chrome for it. Then run its `check` and report the version it prints. If `npm install -g` fails with `EACCES` (macOS or Linux), follow `ifEacces`: explain, including that it changes `~/.npmrc` and their shell profile (`ifEaccesWrites`), and change them only on the human's yes (Step 6 then records `npm-prefix`); otherwise mark it skipped.

**4g. MCP servers (Extra connections)** — run `claude mcp list` once. For each server the human picked, from `kit.json` → `mcpServers`:

1. **Already listed by that name:** run `claude mcp get <name>` showing ONLY its `Scope` and `Status` lines (bash: `claude mcp get <name> | grep -E "Scope|Status"`; PowerShell: `claude mcp get <name> | Select-String "Scope|Status"`).
   - `Scope: User config`: already there; skip. Do not change it unless the human asks. To replace a key they must remove it first (`claude mcp remove <name> --scope user`), then add it again.
   - Any other scope (`Local config` or `Project config`): tell the human in one sentence that their existing entry only works in one folder, and offer to add the kit's user-scope entry. On yes: add it (step 2 or 3 below), then, because a same-name local entry still wins over the user one (`kit.json` → `mcpNotes`), remove the local entry with `claude mcp remove <name> --scope local`. A project entry lives in that project's `.mcp.json`; leave it alone and say so. On no: report it under Skipped as "kept at the human's choice".
2. **No key needed** (context7, playwright, shadcn): run the `add` command.
3. **Key needed:** tell the human which key it is and where they get it (`key.getItFrom`). Then follow `kit.json` → `keyEntry`:
   - By default, build the one line from `keyEntry.selfRun` (bash line on macOS and Linux, PowerShell line on Windows), show it, and give the `humanSteps` in plain words. When they say done, check the server with the filtered `claude mcp get`.
   - If they would rather paste the key into this chat, first say `keyEntry.pasteInChat.tellFirst` in plain words. Only if they still want to, follow `pasteInChat.then`.
   - If they have no key, skip the server and add it to the "needs a key" list.
4. Use the command for the detected OS. `nano-banana-pro` on Windows has three steps (copy the launcher folder, `npm ci --prefix` into it, add with `node <path>/launcher.mjs`); on macOS and Linux it is one `npx` command.

### Step 5: Verify every item is installed and global

Use `kit.json` → `verification`:

- **Plugins:** `claude plugin list --json`. Every chosen plugin is present with `"scope": "user"` and `"enabled": true`.
- **Marketplaces:** `claude plugin marketplace list --json` lists every marketplace used. That list does not show a scope, so also run `fileHelper.commands.keys` (it prints key names only): each kit marketplace must be a key of `extraKnownMarketplaces` in `USER_CLAUDE_DIR/settings.json` or a key of `USER_CLAUDE_DIR/plugins/known_marketplaces.json` (check both; either is enough). Then the negative check (`kit.json` → `verification.marketplaces`), on each settings file the snapshot watched: `.claude/settings.local.json` in `HOME_DIR` and in `SESSION_DIR`, and their `.claude/settings.json` unless that `.claude/` is `USER_CLAUDE_DIR` (so `HOME_DIR/.claude/settings.json` too when `CLAUDE_CONFIG_DIR` points elsewhere). A kit marketplace in one of those files is a problem only when `fileHelper.commands.compare` lists it under that file's `marketplacesAdded` (new since the snapshot): it was added at project or local scope; tell the human which file, and do not remove it without asking. One that `keys` finds there but `compare` does not list as added was there before the run: report it as "found in your project settings, left alone".
- **MCP servers:** `claude mcp list` shows each added server. Then, for each one, show ONLY its `Scope` and `Status` lines as in 4g, because the full output prints key values. Scope must read `User config (available in all your projects)`, unless the human chose to keep a local entry.
- **Skills:** each chosen name is a folder with a `SKILL.md` inside `USER_CLAUDE_DIR/skills`, and `npx -y skills@1.7.0 ls -g --json` shows it with `"scope": "global"`. If a skill landed anywhere else, say so plainly.
- **Files:** `fileHelper.commands.rulesStatus` prints `current` (or `unmarked`) with `"headingCount":1`; `fileHelper.commands.same` on the command prints `same` (or the human kept their own).
- **GSD:** `USER_CLAUDE_DIR/get-shit-done/VERSION` reads `1.42.3` and `USER_CLAUDE_DIR/agents` holds 33 `gsd-*.md` files. Then check that `gsd-sdk` runs: `command -v gsd-sdk` (bash, zsh, Git Bash) or `Get-Command gsd-sdk` (PowerShell). If it is not found, ask the human to run the same line in a new terminal window. If it is still not found, report "GSD installed, gsd-sdk not on PATH", show the human the lines the installer printed after "gsd-sdk is not on your PATH", and follow `kit.json` → `gsd.sdkPath`: change their shell profile (or, on Windows, their user PATH) only on their yes, then ask them to open a new terminal and check again (Step 6 records `gsd-sdk-path`). On no, say that GSD commands which call `gsd-sdk` will fail until it is on PATH.
- **CLI:** `agent-browser --version` prints a version.
- **Nothing in the working folders:** run `fileHelper.commands.compare`. It must print `"result":"clean"`. When it prints `flagged`, each entry names a folder, a path and the change (added, removed or changed, plus the names of any settings keys added, removed or changed): tell the human exactly which files, and do not delete or revert anything without asking. What it watches (`scopeRule.mustNotAppearInWorkingDirectory` and `sessionFolderClaudeDir`): `.mcp.json`, `skills-lock.json`, `.agents/skills/`, a `CLAUDE.md` in the folder itself and `.claude/settings.local.json` in both folders, and every path under a `.claude/` that is not `USER_CLAUDE_DIR`: the session folder's when it is not the home folder, and the home folder's when `CLAUDE_CONFIG_DIR` points elsewhere (a project-scope plugin or marketplace writes its `settings.json`; a GSD run without `--global` writes a whole `.claude/`). A `settings.local.json` change only under `permissions` is the human's "Yes, and don't ask again" approvals, and a new folder whose files were all compared and none flagged (for example a new `.claude/` holding only such a `settings.local.json`) is not a finding: `compare` lists both under `ignored`; do not report them as a problem. When `USER_CLAUDE_DIR` is `HOME_DIR/.claude`, that folder is the user Claude folder and is expected to change. After the check, delete `USER_CLAUDE_DIR/claude-kit-snapshot.json` with the shell.

### Step 6: Record, report and restart

First write `USER_CLAUDE_DIR/claude-kit-record.json` with your file tool, as `kit.json` → `record` describes: merge with the existing record, add every id this run installed (items, `marketplace:<name>` for each marketplace it added, and `npm-prefix` or `gsd-sdk-path` when the human said yes to that shell change) to `installedByKit`, and every id it found already there, and did not install before, to `foundAlreadyThere`. Ids and dates only, never a key.

Then give the human a short report in plain words, in these lists:

- **Installed** (and **Updated** on a re-run)
- **Already there**
- **Skipped**, with the reason for each (their choice, missing prerequisite, their own file kept, a local server kept)
- **Needs a key**: each MCP server they skipped for lack of a key, with where to get it, and the reminder that re-running the paste prompt adds it later
- **Failed**, with the error, if any

Then add, where it applies:

- **Keep the `claude-kit` folder in your home folder.** Aaron's skills (the aaron-kit plugin) load from it, and moving or deleting it breaks them. (Always say this when aaron-kit is installed.)
- claude.ai connectors (Gmail, Google Drive, Calendar, Notion and so on) are not part of the kit: they connect their own in claude.ai under Settings > Connectors.
- The Vercel plugin's server asks them to sign in the first time (`/mcp` in Claude Code).
- Higgsfield skills need a Higgsfield account; the skill will ask them to run `higgsfield auth login`.
- meta-ads: its token expires (see `key.getItFrom`); when it stops working, re-run the paste prompt to add a fresh one.
- Where the backups are, and that the "Undo" paste prompt in README.md removes what the kit added.

Finish with: **"Quit Claude Code completely and start it again, so it loads everything."**

### Re-running (updates)

The same paste prompt updates the kit: it pulls the latest kit before you read this file. If that pull failed or did not happen, run `git -C "<KIT_DIR>" pull --ff-only` first and read this file and `kit.json` again; if it fails, show the human its error in plain words and stop, and do not work around it. Then follow every step again:

- Files: `rulesStatus` says `current` (skip), or `outdated` when Aaron changed the rules: tell the human and run `rulesUpdate` only on yes. The command is compared and only replaced on yes.
- Marketplaces: `claude plugin marketplace update` for each, then `claude plugin update <plugin>@<marketplace> --scope user` for each installed kit plugin.
- Skills: re-run the same add commands (they refresh the kit's own skills). The ownership check and `editCheck` in 4d protect the human's own skills and their edits.
- GSD: re-run `npx -y get-shit-done-cc@1.42.3 --claude --global`.
- MCP servers: already-added user-scope servers are left alone; newly picked ones are added; a local-scope one is handled as in 4g.
- Backups: each run adds new `.bak-<stamp>` files. If older kit backups exist in `USER_CLAUDE_DIR`, offer to delete all but the newest of each; delete only on yes.

Report the result the same way and ask for the restart again.

### Undo

When the human asks to undo or uninstall the kit (the README has a paste prompt for it):

1. Do Step 0 (bearings) and Step 3 (backups). Undo takes no snapshot (skip Step 1b).
2. Read `USER_CLAUDE_DIR/claude-kit-record.json`. Tell the human which groups the kit installed and ask which to remove. Remove only ids in `installedByKit`; leave anything in `foundAlreadyThere`. Without a record, go item by item and ask before each removal.
3. Remove in the order `kit.json` → `undo.order`, running each item's `uninstall` field: MCP servers (`claude mcp remove <name> --scope user`), the agent-browser CLI, GSD (`--uninstall`), skills (`skills remove -g -a claude-code -s <names> -y`), plugins (`claude plugin uninstall ... --scope user`), then the marketplaces the kit added (`claude plugin marketplace remove <name> --scope user`), then the files (`fileHelper.commands.rulesRemove`, which removes only the kit's own block; the command file only if `same` says it is the kit's copy). GSD's uninstall leaves the `gsd-sdk` command behind: tell the human, and delete it only on their yes and only as `gsd.uninstallNote` says (`undo.gsdSdkLink`). Last, the shell changes (`npm-prefix`, `gsd-sdk-path`): tell the human they stay, and revert them only on their yes, as `undo.shellChanges` says (`npm config delete prefix --location user`, and remove the PATH line the kit added to their shell profile).
4. Keep what `undo.keeps` lists unless the human says to delete it. Do not restore old `settings.json` or `.claude.json` backups (`undo.notRestored`).
5. Update the record (remove the ids you uninstalled), report what was removed, kept and failed, and ask for a restart. Tell the human they can now delete the `claude-kit` folder if they no longer want it.

### If something goes wrong

- **Cloning or pulling the kit fails:** show the human the error in plain words and stop. The repo is public (`kit.json` → `kit.access`), so it needs no GitHub account or sign-in; do not work around the error.
- **"Filename too long" while adding a marketplace (Windows):** tell the human that Git's long-path support is off, and that they can turn it on with `git config --global core.longpaths true`; run it only if they say yes.
- **PowerShell says running scripts is disabled** when calling `npx` or `npm`: use `npx.cmd` / `npm.cmd` instead.
- **PowerShell drops the `--` in `claude mcp add`** (claude is a `.ps1` file): use `claude.cmd`, or Git Bash.
- **`EACCES` from `npm install -g`** (macOS or Linux): follow `cli:agent-browser.ifEacces`; never use `sudo`.
- **GSD commands fail with "gsd-sdk: command not found"** (for example after npm's npx cache was deleted, `gsd.open`): re-run the paste prompt; if `gsd-sdk` is still missing, Step 5's GSD check and `gsd.sdkPath` apply.
- **A plugin is "not found in marketplace":** run `claude plugin marketplace update <marketplace>` and try the install once more.
- **aaron-kit shows "failed to load: cache-miss"** (the `claude-kit` folder was moved or deleted): clone or move it back to the home folder, or run `marketplaces[aaron-kit].recovery` with the folder's new absolute path.
- **A command timed out:** check its state as rule 7 says before retrying once.
- **Anything else:** show the error, mark the item failed, continue, and include it in the report. Do not work around it.
