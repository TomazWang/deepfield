#!/usr/bin/env node
/**
 * calculate-confidence.test.js
 * Unit tests for the four component helpers and integration behaviour.
 *
 * Run with:  node plugin/tests/calculate-confidence.test.js
 * Exit 0 on success, 1 on any failure.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  questionsAnswered,
  evidenceStrength,
  sourceCoverage,
  contradictionResolution,
  calculateConfidence,
  writeConfidenceReport,
  lookupPreviousAggregate,
} = require('../scripts/calculate-confidence');

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance, label) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  PASS: ${label} (${actual.toFixed(4)} ≈ ${expected})`);
    passed++;
  } else {
    console.error(`  FAIL: ${label} (got ${actual.toFixed(4)}, expected ${expected} ±${tolerance})`);
    failed++;
  }
}

function section(name) {
  console.log(`\n--- ${name} ---`);
}

// ---------------------------------------------------------------------------
// questionsAnswered
// ---------------------------------------------------------------------------

section('questionsAnswered');

assert(questionsAnswered(0, 0, 0) === 0.0, 'zero denominator returns 0.0');
assert(questionsAnswered(10, 0, 0) === 1.0, 'all answered → 1.0');
assert(questionsAnswered(0, 10, 0) === 0.0, 'none answered → 0.0');
assertClose(questionsAnswered(8, 2, 0), 0.8, 0.001, '8/10 = 0.80');
assertClose(questionsAnswered(8, 2, 0), 0.8, 0.001, '8 answered, 2 unanswered, 0 unknowns');
assertClose(questionsAnswered(0, 0, 5), 0.0, 0.001, 'only unknowns → 0.0');
assert(questionsAnswered(100, 0, 0) === 1.0, 'capped at 1.0');

// ---------------------------------------------------------------------------
// evidenceStrength
// ---------------------------------------------------------------------------

section('evidenceStrength');

assert(evidenceStrength({}) === 0.0, 'no evidence → 0.0');
assert(evidenceStrength({ strong: 0, medium: 0, weak: 0 }) === 0.0, 'all zeros → 0.0');
assert(evidenceStrength({ strong: 1 }) === 1.0, 'single strong → 1.0');
assertClose(evidenceStrength({ weak: 1 }), 0.2, 0.001, 'single weak → 0.2');
assertClose(evidenceStrength({ medium: 1 }), 0.5, 0.001, 'single medium → 0.5');

// 3 strong + 2 weak: (3*1.0 + 2*0.2)/5 = 3.4/5 = 0.68
assertClose(evidenceStrength({ strong: 3, weak: 2 }), 0.68, 0.001, '3 strong + 2 weak = 0.68');

// From spec scenario: 3 strong, 0 medium, 2 weak
assertClose(evidenceStrength({ strong: 3, medium: 0, weak: 2 }), 0.68, 0.001, 'spec scenario evidence_strength');

// No tag = weak (caller responsible for treating untagged as weak before passing)
assertClose(evidenceStrength({ weak: 5 }), 0.2, 0.001, 'all untagged (passed as weak) → 0.2');

// ---------------------------------------------------------------------------
// sourceCoverage
// ---------------------------------------------------------------------------

section('sourceCoverage');

assert(sourceCoverage(0, 0) === 0.0, 'zero required → 0.0');
assert(sourceCoverage(5, 0) === 0.0, 'zero required even with analyzed → 0.0');
assertClose(sourceCoverage(4, 5), 0.8, 0.001, '4/5 = 0.8');
assert(sourceCoverage(5, 5) === 1.0, '5/5 = 1.0');
assert(sourceCoverage(6, 5) === 1.0, '6/5 capped at 1.0');
assert(sourceCoverage(0, 4) === 0.0, '0/4 = 0.0');

// ---------------------------------------------------------------------------
// contradictionResolution
// ---------------------------------------------------------------------------

section('contradictionResolution');

assert(contradictionResolution(0, 0) === 1.0, 'no contradictions → 1.0');
assert(contradictionResolution(0, 5) === 1.0, 'all resolved → 1.0');
assert(contradictionResolution(5, 5) === 0.0, 'none resolved → 0.0');
assertClose(contradictionResolution(1, 2), 0.5, 0.001, '1/2 unresolved = 0.5');
assertClose(contradictionResolution(1, 4), 0.75, 0.001, '1/4 unresolved = 0.75');

// ---------------------------------------------------------------------------
// calculateConfidence — spec scenario
// ---------------------------------------------------------------------------

section('calculateConfidence — spec scenario');

// From spec: 8 answered, 2 unanswered, 0 unknowns, 3 strong + 2 weak, 4/5 source, 1/2 contradiction
const specInputs = {
  answeredQuestions: 8,
  unansweredQuestions: 2,
  unknowns: 0,
  evidenceByStrength: { strong: 3, medium: 0, weak: 2 },
  analyzedSourceTypes: 4,
  requiredSourceTypes: 5,
  unresolvedContradictions: 1,
  totalContradictions: 2,
};

const specResult = calculateConfidence(specInputs);
// Expected: 0.40*0.80 + 0.30*0.68 + 0.20*0.80 + 0.10*0.50 = 0.32 + 0.204 + 0.16 + 0.05 = 0.734
assertClose(specResult.aggregate, 0.734, 0.001, 'spec scenario aggregate ≈ 0.734');
assertClose(specResult.components.questionsAnswered, 0.8, 0.001, 'spec QA component = 0.80');
assertClose(specResult.components.evidenceStrength, 0.68, 0.001, 'spec ES component = 0.68');
assertClose(specResult.components.sourceCoverage, 0.8, 0.001, 'spec SC component = 0.80');
assertClose(specResult.components.contradictionResolution, 0.5, 0.001, 'spec CR component = 0.50');

section('calculateConfidence — zero inputs');

const zeroResult = calculateConfidence({});
assert(zeroResult.aggregate === 0.0 || zeroResult.aggregate <= 0.10, 'zero inputs: aggregate is 0 (only CR=1.0 contributes 0.10)');
// With zero inputs: QA=0, ES=0, SC=0, CR=1.0 → aggregate = 0.10
assertClose(zeroResult.aggregate, 0.10, 0.001, 'zero inputs with no contradictions: 0.10 (CR default)');

section('calculateConfidence — no contradictions defaults CR to 1.0');

const noContradictionResult = calculateConfidence({
  answeredQuestions: 5,
  unansweredQuestions: 5,
  unknowns: 0,
  evidenceByStrength: { strong: 5 },
  analyzedSourceTypes: 4,
  requiredSourceTypes: 4,
  unresolvedContradictions: 0,
  totalContradictions: 0,
});
assertClose(noContradictionResult.components.contradictionResolution, 1.0, 0.001, 'no contradictions → CR=1.0');

section('calculateConfidence — clamp to [0, 1]');

const result = calculateConfidence({
  answeredQuestions: 1000,
  unansweredQuestions: 0,
  unknowns: 0,
  evidenceByStrength: { strong: 1000 },
  analyzedSourceTypes: 100,
  requiredSourceTypes: 1,
  unresolvedContradictions: 0,
  totalContradictions: 0,
});
assert(result.aggregate <= 1.0 && result.aggregate >= 0.0, 'aggregate clamped to [0,1]');

// ---------------------------------------------------------------------------
// writeConfidenceReport — file format
// ---------------------------------------------------------------------------

section('writeConfidenceReport — file creation and overwrite');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-test-'));
const scoresPath = path.join(tmpDir, 'confidence-scores.md');

const domains = [
  {
    domain: 'auth',
    inputs: {
      answeredQuestions: 8,
      unansweredQuestions: 2,
      unknowns: 0,
      evidenceByStrength: { strong: 3, medium: 0, weak: 2 },
      analyzedSourceTypes: 4,
      requiredSourceTypes: 5,
      unresolvedContradictions: 1,
      totalContradictions: 2,
    },
    result: calculateConfidence({
      answeredQuestions: 8,
      unansweredQuestions: 2,
      unknowns: 0,
      evidenceByStrength: { strong: 3, medium: 0, weak: 2 },
      analyzedSourceTypes: 4,
      requiredSourceTypes: 5,
      unresolvedContradictions: 1,
      totalContradictions: 2,
    }),
    previousAggregate: 0.60,
  },
];

writeConfidenceReport(domains, scoresPath);
assert(fs.existsSync(scoresPath), 'confidence-scores.md created');

const content = fs.readFileSync(scoresPath, 'utf-8');
assert(content.includes('## auth'), 'file includes domain section header');
assert(content.includes('answered: 8'), 'file includes answered questions count');
assert(content.includes('strong: 3'), 'file includes strong evidence count');
assert(content.includes('analyzed: 4'), 'file includes analyzed source types');
assert(content.includes('0.734'), 'file includes aggregate score');
assert(content.includes('+0.13') || content.includes('+0.14'), 'file includes positive delta');

// Overwrite test
writeConfidenceReport(
  [
    {
      domain: 'auth',
      inputs: { ...domains[0].inputs, answeredQuestions: 5 },
      result: calculateConfidence({ ...domains[0].inputs, answeredQuestions: 5 }),
      previousAggregate: null,
    },
  ],
  scoresPath
);
const overwrittenContent = fs.readFileSync(scoresPath, 'utf-8');
assert(!overwrittenContent.includes('answered: 8'), 'file is overwritten, not appended');
assert(overwrittenContent.includes('answered: 5'), 'overwritten file shows new inputs');
assert(overwrittenContent.includes('n/a (first run)'), 'null previousAggregate shows first run');

// ---------------------------------------------------------------------------
// lookupPreviousAggregate
// ---------------------------------------------------------------------------

section('lookupPreviousAggregate');

const prevConfig = {
  runNumber: 1,
  status: 'completed',
  confidenceScores: {
    auth: { aggregate: 0.60 },
    api: { aggregate: 0.45 },
  },
};
const prevConfigPath = path.join(tmpDir, 'run-1.config.json');
fs.writeFileSync(prevConfigPath, JSON.stringify(prevConfig, null, 2), 'utf-8');

assertClose(lookupPreviousAggregate(prevConfigPath, 'auth'), 0.60, 0.001, 'looks up auth aggregate from prev config');
assertClose(lookupPreviousAggregate(prevConfigPath, 'api'), 0.45, 0.001, 'looks up api aggregate from prev config');
assert(lookupPreviousAggregate(prevConfigPath, 'unknown') === null, 'missing domain returns null');
assert(lookupPreviousAggregate('/nonexistent/path.json', 'auth') === null, 'missing file returns null');
assert(lookupPreviousAggregate(null, 'auth') === null, 'null path returns null');

// ---------------------------------------------------------------------------
// Integration test: CLI with known inputs → verify outputs
// ---------------------------------------------------------------------------

section('Integration: calculate-confidence.js CLI with known inputs');

const { execSync } = require('child_process');
const scriptPath = path.join(__dirname, '../scripts/calculate-confidence.js');

const integrationInputs = [
  {
    domain: 'auth',
    answeredQuestions: 8,
    unansweredQuestions: 2,
    unknowns: 0,
    evidenceByStrength: { strong: 3, medium: 0, weak: 2 },
    analyzedSourceTypes: 4,
    requiredSourceTypes: 5,
    unresolvedContradictions: 1,
    totalContradictions: 2,
  },
  {
    domain: 'api',
    answeredQuestions: 4,
    unansweredQuestions: 6,
    unknowns: 2,
    evidenceByStrength: { strong: 1, medium: 2, weak: 3 },
    analyzedSourceTypes: 2,
    requiredSourceTypes: 4,
    unresolvedContradictions: 0,
    totalContradictions: 1,
  },
];

const inputsPath = path.join(tmpDir, 'confidence-inputs.json');
fs.writeFileSync(inputsPath, JSON.stringify(integrationInputs, null, 2), 'utf-8');

// Write a fake prev run config
const prevRunForIntegration = {
  runNumber: 1,
  status: 'completed',
  confidenceScores: {
    auth: { aggregate: 0.60 },
  },
};
const prevRunPath = path.join(tmpDir, 'run-1.config.json');
fs.writeFileSync(prevRunPath, JSON.stringify(prevRunForIntegration, null, 2), 'utf-8');

// Create empty run config for update
const currentRunConfig = { runNumber: 2, status: 'in-progress', confidenceScores: {} };
const currentRunPath = path.join(tmpDir, 'run-2.config.json');
fs.writeFileSync(currentRunPath, JSON.stringify(currentRunConfig, null, 2), 'utf-8');

let cliOutput = '';
try {
  cliOutput = execSync(
    `node "${scriptPath}" "${inputsPath}" --wip-dir "${tmpDir}" --run-config "${currentRunPath}" --prev-run-config "${prevRunPath}"`,
    { encoding: 'utf-8' }
  );
} catch (err) {
  console.error(`  CLI error: ${err.message}`);
  failed++;
}

const reportContent = fs.existsSync(path.join(tmpDir, 'confidence-scores.md'))
  ? fs.readFileSync(path.join(tmpDir, 'confidence-scores.md'), 'utf-8')
  : '';

assert(reportContent.includes('## auth'), 'integration: confidence-scores.md has auth section');
assert(reportContent.includes('## api'), 'integration: confidence-scores.md has api section');
assert(reportContent.includes('0.734'), 'integration: auth aggregate ≈ 0.734 in report');

// Verify run config was updated
const updatedConfig = JSON.parse(fs.readFileSync(currentRunPath, 'utf-8'));
assert(
  updatedConfig.confidenceScores && updatedConfig.confidenceScores.auth,
  'integration: run config has auth confidenceScores entry'
);
assertClose(
  updatedConfig.confidenceScores.auth.aggregate,
  0.734,
  0.002,
  'integration: run config auth aggregate ≈ 0.734'
);
assert(
  updatedConfig.confidenceScores.auth.previousAggregate === 0.60,
  'integration: previousAggregate matches prev run'
);
assert(
  updatedConfig.confidenceScores.api.previousAggregate === null,
  'integration: api previousAggregate null (not in prev run)'
);

// ---------------------------------------------------------------------------
// Cleanup and summary
// ---------------------------------------------------------------------------

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
