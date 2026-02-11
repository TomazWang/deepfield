---
name: df-init
description: Initialize kb/ directory structure with four-space architecture
---

# /df-init - Initialize Knowledge Base

Initialize a new Deepfield knowledge base by creating the complete directory structure.

## What This Does

Creates the four-space architecture:
- `source/` - Raw inputs (baseline + per-run)
- `wip/` - AI's private workspace
- `drafts/` - Living documents
- `output/` - Frozen snapshots

## Usage

```bash
/df-init
```

The command will create `./kb/` in your current directory.

## Implementation

```bash
# Check if kb/ already exists
if [ -d "./kb" ]; then
  echo "⚠️  Warning: kb/ directory already exists"
  echo ""
  echo "Options:"
  echo "  1. Continue anyway (existing files will be preserved)"
  echo "  2. Cancel and inspect existing kb/"
  echo ""

  # Use AskUserQuestion to confirm
  # If user cancels, exit gracefully
fi

# Call scaffold-kb.sh script
${CLAUDE_PLUGIN_ROOT}/scripts/scaffold-kb.sh ./kb

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to initialize kb/ directory" >&2

  # Check for common issues
  if [ ! -w "." ]; then
    echo "" >&2
    echo "Permission issue: Current directory is not writable" >&2
    echo "Fix: Check permissions with 'ls -ld .'" >&2
  fi

  exit 1
fi

echo ""
echo "✅ Knowledge base initialized successfully!"
echo ""
echo "📁 Directory: ./kb/"
echo ""
echo "Next steps:"
echo "  1. Run /df-start to begin interactive setup"
echo "  2. Fill out the generated brief.md with project details"
echo "  3. Run /df-bootstrap to begin learning (Phase 2)"
echo ""
echo "Structure created:"
echo "  kb/"
echo "  ├── source/        # Raw inputs: repos, docs, notes"
echo "  ├── wip/           # AI's workspace: maps, plans, findings"
echo "  ├── drafts/        # Living documents that evolve"
echo "  └── output/        # Frozen snapshots for sharing"
```

## Error Handling

The command handles these scenarios:

### Existing kb/ Directory

If `kb/` already exists, prompt the user:
- **Continue**: Existing files are preserved (idempotent operation)
- **Cancel**: Exit without making changes

### Permission Errors

If the current directory isn't writable:
- Display clear error message
- Show suggested fix (check permissions)
- Exit with code 1

### Script Failures

If `scaffold-kb.sh` fails:
- Display error from script
- Show troubleshooting steps
- Exit with non-zero code

## State Transitions

```
EMPTY
  → Run /df-init
INITIALIZED (kb/ exists, no project.config.json)
```

## Files Created

- `kb/` directory with complete structure
- `kb/project.config.json` (empty template)
- `kb/wip/project-map.md` (placeholder)
- `kb/wip/domain-index.md` (placeholder)
- `kb/drafts/_changelog.md` (empty)
- `kb/drafts/cross-cutting/unknowns.md` (template)

All subdirectories under `source/`, `wip/`, `drafts/`, and `output/`.
