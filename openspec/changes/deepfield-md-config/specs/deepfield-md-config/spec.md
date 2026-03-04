## ADDED Requirements

### Requirement: DEEPFIELD.md template exists
Deepfield SHALL provide a `DEEPFIELD.md` template file in `plugin/templates/` that covers all configurable sections: Language & Format, Learning Priorities, Domain-Specific Instructions, Output Preferences, and Trust Hierarchy.

#### Scenario: Template has all sections
- **WHEN** the template file `plugin/templates/DEEPFIELD.md` is read
- **THEN** it SHALL contain sections for Language & Format, Learning Priorities (High/Medium/Low/Exclude), Domain-Specific Instructions, Output Preferences, and Trust Hierarchy

#### Scenario: Template is instructional
- **WHEN** a user opens the template
- **THEN** each section SHALL contain inline comments or placeholder text explaining what to write

---

### Requirement: parse-deepfield-config.js parses DEEPFIELD.md
The script `plugin/scripts/parse-deepfield-config.js` SHALL read a `DEEPFIELD.md` file and return a structured JSON object with all parsed config fields.

#### Scenario: File exists and is well-formed
- **WHEN** the script is run with a path to a valid DEEPFIELD.md
- **THEN** it SHALL output JSON with fields: `language`, `codeLanguage`, `diagramFormat`, `detailLevel`, `priorities` (object with `high`, `medium`, `low`, `exclude` arrays), `domainInstructions` (object mapping domain name to raw markdown text), `outputPrefs` (raw text), `trustHierarchy` (array of strings), and `raw` (full file content)

#### Scenario: File does not exist
- **WHEN** the script is run with a path to a non-existent file
- **THEN** it SHALL output JSON with all default values and `exists: false`
- **AND** it SHALL exit with code 0 (not an error condition)

#### Scenario: File exists but a section is missing
- **WHEN** the DEEPFIELD.md file omits a section (e.g., no Trust Hierarchy)
- **THEN** the corresponding field SHALL contain its default value (empty array or default string)

#### Scenario: CLI usage
- **WHEN** the script is invoked from the command line with `node parse-deepfield-config.js [path]`
- **THEN** it SHALL print the parsed JSON to stdout

#### Scenario: Module usage
- **WHEN** the script is required as a CJS module
- **THEN** it SHALL export `{ parseDeepfieldConfig }` for use by skills and other scripts

---

### Requirement: Exclusion patterns are glob-compatible strings
The `priorities.exclude` array SHALL contain path glob patterns that skills can use to skip files during scanning.

#### Scenario: Exclude patterns extracted from Exclude section
- **WHEN** DEEPFIELD.md has an Exclude subsection with bullet items like `- /legacy/**`
- **THEN** `priorities.exclude` SHALL contain `["/legacy/**"]`

---

### Requirement: Domain instructions are keyed by domain name
The `domainInstructions` field SHALL be an object where each key is a domain name (lowercased, hyphenated) and the value is the raw markdown text of that domain's instructions block.

#### Scenario: Single domain instruction block parsed
- **WHEN** DEEPFIELD.md has `### authentication` under Domain-Specific Instructions with body text
- **THEN** `domainInstructions["authentication"]` SHALL contain the raw body text of that block
