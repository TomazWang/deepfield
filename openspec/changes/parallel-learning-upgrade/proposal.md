## Why

Parallel domain learning in `/df-iterate` is currently opt-in via `--parallel`, but after Run 0 the domain index always exists and parallel execution is almost always preferred. The existing launch pattern (`Launch (background): deepfield-domain-learner`) is prose text that Claude interprets inconsistently — it does not reliably produce true concurrent background execution. This causes parallel mode to be underused and, when used, to not deliver the promised 3-5x speedup.

## What Changes

- **Flip parallel/sequential default**: After Run 0 (when `domain-index.md` exists), parallel mode becomes the default. Users who want sequential execution must pass `--sequential`. The `--parallel` flag is removed and replaced with `--sequential`.
- **Replace prose agent launch with explicit Agent tool call pattern**: The skill's parallel execution section is rewritten to use explicit Agent tool invocation instructions (`run_in_background: true`) matching the pattern from `.claude/skills/parallel-work/SKILL.md`. All domain context is embedded directly in the prompt string.
- **Batch coordination**: The skill explicitly instructs launching all agents for a batch in a single message (one tool call block with multiple Agent invocations), then waiting for all to complete.
- **Agent ID tracking**: Agent IDs returned by Agent tool calls are recorded in the run config for traceability.
- Update command help text and argument definitions to reflect the new default and new `--sequential` flag.

## Capabilities

### New Capabilities

- `parallel-default-mode`: After bootstrap, parallel execution is the default mode for `/df-iterate`; sequential requires explicit opt-out via `--sequential`.
- `agent-tool-launch-pattern`: Domain learner agents are launched using the explicit Agent tool call pattern with `run_in_background: true` and inline domain context embedded in the prompt.
- `agent-id-tracking`: Agent IDs from background Agent tool calls are captured and stored in the run config for traceability.

### Modified Capabilities

- `plugin-skills`: The `deepfield-iterate` skill's parallel mode section is rewritten with the new default logic and Agent tool invocation pattern.
- `plugin-commands`: The `df-iterate` command's `--parallel` flag is replaced with `--sequential`; help text updated.

## Impact

- `plugin/skills/deepfield-iterate.md` — primary change: parallel/sequential mode selection logic (Step 4), agent launch pattern (Step 4d), run config recording (Step 4e)
- `plugin/commands/df-iterate.md` — flag definitions and argument handling section
- No changes to consolidation/synthesis steps, no changes to sequential mode behavior beyond it becoming opt-in
- No CLI changes; no agent file changes
