# kb-distiller — Complete Design Document

**Version**: 2.0.0
**Status**: Design Phase
**Last Updated**: 2026-02-11

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Command Structure](#3-command-structure)
4. [Stage Flow](#4-stage-flow)
5. [State Management](#5-state-management)
6. [Agent Architecture](#6-agent-architecture)
7. [Script System](#7-script-system)
8. [Folder Structure](#8-folder-structure)
9. [Knowledge Accumulation](#9-knowledge-accumulation)
10. [Incremental Scanning](#10-incremental-scanning)
11. [Stop Conditions](#11-stop-conditions)
12. [File Formats](#12-file-formats)
13. [Implementation Plan](#13-implementation-plan)
14. [Design Decisions](#14-design-decisions)

---

## 1. Project Overview

### 1.1 Purpose

**kb-distiller** is an AI-driven knowledge base builder for Claude Code that iteratively learns codebases and distills institutional knowledge.

**Core concept**: User provides sources (code, docs, wikis, etc.) → AI reads, learns, connects dots, identifies gaps → User provides more sources or feedback → Repeat until knowledge is sufficient → Output structured documentation.

### 1.2 Key Features

- **Iterative learning**: Multi-run autonomous learning with user feedback loops
- **Domain decomposition**: Auto-detects project domains and focuses learning per domain
- **Trust hierarchy**: Prioritizes running code > git history > tickets > tests > comments > docs
- **Incremental scanning**: Only reads changed/new files across runs
- **Honest gaps**: Always documents what it doesn't know (unknowns.md)
- **Versioned snapshots**: Freeze knowledge at any point, continue learning after
- **Script-backed robustness**: Critical operations use tested scripts, not AI generation

### 1.3 Target Use Cases

| Scenario | Primary Sources | Focus |
|----------|----------------|-------|
| Legacy codebase takeover | Git repo, old wiki, tribal knowledge | Architecture, data flow, deployment |
| New team onboarding | Internal docs, repo, meeting notes | Glossary, conventions, business logic |
| Vendor system integration | API docs, SDK, sample code | API surface, auth, error handling |
| Compliance audit | Policy docs, codebase, configs | Data flow, access controls, PII |
| Monolith decomposition | Monorepo, DB schemas, configs | Domain boundaries, coupling, state |

### 1.4 Why Separate Project?

kb-distiller is complex enough to warrant its own repository:
- **10+ commands** with multi-stage workflow
- **8+ skills** with complex orchestration logic
- **4 specialized agents** with parallel execution
- **7+ utility scripts** for robust file operations
- **State machine** with 8+ states and transitions
- **Incremental scanning** with file hashing and git diffs
- **Autonomous iteration** with sophisticated stop conditions

This is not a simple plugin — it's a full system.

---

## 2. Architecture Principles

### 2.1 Command → Skill → Script Pattern

```
User Input
  ↓
Command (commands/*.md)
  - User-facing entry point
  - Parses arguments
  - Validates current state
  ↓
Skill (skills/*/SKILL.md)
  - Orchestrates workflow
  - Calls scripts for robust operations
  - Launches agents for AI tasks
  ↓
Script (scripts/*.sh, scripts/*.js)
  - Robust file operations (atomic writes)
  - Consistent formatting (templates)
  - State management (read/update JSON)
  - Reusable, testable, fast
  ↓
Agent (agents/*.md)
  - Specialized AI workers
  - Deep analysis, learning, comparison
  - Parallel execution for efficiency
```

### 2.2 Four-Space Architecture

| Space | Purpose | Who Writes | Visibility |
|-------|---------|-----------|-----------|
| `source/` | Raw inputs (persistent + ephemeral) | User + AI (classification) | User reviews |
| `wip/` | AI's workspace (notes, maps, plans) | AI only | User can read |
| `drafts/` | Living documents (evolving knowledge) | AI writes, user reviews | User-facing |
| `output/` | Frozen versioned snapshots | AI (on command) | Published artifacts |

**Why four spaces?**
- Clean separation of concerns
- User doesn't wade through AI's messy notes
- AI can be verbose in wip/ without polluting deliverables
- output/ is always clean, point-in-time snapshot

### 2.3 State Machine Design

Explicit state transitions enable:
- Resumability (pause/continue across sessions)
- Error recovery (know exactly where we are)
- User control (prevent invalid operations)
- Progress tracking (clear current state)

States: `EMPTY` → `INITIALIZED` → `BRIEF_CREATED` → `RUN_0_COMPLETE` → `LEARNING` → `COMPLETE`

### 2.4 Incremental Scanning

Never re-read unchanged files:
- Track file hashes per run
- Use git diffs for baseline repos
- Only scan changed/new files
- Massive performance improvement for large codebases

### 2.5 Knowledge Accumulation Strategy

Three-layer approach prevents context bloat:
1. **Compact state** (knowledge-state.md) — rewritten each run, concise summary
2. **Big picture map** (project-map.md) — updated each run, architecture overview
3. **Accumulated drafts** (drafts/) — grows each run, detailed knowledge

AI reads #1 and #2 at run start (small context), writes to #3 (grows over time).

---

## 3. Command Structure

### 3.1 All Commands

| Command | Stage | Trigger | Purpose |
|---------|-------|---------|---------|
| `/kb-init` | 0 | User/Agent | Initialize folder structure |
| `/kb-bootstrap` | 1a | User/Agent | Start bootstrap, ask questions |
| `/kb-continue` | 1b | User/Agent | Continue after brief filled, run 0 |
| `/kb-feedback` | 2a | User/Auto | Collect user feedback for next run |
| `/kb-iterate` | 2b | User/Agent | Run single iteration (N → N+1) |
| `/kb-learn [scope]` | 2c | User | Learn specific scope/topic |
| `/kb-distill` | 3 | User | Generate output snapshot |
| `/kb-status` | Support | User | Check current progress |
| `/kb-ff` | Support | User | Fast-forward (auto-run until done) |

### 3.2 Command Aliases

For convenience:
- `/kb-init` → `/kb:init`
- All commands support both `/kb-command` and `/kb:command` formats

### 3.3 Command Arguments

Most commands take no arguments (rely on state).

**Exceptions**:
```bash
/kb-learn [scope]           # Scope: domain name or topic
/kb-learn authentication
/kb-learn database.migrations

/kb-ff [--max-runs N]       # Optional safety limit override
/kb-ff --max-runs 20
```

---

## 4. Stage Flow

### Stage 0: Init

**Trigger**: `/kb-init`

**Flow**:
```
/kb-init
  ↓
commands/init.md
  ↓
skills/init-kb-distiller/SKILL.md
  ↓
scripts/init-workspace.sh
  - Create kb/{source,wip,drafts,output}
  - Create kb/source/{baseline,run-0}
  - Create kb/wip/{domains,run-0}
  - Create kb/.state.json (INITIALIZED)
  - Create kb/.config.json (defaults)
  - Create .gitignore
  ↓
scripts/update-state.js --state INITIALIZED
```

**Output**:
- ✅ Folder structure created
- ✅ State: `INITIALIZED`
- ✅ Ready for `/kb-bootstrap`

---

### Stage 1a: Bootstrap Start

**Trigger**: `/kb-bootstrap`

**Flow**:
```
/kb-bootstrap
  ↓
commands/bootstrap.md
  ↓
skills/start-kb-bootstrap/SKILL.md
  ↓
scripts/read-state.js (must be INITIALIZED)
  ↓
Ask user questions:
  1. Project name?
  2. Goal (onboarding/audit/takeover)?
  3. Git repos (URLs + branch/tag)?
  4. Key documents (paths/URLs)?
  5. Areas of concern?
  6. Max runs per session (default 10)?
  ↓
scripts/generate-template.js --type brief
  - Generate brief.md with sections
  - Pre-fill with user answers
  ↓
scripts/update-state.js --state BRIEF_CREATED
  ↓
Prompt user: "Review kb/source/baseline/brief.md, edit if needed, run /kb-continue"
```

**brief.md sections**:
```markdown
# Project Brief

## Project Overview
[User's description]

## Learning Goals
Goal: [onboarding|audit|takeover|integration|decomposition]

## Repository Information
- Repo: https://github.com/org/repo
  Branch/Tag: main
  Commit: [will be filled on clone]

## Key Documents
- Path: ./docs/architecture.md
- URL: https://wiki.company.com/project

## Areas of Concern
- [User's concerns]

## Topics Checklist
Domains to explore:
- [ ] Authentication
- [ ] Database
- [ ] API
- [ ] Deployment
- [ ] [User adds more]

## Configuration
Max runs per session: 10
Auto feedback: false

## Notes for AI
[User's instructions]
```

**Output**:
- ✅ `kb/source/baseline/brief.md` created
- ✅ State: `BRIEF_CREATED`
- ✅ User can edit before continuing

---

### Stage 1b: Bootstrap Run 0

**Trigger**: `/kb-continue` OR user says "I've provided the info"

**Flow**:
```
/kb-continue
  ↓
commands/continue.md
  ↓
skills/continue-bootstrap/SKILL.md
  ↓
scripts/read-state.js (must be BRIEF_CREATED or BRIEF_READY)
  ↓
Read brief.md
  ↓
Launch agent: kb-orchestrator (task: RUN_0)
  ↓
  Clone repos to source/baseline/repos/ at specified refs
  ↓
  scripts/compute-hashes.js --run 0
  ↓
  Launch agent: kb-topic-analyzer
    - Analyze file/folder structure
    - Detect domains (directories, services, modules)
    - Generate wip/project-map.md
    - Generate wip/domain-index.md
    - Generate wip/plan.md (prioritized topics)
  ↓
  Write wip/run-0/findings.md (structural observations)
  ↓
  scripts/generate-template.js --type knowledge-state
  ↓
  Create initial drafts/ structure:
    - drafts/summary.md (skeleton)
    - drafts/_changelog.md (empty)
    - drafts/domains/{domain}/domain.md (skeletons)
    - drafts/cross-cutting/unknowns.md (initial gaps)
  ↓
  scripts/update-state.js --state RUN_0_COMPLETE --run 0
  ↓
Report to user:
  - Domains detected: [list]
  - Topics identified: [count]
  - Next: /kb-feedback or /kb-iterate
```

**Output**:
- ✅ Run 0 complete
- ✅ Project map created (`wip/project-map.md`)
- ✅ Domain index created (`wip/domain-index.md`)
- ✅ Learning plan ready (`wip/plan.md`)
- ✅ Initial drafts/ structure created
- ✅ State: `RUN_0_COMPLETE`

---

### Stage 2a: User Feedback

**Trigger**: `/kb-feedback` OR auto after run completes

**Flow**:
```
/kb-feedback
  ↓
commands/feedback.md
  ↓
skills/collect-user-feedback/SKILL.md
  ↓
scripts/read-state.js
  ↓
Get current run number N
  ↓
Show user:
  1. wip/project-map.md (confidence levels per domain)
  2. drafts/_changelog.md (what changed last run)
  3. wip/plan.md (upcoming topics, priorities)
  4. wip/run-{N}/findings.md (discoveries this run)
  ↓
Ask user:
  1. Any corrections to make?
  2. New sources to add?
  3. Areas to focus on?
  4. Areas to skip?
  5. Any other feedback?
  ↓
Create source/run-{N+1}/feedback.md with user input
  ↓
If user provided new sources:
  - Copy/link to source/run-{N+1}/
  ↓
scripts/update-state.js --state FEEDBACK_COLLECTED
  ↓
Prompt: "Ready for next iteration? Run /kb-iterate"
```

**Output**:
- ✅ User feedback collected (`source/run-{N+1}/feedback.md`)
- ✅ New sources added (if any)
- ✅ State: `FEEDBACK_COLLECTED`
- ✅ Ready for iteration

---

### Stage 2b: Iterate

**Trigger**: `/kb-iterate`

**Flow**:
```
/kb-iterate
  ↓
commands/iterate.md
  ↓
skills/run-iteration/SKILL.md
  ↓
scripts/read-state.js
  ↓
Get current run number N
  ↓
Launch agent: kb-orchestrator (task: RUN_{N+1})
  ↓
  Read wip/project-map.md (big picture, 1-2 pages)
  Read wip/knowledge-state.md (compact state, 1 page)
  Read wip/plan.md (focus topics, 1 page)
  Read source/run-{N+1}/feedback.md (user input)
  ↓
  scripts/compute-hashes.js --run {N+1} --diff {N}
    → Returns list of changed/new files only
  ↓
  FOR EACH high-priority topic in plan.md:
    ↓
    Read wip/domains/{domain}.md (AI's working notes)
    Read drafts/{domain}/domain.md (accumulated knowledge)
    ↓
    Launch agent: kb-code-investigator (parallel)
      - Deep dive into relevant code
      - Trace execution flow
      - Understand patterns
      - Update wip/domains/{domain}.md (notes)
    ↓
    Launch agent: kb-discrepancy-hunter (parallel)
      - Compare code vs docs
      - Find contradictions
      - Identify stale comments
      - Update wip/domains/{domain}.md (gaps)
    ↓
    Append wip/run-{N+1}/findings.md (this topic's discoveries)
    Update drafts/{domain}/domain.md (add knowledge)
    ↓
  END FOR
  ↓
  Rewrite wip/knowledge-state.md (compact summary of all learnings)
  Update wip/project-map.md (confidence levels, relationships)
  Update wip/plan.md (reprioritize, mark complete, add new)
  Append drafts/_changelog.md (changes this run)
  ↓
  scripts/update-state.js --state LEARNING --run {N+1}
  ↓
  Evaluate stop conditions:
    - Blocked on missing source? → STOP, report
    - All high-priority topics complete? → STOP, suggest /kb-distill
    - Diminishing returns (2+ runs, <5% new)? → STOP, report
    - Domain index restructured? → PAUSE, ask user
    - Otherwise → can continue
  ↓
Report to user:
  - Run {N+1} complete
  - Topics learned: [list]
  - Confidence changes: [domain: 0.6→0.8]
  - Next action: /kb-feedback, /kb-iterate, or /kb-distill
```

**Output**:
- ✅ Run {N+1} complete
- ✅ Topics learned (marked in plan.md)
- ✅ Drafts updated (knowledge accumulated)
- ✅ State: `LEARNING`
- ✅ Stop condition evaluated

**Note**: `/kb-iterate` runs ONCE (N → N+1). For auto-repeat, use `/kb-ff`.

---

### Stage 2c: Learn Scope (Optional)

**Trigger**: `/kb-learn [scope]`

**Flow**:
```
/kb-learn authentication
  ↓
commands/learn.md
  ↓
skills/learn-scope/SKILL.md
  ↓
scripts/read-state.js
  ↓
Extract scope from args: "authentication"
  ↓
Launch agent: kb-orchestrator (task: LEARN_SCOPE: authentication)
  ↓
  Read wip/project-map.md
  Identify domain for scope (e.g., "security" domain)
  ↓
  Find all files related to scope:
    - Grep for "auth", "authenticate", "login"
    - Check wip/domains/security.md for known files
  ↓
  Launch agent: kb-code-investigator (focused mode)
    - Deep dive into auth-related code only
    - Trace auth flow
  ↓
  Launch agent: kb-discrepancy-hunter (focused mode)
    - Compare auth code vs auth docs
  ↓
  Update drafts/security/domain.md (auth section)
  Append wip/run-{N}/findings.md (scope-specific)
  Update wip/knowledge-state.md (auth confidence)
  ↓
Report to user:
  - Scope "authentication" learned
  - Key findings: [summary]
  - Related files: [list]
```

**Output**:
- ✅ Scope learned (deep dive on specific topic)
- ✅ Focused knowledge added to drafts
- ✅ State: `LEARNING` (no run increment)

**Use case**: User wants immediate answer about specific area without full iteration.

---

### Stage 3: Distill

**Trigger**: `/kb-distill`

**Flow**:
```
/kb-distill
  ↓
commands/distill.md
  ↓
skills/distill-knowledge/SKILL.md
  ↓
scripts/read-state.js
  ↓
Get current version number (increment from last snapshot)
Get current run number
  ↓
scripts/snapshot-output.sh --version {V} --run {N}
  ↓
  Create output/v{V}-run{N}/
  Copy entire drafts/ directory
  ↓
  Generate metadata.json:
    {
      "version": V,
      "run_number": N,
      "timestamp": "2026-02-11T15:30:00Z",
      "domains": ["auth", "db", "api"],
      "confidence_summary": {
        "auth": 0.85,
        "db": 0.60,
        "api": 0.75
      },
      "topics_learned": 23,
      "topics_remaining": 7,
      "files_analyzed": 145
    }
  ↓
  Format all .md files (remove WIP markers, polish)
  Copy wip/plan.md → output/v{V}-run{N}/remaining-topics.md
  Ensure unknowns.md is included
  ↓
  Generate output/v{V}-run{N}/summary.md (executive summary)
  ↓
scripts/update-state.js --last-snapshot v{V}-run{N}
  ↓
Report to user:
  - Snapshot created: output/v{V}-run{N}/
  - Knowledge base version {V} ready
  - Can continue learning with /kb-iterate
```

**Output**:
- ✅ Snapshot created: `output/v{V}-run{N}/`
- ✅ Complete knowledge base frozen
- ✅ metadata.json included
- ✅ summary.md generated
- ✅ Can continue learning after snapshot

**Important**: Distillation does NOT end learning. User can continue with `/kb-iterate` after snapshot.

---

### Supporting: Status

**Trigger**: `/kb-status`

**Flow**:
```
/kb-status
  ↓
commands/status.md
  ↓
skills/check-status/SKILL.md
  ↓
scripts/read-state.js
scripts/format-status.js
  ↓
Display to user:

┌─────────────────────────────────────────┐
│ KB Distiller Status                     │
├─────────────────────────────────────────┤
│ State: LEARNING                         │
│ Run: 5 / Max: 10                        │
│ Last run: 2026-02-11 15:30             │
│ Last snapshot: v1-run3                  │
├─────────────────────────────────────────┤
│ Domains:                                │
│   ✅ authentication  [85%]              │
│   🔄 database        [60%]              │
│   🔄 api             [75%]              │
│   ⏳ deployment      [20%]              │
├─────────────────────────────────────────┤
│ Progress:                               │
│   Topics learned:     23 / 30           │
│   Files analyzed:     145               │
│   Open questions:     12                │
├─────────────────────────────────────────┤
│ Next Actions:                           │
│   → /kb-feedback    (provide feedback)  │
│   → /kb-iterate     (next run)          │
│   → /kb-learn [X]   (focus on topic)    │
│   → /kb-distill     (snapshot now)      │
└─────────────────────────────────────────┘
```

**Output**:
- 📊 Current state and progress
- 📈 Confidence per domain
- 📋 Topics learned / remaining
- 💡 Suggested next actions

---

### Supporting: Fast-Forward

**Trigger**: `/kb-ff`

**Flow**:
```
/kb-ff [--max-runs 20]
  ↓
commands/ff.md
  ↓
skills/run-iteration/SKILL.md (mode: FAST_FORWARD)
  ↓
scripts/read-state.js
  ↓
Set mode: FAST_FORWARD
Set safety limit: --max-runs arg OR config OR 999 (effectively unlimited)
  ↓
Launch agent: kb-orchestrator (task: RUN_AUTO)
  ↓
  LOOP:
    Run iteration (N → N+1)
    Evaluate should_continue:
      - Blocked? → STOP
      - All high-priority complete? → STOP
      - Diminishing returns? → STOP
      - Domain restructure? → PAUSE (user confirmation)
      - Safety limit reached? → PAUSE
      - Otherwise → CONTINUE
  ↓
  END LOOP (when stopped)
  ↓
Report to user:
  - Total runs completed: {count}
  - Stop reason: [reason]
  - Domains learned: [list with confidence]
  - Suggest: /kb-status or /kb-distill
```

**Output**:
- ✅ Multiple runs completed (N → N+M)
- ✅ Auto-stopped when blocked or complete
- ✅ Final status report
- ✅ State: `LEARNING` or `COMPLETE`

**Use case**: "Learn as much as possible until you can't learn more"

**Safety**: Still has configurable safety limit (default high), but no time limit.

---

## 5. State Management

### 5.1 State File Location

`kb/.state.json` (hidden, managed by scripts)

### 5.2 State Schema

```json
{
  "workflow_state": "LEARNING",
  "run_number": 5,
  "last_run_timestamp": "2026-02-11T15:30:00Z",
  "total_runs": 5,
  "last_snapshot": "v1-run3",
  "mode": "AUTO",
  "stop_reason": null,
  "config": {
    "max_runs_per_session": 10,
    "safety_limit": 10,
    "auto_feedback": false,
    "incremental_scan": true
  },
  "domains": {
    "authentication": {
      "confidence": 0.85,
      "topics_learned": ["oauth", "jwt", "session"],
      "topics_remaining": ["2fa"],
      "files_analyzed": 23,
      "last_updated_run": 5
    },
    "database": {
      "confidence": 0.60,
      "topics_learned": ["schema", "connections"],
      "topics_remaining": ["migrations", "indexes", "performance"],
      "files_analyzed": 45,
      "last_updated_run": 4
    }
  },
  "metrics": {
    "total_files_analyzed": 145,
    "total_topics_learned": 23,
    "total_open_questions": 12,
    "average_confidence": 0.73
  }
}
```

### 5.3 Valid States

```
EMPTY               # No kb/ folder yet
  ↓
INITIALIZED         # kb/ folder created, configs ready
  ↓
BRIEF_CREATED       # brief.md generated, waiting for user edit
  ↓
BRIEF_READY         # User filled brief.md (manual state, optional)
  ↓
RUN_0_COMPLETE      # Bootstrap complete, project mapped
  ↓
FEEDBACK_COLLECTED  # User provided feedback for next run
  ↓
LEARNING            # Active learning, runs N+
  ↓
PAUSED              # Hit safety limit or awaiting user confirmation
  ↓
COMPLETE            # All high-priority topics learned
```

### 5.4 State Transitions

```python
# Valid transitions
EMPTY → INITIALIZED               # /kb-init
INITIALIZED → BRIEF_CREATED       # /kb-bootstrap
BRIEF_CREATED → BRIEF_READY       # user edits brief.md (manual)
BRIEF_CREATED → RUN_0_COMPLETE    # /kb-continue (skip BRIEF_READY)
BRIEF_READY → RUN_0_COMPLETE      # /kb-continue
RUN_0_COMPLETE → LEARNING         # /kb-iterate
RUN_0_COMPLETE → FEEDBACK_COLLECTED  # /kb-feedback
FEEDBACK_COLLECTED → LEARNING     # /kb-iterate
LEARNING → LEARNING               # /kb-iterate (run N → N+1)
LEARNING → FEEDBACK_COLLECTED     # /kb-feedback
LEARNING → PAUSED                 # safety limit or domain restructure
LEARNING → COMPLETE               # all topics learned
PAUSED → LEARNING                 # /kb-iterate (resume)
COMPLETE → LEARNING               # /kb-iterate (continue learning)
```

### 5.5 State Script Operations

**Read state**:
```bash
node scripts/read-state.js --path kb
# Output: JSON to stdout
```

**Update state**:
```bash
node scripts/update-state.js \
  --path kb \
  --state LEARNING \
  --run 5 \
  --domain authentication \
  --confidence 0.85
```

**Query state**:
```bash
node scripts/read-state.js --path kb --query "domains.authentication.confidence"
# Output: 0.85
```

---

## 6. Agent Architecture

### 6.1 Agent Hierarchy

```
kb-orchestrator (conductor)
  ├── Reads: project-map, knowledge-state, plan
  ├── Decides: which topics to focus, which agents to launch
  ├── Calls: skills (via task instructions)
  ├── Launches: specialized agents (via Task tool)
  └── Updates: project-map, knowledge-state, plan

kb-topic-analyzer (domain detection)
  ├── Reads: file structure, README, configs
  ├── Analyzes: directory patterns, service boundaries
  ├── Generates: project-map.md, domain-index.md
  └── Returns: domain decomposition

kb-code-investigator (deep dive)
  ├── Reads: source code, tests
  ├── Traces: execution flow, dependencies
  ├── Understands: patterns, conventions
  ├── Updates: wip/domains/{domain}.md
  └── Returns: findings for topic

kb-discrepancy-hunter (validation)
  ├── Reads: code, docs, comments
  ├── Compares: implementation vs documentation
  ├── Finds: contradictions, stale info, gaps
  ├── Updates: wip/domains/{domain}.md (gaps)
  └── Returns: discrepancies list
```

### 6.2 Agent Specifications

#### kb-orchestrator

```markdown
---
name: kb-orchestrator
description: Main conductor for kb-distiller workflow
color: blue
tools: [Read, Grep, Glob, Bash, Edit, Write, Task]
---

# KB Orchestrator

You are the main conductor for the kb-distiller learning process.

## Your Role

Orchestrate multi-run learning workflow:
- Read project map and plan
- Decide focus topics per run
- Launch specialized agents in parallel
- Accumulate knowledge across runs
- Update confidence levels
- Determine when to stop

## Process

RUN N:
1. Read wip/project-map.md (big picture)
2. Read wip/knowledge-state.md (current state)
3. Read wip/plan.md (prioritized topics)
4. For each high-priority topic:
   - Launch kb-code-investigator (deep dive)
   - Launch kb-discrepancy-hunter (validation)
   - Accumulate findings
5. Update wip/knowledge-state.md
6. Update wip/project-map.md
7. Update wip/plan.md
8. Evaluate stop conditions

## Stop Conditions

- Blocked on missing source
- All high-priority topics learned
- Diminishing returns (2+ runs, <5% new info)
- Domain index needs restructure
- Safety limit reached

## Output

Report:
- Topics learned this run
- Confidence changes
- Next suggested action
```

#### kb-topic-analyzer

```markdown
---
name: kb-topic-analyzer
description: Analyzes codebase to identify domains and topics
color: cyan
tools: [Read, Grep, Glob, Bash]
---

# KB Topic Analyzer

You analyze codebase structure to identify domains and learning topics.

## Your Role

Domain decomposition expert:
- Detect logical domains from structure
- Identify service boundaries
- Map relationships between domains
- Suggest topic priorities

## Process

1. Read brief.md (user's goals)
2. Analyze file/folder structure
3. Detect patterns:
   - Directory organization (src/auth, src/db)
   - Service boundaries (microservices)
   - Module groupings (Django apps)
   - CODEOWNERS files
4. Read key files:
   - README.md (overview)
   - package.json / requirements.txt (deps)
   - Config files (settings, env)
5. Generate domain decomposition
6. Prioritize topics based on:
   - User's areas of concern
   - File count / complexity
   - Dependencies (learn foundations first)

## Output

Generate:
- wip/project-map.md (architecture overview)
- wip/domain-index.md (domain list with confidence)
- wip/plan.md (prioritized topics)
```

#### kb-code-investigator

```markdown
---
name: kb-code-investigator
description: Deep dives into code to understand implementation
color: green
tools: [Read, Grep, Glob, Bash, Task]
---

# KB Code Investigator

You are a code archaeology expert who deeply understands implementation.

## Your Role

Deep dive into code:
- Trace execution flow
- Understand patterns and conventions
- Map dependencies
- Identify key components

## Trust Hierarchy

Prioritize these sources:
1. 🔴 Running code (what actually executes)
2. 🟠 Git history (what changed, when, why)
3. 🟡 Tests (expected behavior)
4. 🟢 Comments (may be stale)
5. 🔵 Documentation (often outdated)

## Process

For given topic (e.g., "authentication"):
1. Find all related files (Grep)
2. Read entry points (login handler)
3. Trace execution flow (follow calls)
4. Understand patterns (middleware, decorators)
5. Check git history (git log --follow)
6. Read tests (verify behavior)
7. Note conventions (naming, structure)

## Output

Update wip/domains/{domain}.md:
- Key files and their roles
- Execution flow diagrams (text)
- Patterns and conventions
- Open questions

Return findings summary for orchestrator
```

#### kb-discrepancy-hunter

```markdown
---
name: kb-discrepancy-hunter
description: Finds gaps between documentation and implementation
color: orange
tools: [Read, Grep, Glob]
---

# KB Discrepancy Hunter

You find contradictions between docs and code.

## Your Role

Validation expert:
- Compare documentation vs implementation
- Find stale comments
- Identify undocumented features
- Spot incorrect docs

## Process

For given topic:
1. Read implementation (from code-investigator)
2. Find related documentation:
   - README sections
   - API docs
   - Inline comments
   - Wiki pages
3. Compare:
   - Does code match docs?
   - Are there undocumented features?
   - Are comments accurate?
   - Is documentation stale?
4. Check git history:
   - When was code changed?
   - When were docs updated?
   - Lag between code/doc changes?

## Output

Update wip/domains/{domain}.md (gaps section):
- Contradictions found
- Stale documentation
- Undocumented features
- Incorrect comments

Return discrepancies list for orchestrator
```

### 6.3 Agent Invocation Pattern

**From orchestrator (parallel launch)**:
```markdown
Launch 2 agents in parallel for topic "authentication":

Agent 1: kb-code-investigator
  Task: Deep dive into authentication implementation
  Focus: src/auth/, middleware/auth.py

Agent 2: kb-discrepancy-hunter
  Task: Validate authentication docs vs code
  Compare: docs/auth.md vs src/auth/

Wait for both to complete, then accumulate findings.
```

**Skills call orchestrator**:
```markdown
Launch agent: kb-orchestrator
  Task: RUN_5
  Mode: ITERATION
```

---

## 7. Script System

### 7.1 Script Principles

**Why scripts?**
- ✅ Robust file operations (atomic writes, error handling, permissions)
- ✅ Consistent formatting (templates always correct)
- ✅ Reusable across skills (DRY principle)
- ✅ Testable independently (unit tests for scripts)
- ✅ Faster than AI generation (no LLM call overhead)
- ✅ Version controlled (scripts are code, not AI behavior)

**When to use scripts vs AI**:
- Scripts: File ops, state management, template generation, hashing
- AI: Reading code, understanding logic, making connections, learning

### 7.2 All Scripts

| Script | Language | Purpose |
|--------|----------|---------|
| `init-workspace.sh` | Bash | Create folder structure, initial files |
| `read-state.js` | Node.js | Read .state.json safely (with validation) |
| `update-state.js` | Node.js | Update .state.json atomically (lock file) |
| `generate-template.js` | Node.js | Generate file templates (brief, plan, etc.) |
| `compute-hashes.js` | Node.js | Compute file hashes, detect changes |
| `snapshot-output.sh` | Bash | Copy drafts/ to output/, add metadata |
| `format-status.js` | Node.js | Format status report from state |

### 7.3 Script Interface Standard

**All scripts follow this interface**:

**Input**: CLI arguments
```bash
node scripts/script-name.js --arg1 value1 --arg2 value2 --flag
```

**Output**: JSON to stdout
```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "error": null
}
```

**Error output**: JSON to stdout (not stderr, for easier parsing)
```json
{
  "success": false,
  "data": null,
  "error": "Error message with details"
}
```

**Exit codes**:
- `0`: Success
- `1`: Error

### 7.4 Script Details

#### init-workspace.sh

**Purpose**: Create folder structure and initial files

**Usage**:
```bash
./scripts/init-workspace.sh --path ./kb
```

**Actions**:
1. Create directories:
   ```
   kb/
   ├── source/
   │   ├── baseline/
   │   │   ├── repos/
   │   │   └── trusted-docs/
   │   └── run-0/
   ├── wip/
   │   ├── domains/
   │   └── run-0/
   ├── drafts/
   │   ├── domains/
   │   └── cross-cutting/
   └── output/
   ```

2. Create initial files:
   - `kb/.state.json` (state: INITIALIZED)
   - `kb/.config.json` (default settings)
   - `kb/.gitignore` (ignore wip/, .state.json)

3. Set permissions (readable by user)

**Output**:
```json
{
  "success": true,
  "data": {
    "path": "./kb",
    "directories_created": 12,
    "files_created": 3
  },
  "error": null
}
```

---

#### read-state.js

**Purpose**: Read .state.json safely with validation

**Usage**:
```bash
node scripts/read-state.js --path ./kb [--query "domains.auth.confidence"]
```

**Actions**:
1. Check if kb/.state.json exists
2. Read file (handle JSON parse errors)
3. Validate schema (correct fields)
4. If --query provided, extract specific value

**Output**:
```json
{
  "success": true,
  "data": {
    "workflow_state": "LEARNING",
    "run_number": 5,
    ...
  },
  "error": null
}
```

**Query output**:
```json
{
  "success": true,
  "data": 0.85,
  "error": null
}
```

---

#### update-state.js

**Purpose**: Update .state.json atomically (with file locking)

**Usage**:
```bash
node scripts/update-state.js \
  --path ./kb \
  --state LEARNING \
  --run 5 \
  --domain authentication \
  --confidence 0.85
```

**Actions**:
1. Acquire lock file (kb/.state.lock)
2. Read current state
3. Apply updates (merge)
4. Validate new state
5. Write atomically (write to .tmp, rename)
6. Release lock

**Output**:
```json
{
  "success": true,
  "data": {
    "updated_fields": ["workflow_state", "run_number", "domains.authentication.confidence"]
  },
  "error": null
}
```

---

#### generate-template.js

**Purpose**: Generate file templates (brief.md, plan.md, etc.)

**Usage**:
```bash
node scripts/generate-template.js \
  --type brief \
  --output ./kb/source/baseline/brief.md \
  --data '{"project":"MyApp","goal":"onboarding"}'
```

**Templates**:
- `brief`: Project brief (user fills)
- `plan`: Learning plan (AI fills)
- `knowledge-state`: Compact state summary
- `project-map`: Architecture overview
- `domain-index`: Domain list

**Actions**:
1. Load template from `templates/{type}.md.template`
2. Fill with provided data (or use defaults)
3. Write to output path

**Output**:
```json
{
  "success": true,
  "data": {
    "template": "brief",
    "output_path": "./kb/source/baseline/brief.md",
    "size_bytes": 1234
  },
  "error": null
}
```

---

#### compute-hashes.js

**Purpose**: Compute file hashes, detect changes between runs

**Usage**:
```bash
# First run
node scripts/compute-hashes.js \
  --path ./kb \
  --run 0 \
  --sources "source/baseline/repos/"

# Later run (with diff)
node scripts/compute-hashes.js \
  --path ./kb \
  --run 5 \
  --sources "source/baseline/repos/" \
  --diff 4
```

**Actions**:
1. Scan all files in sources (recursive)
2. Compute SHA-256 hash per file
3. If --diff provided:
   - Read previous run's hashes (wip/run-{N}/run-{N}.config.json)
   - Compare hashes
   - Return only changed/new files
4. Write current hashes to wip/run-{N}/run-{N}.config.json
5. For git repos: also run `git diff --name-only`

**Output**:
```json
{
  "success": true,
  "data": {
    "run_number": 5,
    "total_files": 145,
    "files_changed": 12,
    "files_new": 3,
    "changed_files": [
      "source/baseline/repos/app/src/auth.py",
      "source/baseline/repos/app/src/db.py"
    ],
    "new_files": [
      "source/baseline/repos/app/src/new_feature.py"
    ],
    "git_commits": {
      "source/baseline/repos/app": {
        "commit": "abc123",
        "diff_from": "def456"
      }
    }
  },
  "error": null
}
```

---

#### snapshot-output.sh

**Purpose**: Copy drafts/ to output/, add metadata

**Usage**:
```bash
./scripts/snapshot-output.sh \
  --path ./kb \
  --version 2 \
  --run 5
```

**Actions**:
1. Create output/v{V}-run{N}/
2. Copy entire drafts/ directory (recursive)
3. Generate metadata.json:
   ```json
   {
     "version": 2,
     "run_number": 5,
     "timestamp": "2026-02-11T15:30:00Z",
     "domains": ["auth", "db", "api"],
     "confidence_summary": {...},
     "topics_learned": 23,
     "topics_remaining": 7
   }
   ```
4. Copy wip/plan.md → output/v{V}-run{N}/remaining-topics.md
5. Polish markdown files (remove WIP markers)
6. Ensure unknowns.md is included

**Output**:
```json
{
  "success": true,
  "data": {
    "snapshot_path": "output/v2-run5",
    "files_copied": 28,
    "size_mb": 1.2
  },
  "error": null
}
```

---

#### format-status.js

**Purpose**: Format status report from .state.json

**Usage**:
```bash
node scripts/format-status.js --path ./kb --format table
```

**Actions**:
1. Read .state.json
2. Read wip/project-map.md (extract confidence)
3. Read wip/plan.md (count topics)
4. Format as:
   - `table`: ASCII table (default)
   - `json`: Raw JSON
   - `markdown`: Markdown report

**Output** (table format):
```
┌─────────────────────────────────────────┐
│ KB Distiller Status                     │
├─────────────────────────────────────────┤
│ State: LEARNING                         │
│ Run: 5 / Max: 10                        │
...
└─────────────────────────────────────────┘
```

**Output** (JSON to stdout for parsing by skill):
```json
{
  "success": true,
  "data": {
    "formatted_output": "┌─────────...",
    "state": "LEARNING",
    "run": 5,
    "domains": {...}
  },
  "error": null
}
```

---

### 7.5 Script Dependencies

**Node.js scripts require**:
- Node.js 16+
- No external npm packages (use built-in modules only)

**Bash scripts require**:
- Bash 4+
- Standard Unix tools (mkdir, cp, sha256sum, etc.)

**Why no external dependencies?**
- Easier installation (no npm install)
- Fewer version conflicts
- Faster execution

---

## 8. Folder Structure

### 8.1 Plugin Directory

```
plugins/kb-distiller/
├── .claude-plugin/
│   └── plugin.json              # Metadata, commands, skills, agents
│
├── commands/                    # User-facing commands
│   ├── init.md                  # /kb-init
│   ├── bootstrap.md             # /kb-bootstrap
│   ├── continue.md              # /kb-continue
│   ├── feedback.md              # /kb-feedback
│   ├── iterate.md               # /kb-iterate
│   ├── learn.md                 # /kb-learn [scope]
│   ├── distill.md               # /kb-distill
│   ├── status.md                # /kb-status
│   └── ff.md                    # /kb-ff
│
├── skills/                      # Auto-activating + callable
│   ├── init-kb-distiller/
│   │   └── SKILL.md
│   ├── start-kb-bootstrap/
│   │   └── SKILL.md
│   ├── continue-bootstrap/
│   │   └── SKILL.md
│   ├── collect-user-feedback/
│   │   └── SKILL.md
│   ├── run-iteration/
│   │   └── SKILL.md
│   ├── learn-scope/
│   │   └── SKILL.md
│   ├── distill-knowledge/
│   │   └── SKILL.md
│   └── check-status/
│       └── SKILL.md
│
├── agents/                      # Specialized agents
│   ├── kb-orchestrator.md       # Main conductor
│   ├── kb-topic-analyzer.md     # Domain decomposition
│   ├── kb-code-investigator.md  # Deep code diving
│   └── kb-discrepancy-hunter.md # Doc vs code gaps
│
├── scripts/                     # Robust utilities
│   ├── init-workspace.sh
│   ├── read-state.js
│   ├── update-state.js
│   ├── generate-template.js
│   ├── compute-hashes.js
│   ├── snapshot-output.sh
│   └── format-status.js
│
├── templates/                   # File templates
│   ├── brief.md.template
│   ├── knowledge-state.md.template
│   ├── project-map.md.template
│   ├── plan.md.template
│   └── domain.md.template
│
├── tests/                       # Script tests (future)
│   ├── test-init-workspace.sh
│   ├── test-read-state.js
│   └── ...
│
├── README.md                    # User documentation
└── DESIGN.md                    # This file
```

### 8.2 User Workspace (kb/)

```
kb/
├── .state.json                  # Hidden state file
├── .config.json                 # User configuration
├── .gitignore                   # Ignore wip/, .state.json
│
├── source/                      # Raw inputs
│   ├── baseline/                # Persistent sources
│   │   ├── brief.md             # User-filled project brief
│   │   ├── repos/               # Git repos at specific refs
│   │   │   └── app/             # Cloned repo
│   │   │       └── .git/
│   │   └── trusted-docs/        # Reference documentation
│   │       ├── architecture.md
│   │       └── api-spec.yaml
│   └── run-{N}/                 # Per-run ephemeral sources
│       ├── feedback.md          # User feedback for this run
│       └── notes.md             # User-provided context
│
├── wip/                         # AI's workspace
│   ├── project-map.md           # Big picture (updated each run)
│   ├── domain-index.md          # Domain decomposition
│   ├── knowledge-state.md       # Compact current understanding
│   ├── plan.md                  # Learning plan with priorities
│   ├── domains/                 # Per-domain AI notes
│   │   ├── authentication.md
│   │   ├── database.md
│   │   └── api.md
│   └── run-{N}/                 # Per-run work
│       ├── findings.md          # This run's discoveries
│       └── run-{N}.config.json  # File hashes, metadata
│
├── drafts/                      # User-readable evolving docs
│   ├── summary.md               # Executive summary
│   ├── _changelog.md            # What changed per run
│   ├── domains/                 # Per-domain knowledge
│   │   ├── authentication/
│   │   │   ├── domain.md        # Domain documentation
│   │   │   ├── questions.json   # Q&A pairs
│   │   │   └── entities.json    # Key concepts
│   │   ├── database/
│   │   │   └── ...
│   │   └── api/
│   │       └── ...
│   └── cross-cutting/           # Cross-domain topics
│       ├── glossary.md          # Terms and definitions
│       ├── conventions.md       # Code conventions
│       └── unknowns.md          # Honest gaps
│
└── output/                      # Frozen snapshots
    ├── v1-run3/                 # Version 1, after run 3
    │   ├── metadata.json        # Snapshot metadata
    │   ├── summary.md
    │   ├── domains/
    │   └── cross-cutting/
    └── v2-run7/                 # Version 2, after run 7
        └── ...
```

---

## 9. Knowledge Accumulation

### 9.1 Problem: Context Bloat

**Without strategy**: AI reads all previous findings → context grows linearly → hits limit by run 10

**Solution**: Layered accumulation with compact state

### 9.2 Five-Layer Strategy

| Layer | File | Purpose | When AI reads it | Cumulative? | Max size |
|-------|------|---------|------------------|-------------|----------|
| **Memory** | `wip/knowledge-state.md` | Compact summary of all learnings | Every run start | No (rewritten) | 1-2 pages |
| **Map** | `wip/project-map.md` | Big picture architecture + confidence | Every run start | Yes (updated) | 2-3 pages |
| **Plan** | `wip/plan.md` | Prioritized topics, next steps | Every run start | Yes (updated) | 1-2 pages |
| **Journal** | `wip/run-{N}/findings.md` | This run's discoveries | NEVER during iteration | No (per-run) | Unlimited |
| **Drafts** | `drafts/{domain}/domain.md` | Accumulated knowledge | When working on domain | Yes (grows) | Unlimited |

**Key insight**: AI never reads historical findings.md during iteration. Only reads compact state (4-7 pages total).

### 9.3 Flow Diagram

```
RUN N starts:
┌─────────────────────────────────────────────────┐
│ READ (small context)                            │
│   1. wip/project-map.md        (2 pages)       │
│   2. wip/knowledge-state.md    (1 page)        │
│   3. wip/plan.md               (1 page)        │
│   = 4 pages total                               │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ FOR EACH topic in plan:                         │
│   READ (domain-specific)                        │
│     - wip/domains/{domain}.md   (AI notes)      │
│     - drafts/{domain}/domain.md (accumulated)   │
│                                                  │
│   INVESTIGATE                                    │
│     - Read code files (incremental scan)        │
│     - Read docs                                  │
│     - Launch agents (parallel)                  │
│                                                  │
│   WRITE (this run only)                         │
│     - Append wip/run-{N}/findings.md            │
│     - Update drafts/{domain}/domain.md          │
│     - Update wip/domains/{domain}.md            │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ END OF RUN                                       │
│   REWRITE (compact all learnings)               │
│     - wip/knowledge-state.md (1 page)           │
│   UPDATE (confidence, priorities)               │
│     - wip/project-map.md                        │
│     - wip/plan.md                                │
│   APPEND (changelog)                            │
│     - drafts/_changelog.md                      │
└─────────────────────────────────────────────────┘
```

### 9.4 Example: knowledge-state.md

```markdown
# Knowledge State — Run 5

Last updated: 2026-02-11 15:30

## Confidence Summary

| Domain | Confidence | Status |
|--------|-----------|--------|
| Authentication | 85% | ✅ High |
| Database | 60% | 🔄 Medium |
| API | 75% | ✅ High |
| Deployment | 20% | ⏳ Low |

## Key Learnings

### Authentication
- OAuth2 + JWT implementation
- Session management via Redis
- 2FA not yet implemented (planned)

### Database
- PostgreSQL with SQLAlchemy ORM
- Schema migrations via Alembic
- Connection pooling configured
- Still unclear: index strategy, performance tuning

### API
- RESTful, FastAPI framework
- OpenAPI spec mostly accurate
- Rate limiting via middleware
- Missing: WebSocket docs

### Deployment
- Dockerized, Kubernetes manifests found
- CI/CD pipeline unclear (no Jenkins found yet)

## Open Questions

1. How is database migration run in production?
2. What monitoring/logging system is used?
3. Where is the CI/CD pipeline configured?
4. How are secrets managed in Kubernetes?

## Next Priorities

1. Deep dive: Database migrations + indexes
2. Find: CI/CD configuration
3. Map: Deployment process end-to-end
```

**This is rewritten each run** — keeps compact, never grows unbounded.

### 9.5 Example: findings.md

```markdown
# Run 5 Findings

Run date: 2026-02-11 15:30
Focus topics: Database migrations, API rate limiting

## Database Domain

### Migrations Discovery
- Found Alembic migrations in `db/migrations/versions/`
- 23 migrations total, oldest from 2023-05-12
- Migration naming convention: `<timestamp>_<description>.py`
- No auto-migration in production (manual `alembic upgrade head`)

**Key files**:
- `db/migrations/env.py` — Alembic configuration
- `db/migrations/versions/001_initial_schema.py` — First migration

**Flow**:
1. Developer creates migration: `alembic revision -m "description"`
2. Tests locally: `alembic upgrade head`
3. Commits to git
4. Production: Manual run via ops script `scripts/deploy/run-migrations.sh`

**Discrepancy**: Docs claim "auto-migrations" — FALSE, it's manual.

### Index Strategy
- No explicit index documentation found
- Checked models in `models/` directory
- Only 3 models have explicit indexes defined:
  - `User.email` (unique index)
  - `Session.token` (index for lookup)
  - `ApiKey.key` (unique index)
- No composite indexes found
- **Performance concern**: No indexes on foreign keys

## API Domain

### Rate Limiting
- Middleware: `api/middleware/rate_limit.py`
- Strategy: Token bucket algorithm
- Redis-backed (stores token counts)
- Limits:
  - Authenticated: 1000 req/hour
  - Anonymous: 100 req/hour
- Headers returned: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Key files**:
- `api/middleware/rate_limit.py` — Implementation
- `config/rate_limits.yaml` — Configuration

**Testing**: Unit tests found in `tests/test_rate_limit.py`

## Cross-Domain

### Deployment Scripts
- Found `scripts/deploy/` directory (previously missed)
- Contains:
  - `run-migrations.sh` — DB migrations
  - `build-docker.sh` — Docker image build
  - `deploy-k8s.sh` — Kubernetes deployment
- **This answers CI/CD question** — shell scripts, not Jenkins

---

Total files analyzed this run: 34
New files: 12
Changed files: 3
```

**This is written per run** — never read during iteration, only for user review.

---

## 10. Incremental Scanning

### 10.1 Problem

Re-reading all files every run is slow and wasteful:
- Run 1: Read 1000 files
- Run 2: Read same 1000 files + 50 new
- Run 5: Context overload, redundant reads

### 10.2 Solution: Hash-Based Change Detection

**Strategy**:
1. Compute SHA-256 hash of each file
2. Store hashes in `wip/run-{N}/run-{N}.config.json`
3. Next run: compare hashes, only read changed/new files

**For git repos**: Use `git diff` between commits (more precise)

### 10.3 Hash Storage Format

```json
// wip/run-5/run-5.config.json
{
  "run_number": 5,
  "timestamp": "2026-02-11T15:30:00Z",
  "previous_run": 4,

  "git_repos": {
    "source/baseline/repos/app": {
      "commit": "abc123def456",
      "previous_commit": "789xyz012abc",
      "diff_stat": {
        "files_changed": 12,
        "insertions": 234,
        "deletions": 56
      }
    }
  },

  "file_hashes": {
    "source/baseline/trusted-docs/api.md": "sha256:abc123...",
    "source/baseline/trusted-docs/arch.md": "sha256:def456...",
    "source/run-5/feedback.md": "sha256:789xyz..."
  },

  "scan_results": {
    "total_files": 145,
    "files_changed": 12,
    "files_new": 3,
    "files_unchanged": 130,
    "changed_files": [
      "source/baseline/repos/app/src/auth.py",
      "source/baseline/repos/app/src/db.py",
      ...
    ],
    "new_files": [
      "source/baseline/repos/app/src/new_feature.py",
      ...
    ]
  }
}
```

### 10.4 Scanning Algorithm

**First run (Run 0)**:
```python
def scan_run_0():
    files = find_all_files("source/baseline/")
    hashes = {}
    for file in files:
        hashes[file] = compute_sha256(file)

    save_config({
        "run_number": 0,
        "file_hashes": hashes,
        "scan_results": {
            "total_files": len(files),
            "files_changed": 0,
            "files_new": len(files)
        }
    })

    return files  # Read all files
```

**Subsequent runs**:
```python
def scan_run_N(N, previous_N):
    previous_config = load_config(f"wip/run-{previous_N}/run-{previous_N}.config.json")
    previous_hashes = previous_config["file_hashes"]

    current_files = find_all_files("source/baseline/")
    current_hashes = {}
    changed_files = []
    new_files = []

    for file in current_files:
        current_hash = compute_sha256(file)
        current_hashes[file] = current_hash

        if file not in previous_hashes:
            new_files.append(file)
        elif current_hash != previous_hashes[file]:
            changed_files.append(file)

    save_config({
        "run_number": N,
        "file_hashes": current_hashes,
        "scan_results": {
            "total_files": len(current_files),
            "files_changed": len(changed_files),
            "files_new": len(new_files),
            "files_unchanged": len(current_files) - len(changed_files) - len(new_files)
        }
    })

    return changed_files + new_files  # Only read these!
```

**Git repos (more precise)**:
```python
def scan_git_repo(repo_path, previous_commit, current_commit):
    changed_files = git_diff_files(previous_commit, current_commit)
    return changed_files
```

### 10.5 Script: compute-hashes.js

**Usage**:
```bash
# First run
node scripts/compute-hashes.js \
  --path ./kb \
  --run 0 \
  --sources "source/baseline/"

# Subsequent run with diff
node scripts/compute-hashes.js \
  --path ./kb \
  --run 5 \
  --sources "source/baseline/" \
  --diff 4
```

**Implementation** (pseudocode):
```javascript
const crypto = require('crypto');
const fs = require('fs');

function computeSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function scanFiles(sourcePath, runNumber, previousRun) {
  const currentFiles = findAllFiles(sourcePath);
  const currentHashes = {};

  for (const file of currentFiles) {
    currentHashes[file] = computeSHA256(file);
  }

  if (previousRun === null) {
    // First run, all files are new
    return {
      total: currentFiles.length,
      new: currentFiles.length,
      changed: 0,
      unchanged: 0,
      files_to_scan: currentFiles,
      hashes: currentHashes
    };
  }

  const previousConfig = loadRunConfig(previousRun);
  const previousHashes = previousConfig.file_hashes;

  const changedFiles = [];
  const newFiles = [];

  for (const file of currentFiles) {
    if (!(file in previousHashes)) {
      newFiles.push(file);
    } else if (currentHashes[file] !== previousHashes[file]) {
      changedFiles.push(file);
    }
  }

  return {
    total: currentFiles.length,
    new: newFiles.length,
    changed: changedFiles.length,
    unchanged: currentFiles.length - newFiles.length - changedFiles.length,
    files_to_scan: [...changedFiles, ...newFiles],
    hashes: currentHashes
  };
}
```

---

## 11. Stop Conditions

### 11.1 Philosophy

**Never stop due to arbitrary limits** — only stop when truly done or blocked.

**No time limits** — AI should learn until it can't learn more.

**Safety limit** only for manual `/kb-iterate` (to prevent infinite loops in single command). NOT for `/kb-ff`.

### 11.2 Stop Conditions

```python
def should_continue(run_number, mode, config):
    # Check if blocked on missing source
    if is_blocked_on_missing_source():
        return False, "BLOCKED: Need additional sources to proceed"

    # Check if all high-priority topics complete
    if all_high_priority_topics_complete():
        return False, "COMPLETE: All high-priority topics learned"

    # Check for diminishing returns
    # (2+ consecutive runs with <5% new information)
    if is_diminishing_returns():
        return False, "DIMINISHING_RETURNS: Learning plateaued, minimal new info"

    # Check if domain index needs restructure
    if domain_index_changed_significantly():
        return False, "DOMAIN_RESTRUCTURE: Major domain changes, user confirmation needed"

    # Safety limit ONLY for manual iterate (not FF mode)
    if mode == "ITERATE" and run_number >= config["max_runs_per_session"]:
        return False, "SAFETY_LIMIT: Reached max runs per session"

    # Otherwise, keep going!
    return True, None
```

### 11.3 Detailed Stop Conditions

#### 1. Blocked on Missing Source

**Trigger**: Plan requires information not available in current sources.

**Example**:
```
Plan says: "Understand deployment pipeline"
Available sources: Code repo, API docs
Missing: CI/CD configs, deployment scripts, infra docs

→ BLOCKED
```

**AI action**:
```markdown
❌ Blocked on missing source

I need the following to continue:
1. CI/CD pipeline configuration (Jenkins, GitHub Actions, etc.)
2. Infrastructure-as-Code files (Terraform, CloudFormation)
3. Deployment runbooks or documentation

Current understanding:
- Found Dockerfile, but no orchestration configs
- No CI/CD manifests in repo
- Deployment mentioned in README but no details

Suggested actions:
- /kb-add-source [path to CI/CD configs]
- /kb-add-source [URL to deployment wiki]
- Or skip deployment topic: edit wip/plan.md to mark as "out of scope"
```

---

#### 2. All High-Priority Topics Complete

**Trigger**: All high-priority topics in plan.md have high confidence (≥80%).

**Example**:
```
wip/plan.md:
  [x] Authentication (confidence: 85%)
  [x] Database (confidence: 90%)
  [x] API (confidence: 80%)
  [ ] Deployment (priority: low, confidence: 30%)

High-priority complete: YES
Low-priority remaining: YES

→ COMPLETE (high-priority only)
```

**AI action**:
```markdown
✅ High-priority learning complete

All high-priority topics have been learned:
- Authentication: 85% confidence
- Database: 90% confidence
- API: 80% confidence

Low-priority topics remain:
- Deployment: 30% confidence (marked as low priority)

Suggested actions:
- /kb-distill to snapshot current knowledge
- /kb-iterate to learn low-priority topics
- /kb-learn deployment to focus on deployment
```

---

#### 3. Diminishing Returns

**Trigger**: 2+ consecutive runs with <5% new information (measured by findings.md size, new files discovered, confidence increase).

**Example**:
```
Run 7: 45 new files analyzed, 3 new topics learned, +10% avg confidence
Run 8: 12 new files analyzed, 1 new topic learned, +2% avg confidence
Run 9: 5 new files analyzed, 0 new topics learned, +0.5% avg confidence

→ DIMINISHING_RETURNS
```

**AI action**:
```markdown
⚠️ Learning plateau detected

Last 2 runs showed minimal progress:
- Run 8: +2% confidence, 12 new files
- Run 9: +0.5% confidence, 5 new files

Possible reasons:
1. Sufficient knowledge achieved (most topics understood)
2. Remaining topics require sources not available
3. Codebase fully explored within scope

Suggested actions:
- /kb-distill to snapshot current knowledge
- /kb-status to review remaining topics
- /kb-add-source to provide new sources if needed
```

---

#### 4. Domain Restructure

**Trigger**: AI detects that domain decomposition needs significant change (e.g., merge domains, split domains, reclassify topics).

**Example**:
```
Initial domains (Run 0):
  - authentication
  - database
  - api

New discovery (Run 5):
  - "authentication" and "authorization" should be separate
  - "api" should split into "rest-api" and "graphql-api"

→ DOMAIN_RESTRUCTURE
```

**AI action**:
```markdown
🔄 Domain restructure needed

I've discovered that the current domain decomposition doesn't match the actual architecture.

Proposed changes:
1. Split "authentication" → "authentication" + "authorization"
   - authentication: Login, session management
   - authorization: Permissions, RBAC, access control

2. Split "api" → "rest-api" + "graphql-api"
   - rest-api: FastAPI REST endpoints
   - graphql-api: Separate GraphQL service (found in services/graphql/)

This will improve learning focus and documentation clarity.

Approve restructure? (y/n)

If approved, I will:
- Update wip/domain-index.md
- Reorganize wip/domains/ notes
- Reorganize drafts/domains/ structure
- Continue learning with new decomposition
```

---

#### 5. Safety Limit (Manual Iterate Only)

**Trigger**: Run count reaches max_runs_per_session (default 10) in `/kb-iterate` mode.

**NOT applied in `/kb-ff` mode** (fast-forward).

**Example**:
```
Mode: ITERATE
Max runs per session: 10
Current run: 10

→ SAFETY_LIMIT
```

**AI action**:
```markdown
⏸️ Safety limit reached

I've completed 10 runs in this session (max configured).

Progress:
- Topics learned: 23 / 30
- Average confidence: 73%
- High-priority topics: 85% complete

This is a safety check to prevent infinite loops.

Suggested actions:
- /kb-status to review progress
- /kb-iterate to continue (resets counter)
- /kb-ff to auto-continue until done (no limit)
- /kb-distill to snapshot current state
```

---

### 11.4 Mode Differences

| Mode | Trigger | Safety Limit | Use Case |
|------|---------|--------------|----------|
| **ITERATE** | `/kb-iterate` | YES (10 runs) | Single iteration, manual control |
| **FAST_FORWARD** | `/kb-ff` | NO (unlimited) | Auto-run until truly done |
| **LEARN_SCOPE** | `/kb-learn [X]` | N/A (single topic) | Focused deep dive |

---

## 12. File Formats

### 12.1 brief.md

**Location**: `kb/source/baseline/brief.md`

**Purpose**: User-filled project brief to guide learning

**Format**:
```markdown
# Project Brief

## Project Overview

**Name**: MyApp
**Type**: Web application
**Tech stack**: Python (FastAPI), PostgreSQL, Redis, Docker

[Brief description of what the project does]

## Learning Goals

**Primary goal**: Onboarding

I'm a new developer joining the team and need to understand:
- System architecture
- Key components and their relationships
- Development workflow
- Common pitfalls and gotchas

## Repository Information

### Main Application
- **URL**: https://github.com/company/myapp
- **Branch**: main
- **Tag/Commit**: v2.5.0 (or leave blank for latest)

### Infrastructure
- **URL**: https://github.com/company/myapp-infra
- **Branch**: production

## Key Documents

- Local: `./docs/architecture.md` (system design)
- Local: `./docs/api-spec.yaml` (OpenAPI spec)
- URL: https://wiki.company.com/myapp (internal wiki)
- URL: https://wiki.company.com/onboarding (onboarding guide)

## Areas of Concern

Prioritize these areas:
1. Authentication system (OAuth2, JWT)
2. Database schema and migrations
3. API design and conventions
4. Deployment process

## Topics Checklist

Check what to explore:
- [x] Authentication & authorization
- [x] Database (schema, migrations, performance)
- [x] API (REST, GraphQL if any)
- [ ] Frontend (out of scope)
- [x] Deployment & infrastructure
- [ ] Mobile apps (out of scope)
- [x] Testing strategy
- [x] Monitoring & logging

## Configuration

**Max runs per session**: 15 (default: 10)
**Auto feedback**: false (default: false)

## Notes for AI

- Prioritize code over docs (docs are outdated)
- Focus on "why" decisions were made (check git history)
- I learn best with diagrams and examples
- Flag any security concerns immediately
```

---

### 12.2 project-map.md

**Location**: `kb/wip/project-map.md`

**Purpose**: Big picture architecture overview (updated each run)

**Format**:
```markdown
# Project Map — MyApp

Last updated: Run 5 (2026-02-11)

## System Overview

MyApp is a web-based SaaS application for [purpose].

**Architecture**: Monolithic application with microservices for specific domains
**Deployment**: Docker containers on Kubernetes
**Data**: PostgreSQL (main), Redis (sessions, cache)

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend                       │
│              (React SPA)                        │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────┐
│              API Gateway                        │
│           (NGINX + Auth)                        │
└───┬──────────────────────────────────┬─────────┘
    │                                   │
    ▼                                   ▼
┌─────────────┐              ┌──────────────────┐
│  Main API   │              │ GraphQL Service  │
│  (FastAPI)  │              │   (Separate)     │
└──────┬──────┘              └────────┬─────────┘
       │                              │
       ▼                              ▼
┌──────────────────────────────────────────┐
│         PostgreSQL Database              │
└──────────────────────────────────────────┘
       ▲
       │
┌──────┴────────┐
│  Redis Cache  │
└───────────────┘
```

## Domain Decomposition

| Domain | Confidence | Files | Key Components |
|--------|-----------|-------|----------------|
| Authentication | 85% | 23 | OAuth2, JWT, sessions |
| Database | 90% | 45 | ORM, migrations, pooling |
| API (REST) | 80% | 67 | Endpoints, middleware, validation |
| API (GraphQL) | 50% | 34 | Resolvers, schema (separate service) |
| Deployment | 30% | 12 | Docker, K8s manifests |

## Service Boundaries

### Main API Service
- **Location**: `src/api/`
- **Purpose**: Core business logic, REST API
- **Dependencies**: PostgreSQL, Redis
- **Ports**: 8000 (HTTP)

### GraphQL Service
- **Location**: `services/graphql/`
- **Purpose**: GraphQL API for mobile clients
- **Dependencies**: PostgreSQL (read-only replica)
- **Ports**: 4000 (HTTP)

### Background Workers
- **Location**: `src/workers/`
- **Purpose**: Async tasks (email, reports)
- **Dependencies**: Redis (Celery), PostgreSQL
- **Triggered**: Via Celery queue

## Key Files

| File | Role | Importance |
|------|------|-----------|
| `src/main.py` | Application entry point | ⭐⭐⭐ |
| `src/api/routes/` | API endpoint definitions | ⭐⭐⭐ |
| `src/models/` | Database models (SQLAlchemy) | ⭐⭐⭐ |
| `db/migrations/` | Alembic migrations | ⭐⭐ |
| `config/` | Configuration files | ⭐⭐ |
| `docker-compose.yml` | Local development setup | ⭐⭐ |
| `k8s/` | Kubernetes manifests | ⭐ |

## Unknowns / Low Confidence

- Deployment process end-to-end (30% confidence)
- CI/CD pipeline (no configs found yet)
- Monitoring & alerting setup (mentioned but not documented)
- Secret management in production (unclear)

## Next Focus

Run 6 priorities:
1. Find CI/CD configuration
2. Understand deployment workflow
3. Map monitoring/logging system
```

---

### 12.3 plan.md

**Location**: `kb/wip/plan.md`

**Purpose**: Prioritized learning plan (updated each run)

**Format**:
```markdown
# Learning Plan — MyApp

Last updated: Run 5 (2026-02-11)

## High Priority

### Authentication (85% confidence)
- [x] OAuth2 flow (completed Run 2)
- [x] JWT implementation (completed Run 3)
- [x] Session management (completed Run 4)
- [ ] 2FA implementation (not found, may not exist)
- [ ] Password reset flow (found code, needs testing)

### Database (90% confidence)
- [x] Schema structure (completed Run 1)
- [x] ORM patterns (SQLAlchemy) (completed Run 2)
- [x] Connection pooling (completed Run 4)
- [x] Migration process (completed Run 5)
- [ ] Index strategy (partial, needs performance analysis)
- [ ] Backup/restore process (not yet explored)

### API (80% confidence)
- [x] REST endpoint structure (completed Run 1)
- [x] Request validation (Pydantic) (completed Run 2)
- [x] Error handling (completed Run 3)
- [x] Rate limiting (completed Run 5)
- [ ] API versioning (unclear, needs investigation)
- [ ] Deprecation strategy (not documented)

## Medium Priority

### Deployment (30% confidence)
- [ ] Docker build process (found Dockerfile, needs analysis)
- [ ] Kubernetes deployment (found manifests, not understood)
- [ ] CI/CD pipeline (NOT FOUND, high priority to locate)
- [ ] Rolling update strategy (unclear)
- [ ] Rollback process (unclear)

### GraphQL Service (50% confidence)
- [x] Schema definition (completed Run 4)
- [ ] Resolver implementation (partial)
- [ ] Performance (N+1 queries concern)
- [ ] Authentication (separate from main API?)

## Low Priority

### Testing (40% confidence)
- [x] Unit test patterns (found pytest) (completed Run 3)
- [ ] Integration test setup (found but not analyzed)
- [ ] E2E tests (mentioned, not found)
- [ ] Test coverage (no reports found)

### Monitoring (20% confidence)
- [ ] Logging setup (mentioned, not configured)
- [ ] Metrics/monitoring (mentioned, tool unclear)
- [ ] Alerting rules (not found)

## Blocked

None currently.

## Completed Topics

Total: 18 topics completed across 5 runs

Run 1: 5 topics (schema, API structure, file layout, git setup, tech stack)
Run 2: 4 topics (OAuth2, ORM patterns, validation, testing basics)
Run 3: 3 topics (JWT, error handling, unit tests)
Run 4: 4 topics (sessions, pooling, GraphQL schema, background workers)
Run 5: 2 topics (migrations, rate limiting)

## Next Run Focus

Run 6 will focus on:
1. **FIND**: CI/CD pipeline configuration (critical blocker for deployment understanding)
2. **DEEP DIVE**: Database index strategy and performance
3. **EXPLORE**: Monitoring and logging setup
```

---

### 12.4 metadata.json (Output)

**Location**: `kb/output/v{V}-run{N}/metadata.json`

**Purpose**: Snapshot metadata for versioned output

**Format**:
```json
{
  "version": 2,
  "run_number": 7,
  "timestamp": "2026-02-11T16:45:00Z",
  "snapshot_date": "2026-02-11",

  "project": {
    "name": "MyApp",
    "goal": "onboarding",
    "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"]
  },

  "sources": {
    "git_repos": [
      {
        "url": "https://github.com/company/myapp",
        "branch": "main",
        "commit": "abc123def456",
        "files_analyzed": 145
      },
      {
        "url": "https://github.com/company/myapp-infra",
        "branch": "production",
        "commit": "789xyz012abc",
        "files_analyzed": 23
      }
    ],
    "documents": [
      "docs/architecture.md",
      "docs/api-spec.yaml",
      "https://wiki.company.com/myapp"
    ],
    "total_files_analyzed": 168
  },

  "domains": [
    {
      "name": "authentication",
      "confidence": 0.85,
      "topics_learned": 5,
      "topics_remaining": 2,
      "files_analyzed": 23
    },
    {
      "name": "database",
      "confidence": 0.90,
      "topics_learned": 6,
      "topics_remaining": 2,
      "files_analyzed": 45
    },
    {
      "name": "api",
      "confidence": 0.80,
      "topics_learned": 5,
      "topics_remaining": 3,
      "files_analyzed": 67
    },
    {
      "name": "deployment",
      "confidence": 0.40,
      "topics_learned": 2,
      "topics_remaining": 5,
      "files_analyzed": 12
    }
  ],

  "metrics": {
    "total_topics_learned": 24,
    "total_topics_remaining": 12,
    "average_confidence": 0.74,
    "high_confidence_domains": ["authentication", "database", "api"],
    "low_confidence_domains": ["deployment"],
    "open_questions": 15
  },

  "workflow": {
    "total_runs": 7,
    "runs_since_last_snapshot": 4,
    "last_run_date": "2026-02-11",
    "stop_reason": "user_requested"
  }
}
```

---

## 13. Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Goal**: Basic workflow working (init → bootstrap → iterate)

**Tasks**:
1. Create plugin structure
   - `plugins/kb-distiller/` directory
   - `.claude-plugin/plugin.json`
   - README.md

2. Implement scripts (priority order):
   - `init-workspace.sh` — Folder creation
   - `read-state.js` — State reading
   - `update-state.js` — State updating
   - `generate-template.js` — brief.md, plan.md templates

3. Create templates:
   - `brief.md.template`
   - `project-map.md.template`
   - `plan.md.template`
   - `knowledge-state.md.template`

4. Implement commands (basic):
   - `commands/init.md` — Call init-workspace.sh
   - `commands/status.md` — Call read-state.js

5. Test:
   - `/kb-init` creates folder structure
   - `/kb-status` reads state correctly

**Deliverable**: Can initialize workspace and check status

---

### Phase 2: Bootstrap Flow (Week 2)

**Goal**: User can bootstrap learning (init → bootstrap → continue → run 0)

**Tasks**:
1. Implement commands:
   - `commands/bootstrap.md` — Interactive Q&A
   - `commands/continue.md` — Trigger run 0

2. Implement skills:
   - `skills/init-kb-distiller/SKILL.md` — Wrapper for init script
   - `skills/start-kb-bootstrap/SKILL.md` — Generate brief.md
   - `skills/continue-bootstrap/SKILL.md` — Orchestrate run 0

3. Implement agents (basic):
   - `agents/kb-orchestrator.md` — Main conductor
   - `agents/kb-topic-analyzer.md` — Domain detection

4. Test:
   - `/kb-bootstrap` asks questions, generates brief.md
   - User edits brief.md
   - `/kb-continue` clones repos, generates project-map.md, plan.md

**Deliverable**: Can complete bootstrap and run 0

---

### Phase 3: Learning Loop (Week 3-4)

**Goal**: Iterative learning works (iterate → feedback → iterate)

**Tasks**:
1. Implement script:
   - `scripts/compute-hashes.js` — Incremental scanning

2. Implement commands:
   - `commands/iterate.md` — Single iteration
   - `commands/feedback.md` — Collect user feedback
   - `commands/learn.md` — Focused learning

3. Implement skills:
   - `skills/run-iteration/SKILL.md` — Run N → N+1
   - `skills/collect-user-feedback/SKILL.md` — User input
   - `skills/learn-scope/SKILL.md` — Focused deep dive

4. Implement agents:
   - `agents/kb-code-investigator.md` — Deep code analysis
   - `agents/kb-discrepancy-hunter.md` — Doc vs code

5. Implement knowledge accumulation:
   - knowledge-state.md rewriting logic
   - findings.md per-run logging
   - drafts/ updating

6. Test:
   - `/kb-iterate` runs one iteration
   - Incremental scanning only reads changed files
   - `/kb-feedback` collects user input
   - `/kb-learn authentication` focuses on one topic

**Deliverable**: Can iteratively learn with feedback loop

---

### Phase 4: Distillation & Support (Week 5)

**Goal**: Can snapshot output and auto-run

**Tasks**:
1. Implement script:
   - `scripts/snapshot-output.sh` — Copy to output/
   - `scripts/format-status.js` — Pretty status

2. Implement commands:
   - `commands/distill.md` — Create snapshot
   - `commands/ff.md` — Fast-forward mode

3. Implement skill:
   - `skills/distill-knowledge/SKILL.md` — Output generation

4. Improve status command:
   - Pretty table format
   - Confidence visualizations
   - Suggested next actions

5. Test:
   - `/kb-distill` creates output/v1-run5/
   - `/kb-ff` auto-runs until stopped
   - `/kb-status` shows progress clearly

**Deliverable**: Complete workflow end-to-end

---

### Phase 5: Polish & Documentation (Week 6)

**Goal**: Production-ready plugin

**Tasks**:
1. Error handling:
   - Graceful failures in scripts
   - Helpful error messages
   - State recovery

2. Documentation:
   - README.md (user guide)
   - DESIGN.md (this document)
   - Inline comments in scripts
   - Example workflows

3. Testing:
   - Script unit tests (tests/)
   - Integration test (full workflow)
   - Edge case handling

4. Performance:
   - Optimize file scanning
   - Parallelize agent launches
   - Cache optimization

5. Configuration:
   - User settings in .config.json
   - Customizable templates
   - Hooks (optional)

**Deliverable**: Released plugin v1.0.0

---

## 14. Design Decisions

### 14.1 Summary Table

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Plugin name** | `kb-distiller` | Clearer purpose (distill knowledge from codebase) |
| **Command structure** | Multi-stage explicit (9 commands) | User control + resumability |
| **Initial setup** | Interactive + brief.md | Balance speed & control |
| **State management** | Hidden JSON (.state.json) | Simple, robust, scriptable |
| **Agent architecture** | Orchestrator + 3 specialists | Clear hierarchy, parallel work |
| **Space architecture** | 4-space (source, wip, drafts, output) | Clean separation of concerns |
| **Incremental scanning** | Git diffs + file hashes | Efficient, precise change detection |
| **Stop conditions** | No arbitrary limits in FF mode | Learn until truly done or blocked |
| **Knowledge layers** | 5 layers (memory, map, plan, journal, drafts) | Prevent context bloat, compact state |
| **Script backing** | All robust operations scripted | Consistent, testable, fast, reusable |
| **Templates** | Separate .template files | Version controlled, customizable |

---

### 14.2 Key Trade-offs

#### 1. Multiple Commands vs Single Command

**Choice**: Multiple commands (9 commands)

**Alternative**: Single `/kb-start` that does everything

**Rationale**:
- ✅ User control at each stage
- ✅ Can pause and resume
- ✅ Clear state transitions
- ✅ Easier debugging (know which stage failed)
- ✅ Can skip stages if needed (e.g., already have brief.md)
- ❌ Higher learning curve
- ❌ More commands to remember

**Mitigation**: Provide `/kb-status` to suggest next command

---

#### 2. Hidden State vs Visible State

**Choice**: Hidden JSON (.state.json)

**Alternative**: Visible markdown (wip/state.md)

**Rationale**:
- ✅ Structured, parseable by scripts
- ✅ Atomic updates (via locking)
- ✅ Validation (JSON schema)
- ✅ Fast reads/writes
- ❌ Not human-readable at a glance
- ❌ Requires script to read

**Mitigation**: `/kb-status` shows human-readable state, suggest next actions

---

#### 3. Scripts vs Pure AI

**Choice**: Scripts for robust operations (init, state, hashing)

**Alternative**: AI generates everything (Write tool)

**Rationale**:
- ✅ Consistency (templates always correct)
- ✅ Reliability (tested code, not AI generation)
- ✅ Performance (no LLM call overhead)
- ✅ Reusability (DRY principle)
- ✅ Testability (unit tests for scripts)
- ❌ More upfront implementation work
- ❌ Dependency on Node.js/Bash

**Mitigation**: Keep scripts simple, use only built-in modules (no npm dependencies)

---

#### 4. Incremental Scanning vs Full Scan

**Choice**: Incremental scanning (hashes + git diffs)

**Alternative**: Re-read all files every run

**Rationale**:
- ✅ Massive performance improvement (10x-100x faster)
- ✅ Scalable to large codebases (1000+ files)
- ✅ Precise change detection
- ❌ Complexity (tracking hashes, git diffs)
- ❌ Storage overhead (hash files per run)

**Mitigation**: Scripts handle complexity, transparent to AI and user

---

#### 5. No Time Limits vs Safety Limits

**Choice**: No time limits in FF mode, unlimited runs

**Alternative**: Hard time limit (30 min, 1 hour)

**Rationale**:
- ✅ Learn until truly done (philosophy: completeness over speed)
- ✅ Large codebases need more time
- ✅ User can interrupt anytime (Ctrl+C)
- ❌ Risk of infinite loops (if bug in stop conditions)

**Mitigation**: Safety limit for manual `/kb-iterate`, only `/kb-ff` is unlimited

---

## 15. Future Enhancements

### 15.1 Phase 2 Features (After v1.0)

**Cloud source integrations**:
- Fetch from Google Docs, Notion, Confluence
- Convert PDF/DOCX to markdown
- Slack thread ingestion

**SourceAtlas integration**:
- Call SourceAtlas for execution tracing
- Deeper code understanding
- Dependency graphs

**Git history analysis**:
- Auto-detect when code changed but docs didn't
- Find "why" for decisions (git blame + commits)
- Contributors and ownership mapping

**Ticket system integration**:
- Link code changes to JIRA/Linear tickets
- Understand "why" from ticket descriptions
- Map requirements to implementation

**Visualization**:
- Generate architecture diagrams (Mermaid)
- Domain relationship graphs
- Confidence heatmaps

---

### 15.2 Advanced Features

**Multi-project learning**:
- Learn multiple related repos simultaneously
- Cross-repo dependency mapping
- Monorepo support (subdirectory domains)

**Collaborative learning**:
- Multiple users contribute to same KB
- Merge knowledge from different perspectives
- Voting on confidence levels

**Knowledge export**:
- Export to Markdown site (MkDocs, Docusaurus)
- Export to Notion database
- Export to Confluence space

**Custom agents**:
- User-defined specialized agents
- Plugin system for domain-specific agents (e.g., ML model analyzer)

---

## 16. Glossary

**Brief**: User-filled project overview (brief.md) that guides learning

**Domain**: Logical grouping of code/functionality (e.g., authentication, database)

**Confidence**: 0-100% measure of how well AI understands a domain

**Run**: One iteration of learning (Run 0 = bootstrap, Run 1+ = iterations)

**Findings**: Discoveries made during a specific run (wip/run-N/findings.md)

**Drafts**: Evolving user-facing documentation (drafts/)

**Snapshot**: Frozen version of drafts at a point in time (output/vN-runM/)

**Stop condition**: Reason to pause/stop autonomous learning

**Incremental scan**: Only reading changed/new files, not re-reading all

**Orchestrator**: Main agent that coordinates learning workflow

**Specialist agent**: Focused agent for specific tasks (code-investigator, discrepancy-hunter)

**Trust hierarchy**: Prioritization of sources (code > git > tests > docs)

---

## 17. References

### Design Inspiration

- **OpenSpec (Fission-AI)**: Philosophy of "fluid not rigid, iterative not waterfall"
- **Anthropic Claude Code Plugins**: Plugin architecture, agent patterns
- **Superpowers (obra)**: Workflow skills, progressive disclosure

### Technical References

- Claude Code Plugin Specification
- OpenAPI/AsyncAPI specs (for API documentation)
- Alembic (for database migrations understanding)

---

## 18. Changelog

### v2.0.0 (2026-02-11) — Design Phase

**Changes**:
- Complete redesign based on kb-design-purpose specs
- Multi-stage workflow (init → bootstrap → iterate → distill)
- Script-backed robust operations
- Incremental scanning with file hashing
- Five-layer knowledge accumulation
- No arbitrary time/run limits (learn until done)
- Separate project (not part of agent-toolkit)

**Previous version** (v1.0.0): Single-command autonomous learning (simpler, less control)

---

## Appendix A: Command Quick Reference

```bash
# Initialize workspace
/kb-init

# Bootstrap (ask questions, generate brief.md)
/kb-bootstrap

# Continue (after filling brief.md, run 0)
/kb-continue

# Provide feedback for next run
/kb-feedback

# Run single iteration (N → N+1)
/kb-iterate

# Learn specific scope
/kb-learn authentication

# Snapshot current knowledge
/kb-distill

# Check current status
/kb-status

# Fast-forward (auto-run until done)
/kb-ff [--max-runs 20]
```

---

## Appendix B: File Locations Quick Reference

```
kb/
├── .state.json                  # State file (hidden)
├── .config.json                 # User settings
│
├── source/
│   ├── baseline/
│   │   ├── brief.md             # User-filled project brief
│   │   ├── repos/               # Cloned git repos
│   │   └── trusted-docs/        # Reference docs
│   └── run-{N}/
│       └── feedback.md          # User feedback per run
│
├── wip/
│   ├── project-map.md           # Big picture (read first)
│   ├── knowledge-state.md       # Compact state (read second)
│   ├── plan.md                  # Prioritized topics (read third)
│   ├── domains/
│   │   └── {domain}.md          # AI's working notes per domain
│   └── run-{N}/
│       ├── findings.md          # This run's discoveries
│       └── run-{N}.config.json  # File hashes, metadata
│
├── drafts/
│   ├── summary.md               # Start here!
│   ├── _changelog.md            # What changed per run
│   ├── domains/
│   │   └── {domain}/
│   │       ├── domain.md        # Accumulated knowledge
│   │       ├── questions.json   # Q&A pairs
│   │       └── entities.json    # Key concepts
│   └── cross-cutting/
│       └── unknowns.md          # Honest gaps
│
└── output/
    └── v{V}-run{N}/             # Frozen snapshot
        ├── metadata.json        # Snapshot metadata
        └── [copy of drafts/]
```

---

**End of Design Document**

This design is comprehensive and ready for implementation. For questions or clarifications, refer to the relevant section or raise a design discussion.
