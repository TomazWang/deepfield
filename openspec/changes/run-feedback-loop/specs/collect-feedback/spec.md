## ADDED Requirements

### Requirement: Interactive feedback collection after a run
The system SHALL provide an interactive CLI prompt after each run completes, allowing the user to review findings and provide structured feedback.

#### Scenario: User accepts to provide feedback
- **WHEN** `runFeedbackLoop(runNumber)` is called and the user answers "yes" to the review prompt
- **THEN** the system SHALL ask domain correctness, missing context, priority, and general comments questions in sequence

#### Scenario: User skips feedback
- **WHEN** the user answers "no" to the initial review prompt
- **THEN** the system SHALL print a skip message and return `null` without asking further questions

### Requirement: Feedback saved to run directory
The system SHALL save collected feedback as a structured Markdown file in the run's WIP directory.

#### Scenario: Feedback file created after collection
- **WHEN** the user completes the feedback prompts
- **THEN** a file SHALL be written to `deepfield/wip/run-N/feedback.md` containing all collected sections

#### Scenario: No file written when feedback skipped
- **WHEN** `saveFeedback` is called with `null` feedback
- **THEN** no file SHALL be written

### Requirement: Domain correctness question
The system SHALL ask whether the detected domains are correct.

#### Scenario: Domains marked incorrect
- **WHEN** the user answers "no" to the domain correctness question
- **THEN** the system SHALL open an editor prompt for domain corrections and include the result in the `corrections` array

#### Scenario: Domains marked correct
- **WHEN** the user answers "yes" to the domain correctness question
- **THEN** the system SHALL skip the editor prompt and leave `corrections` empty for domains

### Requirement: Missing context question
The system SHALL ask whether additional context would help.

#### Scenario: Missing context provided
- **WHEN** the user answers "yes" and provides text
- **THEN** the system SHALL store the content in the `additions` array under topic "context"

### Requirement: Priority adjustment question
The system SHALL ask whether learning priorities should be adjusted.

#### Scenario: Priorities provided
- **WHEN** the user answers "yes" and enters priorities
- **THEN** the system SHALL store the priorities in the `priorities` array

### Requirement: Exportable function
The script SHALL export `runFeedbackLoop(runNumber)` for use by other scripts and skills.

#### Scenario: Import and call
- **WHEN** another script imports and calls `runFeedbackLoop(0)`
- **THEN** the function SHALL run the full feedback flow and return the feedback object or null
