## MODIFIED Requirements

### Requirement: CLI upgrade command SHALL perform deterministic-only operations

The CLI `upgrade` command MUST detect versions and create a backup. It MUST NOT invoke the `deepfield-upgrade` plugin skill or any AI. It SHALL NOT run migration logic directly. The AI-driven upgrade flow is initiated by the `/df-upgrade` plugin command, not the CLI.

#### Scenario: Already up to date (CLI check)
- **WHEN** user runs `deepfield upgrade` and project version equals target version
- **THEN** CLI outputs "Already up to date" message
- **THEN** exit code is 0
- **THEN** no backup is created

#### Scenario: Dry run shows version diff
- **WHEN** user runs `deepfield upgrade --dry-run`
- **THEN** CLI detects versions via `upgrade:detect-version` and displays the version diff
- **THEN** no backup is created
- **THEN** CLI outputs "(dry run — no changes made)"
- **THEN** CLI MUST NOT invoke the plugin skill

#### Scenario: CLI backup step
- **WHEN** user runs `deepfield upgrade` (non-dry-run, upgrade available)
- **THEN** CLI detects versions via `upgrade:detect-version`
- **THEN** CLI creates a backup via `upgrade:backup` (unless `--skip-backup` is passed)
- **THEN** CLI outputs backup path and instructs user to run `/df-upgrade` for the AI-driven upgrade

**Note**: The CLI `upgrade` command NEVER invokes the plugin. The plugin (`/df-upgrade`) is the correct entry point for AI-driven upgrade and calls CLI helpers itself.

## REMOVED Requirements

### Requirement: upgrade command SHALL run hard-coded migration scripts
**Reason**: Replaced by AI-driven plugin skill (`workspace-upgrade-skill`) invoked via the `/df-upgrade` plugin command. The static migration registry (`cli/migrations/index.js`) is removed entirely.
**Migration**: Users should use `/df-upgrade` (plugin command) for AI-driven workspace upgrades. The `deepfield upgrade` CLI command is retained only for deterministic pre-flight operations.
