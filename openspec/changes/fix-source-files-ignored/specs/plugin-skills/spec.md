## MODIFIED Requirements

### Requirement: deepfield-iterate skill SHALL include user source documents in learning scan
The `deepfield-iterate` skill MUST invoke `scan-source-docs.js` during Step 3 (Incremental Scanning) and append the resulting markdown file paths to `filesToRead` before launching the learner agent. This ensures user-provided documents in `deepfield/source/` are read during every learning iteration.

#### Scenario: Source docs included in files to read
- **WHEN** the iterate skill executes Step 3
- **THEN** it runs `scan-source-docs.js` with the current run number
- **THEN** the JSON index of extracted markdown paths is read
- **THEN** those paths are appended to `filesToRead`
- **THEN** the learner agent receives the extracted content alongside repository code

#### Scenario: No source docs present
- **WHEN** `deepfield/source/` contains no user-provided files
- **THEN** `scan-source-docs.js` produces an empty JSON index
- **THEN** `filesToRead` is unchanged
- **THEN** the skill continues without error

#### Scenario: Extraction warnings reported to user
- **WHEN** `scan-source-docs.js` encounters files it cannot process
- **THEN** the skill surfaces the printed summary to the user
- **THEN** the skill does NOT abort the learning cycle due to extraction warnings
