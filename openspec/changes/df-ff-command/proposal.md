## Why

Users running `/df-iterate` must manually trigger each learning cycle and wait for feedback prompts between runs, making the process slow and requiring constant attention for projects with clear structure and good sources. A fast-forward command enables autonomous multi-run learning without user intervention, enabling batch and CI/CD use cases.

## What Changes

- Add new `/df-ff` command that runs multiple learning iterations autonomously
- Add new `deepfield-ff` skill that orchestrates the fast-forward loop with configurable stop conditions
- Add `check-confidence.js` script that calculates confidence scores from run configs and learning plan
- Stop conditions: confidence threshold reached, max runs hit, diminishing returns, blocked on sources, domain restructure detected
- Progress reporting after each run showing confidence changes per topic
- Feedback collection prompt at end (optional, default on)
- No user feedback prompts between individual runs

## Capabilities

### New Capabilities

- `df-ff-command`: The `/df-ff` Claude Code plugin command — validates prerequisites, parses arguments (`--max-runs`, `--min-confidence`, `--domains`, `--stop-on-blocked`, `--feedback-at-end`), then invokes the `deepfield-ff` skill
- `deepfield-ff-skill`: Skill that orchestrates multiple learning iterations in a loop, evaluating stop conditions after each run and reporting progress, without pausing for user feedback between runs
- `confidence-scoring`: Script (`check-confidence.js`) that reads run configs and learning plan to compute current per-domain confidence scores and determine if thresholds are met

### Modified Capabilities

- `plugin-commands`: New command file added to the command set (no requirement change, just addition)

## Impact

- New files: `plugin/commands/df-ff.md`, `plugin/skills/deepfield-ff.md`, `plugin/scripts/check-confidence.js`
- Depends on existing `deepfield-iterate` skill logic (invokes it per run or reuses its internals)
- No breaking changes to existing commands
- Relies on `run-N.config.json` confidence data written by existing iterate skill
