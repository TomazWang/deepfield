# Complete Workflow Example

This example shows a complete Deepfield workflow from initialization to configuration.

## Scenario

You're joining a team that maintains a legacy e-commerce API built in Ruby on Rails 5 years ago. The documentation is sparse, and you need to understand the authentication system and payment processing flow.

## Step 1: Initialize

**Run:** `/df-init`

**Output:**
```
🚀 Deepfield Initialization

Creating directory structure...

✓ Created:
  /project/deepfield
  /project/deepfield/source
  /project/deepfield/source/baseline
  /project/deepfield/source/baseline/repos
  /project/deepfield/wip
  /project/deepfield/drafts
  /project/deepfield/output
  /project/deepfield/project.config.json
  /project/deepfield/brief.md
  ...

✅ Deepfield initialized successfully!

📋 Next steps:
  1. Run /df-start to begin interactive setup
  2. Fill out the brief.md with project context
  3. Use /df-status to check your progress
```

## Step 2: Configure

**Run:** `/df-start`

**Interactive prompts and answers:**

```
Q: What is the project name?
A: Legacy E-Commerce API

Q: What type of project is this?
A: Legacy codebase (brownfield)

Q: What is the main goal of this knowledge base?
A: Understand authentication flow and payment processing to modernize the system

Q: Select focus areas:
A: [x] Architecture and design patterns
   [x] Security and authentication
   [ ] Data models and schemas
   [x] API endpoints and integrations
   [ ] Business logic and workflows
   [ ] Performance and scalability
   [ ] Testing strategy
   [ ] Deployment and operations
```

**Output:**
```
✅ Project setup complete!

📄 Configuration saved:
  • Project: Legacy E-Commerce API
  • Type: legacy-brownfield
  • Goal: Understand authentication flow and payment processing to modernize the system
  • Focus: 3 area(s)

📝 Next steps:
  1. Open deepfield/brief.md and fill in the details
  2. Add context about your project, architecture, and pain points
  3. When ready, future commands will use this brief to guide exploration
```

## Step 3: Fill Out Brief

**Edit:** `deepfield/brief.md`

See `brief-example.md` for a filled-out example.

## Step 4: Check Status

**Run:** `/df-status`

**Output:**
```
📊 Deepfield Status

Current State: ✅ Ready for exploration

📁 Project Information:
  Name: Legacy E-Commerce API
  Goal: Understand authentication flow and payment processing to modernize the system
  Type: legacy-brownfield
  Focus Areas: 3
  Last Modified: 2024-01-15 14:30:22

💡 Next step:
  Your knowledge base is ready! (Phase 2+ will add exploration commands)

📂 Working Directory: /Users/dev/ecommerce-api
📂 Knowledge Base: /Users/dev/ecommerce-api/deepfield
```

## Key Takeaways

1. **Always start with `/df-init`** to create the directory structure
2. **Use `/df-start`** to configure through interactive prompts
3. **Fill out the brief thoroughly** - it guides all exploration
4. **Check `/df-status`** anytime to see where you are
5. **Be specific** about goals and pain points in your configuration

## What Happens Next (Phase 2+)

In Phase 2, you'll be able to run exploration commands that:
- Scan the codebase incrementally
- Build domain-specific knowledge
- Answer your specific questions
- Update automatically when code changes

Phase 1 (current) focuses on setup and scaffolding. The AI exploration magic comes in Phase 2+.
