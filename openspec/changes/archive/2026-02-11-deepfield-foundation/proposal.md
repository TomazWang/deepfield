## Why

Deepfield is an AI-driven knowledge base builder for Claude Code that helps developers understand brownfield projects through autonomous, iterative learning. Phase 1 (Foundation) establishes the core infrastructure without AI autonomy: plugin structure, file operations, state management, and basic scaffolding commands. This foundation enables future phases to build semi-autonomous and fully autonomous learning capabilities on a robust, tested base.

## What Changes

- Create Claude Code plugin structure with manifest (`plugin.json`)
- Implement atomic file operation scripts (create, read, update directories and JSON)
- Build state management utilities for tracking runs and configuration
- Add `/df-init` command for scaffolding kb/ directory structure
- Add `/df-start` command for interactive project setup and brief generation
- Add `/df-status` command for reading and displaying current state
- Establish four-space architecture (source/, wip/, drafts/, output/ directories)
- Create templates for config files (project.config.json, run.config.json)
- Add file hashing utilities for future incremental scanning

## Capabilities

### New Capabilities

- `plugin-structure`: Plugin manifest, directory layout, and Claude Code integration
- `file-operations`: Atomic scripts for creating/reading/updating files and directories
- `state-management`: Read and update project state, run configs, and tracking data
- `kb-scaffolding`: Initialize kb/ directory structure with templates
- `interactive-setup`: Q&A flow for project setup and brief.md generation
- `state-inspection`: Read state files and display formatted status

### Modified Capabilities

<!-- None - this is a greenfield implementation -->

## Impact

- New plugin in `.claude/plugins/deepfield/`
- New scripts directory with shell/node utilities
- New commands available: `/df-init`, `/df-start`, `/df-status`
- No impact on existing codebase (standalone plugin)
- Foundation for Phase 2 (manual learning) and Phase 3+ (autonomous iteration)
