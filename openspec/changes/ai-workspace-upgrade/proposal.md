## Why

The current upgrade system (`cli/src/commands/upgrade.ts`) relies on a static, hard-coded migration registry (`migrations/index.js`) where each version-to-version migration must be hand-authored in JavaScript. This approach does not scale as the Deepfield workspace schema evolves — every structural change requires a developer to write, test, and ship a new migration script before users can upgrade. Replacing this with an AI-driven approach allows the plugin to analyze the structural diff between workspace versions and apply intelligent, context-aware changes without requiring pre-authored migration code for every version pair.

## What Changes

- **BREAKING**: Remove the `migrations/index.js` hard-coded migration registry and its integration in `upgrade.ts`.
- **New**: CLI `upgrade` command is refactored to be an orchestrator: detects versions, creates a backup, validates pre/post state, and updates the version field — but no longer runs migration logic itself.
- **New**: CLI exposes a set of atomic bash-invocable helper operations (detect versions, backup workspace, validate workspace, apply file operation, update version) that the plugin skill can call.
- **New**: Plugin skill `deepfield-upgrade` performs the intelligence layer: receives the version diff, analyzes the workspace structure, determines what changes are needed, and calls CLI helper scripts to apply changes atomically.
- **Modified**: `cli-commands` spec — the `upgrade` command's behavior contract changes (orchestrator only, no direct migration execution).

## Capabilities

### New Capabilities

- `workspace-upgrade-skill`: Plugin skill that analyzes workspace diff between project version and target version, determines required structural changes using AI reasoning, and applies them via CLI helper scripts.
- `upgrade-cli-helpers`: Atomic CLI helper scripts/commands exposed as bash operations for the plugin skill to call: detect-version, create-backup, validate-workspace, apply-file-op, update-version.

### Modified Capabilities

- `cli-commands`: The `upgrade` command behavior changes — it becomes a pure orchestrator (detect → backup → invoke skill → validate → update version) rather than a direct migration runner.

## Impact

- `cli/src/commands/upgrade.ts` — major refactor
- `cli/migrations/` — directory removed or deprecated
- `cli/src/utils/backup.ts` — reused as-is
- `plugin/skills/` — new `deepfield-upgrade.md` skill added
- `plugin/scripts/` — new helper scripts added (or CLI sub-commands added for atomic ops)
- No changes to `df-init`, `df-start`, `df-status`, `df-output` commands
