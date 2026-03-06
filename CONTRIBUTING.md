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

- `main` — always deployable, version is permanently `0.0.0-dev`
- `feat/*` — feature branches, PR into main
- `fix/*` — bug fix branches, PR into main
- `release/X.Y.Z` — release branches, created from main to trigger a release

Never push version bumps to main. Never push directly to main.

## Making Changes

1. Branch off main: `git checkout -b feat/my-feature`
2. Make changes, commit
3. Push and open a PR into main
4. CI runs version-check on the branch and on the PR

## Cutting a Release

Releases are fully automated via CI. You only need to push a release branch:

```bash
git checkout main && git pull
git checkout -b release/0.6.0
git push origin release/0.6.0
```

CI will automatically:
1. Extract the version from the branch name (`0.6.0`)
2. Set all 4 version files to that version
3. Rebuild the CLI
4. Verify versions are in sync (`scripts/check-versions.sh`)
5. Commit and push the release branch
6. Create and push the `v0.6.0` tag
7. Move the `latest` tag to this commit

The `latest` tag is what the marketplace uses — users get the update on their next `/plugin marketplace update`.

### Version files

There are 4 version files that must always stay in sync:

| File | Field |
|------|-------|
| `package.json` | `version` |
| `cli/package.json` | `version` |
| `plugin/package.json` | `version` + `peerDependencies.deepfield` |
| `plugin/.claude-plugin/plugin.json` | `version` |

On `main` these are all `0.0.0-dev`. CI sets them to the real version on the release branch.

## CI Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `release.yml` | Push to `release/**` | Sets versions, builds, tags release |
| `version-check.yml` | Push to feature branches + PRs to main | Verifies all 4 version files match |

## Marketplace

`marketplace.json` lives on `main` and never changes. It points to `ref: "latest"`, which always resolves to the most recent release tag.

Users install once; updates flow automatically when they run `/plugin marketplace update`.
