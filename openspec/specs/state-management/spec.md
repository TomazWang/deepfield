# state-management Specification

## Purpose
TBD - created by archiving change deepfield-foundation. Update Purpose after archive.
## Requirements
### Requirement: Project configuration SHALL be stored in JSON

The system MUST maintain project configuration in `kb/project.config.json` with fields:
- `version`: Schema version (string)
- `projectName`: User-provided project name
- `goal`: User's goal for the knowledge base
- `repositories`: Array of repo configurations (url, branch, commitHash)
- `createdAt`: ISO timestamp
- `lastModified`: ISO timestamp

#### Scenario: Create initial project configuration
- **WHEN** /df-start initializes a project
- **THEN** project.config.json is created in kb/ directory
- **THEN** all required fields are populated
- **THEN** version is set to "1.0.0"

#### Scenario: Update project configuration preserves existing data
- **WHEN** project configuration is updated
- **THEN** only specified fields are modified
- **THEN** other fields remain unchanged
- **THEN** lastModified timestamp is updated

### Requirement: Run configuration SHALL track per-run metadata

Each run MUST have a configuration file at `kb/wip/run-N/run-N.config.json` containing:
- `runNumber`: Integer run number
- `startedAt`: ISO timestamp
- `completedAt`: ISO timestamp (when run finishes)
- `fileHashes`: Object mapping file paths to hash values
- `status`: "in-progress" | "completed" | "failed"

#### Scenario: Create run configuration on run start
- **WHEN** a new learning run begins
- **THEN** run-N.config.json is created with runNumber and startedAt
- **THEN** status is set to "in-progress"
- **THEN** fileHashes is initialized as empty object

#### Scenario: Update run configuration on completion
- **WHEN** learning run completes successfully
- **THEN** completedAt timestamp is set
- **THEN** status is updated to "completed"
- **THEN** fileHashes contains computed hashes for all scanned files

### Requirement: State reading SHALL validate JSON schema

Reading state files MUST validate required fields and return clear errors for invalid data.

#### Scenario: Read valid state file
- **WHEN** read-state.js reads well-formed JSON with required fields
- **THEN** parsed data is returned

#### Scenario: Read invalid state file
- **WHEN** read-state.js reads JSON missing required fields
- **THEN** error indicates which fields are missing
- **THEN** script exits with non-zero status

#### Scenario: Read malformed JSON
- **WHEN** read-state.js reads syntactically invalid JSON
- **THEN** parse error is reported
- **THEN** script exits with non-zero status

### Requirement: State updates SHALL be atomic and versioned

All state updates MUST:
- Use atomic write operations (temp-then-rename)
- Preserve schema version field
- Update lastModified timestamp automatically

#### Scenario: Atomic state update preserves consistency
- **WHEN** update-json.js modifies state file
- **THEN** write-to-temp-then-rename ensures atomicity
- **THEN** version field is preserved
- **THEN** lastModified is updated to current time

### Requirement: State files SHALL be human-readable

All JSON state files MUST be formatted with 2-space indentation for readability.

#### Scenario: State files are formatted consistently
- **WHEN** any state file is written or updated
- **THEN** JSON is formatted with 2-space indentation
- **THEN** fields are in consistent order
- **THEN** files are readable in text editors

