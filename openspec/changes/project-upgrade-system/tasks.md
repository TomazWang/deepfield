## 1. Dependencies & Config

- [x] 1.1 Add `semver` and `@types/semver` to `cli/package.json` dependencies
- [x] 1.2 Update `cli/src/types.ts` (or equivalent) to include `deepfieldVersion`, `createdWith`, `lastUpgraded`, and `migrationHistory` fields on `ProjectConfig` type/schema

## 2. Version Tracking

- [x] 2.1 Create `cli/src/utils/check-version.ts` implementing `checkProjectVersion(projectPath)` using semver comparison
- [x] 2.2 Update `plugin/scripts/init-project.sh` (or the script that writes `project.config.json`) to include `deepfieldVersion`, `createdWith`, `lastUpgraded`, and `migrationHistory` fields
- [x] 2.3 Update `cli/src/commands/init.ts` to write `deepfieldVersion`, `createdWith`, `lastUpgraded: now`, and `migrationHistory: []` into `project.config.json` on init

## 3. Backup System

- [x] 3.1 Create `cli/src/utils/backup.ts` with `createBackup(projectPath)` that copies `deepfield/` to `.deepfield-backups/backup-<timestamp>/` and writes `.backup-meta.json`
- [x] 3.2 Add `listBackups(projectPath)` to `cli/src/utils/backup.ts` returning sorted backup metadata array (newest first)
- [x] 3.3 Add `restoreBackup(projectPath, backupId)` to `cli/src/utils/backup.ts` that replaces `deepfield/` with the named backup

## 4. Migration Framework

- [x] 4.1 Create `cli/migrations/index.js` (CJS) implementing `getRequiredMigrations(fromVersion, toVersion)` and `runMigrations(projectPath, migrations, options)`
- [x] 4.2 Implement rollback-on-failure logic in `runMigrations`: on error at step N, rollback steps N through 0 in reverse order
- [x] 4.3 Implement `updateConfigAfterMigration(projectPath, migration, result)` in `cli/migrations/index.js` that appends to `migrationHistory` and updates `deepfieldVersion` and `lastUpgraded`

## 5. Core Migration Scripts

- [x] 5.1 Create `cli/migrations/1.0-to-2.0.js`: creates `deepfield/wip/domain-index.md`, `deepfield/drafts/domains/`, moves existing top-level drafts to `cross-cutting/`
- [x] 5.2 Create `cli/migrations/2.0-to-2.1.js`: creates `deepfield/DEEPFIELD.md` from template if not present
- [x] 5.3 Create `cli/migrations/2.1-to-2.2.js`: creates `deepfield/drafts/cross-cutting/terminology.md` and `deepfield/wip/new-terms.md`
- [x] 5.4 Create `cli/migrations/2.2-to-2.3.js`: creates `deepfield/wip/parallel-plan.md`
- [x] 5.5 Create `cli/migrations/2.3-to-2.5.js`: creates `deepfield/wip/confidence-scores.md` and `deepfield/drafts/cross-cutting/unknowns.md`
- [x] 5.6 Verify all migration `check()` functions are idempotent (return false if already applied)

## 6. Upgrade Command

- [x] 6.1 Create `cli/src/commands/upgrade.ts` with Commander.js registration and options `--dry-run`, `--to`, `--skip-backup`, `--force`, `--list-migrations`
- [x] 6.2 Implement dry-run mode: calls `getRequiredMigrations`, prints what would change, exits without modifying files
- [x] 6.3 Implement `--list-migrations`: prints all registered migrations from `cli/migrations/index.js` and exits
- [x] 6.4 Implement main upgrade flow: version check → confirm (unless `--force`) → backup (unless `--skip-backup`) → run migrations → print summary
- [x] 6.5 Register `upgrade` command in `cli/src/index.ts` (main CLI entry point)

## 7. Rollback Command

- [x] 7.1 Create `cli/src/commands/rollback.ts` with Commander.js registration, optional `backup-id` argument, and `--force` option
- [x] 7.2 Implement backup listing when no `backup-id` given: calls `listBackups`, displays table, prompts for selection
- [x] 7.3 Implement restore flow: confirm (unless `--force`) → call `restoreBackup` → print success
- [x] 7.4 Register `rollback` command in `cli/src/index.ts`

## 8. Version Check Integration

- [x] 8.1 Identify all existing CLI commands that operate on a project (`init`, `start`, `status`, etc.)
- [x] 8.2 Add `checkProjectVersion()` call at the start of each project-operating command; print warning and prompt on `needsUpgrade`, print error and exit on `needsDowngrade`
