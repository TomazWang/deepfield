## Why

Deepfield needs to be usable both as a standalone CLI tool (for any editor, terminal, CI/CD) and as a Claude Code plugin (for enhanced AI integration). Building them as separate projects creates maintenance overhead and duplicates logic. A monorepo combining both provides a universal CLI tool with an optional Claude-aware wrapper, maximizing reach while enabling AI-assisted workflows.

## What Changes

- Create standalone TypeScript CLI tool (`deepfield`) with commands: init, start, status
- Implement core KB management logic (scaffolding, state, templates, hashing)
- Create Claude Code plugin as thin wrapper around CLI commands
- Add plugin-specific features: skills (KB management knowledge), agents (Phase 2+)
- Structure as monorepo: cli/ for universal tool, plugin/ for Claude integration
- Use modern TypeScript stack following OpenSpec patterns (commander, inquirer, chalk, zod)
- Implement four-space architecture (source/, wip/, drafts/, output/)
- Enable atomic file operations with proper error handling

## Capabilities

### New Capabilities

- `cli-architecture`: TypeScript CLI tool structure with commander framework
- `cli-commands`: Three core commands (init, start, status) for KB management
- `cli-core-logic`: Scaffolding, state management, template system, file hashing
- `plugin-structure`: Claude Code plugin manifest and directory layout
- `plugin-commands`: Thin wrappers calling CLI with Claude-friendly output
- `plugin-skills`: KB management skill teaching Claude how to use Deepfield
- `monorepo-setup`: Project structure combining CLI and plugin with shared code

### Modified Capabilities

<!-- None - this is a greenfield implementation -->

## Impact

- New project structure: monorepo with cli/ and plugin/ directories
- New CLI tool: `deepfield` command available globally via npm
- New Claude Code plugin: `/df-*` commands for Claude integration
- Dependencies: TypeScript, Node.js v18+, commander, inquirer, chalk, zod, fs-extra
- No impact on existing deepfield-foundation change (supersedes it with better architecture)
- Users can install CLI standalone or use plugin for Claude integration
- Future phases (2+) will add skills and agents to plugin side only
