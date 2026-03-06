#!/usr/bin/env node
/**
 * generate-domain-readme.js — Generate deepfield/drafts/domains/{domain}/README.md
 *
 * Usage:
 *   node generate-domain-readme.js --domain <name> --drafts-dir <path> --run-config <path> \
 *     --behavior-spec <path> --tech-spec <path> --output <path>
 *
 * Arguments:
 *   --domain <name>           Domain name (e.g. "authentication") (required)
 *   --drafts-dir <path>       Path to deepfield/drafts/ directory (required)
 *   --run-config <path>       Path to run-N.config.json (required)
 *   --behavior-spec <path>    Path to behavior-spec.md (optional, derived if omitted)
 *   --tech-spec <path>        Path to tech-spec.md (optional, derived if omitted)
 *   --output <path>           Path to write README.md (required)
 *
 * Domain files are expected at:
 *   <drafts-dir>/domains/<domain>/behavior-spec.md
 *   <drafts-dir>/domains/<domain>/tech-spec.md
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

  const config = {
    domain: null,
    draftsDir: null,
    runConfig: null,
    behaviorSpec: null,
    techSpec: null,
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && i + 1 < args.length) {
      config.domain = args[++i];
    } else if (args[i] === '--drafts-dir' && i + 1 < args.length) {
      config.draftsDir = args[++i];
    } else if (args[i] === '--run-config' && i + 1 < args.length) {
      config.runConfig = args[++i];
    } else if (args[i] === '--behavior-spec' && i + 1 < args.length) {
      config.behaviorSpec = args[++i];
    } else if (args[i] === '--tech-spec' && i + 1 < args.length) {
      config.techSpec = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    }
  }

  return config;
}

function printUsage() {
  console.error(
    'Usage: generate-domain-readme.js --domain <name> --drafts-dir <path> ' +
    '--run-config <path> [--behavior-spec <path>] [--tech-spec <path>] --output <path>'
  );
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

  // Derive spec paths if not explicitly provided
  if (!config.behaviorSpec) {
    config.behaviorSpec = path.join(config.draftsDir, 'domains', config.domain, 'behavior-spec.md');
  }
  if (!config.techSpec) {
    config.techSpec = path.join(config.draftsDir, 'domains', config.domain, 'tech-spec.md');
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

function loadSpecFile(specPath) {
  if (!fs.existsSync(specPath)) return null;
  try {
    return fs.readFileSync(specPath, 'utf-8');
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

function extractConfidenceFromSpec(content) {
  if (!content) return null;
  const match = content.match(/\*Confidence:\s*(\d+)%\*/);
  return match ? parseInt(match[1], 10) : null;
}

function extractLastUpdatedFromSpec(content) {
  if (!content) return null;
  const match = content.match(/\*Last Updated:\s*([^*]+)\*/);
  return match ? match[1].trim() : null;
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

function render({
  domainName,
  runNumber,
  generatedAt,
  overview,
  conf,
  recentChanges,
  openQuestions,
  behaviorSpecExists,
  techSpecExists,
  behaviorConfidence,
  techConfidence,
  behaviorLastUpdated,
  techLastUpdated,
}) {
  const displayName = domainName.charAt(0).toUpperCase() + domainName.slice(1).replace(/-/g, ' ');
  const delta = renderConfidenceDelta(conf);

  const behaviorLine = behaviorSpecExists
    ? `| [behavior-spec.md](./behavior-spec.md) | Stakeholder specification — user stories, scenarios, business rules | ${behaviorConfidence !== null ? behaviorConfidence + '%' : '—'} | ${behaviorLastUpdated || '—'} |`
    : `| behavior-spec.md | _Not yet created_ | — | — |`;

  const techLine = techSpecExists
    ? `| [tech-spec.md](./tech-spec.md) | Technical specification — architecture, implementations, data models | ${techConfidence !== null ? techConfidence + '%' : '—'} | ${techLastUpdated || '—'} |`
    : `| tech-spec.md | _Not yet created_ | — | — |`;

  return `# ${displayName}

> Domain summary generated after Run ${runNumber} on ${generatedAt}.

## Overview

${overview}

## Confidence

**${conf ? conf.after + '%' : '—'}** ${delta}

## Specification Files

| File | Description | Confidence | Last Updated |
|------|-------------|-----------|--------------|
${behaviorLine}
${techLine}

## Recent Changes (Run ${runNumber})

${recentChanges}

## Open Questions

${renderOpenQuestions(openQuestions)}

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

  const runConfig        = loadRunConfig(config.runConfig);
  const behaviorContent  = loadSpecFile(config.behaviorSpec);
  const techContent      = loadSpecFile(config.techSpec);

  // Use behavior-spec for overview and open questions (stakeholder-friendly)
  // Fall back to tech-spec if behavior-spec not yet created
  const primaryContent = behaviorContent || techContent;
  const overview       = extractOverview(primaryContent);
  const questions      = extractOpenQuestions(primaryContent);
  const conf           = getConfidenceData(config.domain, runConfig);
  const recentChg      = renderRecentChanges(config.domain, runConfig);
  const generatedAt    = new Date().toISOString().slice(0, 10);

  const markdown = render({
    domainName:         config.domain,
    runNumber:          runConfig.runNumber || 0,
    generatedAt,
    overview,
    conf,
    recentChanges:      recentChg,
    openQuestions:      questions,
    behaviorSpecExists: behaviorContent !== null,
    techSpecExists:     techContent !== null,
    behaviorConfidence: extractConfidenceFromSpec(behaviorContent),
    techConfidence:     extractConfidenceFromSpec(techContent),
    behaviorLastUpdated: extractLastUpdatedFromSpec(behaviorContent),
    techLastUpdated:    extractLastUpdatedFromSpec(techContent),
  });

  writeAtomic(config.output, markdown);

  console.log(`Generated domain README for "${config.domain}" → ${path.resolve(config.output)}`);
  process.exit(0);
}

main();
