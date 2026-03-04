## ADDED Requirements

### Requirement: Bootstrap runner SHALL parse brief.md
The system SHALL read `deepfield/source/baseline/brief.md` and extract structured data including project name, repository URLs with branches, focus areas, and topics of interest.

#### Scenario: Brief with repository URL
- **WHEN** brief.md contains a URL under a Repositories section
- **THEN** parse-brief.js extracts the URL, branch (default "main"), and repo name
- **THEN** returns structured JSON with repositories array

#### Scenario: Brief with focus areas
- **WHEN** brief.md contains a Focus Areas section with bullet points
- **THEN** parse-brief.js extracts each bullet as a focus area string
- **THEN** focus areas are included in the parsed result

#### Scenario: Brief without repositories section
- **WHEN** brief.md has no Repositories section
- **THEN** parse-brief.js returns empty repositories array
- **THEN** bootstrap continues without cloning

#### Scenario: Brief file not found
- **WHEN** brief.md does not exist at expected path
- **THEN** bootstrap-runner.js exits with non-zero code
- **THEN** error message directs user to run /df-start first

### Requirement: Bootstrap runner SHALL clone repositories
The system SHALL clone each repository URL found in brief.md into `deepfield/source/baseline/repos/<name>/` using shallow clone.

#### Scenario: Clone new repository
- **WHEN** repository URL is in brief.md and destination does not exist
- **THEN** clone-repos.sh clones the repo with --depth 1
- **THEN** destination directory is created at repos/<name>/

#### Scenario: Skip existing repository
- **WHEN** destination directory already exists
- **THEN** clone is skipped with a warning message
- **THEN** bootstrap continues without error

#### Scenario: Clone failure
- **WHEN** git clone fails (invalid URL or network error)
- **THEN** error is logged with the repo URL
- **THEN** bootstrap continues with remaining repositories

### Requirement: Bootstrap runner SHALL scan repository structure
The system SHALL walk each cloned repository and identify top-level directories, modules (packages/, services/, apps/, libs/), build files, and README locations.

#### Scenario: Standard repository scan
- **WHEN** a cloned repository directory exists
- **THEN** scan-structure.js returns top-level dirs (excluding hidden)
- **THEN** build files (package.json, pom.xml, go.mod, etc.) are detected
- **THEN** README files are identified

#### Scenario: Monorepo detection
- **WHEN** repository has packages/, services/, apps/, or libs/ directory
- **THEN** scan-structure.js lists sub-packages as modules
- **THEN** module list includes parent dir and module name

#### Scenario: No repositories cloned
- **WHEN** repos directory does not exist or is empty
- **THEN** scan returns empty array
- **THEN** downstream generators handle empty repos gracefully

### Requirement: Bootstrap runner SHALL generate wip documents
The system SHALL produce project-map.md, domain-index.md, and learning-plan.md in `deepfield/wip/` using the existing templates.

#### Scenario: Generate project-map.md
- **WHEN** scan data and brief data are available
- **THEN** deepfield/wip/project-map.md is created
- **THEN** file includes project name and repository structure
- **THEN** top-level directories are listed per repo

#### Scenario: Generate domain-index.md
- **WHEN** scan data and brief focus areas are available
- **THEN** deepfield/wip/domain-index.md is created
- **THEN** domains are detected from folder names matching known patterns
- **THEN** focus areas from brief are included as additional domains

#### Scenario: Generate learning-plan.md
- **WHEN** focus areas are available from brief
- **THEN** deepfield/wip/learning-plan.md is created
- **THEN** focus areas are listed as topics

### Requirement: Bootstrap runner SHALL create run-0 state
The system SHALL write `deepfield/wip/run-0/run-0.config.json` with status "completed", timestamps, and file hashes for all cloned repositories.

#### Scenario: Run 0 config creation
- **WHEN** all prior bootstrap steps succeed
- **THEN** deepfield/wip/run-0/ directory is created
- **THEN** run-0.config.json is written with runNumber: 0, status: "completed"
- **THEN** startedAt and completedAt are ISO timestamps

#### Scenario: File hashes in run config
- **WHEN** repositories have been cloned
- **THEN** hash-files.js is called for each repo
- **THEN** resulting hashes are stored in run-0.config.json under fileHashes
- **THEN** subsequent runs can diff hashes to detect changes

### Requirement: Bootstrap runner SHALL update project config
The system SHALL update `deepfield/project.config.json` to set bootstrapCompleted: true after successful Run 0.

#### Scenario: Config update on success
- **WHEN** bootstrap completes without fatal errors
- **THEN** project.config.json is updated atomically via update-json.js
- **THEN** bootstrapCompleted is set to true
- **THEN** currentRun is set to 0

### Requirement: Bootstrap runner SHALL create run-1 staging area
The system SHALL create `deepfield/source/run-1-staging/` with a README and feedback.md template for the user to prepare Run 1 inputs.

#### Scenario: Staging area creation
- **WHEN** bootstrap completes
- **THEN** deepfield/source/run-1-staging/sources/ directory is created
- **THEN** README.md is written explaining how to add sources
- **THEN** feedback.md is created with open questions from learning plan

### Requirement: Bootstrap runner SHALL report progress and summary
The system SHALL print progress messages during execution and a formatted summary upon completion.

#### Scenario: Progress reporting
- **WHEN** each bootstrap step begins
- **THEN** a progress message is printed to stdout

#### Scenario: Completion summary
- **WHEN** bootstrap finishes
- **THEN** summary shows repos cloned count, domains detected, artifacts created
- **THEN** next steps are shown to guide the user
