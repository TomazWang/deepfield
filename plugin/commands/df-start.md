---
name: df-start
description: Interactive project setup using AskUserQuestion and non-interactive CLI
allowed-tools:
  - Bash
  - AskUserQuestion
---

# df-start: Start Deepfield Project Setup

**IMPLEMENTATION INSTRUCTIONS FOR CLAUDE:**

When this command is invoked, you MUST follow these steps in order. DO NOT call `deepfield start` without the `--non-interactive` flag.

---

## Step 1: Verify Prerequisites

Check if deepfield directory exists and isn't already configured:

```bash
if [ ! -d "./deepfield" ]; then
  echo "❌ Error: deepfield/ directory not found"
  echo ""
  echo "Please run /df-init first to initialize the knowledge base structure."
  exit 1
fi

# Check if already configured (project.config.json has projectName filled in)
if [ -f "./deepfield/project.config.json" ]; then
  PROJECT_NAME=$(grep -o '"projectName"[[:space:]]*:[[:space:]]*"[^"]\+"' ./deepfield/project.config.json | grep -o '"[^"]\+$' | tr -d '"')
  if [ -n "$PROJECT_NAME" ]; then
    echo "⚠️  Project configuration already exists"
    echo ""
    echo "Project: $PROJECT_NAME"
    echo "The deepfield/ directory is already configured."
    echo "You can edit deepfield/brief.md directly to update project details."
    echo ""
    echo "To reconfigure, delete deepfield/project.config.json and run /df-start again."
    exit 0
  fi
fi

echo "Let's set up your deepfield knowledge base!"
echo ""
```

## Step 2: Collect Answers via AskUserQuestion

Use the AskUserQuestion tool with these questions:

**Question 1:**
- Question: "What is the learning target project name?"
- Header: "Project Name"
- Options: Suggest 2-3 names based on current directory name
- Allow user to type custom name in "Other"

**Question 2:**
- Question: "What is your main goal for this knowledge base?"
- Header: "Main Goal"
- Options (with full descriptions):
  - "Generate comprehensive documentation" → Store: "Generate comprehensive documentation for the entire project"
  - "Document recent changes" → Store: "Document and understand recent code changes"
  - "Team onboarding materials" → Store: "Create onboarding materials for new team members"
  - "Prepare for migration/refactor" → Store: "Understand system for migration or refactoring"

**Fixed Defaults (not asked):**
- Focus Areas: Always default to `["architecture", "business-logic"]`
- Project Type: Always `"legacy-brownfield"` (all targets are legacy code)

## Step 3: Build JSON and Call CLI Non-Interactively

After collecting answers from Q1 and Q2 only:

1. Map the answers:
   - `projectName`: Answer from Q1
   - `projectType`: Always `"legacy-brownfield"` (hardcoded - not asked)
   - `goal`: Full description text from Q2 selected option
   - `focusAreas`: Always `["architecture", "business-logic"]` (hardcoded default - not asked)

2. Build JSON string with proper escaping

3. Execute:
   ```bash
   deepfield start --non-interactive --answers-json '<JSON_STRING_HERE>'
   ```

**Example:**
```bash
deepfield start --non-interactive --answers-json '{"projectName":"my-app","projectType":"legacy-brownfield","goal":"Generate comprehensive documentation for the entire project","focusAreas":["architecture","business-logic"]}'
```

4. Display success message and next steps

## Error Handling

- **deepfield/ not found**: Exit with error, suggest /df-init
- **User cancels AskUserQuestion**: Exit gracefully, no file changes
- **CLI fails**: Display error and troubleshooting steps

## Success Output

```
✅ Project setup complete!

📝 Next steps:
  1. Review and edit deepfield/brief.md with project details
  2. When ready, run /df-continue to begin learning
```

---

**CRITICAL**: NEVER call `deepfield start` without `--non-interactive` flag. It will block waiting for stdin and fail in Claude Code.
