# KB Builder — Workflow Design

A Claude Code plugin for building knowledge bases from brownfield projects through iterative AI-driven learning.

## Concept

User has a project they don't fully understand. They feed sources. AI reads, learns, connects dots, and tells the user what it still doesn't know. User feeds more sources. Repeat until knowledge is sufficient. Output structured documentation.

This is domain-agnostic — sources can be code, PDFs, wikis, Slack exports, API docs, database schemas, meeting notes, or anything else.

## Spaces

The plugin uses four distinct spaces:

| Space | Purpose | Who writes |
|-------|---------|-----------|
| `source/` | Raw inputs — baseline (persistent) + per-run (ephemeral) | User + AI (classification) |
| `wip/` | AI's private workspace — notes, maps, plans, learning state | AI only |
| `drafts/` | Living documents that evolve each run — user-readable | AI writes, user reviews |
| `output/` | Frozen versioned snapshots of drafts | AI (on command) |

## Commands

| Command | When | What happens |
|---------|------|-------------|
| `/kb-init` | Once | Create folder structure + empty configs |
| `/kb-start` | Once | AI asks questions + generates `brief.md` for user to fill out |
| `/kb-bootstrap` | Once | After user fills brief → classify sources into baseline vs run-0, initial scan, generate project map + first plan |
| `/kb-input` | Anytime | User adds source → AI classifies → baseline or current run |
| `/kb-iterate` | Anytime | AI runs autonomous learning loop until stop condition |
| `/kb-status` | Anytime | Show current state: confidence per domain, open questions, run count |
| `/kb-output` | Anytime | Snapshot `drafts/` → `output/v{N}/` |

## Workflow States

```
EMPTY
  → /kb-init
INITIALIZED
  → /kb-start (creates brief.md)
BRIEF_CREATED
  → (user fills brief)
BRIEF_READY
  → /kb-bootstrap (Run 0)
RUN_0_COMPLETE
  → /kb-iterate (autonomous)
LEARNING
  → (stop condition)
PAUSED
  → /kb-input + /kb-iterate (continue learning)
  → /kb-output (snapshot anytime)
VERSIONED
  → /kb-input + /kb-iterate (continue learning anytime)
```
