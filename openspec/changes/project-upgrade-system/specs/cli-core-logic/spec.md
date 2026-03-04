## ADDED Requirements

### Requirement: Version check utility reads and compares project version
`cli/src/utils/check-version.ts` SHALL export a `checkProjectVersion(projectPath)` async function that reads `deepfield/project.config.json`, compares `deepfieldVersion` (defaulting to `0.0.0` if absent) against the CLI's own version from `package.json` using semver, and returns a structured result object with `compatible`, `projectVersion`, `currentVersion`, `needsUpgrade`, `needsDowngrade`, and `migrations` fields.

#### Scenario: Returns compatible true when versions match
- **WHEN** `deepfieldVersion` in config equals the CLI version
- **THEN** `checkProjectVersion()` returns `{ compatible: true, version: <version> }`

#### Scenario: Returns compatible false with migration list when behind
- **WHEN** `deepfieldVersion` is lower than the CLI version
- **THEN** `checkProjectVersion()` returns `{ compatible: false, needsUpgrade: true, migrations: [...] }`

#### Scenario: Returns compatible false with error flag when ahead
- **WHEN** `deepfieldVersion` is higher than the CLI version
- **THEN** `checkProjectVersion()` returns `{ compatible: false, needsDowngrade: true }`
