#!/usr/bin/env node
/**
 * detect-behavior-domains.test.js — smoke test for detect-behavior-domains.js
 *
 * Runs without any test framework; exits 0 on pass, non-zero on failure.
 * Usage: node detect-behavior-domains.test.js
 */

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { detectBehaviorDomains } = require('./detect-behavior-domains.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS  ${message}`);
    passed++;
  } else {
    console.error(`  FAIL  ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  PASS  ${message} (got ${JSON.stringify(actual)})`);
    passed++;
  } else {
    console.error(`  FAIL  ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const SAMPLE_MD = `
# Product Requirements

## Features

- User Authentication
- [x] Payment Processing
- [x] Order Management

## Feature: Notifications

This feature covers push and email notifications.

## User Stories

As a customer, I want to track my order status.

## Technical Notes

These are implementation details.
`;

const ANOTHER_MD = `
# Epic: Reporting Dashboard

Users can view sales metrics.

## Feature: Analytics
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function runTests() {
  // Create a temp directory with sample files
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-test-'));
  const subDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(subDir);

  const file1 = path.join(subDir, 'requirements.md');
  const file2 = path.join(tmpDir, 'epic.md');
  fs.writeFileSync(file1, SAMPLE_MD, 'utf-8');
  fs.writeFileSync(file2, ANOTHER_MD, 'utf-8');

  let results;
  try {
    results = detectBehaviorDomains(tmpDir);
  } catch (err) {
    console.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  } finally {
    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('\nSmoke test: detect-behavior-domains.js\n');

  // 1. Returns an array
  assert(Array.isArray(results), 'Returns an array');

  // 2. Array is not empty (sample has detectable names)
  assert(results.length > 0, 'Detected at least one candidate');

  // 3. Each entry has required fields
  const allHaveFields = results.every(
    r => typeof r.name === 'string' && typeof r.confidence === 'number' && typeof r.sourceFile === 'string'
  );
  assert(allHaveFields, 'Every entry has name, confidence, sourceFile fields');

  // 4. Confidence is between 0 and 1
  const validConf = results.every(r => r.confidence >= 0 && r.confidence <= 1);
  assert(validConf, 'All confidence values are in [0, 1]');

  // 5. Sorted by descending confidence
  let sortedCorrectly = true;
  for (let i = 1; i < results.length; i++) {
    if (results[i].confidence > results[i - 1].confidence) {
      sortedCorrectly = false;
      break;
    }
  }
  assert(sortedCorrectly, 'Results sorted by descending confidence');

  // 6. Detects "Notifications" from "## Feature: Notifications"
  const names = results.map(r => r.name.toLowerCase());
  assert(names.some(n => n.includes('notification')), 'Detects "Notifications" domain');

  // 7. Detects "Analytics" from "## Feature: Analytics"
  assert(names.some(n => n.includes('analytic')), 'Detects "Analytics" domain');

  // 8. No duplicates by name
  const uniqueNames = new Set(results.map(r => r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')));
  assertEqual(uniqueNames.size, results.length, 'No duplicate domain names');

  // Summary
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
