## Why

Three components — CLI, plugin, and plugin manifest — each carry a version field, but there is no enforced contract keeping them in sync. A mismatch silently goes undetected until a user encounters a runtime incompatibility. Formalizing the upgrade workflow now prevents drift as the project grows and establishes a clear pattern before any public release.

## What Changes

- Add `scripts/bump-version.sh` — atomically updates all three version locations and rebuilds the CLI
- Add `docs/VERSIONING.md` — documents the sync rule, bump decision tree, workspace compatibility model, and usage instructions
- Add `.github/workflows/version-check.yml` (or equivalent CI script) — fails the build if the three version files do not all agree
- Add `deepfield version` CLI command — prints CLI version, plugin version, and sync status

## Capabilities

### New Capabilities

- `version-bump-script`: Shell script that atomically updates `cli/package.json`, `plugin/package.json` (version + peerDependencies.deepfield), and `plugin/.claude-plugin/plugin.json` in one operation, then rebuilds the CLI
- `version-check-ci`: CI guard (GitHub Actions step or standalone script) that reads the three version files and exits non-zero if any differ
- `version-cli-command`: `deepfield version` CLI command that reports CLI version, plugin version, and whether they are in sync

### Modified Capabilities

- `cli-commands`: Adding a new `version` sub-command to the CLI command surface

## Impact

- `scripts/` (repo root) — new `bump-version.sh`
- `docs/` — new `VERSIONING.md`
- `.github/workflows/` — new workflow file (or `scripts/check-versions.sh` used by CI)
- `cli/src/commands/` — new `version.ts` command file
- `cli/src/index.ts` — registers the new command
- No breaking changes; purely additive
