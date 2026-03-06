## ADDED Requirements

### Requirement: Knowledge synthesizer receives domain instructions
The `deepfield-knowledge-synth` agent SHALL receive `domain_instructions` (from `deepfieldConfig.domainInstructions`) as an explicit input field, and SHALL apply per-domain instructions when updating or creating draft documents for those domains.

#### Scenario: Domain instruction excludes a feature
- **WHEN** `DEEPFIELD.md` contains `domainInstructions.authentication: "Focus on OAuth 2.0 flows, ignore legacy basic auth"`
- **THEN** the synthesizer SHALL omit or not expand content about legacy basic auth when writing the authentication draft
- **THEN** the synthesizer SHALL focus synthesis on OAuth 2.0 content from findings

#### Scenario: No domain instruction for a domain
- **WHEN** `deepfieldConfig.domainInstructions` has no entry for the domain being synthesized
- **THEN** the synthesizer SHALL behave as today with no per-domain instruction applied

#### Scenario: Domain instructions absent from config
- **WHEN** `DEEPFIELD.md` does not exist or has no `domainInstructions` section
- **THEN** `domain_instructions` input to the synthesizer SHALL be null or empty
- **THEN** synthesizer behavior SHALL be unchanged from current behavior

### Requirement: Sequential-mode learner receives staging feedback
The sequential-mode `deepfield-learner` agent launch in `deepfield-iterate.md` SHALL include `staging_feedback` in its input object when `deepfield/source/run-N-staging/feedback.md` exists, consistent with parallel-mode behavior.

#### Scenario: Sequential mode with staging feedback
- **WHEN** the skill runs in sequential mode and staging feedback exists
- **THEN** the `deepfield-learner` launch input SHALL include `"staging_feedback": "<feedback text>"`
- **THEN** the learner agent SHALL apply the feedback following the same primary-source-of-truth rules

#### Scenario: Sequential mode without staging feedback
- **WHEN** the skill runs in sequential mode and no staging feedback file exists
- **THEN** the `deepfield-learner` launch input SHALL omit `staging_feedback`
