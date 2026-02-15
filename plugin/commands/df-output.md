---
name: df-output
description: Snapshot current drafts to a versioned output directory
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
arguments:
  - name: --tag
    description: "Version tag for the snapshot (e.g. v1, milestone-1). Defaults to run number."
    required: false
  - name: --polish
    description: "Run a final polish pass on drafts before snapshotting"
    required: false
---

# /df-output - Snapshot Drafts to Versioned Output

Freeze the current state of draft documents into a versioned snapshot in the `deepfield/output/` directory. This creates an immutable record of knowledge at a point in time.

## Prerequisites

1. **deepfield/ directory exists**
2. **Drafts exist**: At least one file in `deepfield/drafts/`

If prerequisites fail:
- No `deepfield/`: "Run `/df-init` first."
- No drafts: "No draft documents found. Run `/df-bootstrap` and `/df-iterate` first."

## State Validation

```bash
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

# Check for any draft files
DRAFT_COUNT=$(find deepfield/drafts -name '*.md' -type f 2>/dev/null | wc -l)
if [ "$DRAFT_COUNT" -eq 0 ]; then
  echo "No draft documents found. Run /df-bootstrap and /df-iterate first."
  exit 1
fi
```

## Determine Version Tag

```bash
if [ -n "$TAG" ]; then
  VERSION="$TAG"
else
  # Use current run number
  LAST_RUN=$(ls -d deepfield/wip/run-*/ 2>/dev/null | grep -oP 'run-\K\d+' | sort -n | tail -1)
  VERSION="run-${LAST_RUN}"
fi

OUTPUT_DIR="deepfield/output/${VERSION}"
```

If the output directory already exists, warn and abort:
```
Output version "${VERSION}" already exists at deepfield/output/${VERSION}
Use --tag to specify a different version tag.
```

## Execution

### 1. Create Output Directory

```bash
mkdir -p "${OUTPUT_DIR}"
```

### 2. Optional Polish Pass

If `--polish` flag is provided:
- Read each draft document
- Clean up formatting inconsistencies
- Ensure all sections have proper headers
- Remove internal markers (like "Low confidence" notes meant for AI)
- Write polished versions back to drafts before copying

### 3. Copy Drafts to Output

```bash
cp -r deepfield/drafts/* "${OUTPUT_DIR}/"
```

### 4. Add Snapshot Metadata

Create `${OUTPUT_DIR}/SNAPSHOT.md`:

```markdown
# Knowledge Base Snapshot

**Version:** [version tag]
**Created:** [ISO timestamp]
**Based on:** Run [N]
**Draft count:** [N] documents

## Confidence Summary

| Topic | Confidence |
|-------|-----------|
| [topic] | [X]% |

## Contents

- domains/[topic].md
- cross-cutting/unknowns.md
- _changelog.md
```

### 5. Record in Changelog

Append to `deepfield/drafts/_changelog.md`:
```markdown
## Snapshot: [version]

Output frozen to `deepfield/output/[version]/`
Documents included: [N]
```

## Output

### On Success

```
✅ Knowledge base snapshot created

  Version:   [version]
  Location:  deepfield/output/[version]/
  Documents: [N] files

  This snapshot is immutable. Continue learning with /df-iterate
  and create new snapshots anytime with /df-output.
```

## Tips for Claude

- Snapshots are read-only records — learning continues on drafts
- Users can create multiple snapshots at different milestones
- The `--polish` flag is optional — raw drafts are already user-readable
- After output, suggest continuing with `/df-iterate` if more learning is desired
- Mention that `deepfield/output/` can be committed to version control
