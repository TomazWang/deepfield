# Contributing to Deepfield

## Development Setup

```bash
git clone https://github.com/TomazWang/deepfield.git
cd deepfield
npm install
npm run build
```

## Project Structure

```
deepfield/
├── cli/        # Standalone CLI tool (TypeScript + Commander.js)
├── plugin/     # Claude Code plugin (commands, skills, agents)
└── scripts/    # Shared utility scripts
```

See `CLAUDE.md` for the full architecture guide and Plugin vs CLI decision rules.

## Branching

`main` is trunk and always the latest release. All changes go through PRs.

| Branch | Purpose |
|--------|---------|
| `main` | Default branch — always stable, always versioned, what marketplace users get |
| `feat/*` | Feature work — PR into `main`, version stays `0.0.0-dev` |
| `fix/*` | Bug fixes — PR into `main`, version stays `0.0.0-dev` |
| `docs/*` | Documentation — PR into `main` |
| `bump/X.Y.Z` | Release PR — bumps version files, merges into `main` to trigger a release |

**Never push directly to `main`.** Always use PRs.

## Making Changes

```bash
git checkout main && git pull
git checkout -b feat/my-feature
# make changes
git push origin feat/my-feature
gh pr create --base main
```

CI runs `version-check.yml` on the PR — verifies all 4 version files are in sync.

## Cutting a Release

A release is just a PR that bumps the version files.

```bash
git checkout main && git pull
git checkout -b bump/0.8.0

# Bump all 4 version files manually or via script:
./scripts/bump-version.sh 0.8.0

# Open PR
gh pr create --base main --title "chore: release v0.8.0"
```

Merge the PR. CI on `main` push:
1. Reads version from `plugin/.claude-plugin/plugin.json`
2. If version ≠ `0.0.0-dev` and tag doesn't exist yet → creates `v0.8.0` tag + moves `latest` tag
3. Users get the update on their next `/plugin marketplace update`

### Version files

All 4 must always be in sync. On feature branches they stay `0.0.0-dev`. On a `bump/` PR they're set to the real version.

| File | Field |
|------|-------|
| `package.json` | `version` |
| `cli/package.json` | `version` |
| `plugin/package.json` | `version` + `peerDependencies.deepfield` |
| `plugin/.claude-plugin/plugin.json` | `version` |

## CI Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `release.yml` | Push to `main` | If version ≠ `0.0.0-dev`, creates `vX.Y.Z` tag + moves `latest` |
| `version-check.yml` | Feature branches + PRs to `main` | Verifies all 4 version files are in sync |

## Marketplace

`marketplace.json` uses `"source": "./plugin"`. Claude Code reads the plugin directly from `main` (the default branch). Since `main` is always the latest release, users always get stable plugin files.
