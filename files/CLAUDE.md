# Global engineering rules (apply in every project)

These are personal, cross-project rules. Project-level `CLAUDE.md` / `AGENTS.md` always take precedence where they conflict.

## Anti-vibe-coding docs framework (required in every repository)

Keep work deliberate, not vibe-coded. In **every** repository where you do development work (creating or modifying code), this project must carry a durable documentation framework — and if it is missing, create it.

### The framework
- **Root `CLAUDE.md`** — honest product context; the **actual, verified** tech stack; coding rules; product/safety rules; a clear Definition of Done.
- **`docs/` set:**
  - `PRD.md` — vision, who it is for, the value/why.
  - `MVP_SCOPE.md` — what is in vs. out for the current milestone.
  - `USER_FLOWS.md` — the key user journeys (mark BUILT vs PLANNED).
  - `DATA_MODEL.md` — schema, columns, constraints, access rules, sensitive-data handling.
  - `ARCHITECTURE.md` — structure, key components, integrations, and hard constraints.
  - `BUILD_PLAN.md` — slice-by-slice plan with `DONE / PARTIAL / TODO` status.
  - `FEATURE_TICKETS.md` — tickets with **testable** acceptance criteria and stable IDs.
  - `DECISIONS.md` — a dated, ADR-style decision log (decision, rationale, source).

### When to apply
- **New / empty repo:** propose the framework, then scaffold it early — before or alongside the first substantial feature.
- **Existing repo without it:** create it once the work is more than a trivial one-off (this is the aggressive default — lean toward creating it).
- **Existing repo with it:** treat the docs as the **source of truth** — keep them accurate, and update `DECISIONS.md` plus the affected doc **in the same change** whenever a decision or tradeoff is made.
- **Skip only for:** pure questions, throwaway one-liners, and read-only investigations where no code is being built. (Aggressive about *projects*, not about every conversational turn.)

### The discipline (how to write and maintain the docs)
1. **Verify before asserting.** Never write a file path, library, license, API, table, column, or version you have not confirmed against the actual repo. If something is undecided, mark it **OPEN** — do not invent it.
2. **Synthesize, do not paste.** Build the docs from the real project, its specs, and its decisions. Never paste a generic template, and never document a feature the code/specs do not support.
3. **Audit before you trust.** After drafting, re-read the set for internal contradictions (naming, stack, data model, status), factual accuracy against the code, and coverage. Fix what is off before building on top of it.
4. **Keep them living.** The docs are the source of truth, updated as the project evolves — not an afterthought.

### Shortcut
Run **`/antivibe-docs`** anytime to scaffold this framework in a new project or audit/refresh it in an existing one.
