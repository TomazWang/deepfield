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

# Document Length Rule

**IMPORTANT**: When writing or updating any draft document in `deepfield/drafts/`, aim for approximately 350 lines of prose per file — code blocks (``` fenced sections) do not count toward the limit. This is a soft guideline, not a hard restriction. If adding content would push a file significantly past ~350 prose lines, consider splitting it:

1. Move the largest section(s) to a sub-file under `drafts/domains/{domain}/` named `{section}.md` (e.g., `drafts/domains/authentication/flows.md`)
2. Remove the moved content entirely from the primary file — do NOT keep a summary. If the domain needs a navigational overview, create `drafts/domains/{domain}/overview.md` (or `index.md`) as a dedicated overview file with links to sub-files.
3. Add a **"See also"** section in the primary file linking to any sub-files:
   ```
   ## See also
   - [Authentication Flows](flows.md)
   ```

Sub-files follow the same 350-line prose guideline and may be split further using `drafts/domains/{domain}/{section}/{subsection}.md`.

# Single Run Workflow (Run N)

## Pre-Run Setup

### 0. Load DEEPFIELD.md Configuration

Before anything else, load project-specific learning configuration:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/parse-deepfield-config.js" deepfield/DEEPFIELD.md
```

Parse the JSON output into a `deepfieldConfig` object. If `deepfield/DEEPFIELD.md` does not exist, the script returns defaults (`exists: false`) — continue with defaults.

Key config fields for this run:
- `deepfieldConfig.language` — output language for all documentation
- `deepfieldConfig.priorities.high` / `.medium` / `.low` — domain priority lists (used in Step 2)
- `deepfieldConfig.priorities.exclude` — glob patterns to skip during scanning (used in Step 3)
- `deepfieldConfig.domainInstructions` — per-domain instructions to pass to agents (used in Step 4)

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
  "confidenceChanges": {},
  "confidenceScores": {}
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

1. **DEEPFIELD.md priority override** — If `deepfieldConfig.priorities.high` lists specific domains, those domains are treated as HIGH priority regardless of the learning plan's priority field. Similarly, `.medium` and `.low` lists override the plan's default priority for listed domains.
2. **Highest priority tier** (HIGH before MEDIUM before LOW, using the potentially-overridden priorities from above)
3. **Lowest confidence** among same priority tier
4. **Related topics** (select topics that connect)
5. **User feedback** (prioritize topics user mentioned in staging feedback)

### Priority Override Logic

```javascript
function getEffectivePriority(topicName, learningPlanPriority, deepfieldConfig) {
  const name = topicName.toLowerCase().replace(/\s+/g, '-');
  if (deepfieldConfig.priorities.high.includes(name)) return 'HIGH';
  if (deepfieldConfig.priorities.medium.includes(name)) return 'MEDIUM';
  if (deepfieldConfig.priorities.low.includes(name)) return 'LOW';
  // No override — use learning plan priority
  return learningPlanPriority;
}
```

### Example Selection

Learning plan has:
- Authentication (plan: MEDIUM, 65%) → DEEPFIELD.md high priority → effective: HIGH
- API Structure (plan: HIGH, 50%)
- Data Flow (plan: MEDIUM, 30%)

**Select:** Authentication (overridden to HIGH + good depth needed) + API Structure (HIGH + lowest)

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

### Apply Exclusion Patterns

Before filtering by focus topics, remove any files matching `deepfieldConfig.priorities.exclude` patterns:

```javascript
// Filter out excluded paths
const nonExcluded = allFiles.filter(filePath => {
  return !deepfieldConfig.priorities.exclude.some(pattern => {
    // Handle glob patterns like /legacy/** by prefix matching
    const prefix = pattern.replace('/**', '').replace('/*', '');
    return filePath.startsWith(prefix) || filePath === prefix;
  });
});
```

If no exclusion patterns are configured, skip this filter.

### Filter by Focus Topics

Only include files relevant to focus topics from the non-excluded set:
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

### Scan User-Provided Source Documents

After building the initial `filesToRead` list, run the source-doc scanner to extract text from any user-provided documents in `deepfield/source/` (PDFs, DOCX, PPTX, plain text files — excluding `baseline/repos/` and staging directories):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/scan-source-docs.js" \
  --source-dir deepfield/source \
  --run-dir    deepfield/wip/run-${nextRun} \
  --output-index deepfield/wip/run-${nextRun}/source-docs-index.json
```

The script prints a human-readable summary of every file it found, extracted, warned about, or skipped — display this output to the user as part of the scan report.

Then read the generated index and append any extracted markdown files to `filesToRead`:

```javascript
const sourceDocs = fs.existsSync(`deepfield/wip/run-${nextRun}/source-docs-index.json`)
  ? JSON.parse(fs.readFileSync(`deepfield/wip/run-${nextRun}/source-docs-index.json`, 'utf8'))
  : [];

// sourceDocs is an array of absolute paths; append to filesToRead
filesToRead.push(...sourceDocs);
```

If `source-docs-index.json` does not exist or is empty, continue without error — it simply means no source documents are present.

## Step 4: Deep Learning

### Inject Domain-Specific Instructions

For each focus topic, check whether `deepfieldConfig.domainInstructions` has an entry for that domain:

```javascript
const domainKey = topicName.toLowerCase().replace(/\s+/g, '-');
const domainInstructions = deepfieldConfig.domainInstructions[domainKey] || null;
```

If instructions exist, they will be passed to the agent as additional context. If no instructions exist for a domain, omit the section from the agent prompt.

**Mode Selection** — determine which mode to use:

1. If `--sequential` flag was passed → use **Sequential Mode**
2. Else if `deepfield/wip/domain-index.md` exists → use **Parallel Mode** (default)
3. Else → use **Sequential Mode** with warning:
   ```
   Warning: domain-index.md not found — falling back to sequential learning. Run /df-bootstrap first to enable parallel learning.
   ```

---

### Sequential Mode

#### Invoke Learner Agent

```
Launch: deepfield-learner
Input: {
  "focus_topics": ["API Structure", "Data Flow"],
  "files_to_read": filesToRead,
  "previous_findings": "deepfield/wip/run-${nextRun-1}/findings.md",
  "domain_notes": "deepfield/wip/domains/*.md",
  "current_drafts": "deepfield/drafts/domains/*.md",
  "open_questions": <from learning plan>,
  "output_language": deepfieldConfig.language,
  "domain_instructions": {
    "api-structure": <deepfieldConfig.domainInstructions["api-structure"] or null>,
    "data-flow": <deepfieldConfig.domainInstructions["data-flow"] or null>
  }
}
```

The learner agent should include the following in its system context for each domain that has instructions:

```markdown
## Domain-Specific Instructions (from DEEPFIELD.md)

<domain instructions text>
```

And for output language (when not English):

```markdown
## Output Language

Write all documentation in <deepfieldConfig.language>.
If technical terms have no <language> equivalent, keep the English term with a <language> explanation in parentheses.
```

#### Document Length Rule for Learner Agent

> Follow the [Document Length Rule](#document-length-rule) defined above.

#### Process Learner Output

Learner writes findings to `deepfield/wip/run-${nextRun}/findings.md`:
- Discoveries about focus topics
- Cross-references and relationships
- Patterns observed
- Contradictions detected
- Questions answered
- New questions raised

---

### Parallel Mode (default)

Parallel mode runs one `deepfield-domain-learner` agent per domain concurrently, then consolidates all findings before synthesis. This can reduce total run time by 3-5x on projects with 4+ domains.

#### 4a. Read Domain Index

Load `deepfield/wip/domain-index.md` to get the list of all known domains and their associated file lists.

```javascript
// Parse domain-index.md to extract:
// [{ name: "auth", files: ["src/auth/...", ...] }, ...]
const allDomains = parseDomainIndex("deepfield/wip/domain-index.md")
```

If `domain-index.md` does not exist, fall back to sequential mode and log a warning:
```
Warning: domain-index.md not found — falling back to sequential learning.
Run /df-bootstrap first to generate the domain index.
```

#### 4b. Prepare Agent Tasks

For each domain, prepare the inputs for its `deepfield-domain-learner` agent:

```javascript
const maxAgents = options.maxAgents || 5  // default: 5

const agentTasks = allDomains.map(domain => ({
  domainName: domain.name,
  fileList: domain.files,
  previousFindingsPath: `deepfield/wip/run-${nextRun - 1}/domains/${domain.name}-findings.md`,
  findingsOutputPath: `deepfield/wip/run-${nextRun}/domains/${domain.name}-findings.md`,
  unknownsOutputPath: `deepfield/wip/run-${nextRun}/domains/${domain.name}-unknowns.md`,
  openQuestions: extractQuestionsForDomain(learningPlan, domain.name),
  currentDraftPath: `deepfield/drafts/domains/${domain.name}.md`,
}))
```

#### 4c. Progress Report — Before Launch

Display the parallel execution plan:

```
Parallel Learning Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domains to analyze: <N>
Max concurrent agents: <maxAgents>
Batches: <ceil(N / maxAgents)>

Domains:
  - auth     (X files)
  - api      (X files)
  - database (X files)
  ...

Launching batch 1 of <total-batches>...
```

#### 4d. Launch Agents in Batches

Split domains into batches of `maxAgents`. For each batch:

1. **Report batch start:**
   ```
   Batch 1/2: launching agents for [auth, api, database, ui, cache]
   ```

2. **Launch all agents for this batch in a single message** (one tool call block with multiple Task invocations) with `run_in_background: true`. This ensures true parallelism — all agents in the batch are submitted concurrently in one round-trip.

   For each domain in the batch, invoke the **Task tool** with the following parameters:
   - **subagent_type**: `"deepfield-domain-learner"`
   - **description**: `"Learn ${domain.name} domain (Run ${runNumber})"`
   - **run_in_background**: `true`
   - **prompt**: the inline prompt below (fill in all placeholders from the `agentTasks` prepared in step 4b)

   ```
   You are a domain learning agent for the Deepfield knowledge base system.

   Your job: deeply analyze the source files for the **${domain.name}** domain and write structured findings.

   ## Domain
   Name: ${domain.name}

   ## Files to analyze
   ${domain.files.map(f => `- ${f}`).join('\n')}

   ## Context files (read if they exist)
   - Previous findings: ${domain.previousFindingsPath}
   - Current draft: ${domain.currentDraftPath}

   ## Open questions for this domain
   ${domain.openQuestions.map(q => `- ${q}`).join('\n') || '(none)'}

   ${deepfieldConfig.domainInstructions[domain.name] ? `## Domain-Specific Instructions (from DEEPFIELD.md)\n\n${deepfieldConfig.domainInstructions[domain.name]}` : ''}

   ${deepfieldConfig.language && deepfieldConfig.language !== 'English' ? `## Output Language\n\nWrite all documentation in ${deepfieldConfig.language}.\nIf technical terms have no ${deepfieldConfig.language} equivalent, keep the English term with a ${deepfieldConfig.language} explanation in parentheses.` : ''}

   ## Output (write these files)
   - Findings: ${domain.findingsOutputPath}
   - Unknowns: ${domain.unknownsOutputPath}

   ## Findings file format
   Write ${domain.findingsOutputPath} with the following sections:
   - **Discoveries**: new facts learned about this domain
   - **Cross-references**: relationships to other domains
   - **Patterns**: recurring patterns or conventions observed
   - **Contradictions**: inconsistencies found
   - **Questions answered**: open questions that are now resolved
   - **New questions**: questions raised by the analysis
   - **Confidence Inputs** (JSON block): { "domain": "${domain.name}", "answeredQuestions": N, "unansweredQuestions": N, "unknowns": N, "evidenceByStrength": { "strong": N, "medium": N, "weak": N }, "analyzedSourceTypes": N, "requiredSourceTypes": N, "unresolvedContradictions": N, "totalContradictions": N }

   ## Unknowns file format
   Write ${domain.unknownsOutputPath} with a list of unresolved questions and missing information for this domain.

   Read all files you can access from the file list above. Write findings to the output paths. Do not skip any files in the list.
   ```

   **You MUST make all Task tool calls for this batch in a SINGLE message** (one `<function_calls>` block with one Task call per domain). Do NOT launch agents one at a time in separate messages — that is sequential, not parallel.

   Example for a batch with 3 domains (auth, api, database):
   - First Task call: `subagent_type="deepfield-domain-learner"`, `description="Learn auth domain (Run N)"`, `run_in_background=true`, prompt filled with auth context
   - Second Task call: `subagent_type="deepfield-domain-learner"`, `description="Learn api domain (Run N)"`, `run_in_background=true`, prompt filled with api context
   - Third Task call: `subagent_type="deepfield-domain-learner"`, `description="Learn database domain (Run N)"`, `run_in_background=true`, prompt filled with database context

   All three calls in the same message. Wait for all to complete before proceeding.

3. **Wait for all agents in this batch to complete** before launching the next batch or proceeding.

4. **Report batch completion:**
   ```
   Batch 1/2 complete.
   ```

5. Repeat for each remaining batch.

#### 4e. Verify Agent Outputs (Failure Handling)

After all batches complete, collect the agent IDs returned by the Task tool calls. Record them in the run config under `agentIds`:

```javascript
// Collect agent IDs returned by Task tool calls across all batches
// agentIds maps domain name → agent ID string returned by the Task tool
// Record agent IDs even for domains that failed to produce a findings file.
// Only omit a domain from agentIds if the Task tool returned no ID for that domain.
const agentIds = {
  "auth": "agent-abc123",
  "api":  "agent-def456",
  // etc.
}
```

Then check which domain findings files were actually written:

```javascript
const successDomains = []
const failedDomains = []

for (const task of agentTasks) {
  if (fileExists(task.findingsOutputPath)) {
    successDomains.push(task.domainName)
  } else {
    failedDomains.push(task.domainName)
  }
}
```

**If failures occurred**, display a warning (do NOT abort the run):

```
⚠️  Warning: Some domain agents did not produce findings:
  - auth       (deepfield/wip/run-N/domains/auth-findings.md missing)
  - payments   (deepfield/wip/run-N/domains/payments-findings.md missing)

Proceeding with findings from: api, database, ui
Confidence for failed domains will remain unchanged this run.
```

Update the run config to record partial results:

```json
{
  "parallelMode": true,
  "domainsAnalyzed": ["api", "database", "ui"],
  "domainsFailed": ["auth", "payments"],
  "partialResults": true,
  "agentIds": {
    "api": "agent-def456",
    "database": "agent-ghi789",
    "ui": "agent-jkl012",
    "auth": "agent-abc123",
    "payments": "agent-mno345"
  }
}
```

**If ALL agents failed** (no findings files exist at all), abort and mark the run as failed:

```
Error: All domain learning agents failed to produce findings.
Run marked as failed. Check agent logs for details.
Suggestions:
  - Verify domain-index.md has valid file paths
  - Check deepfield/source/baseline/ has accessible files
  - Try /df-iterate --sequential to diagnose
```

Mark run config `"status": "failed"` and stop execution.

#### 4f. Consolidate Findings

Run the `gather-domain-findings.js` script to merge per-domain findings into the canonical `findings.md`:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/gather-domain-findings.js \
  ./deepfield/wip/run-${nextRun} \
  --domains=${allDomains.map(d => d.name).join(',')}
```

This writes `deepfield/wip/run-${nextRun}/findings.md` with all domain findings concatenated under clear domain-header delimiters.

```
Consolidating findings from <N> domains...
Consolidated findings written to: deepfield/wip/run-N/findings.md
```

After consolidation, parallel mode rejoins the sequential workflow at **Step 5: Synthesize Knowledge**. The synthesizer reads the consolidated `findings.md` exactly as in sequential mode — no changes needed downstream.

## Step 5: Synthesize Knowledge

### Invoke Knowledge Synthesizer Agent

```
Launch: deepfield-knowledge-synth
Input: {
  "findings": "deepfield/wip/run-${nextRun}/findings.md",
  "existing_drafts": "deepfield/drafts/domains/*.md",
  "unknowns": "deepfield/drafts/cross-cutting/unknowns.md",
  "changelog": "deepfield/drafts/_changelog.md",
  "output_language": deepfieldConfig.language
}
```

### Process Synthesis Output

Synthesizer updates:
- `deepfield/drafts/domains/<topic>.md` - Updated with new knowledge
- `deepfield/drafts/cross-cutting/unknowns.md` - Add/remove unknowns
- `deepfield/drafts/_changelog.md` - Append run summary

### Document Length Rule for Synthesizer Agent

> Follow the [Document Length Rule](#document-length-rule) defined above.

## Step 5.5: Generate Readability Documents

After the synthesizer has written domain drafts and updated the changelog, generate the three readability documents. These are supplementary — failures must NOT abort the run.

### 5.5.1 Generate Drafts Index

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-drafts-index.js" \
  --drafts-dir deepfield/drafts \
  --run-config deepfield/wip/run-${nextRun}/run-${nextRun}.config.json \
  --output     deepfield/drafts/README.md \
  --unknowns   deepfield/drafts/cross-cutting/unknowns.md
```

### 5.5.2 Generate Domain Companion READMEs

For every domain file that exists in `deepfield/drafts/domains/` (not just domains updated this run):

```bash
# For each domain file: deepfield/drafts/domains/<domain>.md
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-domain-readme.js" \
  --domain     <domain> \
  --drafts-dir deepfield/drafts \
  --run-config deepfield/wip/run-${nextRun}/run-${nextRun}.config.json \
  --output     deepfield/drafts/domains/<domain>/README.md
```

Enumerate domain files by listing all `*.md` files in `deepfield/drafts/domains/` and deriving the domain name by stripping the `.md` extension.

### 5.5.3 Generate Run Review Guide

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-run-review-guide.js" \
  --run           ${nextRun} \
  --run-config    deepfield/wip/run-${nextRun}/run-${nextRun}.config.json \
  --output        deepfield/wip/run-${nextRun}/review-guide.md \
  --learning-plan deepfield/wip/learning-plan.md \
  --unknowns      deepfield/drafts/cross-cutting/unknowns.md
```

### 5.5.4 Error Handling

If any of the three generation scripts exit with a non-zero status:
- Log a warning: `Warning: Readability document generation failed: <script> — <error>`
- Continue with Step 5.6 (terminology extraction) — do NOT abort the run
- These documents are supplementary; their absence does not affect core learning output

## Step 5.6: Extract Terminology

After synthesis, extract domain-specific terms from the files analyzed this run and merge them into the cumulative glossary.

### Prepare File List

Write the list of files analyzed this run to a temporary JSON file:

```bash
# filesToRead was built in Step 3 (Incremental Scanning)
node -e "
const fs = require('fs');
fs.writeFileSync(
  'deepfield/wip/run-${nextRun}/files-analyzed.json',
  JSON.stringify({ files: filesToRead })
);
"
```

### Run Term Extraction Script

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/extract-terminology.js" \
  --run ${nextRun} \
  --files-json deepfield/wip/run-${nextRun}/files-analyzed.json \
  --glossary deepfield/drafts/cross-cutting/terminology.md
```

This writes `deepfield/wip/run-${nextRun}/term-extraction-input.json` and a placeholder `deepfield/wip/run-${nextRun}/new-terms.md`.

### Invoke Term Extractor Agent

```
Launch: deepfield-term-extractor
Input: {
  "run_number": ${nextRun},
  "manifest": "deepfield/wip/run-${nextRun}/term-extraction-input.json",
  "files_to_scan": <filesToRead>,
  "previous_glossary": "deepfield/drafts/cross-cutting/terminology.md",
  "output_path": "deepfield/wip/run-${nextRun}/new-terms.md"
}
```

The agent reads source files and writes discovered terms to `deepfield/wip/run-${nextRun}/new-terms.md`.

### Merge Into Cumulative Glossary

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/merge-glossary.js" \
  --run ${nextRun} \
  --new-terms deepfield/wip/run-${nextRun}/new-terms.md \
  --glossary deepfield/drafts/cross-cutting/terminology.md \
  --template "${CLAUDE_PLUGIN_ROOT}/templates/terminology.md"
```

This merges per-run discoveries into `deepfield/drafts/cross-cutting/terminology.md`.

### Error Handling

If extraction or merge fails:
- Log a warning: `Warning: Terminology extraction failed for Run ${nextRun}: <error>`
- Continue to Step 6 — terminology extraction is non-blocking

## Step 5.7: Calculate Evidence-Based Confidence Scores

After synthesis and terminology extraction complete, run the confidence scoring script.

### Collect Domain Inputs

Parse the domain findings files produced this run to extract each domain's Confidence Inputs JSON block. Write the collected inputs to a single JSON array file:

```bash
# deepfield/wip/run-${nextRun}/confidence-inputs.json
# Array of domain input objects from the ## Confidence Inputs sections
# in each deepfield/wip/run-${nextRun}/domains/<domain>-findings.md
```

Each element must match the schema:
```json
{
  "domain": "<domain-name>",
  "answeredQuestions": <integer>,
  "unansweredQuestions": <integer>,
  "unknowns": <integer>,
  "evidenceByStrength": { "strong": <int>, "medium": <int>, "weak": <int> },
  "analyzedSourceTypes": <integer>,
  "requiredSourceTypes": <integer>,
  "unresolvedContradictions": <integer>,
  "totalContradictions": <integer>
}
```

For sequential mode (single learner agent), extract the `## Confidence Inputs` JSON block from `deepfield/wip/run-${nextRun}/findings.md` (the learner writes one block per domain).

For parallel mode, read each `deepfield/wip/run-${nextRun}/domains/<domain>-findings.md` file and extract its `## Confidence Inputs` block. Skip domains that failed (no findings file).

If no confidence inputs can be extracted (e.g., agent did not emit the block), log a warning and skip confidence scoring for that domain.

### Run calculate-confidence.js

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/calculate-confidence.js" \
  deepfield/wip/run-${nextRun}/confidence-inputs.json \
  --wip-dir deepfield/wip \
  --run-config deepfield/wip/run-${nextRun}/run-${nextRun}.config.json \
  --prev-run-config deepfield/wip/run-${nextRun - 1}/run-${nextRun - 1}.config.json
```

This script:
1. Reads `confidence-inputs.json`
2. Looks up each domain's previous aggregate from `run-${nextRun-1}.config.json` (null on first run)
3. Computes the four-component formula for each domain
4. Overwrites `deepfield/wip/confidence-scores.md` with the per-domain breakdown
5. Updates `deepfield/wip/run-${nextRun}/run-${nextRun}.config.json` `confidenceScores` field

If calculate-confidence.js fails:
- Log a warning: `Warning: Confidence scoring failed for Run ${nextRun}: <error>`
- Continue to Step 6 — confidence scoring is non-blocking

### Generate Run Review Guide

After calculate-confidence.js succeeds (or is skipped due to failure), generate the run review guide `deepfield/wip/run-${nextRun}/run-review-guide.md` with a **Confidence Summary** section.

Read `deepfield/wip/confidence-scores.md` and include:

```markdown
## Confidence Summary

| Domain | Score | Percentage | Delta |
|--------|-------|-----------|-------|
| auth   | 0.734 | 73.4%     | +0.05 |
| api    | 0.610 | 61.0%     | -0.11 |
```

- Show delta with sign (e.g., `+0.05` or `-0.11` or `0.00`)
- Show negative deltas as-is — they indicate a run discovered new unknowns or contradictions, which is valuable information
- If confidence-scores.md does not exist (scoring was skipped), omit the section with a note: `Confidence scoring not available for this run.`

## Step 6: Update Learning Plan

### Read Confidence Scores

Before updating the learning plan, read `deepfield/wip/confidence-scores.md` to get the current aggregate score for each domain. Use these values (converted to percentages) to update the confidence tracking table in `learning-plan.md`. Do NOT estimate confidence subjectively.

### Update Plan

For each focus topic:
1. Update confidence level — use the aggregate from `wip/confidence-scores.md` (do NOT estimate subjectively)
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
  },
  "confidenceScores": {
    "api-structure": {
      "aggregate": 0.70,
      "previousAggregate": 0.50,
      "components": { "questionsAnswered": 0.8, "evidenceStrength": 0.65, "sourceCoverage": 0.75, "contradictionResolution": 1.0 },
      "inputs": { "answeredQuestions": 8, "unansweredQuestions": 2, "unknowns": 0, "evidenceByStrength": { "strong": 3, "medium": 2, "weak": 1 }, "analyzedSourceTypes": 3, "requiredSourceTypes": 4, "unresolvedContradictions": 0, "totalContradictions": 0 }
    }
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

**CRITICAL: This step MUST be completed before reporting completion. Always create a staging area when the loop exits, regardless of stop reason.**

When the loop exits, create staging for the next run so the user has a place to add sources and feedback:

### Create Directory Structure

```bash
mkdir -p deepfield/source/run-${nextRun+1}-staging/sources
```

Where `${nextRun}` is the last completed run number (e.g., if Runs 1-3 completed, create `run-4-staging/`).

### Create README

Write a `deepfield/source/run-${nextRun+1}-staging/README.md` explaining:
- This is where the user adds new sources and feedback
- Drop files into `sources/` subdirectory
- Edit `feedback.md` to answer questions or provide guidance
- Run `/df-continue` when ready

### Create Feedback Template

Write a `deepfield/source/run-${nextRun+1}-staging/feedback.md` populated with:
- Current open questions from learning plan
- Topics that need more focus
- Specific sources that would help
- Any contradictions the AI wants the user to clarify

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
