## MODIFIED Requirements

### Requirement: project.config.json tracks behavior and tech domains separately
The workspace `project.config.json` state SHALL store `behaviorDomains` and `techDomains` as separate arrays; the `domains` field is deprecated.

#### Scenario: New workspace created
- **WHEN** a new workspace is initialized (workspace version >= 0.7.0)
- **THEN** `project.config.json` contains `behaviorDomains: []`, `techDomains: []`, and `domainLinks: []`; the `domains` field is NOT present

#### Scenario: Existing workspace after upgrade
- **WHEN** `df-upgrade` completes migration to 0.7.0
- **THEN** `project.config.json` is updated: old `domains` array is moved to `techDomains`; `behaviorDomains` is set to `[]`; `domainLinks` is set to `[]`; `domains` field is removed

### Requirement: workspace version field is bumped to 0.7.0 after migration
After a successful dual-track migration, `project.config.json` SHALL reflect the new workspace version.

#### Scenario: Migration succeeds
- **WHEN** all migration steps complete without error
- **THEN** `project.config.json.workspaceVersion` is set to `"0.7.0"`

#### Scenario: Migration fails mid-way
- **WHEN** any migration step returns a non-zero exit or error
- **THEN** workspace version is NOT updated; user is instructed to restore from backup and retry

### Requirement: domain-index.md path deprecated in state references
Any reference to `wip/domain-index.md` in scripts or state SHALL be replaced by `wip/tech-index.md` or `wip/behavior-index.md`.

#### Scenario: Bootstrap runner writes indexes
- **WHEN** `bootstrap-runner.js` creates domain index files
- **THEN** it writes to `wip/tech-index.md` and `wip/behavior-index.md`; it SHALL NOT write `wip/domain-index.md`
