## ADDED Requirements

### Requirement: Scaffolding SHALL create complete directory tree

The scaffolding logic MUST create all required directories and subdirectories for the four-space architecture.

#### Scenario: Create source directories
- **WHEN** scaffold function executes
- **THEN** source/baseline/repos/ is created
- **THEN** source/baseline/trusted-docs/ is created
- **THEN** source/run-0/ is created

#### Scenario: Create wip directories
- **WHEN** scaffold function executes
- **THEN** wip/run-0/domains/ is created
- **THEN** wip/ contains project-map.md and domain-index.md placeholders

### Requirement: State management SHALL use JSON with Zod validation

All state files MUST be validated using Zod schemas before read/write operations.

#### Scenario: Read valid state file
- **WHEN** reading project.config.json
- **THEN** JSON is parsed and validated against ProjectConfigSchema
- **THEN** typed data object is returned

#### Scenario: Read invalid state file
- **WHEN** state file fails Zod validation
- **THEN** detailed validation errors are provided
- **THEN** specific missing fields are identified

### Requirement: File operations SHALL be atomic

All file writes MUST use write-to-temp-then-rename pattern to prevent corruption.

#### Scenario: Atomic write success
- **WHEN** updating JSON file
- **THEN** data is written to .tmp file first
- **THEN** .tmp file is renamed to target (atomic)
- **THEN** no partial state exists on disk

#### Scenario: Atomic write failure
- **WHEN** write operation fails
- **THEN** original file remains unchanged
- **THEN** .tmp file is cleaned up or left for inspection

### Requirement: Template system SHALL support file copying

The template system MUST copy template files to deepfield/ with proper paths.

#### Scenario: Copy templates
- **WHEN** templates are deployed
- **THEN** all template files are copied to correct locations
- **THEN** file permissions are preserved
- **THEN** existing files are not overwritten without confirmation

### Requirement: File hashing SHALL support git and MD5

The hashing utility MUST compute git blob hashes for git repos and MD5 for other files.

#### Scenario: Hash git repository files
- **WHEN** hashing files in git repo
- **THEN** git ls-tree is used for hashes
- **THEN** git blob hashes are returned

#### Scenario: Hash non-git files
- **WHEN** hashing files outside git repo
- **THEN** MD5 algorithm is used
- **THEN** file path and hash are returned
