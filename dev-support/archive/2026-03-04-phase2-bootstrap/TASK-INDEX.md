# Task Index - E2E Issues Implementation

**Source:** E2E Testing Issues (2026-03-04)
**Created:** 2026-03-04
**Status:** Ready for implementation

---

## Task Overview

| # | Task | Priority | Status | Time Est. | OpenSpec Change |
|---|------|----------|--------|-----------|-----------------|
| 001 | CLI Bootstrap Command | 🔴 Critical | Not Started | 2-4h | `feat/cli-bootstrap-command` |
| 002 | Bootstrap Skill (Simple) | 🔴 Critical | Not Started | 1-2d | `feat/bootstrap-skill-implementation` |
| 003 | Input Validation | 🟡 High | Not Started | 4-8h | `feat/credential-validation` |
| 004 | Multi-Source Domain Detection | 🟡 High | Not Started | 1d | `feat/multi-source-domain-detection` |
| 005 | Run Feedback Loop | 🟡 High | Not Started | 4-6h | `feat/run-feedback-loop` |
| 006 | Chrome Integration | 🟢 Low | DEFERRED | TBD | `feat/chrome-integration` |
| 007 | Project Upgrade Path | 🟢 Low | DEFERRED | 1-2d | `feat/project-upgrade` |

---

## Critical Path (Must Implement)

### Task 001: CLI Bootstrap Command

**File:** `TASK-001-cli-bootstrap-command.md`

**What:** Add `deepfield bootstrap` command to CLI

**Scope:**
- Create bootstrap command in CLI
- Validate prerequisites (deepfield/, config, brief)
- Show confirmation prompt
- Call bootstrap skill
- Handle errors

**Blocks:** Everything else (no bootstrap = no Phase 2)

**Worktree:** `wt-001-cli-bootstrap`

---

### Task 002: Bootstrap Skill Implementation (Simple)

**File:** `TASK-002-bootstrap-skill-simple.md`

**What:** Make bootstrap actually work (without AI agents)

**Scope:**
- Parse brief.md
- Clone repositories
- Scan structure
- Generate project-map.md
- Generate domain-index.md
- Generate learning-plan.md
- Create Run 0 state

**Blocks:** Real usage

**Worktree:** `wt-002-bootstrap-skill`

---

## High Priority (Should Implement)

### Task 003: Input Validation & Credentials

**File:** `TASK-003-input-validation.md`

**What:** Validate inputs and check credentials before execution

**Scope:**
- Detect private repositories
- Check for existing credentials
- Prompt for missing credentials
- Store securely
- Validate before proceeding

**Enhances:** Task 002

**Worktree:** `wt-003-validation`

---

### Task 004: Multi-Source Domain Detection

**File:** `TASK-004-multi-source-domain-detection.md`

**What:** Generate domain-index from repos + brief, not just brief

**Scope:**
- Analyze folder structure
- Parse build configs (package.json, pom.xml, etc.)
- Extract modules from monorepos
- Analyze dependencies
- Read READMEs
- Combine with brief hints

**Enhances:** Task 002

**Worktree:** `wt-004-domains`

---

### Task 005: Run Feedback Loop

**File:** `TASK-005-run-feedback-loop.md`

**What:** Add user review checkpoint after each run

**Scope:**
- Show run summary
- Prompt for feedback
- Collect corrections/additions/priorities
- Save feedback
- Incorporate in next run

**Enhances:** Task 002

**Worktree:** `wt-005-feedback`

---

## Deferred (Future)

### Task 006: Chrome Integration

**File:** `TASK-006-chrome-integration.md`

**Status:** DEFERRED - Waiting for Claude-for-Chrome

**What:** Access private docs via browser session

**When to implement:** When Claude-for-Chrome is available

---

### Task 007: Project Upgrade Path

**File:** `TASK-007-project-upgrade.md`

**Status:** DEFERRED - Not needed until v2.0

**What:** Auto-migrate projects when versions change

**When to implement:** When breaking changes are introduced

---

## Implementation Strategy

### Recommended Approach

**Sprint 1: Make Bootstrap Work**
1. Task 001 + 002 together (complete bootstrap)
2. Estimated: 1 week
3. Deliverable: Working `/df-bootstrap` command

**Sprint 2: Improve Robustness**
3. Task 003 (validation)
4. Task 004 (better domains)
5. Task 005 (feedback)
6. Estimated: 1 week
7. Deliverable: Production-ready bootstrap

### Alternative: Parallel Work

**If using multiple worktrees:**
- WT-001: CLI command (quick, 2-4h)
- WT-002: Bootstrap skill (main work, 1-2d)
- WT-003: Validation (can work in parallel)
- WT-004: Domains (can work in parallel)
- WT-005: Feedback (depends on 002)

**Merge order:**
1. Merge 001 first (foundation)
2. Merge 002 second (core feature)
3. Merge 003, 004, 005 (enhancements)

---

## Worktree Setup

### Create Worktrees

```bash
cd ~/dev/workspace/mine/deepfield

# Critical path
git worktree add ../wt-001-cli-bootstrap -b feat/cli-bootstrap-command
git worktree add ../wt-002-bootstrap-skill -b feat/bootstrap-skill-implementation

# High priority (optional parallel work)
git worktree add ../wt-003-validation -b feat/credential-validation
git worktree add ../wt-004-domains -b feat/multi-source-domain-detection
git worktree add ../wt-005-feedback -b feat/run-feedback-loop
```

### Work in Worktrees

```bash
# Work on CLI command
cd ../wt-001-cli-bootstrap
cat ~/dev/workspace/mine/deepfield/dev-support/wip/TASK-001-cli-bootstrap-command.md
# Implement...

# Work on bootstrap skill
cd ../wt-002-bootstrap-skill
cat ~/dev/workspace/mine/deepfield/dev-support/wip/TASK-002-bootstrap-skill-simple.md
# Implement...
```

### Merge Back

```bash
# When complete
cd ~/dev/workspace/mine/deepfield
git checkout main
git merge feat/cli-bootstrap-command
git merge feat/bootstrap-skill-implementation
git merge feat/credential-validation
# etc.
```

---

## Task Dependencies

```
001 (CLI Command)
  ↓
002 (Bootstrap Skill) ← Core implementation
  ↓
003 (Validation) ────┐
004 (Domains) ───────┼─→ Enhancements (can be parallel)
005 (Feedback) ──────┘

006 (Chrome) ──────→ DEFER
007 (Upgrade) ─────→ DEFER
```

---

## Progress Tracking

Update this section as tasks are completed:

- [ ] Task 001 - CLI Bootstrap Command
- [ ] Task 002 - Bootstrap Skill (Simple)
- [ ] Task 003 - Input Validation
- [ ] Task 004 - Multi-Source Domains
- [ ] Task 005 - Run Feedback Loop
- [ ] Task 006 - Chrome Integration (DEFERRED)
- [ ] Task 007 - Project Upgrade (DEFERRED)

---

## Related Files

- **Issue Source:** `ISSUES-E2E-TESTING-2026-03-04.md`
- **Breakdown:** `E2E-ISSUES-BREAKDOWN.md`
- **Workflow Guide:** `E2E-WORKFLOW.md`

---

## Next Actions

1. **Choose implementation approach:**
   - Sequential (001 → 002 → 003 → 004 → 005)
   - Parallel (001 + 002 + 003 + 004 in separate worktrees)
   - Incremental (001 first, then 002, then review)

2. **Set up worktrees** (if parallel)

3. **Start with Task 001 or 002** (or both)

4. **Use OpenSpec** for each task:
   ```
   /opsx:new feat/cli-bootstrap-command
   /opsx:apply
   ```

---

**Ready to start implementation!** 🚀
