---
name: df-start
description: Interactive project setup and brief.md generation
---

# /df-start - Start Project Setup

Interactive setup that asks essential questions and generates a comprehensive `brief.md` for you to fill out.

## What This Does

1. Asks essential questions via interactive prompts
2. Generates `kb/source/baseline/brief.md` with your answers prefilled
3. Creates initial `kb/project.config.json`
4. Sets up timestamps and version info

## Prerequisites

You must run `/df-init` first to create the kb/ directory structure.

## Usage

```bash
/df-start
```

## Implementation

```bash
# Check if kb/ exists
if [ ! -d "./kb" ]; then
  echo "❌ Error: kb/ directory not found" >&2
  echo "" >&2
  echo "Please run /df-init first to initialize the knowledge base structure." >&2
  exit 1
fi

# Check if brief.md already exists (resumability)
BRIEF_PATH="./kb/source/baseline/brief.md"
if [ -f "$BRIEF_PATH" ]; then
  echo "⚠️  brief.md already exists"
  echo ""
  echo "What would you like to do?"
  echo "  1. Overwrite with new Q&A session"
  echo "  2. Keep existing brief.md"
  echo "  3. Exit and manually edit brief.md"
  echo ""

  # Use AskUserQuestion for choice
  # If user chooses "Keep" or "Exit", skip brief generation
  # If user chooses "Overwrite", continue
fi

echo "Let's set up your knowledge base!"
echo ""
echo "I'll ask a few questions to understand your project."
echo "You can provide more details in the brief.md file after this."
echo ""

# Interactive Q&A using AskUserQuestion tool
```

### Question 1: What is this project?

```yaml
# Use AskUserQuestion tool
questions:
  - question: "What is this project?"
    header: "Project Type"
    multiSelect: false
    options:
      - label: "Legacy codebase I'm taking over"
        description: "Existing system with limited documentation"
      - label: "New team onboarding target"
        description: "Need to create onboarding materials"
      - label: "Vendor/third-party system"
        description: "External system we're integrating with"
      - label: "Monolith to decompose"
        description: "Large system that needs domain boundaries"
```

Store answer in variable: `PROJECT_TYPE`

### Question 2: What's your goal?

```yaml
# Use AskUserQuestion tool
questions:
  - question: "What's your goal for this knowledge base?"
    header: "Primary Goal"
    multiSelect: false
    options:
      - label: "Understand architecture and data flow"
        description: "Map out how the system works"
      - label: "Document for team onboarding"
        description: "Create materials for new team members"
      - label: "Prepare for compliance audit"
        description: "Document security and data handling"
      - label: "Plan system decomposition"
        description: "Identify domain boundaries for refactoring"
```

Store answer in variable: `GOAL`

### Question 3: Any specific areas of concern?

```yaml
# Use AskUserQuestion tool (text input)
questions:
  - question: "Any specific areas of concern or focus? (Optional)"
    header: "Focus Areas"
    multiSelect: true
    options:
      - label: "Authentication & Security"
        description: "How auth works, session management, security patterns"
      - label: "Data Flow & State"
        description: "How data moves through the system"
      - label: "API & Integration"
        description: "API endpoints, external integrations"
      - label: "Deployment & Operations"
        description: "How the system is deployed and monitored"
```

Store answer in variable: `FOCUS_AREAS`

### Question 4: How many runs before pausing?

```yaml
# Use AskUserQuestion tool
questions:
  - question: "How many learning runs should execute before pausing for your review?"
    header: "Max Runs"
    multiSelect: false
    options:
      - label: "3 runs (Recommended)"
        description: "Quick cycles, frequent check-ins"
      - label: "5 runs"
        description: "Balanced - good progress between reviews"
      - label: "10 runs"
        description: "Deep dives, less frequent interruption"
      - label: "Until plan complete"
        description: "Keep going until all HIGH priority topics done"
```

Store answer in variable: `MAX_RUNS` (convert "Until plan complete" to 999)

### Generate brief.md

```bash
# Generate brief.md from template with prefilled answers
TEMPLATE_PATH="${CLAUDE_PLUGIN_ROOT}/templates/brief.md"
BRIEF_OUTPUT="./kb/source/baseline/brief.md"

# Read template
cp "$TEMPLATE_PATH" "$BRIEF_OUTPUT"

# Replace placeholders with user answers
# (Use sed or similar to prefill sections)

echo "✅ Created brief.md at: $BRIEF_OUTPUT"
```

### Create project.config.json

```bash
# Use update-json.js to create config
CONFIG_PATH="./kb/project.config.json"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

${CLAUDE_PLUGIN_ROOT}/scripts/update-json.js "$CONFIG_PATH" "{
  \"version\": \"1.0.0\",
  \"projectName\": \"$PROJECT_TYPE\",
  \"goal\": \"$GOAL\",
  \"repositories\": [],
  \"maxRuns\": $MAX_RUNS,
  \"createdAt\": \"$NOW\",
  \"lastModified\": \"$NOW\"
}"

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to create project configuration" >&2
  exit 1
fi

echo "✅ Created project configuration"
```

### Display completion message

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Brief created at: $BRIEF_OUTPUT"
echo ""
echo "Next steps:"
echo "  1. Open and fill out the brief.md file"
echo "     - Add repository URLs and branches"
echo "     - List key documents and wikis"
echo "     - Note areas of concern"
echo ""
echo "  2. Once brief is filled out, run:"
echo "     /df-bootstrap  (Phase 2 - begins learning)"
echo ""
echo "  3. Check status anytime with:"
echo "     /df-status"
echo ""
echo "The brief.md file has been prefilled with your answers."
echo "Add more details to help the AI understand your project better."
echo ""
```

## Error Handling

### kb/ Directory Not Found

If `kb/` doesn't exist:
- Display clear error message
- Instruct user to run `/df-init` first
- Exit with code 1

### User Cancellation

If user cancels during Q&A:
- Exit gracefully
- Don't modify any files
- User can retry `/df-start` later

### Existing brief.md

If brief.md already exists:
- Prompt user for action (overwrite/keep/exit)
- If keep: Skip brief generation, update config only
- If overwrite: Proceed with new Q&A
- If exit: Exit without changes

### Script Failures

If `update-json.js` fails:
- Display error message
- Don't proceed to completion message
- Exit with non-zero code

## State Transitions

```
INITIALIZED (kb/ exists, no project.config.json)
  → Run /df-start
BRIEF_CREATED (project.config.json and brief.md exist)
```

## Files Created

- `kb/source/baseline/brief.md` (generated from template with prefilled answers)
- `kb/project.config.json` (initial configuration with timestamps)

## Files Modified

- None (this command only creates, doesn't modify existing files unless user confirms overwrite)
