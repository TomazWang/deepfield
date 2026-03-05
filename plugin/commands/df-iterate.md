---
name: df-iterate
description: Run autonomous learning iterations on the knowledge base
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
arguments:
  - name: --once
    description: Run a single iteration instead of autonomous loop
    required: false
  - name: --focus
    description: Focus on a specific domain (e.g. --focus=authentication)
    required: false
  - name: --sequential
    description: Run in sequential mode instead of the parallel default (one domain at a time)
    required: false
  - name: --max-agents
    description: Maximum number of domain agents to run concurrently in parallel mode (default 5)
    required: false
---

# /df-iterate - Autonomous Learning Iterations

Run learning iterations that read source code, synthesize knowledge, and update drafts. Continues autonomously until a stop condition is met, or runs once with `--once`.

## Prerequisites

Before running, verify ALL of the following:

1. **deepfield/ directory exists** in the current working directory
2. **Bootstrap (Run 0) is complete**: `deepfield/wip/run-0/` exists with a completed run config
3. **Learning plan exists**: `deepfield/wip/learning-plan.md`
4. **Project config exists**: `deepfield/project.config.json`

If any prerequisite fails, display a clear error and suggest the correct command:
- No `deepfield/`: "Run `/df-init` first"
- No Run 0: "Run `/df-continue` or `/df-bootstrap` to complete bootstrap first"
- No learning plan: "Bootstrap may have failed. Check `/df-status`"

## State Validation

```bash
# Check deepfield directory
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

# Check Run 0 completed
if [ ! -f "./deepfield/wip/run-0/run-0.config.json" ]; then
  echo "Bootstrap (Run 0) not complete. Run /df-continue first."
  exit 1
fi

# Check learning plan
if [ ! -f "./deepfield/wip/learning-plan.md" ]; then
  echo "No learning plan found. Bootstrap may have failed. Check /df-status."
  exit 1
fi
```

## Execution

After validation passes, invoke the **deepfield-iterate** skill with the following context:

### Pass to Skill

- **Mode**: autonomous (default) or single (`--once`)
- **Focus domain**: value of `--focus` if provided, otherwise let skill select from learning plan
- **Parallel mode**: `true` by default (unless `--sequential` flag is passed)
- **Sequential mode**: `true` if `--sequential` flag is present, otherwise `false`
- **Max agents**: value of `--max-agents` if provided (default: 5), only relevant in parallel mode
- **Working directory**: current directory (where `deepfield/` lives)

### Invoke Skill

Delegate all learning logic to the `deepfield-iterate` skill. The skill handles:

1. Determining the next run number
2. Loading context from previous runs
3. Selecting focus topics
4. Incremental scanning
5. Deep learning via learner agent
6. Knowledge synthesis via synth agent
7. Updating the learning plan
8. Evaluating stop conditions
9. Creating staging area on stop
10. Reporting completion

## Argument Handling

### --once

When `--once` is passed:
- Tell the skill to run exactly one iteration
- Skip stop condition evaluation
- Always create staging area after the single run
- Report single-run completion

### --focus=DOMAIN

When `--focus=domain` is passed:
- Tell the skill to prioritize the specified domain
- The skill should select topics related to that domain
- Other topics may still be included if closely related

### --sequential

When `--sequential` is passed:
- Tell the skill to use sequential domain-learning mode (one domain at a time)
- Overrides the default parallel mode
- Useful for debugging, tracing agent output, or low-resource environments
- Can be combined with `--focus` for targeted sequential learning of a single domain

> Note: `--parallel` is no longer a valid flag. Parallel mode is the default when `domain-index.md` exists. Use `--sequential` to opt out.

### --max-agents=N

When `--max-agents=N` is passed:
- Set the maximum number of domain agents running concurrently to N
- If domain count exceeds N, agents are batched: each batch of N runs in parallel, batches run sequentially
- Default is 5
- Minimum value: 1 (effectively sequential, but using the parallel code path)
- Only relevant when running in parallel mode (i.e., `--sequential` was NOT passed)

## Output

The command itself produces minimal output — just validation messages and then hands off to the skill. The skill produces the detailed progress and completion reports.

### On Success

```
Invoking autonomous learning...
[Parallel mode: X domains, max Y agents concurrent]

[Skill takes over and produces detailed output]
```

### On Validation Failure

```
Cannot run iterations: [specific reason]

[Suggestion for how to fix]
```

## Relationship to /df-continue

`/df-continue` is the smart router that detects state and picks the right action. When it detects LEARNING state with new input, it effectively does what `/df-iterate` does. `/df-iterate` is the direct command for users who know they want to run iterations without state detection.

## Tips for Claude

- Always validate prerequisites before invoking the skill
- If the user seems confused about workflow order, suggest `/df-continue` instead
- After completion, suggest reviewing `deepfield/drafts/` for updated documentation
- If stopped due to BLOCKED, highlight which sources are needed
- If user passes `--parallel`, inform them it is no longer a valid flag — parallel is now the default, and they can use `--sequential` to opt out
- Recommend `--sequential` when debugging agent output or tracing specific domain learning; parallel is the default for speed
