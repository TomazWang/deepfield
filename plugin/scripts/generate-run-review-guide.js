#!/usr/bin/env node
/**
 * generate-run-review-guide.js — Generate deepfield/wip/run-N/review-guide.md
 *
 * Usage:
 *   node generate-run-review-guide.js --run <N> --run-config <path> --output <path>
 *                                     [--learning-plan <path>] [--unknowns <path>]
 *
 * Arguments:
 *   --run <N>               Run number (required)
 *   --run-config <path>     Path to run-N.config.json (required)
 *   --output <path>         Path to write review-guide.md (required)
 *   --learning-plan <path>  Path to learning-plan.md (optional)
 *   --unknowns <path>       Path to cross-cutting/unknowns.md (optional)
 *
 * Output is written atomically.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const config = { run: null, runConfig: null, output: null, learningPlan: null, unknowns: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--run' && i + 1 < args.length) {
      config.run = parseInt(args[++i], 10);
    } else if (args[i] === '--run-config' && i + 1 < args.length) {
      config.runConfig = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (args[i] === '--learning-plan' && i + 1 < args.length) {
      config.learningPlan = args[++i];
    } else if (args[i] === '--unknowns' && i + 1 < args.length) {
      config.unknowns = args[++i];
    }
  }

  return config;
}

function printUsage() {
  console.error('Usage: generate-run-review-guide.js --run <N> --run-config <path> --output <path> [--learning-plan <path>] [--unknowns <path>]');
}

function validate(config) {
  if (config.run === null || isNaN(config.run)) { console.error('Error: --run is required and must be a number'); process.exit(1); }
  if (!config.runConfig) { console.error('Error: --run-config is required'); process.exit(1); }
  if (!config.output)    { console.error('Error: --output is required');      process.exit(1); }

  if (!fs.existsSync(config.runConfig)) {
    console.error(`Error: run config not found: ${config.runConfig}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadRunConfig(runConfigPath) {
  try {
    return JSON.parse(fs.readFileSync(runConfigPath, 'utf-8'));
  } catch (err) {
    console.error(`Error: cannot read run config: ${err.message}`);
    process.exit(1);
  }
}

function loadUnknowns(unknownsPath) {
  if (!unknownsPath || !fs.existsSync(unknownsPath)) return [];
  try {
    const content = fs.readFileSync(unknownsPath, 'utf-8');
    return content.split('\n')
      .filter(l => /^[-*]\s+/.test(l))
      .map(l => l.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean)
      .slice(0, 10); // Cap at 10 questions to keep guide readable
  } catch (_) {
    return [];
  }
}

function extractOpenQuestionsFromPlan(learningPlanPath) {
  if (!learningPlanPath || !fs.existsSync(learningPlanPath)) return [];
  try {
    const content = fs.readFileSync(learningPlanPath, 'utf-8');
    const questions = [];
    const lines = content.split('\n');
    let inQuestionsSection = false;

    for (const line of lines) {
      if (/^#+\s*(open\s+questions?|gaps?|unknowns?)/i.test(line)) {
        inQuestionsSection = true;
        continue;
      }
      if (inQuestionsSection && line.startsWith('#')) break;
      if (inQuestionsSection && /^[-*]\s+/.test(line)) {
        questions.push(line.replace(/^[-*]\s+/, '').trim());
      }
    }
    return questions.slice(0, 8);
  } catch (_) {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function buildWhatWasLearned(runConfig) {
  const topics = (runConfig.focusTopics || []);
  if (topics.length === 0) {
    return '_No focus topics recorded for this run._';
  }

  const topicLines = topics.map(t => `- **${t}**`).join('\n');

  const fileCount = Object.keys(runConfig.fileHashes || {}).length;
  const fileStr   = fileCount > 0 ? `\n\n**Files scanned:** ${fileCount}` : '';

  return `${topicLines}${fileStr}`;
}

function buildPriorities(runConfig) {
  const changes = Object.entries(runConfig.confidenceChanges || {});

  const high   = changes.filter(([, c]) => c.contradiction === true);
  const medium = changes.filter(([, c]) => !c.contradiction && ((c.after || 0) - (c.before || 0)) > 20);
  const low    = changes.filter(([, c]) => !c.contradiction && ((c.after || 0) - (c.before || 0)) <= 20 && ((c.after || 0) - (c.before || 0)) > 0);

  const fmt = (arr, defaultMsg) => arr.length === 0
    ? defaultMsg
    : arr.map(([d, c]) => {
        const delta = (c.after || 0) - (c.before || 0);
        const sign  = delta >= 0 ? '+' : '';
        const note  = c.reason ? ` — ${c.reason}` : '';
        return `- **${d}**: ${c.before || 0}% → ${c.after || 0}% (${sign}${delta}%)${note}`;
      }).join('\n');

  return {
    high:   fmt(high, '_No contradictions or breakthrough discoveries this run._'),
    medium: fmt(medium, '_No domains with significant confidence gains this run._'),
    low:    fmt(low, '_No minor updates this run._'),
  };
}

function buildOpenQuestions(unknownsQuestions, planQuestions) {
  const combined = [...new Set([...unknownsQuestions, ...planQuestions])].slice(0, 8);
  if (combined.length === 0) return '_No open questions at this time._';
  return combined.map(q => `- ${q}`).join('\n');
}

function buildNextSteps(runConfig) {
  const changes    = runConfig.confidenceChanges || {};
  const runNumber  = runConfig.runNumber || 0;
  const nextRun    = runNumber + 1;
  const hasHigh    = Object.values(changes).some(c => c.contradiction === true);
  const allTopics  = runConfig.focusTopics || [];

  const steps = [];

  if (hasHigh) {
    steps.push('Review HIGH priority items — contradictions need resolution before continuing');
  }

  steps.push(`Review updated drafts in \`deepfield/drafts/behavior/\` and \`deepfield/drafts/tech/\``);

  if (allTopics.length > 0) {
    steps.push(`Check the companion READMEs for: ${allTopics.join(', ')}`);
  }

  steps.push(`Add feedback or new sources to \`deepfield/source/run-${nextRun}-staging/\``);
  steps.push(`Run \`/df-continue\` to start Run ${nextRun}`);

  return steps.map(s => `- ${s}`).join('\n');
}

function render({ runNumber, generatedAt, focusTopics, filesScanned, whatWasLearned, priorities, openQuestions, nextSteps }) {
  const topicsStr = focusTopics.length > 0 ? focusTopics.join(', ') : '—';

  return `# Run ${runNumber} — Review Guide

> Generated on ${generatedAt}.
> This guide summarizes what was learned this run and what needs your attention.

## What Was Learned

**Focus topics:** ${topicsStr}
**Files scanned:** ${filesScanned}

${whatWasLearned}

## Review Priorities

### HIGH — Action required

These findings contradict existing knowledge or resolve long-standing unknowns.

${priorities.high}

### MEDIUM — Worth a look

New facts with significant confidence gains (>20%).

${priorities.medium}

### LOW — FYI

Minor additions or small confidence bumps (≤20%).

${priorities.low}

## Questions for You

The AI could not resolve these questions from available sources. Your input would help:

${openQuestions}

## Next Steps

${nextSteps}

---

*Generated by \`generate-run-review-guide.js\` after Run ${runNumber}.*
`;
}

// ---------------------------------------------------------------------------
// Atomic write
// ---------------------------------------------------------------------------

function writeAtomic(outputPath, content) {
  const resolved = path.resolve(outputPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = resolved + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, resolved);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const config = parseArgs();
  validate(config);

  const runConfig       = loadRunConfig(config.runConfig);
  const unknownsQ       = loadUnknowns(config.unknowns);
  const planQ           = extractOpenQuestionsFromPlan(config.learningPlan);

  // runConfig.runNumber takes precedence over --run; --run is a fallback if the field is absent
  const runNumber   = runConfig.runNumber !== undefined ? runConfig.runNumber : config.run;
  const focusTopics = runConfig.focusTopics || [];
  const filesScanned = Object.keys(runConfig.fileHashes || {}).length;
  const generatedAt = new Date().toISOString().slice(0, 10);

  const whatWasLearned = buildWhatWasLearned(runConfig);
  const priorities     = buildPriorities(runConfig);
  const openQuestions  = buildOpenQuestions(unknownsQ, planQ);
  const nextSteps      = buildNextSteps(runConfig);

  const markdown = render({
    runNumber,
    generatedAt,
    focusTopics,
    filesScanned,
    whatWasLearned,
    priorities,
    openQuestions,
    nextSteps,
  });

  writeAtomic(config.output, markdown);

  console.log(`Generated run review guide for Run ${runNumber} → ${path.resolve(config.output)}`);
  process.exit(0);
}

main();
