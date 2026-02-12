# Deepfield Test Plan

**Status**: Paused after automated tests complete
**Date**: 2026-02-12
**Progress**: 9/20 tests complete (8 automated + 1 manual)

---

## ✅ Completed Tests (9/20)

### Automated Verification (8 tests)
1. ✅ **Scripts exist and functional** - clone-repos.sh, hash-files.js with SHA-256, batching, ignore patterns
2. ✅ **All 6 agents exist** - classifier, scanner, domain-detector, plan-generator, learner, knowledge-synth
3. ✅ **Both skills exist** - bootstrap (12 steps), iterate (10 steps, 5 stop conditions)
4. ✅ **Commands implement routing** - df-init, df-start, df-status, df-continue with 7-state detection
5. ✅ **Templates exist** - learning-plan.md, staging-readme.md, feedback.md, brief.md
6. ✅ **State management schemas** - project.config.json (maxRuns), run.config.json (focusTopics, confidenceChanges)
7. ✅ **5 stop conditions** - Plan complete, Max runs, Blocked, Diminishing returns, Domain restructure
8. ✅ **Incremental scanning** - SHA-256 hashing, batch processing, hash comparison logic

### Manual Tests (1 test)
9. ✅ **df-init command** - Creates `deepfield/` directory, handles already-exists scenario

---

## ⏸️ Pending Manual Tests (11/20)

### Test #10: df-start Q&A Flow
**Status**: BLOCKED - Interactive CLI issue
**Issue**: `deepfield start` requires stdin input, doesn't work through Claude Code Bash tool

**What to test:**
```bash
cd ~/deepfield-test-1
deepfield start
```

**Verify:**
- ✅ Asks 4 questions: project type, goal, focus areas, max runs
- ✅ Creates `deepfield/project.config.json` with maxRuns field
- ✅ Creates `deepfield/source/baseline/brief.md` prefilled with answers
- ✅ Brief explains maxRuns concept

**Expected files:**
- `deepfield/project.config.json` (with user's answers)
- `deepfield/source/baseline/brief.md` (prefilled template)

---

### Test #11: df-status in Multiple States

**What to test:**
Test status display in different workflow states:

```bash
# State 1: EMPTY (no deepfield/)
cd ~/test-empty
/df-status
# Expect: "EMPTY" state, suggest /df-init

# State 2: INITIALIZED (deepfield/ exists, no config)
cd ~/test-init-only
deepfield init
/df-status
# Expect: "INITIALIZED", suggest /df-start

# State 3: BRIEF_CREATED (config exists, brief incomplete)
cd ~/test-brief-created
deepfield init && deepfield start
# (provide minimal brief)
/df-status
# Expect: "BRIEF_CREATED", prompt to fill brief

# State 4: BRIEF_READY (brief filled, no Run 0)
cd ~/test-brief-ready
# (fill out brief.md with >50 lines)
/df-status
# Expect: "BRIEF_READY", suggest /df-bootstrap

# State 5: LEARNING (after Run 0)
cd ~/test-learning
# (complete bootstrap)
/df-status
# Expect: Show run count, confidence levels, open questions

# State 6: Test --verbose flag
/df-status --verbose
# Expect: Additional details (config fields, source counts, run history)
```

**Verify:**
- ✅ Correct state detection for all 6 states
- ✅ Appropriate suggestions for next action
- ✅ Verbose mode shows additional details
- ✅ Learning progress displayed (confidence, questions count)

---

### Test #12: df-continue State Routing

**What to test:**
Test context-aware routing for all 7 states:

```bash
# Test 1: EMPTY → error
cd ~/test-routing-empty
/df-continue
# Expect: Error, suggest /df-init

# Test 2: INITIALIZED → prompt for df-start
cd ~/test-routing-init
deepfield init
/df-continue
# Expect: Prompt to run /df-start

# Test 3: BRIEF_CREATED → prompt to fill brief
cd ~/test-routing-brief-created
deepfield init && deepfield start
/df-continue
# Expect: Prompt to fill out brief.md

# Test 4: BRIEF_READY → invoke bootstrap
cd ~/test-routing-brief-ready
# (fill brief.md)
/df-continue
# Expect: Invokes bootstrap skill (Run 0)

# Test 5: LEARNING + new input → invoke iterate
cd ~/test-routing-learning-input
# (after Run 0, add sources to staging)
/df-continue
# Expect: Invokes iterate skill

# Test 6: LEARNING + no input → prompt for sources
cd ~/test-routing-learning-no-input
# (after Run 0, empty staging)
/df-continue
# Expect: Prompt to add sources to staging

# Test 7: COMPLETE → suggest next actions
cd ~/test-routing-complete
# (all HIGH topics >80%)
/df-continue
# Expect: Suggest /df-distill or /df-restart
```

**Verify:**
- ✅ All 7 state transitions route correctly
- ✅ Error messages clear and actionable
- ✅ Skills invoked when appropriate (bootstrap, iterate)
- ✅ Prompts guide user to next action

---

### Test #13: Bootstrap Workflow (Run 0)

**What to test:**
Full bootstrap from brief to Run 0 complete:

```bash
cd ~/test-bootstrap
deepfield init
deepfield start
# (answer Q&A)

# Fill out brief.md:
# - Add repository: https://github.com/rails/rails.git
# - Focus areas: Authentication, API
# - Goal: "Understand authentication flow"

/df-continue
# Should trigger bootstrap
```

**Verify artifacts created:**
- ✅ `deepfield/wip/run-0/` directory
- ✅ `deepfield/wip/run-0/run-0.config.json` (with file hashes)
- ✅ `deepfield/wip/run-0/findings.md` (initial observations)
- ✅ `deepfield/wip/learning-plan.md` (generated with topics from brief)
- ✅ `deepfield/wip/project-map.md` (project structure overview)
- ✅ `deepfield/wip/domain-index.md` (detected domains)
- ✅ `deepfield/source/baseline/repos/` (cloned repository)
- ✅ `deepfield/drafts/` (skeleton documents)
- ✅ `deepfield/source/run-1-staging/` (created for next run)

**Verify content:**
- Learning plan has topics matching brief focus areas (Authentication, API)
- Project map reflects repository structure
- Domains detected (auth, api, etc.)
- File hashes stored in run-0.config.json

---

### Test #14: Autonomous Iteration (Multi-Run)

**What to test:**
Autonomous learning loop executing multiple runs:

```bash
cd ~/test-iteration
# (start from completed bootstrap)

# Add new sources to staging
echo "# Auth Documentation" > deepfield/source/run-1-staging/sources/auth-doc.md

# Run autonomous iteration
/df-continue
# Should execute Runs 1, 2, 3... until stop condition
```

**Verify per run:**
- ✅ Incremental scan identifies new/changed files
- ✅ Focus topics selected (lowest confidence HIGH priority)
- ✅ Learner agent reads relevant files
- ✅ Findings written to `wip/run-N/findings.md`
- ✅ Knowledge synth updates drafts
- ✅ Learning plan confidence updated
- ✅ `run-N.config.json` written with new hashes
- ✅ `run-N+1-staging/` created

**Verify after completion:**
- ✅ Multiple runs executed automatically (e.g., Runs 1-3)
- ✅ Stops at maxRuns or stop condition
- ✅ Confidence levels increased for focused topics
- ✅ Drafts accumulated knowledge from all runs
- ✅ `unknowns.md` reflects current gaps
- ✅ `_changelog.md` has entries for each run
- ✅ Stop message explains why stopped

---

### Test #15: Single Run Mode (--once flag)

**What to test:**
Single run execution without autonomous loop:

```bash
cd ~/test-single-run
# (start from completed bootstrap)

/df-continue --once
# Should execute exactly one run and stop
```

**Verify:**
- ✅ Executes exactly Run 1
- ✅ Does NOT evaluate continuation conditions
- ✅ Stops after one run regardless of maxRuns
- ✅ Staging area created for next run
- ✅ Can run `/df-continue --once` again for Run 2

**Repeat:**
```bash
/df-continue --once
# Should execute Run 2 and stop
```

---

### Test #16: All 5 Stop Conditions

**What to test:**
Force each stop condition in realistic scenarios:

#### Test 16A: Stop Condition 1 - Plan Complete
```bash
cd ~/test-stop-plan-complete
# Manually edit learning-plan.md to set all HIGH topics >80%
/df-continue
# Should stop immediately with "Plan complete" message
```

#### Test 16B: Stop Condition 2 - Max Runs Reached
```bash
cd ~/test-stop-max-runs
# Set maxRuns=2 in project.config.json
/df-continue
# Should stop after exactly 2 runs with "Max runs reached"
```

#### Test 16C: Stop Condition 3 - Blocked on Sources
```bash
cd ~/test-stop-blocked
# Edit learning-plan.md so all HIGH topics need unavailable sources
# Remove staging area
/df-continue
# Should stop immediately with "Blocked on sources" + list needed sources
```

#### Test 16D: Stop Condition 4 - Diminishing Returns
```bash
cd ~/test-stop-diminishing
# Run twice with no new sources, no changes
/df-continue
# Should detect minimal findings and stop with "Diminishing returns"
```

#### Test 16E: Stop Condition 5 - Domain Restructure
```bash
cd ~/test-stop-restructure
# Manually modify domain-index.md significantly
/df-continue
# Should detect major change and pause for confirmation
```

**Verify:**
- ✅ Each stop condition triggers correctly
- ✅ Stop messages are clear and actionable
- ✅ State preserved for resumption
- ✅ User can continue after addressing issue

---

### Test #17: Incremental Scanning Efficiency

**What to test:**
Verify only changed files are re-read:

```bash
cd ~/test-incremental
# (complete bootstrap with 500 files)

# Run 1: No changes
/df-continue --once
# Measure time, verify minimal deep reads

# Run 2: Change 10 files
# Modify 10 files in source/baseline/
/df-continue --once
# Verify exactly 10 files deep-read

# Run 3: Add 50 new files
# Add 50 files to run-3-staging/
/df-continue --once
# Verify exactly 50 files deep-read
```

**Metrics to collect:**
- Hash computation time (should be consistent)
- Deep read time (proportional to changed/new files)
- Run 1 (no changes) should be 10x+ faster than Run 0 (full scan)

**Verify:**
- ✅ Unchanged files skipped (not deep-read)
- ✅ Changed files detected and read
- ✅ New files detected and read
- ✅ Performance: incremental >> full scan

---

### Test #18: Knowledge Accumulation Across Runs

**What to test:**
Verify knowledge accumulates without loss:

```bash
cd ~/test-accumulation
# (complete Run 0, Run 1, Run 2)

# After Run 1
cat deepfield/drafts/authentication.md
# Note: Sections, confidence markers, content

# Add contradictory source
echo "# Conflicting Auth Info" > deepfield/source/run-2-staging/sources/conflict.md

# Run 2
/df-continue --once

# Check draft again
cat deepfield/drafts/authentication.md
```

**Verify:**
- ✅ Run 1 content preserved in Run 2
- ✅ New Run 2 findings integrated (not replaced)
- ✅ Contradictions documented with sources cited
- ✅ No information loss across runs
- ✅ Source citations maintained (file:line format)
- ✅ Confidence markers adjusted when contradictions found

---

### Test #19: Staging Area Workflow

**What to test:**
User adds feedback and new sources between runs:

```bash
cd ~/test-staging
# (complete Run 2)

# Open staging area
cd deepfield/source/run-3-staging

# Add feedback
echo "Question 1 answer: Yes, tokens are JWT" >> feedback.md
echo "Question 2 answer: Session expires in 24h" >> feedback.md

# Add new sources
mkdir -p sources
echo "# API Documentation" > sources/api-doc.md
echo "# Architecture Diagram" > sources/arch-diagram.png
echo "# Meeting Notes" > sources/meeting-notes.txt

cd ~/test-staging
/df-continue --once
```

**Verify:**
- ✅ Classifier processes staging sources
- ✅ Sources filed correctly (baseline vs run-3/)
- ✅ feedback.md content incorporated into learning plan
- ✅ New sources hashed and tracked in run-3.config.json
- ✅ Learner reads new sources
- ✅ Findings reference new sources
- ✅ Questions from feedback answered (if sources relevant)

---

### Test #20: Resume After Interruption

**What to test:**
Robustness when interrupted with Ctrl+C:

```bash
cd ~/test-interruption
# (start from completed bootstrap)

# Start autonomous iteration
/df-continue
# Wait for Run 1 to complete
# During Run 2, press Ctrl+C

# Check state
ls deepfield/wip/
# Verify: run-1/ complete, run-2/ incomplete or missing

# Resume
/df-continue
# Should detect state and continue correctly
```

**Verify:**
- ✅ Run 1 artifacts intact after Ctrl+C
- ✅ Run 2 either cleaned up or resume-able
- ✅ Second `/df-continue` detects state correctly
- ✅ No data loss or corruption
- ✅ Eventually reaches Run 3 successfully
- ✅ State files (config.json) not corrupted

---

## Known Issues

### Issue #1: Interactive CLI Blocks Plugin Commands
**Status**: CRITICAL - Blocks Test #10 and potentially others
**Description**: CLI commands like `deepfield start` require interactive stdin, but Claude Code's Bash tool cannot provide input. When called from plugin commands/skills/agents, they hang waiting for input.

**Impact:**
- `/df-start` cannot work through plugin
- Any skill/agent invoking interactive CLI will hang
- Users must run CLI directly in terminal (workaround)

**Solution needed:**
- Separate interactive functionality from CLI
- Use Claude Code tools (AskUserQuestion) for interaction in plugin
- Keep CLI interactive for direct terminal use
- Plugin commands should use non-interactive CLI flags or direct implementation

**Change required**: New OpenSpec change to refactor interaction layer

---

## Directory Structure Note

**IMPORTANT**: The actual directory is `deepfield/` NOT `kb/`
- Specs reference `kb/` but implementation creates `deepfield/`
- All test cases use `deepfield/` as verified in Test #9
- Do not trust `kb-design-purpose/` docs for implementation details

---

## Next Steps

1. **Fix interactive CLI issue** - Create OpenSpec change to separate interaction layer
2. **Resume testing** - Continue with Test #10 after fix
3. **Document findings** - Update specs to match actual implementation (`deepfield/` not `kb/`)
4. **Complete remaining 11 tests** - Manual execution with user collaboration
5. **Archive change** - After all tests pass, archive core-learning-system change

---

**Test Session Date**: 2026-02-12
**Tester**: User + Claude Code verification
**Environment**: macOS, deepfield CLI v1.0.0
