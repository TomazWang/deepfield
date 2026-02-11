## ADDED Requirements

### Requirement: init command SHALL create deepfield/ directory structure

The init command MUST create a complete deepfield/ directory with four-space architecture (source/, wip/, drafts/, output/).

#### Scenario: Initialize new kb
- **WHEN** user runs `deepfield init` in empty directory
- **THEN** deepfield/ directory is created with all subdirectories
- **THEN** template files are copied
- **THEN** success message is displayed

#### Scenario: Detect existing kb
- **WHEN** user runs `deepfield init` and deepfield/ exists
- **THEN** warning is displayed about existing directory
- **THEN** user is prompted to continue or cancel
- **THEN** existing files are preserved if continue

### Requirement: start command SHALL conduct interactive setup

The start command MUST ask questions using Inquirer.js and generate brief.md with answers.

#### Scenario: Interactive Q&A
- **WHEN** user runs `deepfield start`
- **THEN** questions are asked about project type and goals
- **THEN** answers are collected via interactive prompts
- **THEN** brief.md is generated with prefilled sections

#### Scenario: Validate prerequisites
- **WHEN** user runs `deepfield start` without deepfield/
- **THEN** error indicates deepfield/ not found
- **THEN** suggests running `deepfield init` first

### Requirement: status command SHALL display current state

The status command MUST read state files and display formatted project information.

#### Scenario: Display basic status
- **WHEN** user runs `deepfield status`
- **THEN** project name and goal are shown
- **THEN** current workflow state is displayed
- **THEN** suggested next action is provided

#### Scenario: Verbose mode
- **WHEN** user runs `deepfield status --verbose`
- **THEN** all configuration fields are displayed
- **THEN** source file counts are shown
- **THEN** run history is listed (if applicable)

### Requirement: Commands SHALL have consistent error handling

All commands MUST handle errors gracefully with meaningful messages and exit codes.

#### Scenario: Permission error
- **WHEN** command fails due to permissions
- **THEN** error message indicates permission issue
- **THEN** suggested fix is provided
- **THEN** exit code is 4

#### Scenario: Missing state file
- **WHEN** command cannot read required state
- **THEN** error indicates which file is missing
- **THEN** recovery steps are suggested
- **THEN** exit code is 3
