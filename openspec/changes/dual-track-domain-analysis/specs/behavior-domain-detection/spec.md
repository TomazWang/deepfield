## ADDED Requirements

### Requirement: Bootstrap detects behavior domains from reference docs
During Run 0 bootstrap, the system SHALL scan reference documentation sources and extract candidate behavior domain names using `detect-behavior-domains.js`.

#### Scenario: Reference docs present
- **WHEN** `deepfield/source/baseline/` contains reference documentation files (wikis, specs, README files)
- **THEN** `detect-behavior-domains.js` extracts candidate behavior domain names from those files and returns them as a JSON array

#### Scenario: No reference docs present
- **WHEN** no reference documentation is found in the source tree
- **THEN** `detect-behavior-domains.js` returns an empty array and the skill falls back to interactive Q&A

### Requirement: Bootstrap elicits stakeholder priorities via interactive Q&A
During Run 0, the system SHALL ask the user to confirm and supplement detected behavior domains with an interactive question.

#### Scenario: Domains detected from docs
- **WHEN** candidate behavior domains were extracted from reference docs
- **THEN** the system displays the list and asks "Do these capture the product features stakeholders care about? Add or remove any."

#### Scenario: No domains detected
- **WHEN** no candidate behavior domains were found
- **THEN** the system asks "What product features do your stakeholders care about? List the main capabilities."

#### Scenario: User skips Q&A
- **WHEN** the user runs bootstrap with `--skip-behavior-qa`
- **THEN** the system uses detected candidates as-is (or empty list if none) and proceeds without prompting

### Requirement: Bootstrap writes behavior-index.md
After Q&A, the system SHALL write `deepfield/wip/behavior-index.md` with the confirmed behavior domain list.

#### Scenario: Domains confirmed by user
- **WHEN** the user has confirmed or edited the behavior domain list
- **THEN** `wip/behavior-index.md` is created with each domain as a top-level entry, including name and a one-line description placeholder

#### Scenario: File already exists
- **WHEN** `wip/behavior-index.md` already exists at bootstrap time
- **THEN** the system skips creation and logs "behavior-index.md already present"

### Requirement: detect-behavior-domains.js is a read-only CLI script
The `detect-behavior-domains.js` script SHALL only read files and return JSON; it SHALL NOT write any files.

#### Scenario: Script invoked
- **WHEN** `deepfield bootstrap:detect-behavior-domains --source-dir <path>` is called
- **THEN** the script prints a JSON array of `{ name, confidence, sourceFile }` objects to stdout and exits 0

#### Scenario: Script encounters unreadable file
- **WHEN** a source file cannot be read
- **THEN** the script skips that file, logs a warning to stderr, and continues
