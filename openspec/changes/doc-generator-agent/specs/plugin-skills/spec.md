## MODIFIED Requirements

### Requirement: Iterate skill Step 5 SHALL launch deepfield-document-generator with full context

The `deepfield-iterate` skill MUST replace the `deepfield-knowledge-synth` invocation at Step 5 with a `deepfield-document-generator` invocation. The new invocation MUST pass the full documentation context including staging feedback and DEEPFIELD.md config.

#### Scenario: Step 5 launches deepfield-document-generator
- **WHEN** Step 5 of the iterate skill executes after findings are consolidated
- **THEN** the skill launches `deepfield-document-generator` (not `deepfield-knowledge-synth`)
- **THEN** the launch input includes: findings path, domain_findings_dir, existing_drafts_dir, staging_feedback path (or null), config object, unknowns path, changelog path, and run_number

#### Scenario: Staging feedback path is resolved before launch
- **WHEN** Step 5 is about to launch the agent
- **THEN** the skill checks whether `deepfield/source/run-N-staging/feedback.md` exists
- **THEN** if the file exists, its path is passed as staging_feedback
- **THEN** if the file does not exist, staging_feedback is passed as null

#### Scenario: Config object passed from pre-run parse
- **WHEN** Step 5 executes
- **THEN** the `deepfieldConfig` object already parsed in Pre-Run Step 0 is passed as the config input
- **THEN** no additional invocation of `parse-deepfield-config.js` is required at Step 5
