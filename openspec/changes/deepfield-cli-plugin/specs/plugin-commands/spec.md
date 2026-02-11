## ADDED Requirements

### Requirement: Plugin commands SHALL be thin wrappers around CLI

All plugin commands MUST call the standalone CLI tool and format output for Claude.

#### Scenario: df-init command execution
- **WHEN** user runs /df-init in Claude Code
- **THEN** command calls `deepfield init`
- **THEN** CLI output is captured
- **THEN** success/failure is reported to Claude

#### Scenario: Error propagation
- **WHEN** CLI command fails
- **THEN** plugin command detects non-zero exit code
- **THEN** error message is formatted for Claude
- **THEN** suggested next action is provided

### Requirement: Plugin commands SHALL add Claude-friendly messaging

Plugin commands MUST enhance CLI output with context-appropriate suggestions.

#### Scenario: Successful init
- **WHEN** /df-init succeeds
- **THEN** success message includes next steps
- **THEN** mentions /df-start command
- **THEN** explains what to do next

#### Scenario: State transition guidance
- **WHEN** command changes workflow state
- **THEN** new state is explained
- **THEN** next available commands are listed

### Requirement: Plugin commands SHALL handle CLI dependencies

Plugin commands MUST verify CLI tool is available before execution.

#### Scenario: CLI available
- **WHEN** plugin command runs
- **THEN** deepfield CLI is found in PATH or bundled location
- **THEN** command executes normally

#### Scenario: CLI not found
- **WHEN** deepfield CLI is not available
- **THEN** clear error message is shown
- **THEN** installation instructions are provided
