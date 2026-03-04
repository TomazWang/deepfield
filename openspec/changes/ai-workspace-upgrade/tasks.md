## 1. Remove Hard-Coded Migration Registry

- [ ] 1.1 Delete `cli/migrations/index.js` and the `cli/migrations/` directory
- [ ] 1.2 Remove `require('../../migrations/index.js')` import from `cli/src/commands/upgrade.ts`
- [ ] 1.3 Remove `getRequiredMigrations`, `runMigrations`, and `ALL_MIGRATIONS` usages from `upgrade.ts`
- [ ] 1.4 Remove `--list-migrations` option from the upgrade command

## 2. Add CLI Helper Sub-Commands

- [ ] 2.1 Create `cli/src/commands/upgrade-helpers.ts` with Commander sub-command scaffolding
- [ ] 2.2 Implement `upgrade:detect-version` sub-command (reads project config + CLI package.json, outputs JSON)
- [ ] 2.3 Implement `upgrade:backup` sub-command (wraps existing `createBackup` util, prints backup path)
- [ ] 2.4 Implement `upgrade:apply-op` sub-command (supports create, update, delete, rename with atomic writes)
- [ ] 2.5 Implement `upgrade:validate` sub-command (checks deepfield/ directory structure and config schema)
- [ ] 2.6 Implement `upgrade:set-version` sub-command (reads, updates, and atomically writes project.config.json)
- [ ] 2.7 Register all `upgrade:<action>` sub-commands in `cli/src/cli.ts`

## 3. Refactor CLI Upgrade Command (deterministic ops only)

- [ ] 3.1 Rewrite `upgradeCommand` in `upgrade.ts` to call `upgrade:detect-version` for version detection
- [ ] 3.2 Wire backup step to call `upgrade:backup` (retain `--skip-backup` flag support)
- [ ] 3.3 Strip all migration and AI/skill invocation logic — CLI upgrade MUST NOT call the plugin skill
- [ ] 3.4 On version mismatch, print guidance to run `/df-upgrade` in Claude Code instead and exit non-zero
- [ ] 3.5 Retain `--dry-run` flag (show version diff only, no side effects)
- [ ] 3.6 Retain `--force` flag (skip confirmation prompt)

## 4. Create Plugin Command — /df-upgrade

- [ ] 4.1 Create `plugin/commands/df-upgrade.md` as the user-facing entry point for AI-driven upgrade
- [ ] 4.2 Command calls `deepfield upgrade:detect-version` to gather `{from, to}` info
- [ ] 4.3 If already up-to-date, report and exit
- [ ] 4.4 Command calls `deepfield upgrade:backup` and surfaces backup path to user
- [ ] 4.5 Command builds workspace summary payload `{from, to, workspaceSummary}` and invokes `deepfield-upgrade` skill
- [ ] 4.6 On skill failure, instruct user to run `deepfield rollback <backup-path>`

## 5. Create Plugin Skill — deepfield-upgrade

- [ ] 5.1 Create `plugin/skills/deepfield-upgrade.md` with skill frontmatter and instructions
- [ ] 5.2 Define skill input schema: accepts `{from, to, workspaceSummary}` JSON payload
- [ ] 5.3 Implement analysis step: skill reasons about structural diff between versions
- [ ] 5.4 Implement apply step: skill calls `deepfield upgrade:apply-op` for each required file operation
- [ ] 5.5 Implement pre-apply validation: skill calls `deepfield upgrade:validate` before applying operations
- [ ] 5.6 Implement post-apply validation: skill calls `deepfield upgrade:validate` after all operations
- [ ] 5.7 Implement version update step: skill calls `deepfield upgrade:set-version` on success
- [ ] 5.8 Implement failure path: on validation failure, skill instructs user to run `deepfield rollback`

## 6. Testing and Verification

- [ ] 6.1 Verify `deepfield upgrade:detect-version` outputs correct JSON for a valid workspace
- [ ] 6.2 Verify `deepfield upgrade:backup` creates a backup and prints the path
- [ ] 6.3 Verify `deepfield upgrade:apply-op --type create` writes file atomically
- [ ] 6.4 Verify `deepfield upgrade:apply-op --type delete` removes file
- [ ] 6.5 Verify `deepfield upgrade:apply-op --type rename` moves file atomically
- [ ] 6.6 Verify `deepfield upgrade:validate` returns exit 0 for valid workspace and exit 1 for invalid
- [ ] 6.7 Verify `deepfield upgrade:set-version` updates version field without touching other config fields
- [ ] 6.8 Verify `deepfield upgrade --dry-run` prints diff and exits without backup or skill invocation
- [ ] 6.9 Verify `/df-upgrade` end-to-end: backup created, skill invoked, version updated
- [ ] 6.10 Verify `deepfield upgrade` on version mismatch prints guidance to use `/df-upgrade` and exits non-zero
