## MODIFIED Requirements

### Requirement: deepfield-iterate Step 4b currentDraftPath uses split structure
Step 4b of the `deepfield-iterate` skill, when preparing agent tasks for parallel domain learning, SHALL pass split draft paths to each domain learner agent instead of the single `{domain}.md` path. The `agentTasks` preparation SHALL include both `behaviorSpecPath` and `techSpecPath` fields per domain.

#### Scenario: Agent task prepared for existing domain in parallel mode
- **WHEN** Step 4b prepares a `deepfield-domain-learner` agent task for a domain that has existing split spec files
- **THEN** the task SHALL include `behaviorSpecPath: deepfield/drafts/domains/{domain}/behavior-spec.md`
- **AND** the task SHALL include `techSpecPath: deepfield/drafts/domains/{domain}/tech-spec.md`
- **AND** the task SHALL NOT include a `currentDraftPath` field pointing to a flat `{domain}.md`

#### Scenario: Agent task prepared for new domain (no existing specs)
- **WHEN** Step 4b prepares a task for a domain with no existing spec files
- **THEN** `behaviorSpecPath` and `techSpecPath` SHALL still be included in the task
- **AND** the agent SHALL understand that these files do not yet exist and will be created by the document-generator

### Requirement: deepfield-iterate Step 5 synthesis input uses split structure glob
Step 5 of the `deepfield-iterate` skill, when invoking `deepfield-knowledge-synth`, SHALL pass an `existing_drafts` glob of `deepfield/drafts/domains/**/*.md` to capture all split spec files across all domain subdirectories.

#### Scenario: Knowledge synth invoked after parallel learning
- **WHEN** Step 5 invokes `deepfield-knowledge-synth`
- **THEN** the `existing_drafts` input SHALL use the glob `deepfield/drafts/domains/**/*.md`
- **AND** this glob SHALL NOT be `deepfield/drafts/domains/*.md` (which would only match flat files at the `domains/` level)

### Requirement: deepfield-iterate Step 5.5.2 enumerates domains by subdirectory
Step 5.5.2 of the `deepfield-iterate` skill, which generates domain companion READMEs, SHALL enumerate domains by listing subdirectories under `deepfield/drafts/domains/` rather than listing `*.md` files.

#### Scenario: Domain README generation enumerates subdirectories
- **WHEN** Step 5.5.2 runs to generate domain companion READMEs
- **THEN** it SHALL execute directory enumeration (e.g., `ls -d deepfield/drafts/domains/*/`) to get the domain list
- **AND** it SHALL derive the domain name from the subdirectory name, not from stripping `.md` from a filename
- **AND** for each domain subdirectory, it SHALL generate a README at `deepfield/drafts/domains/{domain}/README.md` linking to both split spec files
