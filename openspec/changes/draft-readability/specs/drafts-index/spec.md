## ADDED Requirements

### Requirement: Drafts index generated after each run
The system SHALL generate `deepfield/drafts/README.md` at the end of every learning run (bootstrap and iterate). The index SHALL be overwritten each run with current data.

#### Scenario: Index generated after bootstrap
- **WHEN** Run 0 (bootstrap) completes successfully
- **THEN** `deepfield/drafts/README.md` is created containing domain links, stats, and next steps

#### Scenario: Index regenerated after iterate run
- **WHEN** A learning iteration run completes
- **THEN** `deepfield/drafts/README.md` is overwritten with updated domain links, confidence stats, and recent changes from the completed run

### Requirement: Drafts index contains navigation section
The drafts index SHALL include a navigation section listing all domains with links to their draft files and a one-line description of each domain.

#### Scenario: Domain listed with link
- **WHEN** `drafts/README.md` is generated and domain `authentication.md` exists
- **THEN** the index contains a markdown link to `domains/authentication.md` and a one-line description of that domain

### Requirement: Drafts index contains run statistics
The drafts index SHALL include aggregate statistics: total domains, total unknowns count, overall average confidence, and number of runs completed.

#### Scenario: Stats reflect current state
- **WHEN** `drafts/README.md` is generated after run 3
- **THEN** the stats section shows runNumber=3 and correctly aggregated confidence averaged across all domains

### Requirement: Drafts index contains recent changes summary
The drafts index SHALL include a "Recent Changes" section summarizing which domains were updated in the last run, based on `run-N.config.json` confidence changes.

#### Scenario: Recent changes listed
- **WHEN** run N updated domains A and B
- **THEN** the "Recent Changes" section of `drafts/README.md` lists domains A and B with their confidence delta

### Requirement: Drafts index contains review priorities
The drafts index SHALL include a "Review Priorities" section listing domains ordered by urgency: HIGH (contradictions or resolved unknowns), MEDIUM (new findings), LOW (minor confidence bumps).

#### Scenario: High-priority domain surfaced
- **WHEN** a domain had a finding flagged as contradicting existing knowledge
- **THEN** that domain appears under HIGH priority in the `drafts/README.md` review priorities section
