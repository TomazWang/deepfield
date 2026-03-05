## ADDED Requirements

### Requirement: clone-repos command SHALL be registered in the CLI entry point

The `deepfield clone-repos` command MUST be registered using the `createXCommand()` factory pattern and added to the root Commander program.

#### Scenario: Command appears in help output
- **WHEN** user runs `deepfield --help`
- **THEN** `clone-repos` is listed as an available command
- **THEN** a brief description is shown

#### Scenario: Command is invokable
- **WHEN** user runs `deepfield clone-repos`
- **THEN** the clone-repos handler is executed
- **THEN** no "unknown command" error is thrown
