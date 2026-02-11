# KB Builder — Key Design Decisions

## 1. Incremental Scanning

Each run tracks file hashes in `run-N.config.json`. The scanner diffs hashes between runs and only reads what changed or is new. Baseline repos use `git fetch` + diff, not full re-scan.

## 2. Knowledge Accumulation Strategy (Layered)

Three layers prevent context overload while maintaining audit trail:

- **`findings.md`** (per-run) — Small, focused. Only this run's discoveries. AI writes it, never reads old ones during iterate. Serves as changelog / learning journal.
- **`knowledge-state.md`** (rewritten each run) — AI's working memory. Concise summary of what AI knows, confidence per topic, open questions. This is what the AI reads at the start of each run.
- **`{topic}.md` drafts** (cumulative) — The actual accumulated knowledge in `drafts/`. These grow and get refined each run.

At the start of each run, AI reads:
- `project-map.md` (big picture)
- `knowledge-state.md` (compact current state)
- `plan.md` (what to focus on)
- Relevant domain's draft docs

AI does NOT read all historical `findings.md` files during iterate.

## 3. Project Map as Anchor

`wip/project-map.md` is the most important file in the system. It provides:
- System overview (high-level architecture)
- Domain decomposition with confidence levels
- Service/component relationship map
- Coverage gaps (what hasn't been explored)

AI reads it first, updates it last, every run. This prevents the AI from losing track of the big picture across many runs.

## 4. Domain Auto-Decomposition

For large projects, AI auto-detects domains rather than using flat topic lists:

- **Run 0**: File/folder structure analysis → initial domain guesses
- **Run 1-2**: Validate by reading code → confirm or merge domains
- **Run 3+**: Deep dive per domain, each run focuses on 1-2 domains
- **Ongoing**: Split domains if too large, merge if too small

Detection signals: directory structure, service boundaries, database ownership, API route grouping, CODEOWNERS files.

If domain-index changes significantly, the AI pauses and lets the user confirm the new decomposition.

## 5. Autonomous Execution

`/kb-iterate` runs multiple autonomous cycles by default. AI keeps going until a stop condition is met:

1. **Blocked** — Plan requires a source that isn't available → stop, ask user
2. **Diminishing returns** — 2+ runs with minimal new findings → stop
3. **Coverage reached** — All planned topics at high confidence → stop
4. **Safety limit** — Configurable max consecutive runs (default: 5) → pause & summarize
5. **Domain restructure** — Significant changes to domain-index → pause for user confirmation

After stopping, AI always reports what it learned and what it needs next.

## 6. Baseline Repo Snapshot Strategy

Learning may span multiple days. Code shouldn't change under the AI mid-process.

- During `/kb-start`, AI asks user which branch/tag per repo
- Repos cloned at specified ref, commit hash recorded
- At start of each `/kb-iterate` (once, not per autonomous cycle):
  - `git fetch` (don't pull)
  - If remote has new commits → ask user whether to pull
  - If user says no → continue with current snapshot
- All autonomous runs within one `/kb-iterate` use the same snapshot

## 7. Three-Space Separation

| Space | For | Analogy |
|-------|-----|---------|
| `wip/` | AI's thinking | Researcher's notebook |
| `drafts/` | Evolving output | Working draft of a paper |
| `output/` | Published versions | Published paper |

This separation means:
- User reviews `drafts/` without wading through AI's internal notes
- AI can be messy in `wip/` without polluting deliverables
- `output/` is always a clean, point-in-time snapshot

## 8. Draft Changelog

`drafts/_changelog.md` tracks what changed per run so users can review incremental progress without diffing files manually. Each entry lists which documents were created, updated, or had items resolved.

## 9. Unknowns Are a Feature

`drafts/cross-cutting/unknowns.md` is always present and always honest. It explicitly states what the KB doesn't cover, what contradictions remain unresolved, and what sources would help. This makes the output trustworthy — readers know what to verify independently.

## 10. Scenarios

This workflow is designed to work across any project type:

| Scenario | Primary Sources | Focus Topics |
|----------|----------------|-------------|
| Legacy codebase takeover | Git repo, old wiki, tribal knowledge | Architecture, data flow, deployment, conventions |
| New team member onboarding | Internal docs, repo, meeting transcripts | Glossary, team conventions, business logic |
| Vendor system integration | Vendor API docs, SDK, sample code, support tickets | API surface, auth flow, error handling, rate limits |
| Compliance audit prep | Policy docs, codebase, infra configs | Data flow, access controls, logging, PII handling |
| Monolith decomposition | Monorepo, database schemas, deployment configs | Domain boundaries, coupling, shared state |

All follow the same `input → iterate → plan → repeat → output` loop. The config and plan adapt to the scenario, not the workflow.
