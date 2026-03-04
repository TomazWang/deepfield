## ADDED Requirements

### Requirement: Learning skills read DEEPFIELD.md config at run start
The `deepfield-bootstrap` and `deepfield-iterate` skills SHALL read `deepfield/DEEPFIELD.md` at the start of each run using the `parse-deepfield-config.js` script, and use the resulting config throughout the run.

#### Scenario: Config read at run start
- **WHEN** a learning skill begins execution
- **THEN** it SHALL run `node $CLAUDE_PLUGIN_ROOT/scripts/parse-deepfield-config.js deepfield/DEEPFIELD.md`
- **AND** parse the JSON output into a config object for use in the run

#### Scenario: Config absent — defaults used
- **WHEN** `deepfield/DEEPFIELD.md` does not exist
- **THEN** the skill SHALL continue with default config (English, standard depth, no exclusions)
- **AND** SHALL NOT fail or warn the user

---

### Requirement: Skills respect exclusion patterns during file scanning
Learning skills SHALL skip files matching exclusion patterns from `priorities.exclude` during incremental scanning.

#### Scenario: Excluded files skipped
- **WHEN** config contains `priorities.exclude: ["/legacy/**"]`
- **AND** the file scanner lists files under `/legacy/`
- **THEN** those files SHALL be excluded from the scan and analysis

---

### Requirement: Skills apply priority levels to topic selection
Learning skills SHALL use `priorities.high`, `priorities.medium`, and `priorities.low` domain lists to adjust learning depth and topic selection order.

#### Scenario: High priority domains learned deeply
- **WHEN** a domain is listed under `priorities.high`
- **THEN** the skill SHALL analyze all files in that domain (not just key files) and produce comprehensive output

#### Scenario: Low priority domains learned at overview level
- **WHEN** a domain is listed under `priorities.low`
- **THEN** the skill SHALL analyze only key entry-point files and produce a summary-level output

---

### Requirement: Skills inject domain-specific instructions into domain agent prompts
When a domain has an entry in `domainInstructions`, the learning skill SHALL include those instructions in the context passed to the domain learning agent for that domain.

#### Scenario: Domain instructions injected
- **WHEN** `domainInstructions["authentication"]` contains text
- **AND** the skill launches a learning agent for the `authentication` domain
- **THEN** the agent prompt SHALL include the domain instructions text under a "Domain-Specific Instructions" heading

#### Scenario: No domain instructions — prompt unchanged
- **WHEN** a domain has no entry in `domainInstructions`
- **THEN** the agent prompt SHALL NOT include a "Domain-Specific Instructions" section for that domain

---

### Requirement: Skills inject language and output preferences into agent prompts
Learning skills SHALL pass the configured `language` and `outputPrefs` to agents so documentation is generated in the correct language and format.

#### Scenario: Non-English language respected
- **WHEN** config specifies `language: "Chinese"`
- **THEN** agent prompts SHALL instruct the agent to write documentation in Chinese

#### Scenario: English is the default
- **WHEN** config has no language setting
- **THEN** agent prompts SHALL default to English
