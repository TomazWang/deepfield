#!/usr/bin/env node
/**
 * check-confidence.js - Compute confidence scores from run configs and learning plan
 *
 * Usage: check-confidence.js <deepfield-dir> [--domains <comma-separated>] [--threshold <number>]
 *
 * Example:
 *   node check-confidence.js ./deepfield --threshold 80
 *   node check-confidence.js ./deepfield --domains auth,api --threshold 85
 *
 * Output JSON:
 * {
 *   "overallConfidence": 72,
 *   "thresholdMet": false,
 *   "threshold": 80,
 *   "topics": [
 *     { "name": "Authentication", "priority": "HIGH", "confidence": 85, "meetsThreshold": true }
 *   ],
 *   "highPriorityCount": 2,
 *   "highPriorityMeetingThreshold": 1,
 *   "domainsFilter": ["auth"]
 * }
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  process.stderr.write(
    'Usage: check-confidence.js <deepfield-dir> [--domains <list>] [--threshold <n>]\n'
  );
  process.exit(1);
}

const deepfieldDir = args[0];
let domainsFilter = [];
let threshold = 80;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--domains' && args[i + 1]) {
    domainsFilter = args[i + 1].split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
    i++;
  } else if (args[i] === '--threshold' && args[i + 1]) {
    const parsed = parseInt(args[i + 1], 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      threshold = parsed;
    }
    i++;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Validate deepfield directory
  if (!fs.existsSync(deepfieldDir)) {
    process.stderr.write(`Error: Directory not found: ${deepfieldDir}\n`);
    process.exit(1);
  }

  const wipDir = path.join(deepfieldDir, 'wip');
  if (!fs.existsSync(wipDir)) {
    process.stderr.write(`Error: No wip/ directory found in ${deepfieldDir}\n`);
    process.exit(1);
  }

  // Find the highest-numbered completed run config (run-N.config.json, N >= 1)
  const runConfig = findLatestRunConfig(wipDir);
  if (!runConfig) {
    const result = {
      error: 'No completed learning runs found. Run /df-iterate or /df-ff first.'
    };
    process.stderr.write(result.error + '\n');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(1);
  }

  // Extract topic confidence from run config
  const topicsFromConfig = extractTopicsFromRunConfig(runConfig.data);

  // If no topic data in run config, try to read from learning plan
  const learningPlanPath = path.join(deepfieldDir, 'wip', 'learning-plan.md');
  const learningPlanTopics = readLearningPlanTopics(learningPlanPath);

  // Merge: prefer run config confidence values, fall back to learning plan values
  const allTopics = mergeTopics(topicsFromConfig, learningPlanTopics);

  // Apply domain filter
  const filteredTopics = applyDomainFilter(allTopics, domainsFilter);

  if (domainsFilter.length > 0 && filteredTopics.length === 0) {
    const result = {
      error: `No topics found matching domain filter: ${domainsFilter.join(', ')}`,
      domainsFilter
    };
    process.stderr.write(result.error + '\n');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(1);
  }

  // Compute confidence scores
  const highPriorityTopics = filteredTopics.filter(t => t.priority === 'HIGH');
  const highPriorityCount = highPriorityTopics.length;

  // Annotate each topic with meetsThreshold
  const annotatedTopics = filteredTopics.map(t => ({
    ...t,
    meetsThreshold: t.confidence >= threshold
  }));

  const highPriorityMeetingThreshold = highPriorityTopics.filter(
    t => t.confidence >= threshold
  ).length;

  // Overall confidence = average confidence across filtered topics (or 0 if none)
  const overallConfidence =
    filteredTopics.length > 0
      ? Math.round(
          filteredTopics.reduce((sum, t) => sum + t.confidence, 0) / filteredTopics.length
        )
      : 0;

  // Threshold is met when ALL high-priority topics (in scope) meet it
  const thresholdMet =
    highPriorityCount > 0 && highPriorityMeetingThreshold === highPriorityCount;

  const result = {
    overallConfidence,
    thresholdMet,
    threshold,
    topics: annotatedTopics,
    highPriorityCount,
    highPriorityMeetingThreshold,
    domainsFilter,
    latestRunNumber: runConfig.runNumber
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the highest-numbered run-N.config.json (N >= 1) in wip/
 * Returns { runNumber, data } or null if none found.
 */
function findLatestRunConfig(wipDir) {
  let entries;
  try {
    entries = fs.readdirSync(wipDir);
  } catch (err) {
    return null;
  }

  // Match directories named run-N
  const runDirs = entries
    .filter(e => /^run-\d+$/.test(e))
    .map(e => ({
      name: e,
      num: parseInt(e.replace('run-', ''), 10)
    }))
    .filter(e => e.num >= 1) // Skip run-0 (bootstrap)
    .sort((a, b) => b.num - a.num); // Highest first

  for (const dir of runDirs) {
    const configPath = path.join(wipDir, dir.name, `${dir.name}.config.json`);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        const data = JSON.parse(content);
        // Only use completed runs
        if (data.status === 'completed') {
          return { runNumber: dir.num, data };
        }
      } catch (_) {
        // Skip malformed configs
      }
    }
  }

  return null;
}

/**
 * Extract per-topic confidence from run config's confidenceChanges field.
 * Returns array of { name, priority, confidence, domain }
 */
function extractTopicsFromRunConfig(runConfig) {
  const confidenceChanges = runConfig.confidenceChanges || {};
  const topics = [];

  for (const [topicName, change] of Object.entries(confidenceChanges)) {
    const confidence = typeof change.after === 'number' ? change.after : 0;
    topics.push({
      name: topicName,
      priority: change.priority || 'HIGH', // Default to HIGH if not specified
      confidence,
      domain: change.domain || null
    });
  }

  return topics;
}

/**
 * Parse learning plan markdown to extract topic names, priorities, and confidence.
 * Falls back gracefully — returns empty array if file missing or unparseable.
 *
 * Expected format lines like:
 *   - **TopicName** (HIGH, 65%)
 *   | TopicName | HIGH | 65% |
 */
function readLearningPlanTopics(learningPlanPath) {
  if (!fs.existsSync(learningPlanPath)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(learningPlanPath, 'utf8');
  } catch (_) {
    return [];
  }

  const topics = [];

  // Pattern: | Topic Name | HIGH | 65% | or similar table rows
  const tableRowPattern = /\|\s*([^|]+?)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*(\d+)%/gi;
  let match;
  while ((match = tableRowPattern.exec(content)) !== null) {
    const name = match[1].trim();
    const priority = match[2].toUpperCase();
    const confidence = parseInt(match[3], 10);
    if (name && !isNaN(confidence)) {
      topics.push({ name, priority, confidence, domain: null });
    }
  }

  // Pattern: - **TopicName** (HIGH, 65%)
  const listPattern = /\*\*([^*]+)\*\*\s*\((HIGH|MEDIUM|LOW)[^)]*(\d+)%\)/gi;
  while ((match = listPattern.exec(content)) !== null) {
    const name = match[1].trim();
    const priority = match[2].toUpperCase();
    const confidence = parseInt(match[3], 10);
    if (name && !isNaN(confidence) && !topics.find(t => t.name === name)) {
      topics.push({ name, priority, confidence, domain: null });
    }
  }

  return topics;
}

/**
 * Merge topics from run config and learning plan.
 * Run config values take precedence (they're more accurate/recent).
 */
function mergeTopics(runConfigTopics, learningPlanTopics) {
  const merged = new Map();

  // Start with learning plan data (lower priority)
  for (const t of learningPlanTopics) {
    merged.set(t.name, { ...t });
  }

  // Override with run config data (higher priority)
  for (const t of runConfigTopics) {
    if (merged.has(t.name)) {
      merged.set(t.name, { ...merged.get(t.name), ...t });
    } else {
      merged.set(t.name, { ...t });
    }
  }

  return Array.from(merged.values());
}

/**
 * Apply domain filter to topics list.
 * If filter is empty, return all topics.
 * Matches on topic name (substring) or domain field.
 */
function applyDomainFilter(topics, domainsFilter) {
  if (domainsFilter.length === 0) {
    return topics;
  }

  return topics.filter(t => {
    const topicNameLower = t.name.toLowerCase();
    const topicDomainLower = (t.domain || '').toLowerCase();

    return domainsFilter.some(
      d => topicNameLower.includes(d) || topicDomainLower.includes(d) || d.includes(topicNameLower)
    );
  });
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

try {
  main();
} catch (err) {
  process.stderr.write(`Unexpected error: ${err.message}\n`);
  process.stderr.write(err.stack + '\n');
  process.exit(1);
}
