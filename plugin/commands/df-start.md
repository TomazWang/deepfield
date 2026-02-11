---
name: df-start
description: Start interactive project setup for deepfield knowledge base
allowed-tools:
  - Bash
---

# df-start: Start Deepfield Project Setup

Run interactive setup to configure your deepfield knowledge base project.

## What This Command Does

This command wraps the `deepfield start` CLI tool to conduct an interactive Q&A session about the project. It collects:

- Project name
- Project type (legacy codebase, team onboarding, documentation, etc.)
- Main goal of the knowledge base
- Focus areas (architecture, data models, APIs, security, etc.)

The answers are saved to `project.config.json` and used to pre-fill the `brief.md` template.

## Prerequisites

- The `deepfield/` directory must exist (run `/df-init` first)
- The `deepfield init` command must have been completed successfully

## Implementation

Execute the following steps:

1. **Check prerequisites**: Verify deepfield/ directory exists

2. **Run the start command**:
   ```bash
   deepfield start
   ```

   This will launch an interactive prompt asking questions about the project

3. **Handle the result**:
   - If exit code is 0 (success):
     - Confirm configuration was saved
     - Emphasize the importance of filling out brief.md
     - Explain what information to add to the brief
   - If exit code is 3 (state error):
     - If deepfield/ not found, suggest running `/df-init` first
   - If exit code is non-zero (other error):
     - Display the error message
     - Provide troubleshooting suggestions

4. **Guide next steps**:
   - Open `deepfield/brief.md` and show the user what needs to be filled in:
     - Project context and purpose
     - Technical overview and architecture
     - Pain points and areas of confusion
     - Exploration priorities
     - Questions to answer
   - Explain that the brief guides the AI's exploration process
   - Suggest running `/df-status` to check progress

## Success Output Example

```
✅ Project configured successfully!

📝 Important: Fill out deepfield/brief.md with:
   - Project context and architecture details
   - Pain points and areas of confusion
   - Questions you want answered

The more context you provide, the better the knowledge base will be.

Run /df-status to check your progress.
```

## Error Handling

- **deepfield/ not found**: Suggest running `/df-init` first
- **Configuration already exists**: Inform user they're reconfiguring
- **CLI not found**: Provide installation instructions

## About brief.md

The brief.md file is crucial for guiding AI exploration. Encourage the user to provide:

- **Context**: What the project does, why it exists, key stakeholders
- **Technical Overview**: Architecture, core technologies, dependencies
- **Pain Points**: Known issues, unclear areas, technical debt
- **Priorities**: What areas to investigate first
- **Questions**: Specific questions they want answered

## Tips for Claude

- After successful setup, emphasize filling out the brief.md
- The quality of the knowledge base depends on the quality of the brief
- Offer to help the user fill out the brief if they ask
