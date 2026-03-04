#!/usr/bin/env node
/**
 * collect-feedback.js
 *
 * Interactive post-run feedback collection.
 * Prompts the user to review findings and provide structured corrections
 * after a Deepfield learning run completes.
 *
 * Usage (CLI):  node collect-feedback.js <runNumber>
 * Usage (API):  import { runFeedbackLoop } from './collect-feedback.js'
 */

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Prompt using an editor, falling back to a plain input if editor fails
 * (e.g., no TTY / non-interactive environment).
 */
async function editorOrInput(name, message, defaultText) {
  try {
    const result = await inquirer.prompt([{
      type: 'editor',
      name,
      message,
      default: defaultText,
    }]);
    return result[name];
  } catch {
    // Fall back to plain text input
    const result = await inquirer.prompt([{
      type: 'input',
      name,
      message: `${message} (plain text):`,
    }]);
    return result[name];
  }
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Interactively collect user feedback for the given run.
 * Returns a structured feedback object, or null if the user skips.
 *
 * @param {number} runNumber
 * @returns {Promise<object|null>}
 */
async function collectFeedback(runNumber) {
  console.log('\n📝 Help improve the next run by providing feedback\n');

  const { wantsFeedback } = await inquirer.prompt([{
    type: 'confirm',
    name: 'wantsFeedback',
    message: 'Would you like to review findings and provide feedback?',
    default: true,
  }]);

  if (!wantsFeedback) {
    console.log('⏭️  Skipping feedback\n');
    return null;
  }

  const feedback = {
    runNumber,
    timestamp: new Date().toISOString(),
    corrections: [],
    additions: [],
    priorities: [],
    comments: '',
  };

  // ── Domain correctness ──────────────────────────────────────────────────
  const { domainFeedback } = await inquirer.prompt([{
    type: 'confirm',
    name: 'domainFeedback',
    message: 'Are the detected domains correct?',
    default: true,
  }]);

  if (!domainFeedback) {
    const domainCorrections = await editorOrInput(
      'domainCorrections',
      'Describe domain corrections (opens editor):',
      'Domains to add:\n- \n\nDomains to remove:\n- \n\nDomains to rename:\n- ',
    );
    if (domainCorrections && domainCorrections.trim()) {
      feedback.corrections.push({ topic: 'domains', content: domainCorrections });
    }
  }

  // ── Missing context ─────────────────────────────────────────────────────
  const { hasMissingContext } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasMissingContext',
    message: 'Is there missing context that would help?',
    default: false,
  }]);

  if (hasMissingContext) {
    const missingContext = await editorOrInput(
      'missingContext',
      'Describe missing context (opens editor):',
      'Additional information:\n\n- ',
    );
    if (missingContext && missingContext.trim()) {
      feedback.additions.push({ topic: 'context', content: missingContext });
    }
  }

  // ── Priority adjustment ─────────────────────────────────────────────────
  const { customPriorities } = await inquirer.prompt([{
    type: 'confirm',
    name: 'customPriorities',
    message: 'Would you like to adjust learning priorities?',
    default: false,
  }]);

  if (customPriorities) {
    const priorities = await editorOrInput(
      'priorities',
      'List priority areas (one per line):',
      'Focus on these first:\n- \n\nLower priority:\n- ',
    );
    if (priorities && priorities.trim()) {
      feedback.priorities.push(priorities);
    }
  }

  // ── General comments ────────────────────────────────────────────────────
  const { generalComments } = await inquirer.prompt([{
    type: 'input',
    name: 'generalComments',
    message: 'Any other comments or observations?',
    default: '',
  }]);

  feedback.comments = generalComments || '';

  return feedback;
}

/**
 * Write collected feedback to deepfield/wip/run-N/feedback.md.
 * Does nothing if feedback is null.
 *
 * @param {number} runNumber
 * @param {object|null} feedback
 */
function saveFeedback(runNumber, feedback) {
  if (!feedback) return;

  const feedbackDir = path.join('deepfield', 'wip', `run-${runNumber}`);
  const feedbackPath = path.join(feedbackDir, 'feedback.md');

  // Ensure directory exists
  fs.mkdirSync(feedbackDir, { recursive: true });

  let content = `# Feedback for Run ${runNumber}\n\n`;
  content += `**Date:** ${feedback.timestamp}\n\n`;

  if (feedback.corrections.length > 0) {
    content += `## Corrections\n\n`;
    for (const c of feedback.corrections) {
      content += `### ${c.topic}\n\n${c.content}\n\n`;
    }
  }

  if (feedback.additions.length > 0) {
    content += `## Additional Context\n\n`;
    for (const a of feedback.additions) {
      content += `### ${a.topic}\n\n${a.content}\n\n`;
    }
  }

  if (feedback.priorities.length > 0) {
    content += `## Priority Adjustments\n\n`;
    content += feedback.priorities.join('\n\n');
    content += '\n\n';
  }

  if (feedback.comments) {
    content += `## General Comments\n\n${feedback.comments}\n`;
  }

  fs.writeFileSync(feedbackPath, content, 'utf-8');
  console.log(`\n✅ Feedback saved: ${feedbackPath}\n`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the full post-run feedback loop.
 * Collects feedback interactively and saves it to disk.
 *
 * @param {number} runNumber
 * @returns {Promise<object|null>} The feedback object, or null if skipped
 */
export async function runFeedbackLoop(runNumber) {
  const feedback = await collectFeedback(runNumber);
  saveFeedback(runNumber, feedback);
  return feedback;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const runNumber = parseInt(process.argv[2], 10);
  if (isNaN(runNumber)) {
    console.error('Usage: node collect-feedback.js <runNumber>');
    process.exit(1);
  }
  runFeedbackLoop(runNumber).catch((err) => {
    console.error('Error collecting feedback:', err.message);
    process.exit(1);
  });
}
