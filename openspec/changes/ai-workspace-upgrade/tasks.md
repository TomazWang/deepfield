## 1. Remove Hard-Coded Migration Registry

- [x] 1.1 Delete `cli/migrations/index.js` and the `cli/migrations/` directory
- [x] 1.2 Remove `require('../../migrations/index.js')` import from `cli/src/commands/upgrade.ts`
- [x] 1.3 Remove `getRequiredMigrations`, `runMigrations`, and `ALL_MIGRATIONS` usages from `upgrade.ts`
- [x] 1.4 Remove `--list-migrations` option from the upgrade command

## 2. Add CLI Helper Sub-Commands

- [x] 2.1 Create `cli/src/commands/upgrade-helpers.ts` with Commander sub-command scaffolding
- [x] 2.2 Implement `upgrade:detect-version` sub-command (reads project config + CLI package.json, outputs JSON)
- [x] 2.3 Implement `upgrade:backup` sub-command (wraps existing `createBackup` util, prints backup path)
- [x] 2.4 Implement `upgrade:apply-op` sub-command (supports create, update, delete, rename with atomic writes)
- [x] 2.5 Implement `upgrade:validate` sub-command (checks deepfield/ directory structure and config schema)
- [x] 2.6 Implement `upgrade:set-version` sub-command (reads, updates, and atomically writes project.config.json)
- [x] 2.7 Register all `upgrade:<action>` sub-commands in `cli/src/cli.ts`

## 3. Refactor CLI Upgrade Command (deterministic ops only)

- [x] 3.1 Rewrite `upgradeCommand` in `upgrade.ts` to call `upgrade:detect-version` for version detection
- [x] 3.2 Wire backup step to call `upgrade:backup` (retain `--skip-backup` flag support)
- [x] 3.3 Strip all migration and AI/skill invocation logic — CLI upgrade MUST NOT call the plugin skill
- [x] 3.4 On version mismatch, print guidance to run `/df-upgrade` in Claude Code instead and exit non-zero
- [x] 3.5 Retain `--dry-run` flag (show version diff only, no side effects)
- [x] 3.6 Retain `--force` flag (skip confirmation prompt)

## 4. Create Plugin Command — /df-upgrade

- [x] 4.1 Create `plugin/commands/df-upgrade.md` as the user-facing entry point for AI-driven upgrade
- [x] 4.2 Command calls `deepfield upgrade:detect-version` to gather `{from, to}` info
- [x] 4.3 If already up-to-date, report and exit
- [x] 4.4 Command calls `deepfield upgrade:backup` and surfaces backup path to user
- [x] 4.5 Command builds workspace summary payload `{from, to, workspaceSummary}` and invokes `deepfield-upgrade` skill
- [x] 4.6 On skill failure, instruct user to run `deepfield rollback <backup-path>`

## 5. Create Plugin Skill — deepfield-upgrade

- [x] 5.1 Create `plugin/skills/deepfield-upgrade.md` with skill frontmatter and instructions
- [x] 5.2 Define skill input schema: accepts `{from, to, workspaceSummary}` JSON payload
- [x] 5.3 Implement analysis step: skill reasons about structural diff between versions
- [x] 5.4 Implement apply step: skill calls `deepfield upgrade:apply-op` for each required file operation
- [x] 5.5 Implement pre-apply validation: skill calls `deepfield upgrade:validate` before applying operations
- [x] 5.6 Implement post-apply validation: skill calls `deepfield upgrade:validate` after all operations
- [x] 5.7 Implement version update step: skill calls `deepfield upgrade:set-version` on success
- [x] 5.8 Implement failure path: on validation failure, skill instructs user to run `deepfield rollback`

## 6. Testing and Verification

- [x] 6.1 Verify `deepfield upgrade:detect-version` outputs correct JSON for a valid workspace
- [x] 6.2 Verify `deepfield upgrade:backup` creates a backup and prints the path
- [x] 6.3 Verify `deepfield upgrade:apply-op --type create` writes file atomically
- [x] 6.4 Verify `deepfield upgrade:apply-op --type delete` removes file
- [x] 6.5 Verify `deepfield upgrade:apply-op --type rename` moves file atomically
- [x] 6.6 Verify `deepfield upgrade:validate` returns exit 0 for valid workspace and exit 1 for invalid
- [x] 6.7 Verify `deepfield upgrade:set-version` updates version field without touching other config fields
- [x] 6.8 Verify `deepfield upgrade --dry-run` prints diff and exits without backup or skill invocation
- [x] 6.9 Verify `/df-upgrade` end-to-end: backup created, skill invoked, version updated
- [x] 6.10 Verify `deepfield upgrade` on version mismatch prints guidance to use `/df-upgrade` and exits non-zero
