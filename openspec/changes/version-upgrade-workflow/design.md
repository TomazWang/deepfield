## Context

The Deepfield project ships three components that each declare a version:

| File | Field(s) |
|------|---------|
| `cli/package.json` | `version` |
| `plugin/package.json` | `version`, `peerDependencies.deepfield` |
| `plugin/.claude-plugin/plugin.json` | `version` |

Currently these are kept in sync by convention only. There is no automated enforcement and no single authoritative tool for bumping versions. As the project moves toward wider distribution, silent drift between these files becomes a real risk.

This design covers: a bump script, a CI version-consistency check, a `deepfield version` CLI command, and accompanying documentation. All three components currently sit at `0.2.0`.

## Goals / Non-Goals

**Goals:**
- Single command (`bump-version.sh`) to atomically update all three locations and rebuild CLI
- CI gate that fails immediately when versions are out of sync
- `deepfield version` command for developers and users to inspect sync status at runtime
- Clear written policy (`docs/VERSIONING.md`) documenting when to bump major/minor/patch

**Non-Goals:**
- Plugin refusing to load on version mismatch (deferred)
- Workspace-level validation of CLI/plugin version compatibility (deferred)
- Marketplace auto-update integration (deferred)
- Migration guide templates (deferred)

## Decisions

### D1: `jq` for JSON edits in shell script

**Decision**: Use `jq` for all JSON mutations in `bump-version.sh`.

**Rationale**: `jq` is the standard POSIX-friendly JSON processor available in all CI environments. Alternatives like `sed`/`awk` are brittle on nested JSON and non-portable. A Node.js script would work but adds startup overhead and a runtime dependency for what should be a simple shell operation.

**Atomic write pattern**: Write to `<file>.tmp`, validate with `jq empty`, then `mv` to replace original. This prevents a half-written file if the script is interrupted.

### D2: GitHub Actions workflow for CI check

**Decision**: Add `.github/workflows/version-check.yml` that runs `scripts/check-versions.sh` on every push and PR.

**Rationale**: A standalone shell script (`check-versions.sh`) keeps the logic testable locally. The workflow simply calls the script. This is simpler than embedding the logic in YAML and allows developers to run the check before pushing.

**Alternative considered**: A pre-commit hook — rejected because it only runs locally and cannot catch direct pushes or manual edits via the GitHub UI.

### D3: `deepfield version` as a CLI command (not a flag)

**Decision**: Implement `deepfield version` as a proper sub-command using the existing `createXCommand()` factory, not as a `--version` flag on the root command.

**Rationale**: Commander.js already handles `--version` as a root flag (prints single version string). A dedicated sub-command can print structured, multi-component output including sync status. This is consistent with how other tools (e.g., `docker version`, `helm version`) expose multi-component version information.

**Implementation**: New file `cli/src/commands/version.ts`, registered in `cli/src/index.ts`. Reads all three version files at runtime, compares them, and prints a formatted table with sync status indicator.

### D4: `peerDependencies.deepfield` mirrors plugin version

**Decision**: `plugin/package.json` field `peerDependencies.deepfield` SHALL always equal the plugin's own `version`.

**Rationale**: The peer dependency expresses the minimum CLI version the plugin requires. Since they are developed in lockstep in this monorepo, keeping them equal is the simplest correct policy. Divergence logic (e.g., plugin 0.3.0 requires CLI >= 0.2.0) is deferred to a future change.

## Risks / Trade-offs

- **`jq` availability**: `jq` must be present in CI and developer environments. Mitigation: document requirement in VERSIONING.md; all major CI platforms include `jq` by default.
- **Script-only enforcement**: `bump-version.sh` can be bypassed by editing files directly. The CI check (`check-versions.sh`) catches this on the next push.
- **No workspace validation at runtime**: A workspace created with CLI 0.2.0 and upgraded to CLI 0.3.0 will not be warned about compatibility. This is an accepted limitation per non-goals.

## Migration Plan

No migration needed — all three files are already at `0.2.0`. The new artifacts are purely additive. After merging:
1. Run `scripts/check-versions.sh` to confirm current sync (should pass immediately).
2. Use `scripts/bump-version.sh <patch|minor|major>` for all future version bumps.
