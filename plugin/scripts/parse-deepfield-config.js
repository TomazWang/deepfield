#!/usr/bin/env node
/**
 * parse-deepfield-config.js - Parse deepfield/DEEPFIELD.md into structured JSON config
 *
 * Usage: node parse-deepfield-config.js [deepfield-path]
 *
 * Output format:
 * {
 *   "exists": true,
 *   "language": "English",
 *   "codeLanguage": "TypeScript",
 *   "diagramFormat": "Mermaid",
 *   "detailLevel": "Standard",
 *   "priorities": {
 *     "high": ["authentication", "payment-processing"],
 *     "medium": ["catalog", "search"],
 *     "low": ["reporting"],
 *     "exclude": ["/legacy/**", "/vendor/**"]
 *   },
 *   "domainInstructions": {
 *     "authentication": "⚠️ Custom OAuth2 flow...",
 *     "payment-processing": "⚠️ PCI compliance critical..."
 *   },
 *   "outputPrefs": "### Code Examples\n- **Include:** ...",
 *   "trustHierarchy": ["Running code", "Integration tests", "Git history"],
 *   "raw": "<full file content>"
 * }
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_PATH = './deepfield/DEEPFIELD.md';

/**
 * Default config returned when DEEPFIELD.md is absent or a field is missing.
 */
function getDefaults() {
  return {
    exists: false,
    language: 'English',
    codeLanguage: null,
    diagramFormat: 'Mermaid',
    detailLevel: 'Standard',
    priorities: {
      high: [],
      medium: [],
      low: [],
      exclude: [],
    },
    domainInstructions: {},
    outputPrefs: null,
    trustHierarchy: [],
    raw: null,
  };
}

/**
 * Extract the content of a top-level section (## Heading) from markdown content.
 * Returns the section body (without the heading line), or null if not found.
 * Uses a line-by-line approach to avoid regex multiline edge cases.
 */
function extractSection(content, sectionName) {
  const headingRe = new RegExp(`^##\\s+${escapeRegex(sectionName)}\\s*$`, 'i');
  const nextHeadingRe = /^##\s/;
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (headingRe.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (nextHeadingRe.test(line)) break;
      sectionLines.push(line);
    }
  }

  return inSection ? sectionLines.join('\n').trim() : null;
}

/**
 * Extract a bold key-value from a section body, e.g.:
 * "**Documentation Language:** English" -> "English"
 */
function extractBoldValue(text, key) {
  const pattern = new RegExp(
    `\\*\\*${escapeRegex(key)}:\\*\\*\\s*(.+?)\\s*$`,
    'im'
  );
  const match = text.match(pattern);
  if (!match) return null;
  const value = match[1].trim();
  // Ignore placeholder-like values
  if (value.startsWith('[') || value === '' || value === '-') return null;
  return value;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract Documentation Language from Language & Format section.
 */
function extractLanguage(content) {
  const section = extractSection(content, 'Language & Format');
  if (!section) return 'English';
  return extractBoldValue(section, 'Documentation Language') || 'English';
}

/**
 * Extract Code Examples language from Language & Format section.
 */
function extractCodeLanguage(content) {
  const section = extractSection(content, 'Language & Format');
  if (!section) return null;
  return extractBoldValue(section, 'Code Examples') || null;
}

/**
 * Extract Diagrams format from Language & Format section.
 */
function extractDiagramFormat(content) {
  const section = extractSection(content, 'Language & Format');
  if (!section) return 'Mermaid';
  return extractBoldValue(section, 'Diagrams') || 'Mermaid';
}

/**
 * Extract Detail Level from Language & Format section.
 */
function extractDetailLevel(content) {
  const section = extractSection(content, 'Language & Format');
  if (!section) return 'Standard';
  return extractBoldValue(section, 'Detail Level') || 'Standard';
}

/**
 * Parse a bullet list from a subsection body into a string array.
 * Handles "- item", "* item", "  - item" formats.
 * Ignores empty bullets (just "-" or "*") and placeholder lines.
 */
function parseBulletList(text) {
  const lines = text.split('\n');
  const items = [];
  for (const line of lines) {
    const match = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (match) {
      const item = match[1].trim();
      // Skip placeholder items
      if (item && item !== '-' && !item.startsWith('[') && !item.startsWith('<!--')) {
        items.push(item);
      }
    }
  }
  return items;
}

/**
 * Extract a ### subsection body from within a larger section body.
 * Uses line-by-line approach to avoid multiline regex edge cases.
 */
function extractSubsection(sectionBody, subsectionName) {
  const headingRe = new RegExp(`^###\\s+${escapeRegex(subsectionName)}\\s*$`, 'i');
  const nextHeadingRe = /^###\s/;
  const lines = sectionBody.split('\n');
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (headingRe.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (nextHeadingRe.test(line)) break;
      sectionLines.push(line);
    }
  }

  return inSection ? sectionLines.join('\n').trim() : null;
}

/**
 * Extract priorities (high/medium/low/exclude) from Learning Priorities section.
 */
function extractPriorities(content) {
  const section = extractSection(content, 'Learning Priorities');
  if (!section) {
    return { high: [], medium: [], low: [], exclude: [] };
  }

  const highText = extractSubsection(section, 'High Priority');
  const medText = extractSubsection(section, 'Medium Priority');
  const lowText = extractSubsection(section, 'Low Priority');
  const excludeText = extractSubsection(section, 'Exclude');

  // Domains may be comma-separated on one bullet or one per bullet
  function parseDomainList(text) {
    if (!text) return [];
    const rawItems = parseBulletList(text);
    const domains = [];
    for (const item of rawItems) {
      // Split on commas to support "auth, payment, orders" in a single bullet
      const parts = item.split(',').map(p => p.trim()).filter(Boolean);
      domains.push(...parts);
    }
    return domains;
  }

  return {
    high: parseDomainList(highText),
    medium: parseDomainList(medText),
    low: parseDomainList(lowText),
    exclude: parseDomainList(excludeText),
  };
}

/**
 * Extract domain-specific instructions from the Domain-Specific Instructions section.
 * Returns an object keyed by domain name (lowercase, hyphenated) with raw markdown body.
 */
function extractDomainInstructions(content) {
  const section = extractSection(content, 'Domain-Specific Instructions');
  if (!section) return {};

  const instructions = {};

  // Split section on ### headings to iterate all domain blocks
  const parts = section.split(/^###\s+/m);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const firstNewline = part.indexOf('\n');
    if (firstNewline === -1) continue;

    const rawName = part.slice(0, firstNewline).trim();
    const body = part.slice(firstNewline + 1).trim();

    // Skip placeholder domain names
    if (!rawName || rawName === 'domain-name' || rawName.startsWith('[')) continue;
    if (!body || body.length < 5) continue;

    // Normalize domain name: lowercase, replace spaces with hyphens
    const domainKey = rawName.toLowerCase().replace(/\s+/g, '-');
    instructions[domainKey] = body;
  }

  return instructions;
}

/**
 * Extract the raw Output Preferences section text.
 */
function extractOutputPrefs(content) {
  const section = extractSection(content, 'Output Preferences');
  return section && section.length > 5 ? section : null;
}

/**
 * Extract the Trust Hierarchy as an ordered array of strings.
 * Parses numbered list items: "1. Running code ← Highest trust" -> "Running code"
 */
function extractTrustHierarchy(content) {
  const section = extractSection(content, 'Trust Hierarchy');
  if (!section) return [];

  const lines = section.split('\n');
  const items = [];

  for (const line of lines) {
    // Match numbered list items: "1. Item text" or "1. Item text ← note"
    const match = line.match(/^\s*\d+\.\s+(.+?)(?:\s+←.*)?$/);
    if (match) {
      const item = match[1].trim();
      if (item && !item.startsWith('[')) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Parse a DEEPFIELD.md file and return structured config.
 * When file is absent, returns defaults with exists: false.
 * Always exits cleanly (no exceptions propagated to CLI).
 */
function parseDeepfieldConfig(configPath) {
  const resolvedPath = path.resolve(configPath || DEFAULT_CONFIG_PATH);
  const defaults = getDefaults();

  if (!fs.existsSync(resolvedPath)) {
    return defaults;
  }

  let content;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    // Unreadable file — return defaults
    return defaults;
  }

  if (!content.trim()) {
    return { ...defaults, exists: true, raw: content };
  }

  return {
    exists: true,
    language: extractLanguage(content),
    codeLanguage: extractCodeLanguage(content),
    diagramFormat: extractDiagramFormat(content),
    detailLevel: extractDetailLevel(content),
    priorities: extractPriorities(content),
    domainInstructions: extractDomainInstructions(content),
    outputPrefs: extractOutputPrefs(content),
    trustHierarchy: extractTrustHierarchy(content),
    raw: content,
  };
}

// CLI entrypoint
if (require.main === module) {
  const configPath = process.argv[2] || DEFAULT_CONFIG_PATH;
  const config = parseDeepfieldConfig(configPath);
  // Omit raw from CLI output for readability (can be large)
  const output = { ...config };
  delete output.raw;
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

module.exports = { parseDeepfieldConfig };
