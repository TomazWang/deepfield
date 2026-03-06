## ADDED Requirements

### Requirement: Term extractor agent generates bilingual glossary entries when language is configured
The `deepfield-term-extractor` agent SHALL generate bilingual glossary entries when `output_language` from `DEEPFIELD.md` is not plain "English". For a bilingual language setting (e.g., "English + Zh-TW"), each glossary entry SHALL include:
- The term and its definition in English
- The definition repeated in the configured second language immediately below
- Both languages in the `**Usage**` field if a usage example is provided

For a non-English monolingual setting, all entry text SHALL be written in that language except the term headings (which remain in English for technical accuracy).

The agent SHALL use the same `output_language` value already passed to it from `deepfieldConfig.language`.

#### Scenario: Bilingual language configured (English + Zh-TW)
- **WHEN** `DEEPFIELD.md` sets language to "English + Zh-TW"
- **WHEN** the term extractor agent discovers the term "JWT"
- **THEN** the agent writes a glossary entry with an English definition block followed by a Traditional Chinese definition block
- **THEN** the entry follows the ENTRY FORMAT comment in `terminology.md` with an added language-pair structure

#### Scenario: Language is plain English (default)
- **WHEN** `DEEPFIELD.md` sets language to "English" or no language is set
- **WHEN** the term extractor agent discovers terms
- **THEN** all glossary entries are written in English only (existing behavior, no change)

#### Scenario: Language is non-English monolingual
- **WHEN** `DEEPFIELD.md` sets language to a single non-English language (e.g., "Traditional Chinese")
- **WHEN** the term extractor agent discovers a term
- **THEN** the definition and usage fields are written in Traditional Chinese
- **THEN** the term heading remains in English (technical term)

### Requirement: merge-glossary.js preserves bilingual entry structure
The `merge-glossary.js` script SHALL treat bilingual entries as opaque text blocks during merge. It SHALL NOT strip or reformat language-specific content when merging new terms into the cumulative glossary.

#### Scenario: Bilingual entry merged into existing glossary
- **WHEN** `merge-glossary.js` merges a new-terms file containing a bilingual entry
- **THEN** the full bilingual entry (both language blocks) is written into `terminology.md` unchanged
- **THEN** the entry is placed under the correct alphabetical section header

#### Scenario: English-only entry merged into bilingual glossary
- **WHEN** `merge-glossary.js` merges an English-only entry into a glossary that already has bilingual entries
- **THEN** the English-only entry is written as-is without modification
- **THEN** existing bilingual entries are not affected
