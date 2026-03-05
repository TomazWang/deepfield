## Context

During development, the version numbering scheme changed from 1.0.0 to 0.2.0. This creates a problem: workspaces created before the change have `deepfieldVersion: "1.0.0"` in their `project.config.json`, but the current CLI is at version 0.2.0. Standard semver comparison treats 1.0.0 as newer than 0.2.0, causing upgrade detection to fail.

**Current State:**
- `cli/src/commands/upgrade.ts` has `getProjectVersion()` that reads version from `project.config.json`
- `cli/src/commands/upgrade-helpers.ts` has duplicate `getProjectVersion()` implementation
- `plugin/skills/deepfield-upgrade.md` documents the upgrade flow for AI
- No version normalization exists

**Constraints:**
- Cannot change existing workspace files (breaking change for users)
- Must maintain backward compatibility
- Both CLI files need consistent behavior

## Goals / Non-Goals

**Goals:**
- Map legacy version 1.0.0 to 0.1.0 internally so upgrade detection works
- Apply mapping consistently in both `upgrade.ts` and `upgrade-helpers.ts`
- Document the mapping in the upgrade skill for AI awareness
- Preserve existing behavior for all other versions (0.0.0, 0.2.0, future versions)

**Non-Goals:**
- Rewriting existing workspace `project.config.json` files
- Handling other legacy version numbers (only 1.0.0 needs mapping)
- Adding complex version migration framework (keep it simple)
- Changing the actual CLI version numbering going forward

## Decisions

### Decision 1: Map 1.0.0 → 0.1.0 at read time

**Rationale:** The simplest approach is to normalize the version when reading from `project.config.json`, rather than:
- Writing back normalized values (breaking, could corrupt workspace)
- Complex version comparison logic (harder to maintain)
- External mapping config files (over-engineering)

**Alternatives considered:**
- Store mapping in separate config → Rejected: adds complexity
- Use version ranges (1.x.x → 0.1.0) → Rejected: only one legacy version exists
- Semantic versioning library with custom rules → Rejected: overkill for single edge case

### Decision 2: Implement in both getProjectVersion() functions identically

**Rationale:** Both `upgrade.ts` and `upgrade-helpers.ts` have independent `getProjectVersion()` implementations. They must behave identically to avoid inconsistencies.

**Alternatives considered:**
- Extract to shared utility → Rejected: files are already separate, avoid refactoring in this change
- Only fix one file → Rejected: creates inconsistent behavior

### Decision 3: Document in upgrade skill with explanatory note

**Rationale:** When the AI-driven upgrade skill receives `from: "0.1.0"`, it needs to understand this represents a workspace with actual version 1.0.0. Add a note in the skill's Step 1 explaining the mapping.

## Implementation Approach

1. **Update `cli/src/commands/upgrade-helpers.ts`:**
   - Modify `getProjectVersion()` to check if `rawVersion === "1.0.0"`
   - Return `"0.1.0"` for the special case, otherwise return raw version unchanged
   - Add comment explaining the legacy version mapping

2. **Update `cli/src/commands/upgrade.ts`:**
   - Apply identical logic to its `getProjectVersion()` function
   - Ensure comments and implementation match `upgrade-helpers.ts`

3. **Update `plugin/skills/deepfield-upgrade.md`:**
   - Add note in Step 1 (Parse input) section
   - Explain that `from: "0.1.0"` may indicate actual workspace version 1.0.0
   - Clarify this is due to version numbering change during development

## Risks / Trade-offs

**Risk:** Future versions could conflict with 0.1.0
→ **Mitigation:** Document that 0.1.0 is reserved for legacy 1.0.0 mapping. Unlikely to ever release actual 0.1.0.

**Risk:** Inconsistency if one function is updated but not the other
→ **Mitigation:** Rebuild CLI after changes to catch TypeScript errors. Both functions are in same module tree.

**Trade-off:** Hardcoded special case vs. flexible framework
→ **Accepted:** Only one legacy version exists. No need for general solution. Keep it simple.

**Trade-off:** Normalizes at read time, not write time
→ **Accepted:** Preserves workspace files unchanged. Mapping is transparent to users.

## Migration Plan

1. **Development:**
   - Implement changes in both TypeScript files
   - Update upgrade skill markdown
   - Rebuild CLI (`npm run build`)

2. **Testing:**
   - Create test workspace with `deepfieldVersion: "1.0.0"`
   - Run `deepfield upgrade:detect-version`
   - Verify output shows `projectVersion: "0.1.0"` not `"1.0.0"`
   - Run `deepfield upgrade` and verify upgrade flow triggers

3. **Deployment:**
   - Merge to main
   - Publish new CLI version (already at 0.2.0)
   - No user action required - upgrade detection auto-fixes

4. **Rollback:**
   - If issues occur, revert the three file changes
   - Rebuild CLI
   - Users with 1.0.0 workspaces will see "already up to date" (incorrect but safe)

## Open Questions

None - straightforward implementation with clear requirements.
