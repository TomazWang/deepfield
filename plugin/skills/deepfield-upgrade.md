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

**Note on version 1.0.0**: The CLI automatically maps legacy version 1.0.0 to 0.1.0 (a version numbering change occurred during development). If you receive `from: "0.1.0"`, the actual workspace will have `deepfieldVersion: "1.0.0"` in its config, but it should be treated as a pre-0.2.0 workspace that needs upgrading.

If `from === to`:
- Output: "Workspace is already at v{to}. No operations needed."
- Exit without applying any operations.

## Step 2: Scaffold missing cross-cutting files

Before making any other changes, ensure all required cross-cutting files exist by calling:

```bash
deepfield upgrade:scaffold-cross-cutting --templates-dir "${CLAUDE_PLUGIN_ROOT}/templates"
```

Read the output line by line. For each `Created:` line, display the message to the user. After running, display:

- If any files were created: "Scaffolded missing cross-cutting files"
- If all files already existed: "Cross-cutting files already present"

If this command fails (non-zero exit), report the error and abort.

## Step 3: Pre-apply validation

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

After validation passes, determine the next step based on `from` version:
- If `from` < `0.6.0` (i.e., `0.5.x` or earlier): **proceed to Step 3.5** to handle legacy flat spec files, then continue to Step 4.
- Otherwise: **skip Step 3.5** and proceed directly to Step 4.

## Step 3.5: Handle Flat spec.md Splitting (pre-0.6.0 workspaces only)

This step applies only to workspaces from version 0.5.x and earlier, which stored a single flat `spec.md` per domain before the behavior/tech split was introduced in 0.6.0. Workspaces from 0.6.x already have `behavior-spec.md` and `tech-spec.md` — those are handled by Step 4, not this step.

### Detection

A domain folder needs AI splitting when:
- `drafts/domains/{domain}/spec.md` exists (the pre-0.6.0 flat format)
- Neither `drafts/domains/{domain}/behavior-spec.md` nor `drafts/domains/{domain}/tech-spec.md` exists
- The file does not end in `.bak`

If no domain folders match this condition (true for all 0.6.x workspaces), skip this step entirely.

### Split Process

For each domain that needs splitting:

1. **Read the flat spec:**
   ```bash
   # Read deepfield/drafts/domains/{domain}/spec.md
   ```

2. **Classify each section as behavior or tech:**
   - Behavior content: user stories, product features, business rules, user flows, domain language, stakeholder-visible behavior
   - Tech content: architecture, APIs, data models, implementation decisions, dependencies, technical constraints

3. **Write behavior spec:**
   ```bash
   deepfield upgrade:apply-op --type create \
     --path "drafts/behavior/{domain}/spec.md" \
     --content "<behavior content>"
   ```

4. **Write tech spec:**
   ```bash
   deepfield upgrade:apply-op --type create \
     --path "drafts/tech/{domain}/spec.md" \
     --content "<tech content>"
   ```

5. **Preserve original as backup (NOT deleted):**
   ```bash
   deepfield upgrade:apply-op --type rename \
     --path "drafts/domains/{domain}/spec.md" \
     --to   "drafts/domains/{domain}/spec.md.bak"
   ```

6. **Log the split:**
   ```
   Split {domain}/spec.md into behavior and tech tracks
   Original preserved as drafts/domains/{domain}/spec.md.bak
   ```

### Content guidelines per output file

**`drafts/behavior/{domain}/spec.md`** — stakeholder-facing:
- Start with a 1–2 sentence domain purpose from the user's perspective
- Sections: User Stories, Business Rules, User Flows, Domain Concepts
- Avoid implementation details, library names, and file paths
- Use domain language, not code language

**`drafts/tech/{domain}/spec.md`** — implementation-facing:
- Start with a 1–2 sentence technical overview
- Sections: Architecture, APIs, Data Models, Dependencies, Technical Decisions
- Include file:line references where known
- Avoid "As a user…" phrasing and business justifications disconnected from technical choices

### Failure Handling

If either output file cannot be written:
- Leave the original `spec.md` in place (do NOT rename to `.bak`)
- Log: `Warning: Flat spec split failed for domain "{domain}" — original preserved`
- Continue with the next domain

## Step 4: Analyze structural diff and determine required operations

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

## Step 5: Apply operations

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

## Step 6: Post-apply validation

After all operations are applied, validate the workspace again:

```bash
deepfield upgrade:validate
```

Parse the JSON output `{ valid, errors }`.

- If `valid === true`:
  - If upgrading from a version less than `0.7.0`: Continue to Step 6.5, then Step 7.
  - Otherwise: Continue to Step 7.
- If `valid === false`:
  - Report the validation errors.
  - Instruct the user to rollback:
    > "Post-upgrade validation failed. To restore your workspace, run:
    > `deepfield rollback <backupPath>`"
  - Stop. Do NOT update the version.

## Step 6.5: Migrate project.config.json to Dual-Track Schema (pre-0.7.0 only)

Run this step only when the `from` version is less than `0.7.0`.

### Schema changes

| Old field | New field | Notes |
|-----------|-----------|-------|
| `domains` | `techDomains` | Renamed; same array of domain name strings |
| _(absent)_ | `behaviorDomains` | New empty array; populated by future iterate runs |
| _(absent)_ | `domainLinks` | New empty array; populated by domain-linker |

### Migration logic

```javascript
const config = JSON.parse(readFile('deepfield/project.config.json'))

// Rename domains → techDomains (if domains field still present)
if (Object.prototype.hasOwnProperty.call(config, 'domains')) {
  config.techDomains = config.domains
  delete config.domains
}

// Add new fields only if absent (idempotent)
if (!Object.prototype.hasOwnProperty.call(config, 'behaviorDomains')) {
  config.behaviorDomains = []
}
if (!Object.prototype.hasOwnProperty.call(config, 'domainLinks')) {
  config.domainLinks = []
}

// NOTE: Do NOT set workspaceVersion here.
// workspaceVersion is updated by Step 7 (upgrade:set-version) ONLY after post-apply validation succeeds.
// If migration fails partway through, the absence of workspaceVersion update protects the workspace.
```

Apply via:

```bash
deepfield upgrade:apply-op --type update \
  --path "project.config.json" \
  --content "<updated config JSON>"
```

### Failure handling

If the config update fails:
- Log: `Warning: project.config.json schema migration failed: <error>`
- Do NOT abort — the workspace structure migration already applied. Report that the user should manually update `project.config.json` using the schema above.
- Continue to Step 7 (set version).

### Idempotency

If `techDomains` already exists (a previous migration attempt partially completed), skip the rename step. Only add missing `behaviorDomains` and `domainLinks` fields.

## Step 6.7: Migrate Legacy Flat Domain Draft Files (if mode is "draft-migration")

This step runs only when the skill is invoked with `"mode": "draft-migration"` from the command's Step 7. Skip this step for normal upgrade invocations.

### Detection

Scan `deepfield/drafts/domains/` for flat `{domain}.md` files (files directly in the `domains/` directory, not in subdirectories):

```bash
find deepfield/drafts/domains -maxdepth 1 -name "*.md" -not -name "README.md"
```

**Idempotency check:** For each detected `{domain}.md`, check whether both `deepfield/drafts/behavior/{domain}/spec.md` AND `deepfield/drafts/tech/{domain}/spec.md` already exist. If both exist, skip that domain (already migrated).

If no domains remain after the idempotency check, report "No legacy domain files found. Draft migration not needed." and exit this step.

### Confirmation Prompt

Before starting, ask the user:

```
Found {N} legacy domain file(s) that need to be split into behavior and tech specs.

This migration will:
  1. Use AI to classify each domain file into behavior (stakeholder) and tech (implementation) sections
  2. Write deepfield/drafts/behavior/{domain}/spec.md
  3. Write deepfield/drafts/tech/{domain}/spec.md
  4. Archive the original {domain}.md as {domain}/_legacy.md (preserved, not deleted)
  5. Update cross-reference links across all draft files

A backup is available at: {backupPath}

Proceed with draft migration? (yes/no)
```

If the user says **no**, report "Draft migration skipped. Re-run `/df-upgrade` later to migrate legacy files." and exit.

### Migrate Each Domain (in sequence)

For each legacy domain:

1. Invoke `deepfield-document-generator` twice in migration mode:
   - First: `domain_name: "{domain}"`, `track: "behavior"`, `findings_path: null`, `legacy_draft_path: "deepfield/drafts/domains/{domain}.md"`
   - Then: `domain_name: "{domain}"`, `track: "tech"`, `findings_path: null`, `legacy_draft_path: "deepfield/drafts/domains/{domain}.md"`

2. If both output files exist: archive the original via `deepfield upgrade:apply-op --type rename --path "drafts/domains/{domain}.md" --to "drafts/domains/{domain}/_legacy.md"`

3. If either output file is missing: leave the original in place and log a warning. Continue with the next domain.

### Update Cross-Reference Links

For each successfully migrated domain, scan all `*.md` files under `deepfield/drafts/` and update links. Compute the relative path from each source file to the target individually based on directory depth below `deepfield/drafts/`:

- Depth 0 (e.g. `drafts/_changelog.md`) → `tech/{domain}/spec.md`
- Depth 1 (e.g. `drafts/cross-cutting/unknowns.md`) → `../tech/{domain}/spec.md`
- Depth 2 (e.g. `drafts/tech/auth/spec.md`) → `../../tech/{domain}/spec.md`

Replace patterns: `](./{domain}.md)` and `]({domain}.md)` with the computed relative path.

### Report

Write a migration summary to `deepfield/wip/migration-split-spec.md` and display a human-readable table to the user showing per-domain status and total links updated.

## Step 7: Update version

After successful post-apply validation, update the version:

```bash
deepfield upgrade:set-version --to-version "<to>"
```

If this fails (non-zero exit code), report the error. The upgrade operations were applied successfully but the version field was not updated. Advise the user to run `deepfield upgrade:set-version --to-version <to>` manually.

## Step 8: Report success

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
