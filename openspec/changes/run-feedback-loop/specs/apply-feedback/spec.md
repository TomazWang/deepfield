## ADDED Requirements

### Requirement: Read feedback from run directory
The system SHALL read a feedback Markdown file from a previous run's WIP directory.

#### Scenario: Feedback file exists
- **WHEN** `readFeedback(runNumber)` is called and `deepfield/wip/run-N/feedback.md` exists
- **THEN** the function SHALL return a parsed feedback object with corrections, additions, priorities, and comments fields

#### Scenario: Feedback file missing
- **WHEN** `readFeedback(runNumber)` is called and the file does not exist
- **THEN** the function SHALL return `null`

### Requirement: Apply feedback to learning plan
The system SHALL append feedback content to the existing learning plan.

#### Scenario: Feedback has corrections
- **WHEN** `applyFeedbackToLearningPlan(feedback)` is called with a feedback object containing corrections
- **THEN** the system SHALL append a "Corrections Applied" subsection to `deepfield/wip/learning-plan.md`

#### Scenario: Feedback has additions
- **WHEN** the feedback object contains additions
- **THEN** the system SHALL append an "Additional Context" subsection to `deepfield/wip/learning-plan.md`

#### Scenario: Feedback has priority adjustments
- **WHEN** the feedback object contains priorities
- **THEN** the system SHALL append a "Priority Adjustments" subsection to `deepfield/wip/learning-plan.md`

#### Scenario: Null feedback passed
- **WHEN** `applyFeedbackToLearningPlan(null)` is called
- **THEN** the function SHALL return without modifying any files

### Requirement: Exportable functions
The script SHALL export `readFeedback`, `applyFeedbackToLearningPlan`, and `applyFeedbackToDomains`.

#### Scenario: Named exports available
- **WHEN** another module imports from `apply-feedback.js`
- **THEN** all three functions SHALL be available as named exports
