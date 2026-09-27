# PRD: claude-kit

## Vision
A friend of Aaron's, who runs a business and already uses Claude Code, gets the same working setup Aaron uses (rules, skills, plugins, workflow tools, optional MCP servers) by pasting one prompt, installed globally so it works in every project on their machine, without Aaron beside them and without receiving any of Aaron's secrets or company material. One more paste removes it again.

## Who it is for
- **The friend:** not part of Aaron's companies; OS unknown (macOS, Windows or Linux); comfortable pasting a prompt and answering questions, not necessarily a developer. Needs git and the Claude Code CLI before pasting; everything else is checked for them.
- **Aaron:** maintains the kit and adds items over time.

## Value
- One paste installs a vetted set of tools at user scope, so every project benefits. Their commands were checked in a sandbox home on Windows (macOS not yet); the few that were not are listed as OPEN.
- Informed consent: each group is explained in plain words, including what costs money, and the items with lasting side effects (the house rules for coding, claude-mem, meta-ads) are asked about on their own.
- Careful with the friend's machine: backups of the Claude settings files first; an existing file, skill folder or MCP entry that differs is replaced only after a yes; keys are typed in the friend's own terminal by default and stay on their machine; every item is verified and reported. Limits the friend is told about: a re-run refreshes the kit's own skills (after asking if they were edited) and adds new backup files.
- Re-running the same prompt updates everything; an Undo prompt removes what the kit added.

## Success looks like
- After one paste, SETUP's Step 5 passes: every picked item is present at user scope and nothing was created in the working folder.
- The report lists installed / already there / skipped / needs a key / failed, and the friend knows to restart and to keep the `claude-kit` folder.
- A second paste changes nothing except updates.
- The Undo paste removes exactly what the kit installed.

## Non-goals
- Syncing Aaron's personal data (history, memory, projects, permissions) or company tools.
- Managing claude.ai connectors (each account connects its own).
- An installer program: the friend's Claude Code follows `SETUP.md` (the one helper, `tools/kit-files.mjs`, only edits the rules block and inspects files: the working-folder snapshot and JSON key names; it installs nothing).
