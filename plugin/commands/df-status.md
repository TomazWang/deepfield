---
name: df-status
description: Display current state of deepfield knowledge base
allowed-tools:
  - Bash
---

# df-status: Check Deepfield Status

Display the current state of the deepfield knowledge base and suggest next actions.

## What This Command Does

This command wraps the `deepfield status` CLI tool to show:

- Current workflow state (EMPTY, INITIALIZED, CONFIGURED, READY, etc.)
- Project information (name, goal, focus areas)
- Last modified timestamp
- Number of exploration runs (Phase 2+)
- Suggested next action based on current state

## Implementation

Execute the following steps:

1. **Run the status command**:
   ```bash
   deepfield status
   ```

   For detailed information, use verbose mode:
   ```bash
   deepfield status --verbose
   ```

2. **Interpret the output** and provide Claude-friendly context:

   **State: EMPTY (⭕ Not initialized)**
   - Means: No deepfield/ directory exists
   - Next: Run `/df-init` to create directory structure

   **State: INITIALIZED (🏗️ Initialized)**
   - Means: Directory exists but no configuration
   - Next: Run `/df-start` to configure the project

   **State: CONFIGURED (⚙️ Configured)**
   - Means: Configuration exists but brief needs filling
   - Next: Fill out `deepfield/brief.md` with project context

   **State: READY (✅ Ready)**
   - Means: Brief is filled out and ready for exploration
   - Next: Phase 2+ will add exploration commands

   **State: COMPLETED (🎉 Completed)**
   - Means: Exploration runs have been completed
   - Next: Check `deepfield/output/` for results

3. **Display project information** when available:
   - Project name and goal
   - Project type and focus areas
   - Last modification time
   - Number of runs (if any)

4. **Provide actionable guidance** based on state:
   - If EMPTY: Emphasize starting with `/df-init`
   - If INITIALIZED: Guide to `/df-start`
   - If CONFIGURED: Encourage filling out brief.md thoroughly
   - If READY: Explain current capabilities (Phase 1) and what's coming
   - If COMPLETED: Guide to outputs

## Success Output Example

```
📊 Deepfield Status

Current State: ✅ Ready for exploration

📁 Project Information:
  Name: My Legacy API
  Goal: Understand authentication flow and data models
  Type: legacy-brownfield
  Focus Areas: 3
  Last Modified: 2024-01-15 14:30

💡 Next step:
  Your knowledge base is ready! (Phase 2+ will add exploration commands)

📂 Working Directory: /path/to/project
📂 Knowledge Base: /path/to/project/deepfield
```

## State Interpretation for Claude

Help interpret the state and guide the user:

- **EMPTY**: "Let's start by initializing the directory structure with `/df-init`"
- **INITIALIZED**: "Now we need to configure your project. Run `/df-start`"
- **CONFIGURED**: "The configuration is saved. Let's fill out the brief to guide exploration"
- **READY**: "Your knowledge base is set up and ready. Phase 2 will add exploration capabilities"
- **IN_PROGRESS**: "Exploration is running. This will be available in Phase 2+"
- **COMPLETED**: "Exploration complete! Let's review the generated knowledge base"

## Error Handling

- If the command fails, interpret common errors:
  - State file issues: Explain what might be wrong
  - Permission issues: Suggest fixes
  - CLI not found: Provide installation instructions

## Tips for Claude

- Use this command to understand where the user is in the workflow
- Proactively suggest this command when unsure of current state
- Interpret the state and provide contextual guidance
- In Phase 1, set expectations that exploration commands come in Phase 2+
