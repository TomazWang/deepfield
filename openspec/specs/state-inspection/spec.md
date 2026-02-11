# state-inspection Specification

## Purpose
TBD - created by archiving change deepfield-foundation. Update Purpose after archive.
## Requirements
### Requirement: /df-status SHALL display current state summary

The command MUST read and display:
- Project name and goal (from project.config.json)
- Current state (from state machine: EMPTY, INITIALIZED, BRIEF_CREATED, etc.)
- Run count (number of completed runs)
- Last modified timestamp

#### Scenario: Display status for initialized project
- **WHEN** user runs /df-status after /df-init and /df-start
- **THEN** project name and goal are displayed
- **THEN** current state shows "BRIEF_CREATED"
- **THEN** run count shows 0
- **THEN** last modified timestamp is shown

#### Scenario: Display status for project with runs
- **WHEN** user runs /df-status after multiple learning runs (Phase 2+)
- **THEN** run count shows number of completed runs
- **THEN** state reflects learning progress

### Requirement: /df-status SHALL support verbose mode

The command MUST accept `--verbose` flag to display detailed information:
- All project configuration fields
- Source files list (baseline and per-run)
- Detailed run history with timestamps
- File hash statistics (if available)

#### Scenario: Display verbose status
- **WHEN** user runs /df-status --verbose
- **THEN** all configuration details are shown
- **THEN** source files are listed
- **THEN** run history is displayed

#### Scenario: Display minimal status by default
- **WHEN** user runs /df-status without flags
- **THEN** only essential information is shown
- **THEN** output is concise and readable

### Requirement: /df-status SHALL handle missing state gracefully

If state files are missing or corrupted, the system MUST display informative error.

#### Scenario: Status with missing project.config.json
- **WHEN** /df-status runs and project.config.json doesn't exist
- **THEN** error indicates project not initialized
- **THEN** user is instructed to run /df-init

#### Scenario: Status with corrupted state file
- **WHEN** /df-status reads corrupted JSON
- **THEN** error indicates which file is corrupted
- **THEN** suggested fix is provided (restore from backup, re-init)

### Requirement: /df-status SHALL determine workflow state

The system MUST infer current workflow state from file existence:
- EMPTY: No kb/ directory
- INITIALIZED: kb/ exists, no project.config.json
- BRIEF_CREATED: project.config.json and brief.md exist
- BRIEF_READY: brief.md filled out (Phase 2+)
- RUN_0_COMPLETE: run-0 completed (Phase 2+)

#### Scenario: Detect INITIALIZED state
- **WHEN** kb/ exists but project.config.json doesn't
- **THEN** state is "INITIALIZED"
- **THEN** suggested action is "Run /df-start"

#### Scenario: Detect BRIEF_CREATED state
- **WHEN** project.config.json and brief.md exist
- **THEN** state is "BRIEF_CREATED"
- **THEN** suggested action is "Fill out brief.md, then run /df-bootstrap"

### Requirement: /df-status SHALL suggest next actions

Based on current state, the system MUST recommend the appropriate next command.

#### Scenario: Suggest initialization
- **WHEN** state is EMPTY
- **THEN** suggests running /df-init

#### Scenario: Suggest setup
- **WHEN** state is INITIALIZED
- **THEN** suggests running /df-start

#### Scenario: Suggest completing brief
- **WHEN** state is BRIEF_CREATED
- **THEN** suggests filling out brief.md
- **THEN** mentions /df-bootstrap as next step (Phase 2)

### Requirement: Status display SHALL be formatted clearly

Output MUST use clear formatting:
- Section headers for different information types
- Aligned key-value pairs
- Color coding for state (if terminal supports it)
- Emoji or symbols for visual clarity (optional)

#### Scenario: Readable status output
- **WHEN** /df-status displays information
- **THEN** output uses clear section headers
- **THEN** data is aligned and formatted
- **THEN** important information stands out

