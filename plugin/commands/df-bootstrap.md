---
name: df-bootstrap
description: Run initial bootstrap (Run 0) - classify sources, scan structure, detect domains, generate learning plan
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
---

# /df-bootstrap - Initial Bootstrap (Run 0)

Runs the initial bootstrap process that classifies sources, scans project structure, detects domains, and generates the first learning plan.

## Prerequisites

Before running, verify ALL of the following:

1. **deepfield/ directory exists** in the current working directory
2. **Project config exists**: `deepfield/project.config.json`
3. **Brief is filled out**: `deepfield/brief.md` has been completed by the user (check that the config shows it's filled)
4. **Run 0 has NOT been completed**: `deepfield/wip/run-0/run-0.config.json` should not exist with status "completed"

If any prerequisite fails:
- No `deepfield/`: "Run `/df-init` first to create the directory structure."
- No config: "Run `/df-start` first to configure your project."
- Brief not filled: "Please fill out `deepfield/brief.md` with your project information, then try again."
- Run 0 already done: "Bootstrap has already been completed. Use `/df-iterate` or `/df-continue` to continue learning."

## State Validation

```bash
# Check deepfield directory
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

# Check project config
if [ ! -f "./deepfield/project.config.json" ]; then
  echo "No project configuration found. Run /df-start first."
  exit 1
fi

# Check brief is filled (config has projectName set)
# Read project.config.json and check if projectName is non-empty
PROJECT_NAME=$(node -e "const c=require('./deepfield/project.config.json'); console.log(c.projectName||'')" 2>/dev/null)
if [ -z "$PROJECT_NAME" ]; then
  echo "Project brief not configured. Run /df-start to set up your project."
  exit 1
fi

# Check Run 0 not already complete
if [ -f "./deepfield/wip/run-0/run-0.config.json" ]; then
  RUN_STATUS=$(node -e "const c=require('./deepfield/wip/run-0/run-0.config.json'); console.log(c.status||'')" 2>/dev/null)
  if [ "$RUN_STATUS" = "completed" ]; then
    echo "Bootstrap already completed. Use /df-iterate or /df-continue to continue."
    exit 0
  fi
fi
```

## Execution

After validation passes, invoke the **deepfield-bootstrap** skill.

The skill handles the full Run 0 workflow:
1. Reading and parsing brief.md
2. Classifying sources (via classifier agent)
3. Cloning repositories (via clone-repos.sh script)
4. Scanning project structure (via scanner agent)
5. Detecting domains (via domain-detector agent)
6. Generating project map
7. Generating learning plan (via plan-generator agent)
8. Computing initial file hashes
9. Writing Run 0 config and findings
10. Creating initial draft skeletons
11. Updating project config
12. Creating staging area for Run 1
13. Reporting completion

## Output

The command produces minimal output — just validation messages and then hands off to the skill.

### On Success

```
Running bootstrap (Run 0)...

[Skill takes over and produces detailed output including domains detected, learning plan, etc.]
```

### On Validation Failure

```
Cannot run bootstrap: [specific reason]

[Suggestion for how to fix]
```

## Relationship to /df-continue

`/df-continue` detects BRIEF_READY state and invokes bootstrap automatically. `/df-bootstrap` is the direct command for users who want to explicitly trigger bootstrap.

## Tips for Claude

- Bootstrap can take a while for large codebases — set expectations
- After bootstrap, suggest reviewing `deepfield/wip/learning-plan.md`
- If bootstrap fails partway, the user can retry — the skill handles partial state
- After success, guide user to `/df-iterate` or `/df-continue` for next steps
