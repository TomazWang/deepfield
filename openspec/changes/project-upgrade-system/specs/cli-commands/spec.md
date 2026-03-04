## ADDED Requirements

### Requirement: upgrade command registered in CLI
The CLI SHALL register a `deepfield upgrade` command via Commander.js in `cli/src/commands/upgrade.ts` with options `--dry-run`, `--to <version>`, `--skip-backup`, `--force`, and `--list-migrations`.

#### Scenario: upgrade command help
- **WHEN** user runs `deepfield upgrade --help`
- **THEN** all supported options are listed with descriptions

### Requirement: rollback command registered in CLI
The CLI SHALL register a `deepfield rollback [backup-id]` command via Commander.js in `cli/src/commands/rollback.ts` with option `--force`.

#### Scenario: rollback command help
- **WHEN** user runs `deepfield rollback --help`
- **THEN** usage, backup-id argument description, and --force option are shown
