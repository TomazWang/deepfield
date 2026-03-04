## ADDED Requirements

### Requirement: deepfield rollback command exists
The CLI SHALL expose a `deepfield rollback [backup-id]` command that lists available backups (or restores a specific one), replaces the current `deepfield/` directory with the backup, and updates `project.config.json` to match the backed-up version.

#### Scenario: List backups when no backup-id provided
- **WHEN** user runs `deepfield rollback` with no argument
- **THEN** CLI lists all available backups with their IDs, timestamps, versions, and sizes, then prompts the user to select one

#### Scenario: Restore specific backup
- **WHEN** user runs `deepfield rollback backup-2026-03-04T15-30-00`
- **THEN** CLI confirms the action (showing current version and backup version), prompts for confirmation, then replaces `deepfield/` with the backup and prints success

#### Scenario: Confirm before restore
- **WHEN** user runs `deepfield rollback <id>` without `--force`
- **THEN** CLI shows a warning with current and backup versions and requires explicit confirmation before proceeding

#### Scenario: No backups available
- **WHEN** `.deepfield-backups/` is empty or does not exist
- **THEN** CLI prints "No backups found" and exits with code 1

### Requirement: rollback --force skips confirmation
`deepfield rollback --force <backup-id>` SHALL restore the backup without any interactive prompt.

#### Scenario: Force restore
- **WHEN** user runs `deepfield rollback --force backup-2026-03-04T15-30-00`
- **THEN** the backup is restored immediately without prompting
