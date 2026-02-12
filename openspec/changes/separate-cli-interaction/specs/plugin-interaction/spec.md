## ADDED Requirements

### Requirement: Plugin commands SHALL use AskUserQuestion for interaction

Plugin commands (df-*) SHALL use Claude Code's AskUserQuestion tool for all user interaction instead of invoking interactive CLI commands that require stdin.

#### Scenario: Plugin command collects user input
- **WHEN** plugin command needs user input
- **THEN** it uses AskUserQuestion tool with structured options
- **THEN** user sees Claude Code's native prompt interface
- **THEN** answers are captured in plugin context

#### Scenario: Plugin command does not invoke blocking CLI
- **WHEN** plugin command needs to run CLI tool
- **THEN** it calls CLI with non-interactive flags
- **THEN** it passes collected answers via --answers-json flag
- **THEN** CLI executes without prompting for stdin

### Requirement: df-start SHALL implement Q&A using AskUserQuestion

The df-start command SHALL collect all setup information using AskUserQuestion tool, not by calling `deepfield start` CLI.

#### Scenario: df-start asks project type question
- **WHEN** user runs /df-start
- **THEN** AskUserQuestion asks "What is this project?"
- **THEN** options include: Legacy codebase, New team onboarding, Vendor system, Monolith to decompose
- **THEN** user selects one option
- **THEN** answer stored in PROJECT_TYPE variable

#### Scenario: df-start asks goal question
- **WHEN** df-start continues after project type
- **THEN** AskUserQuestion asks "What's your goal?"
- **THEN** options include: Understand architecture, Document for onboarding, Compliance audit, Plan decomposition
- **THEN** user selects one option
- **THEN** answer stored in GOAL variable

#### Scenario: df-start asks focus areas question
- **WHEN** df-start continues after goal
- **THEN** AskUserQuestion asks "Any specific areas of concern?"
- **THEN** multiSelect enabled for multiple choices
- **THEN** options include: Authentication & Security, Data Flow & State, API & Integration, Deployment & Operations
- **THEN** user selects multiple options
- **THEN** answers stored in FOCUS_AREAS array

#### Scenario: df-start asks max runs question
- **WHEN** df-start continues after focus areas
- **THEN** AskUserQuestion asks "How many learning runs?"
- **THEN** options include: "3 runs (Recommended)", "5 runs", "10 runs", "Until plan complete"
- **THEN** user selects one option
- **THEN** answer converted to number and stored in MAX_RUNS variable

#### Scenario: df-start calls CLI non-interactively after Q&A
- **WHEN** all questions answered
- **THEN** df-start formats answers as JSON
- **THEN** df-start calls `deepfield start --non-interactive --answers-json "$ANSWERS"`
- **THEN** CLI processes answers without prompting
- **THEN** brief.md and config created

### Requirement: Skills SHALL not invoke interactive CLI commands

Skills SHALL never directly invoke CLI commands that require interactive input (stdin prompts).

#### Scenario: Skill needs user input
- **WHEN** skill requires user decision
- **THEN** skill uses AskUserQuestion in markdown
- **THEN** skill collects answer before proceeding
- **THEN** skill passes answer to CLI via flags

#### Scenario: Skill invokes CLI for operations
- **WHEN** skill needs to run CLI command
- **THEN** skill uses --non-interactive flag
- **THEN** skill provides all required inputs via flags
- **THEN** CLI executes without blocking on stdin

### Requirement: Agents SHALL not block on stdin

Agents SHALL be invoked with all required inputs and SHALL not prompt for stdin during execution.

#### Scenario: Agent processes user-provided input
- **WHEN** agent needs user context
- **THEN** user context provided via agent invocation parameters
- **THEN** agent uses provided context for decisions
- **THEN** agent never prompts for additional stdin input

#### Scenario: Agent reports missing input
- **WHEN** agent lacks required input
- **THEN** agent reports error describing missing input
- **THEN** agent suggests what input is needed
- **THEN** agent exits gracefully without hanging
