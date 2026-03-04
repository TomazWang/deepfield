## ADDED Requirements

### Requirement: Findings template enforces evidence structure
The system SHALL provide a `plugin/templates/findings.md` template that defines the required structure for every finding entry, including source reference, evidence type, quote/snippet, and confidence level.

#### Scenario: Template exists at expected path
- **WHEN** the plugin is installed
- **THEN** `plugin/templates/findings.md` exists with the structured evidence format

#### Scenario: Template includes source reference field
- **WHEN** an agent writes a finding using the template
- **THEN** the finding includes a `**Source:**` field with a `file:line` or `file:line-range` reference

#### Scenario: Template includes evidence type field
- **WHEN** an agent writes a finding using the template
- **THEN** the finding includes a `**Type:**` field with one of: `code`, `comment`, `doc`, `test`

#### Scenario: Template includes quote field
- **WHEN** an agent writes a finding using the template
- **THEN** the finding includes a `**Quote:**` field containing the actual text or code snippet found

#### Scenario: Template includes confidence level
- **WHEN** an agent writes a finding using the template
- **THEN** the finding includes a `**Confidence:**` field with one of: `high`, `medium`, `low`

#### Scenario: Template includes confidence level definitions
- **WHEN** the template is read
- **THEN** it contains inline definitions: high = multiple confirming sources, medium = single authoritative source, low = inference or assumption needing verification

### Requirement: Learner agent mandates evidence for every finding
The `deepfield-learner` agent SHALL require evidence collection (source reference, type, quote, confidence) for every finding it writes, with explicit prohibition on writing unsourced claims.

#### Scenario: Agent output includes Evidence block per finding
- **WHEN** the deepfield-learner agent writes a finding to findings.md
- **THEN** every discovery section includes an `**Evidence:**` block with at least one source reference

#### Scenario: Agent guardrails prohibit unsourced findings
- **WHEN** the deepfield-learner agent prompt is read
- **THEN** the Guardrails section contains an explicit rule prohibiting findings without source references

### Requirement: Domain learner agent mandates evidence uniformly
The `deepfield-domain-learner` agent SHALL require `file:line` citations for every claim in Key Components, Key Patterns, Data Flow, and Open Questions Answered sections of its output format.

#### Scenario: Key Components includes file:line for each component
- **WHEN** the domain learner writes a Key Components section
- **THEN** every component entry includes a `file:line` or `file:line-range` citation

#### Scenario: Key Patterns includes Evidence field
- **WHEN** the domain learner writes a Key Patterns section
- **THEN** every pattern entry includes an `**Evidence:**` line with a source reference

#### Scenario: Open Questions Answered includes evidence
- **WHEN** the domain learner writes an Open Questions Answered section
- **THEN** every answer includes an `**Evidence:**` line with a source reference
