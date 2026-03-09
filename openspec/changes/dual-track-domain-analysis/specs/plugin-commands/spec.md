## MODIFIED Requirements

### Requirement: df-upgrade migrates drafts/domains/ to dual-track structure
The `df-upgrade` command SHALL include a migration step that moves files from `drafts/domains/{name}/` to the new `drafts/behavior/{name}/` and `drafts/tech/{name}/` layout.

#### Scenario: Workspace has old drafts/domains/ structure
- **WHEN** `df-upgrade` detects workspace version < 0.7.0 AND `drafts/domains/` exists
- **THEN** for each domain folder: `behavior-spec.md` is moved to `drafts/behavior/{name}/spec.md`; `tech-spec.md` is moved to `drafts/tech/{name}/spec.md`

#### Scenario: Domain folder has only flat spec.md (very old workspace)
- **WHEN** a domain folder contains only `spec.md` (no behavior/tech split yet)
- **THEN** the upgrade skill invokes AI to split it; copies result to both `drafts/behavior/{name}/spec.md` and `drafts/tech/{name}/spec.md`; original preserved until validated

#### Scenario: Source files never deleted before validation
- **WHEN** migration moves files
- **THEN** original files in `drafts/domains/` are only removed AFTER the moved files are verified to exist at the new paths

#### Scenario: wip/domain-index.md renamed
- **WHEN** `wip/domain-index.md` exists in an old workspace
- **THEN** it is copied to `wip/tech-index.md`; `wip/behavior-index.md` is created as an empty template; `wip/domain-links.md` is created as an empty template

### Requirement: df-upgrade reports migration results to user
The `df-upgrade` command SHALL display a clear summary of what was moved.

#### Scenario: Migration completes
- **WHEN** the dual-track migration step finishes
- **THEN** the command displays: number of behavior spec files moved, number of tech spec files moved, any files that were skipped or need manual review
