## MODIFIED Requirements

### Requirement: Project configuration SHALL be stored in JSON

The system MUST maintain project configuration in `kb/project.config.json` with fields:
- `version`: Schema version (string)
- `projectName`: User-provided project name
- `goal`: User's goal for the knowledge base
- `repositories`: Array of repo configurations (url, branch, commitHash)
- `maxRuns`: Maximum consecutive autonomous runs before pausing (integer, default: 5)
- `createdAt`: ISO timestamp
- `lastModified`: ISO timestamp

**Changes from previous version:**
- Added `maxRuns` field for configurable stop condition

#### Scenario: Create initial project configuration
- **WHEN** /df-start initializes a project
- **THEN** project.config.json is created in kb/ directory
- **THEN** all required fields are populated including maxRuns
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
- `focusTopics`: Array of topic names that were focus of this run
- `confidenceChanges`: Object mapping topic names to before/after confidence percentages

**Changes from previous version:**
- Added `focusTopics` field to track run focus
- Added `confidenceChanges` field to track learning progress

#### Scenario: Create run configuration on run start
- **WHEN** a new learning run begins
- **THEN** run-N.config.json is created with runNumber and startedAt
- **THEN** status is set to "in-progress"
- **THEN** fileHashes is initialized as empty object
- **THEN** focusTopics is populated with selected topics for this run

#### Scenario: Update run configuration on completion
- **WHEN** learning run completes successfully
- **THEN** completedAt timestamp is set
- **THEN** status is updated to "completed"
- **THEN** fileHashes contains computed hashes for all scanned files
- **THEN** confidenceChanges records before/after confidence for each topic

## ADDED Requirements

### Requirement: Learning plan state SHALL be tracked

The system SHALL maintain learning plan state in `wip/learning-plan.md` with structured data about topics, confidence, priorities, and questions.

#### Scenario: Track topic confidence
- **WHEN** learning plan is updated
- **THEN** each topic includes current confidence percentage (0-100%)
- **THEN** confidence changes are reflected after each run

#### Scenario: Track topic priorities
- **WHEN** learning plan is maintained
- **THEN** each topic has priority level (HIGH/MEDIUM/LOW)
- **THEN** priorities can be updated based on discoveries

#### Scenario: Track open questions
- **WHEN** learning reveals unknowns
- **THEN** questions are added to relevant topics in learning plan
- **THEN** questions are marked as answered when resolved

### Requirement: Run progression SHALL be tracked

The system SHALL track consecutive run count and reset conditions for autonomous execution control.

#### Scenario: Track consecutive runs
- **WHEN** autonomous iteration executes multiple runs
- **THEN** system tracks count of consecutive runs in current session
- **THEN** count is compared against maxRuns stop condition

#### Scenario: Reset run count on user interaction
- **WHEN** user adds new sources or provides feedback
- **THEN** consecutive run count resets
- **THEN** autonomous execution can continue for maxRuns more

### Requirement: Stop condition configuration SHALL be managed

The system SHALL support user-configurable stop conditions including max runs, plan completion criteria, and diminishing returns thresholds.

#### Scenario: Configure max runs
- **WHEN** user sets maxRuns during init or in config
- **THEN** autonomous execution pauses after that many consecutive runs
- **THEN** user must explicitly continue or system awaits input

#### Scenario: Detect plan completion
- **WHEN** all HIGH priority topics reach confidence threshold
- **THEN** system stops autonomous execution
- **THEN** plan completion is reported to user
