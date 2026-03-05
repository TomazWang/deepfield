## Why

The current upgrade system (`cli/src/commands/upgrade.ts`) relies on a static, hard-coded migration registry (`migrations/index.js`) where each version-to-version migration must be hand-authored in JavaScript. This approach does not scale as the Deepfield workspace schema evolves — every structural change requires a developer to write, test, and ship a new migration script before users can upgrade. Replacing this with an AI-driven approach allows the plugin to analyze the structural diff between workspace versions and apply intelligent, context-aware changes without requiring pre-authored migration code for every version pair.

## What Changes

- **BREAKING**: Remove the `migrations/index.js` hard-coded migration registry and its integration in `upgrade.ts`.
- **New**: Plugin command `/df-upgrade` is the user-facing entry point for AI-driven workspace upgrade. It gathers version info via `deepfield upgrade:detect-version`, creates a backup, then invokes the `deepfield-upgrade` skill.
- **New**: Plugin skill `deepfield-upgrade` performs the intelligence layer: receives the version diff (`{from, to, workspaceSummary}`), analyzes the workspace structure, determines what changes are needed, and calls CLI helper commands to apply changes atomically.
- **New**: CLI exposes a set of atomic bash-invocable helper sub-commands (detect versions, backup workspace, validate workspace, apply file operation, update version) that the plugin skill can call.
- **Modified**: CLI `upgrade` command (`upgrade.ts`) is stripped of all migration and AI orchestration logic. It becomes a thin deterministic wrapper (detect → backup → validate → update version) that NEVER calls the plugin or any AI. It may be retained for non-AI use cases or removed.
- **Modified**: `cli-commands` spec — the `upgrade` command behavior contract changes (deterministic ops only, no plugin invocation).

**Architectural constraint**: Plugin commands and skills may call CLI helper sub-commands. The CLI MUST NEVER invoke or depend on the plugin. This one-way boundary is enforced by design.

## Capabilities

### New Capabilities

- `df-upgrade-command`: Plugin command `/df-upgrade` — user-facing entry point that gathers version diff, triggers backup, and invokes the `deepfield-upgrade` skill.
- `workspace-upgrade-skill`: Plugin skill that analyzes workspace diff between project version and target version, determines required structural changes using AI reasoning, and applies them via CLI helper sub-commands.
- `upgrade-cli-helpers`: Atomic CLI helper sub-commands exposed as bash operations for the plugin skill to call: detect-version, create-backup, validate-workspace, apply-file-op, update-version.

### Modified Capabilities

- `cli-commands`: The CLI `upgrade` command behavior changes — it becomes a deterministic-only wrapper (detect → backup → validate → update version). It MUST NOT invoke the plugin skill or any AI.

## Impact

- `cli/src/commands/upgrade.ts` — refactored to remove migration and AI orchestration logic; deterministic ops only
- `cli/migrations/` — directory removed or deprecated
- `cli/src/utils/backup.ts` — reused as-is
- `plugin/commands/df-upgrade.md` — new plugin command (entry point)
- `plugin/skills/deepfield-upgrade.md` — new plugin skill (intelligence layer)
- CLI sub-commands added for atomic ops (`upgrade:detect-version`, `upgrade:backup`, `upgrade:apply-op`, `upgrade:validate`, `upgrade:set-version`)
- No changes to `df-init`, `df-start`, `df-status`, `df-output` commands
