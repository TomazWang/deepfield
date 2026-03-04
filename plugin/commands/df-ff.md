---
name: df-ff
description: Fast-forward autonomous learning — run multiple iterations without user intervention until confidence thresholds are met or limits are reached
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
arguments:
  - name: --max-runs
    description: Maximum number of iterations to execute in this session (default: 10, hard cap: 50)
    required: false
  - name: --min-confidence
    description: Minimum confidence percentage for HIGH-priority topics to achieve before stopping (default: 80)
    required: false
  - name: --domains
    description: Comma-separated domain names to focus on, e.g. --domains auth,api (default: all domains)
    required: false
  - name: --stop-on-blocked
    description: Stop if all high-priority topics in scope are blocked waiting for sources (default: false)
    required: false
  - name: --feedback-at-end
    description: Prompt for feedback review after all runs complete (default: true). Pass --feedback-at-end false to suppress.
    required: false
---

# /df-ff - Fast-Forward Autonomous Learning

Run multiple learning iterations autonomously without stopping for user feedback between runs. Continues until confidence thresholds are met, max runs are hit, or other stop conditions fire.

## Use Cases

- **Well-documented projects**: Run until high confidence is achieved without manual intervention
- **Batch learning**: Fire-and-forget during lunch or overnight, review results once
- **CI/CD**: Automated knowledge base updates when code changes

## Comparison with /df-iterate

| Command | Runs | User Feedback | Stop Condition |
|---------|------|---------------|----------------|
| `/df-iterate` | 1 | After each run | Manual |
| `/df-ff` | Multiple | At end only | Confidence / auto |

## Usage Examples

```bash
# Run up to 10 iterations (default), stop when 80% confidence reached
/df-ff

# Run up to 5 iterations, stop when 85% confidence reached
/df-ff --max-runs 5 --min-confidence 85

# Focus only on auth and api domains
/df-ff --domains auth,api

# Stop immediately if blocked, no feedback prompt at end
/df-ff --stop-on-blocked --feedback-at-end false

# Long batch run with custom threshold
/df-ff --max-runs 20 --min-confidence 90
```

## Prerequisites

Before running, verify ALL of the following:

1. **deepfield/ directory exists** in the current working directory
2. **Bootstrap (Run 0) is complete**: `deepfield/wip/run-0/run-0.config.json` exists
3. **Learning plan exists**: `deepfield/wip/learning-plan.md`

If any prerequisite fails, display a clear error and suggest the correct command.

## Implementation

### Step 1: Validate Prerequisites

```bash
#!/usr/bin/env bash
set -euo pipefail

# Check deepfield directory
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

# Check Run 0 completed
if [ ! -f "./deepfield/wip/run-0/run-0.config.json" ]; then
  echo "Bootstrap (Run 0) not complete. Run /df-continue first."
  exit 1
fi

# Check learning plan
if [ ! -f "./deepfield/wip/learning-plan.md" ]; then
  echo "No learning plan found. Bootstrap may have failed. Check /df-status."
  exit 1
fi
```

### Step 2: Parse Arguments

Parse the following arguments with defaults:

```bash
MAX_RUNS=10
MIN_CONFIDENCE=80
DOMAINS=""
STOP_ON_BLOCKED=false
FEEDBACK_AT_END=true

for arg in "$@"; do
  case $arg in
    --max-runs=*)
      MAX_RUNS="${arg#*=}"
      ;;
    --max-runs)
      # handled as next argument
      ;;
    --min-confidence=*)
      MIN_CONFIDENCE="${arg#*=}"
      ;;
    --min-confidence)
      # handled as next argument
      ;;
    --domains=*)
      DOMAINS="${arg#*=}"
      ;;
    --domains)
      # handled as next argument
      ;;
    --stop-on-blocked)
      STOP_ON_BLOCKED=true
      ;;
    --feedback-at-end)
      FEEDBACK_AT_END=true
      ;;
    --feedback-at-end=false|--no-feedback-at-end)
      FEEDBACK_AT_END=false
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo ""
      echo "Usage: /df-ff [--max-runs N] [--min-confidence N] [--domains list] [--stop-on-blocked] [--feedback-at-end false]"
      exit 1
      ;;
  esac
done
```

### Step 3: Validate Argument Values

```bash
# Hard cap: max-runs cannot exceed 50
if [ "$MAX_RUNS" -gt 50 ]; then
  echo "Warning: --max-runs capped at 50 (requested: $MAX_RUNS)"
  MAX_RUNS=50
fi

# Safety warning for large runs
if [ "$MAX_RUNS" -gt 20 ]; then
  echo "Note: Running $MAX_RUNS iterations may take significant time."
  echo "Press Ctrl+C to cancel at any time (completed runs will be preserved)."
  echo ""
fi

# Validate min-confidence is 0-100
if [ "$MIN_CONFIDENCE" -lt 0 ] || [ "$MIN_CONFIDENCE" -gt 100 ]; then
  echo "Error: --min-confidence must be between 0 and 100 (got: $MIN_CONFIDENCE)" >&2
  exit 1
fi
```

### Step 4: Print Start Summary

Before delegating to the skill, print a clear summary of what will run:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/df-ff  Fast-Forward Learning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Configuration:
  Max runs:       [MAX_RUNS]
  Min confidence: [MIN_CONFIDENCE]%
  Domains:        [DOMAINS or "all"]
  Stop on blocked:[STOP_ON_BLOCKED]
  Feedback at end:[FEEDBACK_AT_END]

Starting autonomous learning loop...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5: Invoke deepfield-ff Skill

Delegate all learning orchestration to the `deepfield-ff` skill. Pass all parsed parameters:

```
Invoke skill: deepfield-ff
Parameters:
  - max-runs: ${MAX_RUNS}
  - min-confidence: ${MIN_CONFIDENCE}
  - domains: ${DOMAINS} (empty = all)
  - stop-on-blocked: ${STOP_ON_BLOCKED}
  - feedback-at-end: ${FEEDBACK_AT_END}
```

The skill handles all learning logic, stop condition evaluation, progress reporting, staging area creation, and the final summary report.

## Error Messages

| Condition | Message |
|-----------|---------|
| No `deepfield/` directory | `No deepfield/ directory found. Run /df-init first.` |
| No Run 0 | `Bootstrap (Run 0) not complete. Run /df-continue first.` |
| No learning plan | `No learning plan found. Bootstrap may have failed. Check /df-status.` |
| Unknown argument | `Unknown argument: <arg>` + usage line |
| max-runs > 50 | `Warning: --max-runs capped at 50 (requested: N)` |
| min-confidence out of range | `Error: --min-confidence must be between 0 and 100 (got: N)` |

## Stop Conditions (handled by skill)

The skill stops when ANY of these fire (in evaluation order):

1. **CONFIDENCE_REACHED**: All HIGH-priority topics (in scoped domains) >= min-confidence
2. **MAX_RUNS_HIT**: Session has executed max-runs iterations
3. **DIMINISHING_RETURNS**: 2+ consecutive runs with < 5% net confidence change
4. **BLOCKED**: All HIGH-priority topics blocked AND --stop-on-blocked is set
5. **DOMAIN_RESTRUCTURE**: Domain count changed by > 3 since session start

## Relationship to Other Commands

- **`/df-continue`**: Smart router — detects state and routes to appropriate action. Use when unsure what to do next.
- **`/df-iterate`**: Single autonomous learning cycle with stop condition evaluation. Use for step-by-step control.
- **`/df-ff`**: Multi-run batch mode. Use when you want to run many cycles without intervention.
- **`/df-status`**: Check current confidence levels and learning plan state.
- **`/df-output`**: Snapshot drafts to versioned output after learning is complete.

## Tips for Claude

- Always validate prerequisites before invoking the skill — do not silently skip validation
- Print the start summary clearly so users know what configuration is active
- If the user seems confused about when to use /df-ff vs /df-iterate, explain: /df-ff is for batch runs, /df-iterate is for step-by-step control
- After completion, if stop reason is CONFIDENCE_REACHED, proactively suggest `/df-output` to snapshot the knowledge
- If user cancels mid-session (Ctrl+C), note that all completed runs are preserved in `deepfield/wip/run-N/`
