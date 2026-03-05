## ADDED Requirements

### Requirement: bump-version.sh SHALL atomically update all three version locations

`scripts/bump-version.sh` MUST accept a bump type argument (`patch`, `minor`, or `major`), compute the new version from the current `cli/package.json` version, and atomically update:
- `cli/package.json` → `version`
- `plugin/package.json` → `version` AND `peerDependencies.deepfield`
- `plugin/.claude-plugin/plugin.json` → `version`

Atomic write MUST follow the pattern: write to `<file>.tmp`, validate with `jq empty`, then `mv <file>.tmp <file>`.

#### Scenario: Patch bump
- **WHEN** user runs `scripts/bump-version.sh patch` and current version is `0.2.0`
- **THEN** all three files are updated to `0.2.1`
- **THEN** script prints the old and new version

#### Scenario: Minor bump
- **WHEN** user runs `scripts/bump-version.sh minor` and current version is `0.2.1`
- **THEN** all three files are updated to `0.3.0`
- **THEN** patch component is reset to `0`

#### Scenario: Major bump
- **WHEN** user runs `scripts/bump-version.sh major` and current version is `0.3.0`
- **THEN** all three files are updated to `1.0.0`
- **THEN** minor and patch components are reset to `0`

#### Scenario: Invalid bump type
- **WHEN** user runs `scripts/bump-version.sh hotfix` (invalid type)
- **THEN** script exits with a non-zero exit code
- **THEN** usage message is printed to stderr

#### Scenario: Missing argument
- **WHEN** user runs `scripts/bump-version.sh` with no arguments
- **THEN** script exits with a non-zero exit code
- **THEN** usage message is printed to stderr

### Requirement: bump-version.sh SHALL rebuild the CLI after updating versions

After writing all three files, the script MUST run `npm run build` inside `cli/` to ensure the compiled output reflects the new version.

#### Scenario: Successful rebuild
- **WHEN** version bump completes and `npm run build` succeeds
- **THEN** script prints a success summary with the new version
- **THEN** script exits with code `0`

#### Scenario: Build failure
- **WHEN** `npm run build` fails after version files are written
- **THEN** script exits with a non-zero exit code
- **THEN** error message indicates the build step failed
- **THEN** version files remain at the new version (not rolled back — the files are already consistent)

### Requirement: bump-version.sh SHALL require jq

The script MUST check for `jq` availability at startup and fail fast with a clear message if it is not found.

#### Scenario: jq not installed
- **WHEN** `jq` is not available on PATH
- **THEN** script exits with a non-zero exit code immediately
- **THEN** error message instructs user to install `jq`
