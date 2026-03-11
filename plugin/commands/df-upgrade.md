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

Also check for legacy structure indicators:

```bash
# Check for legacy drafts/domains/ structure
ls deepfield/drafts/domains/ 2>/dev/null && echo "domains_exists=true" || echo "domains_exists=false"

# Check for legacy wip/domain-index.md
ls deepfield/wip/domain-index.md 2>/dev/null && echo "domain_index_exists=true" || echo "domain_index_exists=false"
```

Build a JSON payload:
```json
{
  "from": "<projectVersion>",
  "to": "<targetVersion>",
  "workspaceSummary": {
    "files": ["<list of relative paths in deepfield/>"],
    "config": { "<contents of project.config.json>" },
    "legacyIndicators": {
      "hasDraftsDomains": "<true if deepfield/drafts/domains/ exists>",
      "hasDomainIndex": "<true if deepfield/wip/domain-index.md exists>"
    }
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

After the workspace structure upgrade completes (Step 6 success), invoke the `Deepfield Upgrade` skill a second time in draft-migration mode to detect and migrate any legacy flat domain files. Pass the same payload as Step 4, plus `"mode": "draft-migration"` and `"backupPath": "<backupPath>"`.

The skill handles all migration logic: idempotency check, legacy file detection, user confirmation prompt, AI-driven spec splitting via `deepfield-document-generator`, link rewriting, and the migration report. If no legacy files are found, the skill reports and exits cleanly.

**On failure**, direct the user to `deepfield rollback <backupPath>` as usual.

### Step 7b: Dual-Track Migration — Migrate behavior/ + tech/ to 3-Tier Structure

After Step 7 completes (or is skipped), invoke the `Deepfield Upgrade` skill a third time in dual-track-migration mode to detect and migrate any post-#91 dual-track spec files (`drafts/behavior/` + `drafts/tech/`) into the new language-first 3-tier structure.

Pass the same payload as Step 4, plus `"mode": "dual-track-migration"` and `"backupPath": "<backupPath>"`.

Also add workspace indicators to the payload:

```bash
# Detect dual-track structure
ls deepfield/drafts/behavior/ 2>/dev/null && echo "behavior_exists=true" || echo "behavior_exists=false"
ls deepfield/drafts/tech/ 2>/dev/null && echo "tech_exists=true" || echo "tech_exists=false"
ls deepfield/drafts/en/product-spec/ 2>/dev/null && echo "product_spec_exists=true" || echo "product_spec_exists=false"
```

Pass these as `"legacyIndicators"` in the payload:
```json
{
  "hasBehaviorDrafts": "<true if drafts/behavior/ exists and non-empty>",
  "hasTechDrafts": "<true if drafts/tech/ exists and non-empty>",
  "hasProductSpec": "<true if drafts/en/product-spec/ exists>"
}
```

The skill handles all migration logic: dual-track detection, confirmation prompt, per-domain behavior→product-spec move, tech spec AI-split into design/decisions/implementation, glossary conversion, manifest update, domain-links rebuild, and per-domain audit files via `generate-migration-review.js`. If no dual-track files are found, the skill reports and exits cleanly.

**On failure**, direct the user to `deepfield rollback <backupPath>` as usual.

## Error Handling

- **CLI not found**: Suggest `npm install -g deepfield`
- **Backup failure**: Abort upgrade — never proceed without a backup
- **Skill failure**: Always direct user to `deepfield rollback <backupPath>`
- **Already up to date**: Report and exit cleanly (exit 0)
