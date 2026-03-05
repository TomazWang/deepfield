## ADDED Requirements

### Requirement: Detect legacy flat domain files
The `/df-upgrade` plugin command SHALL detect all domains that have a legacy `deepfield/drafts/domains/{domain}.md` flat file and no corresponding `deepfield/drafts/domains/{domain}/` subdirectory, and SHALL report the count before proceeding.

#### Scenario: Workspace has legacy flat files
- **WHEN** `/df-upgrade` runs on a workspace with one or more `{domain}.md` flat files
- **THEN** the command SHALL display the list of detected legacy domains before starting migration
- **AND** the command SHALL ask the user to confirm before proceeding

#### Scenario: Workspace has no legacy flat files
- **WHEN** `/df-upgrade` runs on a workspace where all domains already use the split structure
- **THEN** the command SHALL display "No legacy domain files found — workspace is already on split structure"
- **AND** the command SHALL exit without performing any migration

### Requirement: AI-driven content classification and split
For each legacy `{domain}.md` flat file, the migration SHALL invoke the `deepfield-document-generator` agent (or an inline migration agent) to read the flat file and classify each section as behavior-level or tech-level content. The agent SHALL write `behavior-spec.md` and `tech-spec.md` under the new `{domain}/` subdirectory.

#### Scenario: Agent splits legacy file
- **WHEN** the migration agent reads a legacy `{domain}.md`
- **THEN** it SHALL write `deepfield/drafts/domains/{domain}/behavior-spec.md` containing all classified behavior-level content from the original
- **AND** it SHALL write `deepfield/drafts/domains/{domain}/tech-spec.md` containing all classified tech-level content from the original
- **AND** neither output file SHALL be empty (at minimum a template skeleton with a note explaining the original had no content of that type)

#### Scenario: Content cannot be clearly classified
- **WHEN** the migration agent encounters a section it cannot clearly classify as behavior or tech
- **THEN** it SHALL include the section in `tech-spec.md` as the default and add a comment: `<!-- Migrated from legacy draft — classification uncertain. Review and move to behavior-spec.md if appropriate. -->`

### Requirement: Archive legacy file
After successful split, the original `{domain}.md` flat file SHALL be moved (renamed) to `deepfield/drafts/domains/{domain}/_legacy.md`. It SHALL NOT be deleted.

#### Scenario: Successful migration archives original
- **WHEN** both `behavior-spec.md` and `tech-spec.md` are successfully written for a domain
- **THEN** the original `{domain}.md` SHALL be renamed to `deepfield/drafts/domains/{domain}/_legacy.md`
- **AND** the original path `deepfield/drafts/domains/{domain}.md` SHALL no longer exist

#### Scenario: Migration fails for a domain — original preserved
- **WHEN** the migration agent fails to write either `behavior-spec.md` or `tech-spec.md`
- **THEN** the original `{domain}.md` SHALL remain at its original path, unmodified
- **AND** the command SHALL report the failure and skip the archive step for that domain

### Requirement: Update cross-reference links in all drafts
After all domains are migrated, the migration step SHALL scan all files under `deepfield/drafts/` for links of the form `](./{domain}.md)` or `](../{domain}.md)` and replace them with `](./{domain}/tech-spec.md)` or `](../{domain}/tech-spec.md)` respectively.

#### Scenario: Cross-reference links updated
- **WHEN** migration completes for all domains
- **THEN** the system SHALL scan all `*.md` files under `deepfield/drafts/`
- **AND** for each file, replace all relative links matching `{domain}.md` patterns with the corresponding `{domain}/tech-spec.md` path
- **AND** write a summary of replaced links to the migration report

### Requirement: Migration report
The migration step SHALL write a summary report to `deepfield/wip/migration-split-spec.md` listing each domain processed, the outcome (success/failure), the number of sections moved to each file, and any cross-reference links updated.

#### Scenario: Migration report written
- **WHEN** `/df-upgrade` completes the migration step (whether fully successful or partially failed)
- **THEN** `deepfield/wip/migration-split-spec.md` SHALL exist
- **AND** it SHALL list every domain with its migration status: `success`, `partial` (one file written, one failed), or `failed` (neither file written)

### Requirement: Migration is re-runnable
If `/df-upgrade` is run again after a partial migration, it SHALL detect any remaining legacy `{domain}.md` flat files and retry migration only for those domains. It SHALL NOT re-migrate domains that were already successfully split.

#### Scenario: Re-running after partial failure
- **WHEN** `/df-upgrade` is run again and some domains still have legacy flat files
- **THEN** it SHALL migrate only the remaining legacy domains
- **AND** it SHALL skip domains that already have both `behavior-spec.md` and `tech-spec.md`
