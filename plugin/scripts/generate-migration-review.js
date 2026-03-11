#!/usr/bin/env node
/**
 * generate-migration-review.js — Write a per-domain migration-review.md
 *
 * Usage:
 *   generate-migration-review.js <output_path> <review_json>
 *
 * <review_json> shape:
 *   {
 *     "domain":    "auth-and-authorization",           // required — domain slug
 *     "sourceFile": "drafts/behavior/auth/spec.md",    // required — original file path
 *     "migrations": [                                  // required — what was placed where
 *       {
 *         "section": "## Architecture",                // section heading from source
 *         "target":  "drafts/en/tech-spec/auth/design.md",
 *         "reason":  "L2 component structure"
 *       }
 *     ],
 *     "needsManualReview": [                           // optional — ambiguous sections
 *       "## Background"
 *     ]
 *   }
 *
 * Output:
 *   migration-review.md written atomically to <output_path>.
 *   Human-readable report: table of section → target + reasons, plus manual-review list.
 *
 * Exit codes:
 *   0 — success
 *   1 — argument / IO error
 *   2 — JSON parse error
 *   3 — validation error
 *
 * Called by: plugin/skills/deepfield-upgrade.md migration agent
 * One script call per domain — run in a loop for multi-domain workspaces.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateReview(review) {
  if (typeof review !== 'object' || review === null) {
    throw new Error('review_json must be a JSON object');
  }
  if (typeof review.domain !== 'string' || review.domain.trim() === '') {
    throw new Error('review.domain must be a non-empty string');
  }
  if (typeof review.sourceFile !== 'string' || review.sourceFile.trim() === '') {
    throw new Error('review.sourceFile must be a non-empty string');
  }
  if (!Array.isArray(review.migrations)) {
    throw new Error('review.migrations must be an array');
  }
  for (let i = 0; i < review.migrations.length; i++) {
    const m = review.migrations[i];
    if (typeof m !== 'object' || m === null) {
      throw new Error(`review.migrations[${i}] must be an object`);
    }
    if (typeof m.section !== 'string' || m.section.trim() === '') {
      throw new Error(`review.migrations[${i}].section must be a non-empty string`);
    }
    if (typeof m.target !== 'string' || m.target.trim() === '') {
      throw new Error(`review.migrations[${i}].target must be a non-empty string`);
    }
    if (typeof m.reason !== 'string' || m.reason.trim() === '') {
      throw new Error(`review.migrations[${i}].reason must be a non-empty string`);
    }
  }
  if (review.needsManualReview !== undefined && !Array.isArray(review.needsManualReview)) {
    throw new Error('review.needsManualReview must be an array if present');
  }
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------
function generateMarkdown(review) {
  const now    = new Date().toISOString();
  const manual = review.needsManualReview || [];

  // Group migrations by target file for summary counts
  const byTarget = {};
  for (const m of review.migrations) {
    if (!byTarget[m.target]) byTarget[m.target] = 0;
    byTarget[m.target]++;
  }

  const lines = [
    `# Migration Review — \`${review.domain}\``,
    '',
    `> Generated: ${now}`,
    `> Source: \`${review.sourceFile}\``,
    `> Confirm and delete originals only after reviewing this report.`,
    '',
    '---',
    '',
  ];

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Target file | Sections placed |');
  lines.push('|---|---|');
  for (const [target, count] of Object.entries(byTarget)) {
    lines.push(`| \`${target}\` | ${count} |`);
  }
  if (manual.length > 0) {
    lines.push(`| _(manual review)_ | ${manual.length} |`);
  }
  lines.push('');

  // Placement detail table
  lines.push('## Section Placement');
  lines.push('');
  lines.push('| Section | Target file | Reason |');
  lines.push('|---|---|---|');
  for (const m of review.migrations) {
    const section = m.section.replace(/\|/g, '\\|');
    const target  = m.target.replace(/\|/g, '\\|');
    const reason  = m.reason.replace(/\|/g, '\\|');
    lines.push(`| \`${section}\` | \`${target}\` | ${reason} |`);
  }
  lines.push('');

  // Manual review list
  if (manual.length > 0) {
    lines.push('## Needs Manual Review');
    lines.push('');
    lines.push('These sections were ambiguous — copied to `implementation.md` as a safe default.');
    lines.push('Review and move if categorization is wrong.');
    lines.push('');
    for (const s of manual) {
      lines.push(`- \`${s}\``);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('**Actions after review:**');
  lines.push('1. Open each target file and verify content placement');
  lines.push('2. Move any misplaced sections manually');
  lines.push('3. When satisfied, delete the original source file');
  lines.push('4. Remove this review file once originals are confirmed deleted');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
if (process.argv.length < 4) {
  console.error('Error: Missing required arguments');
  console.error('Usage: generate-migration-review.js <output_path> <review_json>');
  process.exit(1);
}

const outputPath = process.argv[2];
const reviewJson = process.argv[3];

let review;
try {
  review = JSON.parse(reviewJson);
} catch (err) {
  console.error(`Error: Invalid JSON for review — ${err.message}`);
  process.exit(2);
}

try {
  validateReview(review);
} catch (err) {
  console.error(`Validation error: ${err.message}`);
  process.exit(3);
}

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate and write atomically
const markdown = generateMarkdown(review);
const tempPath = `${outputPath}.tmp`;
try {
  fs.writeFileSync(tempPath, markdown, 'utf8');
  fs.renameSync(tempPath, outputPath);
} catch (err) {
  console.error(`Error writing output: ${err.message}`);
  if (fs.existsSync(tempPath)) {
    try { fs.unlinkSync(tempPath); } catch (_) {}
  }
  process.exit(1);
}

console.log(`Generated ${outputPath} (${review.migrations.length} migrations, ${(review.needsManualReview || []).length} manual review items)`);
process.exit(0);
