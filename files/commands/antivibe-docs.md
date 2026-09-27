---
description: Scaffold or refresh this project's anti-vibe-coding docs framework (CLAUDE.md + /docs)
---

Create or refresh this project's **anti-vibe-coding documentation framework**: a root `CLAUDE.md` plus the `/docs` set (`PRD.md`, `MVP_SCOPE.md`, `USER_FLOWS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `BUILD_PLAN.md`, `FEATURE_TICKETS.md`, `DECISIONS.md`).

Follow this order:

1. **Inspect reality first.** Read the repo to ground every claim: package/dependency manifests, the source tree, migrations/schema, any existing docs or specs, and recent git history. Do not assert anything you have not verified.
2. **Create or update.** If the framework already exists, audit it for drift and update it. If it is missing, synthesize it from the actual codebase plus any specs/decisions you found.
3. **Apply the discipline:**
   - **Verify before asserting** — mark undecided facts as **OPEN**, never invent file paths, libraries, licenses, APIs, tables, or versions.
   - **Synthesize, do not paste** — no generic templates; document only what the code/specs support.
   - Record every decision in `DECISIONS.md`, dated and ADR-style (decision, rationale, source).
4. **Audit before finishing.** Re-read the whole set for internal contradictions, factual accuracy against the code, and coverage. Fix what is off.

`$ARGUMENTS` may narrow the scope — e.g. a single doc to (re)generate, or `audit only` to report drift without writing.

For a large or multi-source project, prefer running this as a **verify → draft → audit → fix** multi-agent workflow (one writer per doc, adversarial reviewers for consistency / factual-accuracy / coverage) when orchestration is available; otherwise do the same passes inline.
