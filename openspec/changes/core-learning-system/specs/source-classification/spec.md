## ADDED Requirements

### Requirement: Classify source by type

The system SHALL classify each source into one of the following types: code, doc, config, schema, conversation, or spec.

#### Scenario: Git repository classification
- **WHEN** source is a git repository URL
- **THEN** system classifies as type "code"

#### Scenario: Documentation file classification
- **WHEN** source is a markdown, PDF, or HTML file containing documentation
- **THEN** system classifies as type "doc"

#### Scenario: Configuration file classification
- **WHEN** source is a YAML, JSON, TOML, or INI file
- **THEN** system classifies as type "config"

#### Scenario: Database schema classification
- **WHEN** source is a SQL file or migration script
- **THEN** system classifies as type "schema"

#### Scenario: Conversation or notes classification
- **WHEN** source is pasted text, chat logs, or meeting notes
- **THEN** system classifies as type "conversation"

#### Scenario: API specification classification
- **WHEN** source is an OpenAPI, AsyncAPI, GraphQL schema, or proto file
- **THEN** system classifies as type "spec"

### Requirement: Classify source by trust level

The system SHALL classify each source into one of three trust levels: trusted, reference, or exploratory.

#### Scenario: User-marked trusted source
- **WHEN** user explicitly marks source as "source of truth"
- **THEN** system classifies with trust level "trusted"

#### Scenario: Running code trust level
- **WHEN** source is code from main/production branch
- **THEN** system classifies with trust level "trusted"

#### Scenario: Official documentation trust level
- **WHEN** source is official documentation or API specs
- **THEN** system classifies with trust level "reference"

#### Scenario: Exploratory notes trust level
- **WHEN** source is meeting notes, Slack threads, or user-provided context
- **THEN** system classifies with trust level "exploratory"

### Requirement: Organize sources into baseline or per-run folders

The system SHALL organize trusted sources into `source/baseline/` and exploratory sources into `source/run-N/` folders based on trust level and persistence.

#### Scenario: Persistent source organization
- **WHEN** source has trust level "trusted" or "reference"
- **THEN** system organizes into `source/baseline/` folder structure

#### Scenario: Ephemeral source organization
- **WHEN** source has trust level "exploratory" or is user feedback
- **THEN** system organizes into `source/run-N/` folder for current run

#### Scenario: Git repository organization
- **WHEN** source is a git repository
- **THEN** system clones to `source/baseline/repos/<repo-name>/` at specified branch/tag

#### Scenario: Trusted documentation organization
- **WHEN** source is documentation with trust level "trusted" or "reference"
- **THEN** system files to `source/baseline/trusted-docs/`

### Requirement: Suggest domain relevance

The system SHALL suggest which domains each source likely relates to based on file paths, content patterns, and naming conventions.

#### Scenario: Authentication source suggestion
- **WHEN** source contains "auth", "login", "session", or "jwt" in paths or content
- **THEN** system suggests relevance to "authentication" domain

#### Scenario: API source suggestion
- **WHEN** source contains API routes, controllers, or OpenAPI specs
- **THEN** system suggests relevance to "api" or "integration" domains

#### Scenario: Data layer source suggestion
- **WHEN** source contains models, database migrations, or schemas
- **THEN** system suggests relevance to "data" or "persistence" domains

#### Scenario: Multiple domain suggestion
- **WHEN** source spans multiple concerns (e.g., auth middleware in API)
- **THEN** system suggests relevance to multiple domains
