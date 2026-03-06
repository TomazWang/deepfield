## MODIFIED Requirements

### Requirement: /df-upgrade invokes draft migration step
The `/df-upgrade` plugin command SHALL include a draft migration step that detects and migrates legacy `{domain}.md` flat files to the new split structure. This step SHALL run after the standard workspace upgrade steps complete.

#### Scenario: /df-upgrade detects legacy drafts and migrates them
- **WHEN** `/df-upgrade` runs on a workspace that has one or more legacy `deepfield/drafts/domains/{domain}.md` flat files
- **THEN** the command SHALL display the list of detected legacy domains
- **AND** it SHALL ask the user to confirm migration before proceeding
- **AND** on confirmation, it SHALL invoke the migration agent for each legacy domain
- **AND** it SHALL report a summary of migration outcomes (success / partial / failed per domain)

#### Scenario: /df-upgrade skips migration when no legacy drafts exist
- **WHEN** `/df-upgrade` runs on a workspace with no legacy flat domain files
- **THEN** the draft migration step SHALL be skipped with the message: "Draft structure already up to date."
- **AND** the command SHALL continue with any other upgrade steps normally

#### Scenario: /df-upgrade migration is re-runnable
- **WHEN** `/df-upgrade` is run again after a previous partial migration
- **THEN** the command SHALL detect remaining legacy files and offer to retry
- **AND** it SHALL skip domains that were already successfully migrated (both split files exist)

### Requirement: /df-upgrade reports migration summary
After the draft migration step, `/df-upgrade` SHALL display a human-readable migration summary and write the full report to `deepfield/wip/migration-split-spec.md`.

#### Scenario: Migration summary displayed
- **WHEN** the migration step completes (successfully or with partial failures)
- **THEN** the command SHALL display a table showing each domain, its migration status, and the number of sections written to behavior-spec vs tech-spec
- **AND** it SHALL display the path to the full migration report: `deepfield/wip/migration-split-spec.md`
