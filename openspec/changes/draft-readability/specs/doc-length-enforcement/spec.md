## ADDED Requirements

### Requirement: AI agents observe 350-line maximum for draft documents
AI agents generating or updating draft documents in `deepfield/drafts/` SHALL keep each document to a maximum of approximately 350 lines. When a document would exceed 350 lines, the agent SHALL split it following the splitting guidelines.

#### Scenario: Agent respects limit when creating new draft
- **WHEN** an agent creates a new domain draft file
- **THEN** the file contains no more than ~350 lines of content

#### Scenario: Agent splits document when update would exceed limit
- **WHEN** an agent attempts to add content that would push a domain draft past 350 lines
- **THEN** the agent splits the document into a primary file and one or more sub-files, updating the primary file to link to the sub-files

### Requirement: Splitting guidelines provided to AI agents
Agent instructions and skill prompts for document generation SHALL include explicit splitting guidelines specifying: split by logical section, create sub-files as `{domain}-{section}.md` in the same directory, and add a "See also" section in the primary file linking to sub-files.

#### Scenario: Split sub-file naming follows convention
- **WHEN** the authentication domain draft is split
- **THEN** sub-files are named following the pattern `authentication-{section}.md` in `drafts/domains/`

#### Scenario: Primary file links to sub-files after split
- **WHEN** a domain draft is split into sub-files
- **THEN** the primary domain draft contains a "See also" or "Sections" list with markdown links to each sub-file
