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

Check if deepfield directory exists:

```bash
[ ! -d "./deepfield" ] && echo "❌ Run /df-init first" && exit 1
echo "Setting up deepfield knowledge base..."
```

**Note:** State detection (whether already configured) is handled by the CLI itself, not the plugin. The CLI will check if project.config.json has been filled in and handle reconfiguration prompts.

## Step 2: Collect Answers
Ask questions 1 by 1.

**Question 1:**
- Ask Method: `Normal conversation`
- Question: "What is the learning target project name?"

**Question 2:**
- Ask Method: `AskUserQuestion - Single Choice`
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
