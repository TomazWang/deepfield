# Deepfield

**An AI-driven knowledge base builder for understanding brownfield projects.**

## Overview

Deepfield is a monorepo containing:
- **CLI Tool**: Standalone command-line tool for universal knowledge base management
- **Claude Code Plugin**: AI-assisted integration wrapping the CLI with specialized skills

Together, they help you understand brownfield projects through structured exploration. Feed it sources (code, docs, wikis, tickets) and it will:

- **Learn iteratively**: AI reads, connects dots, identifies gaps → you provide more sources or feedback → repeat until knowledge is sufficient
- **Decompose domains**: Auto-detects project domains and focuses learning per domain
- **Trust hierarchically**: Prioritizes running code > git history > tickets > tests > comments > docs
- **Scan incrementally**: Only reads changed/new files across runs
- **Document gaps honestly**: Always documents what it doesn't know (`unknowns.md`)
- **Freeze snapshots**: Version knowledge at any point, continue learning after
- **Use robust scripts**: Critical operations use tested scripts, not AI generation

## Use Cases

| Scenario | Primary Sources | Focus |
|----------|----------------|-------|
| Legacy codebase takeover | Git repo, old wiki, tribal knowledge | Architecture, data flow, deployment |
| New team onboarding | Internal docs, repo, meeting notes | Glossary, conventions, business logic |
| Vendor system integration | API docs, SDK, sample code | API surface, auth, error handling |
| Compliance audit | Policy docs, codebase, configs | Data flow, access controls, PII |
| Monolith decomposition | Monorepo, DB schemas, configs | Domain boundaries, coupling, state |

## Installation

### Prerequisites

- **Node.js 18+** and npm
- Git (optional, for git repository features)

### CLI Only (Universal Usage)

Install the CLI globally:

```bash
npm install -g deepfield
```

Or install locally in a project:

```bash
npm install --save-dev deepfield
```

### With Claude Code Plugin

1. **Install CLI** (see above)

2. **Link plugin to Claude Code**:

```bash
# Clone or navigate to deepfield repo
cd deepfield

# Build the project
npm install
npm run build

# Link plugin to Claude Code
ln -s $(pwd)/plugin ~/.claude/plugins/deepfield
```

3. **Restart Claude Code** to load the plugin

## Quick Start

### Using the CLI

```bash
# Initialize knowledge base structure
deepfield init

# Configure your project interactively
deepfield start

# Check current status
deepfield status
```

### Using Claude Code Commands

```
/df-init    - Initialize deepfield/ directory
/df-start   - Start interactive project setup
/df-status  - Display current state
```

## Commands

### `deepfield init` (or `df init`)

Initialize the deepfield/ directory structure:

- `source/` - Source materials and baselines
- `wip/` - Work in progress (active runs)
- `drafts/` - Draft documents and notes
- `output/` - Final knowledge base artifacts

**Options:**
- `-f, --force` - Overwrite existing files
- `-y, --yes` - Skip confirmation prompts

### `deepfield start` (or `df start`)

Run interactive setup to configure your project:

- Asks about project type (legacy, onboarding, documentation, etc.)
- Collects project goals and focus areas
- Creates `project.config.json`
- Pre-fills `brief.md` template

### `deepfield status` (or `df status`)

Display current project state:

- Workflow state (EMPTY, INITIALIZED, CONFIGURED, READY, etc.)
- Project information (name, goal, focus areas)
- Last modified timestamp
- Suggested next action

**Options:**
- `-v, --verbose` - Show detailed information

## Architecture

### Four-Space Design

```
source/     → Raw inputs (baseline + per-run)
wip/        → AI's private workspace (notes, maps, plans)
drafts/     → Living documents that evolve each run
output/     → Frozen versioned snapshots
```

### Command → Skill → Script → Agent Pattern

```
User Input
  ↓
Command (df-init, df-start, df-iterate, etc.)
  ↓
Skill (orchestrates workflow)
  ↓
Script (robust file operations)
  ↓
Agent (specialized AI workers)
```

## Quick Start

```bash
# Phase 1 (Foundation) - IMPLEMENTED ✅
/df-init      # Initialize the knowledge base structure
/df-start     # Interactive Q&A and brief.md generation
/df-status    # Check current state

# Phase 2+ (Learning) - COMING SOON
/df-bootstrap # Bootstrap the learning process
/df-input     # Add sources
/df-iterate   # Run autonomous learning cycles
/df-output    # Snapshot current knowledge
```

## Implementation Status

### Phase 1: Foundation ✅ **COMPLETE**

The foundation is fully implemented and ready to use:

- ✅ Plugin structure (`plugin.json`, directory layout)
- ✅ Core scripts (file operations, state management, hashing)
- ✅ Commands: `/df-init`, `/df-start`, `/df-status`
- ✅ Templates (project.config.json, brief.md, etc.)
- ✅ Four-space directory architecture
- ✅ Atomic file operations (write-to-temp-then-rename)
- ✅ JSON state management with validation
- ✅ File hashing utilities (git blob + MD5)

**What you can do now:**
1. Initialize a knowledge base (`/df-init`)
2. Set up your project interactively (`/df-start`)
3. Fill out the generated brief.md
4. Check status anytime (`/df-status`)

### Phase 2: Manual Learning 🚧 **PLANNED**

Coming next:
- `/df-bootstrap` - Initial scan and domain detection
- `/df-input` - Add and classify sources
- Incremental scanner skill
- Basic learning workflows

### Phase 3+: Autonomous Iteration 📋 **FUTURE**

Future phases:
- `/df-iterate` - Autonomous learning cycles
- Stop conditions and metrics
- Knowledge synthesis
- `/df-output` - Versioned snapshots

## Installation

Install as a Claude Code plugin:

```bash
# Clone or copy the plugin to your Claude plugins directory
cp -r .claude/plugins/deepfield ~/.claude/plugins/

# Or create a symlink for development
ln -s $(pwd)/.claude/plugins/deepfield ~/.claude/plugins/deepfield
```

**Requirements:**
- Node.js v16+ (for JSON manipulation scripts)
- Bash shell (for scaffolding scripts)

## Commands

### Phase 1 Commands (Implemented ✅)

| Command | Purpose | Usage |
|---------|---------|-------|
| `/df-init` | Create kb/ directory with four-space architecture | Run once to initialize |
| `/df-start` | Interactive Q&A + generate brief.md for user to fill | Run once after init |
| `/df-status` | Display current state and suggest next actions | Run anytime to check progress |

**Example workflow:**
```bash
/df-init                    # Creates ./kb/ with structure
/df-start                   # Asks questions, generates brief.md
# (Fill out kb/source/baseline/brief.md)
/df-status                  # Check state: "BRIEF_CREATED"
```

### Phase 2+ Commands (Planned)

| Command | Purpose | When |
|---------|---------|------|
| `/df-bootstrap` | Classify sources, initial scan, generate first plan | Once (Run 0) |
| `/df-input` | Add source → AI classifies → files appropriately | Anytime |
| `/df-iterate` | Run autonomous learning loop until stop condition | Anytime |
| `/df-output` | Snapshot `drafts/` → `output/v{N}/` | Anytime |

### Command Details

#### `/df-init`

Creates the complete kb/ directory structure:

```
kb/
├── source/baseline/    # Persistent sources (repos, trusted docs)
├── source/run-N/       # Per-run ephemeral sources
├── wip/                # AI's workspace (maps, plans, findings)
├── drafts/             # Living documents that evolve
└── output/             # Frozen versioned snapshots
```

**Features:**
- Idempotent (safe to run multiple times)
- Permission checking before scaffolding
- Copies template files (project.config.json, brief.md, etc.)

**Example:**
```bash
/df-init
# ✅ Knowledge base initialized at: ./kb/
# Next: Run /df-start to begin setup
```

#### `/df-start`

Interactive setup that:
1. Asks essential questions about your project
2. Generates `kb/source/baseline/brief.md` with answers prefilled
3. Creates `kb/project.config.json` with timestamps

**Questions asked:**
- What is this project? (legacy takeover, onboarding, integration, etc.)
- What's your goal for this KB? (architecture docs, onboarding, audit, etc.)
- Any specific areas of concern? (auth, data flow, APIs, deployment, etc.)

**Features:**
- Resumable (detects existing brief.md and prompts for action)
- Validates kb/ exists (requires /df-init first)
- Generates comprehensive brief.md template for you to fill out

**Example:**
```bash
/df-start
# Q: What is this project?
# A: Legacy codebase I'm taking over
# Q: What's your goal?
# A: Understand architecture and data flow
# ✅ Brief created at: kb/source/baseline/brief.md
# Next: Fill out the brief, then run /df-bootstrap (Phase 2)
```

#### `/df-status`

Displays current knowledge base state:
- Project name and goal
- Current workflow state (EMPTY, INITIALIZED, BRIEF_CREATED, etc.)
- Run count (Phase 2+)
- Last modified timestamp
- Suggested next action

**Flags:**
- `--verbose`: Show detailed information (all config, source files, run history)

**Features:**
- Detects state from file existence
- Handles missing/corrupted state files gracefully
- Suggests appropriate next command

**Example:**
```bash
/df-status
# 📊 Deepfield Knowledge Base Status
# Project:        Legacy Rails App
# Goal:           Understand architecture and data flow
# State:          BRIEF_CREATED
# Last modified:  2026-02-11T18:30:00Z
# Next step:      Fill out brief.md, then run /df-bootstrap

/df-status --verbose
# (Shows all config fields, source counts, run history)
```

## KB Directory Structure

After running `/df-init`, your `kb/` directory contains:

```
kb/
├── project.config.json         # Project configuration and metadata
├── source/                     # Raw inputs
│   ├── baseline/               # Persistent sources
│   │   ├── brief.md            # User-filled project brief
│   │   ├── repos/              # Cloned git repositories
│   │   └── trusted-docs/       # Reference documentation
│   └── run-N/                  # Per-run ephemeral sources
├── wip/                        # AI's private workspace
│   ├── project-map.md          # Living system overview
│   ├── domain-index.md         # Domain decomposition
│   └── run-N/                  # Per-run working files
│       ├── run-N.config.json   # Run metadata + file hashes
│       ├── findings.md         # This run's discoveries
│       ├── knowledge-state.md  # Current understanding
│       ├── plan.md             # What to learn next
│       └── domains/            # Domain-specific notes
├── drafts/                     # Living documents (user-readable)
│   ├── _changelog.md           # What changed per run
│   ├── domains/                # Domain-specific docs
│   │   └── {domain}/           # Per-domain documentation
│   └── cross-cutting/          # Cross-domain concerns
│       └── unknowns.md         # Honest gap documentation
└── output/                     # Frozen versioned snapshots
    └── v{N}/                   # Snapshot of drafts/ at run N
```

**File Purposes:**

| File | Purpose | Updated By |
|------|---------|------------|
| `project.config.json` | Project metadata, repos, timestamps | User + AI |
| `source/baseline/brief.md` | User-filled project brief | User |
| `wip/project-map.md` | Big picture system overview | AI (Phase 2+) |
| `wip/domain-index.md` | Domain decomposition tracking | AI (Phase 2+) |
| `drafts/unknowns.md` | Honest gaps and contradictions | AI (Phase 2+) |
| `drafts/_changelog.md` | Per-run change log | AI (Phase 2+) |

## Workflow States

The workflow progresses through these states:

### Phase 1 States (Implemented)

```
EMPTY
  → /df-init
INITIALIZED (kb/ exists, no project.config.json)
  → /df-start
BRIEF_CREATED (config + brief.md exist)
  → (user fills out brief.md)
BRIEF_READY (brief filled out)
  → /df-bootstrap (Phase 2)
```

Use `/df-status` to check your current state anytime.

### Phase 2+ States (Planned)

```
RUN_0_COMPLETE
  → /df-iterate (autonomous)
LEARNING
  → (stop condition)
PAUSED
  → /df-input + /df-iterate (continue)
  → /df-output (snapshot anytime)
VERSIONED
  → continue learning anytime
```

## Troubleshooting

### "Error: kb/ directory not found"

**Problem:** Trying to run `/df-start` or `/df-status` without initializing first.

**Fix:**
```bash
/df-init    # Creates kb/ directory
```

### "Error: No write permission"

**Problem:** Current directory is not writable.

**Fix:**
```bash
# Check permissions
ls -ld .

# Fix permissions if needed
chmod u+w .
```

### "Error: Could not read project configuration"

**Problem:** `project.config.json` is corrupted or malformed.

**Fix:**
```bash
# Option 1: Re-run setup
/df-start   # This will recreate the config

# Option 2: Manual fix
# Edit kb/project.config.json and ensure valid JSON
```

### Brief.md already exists

**Problem:** `/df-start` detects existing brief.md.

**Options:**
1. **Overwrite**: Start fresh with new Q&A
2. **Keep**: Preserve existing brief, update config only
3. **Exit**: Manually edit brief.md yourself

### Node.js not found

**Problem:** Scripts require Node.js but it's not installed.

**Fix:**
```bash
# Install Node.js v16 or later
# macOS (Homebrew):
brew install node

# Ubuntu/Debian:
sudo apt install nodejs npm

# Check version:
node --version  # Should be v16+
```

### Script permission denied

**Problem:** Scripts are not executable.

**Fix:**
```bash
chmod +x .claude/plugins/deepfield/scripts/*.sh
chmod +x .claude/plugins/deepfield/scripts/*.js
```

## Key Features

### Autonomous Iteration

`/df-iterate` runs multiple learning cycles automatically until it hits a stop condition:

- **Blocked**: Needs a source that isn't available
- **Diminishing returns**: 2+ runs with minimal new findings
- **Coverage reached**: All planned topics at high confidence
- **Safety limit**: Configurable max consecutive runs (default: 5)
- **Domain restructure**: Significant changes require user confirmation

### Domain Decomposition

For large projects, AI auto-detects domains:

- **Run 0**: Analyzes file/folder structure → initial domain guesses
- **Run 1-2**: Validates by reading code → confirms or merges domains
- **Run 3+**: Deep dives per domain, 1-2 domains per run
- **Ongoing**: Splits domains if too large, merges if too small

### Incremental Scanning

Each run tracks file hashes. The scanner diffs hashes between runs and only reads what changed or is new. Baseline repos use `git fetch` + diff, not full re-scan.

### Knowledge Accumulation

Three layers prevent context overload while maintaining audit trail:

- **`findings.md`** (per-run): Only this run's discoveries
- **`knowledge-state.md`** (rewritten each run): AI's working memory
- **`{topic}.md` drafts** (cumulative): Actual accumulated knowledge

### Honest Gaps

`drafts/cross-cutting/unknowns.md` explicitly states:
- What the KB doesn't cover
- What contradictions remain unresolved
- What sources would help fill gaps

This makes the output trustworthy — readers know what to verify independently.

## Monorepo Structure

This project uses npm workspaces to manage two packages:

```
deepfield/
├── cli/                    # Standalone CLI tool
│   ├── src/
│   │   ├── commands/       # Command implementations
│   │   ├── core/           # Core logic (state, scaffold, hash)
│   │   └── cli.ts          # CLI entry point
│   ├── templates/          # KB templates
│   ├── package.json        # CLI package
│   └── tsconfig.json
│
├── plugin/                 # Claude Code plugin
│   ├── .claude-plugin/
│   │   └── plugin.json     # Plugin manifest
│   ├── commands/           # Plugin commands (CLI wrappers)
│   ├── skills/             # Claude-specific knowledge
│   └── package.json        # Plugin metadata
│
├── package.json            # Root workspace
└── tsconfig.json           # Shared TypeScript config
```

### Development

**Install dependencies:**

```bash
npm install
```

**Build CLI:**

```bash
npm run build              # Build CLI only
npm run build:all          # Build both CLI and plugin
```

**Development mode:**

```bash
cd cli
npm run dev -- init        # Run CLI in dev mode
```

**Link globally for testing:**

```bash
cd cli
npm link                   # Makes `deepfield` available globally
```

**Run linting:**

```bash
npm run lint
```

## Troubleshooting

### "deepfield command not found"

**Solution 1:** Install globally

```bash
npm install -g deepfield
```

**Solution 2:** Use npx

```bash
npx deepfield init
```

**Solution 3:** Add to PATH (if installed locally)

```bash
export PATH="$PATH:./node_modules/.bin"
```

### "No deepfield/ directory found"

You need to run `deepfield init` first to create the directory structure:

```bash
deepfield init
```

### "Permission denied" errors

**On macOS/Linux:**

```bash
sudo deepfield init
```

Or fix directory permissions:

```bash
chmod +w .
```

### Plugin not loading in Claude Code

1. **Verify plugin is linked:**

```bash
ls -la ~/.claude/plugins/
```

2. **Check plugin.json is valid:**

```bash
cat ~/.claude/plugins/deepfield/.claude-plugin/plugin.json
```

3. **Restart Claude Code** after linking the plugin

### Build errors

**Clear and rebuild:**

```bash
npm run clean
npm install
npm run build
```

### State file corruption

If `project.config.json` is corrupted:

1. **Backup existing file** (if possible)
2. **Run start again:**

```bash
deepfield start
```

Or manually create valid JSON following the schema in `cli/templates/project.config.json`.

## Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Operating System**: macOS, Linux, or Windows with WSL
- **Git** (optional): For git repository features

## Why a Separate Project?

Deepfield is complex enough to warrant its own repository:

- 10+ commands with multi-stage workflow
- 8+ skills with complex orchestration logic
- 4 specialized agents with parallel execution
- 7+ utility scripts for robust file operations
- State machine with 8+ states and transitions
- Incremental scanning with file hashing and git diffs
- Autonomous iteration with sophisticated stop conditions

This is not a simple plugin — it's a full system.

## Project Status

**Version**: 1.0.0
**Status**: Phase 1 Implementation (CLI + Plugin Foundation)
**Last Updated**: 2026-02-11

**Phase 1 Complete (Current):**
- ✅ CLI tool with init, start, status commands
- ✅ Claude Code plugin with command wrappers
- ✅ Knowledge base management skill
- ✅ Template-based scaffolding
- ✅ State management and configuration
- ✅ Monorepo structure with npm workspaces

**Phase 2+ (Planned):**
- 🔜 Autonomous codebase exploration
- 🔜 Incremental knowledge building
- 🔜 Change detection and updates
- 🔜 Domain decomposition
- 🔜 Learning accumulation

## Design Documentation

See `kb-design-purpose/` for comprehensive design documentation:

- `DESIGN.md` - Complete design document (84KB)
- `components.md` - Component architecture
- `workflow.md` - Workflow and state machine
- `stages.md` - Stage definitions
- `design-decisions.md` - Key architectural decisions
- `folder-structure.md` - Directory structure

## License

MIT

## Contributing

This project is currently in design phase. Implementation will follow the OpenSpec workflow.
