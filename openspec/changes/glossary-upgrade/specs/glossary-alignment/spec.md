## ADDED Requirements

### Requirement: Glossary alignment step runs after terminology extraction
The `deepfield-iterate` skill SHALL execute a glossary alignment step (Step 5.8) after Step 5.7 (confidence scoring). This step SHALL:
1. Read `deepfield/drafts/cross-cutting/terminology.md` to obtain canonical terms and their known synonyms
2. Launch a `deepfield-glossary-aligner` agent to scan all domain drafts for synonym usage
3. The agent SHALL replace each synonym occurrence with its canonical term in affected domain drafts via `upgrade:apply-op`
4. The agent SHALL write an alignment log to `deepfield/wip/run-N/alignment-log.md` listing every substitution made

The alignment step SHALL be non-blocking: if it fails, a warning is logged and the run continues.

#### Scenario: Synonyms found in domain drafts
- **WHEN** Step 5.8 runs and `terminology.md` contains a canonical term "JWT" with synonyms ["auth token", "access token"]
- **WHEN** a domain draft contains the text "auth token"
- **THEN** the aligner replaces "auth token" with "JWT" in the domain draft
- **THEN** the substitution is recorded in `deepfield/wip/run-N/alignment-log.md`

#### Scenario: No synonyms in domain drafts
- **WHEN** Step 5.8 runs and all domain drafts already use canonical terms from `terminology.md`
- **THEN** no domain drafts are modified
- **THEN** `alignment-log.md` is written with entry: `No alignment changes required this run`

#### Scenario: Alignment step fails
- **WHEN** the `deepfield-glossary-aligner` agent fails or exits with error
- **THEN** the skill logs: `Warning: Glossary alignment failed for Run N: <error>`
- **THEN** the run continues to Step 9 (staging area creation) — alignment failure does NOT abort the run

#### Scenario: terminology.md is empty (no terms yet)
- **WHEN** Step 5.8 runs and `terminology.md` has no term entries (newly scaffolded)
- **THEN** the aligner skips domain draft scanning
- **THEN** `alignment-log.md` records: `Glossary is empty — skipping alignment`

### Requirement: deepfield-glossary-aligner agent exists
The plugin SHALL include a `deepfield-glossary-aligner` agent that specializes in term alignment across domain drafts.

The agent SHALL:
- Accept the current `terminology.md` as input
- Read all `deepfield/drafts/domains/*.md` files
- For each canonical term with synonyms, find and replace synonyms in draft text (case-insensitive, word-boundary matching)
- Write changes via `upgrade:apply-op --type update`
- Write an alignment log listing: domain draft path, canonical term, synonym replaced, count of replacements

#### Scenario: Agent replaces synonym across multiple domain drafts
- **WHEN** the glossary aligner agent is invoked with a terminology.md containing canonical="JWT", synonyms=["auth token"]
- **WHEN** two domain drafts each contain "auth token" twice
- **THEN** the agent updates both drafts replacing all occurrences
- **THEN** the alignment log records 4 total replacements across 2 files

#### Scenario: Agent uses word-boundary matching
- **WHEN** a domain draft contains "auth tokens" (plural) and the synonym is "auth token" (singular)
- **THEN** the agent does NOT replace "auth tokens" to avoid partial-word corruption
- **THEN** the alignment log notes the skipped plural form as a potential manual review item
