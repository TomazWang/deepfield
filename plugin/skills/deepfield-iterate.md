---
name: Deepfield Iterate
description: Autonomous learning loop - Run N iterations with stop condition evaluation
trigger_mode: command
user_invocable: false
---

# Purpose

This skill orchestrates autonomous learning iterations (Run N, N+1, N+2...) that continue until stop conditions are met. Each iteration focuses on topics from the learning plan, performs incremental scanning, deep reads code, synthesizes knowledge, and updates the learning plan.

# When to Use

Invoke this skill when:
- Bootstrap (Run 0) is complete
- User runs `/df-continue` from LEARNING or PAUSED state
- New sources have been added to staging area
- User wants to continue autonomous learning

# Prerequisites

Before running, verify:
1. Bootstrap complete (Run 0 exists)
2. Learning plan exists (`deepfield/wip/learning-plan.md`)
3. Project config has maxRuns setting
4. Previous run completed successfully

# Autonomous Loop Structure

```
While should_continue:
  1. Run N: Execute single learning iteration
  2. Evaluate stop conditions
  3. If should_continue:
       N++
       Continue loop
     Else:
       Create staging area
       Report and exit
```

# Single Run Workflow (Run N)

## Pre-Run Setup

### 1. Determine Run Number

```javascript
// Check existing runs
const runs = glob('deepfield/wip/run-*/')
const runNumbers = runs.map(r => parseInt(r.match(/run-(\d+)/)[1]))
const nextRun = Math.max(...runNumbers) + 1
```

### 2. Create Run Directory

```bash
mkdir -p deepfield/wip/run-${nextRun}/domains
```

### 3. Initialize Run Config

Create `deepfield/wip/run-${nextRun}/run-${nextRun}.config.json`:
```json
{
  "runNumber": ${nextRun},
  "startedAt": "<ISO-timestamp>",
  "status": "in-progress",
  "focusTopics": [],
  "fileHashes": {},
  "confidenceChanges": {}
}
```

## Step 1: Load Context

### Read Learning Plan

Load `deepfield/wip/learning-plan.md`:
- Current confidence levels per topic
- Open questions
- Priorities
- Previous run summary

### Read Previous Run

Load `deepfield/wip/run-${nextRun-1}/run-${nextRun-1}.config.json`:
- Previous file hashes
- Focus topics
- Confidence changes

### Check for New User Input

Check if `deepfield/source/run-${nextRun}-staging/` exists with content:
- Read `feedback.md` if present
- List new sources in `sources/` directory
- Classify new sources via classifier agent
- File new sources appropriately

## Step 2: Select Focus Topics

From learning plan, select 1-3 focus topics:

### Selection Criteria

1. **Highest priority** (HIGH before MEDIUM before LOW)
2. **Lowest confidence** among same priority
3. **Related topics** (select topics that connect)
4. **User feedback** (prioritize topics user mentioned)

### Example Selection

Learning plan has:
- Authentication (HIGH, 65%)
- API Structure (HIGH, 50%)
- Data Flow (MEDIUM, 30%)

**Select:** API Structure (HIGH + lowest) + Data Flow (related to API)

### Update Run Config

```json
{
  "focusTopics": ["API Structure", "Data Flow"]
}
```

## Step 3: Incremental Scanning

### Compute Current File Hashes

For each baseline repository:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/hash-files.js \
  ./deepfield/source/baseline/repos/<repo-name> \
  --output ./deepfield/wip/run-${nextRun}/hashes-<repo-name>.json
```

### Compare with Previous Run

```javascript
const prevHashes = readJSON(`deepfield/wip/run-${nextRun-1}/hashes-*.json`)
const currHashes = readJSON(`deepfield/wip/run-${nextRun}/hashes-*.json`)

const changed = []
const new_files = []

for (const [file, hash] of Object.entries(currHashes)) {
  if (!prevHashes[file]) {
    new_files.push(file)
  } else if (prevHashes[file] !== hash) {
    changed.push(file)
  }
}
```

### Filter by Focus Topics

Only include files relevant to focus topics:
- Check file paths for focus-related keywords
- Use domain mapping from domain-index.md
- Include cross-cutting files (shared, common, utils)

### Files to Read

```javascript
const filesToRead = [
  ...new_files,           // All new files
  ...changed,             // All changed files
  ...focusRelevant        // Unchanged but relevant to focus
]
```

## Step 4: Deep Learning

### Invoke Learner Agent

```
Launch: deepfield-learner
Input: {
  "focus_topics": ["API Structure", "Data Flow"],
  "files_to_read": filesToRead,
  "previous_findings": "deepfield/wip/run-${nextRun-1}/findings.md",
  "domain_notes": "deepfield/wip/domains/*.md",
  "current_drafts": "deepfield/drafts/domains/*.md",
  "open_questions": <from learning plan>
}
```

### Process Learner Output

Learner writes findings to `deepfield/wip/run-${nextRun}/findings.md`:
- Discoveries about focus topics
- Cross-references and relationships
- Patterns observed
- Contradictions detected
- Questions answered
- New questions raised

## Step 5: Synthesize Knowledge

### Invoke Knowledge Synthesizer Agent

```
Launch: deepfield-knowledge-synth
Input: {
  "findings": "deepfield/wip/run-${nextRun}/findings.md",
  "existing_drafts": "deepfield/drafts/domains/*.md",
  "unknowns": "deepfield/drafts/cross-cutting/unknowns.md",
  "changelog": "deepfield/drafts/_changelog.md"
}
```

### Process Synthesis Output

Synthesizer updates:
- `deepfield/drafts/domains/<topic>.md` - Updated with new knowledge
- `deepfield/drafts/cross-cutting/unknowns.md` - Add/remove unknowns
- `deepfield/drafts/_changelog.md` - Append run summary

## Step 6: Update Learning Plan

### Calculate Confidence Changes

Based on findings and synthesis:
- Significant progress: +20-40%
- Moderate progress: +10-20%
- Light progress: +5-10%
- Contradiction found: -10 to -20%

### Update Plan

For each focus topic:
1. Update confidence level
2. Mark answered questions
3. Add newly raised questions
4. Update needed sources
5. Adjust priorities if dependencies discovered

### Reprioritize if Needed

```
If dependency discovered:
  - Increase dependency topic priority
  - May need to reorder upcoming focus
```

### Write Updated Plan

Overwrite `deepfield/wip/learning-plan.md` with updated plan.

## Step 7: Finalize Run

### Update Run Config

```json
{
  "runNumber": ${nextRun},
  "startedAt": "<ISO-timestamp>",
  "completedAt": "<ISO-timestamp>",
  "status": "completed",
  "focusTopics": ["API Structure", "Data Flow"],
  "fileHashes": { <merged-hashes> },
  "confidenceChanges": {
    "API Structure": { "before": 50, "after": 70 },
    "Data Flow": { "before": 30, "after": 50 }
  }
}
```

### Update Project Config

```json
{
  "lastModified": "<ISO-timestamp>",
  "currentRun": ${nextRun},
  "totalRuns": ${nextRun + 1}
}
```

## Step 8: Evaluate Stop Conditions

Check if autonomous execution should continue:

### Stop Condition 1: Plan Complete

```javascript
const highPriorityTopics = learningPlan.topics.filter(t => t.priority === "HIGH")
const allHighComplete = highPriorityTopics.every(t => t.confidence > 80)

if (allHighComplete) {
  stopReason = "PLAN_COMPLETE"
  shouldContinue = false
}
```

### Stop Condition 2: Max Runs Reached

```javascript
const maxRuns = projectConfig.maxRuns || 5
const consecutiveRuns = nextRun - lastUserInteractionRun

if (consecutiveRuns >= maxRuns) {
  stopReason = "MAX_RUNS"
  shouldContinue = false
}
```

### Stop Condition 3: Blocked on Sources

```javascript
const allHighTopicsBlocked = highPriorityTopics.every(t =>
  t.status === "blocked" || t.neededSources.length > 0
)

if (allHighTopicsBlocked && noNewSources) {
  stopReason = "BLOCKED"
  shouldContinue = false
}
```

### Stop Condition 4: Diminishing Returns

```javascript
const recentRuns = [run-N, run-N-1]
const minimalProgress = recentRuns.every(r =>
  Object.values(r.confidenceChanges).every(c => c.after - c.before < 5)
)

if (minimalProgress && recentRuns.length >= 2) {
  stopReason = "DIMINISHING_RETURNS"
  shouldContinue = false
}
```

### Stop Condition 5: Major Domain Restructure

```javascript
const domainCountChanged = Math.abs(
  currentDomainCount - previousDomainCount
) > 3

if (domainCountChanged) {
  stopReason = "DOMAIN_RESTRUCTURE"
  shouldContinue = false
}
```

### Decision

```javascript
if (shouldContinue) {
  // Increment run number and loop
  nextRun++
  continue
} else {
  // Create staging area and exit
  createStagingArea(nextRun + 1)
  reportCompletion(stopReason)
  exit
}
```

## Step 9: Create Staging Area (On Stop)

When loop exits, create staging for next run:

### Create Directory Structure

```bash
mkdir -p deepfield/source/run-${nextRun+1}-staging/sources
```

### Copy Templates

```bash
cp ${CLAUDE_PLUGIN_ROOT}/templates/staging-readme.md \
   deepfield/source/run-${nextRun+1}-staging/README.md

cp ${CLAUDE_PLUGIN_ROOT}/templates/feedback.md \
   deepfield/source/run-${nextRun+1}-staging/feedback.md
```

### Populate Feedback Template

Update feedback.md with:
- Current open questions from learning plan
- Topics that need more focus
- Specific sources that would help

## Step 10: Report Completion

Display comprehensive summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Autonomous Learning Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Runs Executed: [N] runs (Run [X] → Run [Y])

Stop Reason: [REASON]
[Explanation of why execution stopped]

📈 Progress Summary:

Topic                    Before → After
─────────────────────────────────────────
Authentication           65% → 85%  ✓
API Structure            50% → 70%  ↑
Data Flow                30% → 50%  ↑
Background Jobs          15% → 15%  (not focused)

HIGH Priority Complete: [X]/[Y] topics >80%

📝 Questions Answered: [N]
❓ New Questions Raised: [N]
🔗 Contradictions Found: [N]

📁 Documentation Updated:
  - deepfield/drafts/domains/authentication.md
  - deepfield/drafts/domains/api-structure.md
  - deepfield/drafts/domains/data-flow.md

🔍 Next Steps:

[If PLAN_COMPLETE]:
  🎉 Learning plan complete! All HIGH priority topics >80%

  Next options:
    /df-distill    Snapshot knowledge to versioned output
    /df-status     Review detailed progress
    /df-continue   Continue with MEDIUM priority topics
    /df-restart    Regenerate learning plan

[If MAX_RUNS]:
  ⏸️  Paused after [N] consecutive runs (max: [M])

  Please review:
    - deepfield/drafts/ - Updated documentation
    - deepfield/wip/learning-plan.md - Current state

  Add feedback or sources to:
    deepfield/source/run-${nextRun+1}-staging/

  Then run /df-continue to continue learning

[If BLOCKED]:
  ⚠️  Blocked: Need additional sources

  Missing sources for HIGH priority topics:
    - [Topic]: Needs [specific sources]

  Please add to:
    deepfield/source/run-${nextRun+1}-staging/sources/

  Then run /df-continue

[If DIMINISHING_RETURNS]:
  📉 Minimal progress in recent runs

  Suggestions:
    - Add new sources with different perspectives
    - Review deepfield/drafts/cross-cutting/unknowns.md
    - Consider adjusting focus areas
    - Run /df-distill to snapshot current knowledge

[If DOMAIN_RESTRUCTURE]:
  🔄 Major domain changes detected

  Domain structure has changed significantly.
  Please review:
    deepfield/wip/domain-index.md

  Confirm new structure before continuing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

# Single Run Mode

If invoked with `--once` flag:

1. Execute single run (Run N)
2. Do NOT loop
3. Do NOT evaluate stop conditions
4. Create staging area
5. Report run completion

# Error Handling

## Agent Failure

If any agent fails during run:
- Mark run as "failed" in config
- Preserve partial results
- Report error to user
- Do not continue to next run
- Allow retry of same run

## Script Failure

If hash computation or other script fails:
- Log error details
- Mark run as "failed"
- Suggest resolution
- Allow retry

## Interrupted Execution

If user Ctrl+C:
- Current run state is preserved in run-N directory
- Run marked as "in-progress" in config
- User can resume or retry

# State Transitions

```
RUN_0_COMPLETE → (iterate) → LEARNING
LEARNING → (iterate) → LEARNING (continue)
LEARNING → (iterate) → PAUSED (stop condition)
PAUSED → (user adds sources, iterate) → LEARNING
```

# Implementation Notes

- **Track consecutive runs** for max runs limit
- **Reset counter** when user adds sources
- **Parallel agent execution** where possible
- **Incremental file reading** via hash comparison
- **Clear progress indication** during long operations
- **Preserve all state** for resumability
- **Stop condition evaluation** after EACH run
- **Staging area creation** on every stop
