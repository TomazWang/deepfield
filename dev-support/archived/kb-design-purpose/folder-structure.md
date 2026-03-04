# KB Builder — Folder Structure

## Full Structure

```
kb/
├── project.config.json
├── source/
│   ├── baseline/
│   │   ├── brief.md
│   │   ├── repos/
│   │   │   └── {repo-name}/           # Cloned at specific ref
│   │   └── trusted-docs/
│   │       └── {doc-name}.md
│   ├── run-0/
│   └── run-N/
├── wip/
│   ├── project-map.md                 # Living overview of entire project
│   ├── domain-index.md                # Domain decomposition + ownership
│   └── run-N/
│       ├── run-N.config.json          # Run metadata + file hashes
│       ├── knowledge-state.md         # Compact: what AI knows NOW
│       ├── findings.md                # This run's discoveries only
│       ├── plan.md                    # What to learn next
│       └── domains/
│           └── {domain}/
│               ├── notes.md           # AI's raw notes
│               └── questions.md       # Open questions
├── drafts/
│   ├── _changelog.md                  # What changed per run
│   ├── architecture.md
│   ├── glossary.md
│   ├── domains/
│   │   └── {domain}/
│   │       ├── overview.md
│   │       ├── data-flow.md
│   │       └── api-surface.md
│   └── cross-cutting/
│       ├── auth.md
│       ├── conventions.md
│       └── unknowns.md
└── output/
    └── v{N}/                          # Frozen snapshot of drafts/
        └── (copy of drafts/ at that moment)
```

## Space Responsibilities

### `source/` — Raw Inputs

Contains everything the user provides. Split into baseline (persistent) and per-run (ephemeral).

**Baseline classification rules:**

| Source Type | Location | Reason |
|-------------|----------|--------|
| Git repo | `baseline/repos/` | Living source, always re-scan |
| API spec / schema | `baseline/trusted-docs/` | Reference material |
| Official docs / wiki | `baseline/trusted-docs/` | Authoritative |
| Slack thread / paste | `run-N/` | Point-in-time context |
| Meeting notes | `run-N/` | Ephemeral input |
| User's own notes | `run-N/` | May evolve |

User can override classification. AI suggests, user confirms.

### `source/baseline/repos/` — Git Repo Handling

- During `/kb-start`, AI asks user which branch or tag to use per repo
- Repos are cloned at the specified ref
- At the start of each `/kb-iterate`, AI does `git fetch` (not pull)
- If remote has new commits, AI asks user whether to pull
- Learning process runs against a snapshot — no mid-run updates
- Ref + commit hash stored in `project.config.json`

### `wip/` — AI's Private Workspace

AI's scratch pad for thinking, planning, and tracking its learning process. User can read for transparency, but not a deliverable.

Key files:
- **`project-map.md`** — Living overview of the entire project. AI reads first and updates last each run. Prevents losing track of the big picture across runs.
- **`domain-index.md`** — How AI decomposed the project into domains. Updated as understanding grows.
- **`knowledge-state.md`** — Compact "what I know now" summary. Rewritten each run (not appended). This is the AI's working memory.
- **`findings.md`** — Per-run only. Small, focused. What was discovered this run. AI writes it but doesn't read old ones during iterate.
- **`plan.md`** — What to learn next, prioritized.

### `drafts/` — Living Documents

The actual knowledge base documents. Evolve each run. User-facing.

- Each run may update any draft document
- `_changelog.md` tracks what changed per run
- Documents organize by domain once domains are detected
- Cross-cutting concerns get their own section
- `unknowns.md` is always present and always honest

### `output/` — Frozen Snapshots

On `/kb-output`: copy entire `drafts/` → `output/v{N}/` with metadata (which run, timestamp, coverage summary).
