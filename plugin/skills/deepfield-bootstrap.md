---
name: Deepfield Bootstrap
description: Run 0 - Initial structural scan, domain detection, and learning plan generation using scripts and templates (no AI agents required)
trigger_mode: command
user_invocable: false
---

# Purpose

This skill orchestrates Run 0 (bootstrap) for the Deepfield knowledge base. It reads the user's filled `brief.md`, clones repositories, scans project structure, detects domains, and generates the first learning plan — all using scripts and templates.

**State Transition:** `BRIEF_READY` → `RUN_0_COMPLETE`

# When to Use

Invoke this skill when:
- User has filled out `deepfield/source/baseline/brief.md`
- Project state is `BRIEF_READY`
- No Run 0 has been executed yet
- User runs `/df-bootstrap` or `/df-continue` from `BRIEF_READY` state

# Prerequisites

Before running, verify all of the following:

1. `deepfield/` directory exists (created by `/df-init`)
2. `deepfield/source/baseline/brief.md` exists and has been filled out
3. `deepfield/project.config.json` exists
4. `deepfield/wip/run-0/run-0.config.json` does **not** exist (bootstrap not yet run)

**If any prerequisite fails, stop and show the appropriate error message below.**

# Workflow

## Step 1: Check Prerequisites

```
if deepfield/ does not exist:
  → Error: Not initialized. Run /df-init first.

if deepfield/source/baseline/brief.md does not exist:
  → Error: Brief not found. Run /df-start to create and fill out brief.md.

if deepfield/wip/run-0/run-0.config.json exists with status "completed":
  → Error: Bootstrap already completed. Run /df-continue to start Run 1.
```

## Step 2: Load DEEPFIELD.md Configuration

Before running the bootstrap script, load project-specific learning configuration:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/parse-deepfield-config.js" deepfield/DEEPFIELD.md
```

Parse the JSON output into a config object. If `deepfield/DEEPFIELD.md` does not exist, the script returns defaults (`exists: false`) — this is fine, bootstrap continues with defaults.

Store the config for use in subsequent steps:
- `deepfieldConfig.language` — output language for all documentation
- `deepfieldConfig.priorities.exclude` — glob patterns to skip during scanning
- `deepfieldConfig.domainInstructions` — per-domain instructions to pass to agents

## Step 3: Run Bootstrap Script

Execute the bootstrap runner script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/bootstrap-runner.js"
```

Optional flags:
- `--brief-path <path>` — Override brief location (default: `./deepfield/source/baseline/brief.md`)
- `--skip-clone` — Skip cloning repos (useful if repos already cloned)
- `--skip-hashing` — Skip file hashing step (faster, but no incremental scanning in Run 1)

The script handles all bootstrap steps automatically:
1. Parses `brief.md` (project name, repos, focus areas, topics)
2. Clones each repository with `--depth 1` shallow clone
3. Scans repository directory structure (**skip files matching `deepfieldConfig.priorities.exclude` patterns**)
4. Generates `deepfield/wip/project-map.md`
5. Generates `deepfield/wip/domain-index.md`
6. Generates `deepfield/wip/learning-plan.md`
7. Computes file hashes via `hash-files.js`
8. Creates `deepfield/wip/run-0/run-0.config.json` (status: "completed")
9. Creates `deepfield/source/run-1-staging/` with README and feedback template
10. Updates `deepfield/project.config.json` (bootstrapCompleted: true)

### Applying Exclusion Patterns

After scanning, filter out any files whose paths match a pattern in `deepfieldConfig.priorities.exclude` before creating the project map and domain index:

```javascript
// Example: deepfieldConfig.priorities.exclude = ['/legacy/**', '/vendor/**']
// Use minimatch or simple prefix matching to filter scanned file list
const includedFiles = scannedFiles.filter(filePath => {
  return !deepfieldConfig.priorities.exclude.some(pattern => {
    // Simple prefix match for path patterns like /legacy/**
    const prefix = pattern.replace('/**', '');
    return filePath.startsWith(prefix);
  });
});
```

If no exclusion patterns are configured, include all files.

## Step 4: Document Length Rule for Bootstrap-generated Drafts

**IMPORTANT**: Any AI agent or script generating draft documents in `deepfield/drafts/` during bootstrap should aim for approximately 350 lines of prose per file — code blocks (``` fenced sections) do not count toward the limit. This is a soft guideline, not a hard restriction. If content would significantly exceed ~350 prose lines, consider splitting:

1. Identify logical sections in the document
2. Move the largest section(s) to sub-files under `drafts/domains/{domain}/` named `{section}.md` (e.g., `drafts/domains/authentication/flows.md`)
3. Replace moved content in the primary file with a brief summary
4. Add a **"See also"** section at the bottom of the primary file linking to each sub-file:
   ```
   ## See also
   - [Authentication Flows](flows.md) — detailed flow diagrams
   ```
Sub-files follow the same 350-line prose guideline and may be split further using `drafts/domains/{domain}/{section}/{subsection}.md`.

## Step 4b: Inject Domain Instructions into Domain Analysis

When generating the domain index and initial domain notes, for each detected domain check whether `deepfieldConfig.domainInstructions[domainName]` exists. If it does, include those instructions in the context when the AI analyzes that domain.

Format for injection into domain analysis context:

```markdown
## Domain-Specific Instructions (from DEEPFIELD.md)

<instructions text from deepfieldConfig.domainInstructions[domainName]>
```

Also apply the configured output language to all generated markdown files:

```
Output language: <deepfieldConfig.language>
Write all documentation in <deepfieldConfig.language>.
```

## Step 5: Generate Readability Documents

After the bootstrap runner script completes and initial domain drafts exist, generate the three readability documents. These are supplementary — failures must NOT abort bootstrap.

### 5.1 Generate Drafts Index

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-drafts-index.js" \
  --drafts-dir deepfield/drafts \
  --run-config deepfield/wip/run-0/run-0.config.json \
  --output     deepfield/drafts/README.md \
  --unknowns   deepfield/drafts/cross-cutting/unknowns.md
```

If `deepfield/drafts/` or `deepfield/wip/run-0/run-0.config.json` does not exist yet, skip this step and continue.

### 5.2 Generate Domain Companion READMEs

For every domain file in `deepfield/drafts/domains/` (if the directory exists):

```bash
# For each domain file: deepfield/drafts/domains/<domain>.md
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-domain-readme.js" \
  --domain     <domain> \
  --drafts-dir deepfield/drafts \
  --run-config deepfield/wip/run-0/run-0.config.json \
  --output     deepfield/drafts/domains/<domain>/README.md
```

### 5.3 Generate Run 0 Review Guide

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-run-review-guide.js" \
  --run           0 \
  --run-config    deepfield/wip/run-0/run-0.config.json \
  --output        deepfield/wip/run-0/review-guide.md \
  --learning-plan deepfield/wip/learning-plan.md \
  --unknowns      deepfield/drafts/cross-cutting/unknowns.md
```

### 5.4 Error Handling

If any of the three generation scripts exit with a non-zero status:
- Log a warning: `Warning: Readability document generation failed: <script> — <error>`
- Continue to Step 6 (Initialize Terminology Glossary) — do NOT abort bootstrap

## Step 6: Initialize Terminology Glossary

After the bootstrap runner script completes, create the empty terminology glossary:

```bash
# Create the cross-cutting drafts directory if it doesn't exist
mkdir -p deepfield/drafts/cross-cutting

# Copy the terminology template to initialize the empty glossary
cp "${CLAUDE_PLUGIN_ROOT}/templates/terminology.md" \
   deepfield/drafts/cross-cutting/terminology.md
```

This establishes the glossary file so that Run 1 can immediately start appending discovered terms without needing to create the file from scratch.

If the glossary already exists (e.g., re-running bootstrap), skip this step to preserve any previously discovered terms.

## Step 7: Verify Output

After the script completes, verify these files exist:

- `deepfield/wip/project-map.md` — Repository structure overview
- `deepfield/wip/domain-index.md` — Detected domains table
- `deepfield/wip/learning-plan.md` — Topics and priorities for Run 1
- `deepfield/wip/run-0/run-0.config.json` — Run state (status: "completed")
- `deepfield/wip/run-0/findings.md` — Bootstrap findings summary
- `deepfield/source/run-1-staging/README.md` — Staging area guide
- `deepfield/source/run-1-staging/feedback.md` — Open questions template
- `deepfield/drafts/cross-cutting/terminology.md` — Empty terminology glossary (initialized from template)
- `deepfield/drafts/README.md` — Drafts index (generated by `generate-drafts-index.js`)
- `deepfield/wip/run-0/review-guide.md` — Run 0 review guide (generated by `generate-run-review-guide.js`)

## Step 8: Report Completion

Display the bootstrap summary from the script output, then add:

```
Bootstrap (Run 0) is complete.

Review the generated files:
  - deepfield/wip/project-map.md     <- Project structure
  - deepfield/wip/domain-index.md    <- Detected domains
  - deepfield/wip/learning-plan.md   <- Learning priorities

When ready, run /df-continue to start Run 1 (autonomous learning).
Or add more sources to deepfield/source/run-1-staging/ first.
```

# Error Handling

## Brief not found

```
Error: Brief not found at deepfield/source/baseline/brief.md

Please run /df-start to generate the brief template, then fill it out
with your project information before running bootstrap.
```

## Brief appears incomplete

```
Warning: Brief appears incomplete.

Bootstrap works best with:
  - At least one repository URL
  - Primary goal selected
  - Focus areas indicated

You can continue with an empty brief, but generated documents will be sparse.
Add repository URLs and focus areas to deepfield/source/baseline/brief.md for better results.
```

## Repository clone fails

```
Warning: Failed to clone repository: <repo-url>

Possible causes:
  - Invalid URL
  - Network issues
  - Authentication required (private repo)

Bootstrap will continue with remaining repositories.
Manually clone the repo to deepfield/source/baseline/repos/<name>/ and re-run.
```

## Bootstrap already completed

```
Error: Bootstrap (Run 0) has already been completed.

If you want to re-run bootstrap:
  1. Delete deepfield/wip/run-0/
  2. Run /df-continue (or /df-bootstrap)

Or run /df-continue to proceed to Run 1.
```

## Script not found

```
Error: Bootstrap script not found at ${CLAUDE_PLUGIN_ROOT}/scripts/bootstrap-runner.js

This may indicate an incomplete plugin installation.
Please reinstall the Deepfield plugin.
```

# Success Criteria

Bootstrap is successful when:
- `deepfield/wip/run-0/run-0.config.json` exists with `status: "completed"`
- `deepfield/wip/project-map.md` exists
- `deepfield/wip/domain-index.md` exists
- `deepfield/wip/learning-plan.md` exists
- `deepfield/project.config.json` has `bootstrapCompleted: true`
- `deepfield/drafts/cross-cutting/terminology.md` exists (initialized from template)

# State Transition

```
BRIEF_READY --> (bootstrap) --> RUN_0_COMPLETE
```

After `RUN_0_COMPLETE`, the next command is `/df-continue` which will invoke the iterate skill for Run 1.

# Implementation Notes

- **Scripts only** — This is Phase 2A (no AI agents). AI classification and analysis are deferred to Phase 2B.
- **Atomic writes** — All file writes use temp-then-rename pattern via the generator scripts.
- **Idempotent cloning** — Repositories are skipped if destination already exists.
- **File hashing** — Hashes establish the baseline for incremental scanning. Run 1 only reads changed/new files.
- **Graceful failures** — Clone failures warn and continue. Other failures exit with a clear message.
