## ADDED Requirements

### Requirement: CLI SHALL expose upgrade:detect-version helper

The CLI MUST provide a `deepfield upgrade:detect-version` sub-command that outputs the current project version and CLI target version as JSON to stdout.

#### Scenario: Detect versions for a valid workspace
- **WHEN** user or skill runs `deepfield upgrade:detect-version`
- **THEN** CLI outputs `{"projectVersion": "<x.y.z>", "targetVersion": "<x.y.z>"}` to stdout
- **THEN** exit code is 0

#### Scenario: Detect versions with no deepfield workspace
- **WHEN** `deepfield upgrade:detect-version` is run in a directory without `deepfield/`
- **THEN** CLI outputs `{"projectVersion": "0.0.0", "targetVersion": "<cli-version>"}` to stdout
- **THEN** exit code is 0

### Requirement: CLI SHALL expose upgrade:backup helper

The CLI MUST provide a `deepfield upgrade:backup` sub-command that creates a timestamped backup of `deepfield/` and prints the backup path to stdout.

#### Scenario: Successful backup creation
- **WHEN** `deepfield upgrade:backup` is run in a valid workspace
- **THEN** a backup archive is created at `deepfield/.backups/<timestamp>.tar.gz`
- **THEN** the backup path is printed to stdout
- **THEN** exit code is 0

#### Scenario: Backup fails due to permissions
- **WHEN** `deepfield upgrade:backup` cannot write to the backup directory
- **THEN** error message is written to stderr
- **THEN** exit code is non-zero

### Requirement: CLI SHALL expose upgrade:apply-op helper

The CLI MUST provide a `deepfield upgrade:apply-op` sub-command that applies a single atomic file operation (create, update, delete, rename) within the `deepfield/` workspace.

#### Scenario: Create operation
- **WHEN** `deepfield upgrade:apply-op --type create --path <relative-path> --content <content>` is called
- **THEN** file is written atomically (write to temp file, then rename)
- **THEN** exit code is 0

#### Scenario: Delete operation
- **WHEN** `deepfield upgrade:apply-op --type delete --path <relative-path>` is called
- **THEN** file is removed from the workspace
- **THEN** exit code is 0

#### Scenario: Rename operation
- **WHEN** `deepfield upgrade:apply-op --type rename --path <old-path> --to <new-path>` is called
- **THEN** file is moved atomically
- **THEN** exit code is 0

#### Scenario: Invalid operation type
- **WHEN** `deepfield upgrade:apply-op --type <unknown>` is called
- **THEN** error message is written to stderr
- **THEN** exit code is non-zero

### Requirement: CLI SHALL expose upgrade:validate helper

The CLI MUST provide a `deepfield upgrade:validate` sub-command that checks the structural integrity of the `deepfield/` workspace against expected schema for the current (or specified) version.

#### Scenario: Valid workspace passes validation
- **WHEN** `deepfield upgrade:validate` is run on a structurally correct workspace
- **THEN** validation passes
- **THEN** exit code is 0

#### Scenario: Invalid workspace fails validation
- **WHEN** `deepfield upgrade:validate` is run and required directories or config fields are missing
- **THEN** validation errors are written to stdout as JSON `{"valid": false, "errors": [...]}`
- **THEN** exit code is 1

### Requirement: CLI SHALL expose upgrade:set-version helper

The CLI MUST provide a `deepfield upgrade:set-version --version <semver>` sub-command that updates the `deepfieldVersion` field in `deepfield/project.config.json` atomically.

#### Scenario: Version field updated successfully
- **WHEN** `deepfield upgrade:set-version --version 2.1.0` is called on a valid workspace
- **THEN** `deepfield/project.config.json` `deepfieldVersion` field is set to `2.1.0`
- **THEN** all other config fields are preserved
- **THEN** exit code is 0

#### Scenario: Config file missing
- **WHEN** `deepfield upgrade:set-version` is called and `deepfield/project.config.json` does not exist
- **THEN** error is written to stderr
- **THEN** exit code is non-zero
