# KB Builder — Stage Definitions

## Stage A: `/kb-init`

**Run**: Once
**AI involvement**: None — pure scaffolding
**Input**: None (or optional project name)
**Output**: Folder structure + empty config files

Creates the `kb/` directory with all subfolders and template files. Should work with zero questions asked. Sensible defaults, configure later.

---

## Stage B: `/kb-start`

**Run**: Once
**AI involvement**: Interactive Q&A + file generation
**Input**: User answers
**Output**: `project.config.json` (initial) + `source/baseline/brief.md`

Two things happen:

1. **AI asks lightweight questions** (interactive, quick):
   - What is this project?
   - What's your goal for this KB?
   - Any specific areas of concern?

2. **AI generates `brief.md`** for user to fill out at their own pace:
   - Project description
   - Why this KB (onboarding? audit? takeover?)
   - Repository URLs + preferred branch/tag per repo
   - Key documents (paths or URLs)
   - People & tribal knowledge context
   - Known pain points
   - Topics of interest (checklist)
   - Notes / instructions for the AI

The config is a **living document** — as AI learns, it can suggest updates.

---

## Stage C: `/kb-bootstrap` (Run 0)

**Run**: Once, after user fills `brief.md`
**AI involvement**: Semi-autonomous
**Input**: Filled `brief.md`
**Output**: Classified sources, project map, initial plan, first drafts

Run 0 steps:
1. Parse `brief.md`
2. Classify all provided sources:
   - Git repos → clone to `source/baseline/repos/` at specified ref
   - Reference docs → `source/baseline/trusted-docs/`
   - Contextual/ephemeral notes → `source/run-0/`
3. Initial scan of baseline sources (structure only, not deep read):
   - Repos: file tree, README, config files, entry points
   - Docs: table of contents, section headers, key terms
4. Auto-detect initial domain decomposition from structure
5. Generate `wip/project-map.md` (first version)
6. Generate `wip/domain-index.md` (first version)
7. Generate `wip/run-0/plan.md` with topics + priority
8. Generate `wip/run-0/findings.md` (structural observations)
9. Generate `wip/run-0/knowledge-state.md`
10. Generate initial drafts in `drafts/` (skeleton documents)
11. Write `wip/run-0/run-0.config.json`

Run 0 is shallow on purpose — it maps the terrain, doesn't dig deep.

---

## Stage D: `/kb-input`

**Run**: Anytime
**AI involvement**: Classification + filing
**Input**: File path, directory, URL, or pasted text

Input types:

| Type | Example | Handling |
|------|---------|---------|
| Local file/dir | `./src/`, `./docs/readme.md` | Link/copy to source folder |
| Git repo | `https://github.com/org/repo` | Clone to `source/baseline/repos/` |
| URL | Wiki page, Confluence, etc. | Fetch & store |
| Pasted text | Slack thread, notes | Save as `.md` in source folder |
| Trusted doc | "This is source of truth" | Goes to `source/baseline/trusted-docs/` |

For each source, AI:
- Classifies type (code, doc, config, schema, conversation, spec)
- Determines trust level (trusted/reference/exploratory)
- Assigns to baseline or current run folder
- Suggests which domains it likely relates to

---

## Stage E: `/kb-iterate`

**Run**: Anytime, multiple times
**AI involvement**: Fully autonomous
**Input**: All previous state
**Output**: Updated wip/, updated drafts/

### Pre-flight

1. Check baseline repos for updates (`git fetch`, ask user if pull needed)
2. Read `project.config.json`
3. Read `wip/project-map.md` (big picture first)
4. Read `wip/domain-index.md` (domain structure)
5. Read previous run's `knowledge-state.md` + `plan.md`

### Autonomous Loop

```
While should_continue:

  RUN N:

  FOCUS:
    1. Pick focus topics from plan.md (highest priority)
    2. Load that domain's notes + questions from wip/
    3. Load that domain's current drafts

  SCAN:
    4. Incremental scan of relevant sources
       - Baseline repos: diff against last run's file hashes
       - New run-N sources: full scan
    5. Deep read focused sections

  LEARN:
    6. Write findings.md (this run only)
    7. Update domain notes + questions in wip/
    8. Rewrite knowledge-state.md (compact current understanding)

  DRAFT:
    9. Update/create relevant docs in drafts/
    10. Append to drafts/_changelog.md

  MAP:
    11. Update wip/project-map.md (confidence, relationships)
    12. Update wip/domain-index.md (if new domains discovered)
    13. If large unexplored domain found → auto-decompose

  PLAN:
    14. Update plan.md (reprioritize, mark completed, add new)

  FINALIZE:
    15. Write run-N.config.json (hashes, metadata)
    16. N++

  EVALUATE should_continue:
    - HIGH priority items remaining in plan? → continue
    - Last run produced meaningful new findings? → continue
    - Blocked (need source not available)? → STOP
    - All planned topics at high confidence? → STOP
    - Diminishing returns (2+ runs with minimal new info)? → STOP
    - Safety limit (configurable max consecutive runs)? → PAUSE
    - Domain-index changed significantly? → PAUSE, let user confirm
```

### Post-loop Report

AI reports to user:
- Runs completed
- Topics updated + confidence levels
- Contradictions / open questions
- What user should provide next
- Suggested next action: `/kb-input` or `/kb-output`

---

## Stage F: `/kb-status`

**Run**: Anytime
**AI involvement**: Read-only
**Input**: Current state files
**Output**: Summary to user

Shows:
- Current run number
- Confidence per domain
- Open questions / blockers
- Source count + types
- Suggested next action

---

## Stage G: `/kb-output`

**Run**: Anytime
**AI involvement**: Copy + optional polish
**Input**: Current `drafts/` state
**Output**: Frozen snapshot in `output/v{N}/`

Steps:
1. Copy entire `drafts/` → `output/v{N}/`
2. Add metadata (run number, timestamp, coverage summary)
3. Optionally polish formatting, remove WIP markers
4. `unknowns.md` always included — honest gaps

Output does not end the process. User can continue with `/kb-input` + `/kb-iterate` after.
