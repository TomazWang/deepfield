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

```
feat/* / fix/*  →  PR  →  dev   (daily work)
dev             →  release/X.Y.Z  →  CI  →  main
main            =  latest stable release
```

| Branch | Purpose |
|--------|---------|
| `dev` | Development trunk — **default branch**, all PRs target here |
| `main` | Latest release — never push directly, CI-only merges |
| `feat/*` | Feature branches, PR into `dev` |
| `fix/*` | Bug fix branches, PR into `dev` |
| `release/X.Y.Z` | Short-lived CI branch to trigger a release |

**Never push directly to `main` or `dev`.** Always use PRs.

## Making Changes

1. Branch off `dev`: `git checkout -b feat/my-feature`
2. Make changes, commit
3. Push and open a PR targeting `dev`
4. CI runs version-check on the branch and on the PR

## Cutting a Release

Releases are fully automated via CI. Branch off `dev` and push:

```bash
git checkout dev && git pull
git checkout -b release/0.8.0
git push origin release/0.8.0
```

CI will automatically:
1. Extract the version from the branch name (`0.8.0`)
2. Set all 4 version files to that version
3. Rebuild the CLI
4. Verify versions are in sync (`scripts/check-versions.sh`)
5. Commit and push the release branch
6. Create and push the `v0.8.0` tag
7. Move the `latest` tag to this commit
8. Merge the release branch into `main`

After CI completes, `main` = latest release. Users get the update on their next `/plugin marketplace update`.

### Version files

There are 4 version files that must always stay in sync on a release:

| File | Field |
|------|-------|
| `package.json` | `version` |
| `cli/package.json` | `version` |
| `plugin/package.json` | `version` + `peerDependencies.deepfield` |
| `plugin/.claude-plugin/plugin.json` | `version` |

On `dev` these are all `0.0.0-dev`. CI sets them to the real version on the release branch.

## CI Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `release.yml` | Push to `release/**` | Sets versions, builds, tags release, merges to `main` |
| `version-check.yml` | Push to feature branches + PRs to `dev` | Verifies all 4 version files match |

## Marketplace

`marketplace.json` uses `"source": "./plugin"` — Claude Code reads the plugin from the `plugin/` subdirectory of the cloned marketplace repo. Since `main` always reflects the latest release, users always get stable plugin files.
