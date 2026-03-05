#!/usr/bin/env node
/**
 * generate-drafts-index.js — Generate deepfield/drafts/README.md
 *
 * Usage:
 *   node generate-drafts-index.js --drafts-dir <path> --run-config <path> --output <path>
 *
 * Arguments:
 *   --drafts-dir <path>   Path to deepfield/drafts/ directory (required)
 *   --run-config <path>   Path to run-N.config.json for the completed run (required)
 *   --output <path>       Path to write README.md (required)
 *   --unknowns <path>     Path to cross-cutting/unknowns.md (optional)
 *
 * Writes deepfield/drafts/README.md atomically.
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

  const config = { draftsDir: null, runConfig: null, output: null, unknowns: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--drafts-dir' && i + 1 < args.length) {
      config.draftsDir = args[++i];
    } else if (args[i] === '--run-config' && i + 1 < args.length) {
      config.runConfig = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (args[i] === '--unknowns' && i + 1 < args.length) {
      config.unknowns = args[++i];
    }
  }

  return config;
}

function printUsage() {
  console.error('Usage: generate-drafts-index.js --drafts-dir <path> --run-config <path> --output <path> [--unknowns <path>]');
}

function validate(config) {
  if (!config.draftsDir) { console.error('Error: --drafts-dir is required'); process.exit(1); }
  if (!config.runConfig)  { console.error('Error: --run-config is required');  process.exit(1); }
  if (!config.output)     { console.error('Error: --output is required');       process.exit(1); }

  if (!fs.existsSync(config.draftsDir)) {
    console.error(`Error: drafts dir not found: ${config.draftsDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(config.runConfig)) {
    console.error(`Error: run config not found: ${config.runConfig}`);
    process.exit(1);
  }

  const outDir = path.dirname(path.resolve(config.output));
  if (!fs.existsSync(outDir)) {
    console.error(`Error: output directory does not exist: ${outDir}`);
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

function findDomainFiles(draftsDir) {
  const domainsDir = path.join(draftsDir, 'domains');
  if (!fs.existsSync(domainsDir)) return [];

  return fs.readdirSync(domainsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f.replace(/\.md$/, ''),
      file: f,
      fullPath: path.join(domainsDir, f),
    }));
}

function countUnknowns(unknownsPath) {
  if (!unknownsPath || !fs.existsSync(unknownsPath)) return 0;
  try {
    const content = fs.readFileSync(unknownsPath, 'utf-8');
    // Count lines starting with "- " or "* " (list items = unknowns)
    const matches = content.match(/^[-*]\s+/gm);
    return matches ? matches.length : 0;
  } catch (_) {
    return 0;
  }
}

function extractFirstParagraph(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const textLines = [];
    let started = false;
    for (const line of lines) {
      if (!started && line.trim() === '') continue;
      if (!started && line.startsWith('#')) continue;
      started = true;
      if (line.trim() === '' && textLines.length > 0) break;
      textLines.push(line);
    }
    const para = textLines.join(' ').trim();
    return para.length > 120 ? para.slice(0, 117) + '...' : para;
  } catch (_) {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function getConfidenceForDomain(domainName, runConfig) {
  const changes = runConfig.confidenceChanges || {};
  // Try exact match, then case-insensitive match
  for (const [k, v] of Object.entries(changes)) {
    if (k.toLowerCase().replace(/\s+/g, '-') === domainName.toLowerCase().replace(/\s+/g, '-')) {
      return { before: v.before || 0, after: v.after || 0 };
    }
  }
  return null;
}

function buildDomainRows(domains, runConfig) {
  if (domains.length === 0) return '| (none) | — | — | — |';
  return domains.map(d => {
    const conf = getConfidenceForDomain(d.name, runConfig);
    const confStr = conf ? `${conf.after}%` : '—';
    const lastUpdated = conf ? `Run ${runConfig.runNumber}` : '—';
    const link = `[${d.name}](domains/${d.file})`;
    return `| ${link} | ${confStr} | ${lastUpdated} | [README](domains/${d.name}/README.md) |`;
  }).join('\n');
}

function computeAverageConfidence(domains, runConfig) {
  const changes = Object.values(runConfig.confidenceChanges || {});
  if (changes.length === 0) return 0;
  const sum = changes.reduce((acc, c) => acc + (c.after || 0), 0);
  return Math.round(sum / changes.length);
}

function buildRecentChanges(runConfig) {
  const changes = runConfig.confidenceChanges || {};
  const entries = Object.entries(changes);
  if (entries.length === 0) return '_No confidence changes recorded for this run._';
  return entries.map(([domain, c]) => {
    const delta = (c.after || 0) - (c.before || 0);
    const sign = delta >= 0 ? '+' : '';
    return `- **${domain}**: ${c.before || 0}% → ${c.after || 0}% (${sign}${delta}%)`;
  }).join('\n');
}

function buildReviewPriorities(runConfig) {
  const changes = Object.entries(runConfig.confidenceChanges || {});
  const high   = changes.filter(([, c]) => (c.contradiction || false));
  const medium = changes.filter(([, c]) => !c.contradiction && ((c.after || 0) - (c.before || 0)) > 20);
  const low    = changes.filter(([, c]) => !c.contradiction && ((c.after || 0) - (c.before || 0)) <= 20 && ((c.after || 0) - (c.before || 0)) > 0);

  const fmt = arr => arr.length === 0
    ? '_None_'
    : arr.map(([d, c]) => `- **${d}** — ${c.reason || 'Updated this run'}`).join('\n');

  return { high: fmt(high), medium: fmt(medium), low: fmt(low) };
}

function renderIndex({ runConfig, domains, unknownsCount }) {
  const runNumber       = runConfig.runNumber || 0;
  const generatedAt     = new Date().toISOString().slice(0, 10);
  const domainCount     = domains.length;
  const avgConf         = computeAverageConfidence(domains, runConfig);
  const domainRows      = buildDomainRows(domains, runConfig);
  const recentChanges   = buildRecentChanges(runConfig);
  const priorities      = buildReviewPriorities(runConfig);
  const nextRun         = runNumber + 1;

  return `# Deepfield Knowledge Base — Drafts Index

> Generated after Run ${runNumber} on ${generatedAt}.
> This file is overwritten after each learning run. Do not edit manually.

## Overview

| Metric | Value |
|--------|-------|
| Runs completed | ${runNumber} |
| Domains | ${domainCount} |
| Average confidence | ${avgConf}% |
| Open unknowns | ${unknownsCount} |

## Domains

| Domain | Confidence | Last updated | Companion |
|--------|-----------|--------------|-----------|
${domainRows}

## Recent Changes (Run ${runNumber})

${recentChanges}

## Review Priorities

### HIGH — Needs immediate attention

These findings contradict existing knowledge or resolve long-standing unknowns.

${priorities.high}

### MEDIUM — Worth reviewing

New facts with significant confidence gains (>20%).

${priorities.medium}

### LOW — FYI

Minor additions or small confidence bumps (≤20%).

${priorities.low}

## Next Steps

- Review HIGH priority items above before continuing
- Run \`/df-continue\` to start Run ${nextRun}
- Add sources or feedback to \`deepfield/source/run-${nextRun}-staging/\`

---

*Generated by \`generate-drafts-index.js\` after Run ${runNumber}.*
`;
}

// ---------------------------------------------------------------------------
// Atomic write
// ---------------------------------------------------------------------------

function writeAtomic(outputPath, content) {
  const resolved = path.resolve(outputPath);
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

  const runConfig     = loadRunConfig(config.runConfig);
  const domains       = findDomainFiles(config.draftsDir);
  const unknownsCount = countUnknowns(config.unknowns);

  const markdown = renderIndex({ runConfig, domains, unknownsCount });
  writeAtomic(config.output, markdown);

  console.log(`Generated drafts index with ${domains.length} domain(s) → ${path.resolve(config.output)}`);
  process.exit(0);
}

main();
