## ADDED Requirements

### Requirement: clone-repos command SHALL clone repos from repos.config.json

The `deepfield clone-repos` command MUST read `deepfield/source/baseline/repos.config.json` and clone each listed repo into `deepfield/source/baseline/repos/<path>`.

#### Scenario: Clone all repos from config
- **WHEN** user runs `deepfield clone-repos`
- **THEN** each entry in `repos.config.json` is processed in order
- **THEN** `git clone <url> --branch <branch>` is executed for each entry
- **THEN** the repo is placed at `deepfield/source/baseline/repos/<path>`
- **THEN** a success message is printed per repo

#### Scenario: Skip already-cloned repos
- **WHEN** `deepfield clone-repos` is run and a repo directory already exists
- **THEN** the repo is skipped with an informational message
- **THEN** no destructive action is taken on the existing directory

#### Scenario: Re-clone with --force flag
- **WHEN** user runs `deepfield clone-repos --force`
- **THEN** existing repo directories are removed before cloning
- **THEN** all repos are cloned fresh from their configured URLs

#### Scenario: Missing config file
- **WHEN** `repos.config.json` does not exist
- **THEN** an error message is displayed explaining the file is missing
- **THEN** user is advised to run `deepfield clone-repos --detect` to generate it
- **THEN** exit code is non-zero

#### Scenario: Config file exists but has zero entries
- **WHEN** `repos.config.json` exists and contains an empty array (`[]`)
- **THEN** the command prints "No repos configured." to stdout
- **THEN** exit code is 0

### Requirement: clone-repos SHALL support shallow clones via depth config

When a repo entry has a non-zero `depth` field, the clone MUST use `--depth <n>`.

#### Scenario: Shallow clone with depth from config
- **WHEN** a repo entry has `depth: 1`
- **THEN** `git clone --depth 1 <url> --branch <branch>` is executed
- **THEN** clone succeeds with shallow history

#### Scenario: Full clone when depth is omitted or zero
- **WHEN** a repo entry has no `depth` field or `depth: 0`
- **THEN** `git clone <url> --branch <branch>` is executed without `--depth`
- **THEN** full history is cloned

### Requirement: clone-repos --detect SHALL auto-generate repos.config.json

When run with `--detect`, the command MUST inspect existing repos in `deepfield/source/baseline/repos/` and write a new `repos.config.json`.

#### Scenario: Detect and generate config
- **WHEN** user runs `deepfield clone-repos --detect`
- **THEN** each git repo in `repos/` is inspected
- **THEN** `repos.config.json` is created with detected entries
- **THEN** a summary is printed showing how many repos were detected

#### Scenario: Detect with existing config prompts for confirmation
- **WHEN** `repos.config.json` already exists and user runs `deepfield clone-repos --detect`
- **THEN** user is warned that existing config will be overwritten
- **THEN** user is prompted to confirm (y/N)
- **THEN** if confirmed, config is regenerated; if declined, command exits without changes

### Requirement: clone-repos SHALL report per-repo status

The command MUST print the result of each repo operation (cloned, skipped, failed).

#### Scenario: Mixed results display
- **WHEN** some repos clone successfully and others fail
- **THEN** each repo shows its status (cloned / skipped / failed)
- **THEN** a summary line shows counts: "X cloned, Y skipped, Z failed"
- **THEN** exit code is non-zero if any repo failed

### Requirement: clone-repos SHALL handle clone failures gracefully

If a single repo fails to clone, the command MUST continue processing remaining repos and report all failures at the end.

#### Scenario: Clone failure does not abort
- **WHEN** one repo's `git clone` exits with a non-zero code
- **THEN** error is recorded for that repo
- **THEN** remaining repos continue to be processed
- **THEN** all failures are listed in the final summary
- **THEN** overall exit code is non-zero
