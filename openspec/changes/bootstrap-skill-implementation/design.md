## Context

The Deepfield plugin has a bootstrap skill (`plugin/skills/deepfield-bootstrap.md`) that describes an agent-based Run 0 workflow. No implementation exists — no scripts, no orchestration. The task spec (TASK-002) calls for a "simple version" that uses scripts and templates only, deferring AI agent integration to a future phase.

Existing infrastructure to build on:
- `plugin/scripts/clone-repos.sh` — already handles git cloning with branch/tag support
- `plugin/scripts/hash-files.js` — already computes SHA-256 file hashes
- `plugin/scripts/update-json.js` — already handles atomic JSON writes
- `plugin/templates/project-map.md`, `domain-index.md`, `learning-plan.md` — templates exist
- `plugin/skills/deepfield-bootstrap.md` — skill document exists, needs to invoke scripts

## Goals / Non-Goals

**Goals:**
- Implement working end-to-end Run 0 using scripts only
- Parse `brief.md` to extract project name, repository URLs, focus areas, topics
- Clone repositories listed in the brief
- Scan repository directory structure
- Generate `wip/project-map.md`, `wip/domain-index.md`, `wip/learning-plan.md`
- Create `wip/run-0/run-0.config.json` with status "completed" and file hashes
- Update `deepfield-bootstrap.md` skill to call `bootstrap-runner.js`

**Non-Goals:**
- AI-based source classification (Phase 2B)
- AI-based domain detection (Phase 2B)
- AI learning agents (Phase 3+)
- Deep file reading or semantic analysis
- `/df-iterate` or any Run 1+ logic

## Decisions

**Decision 1: Single orchestrator script (`bootstrap-runner.js`)**
All bootstrap steps are coordinated from one Node.js script rather than chained shell commands. Rationale: Node.js provides better error handling, structured data passing between steps, and testability. The skill document simply calls `node bootstrap-runner.js`.

**Decision 2: CommonJS (`require`) not ESM (`import`)**
Existing scripts (`hash-files.js`, `update-json.js`, `read-state.js`) all use CommonJS. To maintain consistency and avoid `.mjs` / `"type": "module"` friction, all new scripts use `require`. The task spec code samples use `import` syntax but the pattern in the repo is CommonJS.

**Decision 3: brief.md parsing via regex, not a markdown parser**
The brief template has a predictable structure (sections with `##` headers, bullet lists, URLs). Simple regex extraction is sufficient for Run 0 and avoids adding npm dependencies. A proper markdown AST parser can replace this in Phase 2B if needed.

**Decision 4: Domain detection from folder names only**
Without AI, domain detection is limited to matching top-level directories against known patterns (`api`, `frontend`, `backend`, `services`, `core`, etc.) plus focus areas from the brief. This produces a rough domain-index that the user can refine before Run 1.

**Decision 5: File hashing via existing `hash-files.js`**
Rather than reimplementing hashing, `bootstrap-runner.js` calls `hash-files.js` via `execSync` for each cloned repo and aggregates results. This reuses tested code.

**Decision 6: Atomic writes via temp-then-rename**
All generated markdown files are written atomically (write to `.tmp`, then `fs.renameSync`) following the established pattern in `update-json.js`.

## Risks / Trade-offs

- **Regex parsing brittleness** → Mitigation: brief.md template is controlled by us; if users deviate from the template format, parsing degrades gracefully (returns empty arrays, not errors). User sees warnings.
- **Shallow clones may miss history** → Mitigation: `--depth 1` is intentional for speed; history is not needed for structural scanning. Documented in skill.
- **Large repos slow to clone** → Mitigation: Progress reported per-repo; user can Ctrl-C and re-run (existing repos are skipped).
- **No rollback if bootstrap partially fails** → Mitigation: Each step is idempotent; re-running bootstrap skips existing artifacts. run-0.config.json is written last so partial runs don't mark as "completed".
