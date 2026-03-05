# E2E Testing Issues

**Testing Date:** 2026-03-03  
**Tester:** TomazWang  
**Plugin Version:** 1.0.0  
**Test Location:** `~/test-deepfield-e2e/`

---

## Issue Template

Copy this template for each issue:

```markdown
### Issue #X: [Short Title]

**Command/Feature:** `/df-command` or feature name  
**Severity:** Critical | Major | Minor  
**Category:** Bug | UX | Documentation | Performance

**What I Did:**
1. Step-by-step actions
2. Exact commands used
3. Inputs provided

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Error Messages:**
```
Paste error output here
```

**Screenshots/Logs:**
[Optional]

**Workaround:**
[Optional]

**Additional Context:**
Any other relevant details

---
```

---

## Issues Found During E2E Testing

### Issue #1: Missing `bootstrap` command

**Command/Feature:** `/df-continue` / CLI bootstrap flow  
**Severity:** Major  
**Category:** Bug

**What I Did:**
After the initial start process, I ran the continue flow.

```bash
deepfield bootstrap
```

Output:

```text
Error: Exit code 1
error: unknown command 'bootstrap'
```

I also confirmed with:

```bash
deepfield --help
```

that `bootstrap` is not listed as an available command.

**Expected Behavior:**
Deepfield should provide a bootstrap step/command that initializes the project from the brief and starts the learning process.

---

### Issue #2: Continue flow starts without required credentials

**Command/Feature:** `/df-continue`  
**Severity:** Major  
**Category:** UX

**What I Did:**
- Added GitLab repository and VSTS project info in the brief.
- Did not provide GitLab/VSTS tokens.
- Ran `/df-continue`.

**Expected Behavior:**
Before running, Deepfield should validate required inputs (for example, tokens) and prompt for missing information instead of proceeding.

---

### Issue #3: `domain-index` generation relies too heavily on the brief

**Command/Feature:** Domain indexing  
**Severity:** Major  
**Category:** Bug

**What I Observed:**
`domain-index` appears to be generated primarily from `brief.md` rather than broader sources.

**Expected Behavior:**
`domain-index` should be generated from multiple inputs (repositories, docs, and discovered project structure), not only the brief.

---

### Issue #4: Missing feedback loop after each run (including Run 0)

**Command/Feature:** Iteration workflow  
**Severity:** Major  
**Category:** UX

**What I Observed:**
There is no explicit user feedback checkpoint after each run.

**Expected Behavior:**
- Every run (including Run 0) should produce a reviewable WIP result.
- User feedback (corrections, additional context, constraints) should be captured and applied to the next run.
- For large projects, Run 0 should create an overview + learning plan, and later runs should iterate domain-by-domain until confidence is high or user guidance changes priorities.
- The system should track learning progress and continuously update the plan.

---

## Feature Requests

### Feature Request #1: Optional Chrome-assisted web access for private docs

**Request:**
Use Claude-for-Chrome (when available) to access web content, especially private documentation (for example, Google Drive), as an optional integration.

**Rationale:**
Some key project knowledge lives in authenticated web tools that are inaccessible via standard scraping.

---

### Feature Request #2: Backward compatibility and upgrade path

**Request:**
Add version-aware project upgrades for already initialized Deepfield projects.

**Expected Behavior:**
- Track Deepfield project version in state.
- If project version is older than current, run an upgrade routine.
- Backup existing outputs (`wip/`, `output/`, etc.) before migration.
- Migrate structure/artifacts (for example, learning plan format, folder layout, schema changes).

**Rationale:**
Deepfield is evolving quickly, and existing projects may have outdated structures or missing fields.