## Why

Sequential domain learning in `/df-iterate` forces each domain to be analyzed one after another, making large projects with 4+ domains take 3-5x longer than necessary. Parallel agent execution can dramatically reduce per-run time by analyzing all domains concurrently.

## What Changes

- New `deepfield-domain-learner` agent that focuses on a single domain in isolation
- New `run-parallel-learning.js` orchestrator script that spawns and coordinates multiple domain-learner agents concurrently
- Updated `deepfield-iterate` skill to support parallel mode — reads domain-index, spawns agents in parallel, gathers consolidated findings
- Updated `df-iterate` command to accept `--parallel` and `--max-agents` flags
- New `gather-domain-findings.js` script to consolidate per-domain findings into a single run findings file

## Capabilities

### New Capabilities

- `parallel-domain-learning`: Parallel orchestration of multiple domain-learner agents within a single run, with consolidated findings output

### Modified Capabilities

- `plugin-skills`: `deepfield-iterate` skill updated to support parallel mode alongside existing sequential mode

## Impact

- `plugin/agents/` — new `deepfield-domain-learner.md` agent file
- `plugin/scripts/` — new `run-parallel-learning.js` and `gather-domain-findings.js` scripts
- `plugin/skills/deepfield-iterate.md` — updated to support parallel execution path
- `plugin/commands/df-iterate.md` — updated to document `--parallel` and `--max-agents` flags
- No breaking changes to sequential mode; parallel is opt-in via flag
