# E2E Issues - Breakdown & Implementation Plan

**Source:** `ISSUES-E2E-TESTING-2026-03-04.md`
**Date:** 2026-03-04
**Status:** Planning

---

## Issue Analysis

### Critical Missing Pieces (Phase 2+ Features)

The core issue is that **Phase 2+ commands are designed but not implemented**. The user encountered this during real-world testing:

- `/df-bootstrap` doesn't exist in CLI
- `/df-continue` relies on skills/agents that don't exist
- Domain detection, learning loops, validation - all designed but not coded

**Reality Check:**
- ✅ Phase 1 works: init, start, status
- ❌ Phase 2+ is design-only: bootstrap, input, iterate, output, continue

---

## Breakdown into Features

### 🔴 **Feature 1: CLI Bootstrap Command**

**Issue:** #1 - Missing `bootstrap` command
**Severity:** Critical (blocks Phase 2)
**Scope:** Add `bootstrap` command to CLI

**What to Implement:**
- CLI command: `deepfield bootstrap`
- Validates prerequisites (brief.md filled, deepfield/ exists)
- Triggers deepfield-bootstrap skill (which doesn't exist yet)

**Dependencies:**
- Requires deepfield-bootstrap skill (Feature 2)

**Files to Create/Modify:**
- `cli/src/commands/bootstrap.ts` (new)
- `cli/src/cli.ts` (register command)

**Acceptance Criteria:**
- [ ] `deepfield bootstrap` command exists
- [ ] Shows helpful error if prerequisites missing
- [ ] Calls bootstrap skill when ready
- [ ] Returns clear output/errors

**OpenSpec Change:** `feat/cli-bootstrap-command`

---

### 🔴 **Feature 2: Bootstrap Skill Implementation**

**Issue:** #1, #3, #4 - Bootstrap process doesn't work
**Severity:** Critical (core Phase 2 feature)
**Scope:** Implement actual bootstrap logic (Run 0)

**What to Implement:**
- Read and parse brief.md
- Classify sources (without classifier agent initially - use simple heuristics)
- Create initial project-map.md
- Create domain-index.md (from repos + brief, not just brief)
- Create initial learning plan
- Set up Run 0 state

**Current State:**
- `plugin/skills/deepfield-bootstrap.md` exists as orchestration doc
- No actual implementation

**Implementation Strategy:**

**Phase 2A: Simple Bootstrap (No Agents)**
- Parse brief.md manually
- List sources without classification
- Create basic project-map from repo structure
- Generate domain-index from folder structure + brief hints
- Create simple learning plan template
- Mark Run 0 complete

**Phase 2B: Add Intelligence (Later)**
- Implement classifier agent
- Implement scanner agent
- Implement domain-detector agent
- Use agents for better classification/detection

**Files to Create/Modify:**
- `plugin/skills/deepfield-bootstrap.md` (update to executable skill)
- `plugin/scripts/bootstrap-runner.sh` or `.js` (new)
- Templates for project-map, domain-index, learning-plan

**Acceptance Criteria:**
- [ ] Can run bootstrap after `/df-start`
- [ ] Reads brief.md successfully
- [ ] Creates project-map.md with repo structure
- [ ] Creates domain-index.md from folders + brief
- [ ] Creates learning-plan.md
- [ ] Sets Run 0 status to complete

**OpenSpec Change:** `feat/bootstrap-skill-implementation`

---

### 🟡 **Feature 3: Input Validation & Credential Management**

**Issue:** #2 - Continue flow starts without required credentials
**Severity:** Major (UX issue)
**Scope:** Validate required inputs before execution

**What to Implement:**
- Pre-flight checks before bootstrap/continue
- Detect if repos require credentials (GitLab, VSTS, private GitHub)
- Prompt for missing credentials
- Store credentials securely (or reference existing git credentials)

**Implementation Strategy:**
- Check brief.md for repo URLs
- Detect if URL is private (gitlab.com, dev.azure.com, private github)
- If private and no credentials, prompt user
- Use git credential helper or environment variables
- Don't store credentials in deepfield/ (security)

**Files to Create/Modify:**
- `plugin/skills/validation/` (new)
- `plugin/scripts/check-credentials.sh` (new)
- Add validation step to bootstrap/continue skills

**Acceptance Criteria:**
- [ ] Detects private repos in brief.md
- [ ] Prompts for credentials if needed
- [ ] Uses existing git credentials when available
- [ ] Clear error if credentials missing/invalid
- [ ] Doesn't proceed with invalid state

**OpenSpec Change:** `feat/credential-validation`

---

### 🟡 **Feature 4: Multi-Source Domain Detection**

**Issue:** #3 - Domain-index relies too heavily on brief
**Severity:** Major (accuracy issue)
**Scope:** Generate domain-index from multiple sources

**What to Implement:**
- Scan actual repository structure
- Analyze folder organization
- Check package.json, pom.xml, etc. for modules
- Read README files
- Combine with brief.md hints (not replace)

**Current State:**
- Domain detection is in design (agents/deepfield-domain-detector.md)
- Not implemented

**Implementation Strategy:**

**Simple Version (No AI):**
- Find top-level directories in repos
- Map to common patterns (src/, lib/, packages/, services/)
- Extract module names from build files
- Use brief.md as hints, not source of truth

**Advanced Version (Later):**
- Use AI to analyze code structure
- Detect architectural patterns
- Identify domain boundaries from imports/dependencies

**Files to Create/Modify:**
- `plugin/scripts/detect-domains.sh` or `.js` (new)
- Update bootstrap skill to use multi-source detection

**Acceptance Criteria:**
- [ ] Scans repo folder structure
- [ ] Identifies modules from build configs
- [ ] Combines repo analysis + brief hints
- [ ] Generates domain-index.md with sources cited
- [ ] More accurate than brief-only approach

**OpenSpec Change:** `feat/multi-source-domain-detection`

---

### 🟡 **Feature 5: Run Feedback Loop**

**Issue:** #4 - No feedback loop after runs
**Severity:** Major (workflow issue)
**Scope:** Add user review checkpoint after each run

**What to Implement:**
- After Run 0 completes, show summary
- Ask user to review findings
- Prompt for feedback/corrections
- Store feedback for next run
- Update learning plan based on feedback

**Workflow:**
```
Run N completes
  ↓
Show: "Run N complete! Review findings at deepfield/wip/run-N/"
  ↓
Prompt: "Review findings? [y/n]"
  ↓
If yes: Ask for feedback
  ↓
Store feedback → deepfield/wip/run-N/feedback.md
  ↓
Update learning plan with feedback
```

**Files to Create/Modify:**
- Add feedback prompt to bootstrap/iterate skills
- `plugin/templates/feedback.md` (template exists)
- Update iterate logic to incorporate feedback

**Acceptance Criteria:**
- [ ] After Run 0, user prompted to review
- [ ] Can provide feedback about findings
- [ ] Feedback stored in run directory
- [ ] Next run incorporates feedback
- [ ] Can skip feedback and continue

**OpenSpec Change:** `feat/run-feedback-loop`

---

### 🟢 **Feature 6: Chrome-Assisted Web Access (Future)**

**Feature Request:** #1 - Optional Chrome integration
**Severity:** Minor (enhancement)
**Scope:** Integration with Claude-for-Chrome

**What to Implement:**
- Detect if Claude-for-Chrome available
- Offer to fetch private docs via Chrome
- Handle authentication via browser session
- Download and classify web content

**Status:** **DEFER** - Depends on Claude-for-Chrome availability

**Files to Create/Modify:**
- TBD when Claude-for-Chrome is available

**OpenSpec Change:** `feat/chrome-integration` (future)

---

### 🟢 **Feature 7: Project Upgrade Path (Future)**

**Feature Request:** #2 - Version migration
**Severity:** Minor (enhancement)
**Scope:** Upgrade old deepfield projects

**What to Implement:**
- Track project version in config
- Detect version mismatch
- Backup before upgrade
- Migrate structure/schemas
- Update config to new version

**Status:** **DEFER** - Not needed until version 2.0

**Files to Create/Modify:**
- `cli/src/commands/upgrade.ts` (new)
- Migration scripts per version

**OpenSpec Change:** `feat/project-upgrade` (future)

---

## Implementation Priority

### 🔴 **Critical Path (Must Have for Phase 2)**

1. **Feature 1: CLI Bootstrap Command** ⚠️
   - Estimated: 2-4 hours
   - Blocks: Everything else
   - OpenSpec: `feat/cli-bootstrap-command`

2. **Feature 2: Bootstrap Skill Implementation** ⚠️
   - Estimated: 1-2 days (simple version)
   - Blocks: Real usage
   - OpenSpec: `feat/bootstrap-skill-implementation`

### 🟡 **High Priority (Important for UX)**

3. **Feature 3: Input Validation**
   - Estimated: 4-8 hours
   - Improves: Error handling
   - OpenSpec: `feat/credential-validation`

4. **Feature 4: Multi-Source Domain Detection**
   - Estimated: 1 day
   - Improves: Accuracy
   - OpenSpec: `feat/multi-source-domain-detection`

5. **Feature 5: Run Feedback Loop**
   - Estimated: 4-6 hours
   - Improves: Iteration workflow
   - OpenSpec: `feat/run-feedback-loop`

### 🟢 **Low Priority (Future)**

6. **Feature 6: Chrome Integration** - DEFER
7. **Feature 7: Project Upgrade** - DEFER

---

## Recommended Implementation Order

### Sprint 1: Make Bootstrap Work (Week 1)

**Goal:** User can run `/df-bootstrap` and get Run 0 results

1. **Day 1-2:** Feature 1 - CLI Bootstrap Command
   - Add command to CLI
   - Basic validation
   - Call skill

2. **Day 3-5:** Feature 2 - Bootstrap Skill (Simple Version)
   - Parse brief.md
   - List sources
   - Generate basic project-map
   - Generate domain-index from folders
   - Create learning plan template
   - Mark Run 0 complete

**Deliverable:** Working `/df-bootstrap` command

### Sprint 2: Improve Robustness (Week 2)

**Goal:** Better error handling and accuracy

3. **Day 1-2:** Feature 3 - Input Validation
   - Credential detection
   - Pre-flight checks
   - Better error messages

4. **Day 3-4:** Feature 4 - Multi-Source Domain Detection
   - Scan repos
   - Parse build configs
   - Improve domain-index accuracy

5. **Day 5:** Feature 5 - Run Feedback Loop
   - Add feedback prompts
   - Store feedback
   - Update plans

**Deliverable:** Robust bootstrap with good UX

### Sprint 3: Iterate & Output (Week 3+)

**Goal:** Implement `/df-iterate` and `/df-output`

- Implement iterate skill
- Add learning agents (or simple versions)
- Implement output snapshot
- End-to-end workflow working

---

## Next Steps

### Option A: Start with Feature 1 (CLI Command)

```
/opsx:new feat/cli-bootstrap-command
```

**Scope:**
- Add `deepfield bootstrap` command to CLI
- Validate prerequisites
- Call bootstrap skill
- Handle errors

### Option B: Start with Feature 2 (Bootstrap Skill - Simple)

```
/opsx:new feat/bootstrap-skill-simple
```

**Scope:**
- Implement basic bootstrap logic
- No agents, just scripts
- Read brief, scan repos, generate docs
- Get something working first

### Option C: Do Both Together

```
/opsx:new feat/bootstrap-phase2-foundation
```

**Scope:**
- CLI command + simple skill implementation
- End-to-end working bootstrap
- Larger scope, but complete feature

---

## Decision Needed

**Which approach do you prefer?**

1. **Incremental:** Start with Feature 1 (just the CLI command), then Feature 2
2. **Foundational:** Start with Feature 2 (skill implementation), then add CLI
3. **Complete:** Do both together (bigger scope, but complete feature)

**Recommendation:** **Option C (Complete)** - Deliver working feature end-to-end

---

## Files to Track

**During Implementation:**
- Keep this file updated with progress
- Move to `dev-support/archive/` when all features complete
- Update `ISSUES-E2E-TESTING-2026-03-04.md` with fix status

**After Implementation:**
- Archive both files
- Update README with new capabilities
- Update documentation

---

## Summary

**Total Features:** 7
- 🔴 Critical: 2 (must implement)
- 🟡 High Priority: 3 (should implement)
- 🟢 Low Priority: 2 (defer)

**Estimated Time:**
- Sprint 1 (Critical): 1 week
- Sprint 2 (High Priority): 1 week
- Sprint 3 (Iterate/Output): 1+ week

**Recommended Start:** Feature 1 + 2 together (complete bootstrap)

**Ready for OpenSpec!** 🚀
