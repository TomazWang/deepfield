## ADDED Requirements

### Requirement: Term extractor agent extracts domain terminology
The system SHALL provide a `deepfield-term-extractor` agent that reads a list of source files and a previous glossary, then identifies domain-specific terms, acronyms, and definitions, and writes results to `wip/run-N/new-terms.md`.

#### Scenario: Agent extracts acronym with expansion
- **WHEN** a file contains a pattern like `OMS (Order Management System)` or `/** OMS = Order Management System */`
- **THEN** the agent SHALL record term=`OMS`, expansion=`Order Management System`, and the source file path

#### Scenario: Agent extracts explicit glossary entry from markdown
- **WHEN** a README or doc file contains a Glossary section with `- **SKU**: Stock Keeping Unit`
- **THEN** the agent SHALL record term=`SKU`, definition=`Stock Keeping Unit`, and the source file path

#### Scenario: Agent ignores common English words
- **WHEN** scanning code files for potential terms
- **THEN** the agent SHALL NOT include common English words (e.g., "the", "class", "function") as domain terms

#### Scenario: Agent outputs new-terms.md
- **WHEN** extraction is complete
- **THEN** the agent SHALL write `deepfield/wip/run-N/new-terms.md` containing all discovered terms in the defined format

### Requirement: extract-terminology script orchestrates extraction
The system SHALL provide `plugin/scripts/extract-terminology.js` that accepts a run number and file list, launches the term-extractor agent, and writes `wip/run-N/new-terms.md`.

#### Scenario: Script invokes agent with correct inputs
- **WHEN** called with `--run 2 --files-json ./path/to/files.json`
- **THEN** the script SHALL pass the file list and existing glossary path to the agent and wait for completion

#### Scenario: Script handles missing glossary gracefully
- **WHEN** `drafts/cross-cutting/terminology.md` does not yet exist
- **THEN** the script SHALL pass an empty glossary context and proceed without error

### Requirement: merge-glossary script merges per-run terms into cumulative glossary
The system SHALL provide `plugin/scripts/merge-glossary.js` that reads `wip/run-N/new-terms.md` and `drafts/cross-cutting/terminology.md`, merges the entries, and writes the updated glossary atomically.

#### Scenario: New term is added to glossary
- **WHEN** a term in new-terms.md does not exist in the current glossary (case-insensitive match on term name)
- **THEN** the script SHALL append the term to the appropriate alphabetical section in terminology.md

#### Scenario: Existing term is updated
- **WHEN** a term in new-terms.md already exists in the glossary
- **THEN** the script SHALL add any new source files to the term's Files list and update the `Last updated` field to the current run number

#### Scenario: Glossary is written atomically
- **WHEN** the merge operation completes
- **THEN** the script SHALL write to a `.tmp` file first and rename it to the final path

#### Scenario: Glossary file does not exist yet
- **WHEN** `drafts/cross-cutting/terminology.md` does not exist
- **THEN** the script SHALL create it from the terminology template with all discovered terms

### Requirement: terminology.md template defines glossary structure
The system SHALL provide `plugin/templates/terminology.md` with an alphabetical skeleton and header section showing term count and last updated run.

#### Scenario: Template used when creating new glossary
- **WHEN** merge-glossary.js creates the glossary for the first time
- **THEN** the output SHALL match the template structure with populated header metadata

### Requirement: new-terms.md template defines per-run term format
The system SHALL provide `plugin/templates/new-terms.md` that defines the expected format for terms discovered in a single run.

#### Scenario: Agent uses template format
- **WHEN** the term-extractor agent writes new-terms.md
- **THEN** each entry SHALL include: term name, expansion (if acronym), definition, domain, files list, and first-seen run

### Requirement: iterate skill invokes terminology extraction each run
The system SHALL update `plugin/skills/deepfield-iterate.md` to include a terminology extraction step after knowledge synthesis and before updating the learning plan.

#### Scenario: Terminology extraction runs after synthesis
- **WHEN** Step 5 (knowledge synthesis) completes successfully
- **THEN** the skill SHALL invoke `extract-terminology.js` with the current run number and analyzed file list
- **THEN** the skill SHALL invoke `merge-glossary.js` to update the cumulative glossary

#### Scenario: Extraction failure does not stop the run
- **WHEN** terminology extraction fails or produces no terms
- **THEN** the skill SHALL log a warning and continue to Step 6 without halting the run

### Requirement: bootstrap skill initializes empty terminology glossary
The system SHALL update `plugin/skills/deepfield-bootstrap.md` to create an empty `drafts/cross-cutting/terminology.md` during Run 0 using the template.

#### Scenario: Empty glossary created during bootstrap
- **WHEN** Run 0 bootstrap completes
- **THEN** `deepfield/drafts/cross-cutting/terminology.md` SHALL exist with the template structure and zero terms
