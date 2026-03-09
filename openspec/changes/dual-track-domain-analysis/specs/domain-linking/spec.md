## ADDED Requirements

### Requirement: deepfield-domain-linker agent infers behavior↔tech mapping
The system SHALL include a `deepfield-domain-linker` agent that reads `behavior-index.md`, `tech-index.md`, and source code to infer a many-to-many mapping.

#### Scenario: Both indexes exist
- **WHEN** the agent is launched with paths to `behavior-index.md` and `tech-index.md`
- **THEN** it produces `domain-links.md` with a section per behavior domain listing which tech domains implement it, and a section per tech domain listing which behavior domains it serves

#### Scenario: Tech component with no behavior mapping
- **WHEN** a tech domain has no evident mapping to any behavior domain
- **THEN** the agent records it in `domain-links.md` under a `## Unmapped Tech Domains` section with a note "No behavior domain identified — may be infrastructure or utility"

### Requirement: domain-links.md uses free markdown with consistent heading structure
The `domain-links.md` file SHALL use markdown headings (not YAML/JSON) for human readability and AI parseability.

#### Scenario: File structure
- **WHEN** domain-links.md is written
- **THEN** it contains: `## Behavior: <name>` sections listing tech domains, `## Tech: <name>` sections listing behavior domains, and `## Unmapped Tech Domains` for orphan tech components

### Requirement: User-edited entries in domain-links.md are treated as authoritative
When the linker agent re-runs, it SHALL preserve user-edited entries.

#### Scenario: User has manually added a link
- **WHEN** `domain-links.md` contains an entry marked with `<!-- user-confirmed -->`
- **THEN** the agent preserves that entry unchanged and does not override it with inferred data

#### Scenario: Agent re-runs after new domains added
- **WHEN** new domains appear in either index after the last linker run
- **THEN** the agent adds entries for new domains while preserving existing entries

### Requirement: Linker agent runs after both indexes are populated
The linker agent SHALL be invoked during the bootstrap phase after both `behavior-index.md` and `tech-index.md` are written.

#### Scenario: Bootstrap invokes linker
- **WHEN** Run 0 bootstrap completes both domain detection steps
- **THEN** the bootstrap skill invokes `deepfield-domain-linker` to generate initial `domain-links.md`

#### Scenario: Iterate invokes linker
- **WHEN** a learning run discovers new domains in either track
- **THEN** the iterate skill invokes the linker agent to update `domain-links.md`
