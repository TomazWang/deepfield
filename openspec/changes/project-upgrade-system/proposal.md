## Why

As Deepfield evolves rapidly, existing user projects become incompatible with new plugin versions—forcing users to recreate projects, lose run history, and fear upgrades. A systematic upgrade system is required so new features can be adopted incrementally without sacrificing existing work.

## What Changes

- Add `deepfieldVersion`, `createdWith`, `lastUpgraded`, and `migrationHistory` fields to `project.config.json`
- Create a `cli/migrations/` directory with versioned migration scripts (CJS)
- Implement a migration orchestrator (`cli/migrations/index.js`) that chains migrations across version jumps
- Add `deepfield upgrade` CLI command with dry-run, backup, and progress reporting
- Add `deepfield rollback` CLI command to restore from backup
- Create backup system that snapshots `deepfield/` before any upgrade
- Add version-check utility that warns on mismatch before any command runs
- Implement all core migrations: v1.0→2.0, v2.0→2.1, v2.1→2.2, v2.2→2.3, v2.3→2.5

## Capabilities

### New Capabilities

- `version-tracking`: Track `deepfieldVersion` in `project.config.json` and detect mismatches between the project version and the installed CLI/plugin version
- `migration-framework`: Migration script interface, orchestrator that chains scripts in sequence, rollback-on-failure, and result reporting
- `upgrade-command`: `deepfield upgrade` CLI command with `--dry-run`, `--to`, `--skip-backup`, `--force`, `--list-migrations` options
- `rollback-command`: `deepfield rollback [backup-id]` CLI command to list backups and restore a chosen snapshot
- `backup-system`: Create/manage timestamped snapshots of the `deepfield/` folder under `.deepfield-backups/`
- `core-migrations`: Concrete migration scripts for all version steps from v1.0.0 to v2.5.0

### Modified Capabilities

- `cli-commands`: New `upgrade` and `rollback` subcommands added to the CLI command registry
- `cli-core-logic`: Version check injected before command execution to warn/block on incompatible project versions

## Impact

- `cli/src/` — new commands `upgrade.ts` and `rollback.ts`, new utility `src/utils/check-version.ts`
- `cli/migrations/` — new directory with `index.js` orchestrator and per-version migration scripts
- `cli/package.json` — may need `semver` dependency
- `plugin/scripts/` — `init-project.sh` updated to write `deepfieldVersion` into `project.config.json`
- Existing projects without `deepfieldVersion` treated as `0.0.0` (pre-tracking)
