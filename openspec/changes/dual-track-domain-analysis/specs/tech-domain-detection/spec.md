## ADDED Requirements

### Requirement: Bootstrap writes tech-index.md instead of domain-index.md
During Run 0, the system SHALL generate `deepfield/wip/tech-index.md` (not `domain-index.md`) from source code structure analysis.

#### Scenario: Source code scanned
- **WHEN** the bootstrap script scans source code directories
- **THEN** it produces `wip/tech-index.md` listing detected technical components with name, path, and brief description

#### Scenario: domain-index.md not created
- **WHEN** Run 0 bootstrap completes
- **THEN** `wip/domain-index.md` SHALL NOT be created (the file does not exist in new workspaces)

### Requirement: tech-index.md format
`wip/tech-index.md` SHALL use a consistent structure that distinguishes technical components.

#### Scenario: Component entry format
- **WHEN** a technical domain is recorded in tech-index.md
- **THEN** each entry includes: domain key (kebab-case), display name, source path(s), component type (service/module/library/utility), and a one-line description

#### Scenario: Infrastructure components included
- **WHEN** source code contains infrastructure or utility components with no obvious product feature mapping
- **THEN** they are still listed in tech-index.md with type `utility` or `infrastructure`
