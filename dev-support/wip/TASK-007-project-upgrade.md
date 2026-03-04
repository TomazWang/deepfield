# Task 007: Project Upgrade Path (FUTURE)

**Feature:** Version-aware project migration
**Priority:** 🟢 Low (Future)
**Status:** DEFERRED
**Estimated Time:** 1-2 days (when needed)
**OpenSpec Change:** `feat/project-upgrade` (future)

---

## Objective

Add automatic upgrade path for deepfield projects when CLI/plugin versions change.

---

## Problem

**Current:** No version tracking in projects
**Issue:** When schemas/structure change, old projects break
**Desired:** Detect version mismatch and auto-upgrade

---

## Current Status

**DEFERRED** - Not needed until:
- Version 2.0 released
- Breaking changes introduced
- Schema migrations required

**Current version:** 1.0.0 (no migrations needed yet)

---

## When Needed

Triggers for implementing this:

1. **Schema changes**
   - `project.config.json` schema evolves
   - `run.config.json` structure changes
   - New required fields added

2. **Folder structure changes**
   - Directories renamed
   - New directories required
   - Files moved

3. **Breaking changes**
   - Command names change
   - Workflow changes
   - State machine changes

---

## Proposed Design

### 1. Version Tracking

**Add to project.config.json:**

```json
{
  "version": "1.0.0",
  "deepfieldVersion": "1.0.0",
  "createdAt": "...",
  "lastUpgraded": "...",
  "projectName": "...",
  ...
}
```

### 2. Version Detection

**On any command:**

```javascript
function checkProjectVersion() {
  const config = readProjectConfig();

  if (!config.deepfieldVersion) {
    // Old project (pre-versioning)
    return { needsUpgrade: true, from: '0.x', to: getCurrentVersion() };
  }

  const projectVersion = config.deepfieldVersion;
  const currentVersion = getCurrentVersion();

  if (semver.lt(projectVersion, currentVersion)) {
    return { needsUpgrade: true, from: projectVersion, to: currentVersion };
  }

  return { needsUpgrade: false };
}
```

### 3. Upgrade Command

**CLI command:**

```bash
deepfield upgrade [--dry-run] [--backup]

Upgrades deepfield project to latest version

Options:
  --dry-run    Show what would change without applying
  --backup     Create backup before upgrading (default: true)
  --force      Skip confirmation prompts
```

### 4. Migration Scripts

**Per-version migrations:**

```
cli/migrations/
  ├── 1.0-to-1.1.js     # Migrate 1.0 → 1.1
  ├── 1.1-to-2.0.js     # Migrate 1.1 → 2.0
  └── index.js          # Migration orchestrator
```

**Migration example:**

```javascript
// migrations/1.0-to-1.1.js
export default {
  from: '1.0.0',
  to: '1.1.0',
  description: 'Add feedback.md template to all runs',

  async migrate(projectPath) {
    // 1. Backup
    await backup(projectPath);

    // 2. Apply changes
    const runs = findRunDirectories(projectPath);

    for (const run of runs) {
      const feedbackPath = path.join(run, 'feedback.md');
      if (!fs.existsSync(feedbackPath)) {
        copyTemplate('feedback.md', feedbackPath);
      }
    }

    // 3. Update config
    updateProjectVersion(projectPath, '1.1.0');

    return { success: true };
  },

  async rollback(projectPath) {
    // Restore from backup
    await restoreBackup(projectPath);
  }
};
```

### 5. Automatic Upgrade Prompt

**On version mismatch:**

```
⚠️  Project version mismatch detected

Your project: v1.0.0
Current deepfield: v2.0.0

Your project needs to be upgraded to work with this version.

What would you like to do?
1. Upgrade now (recommended)
2. Show what will change (dry-run)
3. Continue anyway (may cause errors)
4. Exit

Choice:
```

---

## Implementation Phases

### Phase 1: Version Tracking (v1.1)

- Add `deepfieldVersion` to config
- Detect version mismatches
- Warn if versions don't match
- No automatic migration yet

### Phase 2: Manual Upgrade (v1.2)

- Add `deepfield upgrade` command
- Implement backup functionality
- Add first migration script (example)
- Require manual upgrade

### Phase 3: Auto-Prompt (v2.0)

- Auto-detect on any command
- Prompt for upgrade
- Run migrations automatically
- Backup before changes

---

## Migration Strategy

### Safe Migrations

**Always:**
- Create backup before migrating
- Validate project structure before/after
- Test migrations on sample projects
- Provide rollback capability
- Log all changes

**Never:**
- Delete user data without backup
- Migrate without user consent
- Skip validation
- Fail silently

### Backup Strategy

**Before migration:**

```javascript
function backupProject(projectPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    projectPath,
    `../.deepfield-backups/backup-${timestamp}`
  );

  fs.cpSync(projectPath, backupPath, { recursive: true });

  console.log(`✅ Backup created: ${backupPath}`);
  return backupPath;
}
```

**Retention:**
- Keep last 5 backups
- Auto-clean old backups (optional)
- User can disable auto-cleanup

---

## Acceptance Criteria

When implementing:

- [ ] Tracks project version in config
- [ ] Detects version mismatches
- [ ] `deepfield upgrade` command works
- [ ] Creates backup before migration
- [ ] Applies all needed migrations in order
- [ ] Updates project version after success
- [ ] Provides dry-run mode
- [ ] Can rollback on failure
- [ ] Clear error messages
- [ ] Logs migration steps
- [ ] Validates before/after migration

---

## Example Migrations

### Migration 1: Add deepfieldVersion

**0.x → 1.0:**
- Add `deepfieldVersion: "1.0.0"` to config
- Add `lastUpgraded` timestamp

### Migration 2: Restructure wip/

**1.0 → 1.1:**
- Move `wip/*.md` to `wip/global/*.md`
- Keep `wip/run-N/` unchanged

### Migration 3: Schema update

**1.1 → 2.0:**
- Add new fields to `project.config.json`
- Migrate old field names to new names
- Update templates

---

## Testing

**Test migrations:**

1. Create old project (v1.0)
2. Run `deepfield upgrade`
3. Verify structure updated
4. Verify config updated
5. Verify backup created
6. Test commands still work

**Test rollback:**

1. Simulate migration failure
2. Verify automatic rollback
3. Verify project restored
4. Verify no data loss

---

## Dependencies

- **Depends on:** None (standalone feature)
- **Needed when:** Breaking changes introduced

---

## Decision Point

**Implement when:**
- [ ] Version 2.0 is planned
- [ ] Breaking changes identified
- [ ] User projects exist in the wild
- [ ] Migration path is defined

**Until then:** DEFER

---

## References

- Semantic versioning: https://semver.org/
- Database migrations (similar patterns): Liquibase, Flyway, Alembic
