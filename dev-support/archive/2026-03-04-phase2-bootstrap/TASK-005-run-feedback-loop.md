# Task 005: Run Feedback Loop

**Feature:** Add user review checkpoint after each run
**Priority:** 🟡 High
**Status:** Not Started
**Estimated Time:** 4-6 hours
**OpenSpec Change:** `feat/run-feedback-loop`

---

## Objective

After each run (including Run 0), pause for user review and collect feedback to improve the next run.

---

## Problem

**Current:** Bootstrap completes, no user review
**Issue:** AI might misunderstand or miss things, user has no chance to correct
**Expected:** Review → Feedback → Incorporate in next run

---

## What to Implement

### Feedback Workflow

```
Run N completes
  ↓
Show summary of findings
  ↓
Prompt: "Review findings? [y/n]"
  ↓
If yes:
  - Show what was learned
  - Ask for feedback
  - Store feedback
  - Update learning plan
  ↓
Continue to next run (or iterate)
```

---

## Implementation

### 1. Post-Run Summary

**After bootstrap (Run 0) completes:**

```javascript
function showRunSummary(runNumber) {
  console.log(`\\n✅ Run ${runNumber} completed!\\n`);

  console.log('📊 Summary:');
  console.log(`  - Repositories scanned: ${repoCount}`);
  console.log(`  - Domains detected: ${domainCount}`);
  console.log(`  - Files analyzed: ${fileCount}`);
  console.log(`  - Learning plan created: deepfield/wip/learning-plan.md\\n`);

  console.log('📂 Review findings at:');
  console.log(`  - deepfield/wip/project-map.md`);
  console.log(`  - deepfield/wip/domain-index.md`);
  console.log(`  - deepfield/wip/learning-plan.md\\n`);
}
```

### 2. Feedback Prompt

**File:** `plugin/scripts/collect-feedback.js`

```javascript
#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

async function collectFeedback(runNumber) {
  console.log('📝 Help improve the next run by providing feedback\\n');

  const { wantsFeedback } = await inquirer.prompt([{
    type: 'confirm',
    name: 'wantsFeedback',
    message: 'Would you like to review findings and provide feedback?',
    default: true
  }]);

  if (!wantsFeedback) {
    console.log('⏭️  Skipping feedback\\n');
    return null;
  }

  const feedback = {
    runNumber,
    timestamp: new Date().toISOString(),
    corrections: [],
    additions: [],
    priorities: [],
    comments: ''
  };

  // Ask about domains
  const { domainFeedback } = await inquirer.prompt([{
    type: 'confirm',
    name: 'domainFeedback',
    message: 'Are the detected domains correct?',
    default: true
  }]);

  if (!domainFeedback) {
    const { domainCorrections } = await inquirer.prompt([{
      type: 'editor',
      name: 'domainCorrections',
      message: 'Describe domain corrections (opens editor):',
      default: 'Domains to add:\\n- \\n\\nDomains to remove:\\n- \\n\\nDomains to rename:\\n- '
    }]);
    feedback.corrections.push({
      topic: 'domains',
      content: domainCorrections
    });
  }

  // Ask about missing context
  const { hasMissingContext } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasMissingContext',
    message: 'Is there missing context that would help?',
    default: false
  }]);

  if (hasMissingContext) {
    const { missingContext } = await inquirer.prompt([{
      type: 'editor',
      name: 'missingContext',
      message: 'Describe missing context (opens editor):',
      default: 'Additional information:\\n\\n- '
    }]);
    feedback.additions.push({
      topic: 'context',
      content: missingContext
    });
  }

  // Ask about priorities
  const { customPriorities } = await inquirer.prompt([{
    type: 'confirm',
    name: 'customPriorities',
    message: 'Would you like to adjust learning priorities?',
    default: false
  }]);

  if (customPriorities) {
    const { priorities } = await inquirer.prompt([{
      type: 'editor',
      name: 'priorities',
      message: 'List priority areas (one per line):',
      default: 'Focus on these first:\\n- \\n\\nLower priority:\\n- '
    }]);
    feedback.priorities.push(priorities);
  }

  // General comments
  const { generalComments } = await inquirer.prompt([{
    type: 'input',
    name: 'generalComments',
    message: 'Any other comments or observations?',
    default: ''
  }]);

  feedback.comments = generalComments;

  return feedback;
}

function saveFeedback(runNumber, feedback) {
  if (!feedback) return;

  const feedbackPath = `./deepfield/wip/run-${runNumber}/feedback.md`;

  let content = `# Feedback for Run ${runNumber}\\n\\n`;
  content += `**Date:** ${feedback.timestamp}\\n\\n`;

  if (feedback.corrections.length > 0) {
    content += `## Corrections\\n\\n`;
    feedback.corrections.forEach(c => {
      content += `### ${c.topic}\\n\\n${c.content}\\n\\n`;
    });
  }

  if (feedback.additions.length > 0) {
    content += `## Additional Context\\n\\n`;
    feedback.additions.forEach(a => {
      content += `### ${a.topic}\\n\\n${a.content}\\n\\n`;
    });
  }

  if (feedback.priorities.length > 0) {
    content += `## Priority Adjustments\\n\\n`;
    content += feedback.priorities.join('\\n\\n');
    content += '\\n\\n';
  }

  if (feedback.comments) {
    content += `## General Comments\\n\\n${feedback.comments}\\n`;
  }

  fs.writeFileSync(feedbackPath, content);
  console.log(`\\n✅ Feedback saved: ${feedbackPath}\\n`);
}

// Main
export async function runFeedbackLoop(runNumber) {
  const feedback = await collectFeedback(runNumber);
  saveFeedback(runNumber, feedback);
  return feedback;
}

// CLI usage
if (process.argv[1] === import.meta.url) {
  const runNumber = parseInt(process.argv[2]) || 0;
  runFeedbackLoop(runNumber);
}
```

### 3. Incorporate Feedback

**File:** `plugin/scripts/apply-feedback.js`

```javascript
#!/usr/bin/env node
import fs from 'fs';

/**
 * Read feedback from previous run
 */
function readFeedback(runNumber) {
  const feedbackPath = `./deepfield/wip/run-${runNumber}/feedback.md`;

  if (!fs.existsSync(feedbackPath)) {
    return null;
  }

  const content = fs.readFileSync(feedbackPath, 'utf-8');
  return parseFeedback(content);
}

/**
 * Parse feedback markdown
 */
function parseFeedback(content) {
  // Extract corrections, additions, priorities from markdown
  // Simple parsing for now, can be enhanced
  return {
    corrections: extractSection(content, 'Corrections'),
    additions: extractSection(content, 'Additional Context'),
    priorities: extractSection(content, 'Priority Adjustments'),
    comments: extractSection(content, 'General Comments')
  };
}

/**
 * Apply feedback to learning plan
 */
function applyFeedbackToLearningPlan(feedback) {
  const planPath = './deepfield/wip/learning-plan.md';
  let plan = fs.readFileSync(planPath, 'utf-8');

  // Add feedback section
  plan += `\\n\\n## User Feedback Incorporated\\n\\n`;

  if (feedback.corrections) {
    plan += `### Corrections Applied\\n\\n${feedback.corrections}\\n\\n`;
  }

  if (feedback.additions) {
    plan += `### Additional Context\\n\\n${feedback.additions}\\n\\n`;
  }

  if (feedback.priorities) {
    plan += `### Priority Adjustments\\n\\n${feedback.priorities}\\n\\n`;
  }

  fs.writeFileSync(planPath, plan);
}

/**
 * Update domain index based on feedback
 */
function applyFeedbackToDomains(feedback) {
  // Parse domain corrections
  // Update domain-index.md
  // Mark user-corrected domains
}

export { readFeedback, applyFeedbackToLearningPlan, applyFeedbackToDomains };
```

### 4. Integration

**In bootstrap-runner.js:**

```javascript
import { runFeedbackLoop } from './collect-feedback.js';
import { applyFeedbackToLearningPlan } from './apply-feedback.js';

async function runBootstrap() {
  // ... existing bootstrap logic ...

  console.log('\\n✅ Bootstrap (Run 0) completed!\\n');

  // Show summary
  showRunSummary(0);

  // Collect feedback
  const feedback = await runFeedbackLoop(0);

  // Apply feedback immediately (or save for next run)
  if (feedback) {
    applyFeedbackToLearningPlan(feedback);
  }

  console.log('\\n🎯 Next steps:');
  console.log('  - Review generated documents');
  console.log('  - Run: deepfield iterate (when implemented)');
  console.log('  - Or: deepfield continue\\n');
}
```

---

## Acceptance Criteria

- [ ] After Run 0 completes, shows summary
- [ ] Prompts user to review findings
- [ ] Asks about domain correctness
- [ ] Allows adding missing context
- [ ] Allows adjusting priorities
- [ ] Saves feedback to run-N/feedback.md
- [ ] Incorporates feedback into next run's plan
- [ ] Can skip feedback (optional)
- [ ] Feedback is structured and parseable
- [ ] Clear what feedback is used for

---

## Testing

1. **Accept all findings**
   - Run bootstrap
   - Respond "yes" to all prompts
   - Should complete quickly

2. **Provide corrections**
   - Run bootstrap
   - Correct domain names
   - Add missing context
   - Verify saved in feedback.md

3. **Adjust priorities**
   - Specify focus areas
   - Verify incorporated in learning plan

4. **Skip feedback**
   - Answer "no" to review prompt
   - Should skip gracefully

5. **Feedback in next run**
   - Provide feedback in Run 0
   - Run iterate
   - Verify feedback used in Run 1

---

## Future Enhancements

- Visual feedback UI (web interface)
- Diff view of changes
- Confidence scoring for AI findings
- Explicit approve/reject per domain
- Track feedback history across runs

---

## Dependencies

- **Depends on:** Task 002 (bootstrap implementation)
- **Enhances:** Learning accuracy

---

## References

- Feedback template: `plugin/templates/feedback.md`
