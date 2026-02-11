## ADDED Requirements

### Requirement: Compute file hashes for tracking

The system SHALL compute SHA-256 hashes for all files in source directories to enable change detection across runs.

#### Scenario: Hash all baseline files
- **WHEN** run begins
- **THEN** system computes hashes for all files in `source/baseline/`

#### Scenario: Hash new run files
- **WHEN** run begins with new sources in `source/run-N/`
- **THEN** system computes hashes for all files in current run folder

#### Scenario: Store hashes in run config
- **WHEN** run completes
- **THEN** system stores file paths and hashes in `wip/run-N/run-N.config.json`

### Requirement: Compare hashes between runs

The system SHALL compare current file hashes against previous run hashes to identify changed, new, and unchanged files.

#### Scenario: Identify changed files
- **WHEN** file exists in both runs but hash differs
- **THEN** system marks file as changed and includes in scan

#### Scenario: Identify new files
- **WHEN** file exists in current run but not in previous run
- **THEN** system marks file as new and includes in scan

#### Scenario: Identify unchanged files
- **WHEN** file exists in both runs with identical hash
- **THEN** system marks file as unchanged and skips deep read

#### Scenario: Handle deleted files
- **WHEN** file existed in previous run but not in current run
- **THEN** system logs deletion but does not affect current scan

### Requirement: Read only changed or new files

The system SHALL perform deep reads only on files that have changed or are new since the previous run, skipping unchanged files.

#### Scenario: Skip unchanged baseline files
- **WHEN** baseline file hash matches previous run
- **THEN** system skips deep read and uses previous findings

#### Scenario: Read changed baseline files
- **WHEN** baseline file hash differs from previous run
- **THEN** system performs deep read to capture changes

#### Scenario: Read all new run files
- **WHEN** run includes new sources in `source/run-N/`
- **THEN** system performs deep read on all new run files regardless of hashing

### Requirement: Optimize for large codebases

The system SHALL efficiently handle repositories with thousands of files by batching hash computation and limiting scan scope.

#### Scenario: Batch hash computation
- **WHEN** computing hashes for large repository (>1000 files)
- **THEN** system processes files in batches to avoid memory overflow

#### Scenario: Limit scan to relevant files
- **WHEN** focus topic targets specific domain
- **THEN** system limits hash comparison to files relevant to that domain

#### Scenario: Skip ignored patterns
- **WHEN** computing hashes
- **THEN** system skips files matching ignore patterns (node_modules, .git, build artifacts)

### Requirement: Handle first run without previous hashes

The system SHALL perform full scan during Run 0 when no previous hashes exist.

#### Scenario: Full scan on bootstrap
- **WHEN** Run 0 executes with no previous run config
- **THEN** system performs shallow structural scan of all files and computes initial hashes

#### Scenario: Establish baseline hashes
- **WHEN** Run 0 completes
- **THEN** system stores hashes in `wip/run-0/run-0.config.json` for future comparison
