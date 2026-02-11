## ADDED Requirements

### Requirement: Directory creation SHALL be recursive and idempotent

The system MUST create nested directories in a single operation and succeed silently if directories already exist.

#### Scenario: Create nested directories successfully
- **WHEN** mkdir-recursive.sh is called with path "kb/wip/run-0/domains"
- **THEN** all parent directories are created
- **THEN** operation succeeds even if some directories exist

#### Scenario: Permission denied returns error
- **WHEN** mkdir-recursive.sh is called without write permissions
- **THEN** script exits with non-zero status
- **THEN** error message indicates permission issue

### Requirement: JSON updates SHALL be atomic

All JSON file updates MUST use write-to-temp-then-rename pattern to prevent partial writes.

#### Scenario: JSON update completes atomically
- **WHEN** update-json.js modifies a JSON file
- **THEN** changes are written to temporary file first
- **THEN** temporary file is renamed to target (atomic operation)
- **THEN** no partial or corrupted state exists on disk

#### Scenario: Failed update leaves original file intact
- **WHEN** update-json.js encounters error during write
- **THEN** original JSON file remains unchanged
- **THEN** temporary file is cleaned up or left for inspection

### Requirement: JSON read SHALL handle missing files gracefully

Reading JSON files MUST return empty object or specified default when file doesn't exist.

#### Scenario: Read existing JSON file
- **WHEN** read-state.js reads existing project.config.json
- **THEN** parsed JSON object is returned

#### Scenario: Read missing JSON file with default
- **WHEN** read-state.js reads non-existent file with default {}
- **THEN** default object is returned
- **THEN** no error is thrown

### Requirement: File hashing SHALL support git and MD5 algorithms

The system MUST compute file hashes using:
- Git blob hash for files in git repositories (via `git ls-tree`)
- MD5 hash for all other files

#### Scenario: Hash files in git repository
- **WHEN** hash-files.js processes files in a git repo
- **THEN** git blob hashes are computed via git ls-tree
- **THEN** output includes file path and hash

#### Scenario: Hash non-git files
- **WHEN** hash-files.js processes files outside git repo
- **THEN** MD5 hashes are computed
- **THEN** output includes file path and hash

### Requirement: Scripts SHALL exit with meaningful status codes

All scripts MUST return:
- Exit code 0 for success
- Non-zero exit codes for failures
- Error messages to stderr for debugging

#### Scenario: Successful operation returns zero
- **WHEN** script completes successfully
- **THEN** exit code is 0

#### Scenario: Failed operation returns non-zero
- **WHEN** script encounters error (permission, missing file, etc.)
- **THEN** exit code is non-zero
- **THEN** error message is written to stderr
