## Why

The `source/baseline/repos/` directory can contain large git repositories that bloat backups and pollute the project's git history. There is no lightweight way to record which repos were added or to restore them on a new machine — the only option today is to include the full repo contents, which makes backups impractical for teams.

## What Changes

- Add `source/baseline/repos/` to `.gitignore` so git never tracks repo contents
- Introduce `source/baseline/repos.config.json` to record repo metadata (name, url, branch, commit, path, cloneMethod, depth)
- Auto-detect existing git repos in `source/baseline/repos/` and populate the config on first use
- Add a `deepfield clone-repos` CLI command that reads `repos.config.json` and clones/updates all repos
- Update `cli/src/utils/backup.ts` to exclude `source/baseline/repos/` contents but always include `repos.config.json`

## Capabilities

### New Capabilities

- `repo-mapping-config`: Manage `repos.config.json` — schema, auto-detection of existing repos, read/write helpers
- `clone-repos-command`: `deepfield clone-repos` CLI command that restores repos from `repos.config.json`

### Modified Capabilities

- `cli-commands`: New `clone-repos` sub-command added to the CLI command registry
- `file-operations`: Backup utility updated to skip repo directory contents while preserving the config file

## Impact

- `cli/src/utils/backup.ts` — exclusion logic for `source/baseline/repos/`
- `cli/src/commands/` — new `clone-repos.ts` command file
- `cli/src/index.ts` (or equivalent entry point) — command registration
- `.gitignore` at project root and/or plugin template — exclude `source/baseline/repos/`
- New file: `source/baseline/repos.config.json` (schema + auto-generated on first use)
- No breaking changes to existing commands or APIs
