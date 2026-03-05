## ADDED Requirements

### Requirement: deepfield version command SHALL print all component versions

The `deepfield version` command MUST read and display:
- CLI version (from `cli/package.json`)
- Plugin version (from `plugin/package.json`)
- Plugin manifest version (from `plugin/.claude-plugin/plugin.json`)
- Sync status: whether all three values are equal

#### Scenario: All versions in sync
- **WHEN** user runs `deepfield version` and all three files have `0.2.0`
- **THEN** output lists each component with its version
- **THEN** output includes a sync status indicator showing versions are in sync
- **THEN** command exits with code `0`

#### Scenario: Versions out of sync
- **WHEN** user runs `deepfield version` and the files have differing versions
- **THEN** output lists each component with its version
- **THEN** output includes a sync status indicator showing versions are NOT in sync
- **THEN** command exits with a non-zero exit code to signal the mismatch

#### Scenario: Component file missing
- **WHEN** one of the three version files does not exist (e.g., running in a partial checkout)
- **THEN** output shows the missing file path as `(not found)`
- **THEN** sync status shows NOT in sync
- **THEN** command exits with a non-zero exit code

### Requirement: deepfield version command SHALL follow createXCommand() factory pattern

The command MUST be implemented in `cli/src/commands/version.ts` using the existing `createXCommand()` factory pattern and registered in `cli/src/index.ts`.

#### Scenario: Command is registered and discoverable
- **WHEN** user runs `deepfield --help`
- **THEN** `version` appears in the list of available commands with a brief description

#### Scenario: Command help text
- **WHEN** user runs `deepfield version --help`
- **THEN** description and usage are displayed
