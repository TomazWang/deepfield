## ADDED Requirements

### Requirement: Project config stores deepfield version
`project.config.json` SHALL include a `deepfieldVersion` field set to the CLI version string that created or last upgraded the project. It SHALL also include `createdWith` (version that ran `init`), `lastUpgraded` (ISO timestamp of last successful upgrade), and `migrationHistory` (array of migration records).

#### Scenario: New project has version fields
- **WHEN** `deepfield init` creates a new project
- **THEN** `project.config.json` contains `deepfieldVersion`, `createdWith` set to the current CLI version, `lastUpgraded` set to the current ISO timestamp, and `migrationHistory` as an empty array

#### Scenario: Missing version treated as 0.0.0
- **WHEN** `project.config.json` exists but has no `deepfieldVersion` field
- **THEN** the CLI SHALL treat the project version as `0.0.0` for migration purposes

### Requirement: Version mismatch detected before commands
Before executing any CLI command that operates on a project, the CLI SHALL compare `deepfieldVersion` from `project.config.json` against the installed CLI version using semver comparison.

#### Scenario: Compatible version proceeds silently
- **WHEN** `deepfieldVersion` equals the installed CLI version
- **THEN** the command proceeds without any version warning

#### Scenario: Older project version prompts upgrade
- **WHEN** `deepfieldVersion` is lower than the installed CLI version
- **THEN** the CLI SHALL print a warning showing both versions and the list of pending migrations, then prompt the user to upgrade before continuing

#### Scenario: Newer project version blocks command
- **WHEN** `deepfieldVersion` is higher than the installed CLI version
- **THEN** the CLI SHALL print an error instructing the user to upgrade their deepfield plugin and exit with a non-zero code

#### Scenario: No project config skips version check
- **WHEN** no `project.config.json` exists in the expected location
- **THEN** the version check is skipped and the command proceeds normally
