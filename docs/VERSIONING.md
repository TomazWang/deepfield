# Deepfield Versioning

## The Three-File Sync Rule

Deepfield ships two components — the CLI and the plugin — that must always carry the same version number. Three files are the source of truth:

| File | Field(s) | Description |
|------|----------|-------------|
| `cli/package.json` | `version` | CLI package version |
| `plugin/package.json` | `version` | Plugin package version |
| `plugin/package.json` | `peerDependencies.deepfield` | Minimum CLI version the plugin requires |
| `plugin/.claude-plugin/plugin.json` | `version` | Plugin metadata version |

**All four values must be identical at all times.** A CI check (`scripts/check-versions.sh`) enforces this on every push and pull request.

> **peerDependencies policy**: `peerDependencies.deepfield` is always set to `^<version>` where `<version>` matches the plugin's own version. Because the CLI and plugin are developed in lockstep in this monorepo, keeping them equal is the simplest correct policy.

---

## Bump Decision Tree

Use semantic versioning. When in doubt, use `patch`.

```
Is this a breaking change to the CLI command interface or plugin API?
  YES → major  (e.g., 0.2.0 → 1.0.0)

Is this a new feature or backward-compatible capability added?
  YES → minor  (e.g., 0.2.0 → 0.3.0)

Is this a bug fix, internal refactor, docs update, or dependency bump?
  YES → patch  (e.g., 0.2.0 → 0.2.1)
```

### Examples

| Change | Bump |
|--------|------|
| Remove a CLI command or flag | major |
| Change a command's argument signature incompatibly | major |
| Add a new `deepfield <command>` | minor |
| Add a new plugin skill or agent | minor |
| Fix a bug in `df-init` scaffolding | patch |
| Update `peerDependencies` ranges | patch |
| Bump `chalk` or other dependency | patch |
| Add a doc or CI workflow | patch |

---

## How to Bump the Version

Always use the provided script — never edit version files manually.

```bash
# From the repository root:
./scripts/bump-version.sh patch    # 0.2.0 → 0.2.1
./scripts/bump-version.sh minor    # 0.2.0 → 0.3.0
./scripts/bump-version.sh major    # 0.2.0 → 1.0.0
```

The script:
1. Reads the current version from `cli/package.json`
2. Computes the new version
3. Atomically updates all three files (write to `.tmp`, validate, `mv`)
4. Rebuilds the CLI (`cd cli && npm run build`)
5. Prints a summary and suggested next git steps

### Requirements

- `jq` must be installed (`brew install jq` / `apt-get install jq`)
- `node` must be in `PATH`

---

## CI Version Check

A GitHub Actions workflow (`.github/workflows/version-check.yml`) runs `scripts/check-versions.sh` on:

- Every push to any branch
- Every pull request targeting `main`

The workflow fails if any of the four version values differ. PRs cannot be merged while the check is failing.

You can run the check locally at any time:

```bash
./scripts/check-versions.sh
```

---

## Checking Version Sync at Runtime

The `deepfield version` CLI command inspects all three files and reports sync status:

```bash
deepfield version          # human-readable table
deepfield version --json   # machine-readable JSON
```

Exit code is `0` when all versions are in sync, `1` when they are out of sync or any file is missing.

---

## Workspace Compatibility

Version compatibility between a user's existing deepfield workspace and the installed CLI is managed separately by the workspace upgrade system (`deepfield upgrade` / `/df-upgrade`). This versioning document covers only the internal version fields within the Deepfield repository itself.
