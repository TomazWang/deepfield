#!/usr/bin/env node
/**
 * calculate-confidence.js - Evidence-based confidence scoring formula
 *
 * Usage:
 *   node calculate-confidence.js <domain-inputs-json> [--wip-dir <dir>] [--run-config <path>] [--prev-run-config <path>]
 *
 * domain-inputs-json: path to JSON file containing array of domain input records:
 * [
 *   {
 *     "domain": "auth",
 *     "answeredQuestions": 8,
 *     "unansweredQuestions": 2,
 *     "unknowns": 0,
 *     "evidenceByStrength": { "strong": 3, "medium": 0, "weak": 2 },
 *     "analyzedSourceTypes": 4,
 *     "requiredSourceTypes": 5,
 *     "unresolvedContradictions": 1,
 *     "totalContradictions": 2
 *   }
 * ]
 *
 * Outputs:
 *   - Writes wip/confidence-scores.md (overwritten each run)
 *   - Optionally updates run-N.config.json confidenceScores field (if --run-config provided)
 *   - Prints per-domain summary to stdout
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Formula component helpers
// ---------------------------------------------------------------------------

/**
 * Questions Answered component.
 * @param {number} answered
 * @param {number} unanswered
 * @param {number} unknowns
 * @returns {number} 0.0–1.0
 */
function questionsAnswered(answered, unanswered, unknowns) {
  const total = answered + unanswered + unknowns;
  if (total === 0) return 0.0;
  return Math.min(1.0, Math.max(0.0, answered / total));
}

/**
 * Evidence Strength component.
 * strong=1.0, medium=0.5, weak=0.2; untagged defaults to weak.
 * @param {{ strong?: number, medium?: number, weak?: number }} evidenceByStrength
 * @returns {number} 0.0–1.0
 */
function evidenceStrength(evidenceByStrength) {
  const byStrength = evidenceByStrength || {};
  const strong = Math.max(0, byStrength.strong || 0);
  const medium = Math.max(0, byStrength.medium || 0);
  const weak = Math.max(0, byStrength.weak || 0);
  const total = strong + medium + weak;
  if (total === 0) return 0.0;
  const weightedSum = (strong * 1.0) + (medium * 0.5) + (weak * 0.2);
  return Math.min(1.0, Math.max(0.0, weightedSum / total));
}

/**
 * Source Coverage component.
 * @param {number} analyzed number of analyzed source types
 * @param {number} required number of required source types
 * @returns {number} 0.0–1.0
 */
function sourceCoverage(analyzed, required) {
  if (required === 0) return 0.0;
  return Math.min(1.0, Math.max(0.0, analyzed / required));
}

/**
 * Contradiction Resolution component.
 * @param {number} unresolved number of unresolved contradictions
 * @param {number} total total contradictions
 * @returns {number} 0.0–1.0
 */
function contradictionResolution(unresolved, total) {
  if (total === 0) return 1.0;
  return Math.min(1.0, Math.max(0.0, 1 - (unresolved / total)));
}

/**
 * Calculate overall confidence from formula inputs.
 * confidence = (0.40 × questions_answered) + (0.30 × evidence_strength)
 *            + (0.20 × source_coverage) + (0.10 × contradiction_resolution)
 *
 * @param {object} inputs
 * @param {number} inputs.answeredQuestions
 * @param {number} inputs.unansweredQuestions
 * @param {number} inputs.unknowns
 * @param {{ strong?: number, medium?: number, weak?: number }} inputs.evidenceByStrength
 * @param {number} inputs.analyzedSourceTypes
 * @param {number} inputs.requiredSourceTypes
 * @param {number} inputs.unresolvedContradictions
 * @param {number} inputs.totalContradictions
 * @returns {{ aggregate: number, components: object }}
 */
function calculateConfidence(inputs) {
  const {
    answeredQuestions = 0,
    unansweredQuestions = 0,
    unknowns = 0,
    evidenceByStrength: ebStrength = {},
    analyzedSourceTypes = 0,
    requiredSourceTypes = 0,
    unresolvedContradictions = 0,
    totalContradictions = 0,
  } = inputs;

  const qaScore = questionsAnswered(answeredQuestions, unansweredQuestions, unknowns);
  const esScore = evidenceStrength(ebStrength);
  const scScore = sourceCoverage(analyzedSourceTypes, requiredSourceTypes);
  const crScore = contradictionResolution(unresolvedContradictions, totalContradictions);

  const aggregate = Math.min(
    1.0,
    Math.max(
      0.0,
      (0.40 * qaScore) + (0.30 * esScore) + (0.20 * scScore) + (0.10 * crScore)
    )
  );

  return {
    aggregate,
    components: {
      questionsAnswered: qaScore,
      evidenceStrength: esScore,
      sourceCoverage: scScore,
      contradictionResolution: crScore,
    },
  };
}

// ---------------------------------------------------------------------------
// Markdown report generation
// ---------------------------------------------------------------------------

/**
 * Format a signed delta string, e.g. "+0.05" or "-0.12" or "0.00".
 */
function formatDelta(delta) {
  if (delta > 0) return `+${delta.toFixed(2)}`;
  if (delta < 0) return delta.toFixed(2);
  return '0.00';
}

/**
 * Write wip/confidence-scores.md for all domains.
 *
 * @param {Array<{ domain: string, inputs: object, result: { aggregate: number, components: object }, previousAggregate: number|null }>} domains
 * @param {string} outputPath  Absolute path to write the file
 */
function writeConfidenceReport(domains, outputPath) {
  const now = new Date().toISOString().split('T')[0];
  const lines = [
    `# Confidence Scores`,
    ``,
    `*Generated: ${now}*`,
    `*Overwritten each run — do not edit manually.*`,
    ``,
  ];

  for (const entry of domains) {
    const { domain, inputs, result, previousAggregate } = entry;
    const { aggregate, components } = result;
    const {
      answeredQuestions = 0,
      unansweredQuestions = 0,
      unknowns = 0,
      evidenceByStrength = {},
      analyzedSourceTypes = 0,
      requiredSourceTypes = 0,
      unresolvedContradictions = 0,
      totalContradictions = 0,
    } = inputs;

    const delta =
      previousAggregate !== null && previousAggregate !== undefined
        ? aggregate - previousAggregate
        : null;

    const pct = (n) => `${(n * 100).toFixed(1)}%`;

    lines.push(`## ${domain}`);
    lines.push(``);
    lines.push(`### Inputs`);
    lines.push(``);
    lines.push(`| Signal | Inputs |`);
    lines.push(`|--------|--------|`);
    lines.push(`| Questions | answered: ${answeredQuestions}, unanswered: ${unansweredQuestions}, unknowns: ${unknowns} |`);
    lines.push(`| Evidence | strong: ${evidenceByStrength.strong || 0}, medium: ${evidenceByStrength.medium || 0}, weak: ${evidenceByStrength.weak || 0} |`);
    lines.push(`| Source Types | analyzed: ${analyzedSourceTypes}, required: ${requiredSourceTypes} |`);
    lines.push(`| Contradictions | unresolved: ${unresolvedContradictions}, total: ${totalContradictions} |`);
    lines.push(``);
    lines.push(`### Component Scores`);
    lines.push(``);
    lines.push(`| Component | Weight | Sub-Score |`);
    lines.push(`|-----------|--------|-----------|`);
    lines.push(`| questions_answered | 0.40 | ${components.questionsAnswered.toFixed(3)} |`);
    lines.push(`| evidence_strength | 0.30 | ${components.evidenceStrength.toFixed(3)} |`);
    lines.push(`| source_coverage | 0.20 | ${components.sourceCoverage.toFixed(3)} |`);
    lines.push(`| contradiction_resolution | 0.10 | ${components.contradictionResolution.toFixed(3)} |`);
    lines.push(``);
    lines.push(`### Aggregate`);
    lines.push(``);
    lines.push(`**Confidence:** ${aggregate.toFixed(3)} (${pct(aggregate)})`);
    if (delta !== null) {
      const prevPct = pct(previousAggregate);
      lines.push(`**Previous:** ${previousAggregate.toFixed(3)} (${prevPct})`);
      lines.push(`**Delta:** ${formatDelta(delta)}`);
    } else {
      lines.push(`**Previous:** n/a (first run)`);
      lines.push(`**Delta:** n/a`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const content = lines.join('\n');

  // Atomic write
  const tmpPath = outputPath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, outputPath);
}

// ---------------------------------------------------------------------------
// Previous-run lookup helper
// ---------------------------------------------------------------------------

/**
 * Look up a domain's previous aggregate from run N-1 config.
 * Returns the aggregate number or null if not found.
 *
 * @param {string} prevRunConfigPath  Absolute path to previous run config JSON
 * @param {string} domain
 * @returns {number|null}
 */
function lookupPreviousAggregate(prevRunConfigPath, domain) {
  if (!prevRunConfigPath || !fs.existsSync(prevRunConfigPath)) return null;

  try {
    const content = fs.readFileSync(prevRunConfigPath, 'utf-8');
    const config = JSON.parse(content);
    const scores = config.confidenceScores || {};
    const entry = scores[domain];
    if (entry && typeof entry.aggregate === 'number') {
      return entry.aggregate;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    process.stderr.write(
      'Usage: calculate-confidence.js <domain-inputs-json> [--wip-dir <dir>] [--run-config <path>] [--prev-run-config <path>]\n'
    );
    process.exit(1);
  }

  const domainInputsPath = args[0];

  let wipDir = null;
  let runConfigPath = null;
  let prevRunConfigPath = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--wip-dir' && args[i + 1]) wipDir = args[++i];
    else if (args[i] === '--run-config' && args[i + 1]) runConfigPath = args[++i];
    else if (args[i] === '--prev-run-config' && args[i + 1]) prevRunConfigPath = args[++i];
  }

  // Read domain inputs
  if (!fs.existsSync(domainInputsPath)) {
    process.stderr.write(`Error: Domain inputs file not found: ${domainInputsPath}\n`);
    process.exit(1);
  }

  let domainInputs;
  try {
    domainInputs = JSON.parse(fs.readFileSync(domainInputsPath, 'utf-8'));
  } catch (err) {
    process.stderr.write(`Error: Failed to parse domain inputs JSON: ${err.message}\n`);
    process.exit(1);
  }

  if (!Array.isArray(domainInputs)) {
    process.stderr.write('Error: Domain inputs JSON must be an array.\n');
    process.exit(1);
  }

  // Calculate confidence for each domain
  const domainResults = [];
  const confidenceScoresRecord = {};

  for (const entry of domainInputs) {
    const { domain } = entry;
    if (!domain) continue;

    const inputs = {
      answeredQuestions: entry.answeredQuestions || 0,
      unansweredQuestions: entry.unansweredQuestions || 0,
      unknowns: entry.unknowns || 0,
      evidenceByStrength: entry.evidenceByStrength || {},
      analyzedSourceTypes: entry.analyzedSourceTypes || 0,
      requiredSourceTypes: entry.requiredSourceTypes || 0,
      unresolvedContradictions: entry.unresolvedContradictions || 0,
      totalContradictions: entry.totalContradictions || 0,
    };

    const result = calculateConfidence(inputs);
    const previousAggregate = lookupPreviousAggregate(prevRunConfigPath, domain);

    domainResults.push({ domain, inputs, result, previousAggregate });

    confidenceScoresRecord[domain] = {
      aggregate: result.aggregate,
      previousAggregate,
      components: result.components,
      inputs,
    };
  }

  // Write confidence-scores.md
  const outputDir = wipDir || './deepfield/wip';
  const scoresPath = path.resolve(outputDir, 'confidence-scores.md');
  fs.mkdirSync(path.dirname(scoresPath), { recursive: true });
  writeConfidenceReport(domainResults, scoresPath);
  console.log(`Confidence scores written to: ${scoresPath}`);

  // Optionally update run config
  if (runConfigPath) {
    if (!fs.existsSync(runConfigPath)) {
      process.stderr.write(`Warning: Run config not found: ${runConfigPath} — skipping update.\n`);
    } else {
      try {
        const content = fs.readFileSync(runConfigPath, 'utf-8');
        const config = JSON.parse(content);
        config.confidenceScores = confidenceScoresRecord;
        const tmpPath = runConfigPath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
        fs.renameSync(tmpPath, runConfigPath);
        console.log(`Run config updated: ${runConfigPath}`);
      } catch (err) {
        process.stderr.write(`Warning: Failed to update run config: ${err.message}\n`);
      }
    }
  }

  // Print summary to stdout
  console.log('\nConfidence Summary:');
  for (const { domain, result, previousAggregate } of domainResults) {
    const pct = (result.aggregate * 100).toFixed(1);
    const delta =
      previousAggregate !== null && previousAggregate !== undefined
        ? ` (${formatDelta(result.aggregate - previousAggregate)})`
        : ' (first run)';
    console.log(`  ${domain}: ${result.aggregate.toFixed(3)} (${pct}%)${delta}`);
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  questionsAnswered,
  evidenceStrength,
  sourceCoverage,
  contradictionResolution,
  calculateConfidence,
  writeConfidenceReport,
  lookupPreviousAggregate,
};
