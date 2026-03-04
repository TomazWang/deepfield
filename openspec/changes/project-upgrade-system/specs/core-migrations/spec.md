## ADDED Requirements

### Requirement: Migration 1.0.0 to 2.0.0 adds domain structure
The migration from v1.0.0 to v2.0.0 SHALL create `deepfield/wip/domain-index.md`, `deepfield/drafts/domains/` directory, and move any existing top-level draft files into `deepfield/drafts/cross-cutting/`.

#### Scenario: Domain index created
- **WHEN** migration 1.0.0→2.0.0 runs on a v1.0 project
- **THEN** `deepfield/wip/domain-index.md` is created with a template placeholder and `deepfield/drafts/domains/` directory exists

#### Scenario: Existing drafts preserved
- **WHEN** migration 1.0.0→2.0.0 runs and top-level draft files exist
- **THEN** those files are moved to `deepfield/drafts/cross-cutting/` and are not deleted

### Requirement: Migration 2.0.0 to 2.1.0 adds DEEPFIELD.md
The migration from v2.0.0 to v2.1.0 SHALL create `deepfield/DEEPFIELD.md` from the standard template if it does not already exist.

#### Scenario: DEEPFIELD.md created
- **WHEN** migration 2.0.0→2.1.0 runs and `deepfield/DEEPFIELD.md` does not exist
- **THEN** `deepfield/DEEPFIELD.md` is created with the standard template content

#### Scenario: Existing DEEPFIELD.md preserved
- **WHEN** migration 2.0.0→2.1.0 runs and `deepfield/DEEPFIELD.md` already exists
- **THEN** the existing file is not overwritten

### Requirement: Migration 2.1.0 to 2.2.0 adds terminology infrastructure
The migration from v2.1.0 to v2.2.0 SHALL create `deepfield/drafts/cross-cutting/terminology.md` and `deepfield/wip/new-terms.md` if they do not already exist.

#### Scenario: Terminology files created
- **WHEN** migration 2.1.0→2.2.0 runs
- **THEN** `deepfield/drafts/cross-cutting/terminology.md` and `deepfield/wip/new-terms.md` are created with template content

### Requirement: Migration 2.2.0 to 2.3.0 adds parallel learning support
The migration from v2.2.0 to v2.3.0 SHALL create `deepfield/wip/parallel-plan.md` template file and ensure the `wip/` directory structure supports parallel agent tracking.

#### Scenario: Parallel plan file created
- **WHEN** migration 2.2.0→2.3.0 runs
- **THEN** `deepfield/wip/parallel-plan.md` is created with a template placeholder

### Requirement: Migration 2.3.0 to 2.5.0 adds df-ff and confidence scoring
The migration from v2.3.0 to v2.5.0 SHALL create `deepfield/wip/confidence-scores.md` and `deepfield/drafts/cross-cutting/unknowns.md` if they do not already exist.

#### Scenario: Confidence and unknowns files created
- **WHEN** migration 2.3.0→2.5.0 runs
- **THEN** `deepfield/wip/confidence-scores.md` and `deepfield/drafts/cross-cutting/unknowns.md` are created with template content if not present

### Requirement: All migrations are idempotent
Every migration's `check()` function SHALL return `false` (no action needed) if the migration has already been applied, making `migrate()` safe to call multiple times without duplicating files.

#### Scenario: Check returns false when already applied
- **WHEN** `check(projectPath)` is called on a project that already has the migration's artifacts
- **THEN** it returns `false`
