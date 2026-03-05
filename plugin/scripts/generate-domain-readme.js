#!/usr/bin/env node
/**
 * generate-domain-readme.js — Generate deepfield/drafts/domains/{domain}/README.md
 *
 * Usage:
 *   node generate-domain-readme.js --domain <name> --drafts-dir <path> --run-config <path> --output <path>
 *
 * Arguments:
 *   --domain <name>       Domain name (e.g. "authentication") (required)
 *   --drafts-dir <path>   Path to deepfield/drafts/ directory (required)
 *   --run-config <path>   Path to run-N.config.json (required)
 *   --output <path>       Path to write README.md (required)
 *
 * The domain flat file is expected at: <drafts-dir>/domains/<domain>.md
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

  const config = { domain: null, draftsDir: null, runConfig: null, output: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && i + 1 < args.length) {
      config.domain = args[++i];
    } else if (args[i] === '--drafts-dir' && i + 1 < args.length) {
      config.draftsDir = args[++i];
    } else if (args[i] === '--run-config' && i + 1 < args.length) {
      config.runConfig = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    }
  }

  return config;
}

function printUsage() {
  console.error('Usage: generate-domain-readme.js --domain <name> --drafts-dir <path> --run-config <path> --output <path>');
}

function validate(config) {
  if (!config.domain)    { console.error('Error: --domain is required');     process.exit(1); }
  if (!config.draftsDir) { console.error('Error: --drafts-dir is required'); process.exit(1); }
  if (!config.runConfig) { console.error('Error: --run-config is required');  process.exit(1); }
  if (!config.output)    { console.error('Error: --output is required');      process.exit(1); }

  if (!fs.existsSync(config.draftsDir)) {
    console.error(`Error: drafts dir not found: ${config.draftsDir}`);
    process.exit(1);
  }
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

function loadDomainFile(draftsDir, domainName) {
  const domainPath = path.join(draftsDir, 'domains', `${domainName}.md`);
  if (!fs.existsSync(domainPath)) {
    return null;
  }
  try {
    return fs.readFileSync(domainPath, 'utf-8');
  } catch (_) {
    return null;
  }
}

function extractOverview(content) {
  if (!content) return '_No overview available yet._';
  const lines = content.split('\n');
  const paragraphs = [];
  let inParagraph = false;

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (paragraphs.length > 0) break; // Stop after first section header
      continue;
    }
    if (line.trim() === '') {
      if (inParagraph) break; // End of first paragraph
      continue;
    }
    inParagraph = true;
    paragraphs.push(line.trim());
  }

  return paragraphs.length > 0 ? paragraphs.join(' ') : '_No overview available yet._';
}

function extractOpenQuestions(content) {
  if (!content) return [];
  const questions = [];
  const lines = content.split('\n');
  let inQuestionsSection = false;

  for (const line of lines) {
    if (/^#+\s*(open\s+questions?|unknowns?|gaps?)/i.test(line)) {
      inQuestionsSection = true;
      continue;
    }
    if (inQuestionsSection && line.startsWith('#')) break; // Next section
    if (inQuestionsSection && /^[-*]\s+/.test(line)) {
      questions.push(line.replace(/^[-*]\s+/, '').trim());
    }
  }

  return questions;
}

function getConfidenceData(domainName, runConfig) {
  const changes = runConfig.confidenceChanges || {};
  for (const [k, v] of Object.entries(changes)) {
    if (k.toLowerCase().replace(/\s+/g, '-') === domainName.toLowerCase().replace(/\s+/g, '-')) {
      return { before: v.before || 0, after: v.after || 0 };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderConfidenceDelta(conf) {
  if (!conf) return '';
  const delta = conf.after - conf.before;
  if (delta === 0) return '_(no change this run)_';
  const sign = delta > 0 ? '+' : '';
  return `_(${sign}${delta}% since last run)_`;
}

function renderRecentChanges(domainName, runConfig) {
  const conf = getConfidenceData(domainName, runConfig);
  if (!conf) return '_This domain was not a focus topic in this run._';

  const lines = [];
  if (conf.after !== conf.before) {
    const delta = conf.after - conf.before;
    const sign = delta >= 0 ? '+' : '';
    lines.push(`- Confidence updated: ${conf.before}% → ${conf.after}% (${sign}${delta}%)`);
  }
  if (runConfig.confidenceChanges && runConfig.confidenceChanges[domainName] && runConfig.confidenceChanges[domainName].notes) {
    lines.push(`- ${runConfig.confidenceChanges[domainName].notes}`);
  }
  return lines.length > 0 ? lines.join('\n') : '_No specific changes recorded._';
}

function renderOpenQuestions(questions) {
  if (questions.length === 0) return '_No open questions._';
  return questions.slice(0, 5).map(q => `- ${q}`).join('\n');
}

function render({ domainName, domainFile, runNumber, generatedAt, overview, conf, recentChanges, openQuestions }) {
  const confidenceStr = conf ? `${conf.after}%` : '—';
  const delta = renderConfidenceDelta(conf);
  const displayName = domainName.charAt(0).toUpperCase() + domainName.slice(1).replace(/-/g, ' ');

  return `# ${displayName}

> Companion summary for [\`../${domainFile}\`](../${domainFile}).
> Generated after Run ${runNumber} on ${generatedAt}.

## Overview

${overview}

## Confidence

**${confidenceStr}** ${delta}

## Recent Changes (Run ${runNumber})

${recentChanges}

## Open Questions

${renderOpenQuestions(openQuestions)}

## Full Documentation

See [../${domainFile}](../${domainFile}) for the complete domain knowledge base.

---

*Generated by \`generate-domain-readme.js\` after Run ${runNumber}.*
`;
}

// ---------------------------------------------------------------------------
// Atomic write
// ---------------------------------------------------------------------------

function writeAtomic(outputPath, content) {
  const resolved = path.resolve(outputPath);
  // Ensure parent directory exists
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

  const runConfig   = loadRunConfig(config.runConfig);
  const domainFile  = `${config.domain}.md`;
  const content     = loadDomainFile(config.draftsDir, config.domain);
  const overview    = extractOverview(content);
  const questions   = extractOpenQuestions(content);
  const conf        = getConfidenceData(config.domain, runConfig);
  const recentChg   = renderRecentChanges(config.domain, runConfig);
  const generatedAt = new Date().toISOString().slice(0, 10);

  const markdown = render({
    domainName:    config.domain,
    domainFile,
    runNumber:     runConfig.runNumber || 0,
    generatedAt,
    overview,
    conf,
    recentChanges: recentChg,
    openQuestions: questions,
  });

  writeAtomic(config.output, markdown);

  console.log(`Generated domain README for "${config.domain}" → ${path.resolve(config.output)}`);
  process.exit(0);
}

main();
