## ADDED Requirements

### Requirement: Agent SHALL accept a full documentation context as input

The `deepfield-document-generator` agent MUST accept the following inputs when launched:
- `findings`: path to consolidated findings for the current run (`deepfield/wip/run-N/findings.md`)
- `domain_findings_dir`: path to per-domain findings directory (`deepfield/wip/run-N/domains/`)
- `existing_drafts_dir`: path to draft domain documents (`deepfield/drafts/domains/`)
- `staging_feedback`: path to staging feedback file for the current run (`deepfield/source/run-N-staging/feedback.md`), or null if absent
- `config`: the parsed DEEPFIELD.md config object (language, priorities, domainInstructions, formatPreferences)
- `unknowns`: path to current unknowns document (`deepfield/drafts/cross-cutting/unknowns.md`)
- `changelog`: path to changelog (`deepfield/drafts/_changelog.md`)
- `run_number`: integer identifying the current run

#### Scenario: Agent receives all required inputs
- **WHEN** the iterate skill launches the agent at Step 5
- **THEN** the agent prompt includes all eight input fields listed above
- **THEN** staging_feedback is null if `deepfield/source/run-N-staging/feedback.md` does not exist

#### Scenario: Agent reads staging feedback when present
- **WHEN** staging_feedback path is provided and the file exists
- **THEN** the agent reads the full content of the feedback file
- **THEN** the agent applies user corrections and priorities from that file to the generated docs

#### Scenario: Agent proceeds without staging feedback when absent
- **WHEN** staging_feedback is null
- **THEN** the agent generates documentation from findings and config alone
- **THEN** no error is raised

### Requirement: Agent SHALL generate behavior-spec.md per domain with findings

The agent MUST write `deepfield/drafts/domains/<domain>/behavior-spec.md` for each domain that has findings in the current run.

#### Scenario: New domain with no existing behavior spec
- **WHEN** a domain has findings and no prior behavior-spec.md exists
- **THEN** a new behavior-spec.md is created at `deepfield/drafts/domains/<domain>/behavior-spec.md`
- **THEN** the file contains an Overview, User Stories, Scenarios (Given-When-Then), and Business Rules sections

#### Scenario: Existing behavior spec is updated, not replaced
- **WHEN** a domain has findings and a prior behavior-spec.md exists
- **THEN** the agent reads the existing content before writing
- **THEN** new findings are integrated (sections expanded, new scenarios added)
- **THEN** existing content is preserved unless directly contradicted by findings

#### Scenario: Domain with no new findings is not rewritten
- **WHEN** a domain has no findings in the current run
- **THEN** the agent does NOT overwrite that domain's behavior-spec.md

### Requirement: Agent SHALL generate tech-spec.md per domain with findings

The agent MUST write `deepfield/drafts/domains/<domain>/tech-spec.md` for each domain that has findings in the current run.

#### Scenario: New domain with no existing tech spec
- **WHEN** a domain has findings and no prior tech-spec.md exists
- **THEN** a new tech-spec.md is created at `deepfield/drafts/domains/<domain>/tech-spec.md`
- **THEN** the file contains Architecture, Key Components, Data Flow, Integration Points, and Open Questions sections

#### Scenario: Existing tech spec is updated incrementally
- **WHEN** a domain has findings and a prior tech-spec.md exists
- **THEN** the agent reads the existing content before writing
- **THEN** new implementation details are integrated without discarding previous content

### Requirement: Agent SHALL respect DEEPFIELD.md config when generating documents

The agent MUST apply configuration from the parsed DEEPFIELD.md config object to all generated content.

#### Scenario: Language setting is applied
- **WHEN** config.language is set to a non-English value (e.g., "English + Zh-TW")
- **THEN** all newly written sections in behavior-spec.md and tech-spec.md include both languages
- **THEN** technical terms with no target-language equivalent are kept in English with a parenthetical translation

#### Scenario: Domain instructions are applied
- **WHEN** config.domainInstructions contains an entry for a domain being documented
- **THEN** those instructions inform the content and emphasis of that domain's generated docs

#### Scenario: Default language when config absent
- **WHEN** config.language is absent or "English"
- **THEN** all documents are written in English

### Requirement: Agent SHALL update cross-cutting documents

The agent MUST update `deepfield/drafts/cross-cutting/unknowns.md` and append to `deepfield/drafts/_changelog.md` after generating domain docs.

#### Scenario: Unknowns document is updated
- **WHEN** domain findings contain new unknowns or resolve existing ones
- **THEN** new unknowns are added to unknowns.md under the appropriate category
- **THEN** unknowns resolved by findings are removed from the document

#### Scenario: Changelog is appended
- **WHEN** the agent completes documentation generation
- **THEN** a new entry is appended to `_changelog.md` listing updated domains, new content, and resolved unknowns for Run N

### Requirement: Agent SHALL apply document length and evidence rules to all output

The agent MUST follow the document length rule (approximately 350 prose lines per file) and evidence requirements when writing.

#### Scenario: Long document is split into sub-files
- **WHEN** generated content for a domain would exceed approximately 350 prose lines
- **THEN** the largest section is moved to a sub-file under `deepfield/drafts/domains/<domain>/`
- **THEN** the primary file contains a "See also" link to the sub-file
- **THEN** the moved content is NOT duplicated in the primary file

#### Scenario: Evidence is cited for technical claims
- **WHEN** the agent makes a technical claim about implementation
- **THEN** a file:line citation is included (e.g., `[Evidence: src/auth/login.ts:45-52]`)

#### Scenario: Low-confidence sections are marked
- **WHEN** domain findings carry low evidence strength for a claim
- **THEN** the corresponding section in the generated doc is marked with a low-confidence indicator

#### Scenario: Agent waits for all parallel domain-learner agents before generating docs
- **WHEN** multiple domain-learner agents run in parallel during Step 4
- **THEN** the iterate skill waits for all of them to complete before launching deepfield-document-generator
- **THEN** the document-generator reads findings from all completed domains via domain_findings_dir
- **THEN** no domain's documentation is generated before all parallel agents have written their findings
