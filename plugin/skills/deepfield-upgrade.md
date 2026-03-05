---
name: Deepfield Upgrade
description: AI-driven workspace upgrade skill — analyzes structural diff between versions and applies changes via CLI helpers
trigger_mode: command
user_invocable: false
---

# Purpose

This skill receives a structured version diff payload, reasons about what file operations are needed to bring the deepfield workspace from the `from` version to the `to` version, and applies those operations atomically using CLI helper sub-commands.

The skill MUST NOT write files directly. All file operations MUST go through `deepfield upgrade:apply-op`.

# Input Schema

The skill accepts a JSON payload with the following shape:

```json
{
  "from": "<semver>",
  "to": "<semver>",
  "workspaceSummary": {
    "files": ["<list of relative paths in deepfield/>"],
    "config": { "<contents of deepfield/project.config.json>" }
  }
}
```

# Execution Steps

## Step 1: Parse input

Parse the JSON payload from the invocation arguments into `{ from, to, workspaceSummary }`.

If `from === to`:
- Output: "Workspace is already at v{to}. No operations needed."
- Exit without applying any operations.

## Step 2: Pre-apply validation

Before making any changes, validate the current workspace:

```bash
deepfield upgrade:validate
```

Parse the JSON output `{ valid, errors }`.

- If `valid === false`:
  - Report the validation errors to the user
  - Abort: do not apply any operations
  - Output: "Pre-upgrade validation failed. Please fix the errors above before running /df-upgrade again."
  - Stop.

## Step 3: Analyze structural diff and determine required operations

Using your knowledge of Deepfield workspace structure conventions, reason about:

1. What the workspace structure should look like at version `{to}`
2. What the workspace currently looks like (from `workspaceSummary.files` and `workspaceSummary.config`)
3. What file operations (create, update, delete, rename) are needed to bridge the gap

Consider:
- New required directories that don't exist
- New required config fields that are missing
- Files or directories that have been renamed or reorganized between versions
- Files that should no longer exist in the new version

Produce a structured list of operations:
```
operations = [
  { type: "create", path: "relative/path", content: "..." },
  { type: "update", path: "relative/path", content: "..." },
  { type: "delete", path: "relative/path" },
  { type: "rename", path: "old/path", to: "new/path" }
]
```

If the versions are consecutive and you cannot determine the exact structural diff, prefer conservative operations (add missing directories/files, do not delete unless certain).

## Step 4: Apply operations

For each operation in the list, call the appropriate CLI helper:

**Create or Update:**
```bash
deepfield upgrade:apply-op --type create --path "<relative-path>" --content "<content>"
deepfield upgrade:apply-op --type update --path "<relative-path>" --content "<content>"
```

**Delete:**
```bash
deepfield upgrade:apply-op --type delete --path "<relative-path>"
```

**Rename:**
```bash
deepfield upgrade:apply-op --type rename --path "<old-path>" --to "<new-path>"
```

Report each operation result as it completes. If any operation fails (non-zero exit code), stop immediately and report the error. Do not continue applying remaining operations after a failure.

## Step 5: Post-apply validation

After all operations are applied, validate the workspace again:

```bash
deepfield upgrade:validate
```

Parse the JSON output `{ valid, errors }`.

- If `valid === true`:
  - Continue to Step 6.
- If `valid === false`:
  - Report the validation errors.
  - Instruct the user to rollback:
    > "Post-upgrade validation failed. To restore your workspace, run:
    > `deepfield rollback <backupPath>`"
  - Stop. Do NOT update the version.

## Step 6: Update version

After successful post-apply validation, update the version:

```bash
deepfield upgrade:set-version --to-version "<to>"
```

If this fails (non-zero exit code), report the error. The upgrade operations were applied successfully but the version field was not updated. Advise the user to run `deepfield upgrade:set-version --version <to>` manually.

## Step 7: Report success

Output a summary:

```
Upgrade complete: v{from} → v{to}

Applied {N} operation(s):
  - Created: deepfield/...
  - Updated: deepfield/...
  (etc.)

Workspace validated successfully.
Version updated to v{to}.

Backup is available at: <backupPath> (if rollback is ever needed, run: deepfield rollback <backupPath>)
```

# Failure Paths

## Pre-apply validation failure
- Report errors from `upgrade:validate`
- Abort all operations
- Do not update version

## Operation failure mid-apply
- Report which operation failed and the error message
- Stop applying remaining operations
- Instruct user to check workspace state and rollback if needed:
  > "Run `deepfield rollback <backupPath>` to restore from backup."

## Post-apply validation failure
- Report validation errors
- Instruct user to rollback:
  > "Run `deepfield rollback <backupPath>` to restore from backup."
- Do not update version

# Guardrails

- NEVER write files directly — always use `deepfield upgrade:apply-op`
- NEVER skip pre-apply or post-apply validation
- NEVER update version if post-apply validation fails
- Prefer conservative operations: if uncertain whether a file should be deleted, skip the delete and report it
- All paths in `--path` and `--to` arguments are relative to `deepfield/` (e.g. `wip/notes.md`, not `deepfield/wip/notes.md`)
