## MODIFIED Requirements

### Requirement: /df-init SHALL create complete kb/ directory structure

The command MUST create the four-space directory structure:
```
kb/
├── project.config.json (empty template with maxRuns field)
├── source/
│   ├── baseline/
│   │   ├── repos/
│   │   └── trusted-docs/
│   └── run-0/
├── wip/
│   ├── project-map.md (placeholder)
│   ├── domain-index.md (placeholder)
│   ├── learning-plan.md (template)
│   └── run-0/
├── drafts/
│   ├── _changelog.md (empty)
│   ├── domains/
│   └── cross-cutting/
│       └── unknowns.md (template)
└── output/
```

**Changes from previous version:**
- Added `learning-plan.md` template in wip/
- Added maxRuns field to project.config.json template

#### Scenario: Initialize new knowledge base
- **WHEN** user runs /df-init in empty directory
- **THEN** kb/ directory is created with complete structure
- **THEN** all subdirectories exist
- **THEN** template files are populated including learning-plan.md
- **THEN** success message is displayed

#### Scenario: Initialize in directory with existing kb/
- **WHEN** user runs /df-init and kb/ already exists
- **THEN** command detects existing directory
- **THEN** user is prompted to confirm overwrite or skip
- **THEN** existing files are preserved unless user confirms overwrite

## ADDED Requirements

### Requirement: Scaffold SHALL create learning plan template

The system SHALL create `wip/learning-plan.md` template during initialization with structure for topics, confidence, priorities, and open questions.

#### Scenario: Create learning plan template
- **WHEN** /df-init runs
- **THEN** wip/learning-plan.md is created with template structure
- **THEN** template includes sections: Topics, Confidence Tracking, Priorities, Open Questions

### Requirement: Scaffold SHALL create staging area structure

The system SHALL support creation of `run-N-staging` directories with README, feedback template, and sources subfolder.

#### Scenario: Staging directory template
- **WHEN** /df-init runs
- **THEN** templates for staging areas are available for later use
- **THEN** README template explains how to add feedback and sources
- **THEN** feedback.md template has structure for user input
