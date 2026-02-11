## ADDED Requirements

### Requirement: CLI SHALL use TypeScript with modern tooling

The CLI MUST be implemented in TypeScript with tsconfig configured for ES2020+ features, strict mode enabled, and proper module resolution.

#### Scenario: TypeScript compilation
- **WHEN** TypeScript code is compiled
- **THEN** output is valid ES modules in dist/ directory
- **THEN** type checking passes with no errors

#### Scenario: Development workflow
- **WHEN** developer makes code changes
- **THEN** tsx enables immediate execution without manual compilation
- **THEN** changes are testable instantly

### Requirement: CLI SHALL use Commander.js framework

The CLI MUST use Commander.js for command parsing, argument handling, and help generation.

#### Scenario: CLI help display
- **WHEN** user runs `deepfield --help`
- **THEN** all commands are listed with descriptions
- **THEN** usage examples are shown

#### Scenario: Command execution
- **WHEN** user runs `deepfield init`
- **THEN** Commander routes to init command handler
- **THEN** arguments are parsed and validated

### Requirement: CLI SHALL support version display

The CLI MUST display version information from package.json.

#### Scenario: Version check
- **WHEN** user runs `deepfield --version`
- **THEN** current version number is displayed
- **THEN** version matches package.json

### Requirement: CLI SHALL have proper project structure

The CLI project MUST follow TypeScript best practices with clear separation of concerns.

#### Scenario: Source organization
- **WHEN** examining cli/ directory
- **THEN** src/commands/ contains command implementations
- **THEN** src/core/ contains shared business logic
- **THEN** src/cli.ts is the main entry point

#### Scenario: Template inclusion
- **WHEN** CLI is built
- **THEN** templates/ directory is bundled
- **THEN** templates are accessible at runtime
