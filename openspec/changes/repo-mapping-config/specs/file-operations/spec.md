## ADDED Requirements

### Requirement: createBackup SHALL exclude source/baseline/repos/ contents

The `createBackup()` function in `cli/src/utils/backup.ts` MUST skip all files under `deepfield/source/baseline/repos/` during the copy operation, while still including `deepfield/source/baseline/repos.config.json`.

#### Scenario: Backup excludes repo directory contents
- **WHEN** `createBackup()` is called and `deepfield/source/baseline/repos/` contains git repos
- **THEN** the backup does NOT include any files under `repos/`
- **THEN** the repos directory itself is absent from the backup (an empty `repos/` directory in the backup output is also acceptable)
- **THEN** backup size is not inflated by repo contents
- **NOTE** The filter MUST compare against the absolute path of `deepfield/source/baseline/repos/` (not a basename or substring match). This ensures the sibling file `repos.config.json` (whose absolute path does NOT start with `.../repos/`) is never excluded by the filter.

#### Scenario: Backup includes repos.config.json
- **WHEN** `createBackup()` is called and `repos.config.json` exists
- **THEN** the backup includes `deepfield/source/baseline/repos.config.json`
- **THEN** the config file content is intact in the backup

#### Scenario: Backup succeeds when repos directory does not exist
- **WHEN** `createBackup()` is called and `source/baseline/repos/` does not exist
- **THEN** backup completes successfully without error
- **THEN** no empty repos directory is created in the backup
