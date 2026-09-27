---
name: production-readiness
description: Systematic production-readiness audit and remediation for a web app or site. Use whenever the user asks "is this production ready?", wants a launch/go-live checklist, asks to "harden" an app, mentions a production readiness review, pre-launch audit, security-and-reliability sweep, or says their "vibe-coded" project needs to be made real. Also use when the user pastes a long checklist of production concerns (auth, rate limiting, testing, DR, accessibility, etc.) and asks to "do all these" — this skill turns such lists into a triaged, evidence-based audit instead of blind implementation.
---

# Production Readiness Audit & Remediation

Audit a codebase for production readiness, then fix what actually matters. The core insight:
most readiness checklists are generic. Blindly implementing every item wastes days building
things the architecture doesn't need (multi-tenancy for a single-tenant site, chaos
engineering for a static storefront). Triage first, audit with evidence, fix in priority
order.

## Ground rules

- Read the target repo's `CLAUDE.md` and `docs/` (or equivalent) before anything else.
  Project-specific product, safety, and compliance rules **override** this skill.
- **Stop at 85% of plan usage or context.** When you hit it, write remaining work as a
  prioritized TODO list into the audit doc and end cleanly. An unfinished audit with a
  good handoff beats a truncated one.
- Never assert what you haven't verified against the repo or a live response. No finding
  without evidence (command output, file:line, HTTP response).
- Never commit secrets. Follow the project's content/compliance rules when touching copy.

## Phase 0 — Inventory (no changes)

Establish what exists before judging it: framework and versions, hosting platform, API
routes / server actions / endpoints, forms and user inputs, third-party services and
outbound calls, env vars in use, where data is stored, CI configuration, deployment
pipeline. This inventory drives the triage — a static site and a multi-tenant SaaS get
very different verdicts on the same checklist.

## Phase 1 — Applicability triage

Classify EVERY item in the checklist below into one of:

- **APPLICABLE** — this codebase owns the concern; audit and fix it.
- **PLATFORM** — handled by the hosting platform or a vendor (e.g. TLS on Vercel,
  payments on Shopify/Stripe, auth on a managed IdP). Verify the configuration is
  actually correct — don't assume — document where it lives, and move on.
- **N/A** — does not apply to this architecture; one sentence of justification.

Do not implement anything for PLATFORM or N/A items beyond verification and documentation.
This phase is what separates a useful audit from checklist theater.

### Security
1. Input sanitization and injection prevention — all form inputs, query params, route
   params, anything interpolated into queries, fetches, shell commands, or rendered HTML
2. Authentication
3. Authorization, roles and permissions
4. Session management and token expiry
5. Secrets management — nothing committed, env-var only, rotation story documented
6. HTTPS/TLS and certificate rotation
7. Rate limiting and abuse prevention — anything that sends email, writes data, or costs money
8. Dependency scanning and vulnerability patching — run the ecosystem's audit tool now,
   and wire automated scanning into CI
9. Multi-tenancy and data isolation
10. PII handling — what PII transits or is stored, where it goes, who can see it
11. Data retention and deletion policy
12. Regulatory compliance — jurisdiction-dependent (e.g. GDPR, CASL/PIPEDA for Canadian
    senders, CCPA, HIPAA); identify which regimes apply before auditing against them
13. Audit trails and tamper-evident logging for anything that mutates data

### Testing & CI
14. Unit tests for pure logic
15. Integration tests for API routes and data fetching
16. End-to-end tests for the critical user paths (the ones that make money or lose trust)
17. Regression suite wired into CI so it gates merges
18. Load/stress testing — only what the architecture warrants; static/CDN-served pages
    may make this PLATFORM
19. Chaos/resilience testing — usually N/A below a certain scale; justify either way
20. All checks enforced in CI: typecheck, lint, tests, build, dependency audit must block
    deploys
21. Code review process documented — branch protection, what reviewers check

### Reliability
22. Error handling and graceful degradation — error boundaries, 404/500 pages, behavior
    when each third-party dependency is down
23. Retry logic with backoff, and idempotency for anything that writes
24. Circuit breakers / fallback behavior for third-party calls
25. Concurrency and race-condition review — build scripts, shared state, parallel writes
26. Caching strategy and invalidation — document intended TTLs, then verify actual headers
27. RTO/RPO defined and a disaster recovery plan written — what is rebuildable from the
    repo, what isn't, how to restore it

### Documentation & accessibility
28. Accessibility audit — WCAG 2.1 AA: run axe (or equivalent) on key pages, keyboard
    navigation, alt text, contrast, focus states. This is nearly always APPLICABLE.
29. Architecture diagram reflecting reality
30. API contracts for exposed routes — shapes and error responses documented
31. Decision records — log every decision this audit produces in the project's decision
    log (e.g. `docs/DECISIONS.md`), dated, in the same change as the work

## Phase 2 — Audit

For each APPLICABLE item, gather evidence before concluding pass/fail. Record findings in
`docs/PRODUCTION_READINESS.md` as a table:

| Item | Status | Evidence | Severity |

Status: PASS / FAIL / PLATFORM / N/A. Severity: **P0** blocks launch, **P1** fix soon,
**P2** nice-to-have. PLATFORM rows still need evidence that the platform setting is right.

## Phase 3 — Remediate

Fix in order: P0 security → P0 reliability → CI gating → tests → P1 → P2. For each fix:

- Smallest change that resolves the finding; match the surrounding code's idiom.
- Verify against reality — run the command, hit the endpoint, re-run the scanner — before
  marking it done.
- Update the project's decision log and affected docs in the same change.

## Definition of Done

The table in `docs/PRODUCTION_READINESS.md` is complete with evidence for all 31 items,
every P0 is fixed and verified, CI blocks merges on typecheck/lint/tests/build/audit, and
the decision log records what was decided and why.

## Scoping expectations

A full pass rarely fits one session. Natural session boundaries: (1) Phases 0–2, the
audit only; (2) P0 remediation; (3) the rest. When the user asks only "is it ready?",
stop after Phase 2 and report — don't fix until asked.
