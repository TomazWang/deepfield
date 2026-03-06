---
name: df-upgrade
description: AI-driven upgrade of the deepfield workspace to the latest version
allowed-tools:
  - Bash
---

# df-upgrade: AI-Driven Workspace Upgrade

Upgrade the deepfield workspace from the current project version to the latest CLI version using AI analysis. This command is the entry point for all AI-driven workspace upgrades.

> **Note**: For non-AI pre-flight checks only (detect versions, create backup), you can run `deepfield upgrade`. The AI-driven upgrade flow must be initiated here in Claude Code via `/df-upgrade`.

## Implementation

Execute the following steps in order:

### Step 1: Detect versions

Run:
```bash
deepfield upgrade:detect-version
```

Parse the JSON output into `{ projectVersion, targetVersion }`.

### Step 2: Check if already up to date

If `projectVersion === targetVersion`:
- Report: "Already up to date (v{projectVersion}). No upgrade needed."
- Exit successfully.

### Step 3: Create backup

Run:
```bash
deepfield upgrade:backup
```

- If exit code is 0: capture the printed backup path (stdout). Surface it to the user:
  > "Backup created: {backupPath}"
- If exit code is non-zero: report the error, inform the user that the upgrade is aborted to protect workspace safety, and stop.

### Step 4: Build workspace summary

Inspect the current workspace structure to build a summary for the upgrade skill:

```bash
find deepfield -type f | head -100
```

Read `deepfield/project.config.json` to get current config fields.

Build a JSON payload:
```json
{
  "from": "<projectVersion>",
  "to": "<targetVersion>",
  "workspaceSummary": {
    "files": ["<list of relative paths in deepfield/>"],
    "config": { "<contents of project.config.json>" }
  }
}
```

### Step 5: Invoke the deepfield-upgrade skill

Invoke the `Deepfield Upgrade` skill with the payload from Step 4.

Pass the payload as the skill argument. The skill will:
- Validate the workspace pre-upgrade
- Analyze the structural diff between versions
- Apply all required file operations atomically using CLI helpers
- Validate post-upgrade
- Update the version in project.config.json

### Step 6: Handle skill outcome

**On success:**
- Confirm upgrade completed: "Workspace upgraded from v{from} to v{to}"
- Mention backup location in case rollback is needed

**On failure:**
- Report the error from the skill
- Instruct the user to rollback:
  ```
  deepfield rollback <backupPath>
  ```
- Do not attempt a retry automatically

### Step 7: Draft Migration — Split Legacy Domain Files

After the workspace structure upgrade completes (Step 6 success), check for legacy flat domain draft files and migrate them to the new two-file format.

#### 7.1 Re-run Safety Check

Before scanning, check whether a previous migration attempt was partially completed:

For each `{domain}` directory that already exists under `deepfield/drafts/domains/`:
- If both `{domain}/behavior-spec.md` AND `{domain}/tech-spec.md` exist → skip this domain (already migrated)
- If only one exists, or neither exists but a flat `{domain}.md` file is present → include for migration

This check ensures that re-running `/df-upgrade` is safe: already-migrated domains are skipped; only remaining legacy files are retried.

#### 7.2 Detect Legacy Files

Scan `deepfield/drafts/domains/` for flat `{domain}.md` files (files directly in the `domains/` directory, not in subdirectories):

```bash
# Files at: deepfield/drafts/domains/{domain}.md  (flat, not in subdirectory)
find deepfield/drafts/domains -maxdepth 1 -name "*.md" -not -name "README.md"
```

If no legacy flat files are found (either none existed, or all were already migrated), skip Steps 7.3–7.9 and report:
> "No legacy domain files found. Draft migration not needed."

Otherwise, list the detected legacy domains to the user before proceeding:

```
Legacy domain files detected:
  - authentication  (deepfield/drafts/domains/authentication.md)
  - api-structure   (deepfield/drafts/domains/api-structure.md)
  - data-flow       (deepfield/drafts/domains/data-flow.md)
```

#### 7.3 Confirmation Prompt

Before starting migration, ask the user:

```
Found {N} legacy domain file(s) that need to be split into behavior-spec.md and tech-spec.md.

This migration will:
  1. Use AI to classify each domain file into behavior (stakeholder) and tech (implementation) sections
  2. Write deepfield/drafts/domains/{domain}/behavior-spec.md
  3. Write deepfield/drafts/domains/{domain}/tech-spec.md
  4. Rename the original {domain}.md to {domain}/_legacy.md (preserved, not deleted)
  5. Update cross-reference links across all draft files

A backup already exists at: {backupPath}

Proceed with draft migration? (yes/no)
```

If the user says **no**, skip Steps 7.4–7.9 and report:
> "Draft migration skipped. You can re-run `/df-upgrade` later to migrate legacy files."

#### 7.4 Migrate Each Domain

For each legacy domain (in sequence):

1. **Invoke `deepfield-document-generator` in migration mode:**

   ```
   Launch: deepfield-document-generator
   Input: {
     "domain_name": "{domain}",
     "findings_path": null,
     "behavior_spec_path": "deepfield/drafts/domains/{domain}/behavior-spec.md",
     "tech_spec_path":     "deepfield/drafts/domains/{domain}/tech-spec.md",
     "legacy_draft_path":  "deepfield/drafts/domains/{domain}.md"
   }
   ```

2. **Wait for the agent to complete.**

3. **Verify output:** Check that both files now exist:
   - `deepfield/drafts/domains/{domain}/behavior-spec.md`
   - `deepfield/drafts/domains/{domain}/tech-spec.md`

#### 7.5 On Success per Domain

If both output files exist:

```bash
# Create the domain subdirectory if not already created by the agent
mkdir -p "deepfield/drafts/domains/{domain}"

# Archive the original flat file as _legacy.md
mv "deepfield/drafts/domains/{domain}.md" "deepfield/drafts/domains/{domain}/_legacy.md"
```

Record success in the migration tracking object:
```javascript
migrationResults[domain] = { status: 'success', behaviorSpec: true, techSpec: true }
```

#### 7.6 On Failure per Domain

If one or both output files are missing after the agent completes:

- Leave `deepfield/drafts/domains/{domain}.md` in place (do NOT move it)
- Record failure:
  ```javascript
  migrationResults[domain] = {
    status: 'failed',
    behaviorSpec: fs.existsSync(`deepfield/drafts/domains/${domain}/behavior-spec.md`),
    techSpec:     fs.existsSync(`deepfield/drafts/domains/${domain}/tech-spec.md`),
    error: 'Agent did not produce both output files'
  }
  ```
- Log a warning: `Warning: Migration failed for domain "{domain}" — original file preserved.`
- Continue with the next domain (do NOT abort the entire migration)

#### 7.7 Update Cross-Reference Links

After all domains have been processed (success or failure), update cross-reference links in all draft files:

Scan all `*.md` files under `deepfield/drafts/` and replace legacy link patterns:

For each successfully migrated domain `{domain}`:
- Pattern: `](./{domain}.md)` → Replace with `](../{domain}/tech-spec.md)`
- Pattern: `]({domain}.md)` → Replace with `]({domain}/tech-spec.md)`

Example:
```
Before: [authentication](./authentication.md)
After:  [authentication](../authentication/tech-spec.md)
```

Record the number of links updated per file in the migration report.

#### 7.8 Write Migration Report

Write a migration report to `deepfield/wip/migration-split-spec.md`:

```markdown
# Draft Migration Report — Behavior/Tech Spec Split

**Date:** {ISO date}
**Triggered by:** /df-upgrade

## Domain Migration Results

| Domain | Status | behavior-spec.md | tech-spec.md | Legacy Archived |
|--------|--------|-----------------|-------------|----------------|
| authentication | ✓ success | created | created | → _legacy.md |
| api-structure  | ✓ success | created | created | → _legacy.md |
| data-flow      | ✗ failed  | missing | missing | preserved     |

## Cross-Reference Link Updates

| File | Links Updated |
|------|--------------|
| deepfield/drafts/cross-cutting/unknowns.md | 3 |
| deepfield/drafts/domains/api-structure/tech-spec.md | 1 |

## Summary

- Domains migrated: {N} of {M}
- Domains failed: {F} (original files preserved)
- Total links updated: {L}

## Re-run Instructions

To retry failed domains, run `/df-upgrade` again.
Only domains with remaining legacy `.md` files will be retried.
```

#### 7.9 Display Migration Summary

Display a human-readable migration summary table to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Draft Migration Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain              Status    behavior-spec  tech-spec
──────────────────────────────────────────────────────
authentication      ✓         created        created
api-structure       ✓         created        created
data-flow           ✗ failed  —              —

Migrated: 2/3 domains
Failed:   1 domain (original file preserved — re-run /df-upgrade to retry)

Cross-reference links updated: {L} across {F} files

Full report: deepfield/wip/migration-split-spec.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Error Handling

- **CLI not found**: Suggest `npm install -g deepfield`
- **Backup failure**: Abort upgrade — never proceed without a backup
- **Skill failure**: Always direct user to `deepfield rollback <backupPath>`
- **Already up to date**: Report and exit cleanly (exit 0)
