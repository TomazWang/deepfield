## ADDED Requirements

### Requirement: repos.config.json SHALL define repo metadata schema

The system MUST maintain `deepfield/source/baseline/repos.config.json` with the following schema per entry:
- `name` (string, required): human-readable identifier
- `url` (string, required): git remote URL
- `branch` (string, required): branch to clone
- `commit` (string, optional): last known HEAD commit SHA
- `path` (string, required): path relative to the workspace root (not relative to `repos/`). Example: `"deepfield/source/baseline/repos/target-codebase"`
- `cloneMethod` (enum: `"https"` | `"ssh"`, required): protocol used
- `depth` (number, optional): shallow clone depth; 0 or omitted means full clone

#### Scenario: Valid config file is parseable
- **WHEN** `repos.config.json` exists and contains valid JSON
- **THEN** it parses to an array of repo entry objects
- **THEN** each entry has at minimum `name`, `url`, `branch`, `path`, and `cloneMethod` fields

#### Scenario: Missing optional fields are tolerated
- **WHEN** a repo entry omits `commit` and `depth`
- **THEN** the entry is treated as valid
- **THEN** `commit` defaults to undefined and `depth` defaults to full clone

### Requirement: repos.config.json SHALL be written atomically

All writes to `repos.config.json` MUST use write-to-temp-then-rename to prevent corruption.

#### Scenario: Atomic write on config update
- **WHEN** the config is written (detect or add)
- **THEN** content is written to `repos.config.json.tmp` first
- **THEN** `.tmp` file is renamed to `repos.config.json` atomically
- **THEN** no partial/corrupted config exists on disk if process crashes mid-write

### Requirement: Auto-detection SHALL populate config from existing repos directory

When `repos.config.json` does not exist and `deepfield/source/baseline/repos/` contains directories, the system MUST walk the directory and attempt to extract repo metadata from each git repo found.

#### Scenario: Detect repos with git remote
- **WHEN** `clone-repos --detect` is run
- **THEN** each subdirectory of `repos/` that is a git repo is inspected
- **THEN** `git remote get-url origin` is called to get the URL
- **THEN** `git rev-parse HEAD` is called to get current commit
- **THEN** `git rev-parse --abbrev-ref HEAD` is called to get branch
- **THEN** a config entry is written for each successfully detected repo

#### Scenario: Skip non-git directories during detection
- **WHEN** `clone-repos --detect` encounters a subdirectory that is not a git repo
- **THEN** a warning is printed identifying the directory
- **THEN** that directory is skipped
- **THEN** detection continues for remaining directories

#### Scenario: Handle repos with no remote
- **WHEN** a git repo has no `origin` remote
- **THEN** a warning is printed with the repo path
- **THEN** the repo is skipped (not added to config)
- **THEN** detection continues for remaining repos

### Requirement: source/baseline/repos/ SHALL be excluded from git tracking

The `.gitignore` template used by `deepfield init` MUST include an entry to exclude `deepfield/source/baseline/repos/`.

#### Scenario: New workspace excludes repos from git
- **WHEN** user runs `deepfield init`
- **THEN** `.gitignore` contains `deepfield/source/baseline/repos/`
- **THEN** git does not track any files under that path
