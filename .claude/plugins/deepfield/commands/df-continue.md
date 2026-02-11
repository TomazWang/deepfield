---
name: df-continue
description: Context-aware progression - do the next right thing for your knowledge base
arguments:
  - name: --once
    description: Run single iteration instead of autonomous loop
    required: false
  - name: --focus
    description: Focus on specific domain (future enhancement)
    required: false
---

# /df-continue - Context-Aware Progression

The main command for progressing through the Deepfield workflow. Detects current state and automatically does the right next action.

## What This Does

This command is context-aware - it figures out what state you're in and does the appropriate next action:

- **EMPTY**: Error (need to run /df-init)
- **INITIALIZED**: Starts interactive setup (launches /df-start)
- **BRIEF_CREATED**: Prompts to fill out brief.md
- **BRIEF_READY**: Runs bootstrap (Run 0)
- **LEARNING + new input**: Runs autonomous iteration
- **LEARNING + no input**: Prompts to add sources
- **COMPLETE**: Suggests next options

## Usage

```bash
/df-continue              # Auto-detect state and proceed
/df-continue --once       # Single run mode (no autonomous loop)
/df-continue --focus=api  # Focus on specific domain (future)
```

## Implementation

```bash
#!/usr/bin/env bash

set -euo pipefail

# Get script directory for accessing other scripts
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLUGIN_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Parse arguments
ONCE_MODE=false
FOCUS_DOMAIN=""

for arg in "$@"; do
  case $arg in
    --once)
      ONCE_MODE=true
      ;;
    --focus=*)
      FOCUS_DOMAIN="${arg#*=}"
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: /df-continue [--once] [--focus=domain]" >&2
      exit 1
      ;;
  esac
done

# Detect current state
detect_state() {
  # EMPTY: No kb/ directory
  if [ ! -d "./kb" ]; then
    echo "EMPTY"
    return
  fi

  # INITIALIZED: kb/ exists but no config
  if [ ! -f "./kb/project.config.json" ]; then
    echo "INITIALIZED"
    return
  fi

  # BRIEF_CREATED: config exists but brief is empty/incomplete
  if [ ! -f "./kb/source/baseline/brief.md" ]; then
    echo "BRIEF_CREATED"
    return
  fi

  # Check if brief is filled out (heuristic: >50 lines)
  BRIEF_LINES=$(wc -l < "./kb/source/baseline/brief.md" 2>/dev/null || echo 0)
  if [ "$BRIEF_LINES" -lt 50 ]; then
    echo "BRIEF_CREATED"
    return
  fi

  # BRIEF_READY: brief filled but no Run 0
  if [ ! -d "./kb/wip/run-0" ]; then
    echo "BRIEF_READY"
    return
  fi

  # LEARNING: Run 0 exists, learning in progress
  # Check if learning plan is complete
  if [ -f "./kb/wip/learning-plan.md" ]; then
    # Simple check: look for "Status: Complete" in learning plan
    if grep -q "Status:.*Complete" "./kb/wip/learning-plan.md" 2>/dev/null; then
      echo "COMPLETE"
      return
    fi
  fi

  # Default: LEARNING
  echo "LEARNING"
}

STATE=$(detect_state)

echo "Current state: $STATE"
echo ""

# Route based on state
case $STATE in
  EMPTY)
    echo "❌ Error: No knowledge base found"
    echo ""
    echo "Please run /df-init first to initialize the kb/ structure."
    exit 1
    ;;

  INITIALIZED)
    echo "📝 Starting interactive setup..."
    echo ""
    # Invoke df-start skill (will be created/updated)
    # For now, direct user to run df-start
    echo "Please run /df-start to begin interactive setup."
    echo ""
    echo "This will:"
    echo "  - Ask you questions about your project"
    echo "  - Generate a brief.md template for you to fill out"
    echo "  - Set up project configuration"
    exit 0
    ;;

  BRIEF_CREATED)
    echo "📋 Brief needs to be filled out"
    echo ""
    echo "Please fill out the project brief at:"
    echo "  kb/source/baseline/brief.md"
    echo ""
    echo "The brief should include:"
    echo "  - Repository URLs and branches"
    echo "  - Key documents and wikis"
    echo "  - Areas of focus"
    echo "  - Project goals"
    echo ""
    echo "Once complete, run /df-continue again to begin bootstrap."
    exit 0
    ;;

  BRIEF_READY)
    echo "🚀 Running bootstrap (Run 0)..."
    echo ""
    echo "This will:"
    echo "  - Classify and organize sources"
    echo "  - Clone repositories"
    echo "  - Scan project structure"
    echo "  - Detect domains"
    echo "  - Generate learning plan"
    echo ""

    # Invoke deepfield-bootstrap skill
    # This would launch the skill via Claude Code's skill system
    # For now, show what would happen
    echo "Invoking deepfield-bootstrap skill..."
    echo ""
    echo "⚠️  Bootstrap skill invocation not yet implemented"
    echo "    (This is where the skill would be launched)"
    exit 1
    ;;

  LEARNING)
    # Check for new input in staging area
    CURRENT_RUN=$(find ./kb/wip -maxdepth 1 -type d -name "run-*" | wc -l)
    NEXT_RUN=$((CURRENT_RUN + 1))
    STAGING_DIR="./kb/source/run-${NEXT_RUN}-staging"

    HAS_NEW_INPUT=false
    if [ -d "$STAGING_DIR" ]; then
      # Check if staging has content
      FILE_COUNT=$(find "$STAGING_DIR" -type f | wc -l)
      if [ "$FILE_COUNT" -gt 2 ]; then  # More than just README and feedback.md
        HAS_NEW_INPUT=true
      fi
    fi

    if [ "$HAS_NEW_INPUT" = true ]; then
      echo "🔄 Continuing learning (new input detected)..."
      echo ""

      if [ "$ONCE_MODE" = true ]; then
        echo "Mode: Single run (--once)"
      else
        echo "Mode: Autonomous (will run until stop condition)"
      fi

      echo ""
      echo "Invoking deepfield-iterate skill..."
      echo ""
      echo "⚠️  Iterate skill invocation not yet implemented"
      echo "    (This is where the skill would be launched)"
      exit 1
    else
      echo "⏸️  Learning paused - No new input"
      echo ""
      echo "Add feedback or sources to continue:"
      echo "  $STAGING_DIR/feedback.md"
      echo "  $STAGING_DIR/sources/"
      echo ""
      echo "Or check current state:"
      echo "  /df-status"
      exit 0
    fi
    ;;

  COMPLETE)
    echo "🎉 Learning plan complete!"
    echo ""
    echo "All HIGH priority topics have reached target confidence."
    echo ""
    echo "Next options:"
    echo ""
    echo "  /df-distill"
    echo "    Snapshot current knowledge to versioned output"
    echo ""
    echo "  /df-continue"
    echo "    Continue with MEDIUM priority topics"
    echo ""
    echo "  /df-restart"
    echo "    Regenerate learning plan and start fresh"
    echo ""
    echo "  /df-status"
    echo "    Review detailed progress"
    exit 0
    ;;

  *)
    echo "❌ Error: Unknown state: $STATE"
    exit 1
    ;;
esac
```

## State Detection Logic

| State | Conditions | Action |
|-------|-----------|---------|
| **EMPTY** | No `kb/` directory | Error: run /df-init |
| **INITIALIZED** | `kb/` exists, no `project.config.json` | Launch /df-start |
| **BRIEF_CREATED** | Config exists, brief empty (<50 lines) | Prompt to fill brief |
| **BRIEF_READY** | Brief filled, no run-0/ | Launch bootstrap skill |
| **LEARNING + new input** | Run-N-staging has files | Launch iterate skill |
| **LEARNING + no input** | Run-N-staging empty | Prompt to add sources |
| **COMPLETE** | Learning plan status "Complete" | Suggest next actions |

## Error Handling

### No kb/ Directory
```
Error: No knowledge base found

Please run /df-init first to initialize the kb/ structure.
```

### Brief Not Filled
```
Brief needs to be filled out

Please fill out the project brief at:
  kb/source/baseline/brief.md

Once complete, run /df-continue again.
```

### No New Input
```
Learning paused - No new input

Add feedback or sources to continue:
  kb/source/run-3-staging/feedback.md
  kb/source/run-3-staging/sources/

Or check current state: /df-status
```

## Integration with Skills

When state is BRIEF_READY:
- Invoke: `deepfield-bootstrap` skill
- Wait for completion
- Display results

When state is LEARNING + new input:
- Invoke: `deepfield-iterate` skill
- Pass `--once` flag if specified
- Pass `--focus` domain if specified
- Wait for completion
- Display results

## Future Enhancements

### --focus Flag
```bash
/df-continue --focus=authentication
```
Would pass focus to iterate skill to concentrate on specific domain.

### --auto Flag (Alias)
```bash
/df-continue --auto
```
Same as default behavior (autonomous loop).

## Testing

Test each state transition:
1. EMPTY → error message
2. INITIALIZED → prompt for /df-start
3. BRIEF_CREATED → prompt to fill brief
4. BRIEF_READY → bootstrap invocation
5. LEARNING + input → iterate invocation
6. LEARNING + no input → prompt for sources
7. COMPLETE → suggest options
