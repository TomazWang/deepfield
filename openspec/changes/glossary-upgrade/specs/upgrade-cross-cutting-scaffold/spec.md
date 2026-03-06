## ADDED Requirements

### Requirement: CLI provides upgrade:scaffold-cross-cutting helper command
The CLI SHALL expose an `upgrade:scaffold-cross-cutting` command that checks for and creates any missing cross-cutting files in `deepfield/drafts/cross-cutting/` using the plugin templates as a source.

The command SHALL:
- Accept a `--deepfield-dir <path>` option (defaults to `./deepfield`)
- Accept a `--templates-dir <path>` option pointing to the plugin templates directory
- Check for existence of `terminology.md` and `unknowns.md` in `deepfield/drafts/cross-cutting/`
- Create any missing files atomically (write to `.tmp` then rename) using the corresponding template
- Print a line per file: `Created: drafts/cross-cutting/<filename>` or `Already exists: drafts/cross-cutting/<filename>`
- Exit 0 on success

#### Scenario: Old workspace missing terminology.md
- **WHEN** `upgrade:scaffold-cross-cutting` is run on a workspace where `deepfield/drafts/cross-cutting/terminology.md` does not exist
- **THEN** the command creates `deepfield/drafts/cross-cutting/terminology.md` from the plugin template
- **THEN** the command prints `Created: drafts/cross-cutting/terminology.md`
- **THEN** exit code is 0

#### Scenario: Workspace already has all cross-cutting files
- **WHEN** `upgrade:scaffold-cross-cutting` is run on a workspace where both `terminology.md` and `unknowns.md` already exist
- **THEN** neither file is overwritten
- **THEN** the command prints `Already exists:` for each file
- **THEN** exit code is 0

#### Scenario: Missing unknowns.md is also scaffolded
- **WHEN** `upgrade:scaffold-cross-cutting` is run on a workspace where `deepfield/drafts/cross-cutting/unknowns.md` does not exist
- **THEN** the command creates `deepfield/drafts/cross-cutting/unknowns.md` from the plugin template
- **THEN** exit code is 0

#### Scenario: Parent directory does not exist
- **WHEN** `upgrade:scaffold-cross-cutting` is run and `deepfield/drafts/cross-cutting/` does not exist
- **THEN** the command creates the directory recursively before writing files
- **THEN** exit code is 0

### Requirement: Plugin /df-upgrade skill calls scaffold helper
The `/df-upgrade` plugin skill SHALL call `upgrade:scaffold-cross-cutting` as an upgrade step before performing AI-driven content migration.

#### Scenario: df-upgrade scaffolds missing cross-cutting files
- **WHEN** `/df-upgrade` is run on an old workspace lacking `terminology.md`
- **THEN** the skill invokes `upgrade:scaffold-cross-cutting` via the CLI
- **THEN** `terminology.md` is created before any AI-driven upgrade steps run
- **THEN** the user sees a message: "Scaffolded missing cross-cutting files"
