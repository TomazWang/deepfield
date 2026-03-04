## ADDED Requirements

### Requirement: deepfield upgrade command exists
The CLI SHALL expose a `deepfield upgrade` command that detects the current project version, determines required migrations, optionally creates a backup, runs the migration chain, and reports results.

#### Scenario: Upgrade from old to current
- **WHEN** user runs `deepfield upgrade` in a project directory with an older `deepfieldVersion`
- **THEN** the CLI prints the current and target versions, lists pending migrations, prompts for confirmation, creates a backup, runs all migrations in sequence, and prints a success summary with files created/updated

#### Scenario: Already up to date
- **WHEN** user runs `deepfield upgrade` and the project is already at the current version
- **THEN** the CLI prints "Already up to date" and exits with code 0

### Requirement: upgrade --dry-run shows changes without applying
`deepfield upgrade --dry-run` SHALL print what migrations would run and what files would be created or modified, without making any changes to the project or creating a backup.

#### Scenario: Dry run output
- **WHEN** user runs `deepfield upgrade --dry-run`
- **THEN** CLI lists each migration with its description and estimated changes, prints "No changes made (dry run)", and exits with code 0

### Requirement: upgrade --force skips confirmation
`deepfield upgrade --force` SHALL skip all interactive confirmation prompts and proceed directly to backup and migration.

#### Scenario: Force skips prompt
- **WHEN** user runs `deepfield upgrade --force`
- **THEN** the CLI does not prompt for confirmation before running migrations

### Requirement: upgrade --skip-backup skips backup creation
`deepfield upgrade --skip-backup` SHALL skip the backup step and run migrations directly.

#### Scenario: Skip backup warning
- **WHEN** user runs `deepfield upgrade --skip-backup`
- **THEN** the CLI prints a warning that no backup will be created, then proceeds with migrations

### Requirement: upgrade --list-migrations shows available migrations
`deepfield upgrade --list-migrations` SHALL print all registered migration modules with their from/to versions and descriptions, then exit.

#### Scenario: List output
- **WHEN** user runs `deepfield upgrade --list-migrations`
- **THEN** CLI prints a table of all available migrations and exits with code 0

### Requirement: upgrade --to targets specific version
`deepfield upgrade --to <version>` SHALL run only the migrations needed to reach the specified target version rather than the latest.

#### Scenario: Partial upgrade to intermediate version
- **WHEN** user runs `deepfield upgrade --to 2.1.0` on a v1.0.0 project
- **THEN** only migrations up to v2.1.0 are applied
