## Context

Deepfield projects are initialized by `deepfield init` which creates `deepfield/project.config.json` with basic metadata. Currently there is no version field, so when the CLI/plugin evolves and changes the expected folder structure, existing projects silently break.

The CLI is TypeScript (Commander.js) under `cli/src/`. Plugin scripts are CJS shell/Node.js under `plugin/scripts/`. Migrations will live in a new `cli/migrations/` directory as CJS `.js` files so they can be `require()`d without a TypeScript build step.

`semver` is the standard package for version comparison; it should be added to `cli/package.json` if not already present.

## Goals / Non-Goals

**Goals:**
- Track `deepfieldVersion` in every project's `project.config.json`
- Detect version mismatch on every CLI command execution
- Provide `deepfield upgrade` to apply all pending migrations with a backup
- Provide `deepfield rollback` to restore from a prior backup
- Support multi-step migration chains (e.g., v1.0 → v2.5 through intermediate steps)
- Roll back all applied migrations in a batch when any single migration fails
- Implement all concrete migrations from v1.0.0 to v2.5.0

**Non-Goals:**
- Plugin-side version checking (CLI is the upgrade entry point)
- Automatic silent upgrades (always require user confirmation unless `--force`)
- Selective/partial migrations (users take the full chain)
- Network checks for newer versions (purely local)

## Decisions

### Decision: CJS for migration scripts

Migrations live in `cli/migrations/*.js` as CJS modules (`module.exports = { from, to, migrate, rollback }`). Alternatives: TypeScript (requires build, complicates distribution), ESM (incompatible with current CJS CLI internals). CJS is simplest and aligns with existing plugin scripts.

### Decision: Backup = full copy of `deepfield/` directory

Before any upgrade, the entire `deepfield/` folder is copied to `.deepfield-backups/backup-<ISO-timestamp>/`. This is simple, transparent, and filesystem-level. Alternative: git stash / git commit — rejected because the project root may not be a git repo, and we don't want to pollute the user's git history.

### Decision: Version stored only in `project.config.json`

A single source of truth. Alternatives: separate `.deepfield-version` file (adds clutter), `DEEPFIELD.md` header (not machine-readable). `project.config.json` already exists and is the canonical project state file.

### Decision: Missing `deepfieldVersion` treated as `0.0.0`

Projects created before this feature have no version field. Treating them as `0.0.0` ensures the full migration chain runs. Alternative: treat as current version (skip migrations) — risky, may silently miss required files.

### Decision: Migration orchestrator in `cli/migrations/index.js` (CJS)

The orchestrator is a plain CJS module imported by CLI commands. This keeps the migration logic independent of Commander.js so it can be tested standalone. CLI commands (`upgrade.ts`, `rollback.ts`) are thin wrappers that call into the orchestrator and handle I/O.

### Decision: Rollback is manual only (not automatic on mismatch)

On version mismatch the CLI warns and prompts to upgrade. It does NOT auto-rollback to a prior version. Rollback is an explicit user command. Auto-rollback would require knowing which backup corresponds to the prior version, which is ambiguous.

## Risks / Trade-offs

- **Large `deepfield/` directories slow backup** → Mitigation: warn user if folder is large; `--skip-backup` escape hatch.
- **Migration bugs can corrupt projects** → Mitigation: atomic writes (temp → rename); backup always taken before migration chain starts; rollback on partial failure.
- **`0.0.0` assumption wrong for some edge cases** → Mitigation: user can pass `--from <version>` override (future enhancement; for now document the assumption).
- **Disk space from many backups** → Mitigation: `deepfield rollback --list` shows sizes; user responsible for cleanup (future: `--prune` flag).

## Migration Plan

1. `deepfield init` writes `deepfieldVersion: <current>` into `project.config.json` (update `plugin/scripts/init-project.sh` or equivalent).
2. Every CLI command calls `checkProjectVersion()` before executing. On mismatch, prints warning and prompts.
3. `deepfield upgrade` runs the full migration chain with backup.
4. `deepfield rollback` lists backups and restores chosen one.
5. Ship concrete migration scripts for all steps v1.0 → v2.5.

## Open Questions

- Should `deepfield init` on an already-initialized project (re-init) be allowed to reset the version? (Defer — current behavior is to error on already-initialized projects.)
- Should `deepfield upgrade --to <version>` support downgrade (running rollback scripts)? (Out of scope for now; rollback command handles this via backups.)
