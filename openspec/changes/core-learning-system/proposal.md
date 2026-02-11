## Why

The Deepfield plugin needs autonomous learning capabilities to build knowledge bases from brownfield projects. After initial setup (init/start), users need a system that can bootstrap understanding, iterate through learning cycles, and build comprehensive documentation without manual intervention. This is the core value proposition: AI that learns codebases iteratively and tells users what it doesn't know yet.

## What Changes

- Bootstrap command (`/df-bootstrap`) that classifies sources, performs initial scan, detects domains, and generates learning plans
- Iterate command (`/df-continue`) with context-aware behavior that autonomously runs multiple learning cycles until stop conditions
- Source classification system that organizes inputs into baseline (persistent) vs per-run (ephemeral) folders
- Learning plan generation and maintenance that tracks topics, confidence levels, and priorities
- Incremental scanning system using file hashes to avoid re-reading unchanged files
- Autonomous multi-run execution with configurable stop conditions (max runs or plan completion)
- Automatic staging area creation (`run-N-staging`) after each run for user feedback and new sources
- Agent-based architecture for specialized tasks (classification, scanning, learning, synthesis)
- Script-based robust file operations (atomic writes, JSON updates, git operations)

## Capabilities

### New Capabilities

- `source-classification`: Classify sources by type (code/doc/config/schema) and trust level (trusted/reference/exploratory), organize into baseline vs per-run folders
- `learning-plan`: Generate learning plans with topics, confidence tracking, priorities, open questions, and plan evolution across runs
- `incremental-scanning`: Hash-based file scanning that compares against previous runs to only read changed or new files
- `autonomous-iteration`: Multi-run learning loop with focus selection, deep reading, knowledge accumulation, and stop condition evaluation
- `knowledge-synthesis`: Update and maintain draft documents based on findings, track changes in changelog, maintain unknowns.md

### Modified Capabilities

- `kb-scaffolding`: Add learning plan templates, run-N-staging structure
- `state-management`: Add learning plan state, run progression tracking, stop condition configuration
- `interactive-setup`: Add max-runs configuration during init Q&A

## Impact

**New Commands:**
- `/df-bootstrap` - One-time Run 0 command
- `/df-continue` - Context-aware progression (replaces start/bootstrap/iterate)
- `/df-restart` - Regenerate learning plan

**New Skills:**
- `skills/deepfield-bootstrap.md` - Orchestrates Run 0 workflow
- `skills/deepfield-iterate.md` - Orchestrates autonomous learning loop
- `skills/deepfield-classify.md` - Source classification orchestration

**New Agents:**
- `agents/deepfield-classifier.md` - Source type and trust classification
- `agents/deepfield-scanner.md` - Incremental file scanning
- `agents/deepfield-domain-detector.md` - Auto-detect project domains
- `agents/deepfield-learner.md` - Deep reading and connection
- `agents/deepfield-plan-generator.md` - Learning plan creation and updates
- `agents/deepfield-knowledge-synth.md` - Draft document updates

**New Scripts:**
- `scripts/clone-repos.sh` - Git operations for source cloning
- `scripts/hash-files.js` - Compute file hashes for incremental scanning

**Modified Files:**
- `templates/brief.md` - Add max-runs configuration
- `scripts/scaffold-kb.sh` - Add learning plan templates, run-staging structure
- `commands/df-init.md` - Add optional start trigger with AskUserQuestion
- `commands/df-status.md` - Display learning plan progress and confidence levels

**Four-Space Architecture:**
- `source/baseline/` - Persistent trusted sources (repos, docs)
- `source/run-N/` - Ephemeral per-run inputs
- `source/run-N-staging/` - Auto-created staging for next run
- `wip/learning-plan.md` - Core state artifact driving learning
- `wip/run-N/` - Per-run findings, plans, state
- `drafts/` - Living knowledge documents
