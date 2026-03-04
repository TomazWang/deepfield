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
  - name: --parallel
    description: Run domain-learning agents concurrently (one agent per domain, in parallel)
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
- **Parallel mode**: `true` if `--parallel` flag is present, otherwise `false`
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

### --parallel

When `--parallel` is passed:
- Tell the skill to use parallel domain-learning mode
- The skill will spawn one `deepfield-domain-learner` agent per domain, running concurrently
- All agents run in background Tasks simultaneously (up to `--max-agents` limit)
- Findings are consolidated from all domain agents before synthesis
- Display parallel mode status: "Parallel mode: X domains, max Y concurrent agents"
- Cannot be combined with `--focus` (parallel mode learns all domains; use `--focus` for sequential targeted learning)

### --max-agents=N

When `--max-agents=N` is passed alongside `--parallel`:
- Set the maximum number of domain agents running concurrently to N
- If domain count exceeds N, agents are batched: each batch of N runs in parallel, batches run sequentially
- Default is 5 if `--parallel` is used without `--max-agents`
- Minimum value: 1 (effectively sequential, but using the parallel code path)

## Output

The command itself produces minimal output — just validation messages and then hands off to the skill. The skill produces the detailed progress and completion reports.

### On Success

```
Invoking autonomous learning...
[Parallel mode: X domains, max Y agents concurrent]   ← only shown when --parallel

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
- If user passes both `--parallel` and `--focus`, explain they are mutually exclusive and ask which behavior they prefer
- Recommend `--parallel` for projects with 4+ domains; mention the typical speedup (3-5x)
