---
name: df-output
description: Snapshot current drafts to a versioned output directory
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Edit
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
2. **deepfield/drafts/ directory exists with content**: At least one `.md` file in `deepfield/drafts/` that is NOT only template boilerplate
3. **At least one run completed**: `deepfield/wip/run-*/` directory exists with a `status: "completed"` config

If prerequisites fail:
- No `deepfield/`: "No deepfield/ directory found. Run `/df-init` first."
- No drafts: "No draft documents found. Run `/df-bootstrap` and `/df-iterate` first."
- No completed runs: "No completed learning runs found. Run `/df-bootstrap` first to generate initial knowledge."

## State Validation

```bash
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

# Check for any draft files (exclude directories)
DRAFT_COUNT=$(find deepfield/drafts -name '*.md' -type f 2>/dev/null | wc -l)
if [ "$DRAFT_COUNT" -eq 0 ]; then
  echo "No draft documents found. Run /df-bootstrap and /df-iterate first."
  exit 1
fi

# Check for at least one completed run
COMPLETED_RUN=$(grep -rl '"status".*"completed"' deepfield/wip/run-*/run-*.config.json 2>/dev/null | head -1)
if [ -z "$COMPLETED_RUN" ]; then
  echo "No completed learning runs found. Run /df-bootstrap first to generate initial knowledge."
  exit 1
fi
```

### Empty Draft Detection

A draft is considered "empty" (template-only) if it contains only:
- The template heading
- Empty placeholder markers (`- ` with no content after)
- HTML comments (`<!-- ... -->`)

Before snapshotting, check that at least one draft has substantive content beyond template boilerplate. If all drafts are empty templates, warn:
```
All draft documents appear to contain only template content.
Run /df-iterate to generate knowledge before snapshotting.
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

### Duplicate Version Handling

If the output directory already exists, warn and abort:
```
Output version "${VERSION}" already exists at deepfield/output/${VERSION}/
Use --tag to specify a different version tag, e.g.: /df-output --tag v2
```

Do NOT overwrite or merge into existing snapshots. Snapshots are immutable.

## Execution

### 1. Create Output Directory

```bash
mkdir -p "${OUTPUT_DIR}"
```

### 2. Optional Polish Pass

If `--polish` flag is provided, read each draft document and apply these transformations **to a working copy** (do NOT modify the original drafts):

#### 2a. Strip Internal AI Markers

Remove lines or sections that are internal working notes not meant for end users:

- Lines containing `<!-- AI-NOTE:` or `<!-- INTERNAL:` comments
- Lines starting with `> **AI Confidence:**` or `> **Low confidence**`
- Lines starting with `> **TODO (AI):**`
- Sections titled `## AI Working Notes` or `## Internal Notes`
- Lines containing `[NEEDS VERIFICATION]`, `[UNVERIFIED]`, or `[AI UNCERTAIN]`

#### 2b. Fix Markdown Formatting

- Ensure consistent heading hierarchy (no skipped levels, e.g., `#` then `###`)
- Ensure blank lines before and after headings
- Ensure blank lines before and after code blocks
- Normalize list markers to `-` (convert `*` bullets to `-`)
- Remove trailing whitespace
- Ensure file ends with a single newline

#### 2c. Add Table of Contents

For each domain document with 3+ top-level sections (`## ...`), insert a table of contents after the first `# ` heading:

```markdown
## Table of Contents

- [Section Name](#section-name)
- [Another Section](#another-section)
```

#### 2d. Write Polished Copies

Write polished versions directly to the output directory (not back to drafts). This preserves the original drafts for continued learning.

### 3. Copy Drafts to Output

If `--polish` was NOT used:
```bash
cp -r deepfield/drafts/* "${OUTPUT_DIR}/"
```

If `--polish` was used, polished files are already written to `${OUTPUT_DIR}/` in step 2d.

### 4. Extract Confidence Data

Read `deepfield/wip/learning-plan.md` to extract per-topic confidence levels for the SNAPSHOT.md.

#### Parsing Logic

The learning plan contains topic sections in this format:

```markdown
### [Topic Name] (Priority: HIGH/MEDIUM/LOW)

- **Confidence:** [0-100]%
- **Status:** [In Progress / Complete / Blocked]
```

Extract each topic name, confidence percentage, and priority. Also check the confidence tracking table:

```markdown
| Topic | Run 0 | Run 1 | ... | Target |
|-------|-------|-------|-----|--------|
| Example Topic | 20% | 45% | ... | 80% |
```

Use the **topic sections** as the primary source (they reflect the latest state). Fall back to the tracking table if topic sections aren't found.

If `deepfield/wip/learning-plan.md` does not exist, omit the confidence summary section from SNAPSHOT.md and add a note: "Confidence data not available."

### 5. Add Snapshot Metadata

Create `${OUTPUT_DIR}/SNAPSHOT.md`:

```markdown
# Knowledge Base Snapshot

**Version:** [version tag]
**Created:** [ISO timestamp, e.g. 2026-03-03T14:30:00Z]
**Based on:** Run [N] (latest completed run number)
**Draft count:** [N] documents
**Polished:** [Yes/No]

## Confidence Summary

| Topic | Confidence | Priority | Status |
|-------|-----------|----------|--------|
| [topic] | [X]% | [HIGH/MEDIUM/LOW] | [In Progress/Complete/Blocked] |

**Overall:** [X]/[Y] HIGH priority topics above 80% confidence

## Known Gaps

Summary of documented unknowns (from cross-cutting/unknowns.md):
- [Key unknown or gap, if any]

## Contents

[List all files included in the snapshot, e.g.:]
- domains/authentication.md
- domains/api-structure.md
- cross-cutting/unknowns.md
- _changelog.md
```

### 6. Update Output Index

Create or update `deepfield/output/INDEX.md` listing all snapshots:

```markdown
# Knowledge Base Snapshots

| Version | Created | Based On | Documents | Polished |
|---------|---------|----------|-----------|----------|
| [version] | [date] | Run [N] | [N] files | [Yes/No] |
```

When INDEX.md already exists, append a new row to the table. When creating fresh, add a header:

```markdown
# Knowledge Base Snapshots

All versioned snapshots of the Deepfield knowledge base.

| Version | Created | Based On | Documents | Polished |
|---------|---------|----------|-----------|----------|
| [version] | [date] | Run [N] | [N] files | [Yes/No] |
```

### 7. Record in Changelog

Append to `deepfield/drafts/_changelog.md`:
```markdown

## Snapshot: [version]

**Date:** [ISO timestamp]
Output frozen to `deepfield/output/[version]/`
Documents included: [N]
Polished: [Yes/No]
```

## Output

### On Success

```
Knowledge base snapshot created

  Version:   [version]
  Location:  deepfield/output/[version]/
  Documents: [N] files
  Polished:  [Yes/No]

  This snapshot is immutable. Continue learning with /df-iterate
  and create new snapshots anytime with /df-output.
```

## Tips for Claude

- Snapshots are read-only records — learning continues on drafts
- Users can create multiple snapshots at different milestones
- The `--polish` flag is optional — raw drafts are already user-readable
- Polish writes to the output directory, NOT back to drafts — originals are preserved
- After output, suggest continuing with `/df-iterate` if more learning is desired
- Mention that `deepfield/output/` can be committed to version control
- When extracting confidence data, handle missing or malformed learning-plan.md gracefully
- If the learning plan has no topics yet, show "No topics tracked yet" in the confidence table
- Always generate the INDEX.md to make multiple snapshots discoverable
