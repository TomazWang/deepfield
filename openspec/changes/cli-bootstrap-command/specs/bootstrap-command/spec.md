## ADDED Requirements

### Requirement: Bootstrap command exists
The CLI SHALL expose a `bootstrap` subcommand registered under the `deepfield` program.

#### Scenario: Command is available
- **WHEN** user runs `deepfield bootstrap --help`
- **THEN** the CLI displays help text showing description, `--force`, `--yes`, and `--debug` options

### Requirement: Prerequisite validation — deepfield directory
Before executing bootstrap, the CLI SHALL verify the `deepfield/` directory exists in the current working directory.

#### Scenario: Directory missing
- **WHEN** user runs `deepfield bootstrap` without a `deepfield/` directory present
- **THEN** CLI prints an error "deepfield/ directory not found", prints a suggestion to run `deepfield init`, and exits with code 3

### Requirement: Prerequisite validation — project configuration
The CLI SHALL verify that `deepfield/project.config.json` exists and contains a non-empty `projectName`.

#### Scenario: Config missing or unconfigured
- **WHEN** user runs `deepfield bootstrap` but `project.config.json` is absent or has no `projectName`
- **THEN** CLI prints an error "Project not configured", prints a suggestion to run `deepfield start`, and exits with code 3

### Requirement: Prerequisite validation — brief exists
The CLI SHALL verify that `deepfield/source/baseline/brief.md` exists.

#### Scenario: Brief file missing
- **WHEN** user runs `deepfield bootstrap` but `brief.md` does not exist
- **THEN** CLI prints an error "Brief not found", prints a suggestion to fill out the brief, and exits with code 3

### Requirement: Prerequisite validation — Run 0 not completed
The CLI SHALL verify that Run 0 has not already been completed (i.e., `deepfield/wip/run-0/run-0.config.json` does not exist with `status: "completed"`).

#### Scenario: Bootstrap already done
- **WHEN** user runs `deepfield bootstrap` but `run-0.config.json` exists with `status: "completed"`
- **THEN** CLI prints an error "Bootstrap already completed", suggests using `deepfield iterate`, and exits with code 3

### Requirement: Confirmation prompt
Unless `--yes` or `--force` is provided, the CLI SHALL display a summary of what bootstrap will do and prompt the user to confirm before proceeding.

#### Scenario: User confirms
- **WHEN** user runs `deepfield bootstrap` and confirms the prompt
- **THEN** CLI proceeds to execute bootstrap

#### Scenario: User cancels
- **WHEN** user runs `deepfield bootstrap` and declines the prompt
- **THEN** CLI prints "Bootstrap cancelled" and exits with code 0

#### Scenario: Skip with --yes
- **WHEN** user runs `deepfield bootstrap --yes`
- **THEN** CLI skips the confirmation prompt and proceeds directly

### Requirement: Bootstrap execution placeholder
When prerequisites pass and user confirms, the CLI SHALL invoke the bootstrap logic (currently a placeholder until Task 002).

#### Scenario: Placeholder execution
- **WHEN** all prerequisites pass and user confirms (or --yes is set)
- **THEN** CLI prints a warning that bootstrap skill is not yet implemented and exits with code 0

### Requirement: Error exit codes
The CLI SHALL use consistent exit codes: 0 for success, 1 for general error, 2 for invalid arguments, 3 for state errors, 4 for permission errors.

#### Scenario: State error exit code
- **WHEN** any prerequisite check fails
- **THEN** CLI exits with code 3
