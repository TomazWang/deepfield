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

Invoke the `deepfield-upgrade` skill with the payload from Step 4.

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

## Error Handling

- **CLI not found**: Suggest `npm install -g deepfield`
- **Backup failure**: Abort upgrade — never proceed without a backup
- **Skill failure**: Always direct user to `deepfield rollback <backupPath>`
- **Already up to date**: Report and exit cleanly (exit 0)
