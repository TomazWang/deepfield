#!/usr/bin/env node
/**
 * generate-domain-index.js - Orchestrate multi-source domain detection and generate domain-index.md
 *
 * Usage:
 *   generate-domain-index.js --output <path> [--repos <json-or-file>] [--brief <json-file>]
 *
 * Arguments:
 *   --output <path>          Path to write domain-index.md (required)
 *   --repos  <json|file>    JSON array of repo paths, or path to a JSON file containing the array
 *   --brief  <file>          Path to a brief JSON file (must have a focusAreas array)
 *
 * Brief JSON format:
 *   { "focusAreas": ["auth", "payments", "frontend"] }
 *
 * Repos JSON format (inline or file):
 *   ["/path/to/repo-a", "/path/to/repo-b"]
 *   or
 *   [{ "name": "repo-a", "path": "/path/to/repo-a" }, ...]
 *
 * Output: domain-index.md written atomically to --output path.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { analyzeDomains } = require('./analyze-domains');

// ---------------------------------------------------------------------------
// 2.6 Argument parsing and validation
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args[0] === '--help' || args[0] === '-h' ? 0 : 1);
  }

  const config = { output: null, repos: null, brief: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (args[i] === '--repos' && i + 1 < args.length) {
      config.repos = args[++i];
    } else if (args[i] === '--brief' && i + 1 < args.length) {
      config.brief = args[++i];
    }
  }

  return config;
}

function printUsage() {
  console.error('Usage: generate-domain-index.js --output <path> [--repos <json-or-file>] [--brief <file>]');
  console.error('');
  console.error('  --output <path>     Path to write domain-index.md (required)');
  console.error('  --repos  <arg>      JSON array of repo paths, or path to JSON file');
  console.error('  --brief  <file>     Path to brief JSON file with focusAreas array');
}

function validateAndLoad(config) {
  // --output is required
  if (!config.output) {
    console.error('Error: --output is required');
    process.exit(1);
  }

  // Ensure output directory exists
  const outDir = path.dirname(path.resolve(config.output));
  if (!fs.existsSync(outDir)) {
    console.error(`Error: Output directory does not exist: ${outDir}`);
    process.exit(1);
  }

  // Load repos list
  let repos = [];
  if (config.repos) {
    repos = loadRepos(config.repos);
  }

  // Load brief
  let brief = { focusAreas: [] };
  if (config.brief) {
    brief = loadBrief(config.brief);
  }

  return { repos, brief, output: config.output };
}

function loadRepos(arg) {
  // Try as JSON inline first
  let raw = arg;
  if (!arg.startsWith('[') && !arg.startsWith('{')) {
    // Treat as file path
    if (!fs.existsSync(arg)) {
      console.error(`Error: Repos file not found: ${arg}`);
      process.exit(1);
    }
    try {
      raw = fs.readFileSync(arg, 'utf-8');
    } catch (err) {
      console.error(`Error: Cannot read repos file: ${arg} — ${err.message}`);
      process.exit(1);
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Invalid JSON in --repos: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(parsed)) {
    console.error('Error: --repos must be a JSON array');
    process.exit(1);
  }

  // Normalize: each element can be a string path or { name, path } object
  return parsed.map((entry, idx) => {
    if (typeof entry === 'string') {
      return { name: path.basename(entry) || `repo-${idx}`, repoPath: entry };
    }
    if (typeof entry === 'object' && entry !== null) {
      const repoPath = entry.path || entry.repoPath;
      const name = entry.name || path.basename(repoPath) || `repo-${idx}`;
      if (!repoPath) {
        console.error(`Error: Repo entry at index ${idx} is missing a "path" field`);
        process.exit(1);
      }
      return { name, repoPath };
    }
    console.error(`Error: Invalid repo entry at index ${idx}`);
    process.exit(1);
  });
}

function loadBrief(briefPath) {
  if (!fs.existsSync(briefPath)) {
    console.error(`Error: Brief file not found: ${briefPath}`);
    process.exit(1);
  }
  let content;
  try {
    content = fs.readFileSync(briefPath, 'utf-8');
  } catch (err) {
    console.error(`Error: Cannot read brief file: ${briefPath} — ${err.message}`);
    process.exit(1);
  }
  try {
    const parsed = JSON.parse(content);
    return {
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
    };
  } catch (err) {
    console.error(`Error: Invalid JSON in brief file: ${briefPath} — ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 2.2 Multi-repo domain merging
// ---------------------------------------------------------------------------

const BRIEF_WEIGHT = 0.5;

function normalizeKey(name) {
  return name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function mergeRepoDomains(repos) {
  const domainMap = new Map(); // key -> { name, score, sources[], repos[] }

  for (const repo of repos) {
    let result;
    try {
      result = analyzeDomains(repo.repoPath);
    } catch (err) {
      console.error(`Warning: Could not analyze repo "${repo.name}" at ${repo.repoPath}: ${err.message}`);
      continue;
    }

    for (const domain of result.domains) {
      const key = normalizeKey(domain.name);
      if (domainMap.has(key)) {
        const existing = domainMap.get(key);
        existing.score += domain.score;
        for (const src of domain.sources) {
          if (!existing.sources.includes(src)) existing.sources.push(src);
        }
        if (!existing.repos.includes(repo.name)) existing.repos.push(repo.name);
      } else {
        domainMap.set(key, {
          name: domain.name,
          score: domain.score,
          sources: [...domain.sources],
          repos: [repo.name],
        });
      }
    }
  }

  return domainMap;
}

// ---------------------------------------------------------------------------
// 2.3 Brief hints integration
// ---------------------------------------------------------------------------

function mergeBriefHints(domainMap, brief) {
  for (const area of brief.focusAreas) {
    if (!area || typeof area !== 'string') continue;
    const key = normalizeKey(area);
    if (domainMap.has(key)) {
      const existing = domainMap.get(key);
      existing.score += BRIEF_WEIGHT;
      if (!existing.sources.includes('brief-hint')) existing.sources.push('brief-hint');
    } else {
      domainMap.set(key, {
        name: area,
        score: BRIEF_WEIGHT,
        sources: ['brief-hint'],
        repos: [],
      });
    }
  }
  return domainMap;
}

// ---------------------------------------------------------------------------
// 2.4 Markdown rendering
// ---------------------------------------------------------------------------

function assignConfidence(score) {
  if (score >= 1.5) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
}

function renderDomainIndex(domainMap) {
  const domains = Array.from(domainMap.values())
    .sort((a, b) => b.score - a.score)
    .map((d, idx) => ({
      ...d,
      score: Math.round(d.score * 100) / 100,
      rank: idx + 1,
      confidence: assignConfidence(d.score),
    }));

  const tableRows = domains.map(d => {
    const reposStr  = d.repos.length > 0 ? d.repos.join(', ') : '—';
    const sourceStr = [...new Set(d.sources)].join(', ');
    return `| ${d.name} | ${d.confidence} | — | pending | ${sourceStr} | ${reposStr} |`;
  }).join('\n');

  const detectionNotes = domains.map(d =>
    `- **${d.name}** (score: ${d.score}): detected via ${[...new Set(d.sources)].join(', ')}`
  ).join('\n');

  const patternNote = '';

  return `# Domain Index

> This file tracks how the AI decomposes the project into domains. Domains help focus learning and prevent overwhelming context.
> Generated by: \`generate-domain-index.js\` — sources analyzed: folder structure, build configs, READMEs, dependencies, brief hints.

## What is a Domain?

A domain is a cohesive area of the codebase, typically:
- 200-1000 files
- Clear boundaries (service, module, feature area)
- Can be understood in one focused learning session

## Current Domains

<!-- Auto-detected from repository structure and brief hints -->

| Domain | Confidence | File Count | Status | Detection Sources | Repositories |
|--------|-----------|------------|--------|-------------------|--------------|
${tableRows || '| (none detected) | — | — | — | — | — |'}

## How Domains Were Detected

${detectionNotes || '_No domains detected. Add repositories or brief focus areas._'}

## Domain Detection Signals

**How domains are identified (priority order):**
1. Monorepo manifests (lerna.json, nx.json, settings.gradle, pom.xml modules)
2. Framework dependencies (package.json, requirements.txt, pom.xml)
3. Directory structure (folder name patterns matching known domain types)
4. README files (H1 heading per sub-directory)
5. Brief hints (user-provided focus areas, lowest weight)

## Domain Relationships

<!-- How domains interact -->

\`\`\`
[Domain A] <-- depends on --> [Domain B]
\`\`\`

## Split/Merge History

<!-- Track domain structure changes -->

---

*This index is automatically updated by the AI during each learning run.*
`;
}

// ---------------------------------------------------------------------------
// 2.5 Atomic file write
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
  const { repos, brief, output } = validateAndLoad(config);

  // Merge domains from all repos
  const domainMap = mergeRepoDomains(repos);

  // Add brief hints
  mergeBriefHints(domainMap, brief);

  // Render markdown
  const markdown = renderDomainIndex(domainMap);

  // Write atomically
  writeAtomic(output, markdown);

  const count = domainMap.size;
  console.log(`Generated domain-index.md with ${count} domain(s) → ${path.resolve(output)}`);
  process.exit(0);
}

main();
