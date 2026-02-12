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

## Development Guidelines

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
