## ADDED Requirements

### Requirement: Update draft documents based on findings

The system SHALL create or update documents in `drafts/` based on findings from each run, accumulating knowledge over time.

#### Scenario: Create new draft document
- **WHEN** findings cover a topic with no existing draft
- **THEN** system creates `drafts/<topic>.md` with structured content

#### Scenario: Update existing draft document
- **WHEN** findings provide new information for existing topic
- **THEN** system updates relevant sections in `drafts/<topic>.md`

#### Scenario: Preserve previous content
- **WHEN** updating draft
- **THEN** system preserves existing content and integrates new findings without replacing

### Requirement: Maintain document structure consistency

The system SHALL maintain consistent structure across all draft documents with standard sections for overview, architecture, patterns, and open questions.

#### Scenario: Use standard sections
- **WHEN** creating new draft
- **THEN** system includes sections: Overview, Architecture, Key Patterns, Data Flow (if relevant), Open Questions

#### Scenario: Update appropriate sections
- **WHEN** findings relate to specific aspect
- **THEN** system updates relevant section (e.g., architectural findings → Architecture section)

#### Scenario: Add subsections as needed
- **WHEN** topic complexity grows
- **THEN** system adds subsections to organize content (e.g., Architecture → Auth Flow, Session Management)

### Requirement: Track changes in changelog

The system SHALL append entry to `drafts/_changelog.md` after each run documenting what changed in which drafts.

#### Scenario: Log draft creation
- **WHEN** new draft is created
- **THEN** system appends entry: "Run N: Created <topic>.md"

#### Scenario: Log draft updates
- **WHEN** existing draft is updated
- **THEN** system appends entry: "Run N: Updated <topic>.md - <brief summary of changes>"

#### Scenario: Include run reference
- **WHEN** logging change
- **THEN** system includes run number for traceability

### Requirement: Maintain unknowns document

The system SHALL maintain `drafts/cross-cutting/unknowns.md` with current list of gaps, contradictions, and needed sources.

#### Scenario: Add new unknowns
- **WHEN** learning reveals gaps or contradictions
- **THEN** system adds to unknowns.md with description and why it matters

#### Scenario: Remove resolved unknowns
- **WHEN** findings resolve previously documented unknowns
- **THEN** system removes from unknowns.md and notes resolution in changelog

#### Scenario: Categorize unknowns
- **WHEN** maintaining unknowns
- **THEN** system groups by category (Missing Sources, Contradictions, Assumptions, Low Confidence)

### Requirement: Cross-reference between drafts

The system SHALL create cross-references between related topics in draft documents to show relationships and dependencies.

#### Scenario: Link related topics
- **WHEN** findings connect multiple topics (e.g., auth depends on session management)
- **THEN** system adds cross-references in both relevant drafts

#### Scenario: Use consistent link format
- **WHEN** creating cross-references
- **THEN** system uses markdown links: "See [Session Management](./session-management.md)"

#### Scenario: Update links on topic reorganization
- **WHEN** topics are split or merged
- **THEN** system updates all cross-references to reflect new structure

### Requirement: Synthesize findings into natural prose

The system SHALL write draft content in natural, readable prose that synthesizes findings rather than listing raw observations.

#### Scenario: Transform observations to explanations
- **WHEN** findings contain raw observations (e.g., "file X calls function Y")
- **THEN** system writes synthesis: "Authentication flow uses JWT validation in middleware..."

#### Scenario: Maintain technical accuracy
- **WHEN** writing prose
- **THEN** system preserves technical details, file paths, and code references

#### Scenario: Use consistent voice
- **WHEN** writing across multiple drafts
- **THEN** system maintains consistent documentation voice (present tense, third person, clear and direct)

### Requirement: Document confidence in content

The system SHALL indicate confidence level in draft content, marking uncertain or incomplete sections.

#### Scenario: Mark low confidence sections
- **WHEN** content is based on limited sources or assumptions
- **THEN** system adds note: "*Note: Low confidence - needs verification*"

#### Scenario: Mark incomplete sections
- **WHEN** section needs more investigation
- **THEN** system adds note: "*TODO: Investigate X*" or "*Open question: How does Y work?*"

#### Scenario: Remove uncertainty markers when resolved
- **WHEN** later runs provide clarity
- **THEN** system removes low-confidence markers and updates content with verified information
