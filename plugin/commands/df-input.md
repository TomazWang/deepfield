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
    description: Path to file, directory, or git URL to add as a source
    required: true
  - name: --type
    description: "Override source type: code, doc, config, schema, conversation, spec"
    required: false
  - name: --trust
    description: "Override trust level: trusted, reference, exploratory"
    required: false
---

# /df-input - Add and Classify Sources

Add new source materials (files, directories, git repositories, or inline text) to the knowledge base. Sources are classified by type and trust level, then filed into the appropriate staging area for the next learning run.

## Prerequisites

1. **deepfield/ directory exists**
2. **Bootstrap (Run 0) is complete** — sources need a staging area to land in

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

Find or create the current staging area:

```bash
# Find the highest completed run number
LAST_RUN=$(ls -d deepfield/wip/run-*/ 2>/dev/null | grep -oP 'run-\K\d+' | sort -n | tail -1)
NEXT_RUN=$((LAST_RUN + 1))
STAGING_DIR="deepfield/source/run-${NEXT_RUN}-staging"

# Create staging area if it doesn't exist
mkdir -p "${STAGING_DIR}/sources"
```

## Source Processing

### Git Repository URL

When source is a git URL (starts with `https://` or `git@`):

1. **Classify** via classifier agent (or use `--type`/`--trust` overrides)
2. **Clone** to staging:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/clone-repos.sh \
     <repo-url> \
     ${STAGING_DIR}/sources/<repo-name> \
     [branch]
   ```
3. **Report** classification and location

### File or Directory Path

When source is a local path:

1. **Verify** path exists
2. **Classify** via classifier agent (or use overrides)
3. **Copy** to staging:
   ```bash
   cp -r <source-path> ${STAGING_DIR}/sources/
   ```
4. **Report** classification and location

### Inline Text (No Path)

When user provides context directly (meeting notes, descriptions, etc.):

1. **Ask** for a filename or generate one from content
2. **Classify** as type "conversation", trust "exploratory"
3. **Write** to staging:
   ```bash
   echo "<content>" > ${STAGING_DIR}/sources/<filename>.md
   ```
4. **Report** location

## Classification

Unless overridden with `--type` and `--trust`, invoke the classifier agent:

```
Launch: deepfield-classifier
Input: {
  "source": "<path-or-url>",
  "context": <brief-context-from-project-config>
}
```

Display classification result to user:
```
Source classified:
  Type:  [code/doc/config/schema/conversation/spec]
  Trust: [trusted/reference/exploratory]
  Domains: [domain1, domain2]

Filed to: deepfield/source/run-N-staging/sources/<name>
```

## Output

### On Success

```
✅ Source added successfully

  Source: [path or URL]
  Type:  [type]
  Trust: [trust level]
  Filed: deepfield/source/run-2-staging/sources/[name]

  Run /df-iterate or /df-continue to process this source.
```

### On Validation Failure

```
Cannot add source: [reason]
[Suggestion]
```

## Tips for Claude

- Multiple sources can be added before running iterate
- Each source goes to the same staging area until the next run starts
- If the user provides text directly, save it as a markdown file
- After adding sources, suggest running `/df-continue` or `/df-iterate`
- Trust level matters: only "trusted" sources become ground truth
