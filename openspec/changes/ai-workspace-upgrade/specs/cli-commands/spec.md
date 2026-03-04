## MODIFIED Requirements

### Requirement: upgrade command SHALL orchestrate AI-driven workspace upgrade

The upgrade command MUST detect versions, create a backup, invoke the `deepfield-upgrade` plugin skill with a structured diff payload, and report results. It SHALL NOT run migration logic directly.

#### Scenario: Upgrade available
- **WHEN** user runs `deepfield upgrade` and project version is behind target version
- **THEN** CLI detects versions via `upgrade:detect-version`
- **THEN** CLI creates a backup via `upgrade:backup` (unless `--skip-backup` is passed)
- **THEN** CLI invokes the `deepfield-upgrade` skill with `{from, to, workspaceSummary}` payload
- **THEN** skill applies changes and validates workspace
- **THEN** CLI reports success with summary of applied changes

#### Scenario: Already up to date
- **WHEN** user runs `deepfield upgrade` and project version equals target version
- **THEN** CLI outputs "Already up to date" message
- **THEN** exit code is 0
- **THEN** no backup is created and no skill is invoked

#### Scenario: Dry run shows what would change
- **WHEN** user runs `deepfield upgrade --dry-run`
- **THEN** CLI detects versions and displays the version diff
- **THEN** no backup is created
- **THEN** skill is NOT invoked
- **THEN** CLI outputs "(dry run — no changes made)"

#### Scenario: Upgrade fails — backup path provided
- **WHEN** skill invocation fails or post-validate fails
- **THEN** CLI outputs error details
- **THEN** CLI prints the backup path with instruction to run `deepfield rollback`
- **THEN** exit code is non-zero

## REMOVED Requirements

### Requirement: upgrade command SHALL run hard-coded migration scripts
**Reason**: Replaced by AI-driven plugin skill (`workspace-upgrade-skill`). The static migration registry (`cli/migrations/index.js`) is removed entirely.
**Migration**: No user action required. The `deepfield upgrade` command interface is unchanged; the migration execution is now handled by the plugin skill internally.
