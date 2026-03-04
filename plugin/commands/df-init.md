---
name: df-init
description: Initialize deepfield/ directory structure for knowledge base
allowed-tools:
  - Bash
---

# df-init: Initialize Deepfield Knowledge Base

Initialize the deepfield/ directory structure in the current project for AI-driven knowledge base building.

## What This Command Does

This command wraps the `deepfield init` CLI tool to create the complete directory structure for a knowledge base workspace. It creates:

- **deepfield/source/**: Source materials and baselines
- **deepfield/wip/**: Work in progress (active exploration runs)
- **deepfield/drafts/**: Draft documents and notes
- **deepfield/output/**: Final knowledge base artifacts
- Template files: project.config.json, brief.md, project-map.md, domain-index.md, unknowns.md, _changelog.md

## Implementation

Execute the following steps:

1. **Check if CLI is available**: Verify that `deepfield` or `df` command is available in PATH

2. **Run the init command**:
   ```bash
   deepfield init
   ```

3. **Handle the result**:
   - If exit code is 0 (success):
     - Confirm initialization was successful
     - Continue to step 4 (DEEPFIELD.md scaffolding)
   - If exit code is non-zero (error):
     - Display the error message
     - Provide troubleshooting suggestions based on error type
     - If CLI not found, suggest installation: `npm install -g deepfield`

4. **Scaffold DEEPFIELD.md (optional)**:

   After successful initialization, check whether `deepfield/DEEPFIELD.md` already exists:

   ```bash
   test -f deepfield/DEEPFIELD.md && echo "exists" || echo "missing"
   ```

   - **If it already exists**: Inform the user that `deepfield/DEEPFIELD.md` is already present and will not be overwritten.
   - **If it does not exist**: Ask the user:
     > Would you like to create `deepfield/DEEPFIELD.md`? This file lets you configure how Deepfield learns and documents your project — output language, domain priorities, exclusions, and more. (Recommended) [y/N]

     - **If yes**: Copy the template from `${CLAUDE_PLUGIN_ROOT}/templates/DEEPFIELD.md` to `deepfield/DEEPFIELD.md`:
       ```bash
       cp "${CLAUDE_PLUGIN_ROOT}/templates/DEEPFIELD.md" deepfield/DEEPFIELD.md
       ```
       Then confirm: "Created `deepfield/DEEPFIELD.md`. Open it to customize how Deepfield learns your project."
     - **If no**: Skip creation. Mention they can create it later — Deepfield works fine without it using sensible defaults.

5. **Provide next steps**:
   - Suggest running `/df-start` to configure the knowledge base
   - Explain that the brief.md file needs to be filled out with project context
   - Mention that `/df-status` can be used to check progress

## Success Output Example

```
✅ Deepfield initialized successfully!

📋 Next step: Run /df-start to configure your project
```

## Error Handling

- **CLI not found**: Provide installation instructions
- **Permission error**: Suggest checking directory permissions
- **Directory already exists**: Inform user that existing files are preserved

## Tips for Claude

- This is typically the first command in the workflow
- After successful initialization, proactively suggest running `/df-start`
- The deepfield/ directory becomes the workspace for all knowledge base activities
