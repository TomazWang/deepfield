## Context

The `deepfield/source/baseline/repos/` directory is populated by `deepfield input` when users add git repositories as sources. These repos can be hundreds of megabytes each. Currently `createBackup()` in `cli/src/utils/backup.ts` performs a full recursive copy of `deepfield/`, including all repo contents. This makes backups enormous and impractical.

There is no mechanism to record which repos were added or to recreate them on a fresh clone of a team's deepfield workspace. The fix is to:

1. Track repos declaratively in a config file (`repos.config.json`)
2. Exclude the repo directory contents from backups and git
3. Provide a CLI command to restore repos from the config

Constraints from project architecture:
- CLI commands use TypeScript, Commander.js, `createXCommand()` factory pattern
- Atomic writes: write to `.tmp` then `fs.renameSync`
- This is CLI-only (deterministic, no AI, works headlessly)
- Plugin scripts use CJS — not applicable here (this is CLI code)

## Goals / Non-Goals

**Goals:**
- Reduce backup size by excluding `source/baseline/repos/` directory contents
- Preserve repos.config.json in backups and git so repos can be restored
- Add `deepfield clone-repos` command that reads config and clones/updates repos
- Auto-detect any existing repos in `source/baseline/repos/` when the config is missing (migration path)
- Add `source/baseline/repos/` to `.gitignore` template so newly initialized workspaces exclude it from git tracking

**Non-Goals:**
- Authentication / credential management for private repos (user must have git credentials configured)
- Support for non-git VCS (SVN, Mercurial, etc.)
- Incremental updates to repos that already exist (simple: skip if present, or re-clone if forced)
- UI/prompt-based repo addition (that remains in `deepfield input`)

## Decisions

### Decision 1: `repos.config.json` location — `deepfield/source/baseline/repos.config.json`

**Rationale**: Co-located with the repos directory it describes. Backup always includes `deepfield/source/`, so the config is naturally included without special-casing.

Alternative: a top-level `deepfield/repos.config.json`. Rejected because it separates the config from the data it describes and requires additional include logic in backup.

### Decision 2: Backup exclusion via filter function, not a separate copy pass

**Rationale**: `fs-extra`'s `copy()` accepts a `filter` callback. Adding a filter that skips `deepfield/source/baseline/repos/**` (but not `repos.config.json` itself) is minimal and contained to `createBackup()`.

Alternative: copy everything then delete the repos dir in the backup. Rejected because it copies large data unnecessarily before deleting it.

### Decision 3: `deepfield clone-repos` command name (not `sync-sources`)

**Rationale**: The command has a single, narrow purpose: clone git repos. `clone-repos` names exactly what it does. `sync-sources` implies broader source management that isn't in scope.

### Decision 4: Auto-detect existing repos at clone-repos invocation time

**Rationale**: If `repos.config.json` does not exist but repos are present in `source/baseline/repos/`, the command auto-generates the config by walking the directory and running `git remote get-url origin` + `git rev-parse HEAD` per repo. This provides a migration path without a separate migration command.

### Decision 5: Clone behavior — skip if directory exists, `--force` to re-clone

**Rationale**: Re-cloning by default would destroy local uncommitted changes in sources. Skipping existing dirs is safe. A `--force` flag allows intentional reset.

## Risks / Trade-offs

- **Large initial clone time** → Mitigation: Command logs progress per repo so user can see it working. No timeout enforced.
- **Missing remotes** → Mitigation: If `git remote get-url origin` fails during auto-detect, the repo is skipped with a warning and the user is told to add it manually.
- **Shallow clone depth mismatch** → Mitigation: Config stores `depth` field. If 0/null, full clone is performed. User can override via `--depth` flag.
- **`repos.config.json` drift** → The config is only written by `deepfield input` (add) and `clone-repos --detect`. No automatic sync on every git operation. Manual edits are allowed.

## Migration Plan

1. Deploy updated backup.ts — existing backups are unaffected; new backups simply exclude repo contents.
2. Update `.gitignore` template in `cli/templates/` — applied on `deepfield init`.
3. Existing workspaces that already have `source/baseline/repos/` tracked by git must run `git rm -r --cached deepfield/source/baseline/repos/` to untrack the repos without deleting local files.
4. Existing workspaces: user runs `deepfield clone-repos --detect` once to generate `repos.config.json` from their existing repos directory.
5. No rollback needed — backup exclusion is additive, config file is optional.

## Open Questions

- Should `deepfield input` (when adding a git repo) automatically write to `repos.config.json`? This is out of scope for this change but is the natural next step. For now, `clone-repos --detect` is the only writer.
- Should `clone-repos` support SSH key path overrides? Deferred — users configure SSH outside of deepfield.
