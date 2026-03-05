## ADDED Requirements

### Requirement: Legacy version 1.0.0 is mapped to 0.1.0

The system SHALL treat workspace version 1.0.0 as 0.1.0 internally to handle the version numbering scheme change that occurred during development.

#### Scenario: Reading workspace with version 1.0.0
- **WHEN** `getProjectVersion()` reads a `project.config.json` with `deepfieldVersion: "1.0.0"`
- **THEN** the function SHALL return `"0.1.0"` instead of `"1.0.0"`

#### Scenario: Version comparison with legacy workspace
- **WHEN** CLI version is 0.2.0 and project version is internally normalized from 1.0.0 to 0.1.0
- **THEN** upgrade detection SHALL correctly identify that 0.1.0 < 0.2.0 and trigger upgrade flow

### Requirement: Non-legacy versions are unchanged

The system SHALL return all version strings other than "1.0.0" without modification.

#### Scenario: Reading workspace with version 0.2.0
- **WHEN** `getProjectVersion()` reads a `project.config.json` with `deepfieldVersion: "0.2.0"`
- **THEN** the function SHALL return `"0.2.0"` unchanged

#### Scenario: Reading workspace with version 0.0.0
- **WHEN** `getProjectVersion()` reads a `project.config.json` with `deepfieldVersion: "0.0.0"`
- **THEN** the function SHALL return `"0.0.0"` unchanged

#### Scenario: Reading workspace with future version 0.3.0
- **WHEN** `getProjectVersion()` reads a `project.config.json` with `deepfieldVersion: "0.3.0"`
- **THEN** the function SHALL return `"0.3.0"` unchanged

### Requirement: Version mapping is documented in upgrade skill

The upgrade skill documentation SHALL explain the version mapping for AI awareness when analyzing upgrade operations.

#### Scenario: AI reads upgrade skill documentation
- **WHEN** the deepfield-upgrade skill is invoked with `from: "0.1.0"`
- **THEN** the skill documentation SHALL clarify that 0.1.0 indicates a workspace with actual `deepfieldVersion: "1.0.0"` that was normalized

### Requirement: Both CLI upgrade commands use consistent mapping

Both `upgrade.ts` and `upgrade-helpers.ts` SHALL implement identical version normalization logic.

#### Scenario: Version detection via upgrade:detect-version
- **WHEN** `deepfield upgrade:detect-version` is run in a workspace with version 1.0.0
- **THEN** the JSON output SHALL show `projectVersion: "0.1.0"`

#### Scenario: Version detection via upgrade command
- **WHEN** `deepfield upgrade` is run in a workspace with version 1.0.0
- **THEN** the upgrade flow SHALL use normalized version 0.1.0 for comparison
