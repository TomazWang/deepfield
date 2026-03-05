## 1. Update CLI Upgrade Helpers

- [x] 1.1 Modify `getProjectVersion()` in `cli/src/commands/upgrade-helpers.ts` to add version normalization
- [x] 1.2 Add check for `rawVersion === "1.0.0"` and return `"0.1.0"` for that case
- [x] 1.3 Add comment explaining legacy version mapping (version numbering scheme change)
- [x] 1.4 Ensure all other versions are returned unchanged

## 2. Update CLI Upgrade Command

- [x] 2.1 Modify `getProjectVersion()` in `cli/src/commands/upgrade.ts` with identical normalization logic
- [x] 2.2 Add check for `rawVersion === "1.0.0"` and return `"0.1.0"` for that case
- [x] 2.3 Add comment matching `upgrade-helpers.ts` implementation
- [x] 2.4 Verify both functions have identical behavior

## 3. Update Plugin Upgrade Skill Documentation

- [x] 3.1 Open `plugin/skills/deepfield-upgrade.md` and locate Step 1 (Parse input)
- [x] 3.2 Add note explaining version normalization mapping (1.0.0 → 0.1.0)
- [x] 3.3 Clarify that `from: "0.1.0"` may indicate actual workspace version 1.0.0
- [x] 3.4 Document that this is due to version numbering scheme change during development

## 4. Build and Verify

- [x] 4.1 Run `npm run build` in `cli/` directory to compile TypeScript changes
- [x] 4.2 Verify build succeeds without errors
- [x] 4.3 Check that dist/cli.js is updated

## 5. Testing

- [x] 5.1 Create test workspace with `deepfieldVersion: "1.0.0"` in `project.config.json`
- [x] 5.2 Run `deepfield upgrade:detect-version` and verify output shows `projectVersion: "0.1.0"`
- [x] 5.3 Verify upgrade detection correctly identifies upgrade needed (0.1.0 < 0.2.0)
- [x] 5.4 Test with version 0.2.0 workspace and verify it returns "0.2.0" unchanged
- [x] 5.5 Test with version 0.0.0 workspace and verify it returns "0.0.0" unchanged
