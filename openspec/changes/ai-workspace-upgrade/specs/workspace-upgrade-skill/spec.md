## ADDED Requirements

### Requirement: Skill SHALL analyze workspace diff and determine required changes

The `deepfield-upgrade` plugin skill MUST accept a structured diff payload (`{from, to, workspaceSummary}`) and reason about what file operations are needed to bring the workspace from `from` version to `to` version.

#### Scenario: Skill receives valid diff payload
- **WHEN** the skill is invoked with a JSON diff payload containing `from`, `to`, and `workspaceSummary`
- **THEN** the skill analyzes the structural differences between the two versions
- **THEN** the skill produces a list of file operations (create, update, delete, rename) needed

#### Scenario: Skill handles up-to-date workspace
- **WHEN** `from` version equals `to` version in the diff payload
- **THEN** the skill returns an empty operation list
- **THEN** no file operations are applied

### Requirement: Skill SHALL apply changes using CLI helper commands atomically

The skill MUST NOT write files directly. It SHALL call `deepfield upgrade:<action>` helper commands for every file operation to ensure atomicity and consistent path resolution.

#### Scenario: Skill applies a file creation operation
- **WHEN** skill determines a new file must be created
- **THEN** skill calls `deepfield upgrade:apply-op --type create --path <path> --content <content>`
- **THEN** CLI helper writes the file atomically (temp + rename)

#### Scenario: Skill applies a file deletion operation
- **WHEN** skill determines a file must be removed
- **THEN** skill calls `deepfield upgrade:apply-op --type delete --path <path>`
- **THEN** CLI helper removes the file and confirms deletion

### Requirement: Skill SHALL validate workspace before and after applying changes

The skill MUST call `deepfield upgrade:validate` before applying operations and again after all operations complete.

#### Scenario: Pre-apply validation fails
- **WHEN** `deepfield upgrade:validate` returns a non-zero exit code before operations
- **THEN** skill aborts and reports the validation error
- **THEN** no operations are applied

#### Scenario: Post-apply validation passes
- **WHEN** all operations are applied and `deepfield upgrade:validate` returns exit code 0
- **THEN** skill reports success
- **THEN** skill outputs a summary of applied changes

#### Scenario: Post-apply validation fails
- **WHEN** all operations are applied but `deepfield upgrade:validate` returns a non-zero exit code
- **THEN** skill reports the validation failure with details
- **THEN** skill instructs user to run `deepfield rollback` to restore from backup

### Requirement: Skill SHALL update version field on successful upgrade

After successful validation, the skill MUST call `deepfield upgrade:set-version --version <to>` to update the `deepfieldVersion` field in `deepfield/project.config.json`.

#### Scenario: Version update after successful upgrade
- **WHEN** post-apply validation passes
- **THEN** skill calls `deepfield upgrade:set-version --version <to>`
- **THEN** `deepfield/project.config.json` reflects the new version
