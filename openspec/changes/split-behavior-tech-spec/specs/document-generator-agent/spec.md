## ADDED Requirements

### Requirement: deepfield-document-generator agent exists
A `deepfield-document-generator` agent SHALL be defined at `plugin/agents/deepfield-document-generator.md`. It SHALL be responsible for generating and updating `behavior-spec.md` and `tech-spec.md` for each domain from per-run findings.

#### Scenario: Agent file exists after implementation
- **WHEN** the implementation task is complete
- **THEN** `plugin/agents/deepfield-document-generator.md` SHALL exist and have a valid agent frontmatter with `name`, `description`, and `color` fields

### Requirement: Agent accepts findings and existing specs as input
The `deepfield-document-generator` agent SHALL accept as input: the domain name, the findings file path (`deepfield/wip/run-N/domains/{domain}-findings.md` or consolidated `findings.md`), the paths to existing `behavior-spec.md` and `tech-spec.md` (which may or may not exist), and the output language setting. It SHALL also accept an optional `legacy_draft_path` for migration mode.

#### Scenario: Agent invoked for new domain (no existing specs)
- **WHEN** the agent is invoked for a domain with no existing spec files
- **THEN** it SHALL create `behavior-spec.md` from the behavior-spec template, populated with behavioral content extracted from findings
- **AND** it SHALL create `tech-spec.md` from the tech-spec template, populated with technical content extracted from findings

#### Scenario: Agent invoked for existing domain (specs already exist)
- **WHEN** the agent is invoked for a domain with existing `behavior-spec.md` and `tech-spec.md`
- **THEN** it SHALL read both existing files in full before writing
- **AND** it SHALL integrate new findings into the appropriate spec (behavior content → behavior-spec, tech content → tech-spec)
- **AND** it SHALL NOT replace sections wholesale — it SHALL expand and integrate

#### Scenario: Agent invoked in migration mode (legacy draft provided)
- **WHEN** the agent is invoked with a `legacy_draft_path` pointing to an existing `{domain}.md`
- **THEN** it SHALL read the legacy file and classify each section as behavior or tech
- **AND** it SHALL write both `behavior-spec.md` and `tech-spec.md` populated with the classified content
- **AND** it SHALL follow the content split contract from the `split-domain-drafts` spec

### Requirement: Content split enforcement
The `deepfield-document-generator` agent SHALL apply the content split contract strictly:
- Behavioral content (user stories, scenarios, business rules, user flows) SHALL go to `behavior-spec.md` only.
- Technical content (architecture, file citations, data models, design patterns) SHALL go to `tech-spec.md` only.
- The agent SHALL NOT put file path citations (`src/...`) into `behavior-spec.md`.
- The agent SHALL NOT put user stories ("As a…") into `tech-spec.md`.

#### Scenario: Findings contain mixed content
- **WHEN** a findings file contains both behavioral observations and technical implementation details about the same feature
- **THEN** the agent SHALL place the behavioral description in `behavior-spec.md` and the technical details in `tech-spec.md`
- **AND** each file SHALL contain a cross-reference link to the other for that feature

### Requirement: Agent updates changelog
After writing or updating domain spec files, the `deepfield-document-generator` agent SHALL append a summary to `deepfield/drafts/_changelog.md` in the same format used by `deepfield-knowledge-synth`.

#### Scenario: Changelog updated after document generation
- **WHEN** the agent completes writing spec files for one or more domains
- **THEN** it SHALL append a changelog entry listing: domains updated, which files (behavior-spec / tech-spec / both), and a brief description of what was added or changed

### Requirement: Agent updates unknowns and confidence metadata
The `deepfield-document-generator` agent SHALL update the confidence metadata (Last Updated, Confidence) at the top of each spec file. It SHALL also ensure that unresolved questions from findings appear in the relevant spec's Open Questions section and (if cross-cutting) in `deepfield/drafts/cross-cutting/unknowns.md`.

#### Scenario: Confidence metadata updated
- **WHEN** the agent writes or updates a spec file
- **THEN** the file's metadata header SHALL reflect the current run number and the domain's current confidence score
- **AND** if the confidence score is not yet known, the header SHALL say "Confidence: pending"
