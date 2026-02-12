## MODIFIED Requirements

### Requirement: /df-start SHALL conduct interactive Q&A

The command MUST ask the user essential questions via AskUserQuestion tool (not CLI stdin):
- What is this project?
- What's your goal for this knowledge base?
- Any specific areas of concern?
- How many learning runs before pausing?

#### Scenario: Interactive setup collects user input
- **WHEN** user runs /df-start
- **THEN** system asks project-related questions using AskUserQuestion
- **THEN** user provides answers via Claude Code's prompt interface
- **THEN** answers are captured in plugin context

#### Scenario: User cancels interactive setup
- **WHEN** user cancels during Q&A (selects "Other" and provides empty input)
- **THEN** setup is aborted gracefully
- **THEN** no files are modified
- **THEN** user can retry /df-start later

#### Scenario: Plugin calls CLI non-interactively after Q&A
- **WHEN** all questions answered via AskUserQuestion
- **THEN** plugin formats answers as JSON
- **THEN** plugin calls `deepfield start --non-interactive --answers-json`
- **THEN** CLI processes answers without stdin prompts
- **THEN** brief.md and config created
