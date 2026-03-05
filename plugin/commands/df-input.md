---
name: df-input
description: Add and classify new sources into the knowledge base
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
arguments:
  - name: source
    description: Path to file, directory, or git URL to add as a source (omit for inline text)
    required: false
  - name: --type
    description: "Override source type: code, doc, config, schema, conversation, spec"
    required: false
  - name: --trust
    description: "Override trust level: trusted, reference, exploratory"
    required: false
  - name: --branch
    description: "Branch or tag to clone (git URLs only)"
    required: false
---

# /df-input - Add and Classify Sources

<!-- Plugin Classification (see CLAUDE.md § "Plugin vs CLI Guidelines")
  This command belongs in the Plugin layer, not the CLI, because:
  - Source classification (type + trust level) requires AI reasoning over file content.
  - The session is interactive and context-rich; user intent shapes classification.
  The deterministic sub-steps (cloning repos, writing the sources.json manifest) are
  delegated to CLI scripts (clone-repos.sh, update-json.js). The Plugin orchestrates;
  the CLI executes mechanical work. Call direction: Plugin → CLI. Never CLI → Plugin.
-->

Add new source materials (files, directories, git repositories, or inline text) to the knowledge base. Sources are classified by type and trust level, then filed into the appropriate location based on classification.

## Prerequisites

1. **`deepfield/` directory exists** (from `/df-init`)
2. **Bootstrap (Run 0) is complete** — sources need a staging area

If prerequisites fail:
- No `deepfield/`: "Run `/df-init` first."
- No Run 0: "Run `/df-bootstrap` first to complete initial setup."

## State Validation

```bash
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

if [ ! -f "./deepfield/wip/run-0/run-0.config.json" ]; then
  echo "Bootstrap not complete. Run /df-bootstrap first."
  exit 1
fi
```

## Determine Staging Area

Find or create the staging area for the next run:

```bash
# Find the highest completed run number
LAST_RUN=$(ls -d deepfield/wip/run-*/ 2>/dev/null | grep -oP 'run-\K\d+' | sort -n | tail -1)
NEXT_RUN=$((LAST_RUN + 1))
STAGING_DIR="deepfield/source/run-${NEXT_RUN}-staging"

# Create staging area if it doesn't exist
mkdir -p "${STAGING_DIR}/sources"
```

## Source Processing

### Step 1: Determine Source Kind

| Input | Kind |
|-------|------|
| Starts with `https://` or `git@` | **git-repo** |
| Existing file or directory path | **local-path** |
| No source argument provided | **inline-text** (prompt user for content) |

### Step 2: Classify

Unless BOTH `--type` and `--trust` are provided, invoke the classifier agent:

```
Launch: deepfield-classifier
Input: {
  "source": "<path-or-url>",
  "context": <brief-context-from-deepfield/source/baseline/brief.md>
}
```

If `--type` is provided, use it instead of the classifier's type.
If `--trust` is provided, use it instead of the classifier's trust level.

### Step 3: File the Source

Filing destination depends on the final classification:

| Trust Level | Type | Destination |
|-------------|------|-------------|
| trusted | code (git repo) | `deepfield/source/baseline/repos/<repo-name>/` |
| trusted or reference | doc, spec, config, schema | `deepfield/source/baseline/trusted-docs/<name>` |
| exploratory | any | `${STAGING_DIR}/sources/<name>` |
| reference | code | `${STAGING_DIR}/sources/<name>` |

**Rationale**: Trusted/reference sources persist across runs in `baseline/`. Exploratory sources are ephemeral and scoped to the next run.

#### Git Repository

1. Determine destination from classification table above
2. Clone:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/clone-repos.sh \
     <repo-url> \
     <destination> \
     [branch]
   ```

#### File or Directory

1. Verify path exists (error if not)
2. Determine destination from classification table above
3. Copy:
   ```bash
   cp -r <source-path> <destination>
   ```

#### Inline Text

1. Prompt user for content (or accept piped input)
2. Ask for a descriptive filename or generate one (e.g., `meeting-notes-2024-01-15.md`)
3. Always classify as type `conversation`, trust `exploratory`
4. Write to `${STAGING_DIR}/sources/<filename>.md`

### Step 4: Update Source Manifest

After filing, update `deepfield/source/sources.json` to track the addition.

If the file doesn't exist, create it with this structure:

```json
{
  "sources": []
}
```

Append an entry:

```json
{
  "path": "<filed-destination-relative-to-deepfield/>",
  "origin": "<original-path-or-url>",
  "type": "<classified-type>",
  "trustLevel": "<classified-trust>",
  "domains": ["<domain1>", "<domain2>"],
  "addedAt": "<ISO-timestamp>",
  "addedInRun": "<run-number or 'pre-run-N'>"
}
```

Use `${CLAUDE_PLUGIN_ROOT}/scripts/update-json.js` for atomic write if available, otherwise write directly.

### Step 5: Display Result

```
Source added successfully

  Source: <original path or URL>
  Type:  <type>
  Trust: <trust level>
  Filed: <destination path>

  Run /df-iterate or /df-continue to process this source.
```

## Error Handling

### Source path doesn't exist

```
Error: Source not found: <path>

Please verify the path and try again.
```

### Invalid git URL or clone failure

```
Error: Failed to clone repository: <url>

Possible causes:
  - Invalid URL format
  - Network issues
  - Authentication required (private repos need credentials)

Please verify the URL and try again.
```

### Source already exists at destination

If the destination already contains a source with the same name:

```
Warning: Source already exists at <destination>
Skipping — source was previously added.
```

Do not overwrite. Report the existing entry.

### No source argument and not interactive

If no source is provided and the session is non-interactive:

```
Error: No source specified.

Usage: /df-input <path-or-url> [--type=<type>] [--trust=<level>]
```

## Tips for Claude

- Multiple sources can be added before running iterate — each call appends to the manifest
- Each source goes to the appropriate location based on classification
- If the user provides text directly (no path), save it as a markdown file in staging
- After adding sources, suggest running `/df-continue` or `/df-iterate`
- Trust level matters: only "trusted" sources become ground truth
- When classifying directories, sample a few files to determine type
- Always read `deepfield/source/baseline/brief.md` for context before classifying
