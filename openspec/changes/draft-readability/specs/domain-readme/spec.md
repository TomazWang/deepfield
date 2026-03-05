## ADDED Requirements

### Requirement: Per-domain README generated after each run
The system SHALL generate `deepfield/drafts/domains/{domain}/README.md` for each domain after every run. The existing flat domain file `drafts/domains/{domain}.md` SHALL remain unchanged. The domain README is a companion summary only.

#### Scenario: Domain README created alongside flat file
- **WHEN** run N completes and `drafts/domains/authentication.md` exists
- **THEN** `drafts/domains/authentication/README.md` is created (or overwritten) as a companion summary

#### Scenario: All domains get companion READMEs
- **WHEN** any run completes
- **THEN** a companion README is generated for every domain that has a flat draft file, not only domains updated in the current run

### Requirement: Domain README contains domain overview
The domain README SHALL include a one-paragraph overview of the domain extracted from or summarizing the domain's draft file.

#### Scenario: Overview section present
- **WHEN** `drafts/domains/authentication/README.md` is generated
- **THEN** it contains an "Overview" section with a summary of the domain's documented knowledge

### Requirement: Domain README contains confidence breakdown
The domain README SHALL display the current confidence level for the domain and the delta since the previous run.

#### Scenario: Confidence with delta shown
- **WHEN** domain authentication had confidence 60% in run 2 and 75% in run 3
- **THEN** `drafts/domains/authentication/README.md` shows "75% (+15% since last run)"

### Requirement: Domain README contains recent changes list
The domain README SHALL list findings added or updated in the most recent run for that domain.

#### Scenario: Recent changes section populated
- **WHEN** run N added two new findings to the authentication domain
- **THEN** `drafts/domains/authentication/README.md` lists those two findings under "Recent Changes"

### Requirement: Domain README links to full draft
The domain README SHALL include a link to the full domain draft file.

#### Scenario: Link to full draft present
- **WHEN** `drafts/domains/authentication/README.md` is generated
- **THEN** it contains a markdown link to `../authentication.md`
