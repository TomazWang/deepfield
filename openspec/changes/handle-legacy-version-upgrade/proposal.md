## Why

The version numbering scheme changed during development from 1.0.0 to 0.2.0. Workspaces created with the old numbering (version 1.0.0) are actually older than the current CLI version (0.2.0), but standard semver comparison treats them as newer (1.0.0 > 0.2.0), preventing the upgrade detection from working correctly.

## What Changes

- Add version normalization logic to map legacy version 1.0.0 to 0.1.0 internally
- Update `getProjectVersion()` functions in both `upgrade.ts` and `upgrade-helpers.ts`
- Document the version mapping in the upgrade skill for AI awareness
- Ensure upgrade detection correctly identifies 1.0.0 workspaces as needing upgrade to 0.2.0

## Capabilities

### New Capabilities
- `version-normalization`: Version mapping logic that treats legacy version 1.0.0 as 0.1.0 to handle version numbering scheme changes

### Modified Capabilities

None - this is a new capability added to existing upgrade detection system.

## Impact

**Affected Files**:
- `cli/src/commands/upgrade.ts` - getProjectVersion() function
- `cli/src/commands/upgrade-helpers.ts` - getProjectVersion() function
- `plugin/skills/deepfield-upgrade.md` - documentation for AI skill

**User Impact**:
- Users with 1.0.0 workspaces will now correctly see upgrade prompts
- No breaking changes - purely fixes broken upgrade detection

**Testing**:
- Need to verify 1.0.0 → 0.2.0 upgrade path works
- Verify version comparison logic handles edge case
