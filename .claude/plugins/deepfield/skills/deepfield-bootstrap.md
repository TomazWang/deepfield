---
name: Deepfield Bootstrap
description: Run 0 - Initial classification, scan, domain detection, and learning plan generation
trigger_mode: command
user_invocable: false
---

# Purpose

This skill orchestrates Run 0 (bootstrap) for the Deepfield knowledge base. It reads the user's filled brief.md, classifies and organizes sources, performs initial structural scans, detects domains, and generates the first learning plan.

# When to Use

Invoke this skill when:
- User has filled out `kb/source/baseline/brief.md`
- Project state is BRIEF_READY
- No Run 0 has been executed yet
- User runs `/df-continue` from BRIEF_READY state

# Prerequisites

Before running, verify:
1. `kb/` directory exists (from `/df-init`)
2. `kb/source/baseline/brief.md` exists and is filled out
3. `kb/project.config.json` exists
4. No `kb/wip/run-0/` directory exists (not already bootstrapped)

# Workflow

## Step 1: Read and Parse brief.md

Read `kb/source/baseline/brief.md` to extract:
- Project name and description
- Primary goal (onboarding, audit, decomposition, etc.)
- Repository URLs with branches/tags
- Key documents and wikis
- Areas of concern / focus areas
- Topics of interest (checked items)

Store context for use by agents.

## Step 2: Classify Sources

For each source listed in brief.md:

### For Git Repositories

1. **Invoke classifier agent:**
   ```
   Launch: deepfield-classifier
   Input: {
     "source": "<repo-url>",
     "branch": "<branch-or-tag>",
     "context": <brief-context>
   }
   ```

2. **Process classification result:**
   - Type: Should be "code"
   - Trust level: Typically "trusted" for main branch
   - Domains: Note suggested domains

3. **Clone repository:**
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/clone-repos.sh \
     <repo-url> \
     ./kb/source/baseline/repos/<repo-name> \
     <branch-or-tag>
   ```

### For Documentation Files

1. **Invoke classifier agent:**
   ```
   Launch: deepfield-classifier
   Input: {
     "source": "<file-path-or-url>",
     "type": "doc",
     "context": <brief-context>
   }
   ```

2. **Process classification result:**
   - Type: doc, config, spec, etc.
   - Trust level: reference or trusted
   - Domains: Note suggestions

3. **File documentation:**
   - If trusted/reference → `kb/source/baseline/trusted-docs/`
   - If exploratory → `kb/source/run-0/`

### For User-Provided Context

If brief includes meeting notes, tribal knowledge, or informal context:

1. Save as markdown file in `kb/source/run-0/context.md`
2. Classify as type "conversation", trust "exploratory"

## Step 3: Scan Project Structure

For each cloned repository:

1. **Invoke scanner agent:**
   ```
   Launch: deepfield-scanner
   Input: {
     "path": "./kb/source/baseline/repos/<repo-name>",
     "context": <brief-context>
   }
   ```

2. **Collect scan results:**
   - Project organization (monorepo/multi-repo/modular)
   - Entry points (main files, CLI, API, build)
   - Configuration files
   - Component map
   - Key files (README, schemas, specs)

3. **Write scan results:**
   Save to `kb/wip/run-0/scan-<repo-name>.md`

## Step 4: Detect Domains

Using all classification and scan results:

1. **Invoke domain detector agent:**
   ```
   Launch: deepfield-domain-detector
   Input: {
     "scan_results": <all-scan-results>,
     "classifications": <all-classifications>,
     "brief_context": <user-focus-areas>
   }
   ```

2. **Process domain detection:**
   - Extract detected domains with confidence scores
   - Note domain relationships
   - Identify suggested decompositions

3. **Generate domain-index.md:**
   Write structured domain index to `kb/wip/domain-index.md`

## Step 5: Generate Initial Project Map

Create high-level project map in `kb/wip/project-map.md`:

```markdown
# Project Map

## Overview
[Project name and description from brief]

## Architecture
[Organization type: monorepo/multi-repo/modular]
[Framework and language info]

## Key Components
[List major components from scan]

## Repositories
- [repo-name]: [branch] - [purpose]

## Domains Detected
- [domain] ([confidence]%) - [file count] files

## Entry Points
- [Application]: [file-path]
- [CLI]: [file-path]
- [API]: [file-path]

## Next Steps
Run 1 will focus on: [HIGH priority topics from plan]
```

## Step 6: Generate Learning Plan

1. **Invoke plan generator agent:**
   ```
   Launch: deepfield-plan-generator
   Input: {
     "brief": <brief-context>,
     "domain_index": <domain-index>,
     "scan_results": <scan-results>,
     "run_number": 0
   }
   ```

2. **Process generated plan:**
   - Extract topics with priorities
   - Note initial confidence levels (20-30%)
   - Collect open questions
   - List needed sources

3. **Write learning-plan.md:**
   Save to `kb/wip/learning-plan.md`

## Step 7: Create Run 0 Directory and Findings

1. **Create directory structure:**
   ```bash
   mkdir -p kb/wip/run-0/domains
   ```

2. **Write initial findings.md:**
   Create `kb/wip/run-0/findings.md`:
   ```markdown
   # Run 0 - Bootstrap Findings

   ## Structural Understanding

   ### Project Organization
   [From scan: monorepo/modular/etc]

   ### Domains Detected
   [List domains with confidence]

   ### Key Components
   [Major components identified]

   ### Open Questions
   [Initial questions from plan]

   ## Next Focus
   Run 1 will deep-read: [HIGH priority topics]
   ```

## Step 8: Compute Initial File Hashes

1. **For each repository, compute hashes:**
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/hash-files.js \
     ./kb/source/baseline/repos/<repo-name> \
     --output ./kb/wip/run-0/hashes-<repo-name>.json
   ```

2. **Merge all hashes into single object**

3. **Store in run config:**
   File hashes will go into `run-0.config.json`

## Step 9: Write Run 0 Configuration

Create `kb/wip/run-0/run-0.config.json`:

```json
{
  "runNumber": 0,
  "startedAt": "<ISO-timestamp>",
  "completedAt": "<ISO-timestamp>",
  "status": "completed",
  "fileHashes": {
    "repo1/file1.js": "hash...",
    "repo1/file2.py": "hash..."
  },
  "focusTopics": [],
  "confidenceChanges": {}
}
```

Use `${CLAUDE_PLUGIN_ROOT}/scripts/update-json.js` for atomic write.

## Step 10: Create Initial Draft Documents

For each HIGH priority domain detected:

1. **Create skeleton draft:**
   Create `kb/drafts/domains/<domain-name>.md`:
   ```markdown
   # [Domain Name]

   *Last Updated: Run 0 (Bootstrap)*
   *Confidence: [X]%*

   ## Overview

   Initial understanding from structural scan. Deep exploration begins in Run 1.

   ## Key Files Identified
   - [file-path] - [purpose-if-known]

   ## Open Questions
   - [Question from learning plan]

   ## Next Steps
   Run 1 will deep-read key files to understand [specific aspects].
   ```

2. **Update changelog:**
   Append to `kb/drafts/_changelog.md`:
   ```markdown
   ## Run 0 - Bootstrap

   - Created: [list of draft files]
   - Initial structural understanding established
   - Learning plan generated with [N] topics
   ```

## Step 11: Update Project Config

Update `kb/project.config.json`:

```json
{
  "lastModified": "<current-timestamp>",
  "bootstrapCompleted": true,
  "currentRun": 0,
  "totalRuns": 1
}
```

## Step 12: Report Completion

Display summary to user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Bootstrap Complete (Run 0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Project Analysis:
  - Repositories cloned: [N]
  - Domains detected: [N] ([X] HIGH priority)
  - Files scanned: [N]
  - Topics identified: [N]

📋 Learning Plan Generated:
  HIGH Priority Topics:
    - [Topic 1] (confidence: [X]%)
    - [Topic 2] (confidence: [X]%)

  Open Questions: [N]

📁 Artifacts Created:
  - kb/wip/project-map.md
  - kb/wip/domain-index.md
  - kb/wip/learning-plan.md
  - kb/wip/run-0/findings.md
  - kb/drafts/domains/[domain].md (skeletons)

🚀 Next Steps:
  Run /df-continue to start autonomous learning
  Or add more sources to kb/source/run-1-staging/ first

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

# Error Handling

## If brief.md not found

```
Error: Brief not found at kb/source/baseline/brief.md

Please run /df-start to generate the brief template, then fill it out
with your project information before running bootstrap.
```

## If brief.md is empty/incomplete

```
Warning: Brief appears incomplete (missing repository URLs or focus areas)

Bootstrap needs:
  - At least one repository URL
  - Primary goal selected
  - Focus areas indicated

Please fill out kb/source/baseline/brief.md and try again.
```

## If repository clone fails

```
Error: Failed to clone repository: [repo-url]

Possible causes:
  - Invalid URL
  - Network issues
  - Authentication required

Please verify the repository URL and access, then retry.
```

## If any agent fails

```
Error: [Agent-name] failed: [error-message]

This is a bootstrap failure. Please check:
  - Source files are accessible
  - Sufficient disk space
  - No permission issues

You can retry bootstrap after resolving the issue.
```

# Success Criteria

Bootstrap is successful when:
- ✓ All sources classified and filed
- ✓ All repositories cloned
- ✓ Structural scans completed
- ✓ Domains detected with confidence scores
- ✓ Learning plan generated
- ✓ Initial drafts created
- ✓ Run 0 config written
- ✓ File hashes computed

# State Transition

```
BRIEF_READY → (bootstrap) → RUN_0_COMPLETE
```

# Implementation Notes

- **Run agents in parallel where possible** (classification of multiple sources)
- **Use scripts for all file operations** (clone, hash, write JSON)
- **Be patient** - Bootstrap can take 1-2 minutes for large codebases
- **Atomic operations** - Use temp-then-rename for all writes
- **Clear progress** - Show what's happening during long operations
- **Preserve user data** - Never overwrite user's brief.md
