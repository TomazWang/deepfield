## ADDED Requirements

### Requirement: /df-init SHALL create complete kb/ directory structure

The command MUST create the four-space directory structure:
```
kb/
├── project.config.json (empty template)
├── source/
│   ├── baseline/
│   │   ├── repos/
│   │   └── trusted-docs/
│   └── run-0/
├── wip/
│   ├── project-map.md (placeholder)
│   ├── domain-index.md (placeholder)
│   └── run-0/
├── drafts/
│   ├── _changelog.md (empty)
│   ├── domains/
│   └── cross-cutting/
│       └── unknowns.md (template)
└── output/
```

#### Scenario: Initialize new knowledge base
- **WHEN** user runs /df-init in empty directory
- **THEN** kb/ directory is created with complete structure
- **THEN** all subdirectories exist
- **THEN** template files are populated
- **THEN** success message is displayed

#### Scenario: Initialize in directory with existing kb/
- **WHEN** user runs /df-init and kb/ already exists
- **THEN** command detects existing directory
- **THEN** user is prompted to confirm overwrite or skip
- **THEN** existing files are preserved unless user confirms overwrite

### Requirement: Scaffolding SHALL be idempotent

Running /df-init multiple times MUST be safe and not corrupt existing state.

#### Scenario: Re-run init on existing kb/
- **WHEN** /df-init runs on existing kb/ with user data
- **THEN** existing files are not overwritten by default
- **THEN** only missing directories/files are created
- **THEN** user data is preserved

### Requirement: Template files SHALL have placeholder content

Initial template files MUST contain helpful placeholder content:
- `project.config.json`: Empty structure with field descriptions as comments
- `project-map.md`: Instructions on how it will be used
- `domain-index.md`: Explanation of domain decomposition
- `unknowns.md`: Header explaining purpose of honest gaps

#### Scenario: Template files guide user
- **WHEN** user inspects kb/ after initialization
- **THEN** template files contain helpful instructions
- **THEN** JSON templates show expected schema
- **THEN** markdown templates explain their purpose

### Requirement: Scaffolding SHALL check write permissions

Before creating directories, the system MUST verify write permissions in target location.

#### Scenario: Successful permission check
- **WHEN** current directory is writable
- **THEN** scaffolding proceeds

#### Scenario: Permission denied
- **WHEN** current directory is not writable
- **THEN** clear error message is displayed
- **THEN** command exits without creating partial structure
- **THEN** suggested fix is provided (check permissions)

### Requirement: Scaffolding SHALL report created structure

After successful initialization, the system MUST display summary of created structure.

#### Scenario: Display initialization summary
- **WHEN** /df-init completes successfully
- **THEN** summary shows created directories and files
- **THEN** next steps are suggested (/df-start)
- **THEN** location of kb/ directory is displayed
