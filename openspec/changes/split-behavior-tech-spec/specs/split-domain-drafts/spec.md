## ADDED Requirements

### Requirement: Two-file domain draft structure
Each domain's draft documentation SHALL be stored as two separate files under a subdirectory: `deepfield/drafts/domains/{domain}/behavior-spec.md` and `deepfield/drafts/domains/{domain}/tech-spec.md`. A single flat `deepfield/drafts/domains/{domain}.md` file SHALL NOT be created or updated by any agent or script.

#### Scenario: New domain encountered during learning
- **WHEN** a learning run discovers a domain with no existing draft files
- **THEN** the system SHALL create `deepfield/drafts/domains/{domain}/behavior-spec.md` using the behavior-spec template
- **AND** the system SHALL create `deepfield/drafts/domains/{domain}/tech-spec.md` using the tech-spec template

#### Scenario: Existing domain updated during learning
- **WHEN** a learning run produces findings for a domain that already has split files
- **THEN** the system SHALL update both `behavior-spec.md` and `tech-spec.md` as appropriate, adding new behavioral findings to behavior-spec and new technical findings to tech-spec
- **AND** the system SHALL NOT recreate or overwrite files from scratch — it SHALL integrate new content into existing files

### Requirement: behavior-spec.md content contract
`behavior-spec.md` SHALL contain only stakeholder-level content: user stories in the "As a / I want / So that" format, Given-When-Then scenarios, product feature descriptions, business rules, and user flows. It SHALL NOT contain implementation details such as file paths, class names, function names, SQL schemas, or library versions.

#### Scenario: Behavior spec content check
- **WHEN** a behavior-spec.md is written or updated
- **THEN** the document SHALL contain at least one User Story or Given-When-Then Scenario section
- **AND** the document SHALL NOT reference source file paths (e.g., `src/auth/login.ts`)

### Requirement: tech-spec.md content contract
`tech-spec.md` SHALL contain only implementation-level content: architecture diagrams (ASCII), key classes and functions with file path citations, design patterns, data models (schemas, entity relationships), external dependencies, and technical decisions with rationale. It SHALL NOT contain user stories or stakeholder-language narratives.

#### Scenario: Tech spec content check
- **WHEN** a tech-spec.md is written or updated
- **THEN** the document SHALL contain at least one of: an Architecture section, a Key Implementations section, a Data Models section, or a Design Patterns section
- **AND** technical claims SHALL cite source file paths where evidence exists

### Requirement: behavior-spec.md template structure
The `plugin/templates/behavior-spec.md` template SHALL define the following sections: metadata header (Last Updated, Confidence), User Stories, Scenarios, Product Features, Business Rules, Open Questions. The template SHALL include an audience boundary reminder at the top: "Audience: Stakeholders, Product Managers, QA. Do not include file paths, class names, or implementation details."

#### Scenario: New domain draft created from template
- **WHEN** the document-generator agent creates a new behavior-spec.md
- **THEN** the file SHALL begin with the audience boundary reminder comment
- **AND** the file SHALL contain all required section headers from the template

### Requirement: tech-spec.md template structure
The `plugin/templates/tech-spec.md` template SHALL define the following sections: metadata header (Last Updated, Confidence), Architecture (with ASCII diagram placeholder), Key Implementations (file path citations), Design Patterns, Data Models, Dependencies, Technical Decisions, Open Questions. The template SHALL include an audience boundary reminder at the top: "Audience: Developers, Architects. Do not include user stories or stakeholder-language narratives."

#### Scenario: New domain draft created from template
- **WHEN** the document-generator agent creates a new tech-spec.md
- **THEN** the file SHALL begin with the audience boundary reminder comment
- **AND** the file SHALL contain all required section headers from the template

### Requirement: Cross-references between behavior-spec and tech-spec
Each spec file MAY reference the other using a relative link. `behavior-spec.md` SHALL use `./tech-spec.md` when citing the technical implementation of a described behavior. `tech-spec.md` SHALL use `./behavior-spec.md` when referencing a requirement or user story that motivates a design decision.

#### Scenario: Behavior spec references corresponding tech spec
- **WHEN** a behavior-spec.md section describes a feature that has a known technical implementation
- **THEN** the document MAY include a "See also: [Technical implementation](./tech-spec.md#section)" link
- **AND** the link SHALL use a relative path starting with `./`

#### Scenario: Tech spec references corresponding behavior spec
- **WHEN** a tech-spec.md decision is motivated by a business requirement
- **THEN** the document MAY include a "Implements: [requirement name](./behavior-spec.md#section)" link
- **AND** the link SHALL use a relative path starting with `./`

### Requirement: Domain README companion
`deepfield/drafts/domains/{domain}/README.md` SHALL be generated as a navigation index linking to both `behavior-spec.md` and `tech-spec.md`. It SHALL display the confidence score and last-updated run number for each spec. It SHALL NOT duplicate content from either spec.

#### Scenario: README generated after learning run
- **WHEN** the `generate-domain-readme.js` script runs for a domain
- **THEN** the README SHALL contain links to both `./behavior-spec.md` and `./tech-spec.md`
- **AND** each link SHALL show the confidence score and last-updated run number

### Requirement: Domain enumeration by subdirectory
Scripts and skills that enumerate domains under `deepfield/drafts/domains/` SHALL enumerate subdirectories (not `*.md` files at the `domains/` level), since the flat file structure no longer exists.

#### Scenario: Domain README generation loop
- **WHEN** Step 5.5.2 of `deepfield-iterate` runs to generate domain companion READMEs
- **THEN** it SHALL list subdirectories under `deepfield/drafts/domains/` to get the domain list
- **AND** it SHALL NOT attempt to derive domain names from `*.md` filenames at the `domains/` level
