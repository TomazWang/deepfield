## 1. CI Version Check Script

- [ ] 1.1 Create `scripts/check-versions.sh` — reads version from all three files using `jq`, compares them, exits non-zero with a descriptive error if any differ (including `peerDependencies.deepfield`)
- [ ] 1.2 Make `scripts/check-versions.sh` executable (`chmod +x`)
- [ ] 1.3 Create `.github/workflows/version-check.yml` — triggers on `push` (all branches) and `pull_request` (targeting `main`), runs `scripts/check-versions.sh`

## 2. Version Bump Script

- [ ] 2.1 Create `scripts/bump-version.sh` — accepts `patch|minor|major` argument, validates `jq` is available, computes new version from `cli/package.json`
- [ ] 2.2 Implement atomic JSON update for `cli/package.json` → `version` (write to `.tmp`, validate, `mv`)
- [ ] 2.3 Implement atomic JSON update for `plugin/package.json` → `version` AND `peerDependencies.deepfield`
- [ ] 2.4 Implement atomic JSON update for `plugin/.claude-plugin/plugin.json` → `version`
- [ ] 2.5 Add CLI rebuild step (`npm run build` inside `cli/`) after all files are updated
- [ ] 2.6 Add usage/error messages for missing or invalid arguments
- [ ] 2.7 Make `scripts/bump-version.sh` executable (`chmod +x`)

## 3. deepfield version CLI Command

- [ ] 3.1 Create `cli/src/commands/version.ts` using the `createXCommand()` factory pattern — reads all three version files, compares versions, prints formatted output with sync status
- [ ] 3.2 Handle missing version files gracefully (show `(not found)` and mark as out of sync)
- [ ] 3.3 Exit with non-zero code when versions are out of sync or a file is missing
- [ ] 3.4 Register the `version` command in `cli/src/index.ts`
- [ ] 3.5 Build the CLI and verify `deepfield version --help` and `deepfield --help` both show the command

## 4. Documentation

- [ ] 4.1 Create `docs/VERSIONING.md` — covering: the three-file sync rule, bump decision tree (major/minor/patch), how to use `bump-version.sh`, the `peerDependencies.deepfield` policy, and the CI check

## 5. Verification

- [ ] 5.1 Run `scripts/check-versions.sh` — verify it passes with current `0.2.0` state
- [ ] 5.2 Run `scripts/bump-version.sh patch` in a test branch — verify all three files update to `0.2.1` and CLI rebuilds
- [ ] 5.3 Manually desync one file and confirm `scripts/check-versions.sh` exits non-zero with a clear error
- [ ] 5.4 Run `deepfield version` — verify formatted output and sync status are correct
