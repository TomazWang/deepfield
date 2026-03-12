---
name: Knowledge Base Management
description: User-facing guidance skill — answers questions about how to use Deepfield (setup, commands, workflow). Activates ONLY when a user explicitly asks for help or explanation (e.g. "how do I use deepfield?", "what does df-init do?"). Does NOT activate during automated command execution flows such as /df-upgrade, /df-bootstrap, or /df-iterate.
version: 1.0.0
---

# Knowledge Base Management with Deepfield

## Overview

Deepfield is an AI-driven knowledge base builder designed for understanding brownfield projects. It provides a structured approach to documenting legacy codebases, facilitating team onboarding, and capturing institutional knowledge about complex systems.

**When to use Deepfield:**
- Exploring unfamiliar legacy codebases
- Onboarding new team members to existing projects
- Documenting poorly documented systems
- Understanding complex architectures
- Modernizing brownfield applications

## Core Workflow

The Deepfield workflow follows three foundational steps:

### 1. Initialize (df-init)

Create the workspace directory structure.

**Command:** `/df-init`

**What it creates:**
- `deepfield/source/` - Source materials and baseline snapshots
- `deepfield/wip/` - Work in progress (active exploration runs)
- `deepfield/drafts/` - Draft documents and notes
- `deepfield/output/` - Final knowledge base artifacts
- Template files for configuration and documentation

**When to use:** First step when starting a new knowledge base project.

### 2. Configure (df-start)

Run interactive setup to define project context.

**Command:** `/df-start`

**What it does:**
- Asks questions about project type and goals
- Collects focus areas (architecture, APIs, security, etc.)
- Creates `project.config.json` with settings
- Pre-fills `brief.md` template with answers

**What to provide:**
- Clear project name
- Specific goal (e.g., "understand authentication flow")
- Relevant focus areas
- Honest assessment of project type

**After configuration:** Fill out `deepfield/brief.md` thoroughly. The quality of generated knowledge depends on the context provided in the brief.

### 3. Check Status (df-status)

View current state and get guidance on next steps.

**Command:** `/df-status`

**What it shows:**
- Current workflow state
- Project information (name, goal, focus)
- Last modification time
- Suggested next action

**Use this command to:**
- Understand where you are in the workflow
- Get reminded of next steps
- Check project configuration
- See exploration history (Phase 2+)

## The Brief: Your Exploration Guide

The `deepfield/brief.md` file is the most important document in your knowledge base. It guides all AI exploration and learning.

**Key sections to fill out:**

**Project Overview:**
- What the project does and why it exists
- Main value proposition
- Key stakeholders and users

**Technical Overview:**
- Architecture type (monolith, microservices, etc.)
- Core technologies (languages, frameworks, databases)
- Critical dependencies (external services, APIs)

**Pain Points:**
- Known issues and technical debt
- Areas of confusion or poor documentation
- Problematic code sections

**Exploration Priorities:**
- What areas to investigate first
- What questions need answers
- What would make this knowledge base valuable

**The more context you provide, the better the AI can explore and document your codebase.**

## Workflow States

Understanding workflow states helps you know what to do next:

| State | Icon | Meaning | Next Step |
|-------|------|---------|-----------|
| EMPTY | ⭕ | No deepfield/ directory | Run `/df-init` |
| INITIALIZED | 🏗️ | Directory exists, no config | Run `/df-start` |
| CONFIGURED | ⚙️ | Config exists, brief needs filling | Fill out `brief.md` |
| READY | ✅ | Brief complete, ready to explore | Phase 2+ features |
| IN_PROGRESS | 🔄 | Exploration running | Wait for completion |
| COMPLETED | 🎉 | Exploration done | Review outputs |

Check your current state anytime with `/df-status`.

## Directory Structure

Understanding the four-space architecture:

```
deepfield/
├── source/          # SOURCE: Raw materials
│   └── baseline/    # Initial state snapshots
│       └── repos/   # Repository copies
│
├── wip/            # WIP: Active work
│   └── run-N/      # Individual exploration runs
│
├── drafts/         # DRAFTS: Working documents
│   └── notes/      # Temporary notes and findings
│
└── output/         # OUTPUT: Final artifacts
    └── docs/       # Completed documentation
```

**source/**: Immutable baseline. Original code state for reference.
**wip/**: Active exploration. Temporary state during runs.
**drafts/**: Working space. Notes and draft documents.
**output/**: Final results. Polished knowledge base artifacts.

## Best Practices

**When initializing:**
- Choose a clear, descriptive project name
- Be specific about your goals
- Select focus areas that matter most

**When configuring:**
- Don't skip filling out the brief
- Provide architectural context
- List known pain points honestly
- Include specific questions

**During exploration (Phase 2+):**
- Let the AI work through runs systematically
- Review generated knowledge incrementally
- Update the brief as understanding grows

## Common Use Cases

### Legacy Codebase Understanding

**Scenario:** You've inherited a 10-year-old codebase with minimal documentation.

**Approach:**
1. Run `/df-init` to create workspace
2. Run `/df-start`, select "Legacy codebase (brownfield)"
3. In brief.md, focus on:
   - Known pain points (slow queries, unclear modules)
   - What works vs what's mysterious
   - Critical workflows to understand first

### Team Onboarding

**Scenario:** New developers need to understand the system quickly.

**Approach:**
1. Initialize with focus on "Team onboarding"
2. In brief.md, emphasize:
   - Entry points and key flows
   - Common gotchas and pitfalls
   - How to run and test locally

### Code Modernization

**Scenario:** Planning to modernize an old system.

**Approach:**
1. Select "Code modernization" type
2. Focus on:
   - Current architecture and dependencies
   - Technical debt and outdated patterns
   - Integration points that might break

## Phase 1 Capabilities

**Current (Phase 1):**
- ✅ Initialize directory structure
- ✅ Interactive project configuration
- ✅ Status checking
- ✅ Template-based documentation framework

**Coming (Phase 2+):**
- 🔜 Autonomous codebase exploration
- 🔜 Incremental knowledge building
- 🔜 Change detection and updates
- 🔜 Domain decomposition
- 🔜 Learning accumulation

Phase 1 focuses on scaffolding and setup. The AI exploration capabilities come in subsequent phases.

## Troubleshooting

**"deepfield command not found"**
- Install CLI: `npm install -g deepfield`
- Or use plugin's bundled version

**"No deepfield/ directory found"**
- Run `/df-init` first to create structure

**"Configuration is missing"**
- Run `/df-start` to set up project config

**"Brief needs filling out"**
- Open `deepfield/brief.md` and add project context
- Focus on pain points and priorities

## Examples

See the `examples/` directory for:
- Complete workflow example (init → start → status)
- Sample brief.md with good context
- Common configuration patterns

---

*This skill provides guidance on using Deepfield for AI-driven knowledge base building. For technical details about the CLI or plugin implementation, refer to project documentation.*
