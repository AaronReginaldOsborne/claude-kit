# Data model

**The kit itself stores and collects nothing.** It has no database, no server, no account, no telemetry and no logs. It is a folder of configuration (`kit.json`), files to copy and one small file helper. Everything an install produces lives on the friend's own machine, written there by Claude Code, the skills CLI, npm, uv, the GSD installer and the kit's helper.

The tools it runs are another matter, and the friend is told: the skills CLI 1.7.0 sends an install event (CLI version, agent, source and skill names) to add-skill.vercel.sh and fetches audit data from the same host, unless `DO_NOT_TRACK=1` or `DISABLE_TELEMETRY=1` is set (read in its `dist/cli.mjs`); claude-mem, when picked, records every session into `~/.claude-mem` and runs background Claude sessions to summarise them.

## kit.json (top-level keys)
| Key | Shape | Notes |
|---|---|---|
| `$comment` | string | how to read the file, and which OS the checks ran on |
| `kit` | name, version, description, repo, repoStatus, access, cloneTo, keepFolder | `repo` is a public GitHub repo (Aaron's decision, 2026-09-27; published 2026-09-27); `access` says anyone can clone it over HTTPS, no account needed |
| `scopeRule` | summary, userClaudeDir, workingDirectory, noScopeOption, flags, expectedUserLevelWrites, mustNotAppearInWorkingDirectory, sessionFolderClaudeDir {applies, why, snapshot, flag} | drives the global-only rule and the final check (every watched `.claude/` that is not `USER_CLAUDE_DIR`: the session folder's when it is not the home folder, the home folder's when `CLAUDE_CONFIG_DIR` points elsewhere); `noScopeOption` names the two commands with no scope option |
| `prerequisites[]` | id, check[], need, installHelp {all or macos/linux/windows}, requiredFor, onlyIf? | `check` is a list of separate commands; `onlyIf` = conditional on a picked item |
| `prerequisiteStop` | string | the restart instruction when a tool is missing |
| `groups[]` | id, name, recommended, plainWords, items[], pickEach?, askSeparately[]? | item ids are prefixed `file:`, `plugin:`, `skills:`, `cli:`, `mcp:`, or are `gsd`; `askSeparately` = {items[], question} |
| `fileHelper` | path, why, commands (rulesStatus, rulesAdd, rulesUpdate, rulesRemove, same, snapshot, compare, keys), output, verified | `tools/kit-files.mjs` |
| `files[]` | id, source, target, mode, presentMarker?, blockMarkers?, behaviour, uninstall | modes: `kit-block`, `copy-ask-if-different` |
| `marketplaces[]` | name, add, uninstall, note?, recovery?, verified | HTTPS `.git` URLs; `aaron-kit` uses `<KIT_DIR_ABSOLUTE>` |
| `marketplaceNotes[]`, `pluginNotes[]`, `mcpNotes[]` | strings | verified behaviour notes per area |
| `plugins[]` | id, install, uninstall, marketplace, brings?, requires?, note? | every command ends in `--scope user` |
| `skillsCli` | package, addPattern, removePattern, flags, listGlobal, update, overwriteWarning, editCheck, telemetry, verified | pinned `skills@1.7.0` |
| `skills[]` | id, source, names[], install, uninstall, note? | install = `add <source> -g -a claude-code -s <names> --copy -y` |
| `gsd` | id, name, install, uninstall, uninstallNote, update, brings, profile, cost, deprecated, verify[], sdkPath, verified, open[] | pinned `get-shit-done-cc@1.42.3`, default full profile; `sdkPath` = what to do when `gsd-sdk` is not on PATH; `uninstallNote` = the `gsd-sdk` link the uninstall leaves |
| `cliTools[]` | id, install[], check, uninstall[], uninstallNote, note, ifEacces, ifEaccesWrites, ifEaccesUndo | agent-browser |
| `keyEntry` | default, selfRun {why, build, bash, powershell, whichOne, humanSteps, powershellShim, verified}, pasteInChat {fallback, tellFirst, then}, never | how a key reaches `claude mcp add` |
| `mcpServers[]` | id, name, what, key (null, or placeholder/as/getItFrom), requires?, add (`all` or per-OS), uninstall, note?, verified | packages pinned to exact versions; per-OS form only for nano-banana-pro |
| `record` | path, shape, rules | the install record on the friend's machine |
| `undo` | order, scope, commands, shellChanges, gsdSdkLink, keeps, notRestored | used by SETUP's Undo |
| `verification` | per-area check descriptions | used by SETUP Step 5 |
| `open[]`, `notIncluded[]` | strings / {item, reason} | mirrored in README |

## The install record (on the friend's machine)
`<USER_CLAUDE_DIR>/claude-kit-record.json`, written by the friend's Claude at the end of every run: `kitVersion`, `lastRun`, `installedByKit[]` (item ids, `marketplace:<name>`, and `npm-prefix` / `gsd-sdk-path` for shell changes the human said yes to), `foundAlreadyThere[]`. Ids and dates only; never a key or file contents. Undo reads it to remove only what the kit installed.

## The rules block (on the friend's machine)
In `<USER_CLAUDE_DIR>/CLAUDE.md`, the rules sit between `<!-- claude-kit rules: start (added by claude-kit; to change it, re-run the kit) -->` and `<!-- claude-kit rules: end -->`. Text outside the markers is the friend's own and is never rewritten.

## The working-folder snapshot (on the friend's machine, during a run)
`<USER_CLAUDE_DIR>/claude-kit-snapshot.json`, written by `fileHelper snapshot` in Step 1b (after the prerequisite check, before any backup or install) and deleted after `fileHelper compare` in Step 5: `kitSnapshot` (format 1), `takenAt`, `userClaudeDir`, and per watched folder `folder`, `isHome`, `watchTree` (true when its `.claude/` is not `USER_CLAUDE_DIR`, so every path under it is recorded), `entries` (relative path -> type, modified time in ms and size; folders by type only), `settings` (settings file -> top-level key -> the first 16 hex characters of the sha256 of that key's JSON value, so a changed key can be named) and `marketplaces` (settings file -> the key names under its `extraKnownMarketplaces`, or null). No file contents and no settings values; the helper refuses to write it inside a watched path.

## Constraints
- Placeholders are `<UPPER_SNAKE>` in angle brackets and are never replaced inside the repo.
- Every install command carries its explicit scope flag, and every item has an uninstall command at the same scope.
- Current counts: 4 groups, 6 marketplaces, 8 plugins, 7 skills sources (23 skills), 7 MCP servers, 2 separate yes/no questions (the house rules with their command; claude-mem), with the MCP servers, meta-ads included, offered one by one.

## Sensitive data
- **Keys stay on the friend's machine.** The four key-based servers (stitch, 21st, meta-ads, nano-banana-pro) take the friend's own key at install time. By default the friend types it into their own terminal through the `keyEntry.selfRun` line, which reads it without echo and passes it to `claude mcp add` as a shell variable, so it does not reach the chat, the session history or shell history. Claude Code stores it in the friend's user-level `.claude.json` (inside `CLAUDE_CONFIG_DIR` when that is set; in a sandbox run with it set, Claude Code also wrote its own backup copy of `.claude.json` to `backups/` in that folder). If the friend chooses to paste the key into the chat instead, they are told first that it then reaches Anthropic, the local session history and memory tools.
- The kit folder, the install record and every file SETUP writes never receive a key; SETUP never repeats one back, and verification shows only the Scope and Status lines of `claude mcp get`, which otherwise prints key values.
- SETUP's backup of `.claude.json` is made with the shell next to the original and is never opened or printed.
- `.gitignore` blocks `.env`, `.env.*`, `*.key`, `*token*.txt`, `*.bak-*`, `.claude.json`, `.npmrc`, `*.pem`, `id_rsa*`, `*credentials*.json`, `service-account*.json`, `secrets*.json` and `.claude/settings.local.json`, as a second line of defence (which is why KIT-005 checks with `git status --ignored`).
- What of Aaron's is in the repo, which is public (published 2026-09-27), so all of it is world-readable: his name as author in the two plugin manifests and his GitHub username in the repo URL; commits carry his name and his GitHub noreply address. His companies are not named in prose; only the excluded item names `ux-checkmait` and `liquid-sunset` appear, in the `notIncluded` lists and the maintainer docs (`CLAUDE.md`, `docs/`). No credentials, local paths, history or memory (checked with a search on 2026-09-27).
