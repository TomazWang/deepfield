# Deepfield - Project Context for Claude Code

## ⚠️ CRITICAL: This is a Plugin Development Project

**YOU ARE DEVELOPING A CLAUDE CODE PLUGIN, NOT USING ONE.**

- **Plugin source code**: `./plugin/` directory (commands, skills, agents)
- **CLI source code**: `./cli/` directory (TypeScript CLI tool)
- **DO NOT run /df-* commands in this project** - they will fail or behave incorrectly
- **DO edit files in ./plugin/** to update the plugin being developed
- **DO edit files in ./cli/** to update the CLI tool

When the user says "update the plugin" or "fix the command", edit files in `./plugin/`, NOT `./.claude/plugins/`.

## Project Overview

**Deepfield** is an AI-driven knowledge base builder for Claude Code that iteratively learns codebases and distills institutional knowledge. It helps developers understand brownfield projects through autonomous, iterative learning.

This repository contains:
1. **Claude Code Plugin** (`./plugin/`) - Commands, skills, and agents for Claude Code
2. **CLI Tool** (`./cli/`) - Standalone Node.js CLI for project initialization and configuration

## Project Terminology

**1. Deepfield (this project):**
- This development repository
- Path: `~/dev/workspace/mine/deepfield/`
- Contains: `plugin/` (commands, skills, agents) + `cli/` (support tools)
- **YOU ARE HERE** - developing the plugin

**2. Target project:**
- The codebase the user wants to learn about
- Example: User's e-commerce app, legacy system, etc.
- Deepfield analyzes this to build knowledge base

**3. Workspace:**
- The `deepfield/` directory created by `/df-init`
- Contains all analysis, findings, drafts, AND the target project source code
- Structure:
  ```
  working-directory/           ← Where user runs deepfield commands
    ├── deepfield/             ← Workspace (created by /df-init)
    │   ├── brief.md
    │   ├── project.config.json
    │   ├── DEEPFIELD.md       (optional config)
    │   ├── source/
    │   │   ├── baseline/
    │   │   │   ├── my-app/    ← Target project cloned here
    │   │   │   ├── docs/      ← Additional documentation
    │   │   │   └── ...
    │   │   └── run-N-staging/ ← Per-run source additions
    │   ├── wip/               ← AI workspace
    │   │   ├── domain-index.md
    │   │   ├── learning-plan.md
    │   │   ├── confidence-scores.md
    │   │   └── run-N/         ← Per-run findings
    │   ├── drafts/            ← Living documentation
    │   │   ├── domains/       ← Per-domain docs
    │   │   ├── cross-cutting/ ← Cross-cutting concerns
    │   │   │   ├── terminology.md
    │   │   │   └── unknowns.md
    │   │   └── _changelog.md
    │   └── output/            ← Versioned snapshots
    └── ... (other user files, unrelated to deepfield)
  ```

**4. Plugin installation:**
- Production: `~/.claude/plugins/deepfield/` (from marketplace or manual install)
- The plugin code users run (NOT this development repo)

## Development vs Production

**When developing (YOU):**
- Edit files in `./plugin/` and `./cli/`
- DO NOT run `/df-*` commands in this deepfield repo
- DO NOT symlink `~/.claude/plugins/deepfield` to this repo
- Test by acting like production (see Testing section below)

**When users use it (Production):**
- Plugin installed at `~/.claude/plugins/deepfield/`
- User navigates to their target project
- Runs `deepfield init` to create workspace
- Runs `/df-bootstrap`, `/df-iterate` to analyze their code
- Runs `deepfield upgrade` when plugin updates

## Testing Approach

**Test like production, not with symlinks:**

```bash
# Option 1: Install plugin to test location
cp -r plugin/ ~/test-deepfield-plugin/
claude --plugin-dir ~/test-deepfield-plugin

# Option 2: Use separate Claude profile
# Install plugin properly, test in real target project

# Navigate to a test target project
cd ~/test-projects/sample-ecommerce

# Run deepfield commands
deepfield init
/df-bootstrap
/df-iterate
```

**DO NOT:**
- Symlink `~/.claude/plugins/deepfield` to this repo
- Run `/df-*` commands inside this deepfield development repo
- Mix development and testing environments

## Upgrade System Architecture

**Approach: AI-based upgrades, not hard-coded migrations**

### When Plugin Updates

1. User updates plugin (marketplace or manual)
2. New commands/skills/agents available at `~/.claude/plugins/deepfield/`
3. User's existing workspace has old structure
4. User runs `deepfield upgrade`

### Upgrade Flow

**CLI role (non-AI):**
- Detect version mismatch
- Create backup
- Call AI skill with context (old vs new structure)
- Provide helper functions to AI
- Validate result
- Update version

**AI skill role (intelligence):**
- Analyze workspace differences
- Determine what needs to change
- Use CLI helpers for operations
- Adapt to variations in structure

**Example:**
```bash
deepfield upgrade

# CLI does:
1. Detect versions (workspace v1.0 vs plugin v2.5)
2. Create backup
3. Call skill: deepfield:upgrade-workspace
4. Provide helpers (create-from-template, move-file, etc.)
5. Validate upgraded workspace
6. Update workspace version

# AI skill does:
1. Read current workspace structure
2. Compare with target version structure
3. Determine missing files/directories
4. Use CLI helpers to apply changes
5. Report what was done
```

**Key principles:**
- ❌ NO hard-coded migration scripts
- ✅ AI analyzes and adapts
- ✅ CLI provides robust helpers
- ✅ Just document structure changes as versions evolve

## Core Concept

User provides sources (code, docs, wikis, etc.) → AI reads, learns, connects dots, identifies gaps → User provides more sources or feedback → Repeat until knowledge is sufficient → Output structured documentation.

## Architecture Principles

### Command → Skill → Script → Agent Pattern

```
User Input
  ↓
Command (df-*)
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

### Four-Space Architecture

| Space | Purpose | Who Writes |
|-------|---------|-----------|
| `source/` | Raw inputs — baseline (persistent) + per-run (ephemeral) | User + AI (classification) |
| `wip/` | AI's private workspace — notes, maps, plans, learning state | AI only |
| `drafts/` | Living documents that evolve each run — user-readable | AI writes, user reviews |
| `output/` | Frozen versioned snapshots of drafts | AI (on command) |

## Design Philosophy

1. **Iterative learning**: Multi-run autonomous learning with user feedback loops
2. **Domain decomposition**: Auto-detects project domains and focuses learning per domain
3. **Trust hierarchy**: Prioritizes running code > git history > tickets > tests > comments > docs
4. **Incremental scanning**: Only reads changed/new files across runs
5. **Honest gaps**: Always documents what it doesn't know (unknowns.md)
6. **Versioned snapshots**: Freeze knowledge at any point, continue learning after
7. **Script-backed robustness**: Critical operations use tested scripts, not AI generation

## Commands (df-* prefix)

| Command | Purpose | AI Involvement |
|---------|---------|---------------|
| `/df-init` | Create folder structure + empty configs | None (scaffolding) |
| `/df-start` | Generate brief.md for user to fill | Interactive Q&A |
| `/df-bootstrap` | Initial classification, scan, plan (Run 0) | Semi-autonomous |
| `/df-input` | Add and classify new sources | Classification + filing |
| `/df-iterate` | Run autonomous learning cycles | Fully autonomous |
| `/df-status` | Show current state summary | Read-only |
| `/df-output` | Snapshot drafts to versioned output | Copy + optional polish |

## Implementation Approach

### Use OpenSpec Workflow

This project follows the OpenSpec experimental artifact workflow:

1. **Explore**: Think through ideas, investigate problems, clarify requirements
2. **New Change**: Create structured change with spec → plan → tasks
3. **Apply**: Implement tasks from the change
4. **Verify**: Validate implementation matches artifacts
5. **Archive**: Finalize and archive when complete

### Start with `/opsx:explore`

Before implementing, use `/opsx:explore` to:
- Validate the design decisions
- Identify potential challenges
- Clarify requirements and scope
- Think through the architecture

### Component Development Order

1. **Phase 1: Foundation**
   - Plugin structure and manifest
   - Core scripts for file operations
   - State management utilities

2. **Phase 2: Commands**
   - `/df-init` (scaffolding)
   - `/df-start` (interactive setup)
   - `/df-status` (read-only)

3. **Phase 3: Skills & Agents**
   - Source classifier skill
   - Incremental scanner skill
   - Learning agent
   - Plan agent

4. **Phase 4: Learning Loop**
   - `/df-bootstrap` (Run 0)
   - `/df-input` (source addition)
   - `/df-iterate` (autonomous learning)
   - Knowledge accumulation logic

5. **Phase 5: Output**
   - `/df-output` (snapshot)
   - Draft generator skill
   - Knowledge synthesizer skill

## Plugin vs CLI Guidelines

### One-Way Dependency Rule

> **Architectural Invariant — not a guideline.**
>
> **The Plugin MAY invoke the CLI. The CLI SHALL NEVER invoke or depend on the Plugin.**

This rule exists because:

- **Headless environments**: The CLI runs in CI pipelines and terminals where Claude Code is absent. Any CLI code that calls back into the plugin would break in these environments.
- **Circular dependency prevention**: The Plugin is built on top of the CLI for deterministic work. Allowing the reverse direction creates a circular dependency between the two layers.
- **Determinism boundary**: The CLI is a predictable, testable Node.js process. The Plugin is a non-deterministic AI runtime. Coupling the CLI to the Plugin contaminates the deterministic layer.

Code review MUST reject any CLI code that imports, shells out to, or otherwise depends on plugin-layer artifacts.

### Decision Tree

Use this four-question tree to classify any feature as Plugin-only, CLI-only, or Hybrid. Answer the questions in order — stop at the first decisive answer.

**Q1: Does the feature require AI reasoning, natural-language interpretation, or access to Claude's context window?**
- Yes → **Plugin-only.** The CLI has no AI access.
- No → continue to Q2.

**Q2: Must the feature work in a headless environment (CI, terminal, no Claude Code running)?**
- Yes → **CLI-only.** Plugin code cannot run without Claude Code.
- No → continue to Q3.

**Q3: Is the operation deterministic and repeatable — same input always produces same output?**
- No (output varies by AI judgment) → **Plugin-only.**
- Yes → continue to Q4.

**Q4: Does the operation write files or mutate persistent state?**
- Yes, and the operation is purely mechanical (scaffold, copy, hash, write JSON) → **CLI-only.** Use a script.
- Yes, but the content depends on AI interpretation → **Hybrid.** Plugin decides content; CLI script performs the write.
- No → **CLI-only** for simple queries, **Plugin-only** if output requires AI synthesis.

**If none of the above gives a clear answer:** Default to CLI for anything deterministic and Plugin for anything that requires AI judgment. Propose new criteria via an openspec change.

### Classification Examples

| Feature | Classification | Decisive criterion |
|---------|---------------|-------------------|
| `/df-init` folder scaffolding | CLI-only | Deterministic; mechanical file creation; must work headlessly |
| `deepfield status` project state display | CLI-only | Deterministic; reads JSON and reports; no AI needed |
| Source classifier (type + trust inference) | Plugin-only | Requires AI reasoning to interpret file content |
| Learning agent (gap analysis, synthesis) | Plugin-only | Requires AI; non-deterministic by design |
| `/df-input` source filing | Hybrid | Classification needs AI; file copy + manifest write are CLI |
| `/df-bootstrap` initial scan + plan | Hybrid | Domain detection needs AI; folder creation + hash recording are CLI |

### Hybrid Ownership Boundaries

When a feature is Hybrid, the boundary is always: **Plugin skill calls CLI helper.** The reverse direction is prohibited by the One-Way Dependency Rule.

For `/df-input` (the canonical hybrid example):

| Concern | Owner | Why |
|---------|-------|-----|
| Parse command arguments | Plugin command | Entry point lives in plugin layer |
| Classify source type and trust level | Plugin (classifier agent) | Requires AI reasoning |
| Clone git repository | CLI script (`clone-repos.sh`) | Deterministic; must work headlessly |
| Copy local files to destination | Plugin via `cp` shell call | Simple; no CLI wrapper needed |
| Write/update `sources.json` manifest | CLI script (`update-json.js`) | Atomic write; deterministic; testable |
| Display result summary to user | Plugin command | Output is conversational, in Claude Code context |
| Suggest next action | Plugin command | Context-aware; depends on session state |

The Plugin skill invokes CLI scripts for the deterministic steps. The CLI scripts know nothing about the Plugin that called them.

## Development Guidelines

### Plugin vs CLI Architecture Decision

**CRITICAL: When adding new features, decide where they belong.**

#### Plugin (AI-Driven) - `./plugin/`

**Use plugin for:**
- Commands requiring AI reasoning (`/df-iterate`, `/df-bootstrap`)
- Skills orchestrating AI workflows
- Agents for deep analysis, learning, synthesis
- Operations needing context understanding
- Decisions requiring judgment

**Examples:**
- `/df-iterate` - AI learns and analyzes codebase
- `/df-bootstrap` - AI classifies sources
- `deepfield-learner` agent - Deep analysis
- `deepfield-term-extractor` - Extract terminology (requires understanding)

**Location:** `plugin/commands/`, `plugin/skills/`, `plugin/agents/`

#### CLI (Non-AI, Robust) - `./cli/`

**Use CLI for:**
- Deterministic file operations
- Project scaffolding/initialization
- Configuration management
- State validation
- Atomic file operations (create, move, rename)
- Template application
- Helper scripts for plugin to use

**Examples:**
- `deepfield init` - Create workspace structure
- `deepfield upgrade` - Orchestrate workspace migration (calls AI skill)
- `deepfield status` - Display state
- Backup/restore utilities
- File operation helpers

**Location:** `cli/src/commands/`, `cli/src/utils/`

**IMPORTANT:** CLI should NEVER invoke AI directly. It can call plugin skills which use AI.

#### Hybrid Pattern (Both)

**Use both when:**
- Need robust scaffolding + AI analysis
- Want separation: orchestration (CLI) vs intelligence (AI)

**Pattern:**
```
1. Plugin command (orchestration)
2. Plugin skill (workflow)
3. CLI scripts (file ops) + AI agents (intelligence)
4. Results combined
```

**Example - `/df-bootstrap`:**
- Plugin: Orchestration, AI classification
- CLI: Create directories, apply templates
- AI agents: Analyze and organize

#### Decision Tree

```
Is operation deterministic (same input → same output)?
├─ Yes → CLI
│   └─ Examples: create dirs, copy templates, validate JSON
│
└─ No → Plugin
    ├─ Requires AI reasoning?
    │   └─ Yes → Plugin (skill/agent)
    │
    └─ Requires context understanding?
        └─ Yes → Plugin (skill/agent)

Needs both?
└─ Plugin orchestrates, CLI executes
```

#### Workspace Upgrade Example

**Correct approach (AI-based):**
```
deepfield upgrade

1. CLI: Detect versions, create backup
2. CLI: Call plugin skill with context
3. Plugin skill (AI): Analyze diff, determine changes
4. Plugin skill (AI): Use CLI helpers for operations
5. CLI: Validate result, update version
```

**CLI provides:** Orchestration, helpers, validation
**AI provides:** Intelligence, adaptation, decision-making

### Temporary Working Files

- If temporary files are needed during development (for example: status summaries, scratch notes, or files used to communicate with the user), create them under `dev-support/wip/`
- Do not leave resolved temporary files in `dev-support/wip/`
- When a temporary file is resolved/completed, move it to `dev-support/archive/`

### When Writing Commands

- Commands are user-facing entry points
- Parse arguments and validate state first
- Delegate orchestration to skills
- Keep commands thin - business logic goes in skills

### When Writing Skills

- Skills orchestrate workflows
- Call scripts for file operations (never generate file content in skills)
- Launch agents for deep AI work
- Keep skills focused on a single capability

### When Writing Scripts

- Scripts handle all file operations
- Must be atomic (write to temp, then rename)
- Use templates for consistency
- Must be testable independently
- Prefer shell scripts for simple ops, Node.js for complex logic

### When Writing Agents

- Agents are specialized AI workers
- Each agent has a focused expertise
- Agents can be launched in parallel
- Agents read from wip/, write findings back

## Key Design Decisions

### Incremental Scanning

Each run tracks file hashes in `run-N.config.json`. Scanner diffs hashes between runs and only reads what changed or is new.

### Knowledge Accumulation (Layered)

Three layers prevent context overload:

- **`findings.md`** (per-run): Only this run's discoveries
- **`knowledge-state.md`** (rewritten each run): AI's working memory
- **`{topic}.md` drafts** (cumulative): Actual accumulated knowledge

### Autonomous Execution

`/df-iterate` runs multiple cycles by default until stop condition:

1. **Blocked**: Needs unavailable source
2. **Diminishing returns**: 2+ runs with minimal findings
3. **Coverage reached**: All topics at high confidence
4. **Safety limit**: Max consecutive runs (default: 5)
5. **Domain restructure**: Significant changes need user confirmation

### Honest Gaps

`drafts/cross-cutting/unknowns.md` explicitly states what the KB doesn't cover, contradictions, and what sources would help. This makes output trustworthy.

## Release Workflow

**Trunk-based, CI tag-triggered releases. Main is always `0.0.0-dev`.**

- Version files on main are permanently `0.0.0-dev` — never bump them
- Real semver only lives on `release/X.Y.Z` branches and git tags

### Cutting a release

```bash
git checkout main && git pull
git checkout -b release/0.6.0
git push origin release/0.6.0
# CI runs automatically:
#   1. Sets all 4 version files to "0.6.0"
#   2. Rebuilds CLI
#   3. Commits + pushes release branch
#   4. Tags v0.6.0 and moves latest tag
```

### How marketplace updates work

- `marketplace.json` on main has `ref: "latest"` — never changes
- `latest` tag moves on each release → users pick it up via `/plugin marketplace update`

### CI files

- `.github/workflows/release.yml` — triggered by `push to release/**`
- `.github/workflows/version-check.yml` — excludes `main` and `release/**`; runs on feature branches + PRs to main

## Current Status

**Version**: 2.0.0
**Phase**: Design Complete - Ready for Implementation
**Next Steps**: Start with `/opsx:explore` to validate design and prepare for implementation

## Design Documentation

Full design documentation in `kb-design-purpose/`:

- `DESIGN.md` - Complete 84KB design document
- `components.md` - Component architecture
- `workflow.md` - Workflow and state machine
- `stages.md` - Stage definitions
- `design-decisions.md` - Key architectural decisions
- `folder-structure.md` - Directory structure

## Working with Claude

### Preferred Workflow

1. Use `/opsx:explore` for thinking through features
2. Use `/opsx:new` to create structured changes
3. Use `/opsx:apply` to implement tasks
4. Use `/opsx:verify` before archiving
5. Use `/opsx:archive` when complete

### Communication Style

- Be direct and concise
- Focus on implementation details
- Ask clarifying questions when design is ambiguous
- Suggest improvements when you spot issues
- Always reference line numbers when discussing code

### No Over-Engineering

- Only implement what's specified
- Don't add features beyond requirements
- Don't add unnecessary abstractions
- Keep it simple and focused
- Trust the design unless there's a clear issue
