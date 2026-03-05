## ADDED Requirements

### Requirement: version command SHALL be registered in the CLI entry point

The `version` command MUST be imported and registered in `cli/src/index.ts` alongside the existing commands (`init`, `start`, `status`, `clone-repos`).

#### Scenario: version command available from CLI root
- **WHEN** user runs `deepfield version`
- **THEN** the version command handler is invoked
- **THEN** it is not confused with Commander.js's built-in `--version` flag
