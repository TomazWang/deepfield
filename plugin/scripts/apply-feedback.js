#!/usr/bin/env node
'use strict';
/**
 * apply-feedback.js
 *
 * Reads saved user feedback from a previous Deepfield run and incorporates
 * it into the learning plan for the next run.
 *
 * Usage (API):
 *   const { readFeedback, applyFeedbackToLearningPlan, applyFeedbackToDomains }
 *     = require('./apply-feedback')
 */

const fs = require('fs');
const path = require('path');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the text content of a top-level `## <heading>` section from Markdown.
 * Returns everything from the line after the heading up to the next `##` heading
 * (or end of file), trimmed.
 *
 * @param {string} content  Full Markdown string
 * @param {string} heading  Section heading (e.g. "Corrections")
 * @returns {string|null}   Section body, or null if the heading is not found
 */
function extractSection(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerPattern = new RegExp(`^##\\s+${escaped}\\s*$`, 'im');

  const match = content.match(headerPattern);
  if (!match) return null;

  const start = match.index + match[0].length;
  const rest = content.slice(start);

  const nextSection = rest.match(/^##\s/m);
  const end = nextSection ? nextSection.index : rest.length;

  return rest.slice(0, end).trim() || null;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Read and parse feedback from a previous run's directory.
 *
 * @param {number} runNumber
 * @returns {{ corrections: string|null, additions: string|null, priorities: string|null, comments: string|null } | null}
 */
function readFeedback(runNumber) {
  if (runNumber == null) return null;

  const feedbackPath = path.join('deepfield', 'wip', `run-${runNumber}`, 'feedback.md');

  if (!fs.existsSync(feedbackPath)) {
    return null;
  }

  let content;
  try {
    content = fs.readFileSync(feedbackPath, 'utf-8');
  } catch (err) {
    console.warn(`Warning: Could not read feedback file at ${feedbackPath}: ${err.message}`);
    return null;
  }

  return {
    corrections: extractSection(content, 'Corrections'),
    additions: extractSection(content, 'Additional Context'),
    priorities: extractSection(content, 'Priority Adjustments'),
    comments: extractSection(content, 'General Comments'),
  };
}

/**
 * Append user feedback content to the existing learning plan.
 * Adds a "User Feedback Incorporated" section at the end of the file.
 *
 * @param {object|null} feedback  Parsed feedback object from readFeedback()
 */
function applyFeedbackToLearningPlan(feedback) {
  if (!feedback) return;

  const hasContent = feedback.corrections || feedback.additions
    || feedback.priorities || feedback.comments;
  if (!hasContent) return;

  const planPath = path.join('deepfield', 'wip', 'learning-plan.md');

  if (!fs.existsSync(planPath)) {
    console.warn(`Warning: learning-plan.md not found at ${planPath}. Skipping feedback application.`);
    return;
  }

  let plan;
  try {
    plan = fs.readFileSync(planPath, 'utf-8');
  } catch (err) {
    console.warn(`Warning: Could not read learning-plan.md: ${err.message}`);
    return;
  }

  let appendix = '\n\n## User Feedback Incorporated\n\n';
  appendix += '*Applied from user feedback*\n\n';

  if (feedback.corrections) {
    appendix += `### Corrections Applied\n\n${feedback.corrections}\n\n`;
  }

  if (feedback.additions) {
    appendix += `### Additional Context\n\n${feedback.additions}\n\n`;
  }

  if (feedback.priorities) {
    appendix += `### Priority Adjustments\n\n${feedback.priorities}\n\n`;
  }

  if (feedback.comments) {
    appendix += `### General Comments\n\n${feedback.comments}\n\n`;
  }

  try {
    fs.writeFileSync(planPath, plan + appendix, 'utf-8');
    console.log(`✅ Feedback applied to: ${planPath}`);
  } catch (err) {
    console.warn(`Warning: Could not write learning-plan.md: ${err.message}`);
  }
}

/**
 * Placeholder: apply domain corrections from feedback to tech-index.md / behavior-index.md.
 * Currently a no-op; future implementation will parse domain additions/removals/renames
 * and update deepfield/wip/tech-index.md and deepfield/wip/behavior-index.md accordingly.
 *
 * @param {object|null} feedback  Parsed feedback object from readFeedback()
 */
function applyFeedbackToDomains(feedback) {
  if (!feedback) return;
  // TODO: parse feedback.corrections for domain changes and update tech-index.md / behavior-index.md
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { readFeedback, applyFeedbackToLearningPlan, applyFeedbackToDomains };
