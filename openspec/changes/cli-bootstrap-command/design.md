## Context

The Deepfield CLI is a Node.js/TypeScript command-line tool using Commander.js. It currently has `init`, `start`, and `status` commands. Each command follows the same pattern: a `create<Name>Command()` factory in `cli/src/commands/<name>.ts` that is registered in `cli/src/cli.ts`.

The bootstrap command is the user-facing trigger for Run 0 — the initial AI-driven classification and scanning pass. It must validate that the project is in a ready state before invoking any AI work.

## Goals / Non-Goals

**Goals:**
- Add `deepfield bootstrap` command to the CLI
- Validate all prerequisites before executing (deepfield dir, config, brief, Run 0 status)
- Show a confirmation prompt describing what will happen (skippable with `--yes`)
- Display clear error messages with actionable suggestions
- Placeholder for the actual bootstrap skill (Task 002 wires in the AI)

**Non-Goals:**
- Implementing the actual bootstrap skill/AI logic (Task 002)
- Modifying the plugin-side bootstrap skill
- Adding support for partial or resumed bootstraps

## Decisions

**Decision: Follow existing command pattern**
All commands use `create<Name>Command()` factory functions registered in `cli.ts`. Consistency beats cleverness — bootstrap follows the same pattern as `init`, `start`, `status`.

**Decision: Use StateError from `core/errors.ts` (not `core/state.ts`)**
`core/state.ts` exports its own `StateError` without a `suggestion` field. `core/errors.ts` exports the canonical `StateError`. The bootstrap command uses `core/errors.ts` errors to get proper exit codes and suggestion support from the global handler in `cli.ts`.

**Decision: Placeholder for bootstrap execution**
The `runBootstrap()` function logs a "not yet implemented" message and returns cleanly. This allows Task 001 to ship and unblock integration with Task 002, with no dummy logic that needs to be unwound later.

**Decision: brief.md filled check via content length**
Following the pattern in `start.ts`, we check that brief.md is not a blank template by looking at whether `projectName` in `project.config.json` is non-empty (populated by `deepfield start`), rather than parsing markdown.

## Risks / Trade-offs

- **Risk: StateError in `core/state.ts` vs `core/errors.ts` conflict** → Mitigation: Import only from `core/errors.ts` in the bootstrap command; do not import `StateError` from `core/state.ts`.
- **Risk: Run 0 check is optimistic** → If `run-0.config.json` is missing, bootstrap is considered not-yet-done. This is correct behavior — absence of the file means not started.
- **Risk: Placeholder message may confuse users** → Mitigation: Message explicitly says "Bootstrap skill not yet implemented" and references Task 002, making the state transparent.
