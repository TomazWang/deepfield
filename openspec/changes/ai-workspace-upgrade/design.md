## Context

The current `deepfield upgrade` command (cli/src/commands/upgrade.ts) couples orchestration and migration logic together. Migrations are hard-coded JavaScript modules in `cli/migrations/index.js` that must be written and shipped by a developer for every new version pair. The CLI consumes this registry directly via `getRequiredMigrations` and `runMigrations`.

This design replaces the static migration registry with an AI-driven plugin skill that analyzes what needs to change and applies atomic operations using CLI helper scripts. The CLI becomes a pure orchestrator and atomic-operation provider; the plugin skill becomes the intelligence layer.

## Goals / Non-Goals

**Goals:**
- Remove the hard-coded migration registry (`cli/migrations/index.js`) and its coupling in `upgrade.ts`
- Refactor CLI `upgrade` command into an orchestrator: detect versions → backup → invoke skill → validate → update version
- Expose atomic CLI helper operations (as sub-commands or scripts) callable from bash by the plugin skill
- Add a new `deepfield-upgrade` plugin skill that reasons about workspace diff and applies changes via the CLI helpers
- Maintain backup-first safety guarantees and rollback path

**Non-Goals:**
- Replacing the `deepfield rollback` command (stays as-is)
- Changing other CLI commands (`init`, `start`, `status`, `output`)
- Supporting arbitrary user-provided migration scripts
- Online/remote version manifest fetching (version detection stays local)

## Decisions

### Decision 1: CLI as atomic helper provider, skill as intelligence layer

**Choice**: CLI exposes small, single-purpose helper sub-commands (e.g., `deepfield upgrade:detect-version`, `deepfield upgrade:backup`, `deepfield upgrade:apply-op`, `deepfield upgrade:validate`, `deepfield upgrade:set-version`). Plugin skill calls these via bash.

**Alternatives considered**:
- Skill reads/writes files directly without CLI helpers → rejected: bypasses atomic guarantees, duplicates path logic
- CLI calls AI inline (e.g., via API) → rejected: creates network dependency in CLI, complicates testing

**Rationale**: The skill is the right place for AI reasoning. The CLI is the right place for filesystem operations. Keeping them separate makes both independently testable.

### Decision 2: Skill receives structured diff, not raw files

**Choice**: When the CLI orchestrator invokes the skill, it passes a structured JSON diff (`{from, to, workspaceSummary}`) describing the workspace state. The skill reasons about what needs to change and emits a list of file operations.

**Alternatives considered**:
- Skill reads workspace directly → acceptable, but creates coupling between skill and CLI path conventions
- CLI generates a file manifest and skill reads it → adds a temp file coordination step

**Rationale**: Passing a structured diff keeps the skill focused on reasoning, not file discovery. The CLI already knows paths and versions.

### Decision 3: Helper operations are bash sub-commands, not separate scripts

**Choice**: Expose helpers as `deepfield upgrade:<action>` sub-commands (Commander.js subcommands) rather than standalone shell scripts in `cli/scripts/`.

**Alternatives considered**:
- Shell scripts in `plugin/scripts/` → rejected: would need to be co-located with plugin, complicating CLI/plugin boundary
- Separate npm package → overkill for this scope

**Rationale**: Sub-commands share existing CLI infrastructure (path resolution, error handling, exit codes) with no additional tooling.

### Decision 4: Remove `cli/migrations/` directory

**Choice**: Delete `cli/migrations/index.js` and the `migrations/` directory entirely. Any existing migration logic is superseded by the AI skill.

**Alternatives considered**:
- Keep migrations as a fallback if skill unavailable → complicates the logic and undermines the goal
- Archive migrations as reference docs → unnecessary, git history preserves them

**Rationale**: A clean break reduces maintenance surface and avoids confusion about which path executes.

## Risks / Trade-offs

- [Risk] Skill applies incorrect file operation, corrupting workspace → Mitigation: backup is always created before skill is invoked; `deepfield rollback` restores it. Skill output is validated before apply.
- [Risk] CLI helper sub-commands expose internals that become a de-facto API → Mitigation: document helpers as internal/unstable; prefix with `upgrade:` namespace to signal non-user-facing.
- [Risk] AI skill produces non-deterministic results across runs → Mitigation: skill operates on a deterministic diff input; results should be stable for the same version pair.
- [Risk] Removing migrations breaks existing users mid-upgrade → Mitigation: this is a BREAKING change; announce in changelog. Old project versions still upgrade correctly because the skill reasons from workspace structure, not a version table.

## Migration Plan

1. Add `upgrade:<action>` helper sub-commands to CLI (`upgrade.ts` or a new `upgrade-helpers.ts`)
2. Refactor `upgrade.ts` orchestration (remove `runMigrations`/`getRequiredMigrations` calls)
3. Add `deepfield-upgrade.md` plugin skill
4. Delete `cli/migrations/index.js` and `cli/migrations/` directory
5. Update `cli/src/cli.ts` to register any new sub-commands
6. Rollback strategy: restore `cli/migrations/` from git if regression found; the backup utility is unchanged

## Open Questions

- Should the skill be invoked via `claude --skill` flag or via a skill launch instruction embedded in the orchestrator output? (Depends on how Claude Code plugin invocation works from CLI context.)
- What is the exact JSON schema for the workspace diff payload passed to the skill?
- Should `upgrade:validate` compare against a schema file (versioned) or use heuristics?
