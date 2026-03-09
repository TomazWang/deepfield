#!/usr/bin/env node
/**
 * detect-behavior-domains.js — Extract candidate behavior domain names from reference docs.
 *
 * Usage:
 *   node detect-behavior-domains.js --source-dir <path> [--output json]
 *
 * Arguments:
 *   --source-dir <path>   Directory to search recursively for markdown/text files (required)
 *   --output json         Output format (currently only 'json' is supported; default: json)
 *
 * Output (stdout):
 *   JSON array of { name, confidence, sourceFile }
 *
 * Exit codes:
 *   0 — success
 *   1 — argument/IO error
 *
 * This script is read-only: it writes nothing to disk.
 * Uses CJS (require/module.exports). NO ESM.
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

  const opts = {
    sourceDir: null,
    output: 'json',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source-dir' && i + 1 < args.length) {
      opts.sourceDir = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      opts.output = args[++i];
    }
  }

  return opts;
}

function printUsage() {
  console.error('Usage: detect-behavior-domains.js --source-dir <path> [--output json]');
}

function validateArgs(opts) {
  if (!opts.sourceDir) {
    console.error('Error: --source-dir is required');
    process.exit(1);
  }
  const resolved = path.resolve(opts.sourceDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: source-dir does not exist: ${resolved}`);
    process.exit(1);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    console.error(`Error: source-dir is not a directory: ${resolved}`);
    process.exit(1);
  }
  opts.sourceDir = resolved;
}

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.rst']);
const MAX_FILE_SIZE = 512 * 1024; // 512 KB — skip very large files

function collectFiles(dir, collected = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // Skip unreadable directories
    return collected;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden dirs and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      collectFiles(fullPath, collected);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
      } catch {
        continue;
      }
      collected.push(fullPath);
    }
  }

  return collected;
}

// ---------------------------------------------------------------------------
// Extraction patterns
// ---------------------------------------------------------------------------

// Headings that are likely behavior domain names
const BEHAVIOR_HEADING_PATTERNS = [
  // Feature headings: "## Feature: X", "## Feature X"
  /^#{1,4}\s+feature[:\s]+(.+)/i,
  // User story headings
  /^#{1,4}\s+(?:user\s+)?stor(?:y|ies)[:\s]+(.+)/i,
  // "As a ... I want to ..." stories (capture the feature part)
  /^#{1,4}\s+as\s+a\s+.+,?\s+i\s+want\s+to\s+(.+)/i,
  // Domain headings: "## Domain: X"
  /^#{1,4}\s+domain[:\s]+(.+)/i,
  // Capability headings: "## Capability: X"
  /^#{1,4}\s+capability[:\s]+(.+)/i,
  // Epic headings
  /^#{1,4}\s+epic[:\s]+(.+)/i,
];

// List items that suggest behavior domains
const BEHAVIOR_LIST_PATTERNS = [
  // "- Feature: X" or "* Feature: X"
  /^[-*]\s+feature[:\s]+(.+)/i,
  // User stories in list form
  /^[-*]\s+as\s+a\s+.+,?\s+i\s+want\s+(.+)/i,
  // "- [x] Feature name" (checkbox items)
  /^[-*]\s+\[[ x]\]\s+(.+)/i,
];

// Phrases suggesting we are in a features/capabilities section
const SECTION_TRIGGERS = [
  /^#{1,3}\s+(?:features?|capabilities|epics?|user\s+stories?|product\s+areas?|domains?)\s*$/i,
];

// Words to reject as domain names (too generic)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'this', 'that', 'and', 'or', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'about', 'into', 'through', 'during',
  'overview', 'introduction', 'summary', 'table of contents', 'contents',
  'requirements', 'changelog', 'readme',
]);

function isValidName(name) {
  const cleaned = name.trim().toLowerCase().replace(/[*_`]/g, '');
  if (cleaned.length < 3 || cleaned.length > 80) return false;
  if (STOP_WORDS.has(cleaned)) return false;
  // Must contain at least one alphabetic character
  if (!/[a-z]/i.test(cleaned)) return false;
  return true;
}

function cleanName(raw) {
  return raw
    .trim()
    .replace(/\s*[.!?,;:]+$/, '')   // strip trailing punctuation
    .replace(/[*_`#]/g, '')          // strip markdown emphasis/code
    .replace(/\s+/g, ' ')            // normalise whitespace
    .trim();
}

function toKebab(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract candidate behavior domains from a single file's content.
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<{ name: string, confidence: number, sourceFile: string }>}
 */
function extractFromContent(content, filePath) {
  const lines = content.split('\n');
  const candidates = new Map(); // kebab-name → { name, confidence, sourceFile }

  let inBehaviorSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we enter a behavior-oriented section
    if (SECTION_TRIGGERS.some(re => re.test(line))) {
      inBehaviorSection = true;
      continue;
    }

    // If we hit another top-level section heading, reset the section flag
    if (/^#{1,2}\s+/.test(line) && !SECTION_TRIGGERS.some(re => re.test(line))) {
      inBehaviorSection = false;
    }

    // Try heading patterns (high confidence when matched directly)
    for (const re of BEHAVIOR_HEADING_PATTERNS) {
      const m = line.match(re);
      if (m) {
        const name = cleanName(m[1]);
        if (isValidName(name)) {
          const key = toKebab(name);
          const existing = candidates.get(key);
          const conf = 0.8;
          if (!existing || existing.confidence < conf) {
            candidates.set(key, { name, confidence: conf, sourceFile: filePath });
          }
        }
        break;
      }
    }

    // Try list-item patterns
    for (const re of BEHAVIOR_LIST_PATTERNS) {
      const m = line.match(re);
      if (m) {
        const name = cleanName(m[1]);
        if (isValidName(name)) {
          const key = toKebab(name);
          const existing = candidates.get(key);
          // Lower confidence if not in a behaviour section
          const conf = inBehaviorSection ? 0.7 : 0.5;
          if (!existing || existing.confidence < conf) {
            candidates.set(key, { name, confidence: conf, sourceFile: filePath });
          }
        }
        break;
      }
    }

    // Plain list items inside a behavior section get low confidence
    if (inBehaviorSection && /^[-*]\s+(.+)/.test(line)) {
      const m = line.match(/^[-*]\s+(.+)/);
      if (m) {
        const name = cleanName(m[1]);
        if (isValidName(name)) {
          const key = toKebab(name);
          if (!candidates.has(key)) {
            candidates.set(key, { name, confidence: 0.4, sourceFile: filePath });
          }
        }
      }
    }
  }

  return Array.from(candidates.values());
}

/**
 * Merge candidates from multiple files, keeping highest confidence per name.
 *
 * @param {Array<{ name: string, confidence: number, sourceFile: string }>} allCandidates
 * @returns {Array<{ name: string, confidence: number, sourceFile: string }>}
 */
function mergeCandidates(allCandidates) {
  const merged = new Map();

  for (const candidate of allCandidates) {
    const key = toKebab(candidate.name);
    const existing = merged.get(key);
    if (!existing || existing.confidence < candidate.confidence) {
      merged.set(key, candidate);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.confidence - a.confidence);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * detectBehaviorDomains — programmatic entry point.
 *
 * @param {string} sourceDir  Absolute or relative path to search.
 * @returns {Array<{ name: string, confidence: number, sourceFile: string }>}
 */
function detectBehaviorDomains(sourceDir) {
  const resolved = path.resolve(sourceDir);
  const files = collectFiles(resolved);
  const allCandidates = [];

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }
    const candidates = extractFromContent(content, filePath);
    allCandidates.push(...candidates);
  }

  return mergeCandidates(allCandidates);
}

module.exports = { detectBehaviorDomains };

// Run as CLI when invoked directly
if (require.main === module) {
  const opts = parseArgs();
  validateArgs(opts);

  let results;
  try {
    results = detectBehaviorDomains(opts.sourceDir);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  process.exit(0);
}
