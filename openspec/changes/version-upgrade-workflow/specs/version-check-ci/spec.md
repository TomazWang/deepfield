## ADDED Requirements

### Requirement: check-versions.sh SHALL fail if any version files are out of sync

`scripts/check-versions.sh` MUST read the `version` field from all three locations:
- `cli/package.json`
- `plugin/package.json`
- `plugin/.claude-plugin/plugin.json`

If all three values are equal, the script MUST exit `0`. If any differ, it MUST exit non-zero and print which files disagree and what versions were found.

#### Scenario: All versions match
- **WHEN** all three files contain the same version string
- **THEN** script prints a confirmation message listing the version
- **THEN** script exits with code `0`

#### Scenario: CLI and plugin versions differ
- **WHEN** `cli/package.json` has `0.3.0` and `plugin/package.json` has `0.2.0`
- **THEN** script prints each file path with its detected version
- **THEN** script prints a mismatch error
- **THEN** script exits with a non-zero exit code

#### Scenario: plugin.json out of sync
- **WHEN** `plugin/.claude-plugin/plugin.json` has a different version than the other two
- **THEN** the mismatch is reported including the plugin.json path
- **THEN** script exits with a non-zero exit code

#### Scenario: Missing version file
- **WHEN** one of the three files does not exist
- **THEN** script exits with a non-zero exit code
- **THEN** error message names the missing file

### Requirement: GitHub Actions workflow SHALL run check-versions.sh on every push and PR

A workflow file at `.github/workflows/version-check.yml` MUST trigger on `push` to all branches and on `pull_request` targeting `main`. It MUST call `scripts/check-versions.sh` and fail the workflow if the script exits non-zero.

#### Scenario: PR with mismatched versions
- **WHEN** a pull request is opened with mismatched version files
- **THEN** the `version-check` CI job fails
- **THEN** the failure is visible on the PR status checks

#### Scenario: PR with all versions in sync
- **WHEN** a pull request is opened with all three files at the same version
- **THEN** the `version-check` CI job passes

### Requirement: check-versions.sh SHALL also validate peerDependencies.deepfield

In addition to the three `version` fields, the script MUST verify that `plugin/package.json`'s `peerDependencies.deepfield` equals the same version string.

#### Scenario: peerDependencies out of sync
- **WHEN** `plugin/package.json` `version` is `0.3.0` but `peerDependencies.deepfield` is `0.2.0`
- **THEN** the mismatch is reported
- **THEN** script exits with a non-zero exit code
