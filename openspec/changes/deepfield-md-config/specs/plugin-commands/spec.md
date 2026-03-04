## ADDED Requirements

### Requirement: df-init scaffolds DEEPFIELD.md after initialization
The `/df-init` command SHALL, after successful initialization, offer to scaffold a `DEEPFIELD.md` file in the `deepfield/` directory using the template from `plugin/templates/DEEPFIELD.md`.

#### Scenario: User accepts DEEPFIELD.md creation
- **WHEN** `/df-init` completes successfully
- **AND** the user confirms they want a DEEPFIELD.md
- **THEN** the command SHALL copy `plugin/templates/DEEPFIELD.md` to `deepfield/DEEPFIELD.md`
- **AND** SHALL inform the user the file was created and explain its purpose

#### Scenario: User declines DEEPFIELD.md creation
- **WHEN** `/df-init` completes successfully
- **AND** the user declines DEEPFIELD.md creation
- **THEN** the command SHALL skip creation and proceed to next-step guidance

#### Scenario: DEEPFIELD.md already exists
- **WHEN** `/df-init` is run and `deepfield/DEEPFIELD.md` already exists
- **THEN** the command SHALL NOT overwrite the existing file
- **AND** SHALL inform the user that DEEPFIELD.md already exists
