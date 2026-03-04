## MODIFIED Requirements

### Requirement: Run configuration SHALL track per-run metadata

Each run MUST have a configuration file at `deepfield/wip/run-N/run-N.config.json` containing:
- `runNumber`: Integer run number
- `startedAt`: ISO timestamp
- `completedAt`: ISO timestamp (when run finishes)
- `fileHashes`: Object mapping file paths to hash values
- `status`: "in-progress" | "completed" | "failed"
- `confidenceScores`: Object mapping domain names to confidence score records, each containing:
  - `aggregate`: number (0.0–1.0)
  - `previousAggregate`: number or null (previous run's aggregate, null on first run)
  - `components`: object with keys `questionsAnswered`, `evidenceStrength`, `sourceCoverage`, `contradictionResolution`, each being a number (0.0–1.0)
  - `inputs`: object with raw counts used in formula:
    - `answeredQuestions`: integer
    - `unansweredQuestions`: integer
    - `unknowns`: integer
    - `evidenceByStrength`: object with keys `strong`, `medium`, `weak` as integers
    - `analyzedSourceTypes`: integer
    - `requiredSourceTypes`: integer
    - `unresolvedContradictions`: integer
    - `totalContradictions`: integer

#### Scenario: Create run configuration on run start
- **WHEN** a new learning run begins
- **THEN** run-N.config.json is created with runNumber and startedAt
- **THEN** status is set to "in-progress"
- **THEN** fileHashes is initialized as empty object
- **THEN** confidenceScores is initialized as empty object

#### Scenario: Update run configuration on completion
- **WHEN** learning run completes successfully
- **THEN** completedAt timestamp is set
- **THEN** status is updated to "completed"
- **THEN** fileHashes contains computed hashes for all scanned files
- **THEN** confidenceScores contains a record for each active domain with aggregate, components, and inputs populated

#### Scenario: Confidence score record includes previous run aggregate
- **WHEN** run N completes and run N-1 had a confidence score for the same domain
- **THEN** the domain's confidenceScores entry has previousAggregate equal to run N-1's aggregate value

#### Scenario: Confidence score record has null previousAggregate on first run
- **WHEN** run 1 completes for a domain
- **THEN** the domain's confidenceScores entry has previousAggregate equal to null
