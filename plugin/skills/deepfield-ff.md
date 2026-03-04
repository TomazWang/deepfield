---
name: Deepfield Fast-Forward
description: Autonomous multi-run learning loop — runs multiple iterations without user feedback between runs, stopping when confidence thresholds or safety limits are reached
trigger_mode: command
user_invocable: false
---

# Purpose

This skill orchestrates multiple autonomous learning iterations (fast-forward mode) without pausing for user feedback between runs. It invokes the `deepfield-iterate` skill logic in single-run mode repeatedly, evaluating stop conditions after each run, until any stop condition fires.

# Input Parameters

This skill receives the following parameters from the `/df-ff` command:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-runs` | integer | 10 | Maximum iterations to execute in this session (hard cap: 50) |
| `min-confidence` | integer | 80 | Minimum confidence % for HIGH-priority topics to achieve |
| `domains` | string[] | [] (all) | Domain names to focus on; empty = all domains |
| `stop-on-blocked` | boolean | false | Stop if all high-priority scoped topics are blocked |
| `feedback-at-end` | boolean | true | Prompt for feedback after all runs complete |

# Prerequisites

Before starting the loop, verify these are satisfied (the `/df-ff` command validates these, but double-check):

1. `deepfield/` directory exists
2. `deepfield/wip/run-0/run-0.config.json` exists (bootstrap complete)
3. `deepfield/wip/learning-plan.md` exists

# Phase 0: Domain Filter Validation

If `--domains` filter was provided, validate domain names against the domain index.

## Read Domain Index

```bash
# Check domain index exists
if [ -f "./deepfield/wip/domain-index.md" ]; then
  # Extract domain names from domain-index.md
  # Domains are listed as headings: ## Domain: auth or ## auth
  grep -i "^##" ./deepfield/wip/domain-index.md
fi
```

## Validate Each Specified Domain

For each domain name in the filter:

1. Check if it appears (case-insensitive substring match) in domain-index.md
2. If no match found: print warning `"Domain 'xyz' not found in domain index. Known domains: <list>"`
3. Remove unknown domains from filter, keep valid ones
4. If ALL specified domains are unknown (no valid domains remain):
   - Print error: `"No valid domains found matching filter. Check /df-status for domain list."`
   - Exit without running any iterations

# Phase 1: Session Initialization

## Record Session Start State

Before the loop begins, record the starting confidence of all topics using the confidence script:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/check-confidence.js ./deepfield \
  $([ -n "$DOMAINS" ] && echo "--domains $DOMAINS") \
  --threshold $MIN_CONFIDENCE
```

Parse the JSON output to get the starting confidence baseline for the final report.

## Initialize Session Counters

```
sessionRunCount = 0
sessionStartRun = <current highest run number + 1>
sessionStartDomainCount = <count of domains in domain-index.md>
previousRunConfidenceNet = null
twoRunsLowProgress = false
```

# Phase 2: Fast-Forward Loop

```
While sessionRunCount < max-runs:
  1. Execute single learning iteration (Run N)
  2. Print per-run progress line
  3. Evaluate stop conditions
  4. If any stop condition fires → break with stopReason
  5. sessionRunCount++
  6. Continue
```

## Step 2A: Execute Single Learning Iteration

Invoke the `deepfield-iterate` skill in **single-run mode** (`--once`):

- If `domains` filter is set, pass `--focus=<primary-domain>` (first domain in filter)
- The iterate skill handles: scanning, learning, synthesis, run config update, learning plan update
- Do NOT pause for user feedback — proceed immediately after the run completes

**IMPORTANT**: In fast-forward mode, suppress all interactive prompts. After each run, read the updated run config to get results rather than waiting for user input.

After the run completes, read the new run config to get confidence changes:

```javascript
// Find the newly completed run config
const latestRunConfig = findLatestRunConfig('./deepfield/wip/')
const confidenceChanges = latestRunConfig.confidenceChanges || {}
```

## Step 2B: Print Per-Run Progress Line

After each run completes, print a compact progress line:

```
Run N complete | Authentication: 65%→85% | API Structure: 50%→70% | Data Flow: 30%→50%
```

Format:
```
Run <N> complete | <topic1>: <before>%→<after>% | <topic2>: <before>%→<after>% | ...
```

If no confidence changes were recorded, print:
```
Run <N> complete | (no confidence data recorded)
```

## Step 2C: Evaluate Stop Conditions

After each run, evaluate conditions in this order:

### Stop Condition 1: CONFIDENCE_REACHED

```bash
# Run confidence check
CONFIDENCE_JSON=$(node ${CLAUDE_PLUGIN_ROOT}/scripts/check-confidence.js \
  ./deepfield \
  $([ -n "$DOMAINS" ] && echo "--domains $DOMAINS") \
  --threshold $MIN_CONFIDENCE)

THRESHOLD_MET=$(echo $CONFIDENCE_JSON | node -e "
  let d=''; process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>console.log(JSON.parse(d).thresholdMet))
")

if [ "$THRESHOLD_MET" = "true" ]; then
  STOP_REASON="CONFIDENCE_REACHED"
  break
fi
```

### Stop Condition 2: MAX_RUNS_HIT

```javascript
if (sessionRunCount >= maxRuns) {
  stopReason = "MAX_RUNS_HIT"
  break
}
```

(Evaluated after incrementing sessionRunCount at end of loop iteration)

### Stop Condition 3: DIMINISHING_RETURNS

After each run, compute total net confidence change across all focus topics:

```javascript
const netChange = Object.values(confidenceChanges).reduce((sum, c) => {
  return sum + ((c.after || 0) - (c.before || 0))
}, 0)

// If this run had < 5% net change
const lowProgress = netChange < 5

if (lowProgress && previousRunWasLowProgress) {
  stopReason = "DIMINISHING_RETURNS"
  break
}

previousRunWasLowProgress = lowProgress
```

### Stop Condition 4: BLOCKED (only if --stop-on-blocked)

Only evaluated when `stop-on-blocked` parameter is true:

```javascript
if (stopOnBlocked) {
  const highPriorityTopics = learningPlan.topics.filter(t => t.priority === "HIGH")
  const scopedTopics = domainsFilter.length > 0
    ? highPriorityTopics.filter(t => domainsFilter.some(d => t.name.toLowerCase().includes(d)))
    : highPriorityTopics

  const allBlocked = scopedTopics.length > 0 && scopedTopics.every(t => t.status === "blocked")

  if (allBlocked) {
    stopReason = "BLOCKED"
    break
  }
}
```

### Stop Condition 5: DOMAIN_RESTRUCTURE

```javascript
const currentDomainCount = countDomainsInIndex('./deepfield/wip/domain-index.md')

if (Math.abs(currentDomainCount - sessionStartDomainCount) > 3) {
  stopReason = "DOMAIN_RESTRUCTURE"
  break
}
```

# Phase 3: On Loop Exit

## Step 3A: Create Staging Area

**CRITICAL: Always create the next staging area regardless of stop reason.**

After the loop exits, determine the next run number (last completed run + 1) and create the staging area:

```bash
LAST_RUN_N=<last completed run number>
NEXT_STAGING=$((LAST_RUN_N + 1))

mkdir -p "./deepfield/source/run-${NEXT_STAGING}-staging/sources"
```

### Write README.md

Create `deepfield/source/run-${NEXT_STAGING}-staging/README.md`:

```markdown
# Run ${NEXT_STAGING} Staging Area

This is where you add new sources and feedback for the next learning run.

## How to use

1. Drop new source files into the `sources/` subdirectory
2. Edit `feedback.md` to answer open questions or provide guidance
3. Run `/df-continue` when ready to resume learning

## What was learned in the last fast-forward session

<brief summary of what the ff session covered and its stop reason>
```

### Write feedback.md

Create `deepfield/source/run-${NEXT_STAGING}-staging/feedback.md` populated with:
- Open questions from the current learning plan
- Topics that need more focus (low confidence)
- Specific sources that would help
- Any contradictions to clarify

Read these from `deepfield/wip/learning-plan.md` to populate the template.

## Step 3B: Print Final Summary Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fast-Forward Learning Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Runs Executed: [N] runs (Run [X] through Run [Y])
Stop Reason:   [REASON] — [explanation]

Progress Summary:

Topic                    Before → After  Status
─────────────────────────────────────────────────
Authentication           65%   → 85%    ✓ (target: 80%)
API Structure            50%   → 70%    ↑
Data Flow                30%   → 50%    ↑
Background Jobs          15%   → 15%    · (not focused)

HIGH Priority Complete: [X]/[Y] topics >= [min-confidence]%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation Updated:
  deepfield/drafts/domains/<updated files>

Next Steps:
[stop-reason-specific section — see below]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Next Steps by Stop Reason

**CONFIDENCE_REACHED:**
```
All HIGH priority topics have reached the target confidence of [min-confidence]%.

  /df-output     Snapshot knowledge to versioned output
  /df-status     Review detailed progress
  /df-continue   Continue with MEDIUM priority topics
```

**MAX_RUNS_HIT:**
```
Paused after [N] runs (limit: [max-runs]).

Good progress made! To continue learning:
  1. Review:  deepfield/drafts/ — Updated documentation
  2. Review:  deepfield/wip/learning-plan.md — Current state
  3. Add feedback or sources to:
               deepfield/source/run-[N+1]-staging/

  Then run /df-continue to resume
  Or run /df-ff --max-runs [n] to run more iterations
```

**DIMINISHING_RETURNS:**
```
Minimal progress detected in the last 2 runs (<5% confidence change each).

Suggestions to break the plateau:
  - Add new sources with different perspectives
  - Review:   deepfield/drafts/cross-cutting/unknowns.md
  - Consider adjusting focus with --domains flag
  - Snapshot current knowledge: /df-output
```

**BLOCKED:**
```
Blocked: All HIGH-priority topics need additional sources.

Missing sources for blocked topics:
  [list of topics and their needed sources from learning plan]

Add sources to:
  deepfield/source/run-[N+1]-staging/sources/

Then run /df-continue
```

**DOMAIN_RESTRUCTURE:**
```
Major domain changes detected (domain count shifted by >3).

Domain structure has changed significantly.
Please review and confirm:
  deepfield/wip/domain-index.md

Then run /df-continue to resume with updated structure.
```

## Step 3C: Feedback Collection Prompt (if feedback-at-end=true)

If `feedback-at-end` is true (default), after the summary report, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review & Feedback

Please review the updated documentation in deepfield/drafts/
and add any feedback or new sources to:

  deepfield/source/run-[N+1]-staging/feedback.md
  deepfield/source/run-[N+1]-staging/sources/

Run /df-continue when ready for the next session.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If `feedback-at-end` is false, skip this prompt and end silently after the summary.

# Error Handling

## Iterate Skill Failure

If an individual run fails (agent error, script error, etc.):
- Mark the run as failed in its config
- Do NOT continue to next run
- Print:
  ```
  Run [N] failed: [error details]

  The fast-forward session has been paused. Partial results are in:
    deepfield/wip/run-[N]/

  Fix the issue and retry with /df-ff or continue with /df-continue.
  ```

## Confidence Script Failure

If `check-confidence.js` fails:
- Treat confidence as 0 (threshold not met)
- Log a warning: `"Warning: Could not compute confidence scores. Continuing..."`
- Do NOT stop the loop due to script failure alone
- Diminishing returns check uses 0 as the net change for that run

## No Topics in Domain Filter

Already handled in Phase 0 — exit before loop starts.

# Implementation Notes for Claude

- **No interactive prompts between runs**: Do not ask the user anything mid-loop. Read state from files, proceed autonomously.
- **Progress visibility**: Print each run's progress line immediately after completion — users watching the session should see activity.
- **State preservation**: Each run's results are in `deepfield/wip/run-N/`. Even if the ff session is cancelled mid-run, previous runs are preserved.
- **Confidence data source**: Always use `check-confidence.js` output for stop condition 1. For diminishing returns, use the raw `confidenceChanges` from the run config JSON directly.
- **Loop counter**: `sessionRunCount` is the number of runs completed in *this ff session*, not the global run number.
- **Safety warning**: If `max-runs > 20`, print a warning at session start: `"Note: Running [max-runs] iterations may take significant time. Press Ctrl+C to cancel at any time."`
