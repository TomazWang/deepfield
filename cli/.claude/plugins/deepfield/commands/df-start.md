---
name: df-start
description: Interactive project setup using AskUserQuestion and non-interactive CLI
---

# /df-start - Start Project Setup

**CRITICAL INSTRUCTIONS FOR CLAUDE:**

This command MUST follow these steps in exact order. DO NOT execute any bash commands until instructed to do so in Step 3.

---

## Step 1: Verify Prerequisites

First, check if the deepfield directory exists and if the project is already configured:

<function_calls>
<invoke name="Bash">
<parameter name="command">
if [ ! -d "./deepfield" ]; then
  echo "ERROR: deepfield/ directory not found"
  exit 1
fi

if [ -f "./deepfield/brief.md" ]; then
  BRIEF_SIZE=$(wc -l < "./deepfield/brief.md" 2>/dev/null || echo 0)
  if [ "$BRIEF_SIZE" -gt 50 ]; then
    echo "ALREADY_CONFIGURED"
    exit 0
  fi
fi

echo "OK"
