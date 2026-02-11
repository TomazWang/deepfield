---
name: df-status
description: Display current knowledge base state and suggest next actions
---

# /df-status - Display Knowledge Base Status

Show the current state of your knowledge base, including progress, configuration, and suggested next actions.

## Usage

```bash
/df-status              # Default: concise output
/df-status --verbose    # Detailed output with all fields
```

## Implementation

```bash
# Parse arguments
VERBOSE=false
if [[ "$*" == *"--verbose"* ]]; then
  VERBOSE=true
fi

# Detect current workflow state
STATE="EMPTY"
SUGGESTION=""

if [ ! -d "./kb" ]; then
  STATE="EMPTY"
  SUGGESTION="Run /df-init to create kb/ structure"
else
  STATE="INITIALIZED"
  SUGGESTION="Run /df-start to begin interactive setup"

  if [ -f "./kb/project.config.json" ]; then
    STATE="BRIEF_CREATED"
    SUGGESTION="Fill out kb/source/baseline/brief.md, then run /df-bootstrap (Phase 2)"

    # Check if brief looks filled out (more than just template)
    if [ -f "./kb/source/baseline/brief.md" ]; then
      BRIEF_SIZE=$(wc -l < "./kb/source/baseline/brief.md" 2>/dev/null || echo 0)
      if [ "$BRIEF_SIZE" -gt 100 ]; then
        STATE="BRIEF_READY"
        SUGGESTION="Run /df-bootstrap to begin learning (Phase 2)"
      fi
    fi
  fi

  # Check for run directories (Phase 2+)
  RUN_COUNT=$(find "./kb/wip" -maxdepth 1 -type d -name "run-*" 2>/dev/null | wc -l)
  if [ "$RUN_COUNT" -gt 0 ]; then
    STATE="LEARNING"
    SUGGESTION="Continue with /df-iterate or snapshot with /df-output"
  fi
fi

# Display status header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deepfield Knowledge Base Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Handle EMPTY state specially
if [ "$STATE" = "EMPTY" ]; then
  echo "State:          EMPTY (no kb/ directory)"
  echo ""
  echo "Next step:      $SUGGESTION"
  echo ""
  exit 0
fi

# Read project configuration if it exists
CONFIG_PATH="./kb/project.config.json"
if [ -f "$CONFIG_PATH" ]; then
  # Use read-state.js to read config
  CONFIG_JSON=$(${CLAUDE_PLUGIN_ROOT}/scripts/read-state.js "$CONFIG_PATH" '{}')

  if [ $? -eq 0 ]; then
    # Parse JSON fields (using jq or node)
    PROJECT_NAME=$(echo "$CONFIG_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).projectName || 'Not set'")
    GOAL=$(echo "$CONFIG_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).goal || 'Not set'")
    LAST_MODIFIED=$(echo "$CONFIG_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).lastModified || 'Unknown'")
  else
    echo "⚠️  Warning: Could not read project configuration" >&2
    echo "   File may be corrupted: $CONFIG_PATH" >&2
    echo "" >&2
    echo "   Suggested fix: Restore from backup or re-run /df-start" >&2
    echo "" >&2
    exit 2
  fi
fi

# Display essential information
if [ -n "$PROJECT_NAME" ]; then
  echo "Project:        $PROJECT_NAME"
fi

if [ -n "$GOAL" ]; then
  echo "Goal:           $GOAL"
fi

echo "State:          $STATE"

# Count runs (Phase 2+)
if [ "$RUN_COUNT" -gt 0 ]; then
  echo "Runs:           $RUN_COUNT completed"
fi

if [ -n "$LAST_MODIFIED" ]; then
  echo "Last modified:  $LAST_MODIFIED"
fi

echo ""
echo "Next step:      $SUGGESTION"
echo ""

# Show learning plan progress if it exists
if [ -f "./kb/wip/learning-plan.md" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Learning Progress"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Extract topic confidence from learning plan
  # Simple grep-based extraction for now
  # Format expected: "**Confidence:** 30% → 65%"

  echo "Topics by Priority:"
  echo ""

  # HIGH priority topics
  HIGH_TOPICS=$(grep -A 5 "Priority: HIGH" ./kb/wip/learning-plan.md | grep "^###" | sed 's/^### //' | sed 's/ (Priority: HIGH)//' || true)
  if [ -n "$HIGH_TOPICS" ]; then
    echo "  HIGH Priority:"
    echo "$HIGH_TOPICS" | while read topic; do
      # Extract confidence for this topic (simplified)
      CONF=$(grep -A 10 "^### $topic" ./kb/wip/learning-plan.md | grep "Confidence:" | head -1 || echo "Unknown")
      echo "    • $topic: $CONF"
    done
    echo ""
  fi

  # Count open questions
  QUESTION_COUNT=$(grep -c "^- " ./kb/wip/learning-plan.md || echo "0")
  echo "  Open Questions: $QUESTION_COUNT"
  echo ""
fi

# Verbose mode: show additional details
if [ "$VERBOSE" = true ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Detailed Information"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Show all config fields
  if [ -f "$CONFIG_PATH" ]; then
    echo "📋 Configuration (from project.config.json):"
    echo "$CONFIG_JSON" | node -pe "
      const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      Object.entries(data).map(([k,v]) =>
        '  ' + k.padEnd(15) + ': ' + (Array.isArray(v) ? JSON.stringify(v) : v)
      ).join('\\n')
    "
    echo ""
  fi

  # List source files
  echo "📁 Source Files:"
  if [ -d "./kb/source/baseline" ]; then
    BASELINE_COUNT=$(find "./kb/source/baseline" -type f 2>/dev/null | wc -l)
    echo "  Baseline:       $BASELINE_COUNT files"
  fi

  if [ -d "./kb/source" ]; then
    for RUN_DIR in ./kb/source/run-*; do
      if [ -d "$RUN_DIR" ]; then
        RUN_NAME=$(basename "$RUN_DIR")
        RUN_FILE_COUNT=$(find "$RUN_DIR" -type f 2>/dev/null | wc -l)
        echo "  $RUN_NAME:      $RUN_FILE_COUNT files"
      fi
    done
  fi
  echo ""

  # Show run history (Phase 2+)
  if [ "$RUN_COUNT" -gt 0 ]; then
    echo "🔄 Run History:"
    for RUN_DIR in ./kb/wip/run-*; do
      if [ -d "$RUN_DIR" ] && [ -f "$RUN_DIR/$(basename $RUN_DIR).config.json" ]; then
        RUN_CONFIG="$RUN_DIR/$(basename $RUN_DIR).config.json"
        RUN_INFO=$(${CLAUDE_PLUGIN_ROOT}/scripts/read-state.js "$RUN_CONFIG" '{}')
        echo "  $(basename $RUN_DIR):"
        echo "$RUN_INFO" | node -pe "
          const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
          '    Started:  ' + (data.startedAt || 'Unknown') + '\\n' +
          '    Status:   ' + (data.status || 'Unknown') + '\\n' +
          '    Files:    ' + Object.keys(data.fileHashes || {}).length + ' tracked'
        "
      fi
    done
    echo ""
  fi
fi

# State reference
if [ "$VERBOSE" = true ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Workflow States Reference"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "EMPTY            - No kb/ directory"
  echo "INITIALIZED      - kb/ exists, no configuration"
  echo "BRIEF_CREATED    - Configuration exists, brief.md generated"
  echo "BRIEF_READY      - Brief filled out, ready for learning"
  echo "RUN_0_COMPLETE   - Initial bootstrap run complete (Phase 2+)"
  echo "LEARNING         - Active learning runs (Phase 2+)"
  echo ""
fi
```

## State Detection Logic

The command infers workflow state from file existence:

| State | Condition | Next Action |
|-------|-----------|-------------|
| **EMPTY** | No `kb/` directory | Run `/df-init` |
| **INITIALIZED** | `kb/` exists, no config | Run `/df-start` |
| **BRIEF_CREATED** | Config + brief.md exist | Fill out brief.md |
| **BRIEF_READY** | Brief filled out (>100 lines) | Run `/df-bootstrap` (Phase 2) |
| **RUN_0_COMPLETE** | Run-0 directory exists | Run `/df-iterate` (Phase 2) |
| **LEARNING** | Multiple run directories | Continue learning or snapshot |

## Output Format

### Default Mode (Concise)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Deepfield Knowledge Base Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project:        Legacy Rails App
Goal:           Understand architecture and data flow
State:          BRIEF_CREATED
Last modified:  2026-02-11T18:30:00Z

Next step:      Fill out kb/source/baseline/brief.md, then run /df-bootstrap
```

### Verbose Mode (--verbose)

Adds:
- All configuration fields from project.config.json
- Source file counts (baseline and per-run)
- Run history with timestamps and status
- Workflow states reference

## Error Handling

### Missing State Files

If project.config.json is missing:
- Show basic state from directory structure
- Display warning about missing config
- Suggest recovery steps

### Corrupted State Files

If JSON parsing fails:
- Display error with file path
- Suggest fix (restore from backup, re-init)
- Exit with code 2

### No kb/ Directory

If kb/ doesn't exist:
- Display EMPTY state
- Suggest running `/df-init`
- Exit normally (code 0)

## State Transitions

This is a read-only command. It doesn't change state, only reports it.

## Files Read

- `kb/project.config.json` (if exists)
- `kb/wip/run-N/run-N.config.json` (if exists, for run history)
- Directory structure (to detect state)

## Files Modified

None (read-only command)
