## ADDED Requirements

### Requirement: /df-start SHALL ask about autonomous execution limits

During interactive Q&A, the system SHALL ask user how many consecutive runs to allow before pausing for review.

#### Scenario: Configure max runs during setup
- **WHEN** /df-start conducts Q&A
- **THEN** system asks "How many runs before stopping?" with options
- **THEN** user selects from preset options (3, 5, 10, Until plan complete)
- **THEN** answer is stored in project.config.json as maxRuns

#### Scenario: Default max runs if skipped
- **WHEN** user skips max runs question
- **THEN** system defaults to 5 consecutive runs
- **THEN** user can change later by editing project.config.json

### Requirement: brief.md template SHALL include max-runs guidance

The generated brief.md SHALL include section explaining that learning will run autonomously and how to control iteration limits.

#### Scenario: Brief includes autonomous learning explanation
- **WHEN** /df-start generates brief.md
- **THEN** template includes section explaining autonomous iteration
- **THEN** section mentions configured maxRuns value
- **THEN** section explains user can add sources in staging areas between runs
