# interactive-setup Specification

## Purpose
TBD - created by archiving change deepfield-foundation. Update Purpose after archive.
## Requirements
### Requirement: /df-start SHALL conduct interactive Q&A

The command MUST ask the user essential questions via AskUserQuestion tool:
- What is this project?
- What's your goal for this knowledge base?
- Any specific areas of concern?

#### Scenario: Interactive setup collects user input
- **WHEN** user runs /df-start
- **THEN** system asks project-related questions
- **THEN** user provides answers via interactive prompts
- **THEN** answers are captured for configuration

#### Scenario: User cancels interactive setup
- **WHEN** user cancels during Q&A
- **THEN** setup is aborted gracefully
- **THEN** no files are modified
- **THEN** user can retry /df-start later

### Requirement: /df-start SHALL generate brief.md template

After Q&A, the system MUST create `kb/source/baseline/brief.md` with:
- Structured sections for user to fill:
  - Project description
  - Why this KB (onboarding? audit? takeover?)
  - Repository URLs with branch/tag per repo
  - Key documents (paths or URLs)
  - People & tribal knowledge context
  - Known pain points
  - Topics of interest (checklist)
  - Notes / instructions for AI
- Prefilled with answers from Q&A session

#### Scenario: Generate brief.md with Q&A prefill
- **WHEN** /df-start completes Q&A
- **THEN** brief.md is created at kb/source/baseline/
- **THEN** Q&A answers are populated in relevant sections
- **THEN** remaining sections have helpful placeholders
- **THEN** user is instructed to fill out brief.md

### Requirement: /df-start SHALL create initial project.config.json

The command MUST populate `kb/project.config.json` with:
- Project name from Q&A
- Goal from Q&A
- Creation timestamp
- Version field (1.0.0)

#### Scenario: Create project configuration from Q&A
- **WHEN** /df-start completes
- **THEN** project.config.json exists with user's answers
- **THEN** timestamps are set to current time
- **THEN** schema version is 1.0.0

### Requirement: /df-start SHALL verify kb/ exists

Before starting setup, the system MUST check that kb/ directory exists.

#### Scenario: Start setup with existing kb/
- **WHEN** user runs /df-start and kb/ exists
- **THEN** interactive setup proceeds

#### Scenario: Start setup without kb/
- **WHEN** user runs /df-start and kb/ doesn't exist
- **THEN** error message instructs user to run /df-init first
- **THEN** command exits without creating files

### Requirement: /df-start SHALL be resumable

If brief.md already exists, the system MUST detect it and ask whether to:
- Overwrite with new Q&A session
- Keep existing brief.md
- Update specific sections only

#### Scenario: Resume setup with existing brief
- **WHEN** /df-start runs and brief.md exists
- **THEN** user is prompted about existing brief
- **THEN** user can choose overwrite, keep, or update
- **THEN** chosen action is executed

### Requirement: Setup completion SHALL guide next steps

After /df-start completes, the system MUST:
- Display brief.md location
- Instruct user to fill out brief.md
- Explain that /df-bootstrap is next command (Phase 2)
- Show example of what to add (repo URLs, docs)

#### Scenario: Display next steps after setup
- **WHEN** /df-start completes successfully
- **THEN** completion message shows brief.md location
- **THEN** instructions explain how to fill it out
- **THEN** next command (/df-bootstrap) is mentioned
- **THEN** user knows what to do next

