## MODIFIED Requirements

### Requirement: Iterate skill passes staging feedback to all agents
The `deepfield-iterate` skill SHALL read `deepfield/source/run-${nextRun}-staging/feedback.md` during Step 1 and store its content as `stagingFeedback`. The skill SHALL pass `stagingFeedback` to every agent it launches (domain-learner agents in parallel mode, the learner agent in sequential mode, and the knowledge-synth agent) as a conditional prompt section.

#### Scenario: Skill reads feedback in Step 1
- **WHEN** Step 1 checks `deepfield/source/run-${nextRun}-staging/` for content
- **THEN** the skill SHALL read `feedback.md` from that directory if it exists
- **THEN** the skill SHALL store the full text as `stagingFeedback` for use in Steps 4 and 5

#### Scenario: Skill injects feedback into parallel-mode domain-learner prompt
- **WHEN** the skill launches `deepfield-domain-learner` agents in Step 4d
- **THEN** each agent's inline prompt SHALL include the `## Staging Feedback (User Corrections)` section when `stagingFeedback` is non-null
- **THEN** the section SHALL appear before the file analysis instructions in the prompt

#### Scenario: Skill injects feedback into knowledge-synth launch
- **WHEN** the skill launches `deepfield-knowledge-synth` in Step 5
- **THEN** the launch input object SHALL include `"staging_feedback": stagingFeedback` when non-null
- **THEN** the launch input object SHALL include `"domain_instructions": deepfieldConfig.domainInstructions`
