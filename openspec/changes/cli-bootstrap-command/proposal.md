## Why

The Deepfield CLI is missing a `bootstrap` command, causing users to get an "unknown command" error when they try to run `deepfield bootstrap`. The bootstrap command is the critical step that triggers Run 0 — the initial classification, scan, and domain detection that starts the knowledge-building process.

## What Changes

- New `bootstrap` command added to the Deepfield CLI (`deepfield bootstrap`)
- Command validates prerequisites before executing (deepfield dir, project config, brief.md, Run 0 completion status)
- Command shows confirmation prompt with what will happen (unless `--yes` flag used)
- Command calls the bootstrap skill (or shows placeholder for Task 002)
- `cli.ts` updated to register the new command

## Capabilities

### New Capabilities
- `bootstrap-command`: CLI command that validates prerequisites and triggers the bootstrap skill (Run 0). Includes options `--force`, `--yes`, and `--debug`.

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- **New file**: `cli/src/commands/bootstrap.ts`
- **Modified file**: `cli/src/cli.ts` (registers the new command)
- **Dependencies**: Uses existing `core/state.ts` (`readProjectConfig`), `core/errors.ts` (`StateError`), `inquirer`, `chalk`, `fs-extra`
- **Exit codes**: 0 (success), 1 (general error), 2 (invalid args), 3 (state error), 4 (permission error)
