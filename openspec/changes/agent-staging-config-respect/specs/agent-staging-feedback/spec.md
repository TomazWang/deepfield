## ADDED Requirements

### Requirement: Domain learner receives staging feedback
The `deepfield-domain-learner` agent SHALL receive the content of `deepfield/source/run-N-staging/feedback.md` as a `staging_feedback` input when that file exists, and SHALL treat it as the primary source of truth — applying corrections, following guidance, and prioritizing topics mentioned in the feedback before analyzing source files.

#### Scenario: Staging feedback file exists
- **WHEN** `deepfield/source/run-${nextRun}-staging/feedback.md` exists and contains user corrections
- **THEN** the domain-learner inline prompt SHALL include a `## Staging Feedback (User Corrections)` section containing the full text of the file
- **THEN** the agent SHALL apply corrections from the feedback when writing findings (e.g., correcting a stated OAuth version, adjusting a timeout value)

#### Scenario: Staging feedback file does not exist
- **WHEN** `deepfield/source/run-${nextRun}-staging/feedback.md` does not exist or is empty
- **THEN** the domain-learner inline prompt SHALL NOT include a staging feedback section
- **THEN** agent behavior SHALL be unchanged from current behavior

#### Scenario: Staging feedback contradicts source code
- **WHEN** staging feedback states a fact that differs from what source code shows
- **THEN** the agent SHALL follow the staging feedback and note the discrepancy in findings with tag `[medium]` or `[strong]` per the human-override rules in the agent spec

### Requirement: Knowledge synthesizer receives staging feedback
The `deepfield-knowledge-synth` agent SHALL receive the content of `deepfield/source/run-N-staging/feedback.md` as a `staging_feedback` input when that file exists, and SHALL apply corrections from the feedback when updating draft documents.

#### Scenario: Synthesizer applies correction from staging
- **WHEN** staging feedback identifies an error in an existing draft (e.g., wrong technology name, incorrect timeout value)
- **THEN** the synthesizer SHALL correct the draft content to match the feedback
- **THEN** the synthesizer SHALL note the correction in `_changelog.md` under the current run entry

#### Scenario: Staging feedback is absent at synthesis time
- **WHEN** `staging_feedback` is null or not provided
- **THEN** the synthesizer SHALL behave as it does today with no change
