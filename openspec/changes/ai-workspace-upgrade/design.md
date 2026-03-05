## Context

The current `deepfield upgrade` command (cli/src/commands/upgrade.ts) couples orchestration and migration logic together. Migrations are hard-coded JavaScript modules in `cli/migrations/index.js` that must be written and shipped by a developer for every new version pair. The CLI consumes this registry directly via `getRequiredMigrations` and `runMigrations`.

This design replaces the static migration registry with an AI-driven plugin skill invoked via a new `/df-upgrade` plugin command. The plugin skill is the entry point and intelligence layer; the CLI provides only atomic helper operations callable from bash. The CLI never calls or depends on the plugin.

**Architectural constraint**: The plugin (AI layer) can invoke CLI commands. The CLI MUST NEVER invoke or depend on the plugin. This is a one-way dependency: CLI → (none); Plugin → CLI helpers.

## Goals / Non-Goals

**Goals:**
- Remove the hard-coded migration registry (`cli/migrations/index.js`) and its coupling in `upgrade.ts`
- Add a new `/df-upgrade` plugin command as the user-facing entry point for AI-driven workspace upgrade
- Add a new `deepfield-upgrade` plugin skill that reasons about workspace diff and applies changes via CLI helpers
- Expose atomic CLI helper operations (as sub-commands) callable from bash by the plugin skill
- Refactor CLI `upgrade` command to perform only deterministic, non-AI operations (detect versions, backup, validate, update version) — it MUST NOT invoke the plugin or any AI
- Maintain backup-first safety guarantees and rollback path

**Non-Goals:**
- Replacing the `deepfield rollback` command (stays as-is)
- Changing other CLI commands (`init`, `start`, `status`, `output`)
- Supporting arbitrary user-provided migration scripts
- Online/remote version manifest fetching (version detection stays local)

## Decisions

### Decision 1: Plugin command is the entry point; CLI is a pure atomic helper provider

**Choice**: The user-facing entry point for AI-driven upgrade is the `/df-upgrade` plugin command (not the CLI). The plugin command invokes the `deepfield-upgrade` skill, which does all AI reasoning and calls CLI helper sub-commands (e.g., `deepfield upgrade:detect-version`, `deepfield upgrade:backup`, `deepfield upgrade:apply-op`, `deepfield upgrade:validate`, `deepfield upgrade:set-version`) via bash for all filesystem operations.

The CLI `deepfield upgrade` command (if retained) becomes a thin, non-AI wrapper that performs only deterministic steps: detect versions, create backup, validate, update version. It MUST NOT call the plugin skill or any AI endpoint.

**Dependency rule**: Plugin → CLI helpers (allowed). CLI → Plugin (NEVER allowed).

**Alternatives considered**:
- CLI as orchestrator that invokes the plugin skill → rejected: violates the one-way dependency rule; CLI must not depend on plugin
- Skill reads/writes files directly without CLI helpers → rejected: bypasses atomic guarantees, duplicates path logic
- CLI calls AI inline (e.g., via API) → rejected: creates network dependency in CLI, complicates testing

**Rationale**: The plugin is the correct entry point for AI features. The CLI is a deterministic tool that the plugin can use as a helper. Inverting this (CLI calling plugin) would couple the CLI to the AI runtime, breaking the architectural boundary and making the CLI untestable in isolation.

### Decision 2: Skill receives structured diff via plugin command, not raw files

**Choice**: The `/df-upgrade` plugin command calls `deepfield upgrade:detect-version` to gather version information, then passes a structured JSON diff (`{from, to, workspaceSummary}`) to the `deepfield-upgrade` skill. The skill reasons about what needs to change and emits a list of file operations.

**Alternatives considered**:
- Skill reads workspace directly → acceptable, but creates coupling between skill and CLI path conventions
- Plugin command generates a file manifest and skill reads it → adds a temp file coordination step

**Rationale**: Passing a structured diff keeps the skill focused on reasoning, not file discovery. The plugin command gathers the diff using the CLI helper, then hands off to the skill.

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
2. Refactor `upgrade.ts` to remove all migration logic and any plugin/AI invocation (deterministic ops only)
3. Add `/df-upgrade` plugin command (`plugin/commands/df-upgrade.md`)
4. Add `deepfield-upgrade.md` plugin skill (`plugin/skills/deepfield-upgrade.md`)
5. Delete `cli/migrations/index.js` and `cli/migrations/` directory
6. Update `cli/src/cli.ts` to register any new sub-commands
7. Rollback strategy: restore `cli/migrations/` from git if regression found; the backup utility is unchanged

## Open Questions

- What is the exact JSON schema for the workspace diff payload passed from the `/df-upgrade` command to the skill?
- Should `upgrade:validate` compare against a schema file (versioned) or use heuristics?
- Should the CLI `deepfield upgrade` command be kept as a thin non-AI wrapper, or removed entirely in favor of `/df-upgrade` as the sole entry point?
