# User flows

Status: **BUILT** means the flow is written (README, SETUP.md, `kit.json`) and each command in it was verified on its own in a sandbox home on Windows (the exceptions are under `open` in `kit.json`); no flow has yet been run end to end on a friend's clean machine, and nothing has run on macOS (BUILD_PLAN S9). **PLANNED** means it waits on an OPEN item or on a step Aaron has not taken yet.

## F1 First install (BUILT) — KIT-001 to KIT-006, KIT-008, KIT-014, KIT-015
1. The friend opens a terminal (Terminal on a Mac, PowerShell on Windows), goes to their home folder, starts Claude Code and pastes the README prompt. Git comes first: if it is missing, the prompt stops and says what to install. The repo is public (F5), so the clone needs no sign-in; if the clone fails, the prompt stops and shows the error in plain words.
2. Claude clones the kit to `~/claude-kit`, reads SETUP.md, detects the OS and checks prerequisites. If one is missing it gives the install help for that OS and tells the friend to restart the terminal and Claude Code before pasting again. Once they pass, it snapshots the working folders (Step 1b), before any backup or install.
3. Claude explains the four groups in plain words, says everything installs for the whole computer and that some services cost money; the friend picks (Core recommended). The house rules for coding, claude-mem and meta-ads each get their own yes/no; MCP servers are offered one by one.
4. Claude backs up `CLAUDE.md` and `settings.json` (and `.claude.json` if MCP servers were picked).
5. Claude installs files (the rules as a marked block, through the helper), marketplaces, plugins, skills, GSD, CLI tools and MCP servers, every command with its scope flag. For a key, it shows a line the friend runs in their own terminal; an existing local-scope server is offered a user-scope replacement.
6. Claude verifies every item is at user scope (marketplaces also by key names in the user settings files) and that `gsd-sdk` runs (a PATH change only on a yes), checks the working folders against the Step 1b snapshot (every `.claude/` that is not the user Claude folder: the session folder's when it is not the home folder, the home folder's when `CLAUDE_CONFIG_DIR` points elsewhere), writes the install record, reports installed / already there / skipped / needs a key / failed, reminds the friend to keep the `claude-kit` folder, and asks for a restart.

## F2 Update (BUILT) — KIT-007, KIT-002 AC3, KIT-003 AC3
The friend pastes the same prompt. Claude pulls the kit, updates marketplaces and plugins, asks before updating the rules block if Aaron changed the rules, asks before refreshing a skill the friend edited, re-runs the skills adds and GSD, leaves existing user-scope MCP servers alone, adds newly picked items, offers to prune old backups, reports and asks for a restart. An `aaron-kit` change only arrives if Aaron raised its version.

## F3 Add a key later (BUILT) — KIT-005
The friend re-runs the prompt and picks the server they skipped; Claude shows the key line for their terminal and adds the server at user scope. The same route replaces an expired meta-ads token (remove, then add).

## F4 Aaron adds an item (BUILT)
Aaron edits `kit.json` (install and uninstall commands, exact pins for anything with a key; for one of his own skills, also `plugins/aaron-kit/` plus a version bump), verifies the command in a sandbox home, updates the docs, pushes; the friend re-runs the prompt. Written in README "Adding an item" and the root CLAUDE.md.

## F5 Friend gets the repo (BUILT) — KIT-012
The repo is public (Aaron's decision, 2026-09-27; created and pushed 2026-09-27). The paste prompt clones it over HTTPS with no GitHub account, invite or sign-in, and a re-run's `git pull` needs none either. If the clone fails, the prompt stops and shows the error in plain words; SETUP does the same for a failed pull.

## F6 Undo (BUILT) — KIT-013
The friend pastes the README's Undo prompt. Claude backs up, reads the install record, asks which groups to remove, uninstalls only what the kit installed (MCP servers, CLI, GSD, skills, plugins, the marketplaces it added, the rules block and the command), keeps backups, data folders, the `gsd-sdk` command GSD's uninstall leaves behind, and any recorded shell change (`npm-prefix`, `gsd-sdk-path`) unless told otherwise, updates the record and asks for a restart.

## F7 Kit folder moved or deleted (BUILT)
If `~/claude-kit` is moved or deleted, aaron-kit shows "failed to load: cache-miss". Re-running the paste prompt clones it back; or the recovery commands in `kit.json` re-register it from its new place.
