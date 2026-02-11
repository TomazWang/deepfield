## ADDED Requirements

### Requirement: KB management skill SHALL teach Claude about Deepfield

The skill MUST provide knowledge about how to use Deepfield effectively within Claude Code.

#### Scenario: Skill triggers on KB setup questions
- **WHEN** user asks "how do I set up a knowledge base"
- **THEN** kb-management skill activates
- **THEN** Claude suggests using /df-init and /df-start

#### Scenario: Skill interprets workflow states
- **WHEN** user asks about current state
- **THEN** skill helps Claude explain states
- **THEN** appropriate next commands are suggested

### Requirement: Skill SHALL include usage examples

The skill MUST provide concrete examples of Deepfield workflows.

#### Scenario: Skill provides examples
- **WHEN** skill content is loaded
- **THEN** examples show complete init→start→status flow
- **THEN** examples demonstrate brief.md filling
- **THEN** examples show status checking patterns

### Requirement: Skill SHALL be progressively disclosed

The skill MUST be concise in main SKILL.md with details in references/.

#### Scenario: Lean core content
- **WHEN** SKILL.md is loaded
- **THEN** content is under 2000 words
- **THEN** detailed examples are in examples/
- **THEN** references point to external docs

### Requirement: Skill SHALL use third-person description

The skill description MUST be written in third-person for Claude to understand when to activate.

#### Scenario: Clear triggering description
- **WHEN** skill frontmatter is read
- **THEN** description uses third-person voice
- **THEN** trigger phrases are specific (e.g., "knowledge base setup", "kb management")
- **THEN** examples demonstrate usage patterns
