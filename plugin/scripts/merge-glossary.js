#!/usr/bin/env node
/**
 * merge-glossary.js - Merge per-run new-terms.md into the cumulative terminology.md
 *
 * Usage: node merge-glossary.js --run <N> --new-terms <path> [--glossary <path>] [--template <path>]
 *
 * Reads new-terms.md (produced by the term-extractor agent) and the existing
 * terminology.md, merges entries, and writes the updated glossary atomically.
 *
 * Merge rules:
 *   - New term (not in glossary): append to the correct alphabetical section
 *   - Existing term (case-insensitive match): add new files to its Files list,
 *     update "Last updated" to the current run
 *   - Terms are keyed by their canonical name (the ## header in new-terms.md)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_GLOSSARY_PATH = './deepfield/drafts/cross-cutting/terminology.md';
const DEFAULT_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'terminology.md');

// ─── Argument Parsing ────────────────────────────────────────────────────────

/**
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {{ run: number, newTerms: string, glossary: string, template: string }}
 */
function parseArgs(argv) {
  const opts = {
    run: null,
    newTerms: null,
    glossary: DEFAULT_GLOSSARY_PATH,
    template: DEFAULT_TEMPLATE_PATH,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--run':
        opts.run = parseInt(argv[++i], 10);
        break;
      case '--new-terms':
        opts.newTerms = argv[++i];
        break;
      case '--glossary':
        opts.glossary = argv[++i];
        break;
      case '--template':
        opts.template = argv[++i];
        break;
      default:
        // ignore unknown flags
    }
  }

  return opts;
}

function validateOpts(opts) {
  if (opts.run === null || isNaN(opts.run)) {
    throw new Error('--run <N> is required and must be a number');
  }
  if (!opts.newTerms) {
    throw new Error('--new-terms <path> is required');
  }
}

// ─── Parsing new-terms.md ────────────────────────────────────────────────────

/**
 * Parse a new-terms.md file into an array of term objects.
 *
 * Expected format per entry:
 *   ## TERM_NAME
 *   - **Expansion:** ...
 *   - **Definition:** ...
 *   - **Domain:** ...
 *   - **Files:**
 *     - `path/to/file.js`
 *   - **Related:** ...
 *   - **First seen:** Run N
 *
 * @param {string} content - raw file content
 * @param {number} runNumber - current run number (used as default for firstSeen)
 * @returns {Term[]}
 *
 * @typedef {{ name: string, expansion: string|null, definition: string, domain: string, files: string[], related: string[], firstSeen: string, lastUpdated: string }} Term
 */
function parseNewTerms(content, runNumber) {
  const terms = [];
  // Split on lines that start with "## " (term header)
  const sections = content.split(/^## /m).slice(1); // first element before any ## is preamble

  for (const section of sections) {
    const lines = section.split('\n');
    const nameLine = lines[0].trim();
    if (!nameLine || nameLine.startsWith('#')) continue;

    const term = {
      name: nameLine,
      expansion: null,
      definition: '',
      domain: 'general',
      files: [],
      related: [],
      firstSeen: `Run ${runNumber}`,
      lastUpdated: `Run ${runNumber}`,
    };

    let inFiles = false;
    let inDefinition = false;
    const definitionLines = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Detect "- **Files:**" block
      if (/^\s*-\s*\*\*Files:\*\*/.test(line)) {
        inFiles = true;
        inDefinition = false;
        continue;
      }

      if (inFiles) {
        // Indented file entries under Files:
        const fileMatch = line.match(/^\s+- `?([^`\s]+)`?/);
        if (fileMatch) {
          term.files.push(fileMatch[1]);
          continue;
        } else if (/^\s*-\s*\*\*/.test(line)) {
          // Next field starts — exit files block
          inFiles = false;
        } else {
          continue; // blank line or other continuation inside files block
        }
      }

      // Detect start of Definition field (may span multiple lines for bilingual entries)
      const definitionMatch = line.match(/^\s*-\s*\*\*Definition:\*\*\s*(.+)/);
      if (definitionMatch) {
        inDefinition = true;
        definitionLines.length = 0;
        definitionLines.push(definitionMatch[1]);
        continue;
      }

      if (inDefinition) {
        // Continuation lines of a bilingual definition (indented or wrapped with _(...) _)
        if (/^\s*-\s*\*\*/.test(line)) {
          // New field starts — finalize definition
          term.definition = definitionLines.join('\n  ');
          inDefinition = false;
          // Fall through to process this line as a new field
        } else if (line.trim() === '' && definitionLines.length > 0) {
          // Blank line ends definition continuation
          term.definition = definitionLines.join('\n  ');
          inDefinition = false;
          continue;
        } else {
          // Continuation of definition (e.g., second-language line)
          definitionLines.push(line.trimEnd());
          continue;
        }
      }

      const expansionMatch = line.match(/^\s*-\s*\*\*Expansion:\*\*\s*(.+)/);
      const domainMatch = line.match(/^\s*-\s*\*\*Domain:\*\*\s*(.+)/);
      const relatedMatch = line.match(/^\s*-\s*\*\*Related:\*\*\s*(.+)/);
      const firstSeenMatch = line.match(/^\s*-\s*\*\*First seen:\*\*\s*(.+)/);

      if (expansionMatch) term.expansion = expansionMatch[1].trim();
      if (domainMatch) term.domain = domainMatch[1].trim();
      if (relatedMatch) {
        term.related = relatedMatch[1]
          .split(',')
          .map(r => r.trim())
          .filter(Boolean);
      }
      if (firstSeenMatch) term.firstSeen = firstSeenMatch[1].trim();
    }

    // Finalize definition if still in definition block at end of section
    if (inDefinition && definitionLines.length > 0) {
      term.definition = definitionLines.join('\n  ');
    }

    // Only include terms with a definition
    if (term.name && term.definition) {
      terms.push(term);
    }
  }

  return terms;
}

// ─── Parsing existing terminology.md ─────────────────────────────────────────

/**
 * Parse the existing terminology.md to extract a map of existing term names
 * (lowercase) → their line ranges, for update detection.
 *
 * We use a simple approach: extract all ### headers within letter sections.
 *
 * @param {string} content
 * @returns {Map<string, { originalName: string, files: string[] }>}
 */
function parseExistingGlossary(content) {
  const existing = new Map();

  // Match entries: ### TERM [EXPANSION]
  const entryRegex = /^### (.+?)(?:\n|$)/gm;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const header = match[1].trim();
    // Strip expansion in brackets: "SKU [Stock Keeping Unit]" → "SKU"
    const name = header.replace(/\s*\[.*?\]$/, '').trim();

    // Extract files listed under this entry
    const entryStart = match.index;
    const nextEntry = content.indexOf('\n### ', entryStart + 1);
    const entryBlock = nextEntry === -1
      ? content.slice(entryStart)
      : content.slice(entryStart, nextEntry);

    const files = [];
    const fileRegex = /\*\*Files:\*\*.*?\n((?:\s*- `[^`]+`\n?)+)/s;
    const fileMatch = entryBlock.match(fileRegex);
    if (fileMatch) {
      const fileLines = fileMatch[1].matchAll(/`([^`]+)`/g);
      for (const fl of fileLines) {
        files.push(fl[1]);
      }
    }

    existing.set(name.toLowerCase(), { originalName: name, files });
  }

  return existing;
}

// ─── Rendering ───────────────────────────────────────────────────────────────

/**
 * Render a single term entry as Markdown.
 * @param {Term} term
 * @returns {string}
 */
function renderTermEntry(term) {
  const header = term.expansion
    ? `### ${term.name} [${term.expansion}]`
    : `### ${term.name}`;

  const lines = [header, ''];
  // Preserve multi-line definitions (bilingual entries have continuation lines indented with "  ")
  lines.push(`**Definition:** ${term.definition}`);
  lines.push(`**Domain:** ${term.domain}`);

  if (term.files.length > 0) {
    lines.push('**Files:**');
    for (const f of term.files) {
      lines.push(`- \`${f}\``);
    }
  }

  if (term.related.length > 0) {
    lines.push(`**Related:** ${term.related.join(', ')}`);
  }

  lines.push(`**First seen:** ${term.firstSeen}`);
  lines.push(`**Last updated:** ${term.lastUpdated}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Update a term's entry in the glossary content string:
 * - Adds new files to its Files list
 * - Updates "Last updated" field
 *
 * @param {string} content - current glossary content
 * @param {string} termName - canonical name (case-insensitive matched)
 * @param {string[]} newFiles - new file paths to add
 * @param {string} runLabel - e.g., "Run 3"
 * @returns {string} updated content
 */
function updateExistingTerm(content, termName, newFiles, runLabel) {
  // Find the entry block for this term
  const headerRegex = new RegExp(
    `(^### ${escapeRegex(termName)}(?:\\s*\\[.*?\\])?)`,
    'mi'
  );
  const headerMatch = headerRegex.exec(content);
  if (!headerMatch) return content; // not found — shouldn't happen

  const entryStart = headerMatch.index;
  const nextEntryIdx = content.indexOf('\n### ', entryStart + 1);
  const beforeEntry = content.slice(0, entryStart);
  const entryBlock = nextEntryIdx === -1
    ? content.slice(entryStart)
    : content.slice(entryStart, nextEntryIdx);
  const afterEntry = nextEntryIdx === -1 ? '' : content.slice(nextEntryIdx);

  let updated = entryBlock;

  // Add new files that aren't already listed
  for (const f of newFiles) {
    const escaped = escapeRegex(f);
    if (!new RegExp(`\`${escaped}\``).test(updated)) {
      // Append after the last existing file entry or after **Files:**
      if (/\*\*Files:\*\*/.test(updated)) {
        // Find the last file line and insert after it
        updated = updated.replace(
          /(\*\*Files:\*\*\n(?:- `[^`]+`\n)*)/,
          `$1- \`${f}\`\n`
        );
      } else {
        // No files section — add one before the first line that starts "**Related" or "**First"
        updated = updated.replace(
          /(\*\*(?:Related|First seen):\*\*)/,
          `**Files:**\n- \`${f}\`\n$1`
        );
      }
    }
  }

  // Update "Last updated" field
  if (/\*\*Last updated:\*\*/.test(updated)) {
    updated = updated.replace(/\*\*Last updated:\*\*.*/, `**Last updated:** ${runLabel}`);
  } else {
    // Append it before the next entry gap
    updated = updated.trimEnd() + `\n**Last updated:** ${runLabel}\n`;
  }

  return beforeEntry + updated + afterEntry;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the section letter key for a term name.
 * @param {string} name
 * @returns {string} single uppercase letter or '#' for non-alpha
 */
function sectionLetter(name) {
  const first = name.trim()[0];
  if (!first) return '#';
  const upper = first.toUpperCase();
  return /[A-Z]/.test(upper) ? upper : '#';
}

/**
 * Insert a new term entry into the correct alphabetical section of the glossary.
 *
 * @param {string} content - current glossary content
 * @param {Term} term
 * @returns {string} updated content
 */
function insertNewTerm(content, term) {
  const letter = sectionLetter(term.name);
  const sectionHeader = `## ${letter}`;
  const sectionIdx = content.indexOf(`\n${sectionHeader}\n`);

  const rendered = renderTermEntry(term);

  if (sectionIdx === -1) {
    // Section doesn't exist — append before the Statistics section or at end
    const statsIdx = content.indexOf('\n## Statistics\n');
    if (statsIdx !== -1) {
      return (
        content.slice(0, statsIdx) +
        `\n${sectionHeader}\n\n${rendered}` +
        content.slice(statsIdx)
      );
    }
    return content + `\n${sectionHeader}\n\n${rendered}`;
  }

  // Find the end of this section (next ## heading or end of string)
  const afterSection = sectionIdx + sectionHeader.length + 2; // past "\n## X\n"
  const nextSectionIdx = content.indexOf('\n## ', afterSection);

  const before = nextSectionIdx === -1
    ? content.slice(0, content.length)
    : content.slice(0, nextSectionIdx);
  const after = nextSectionIdx === -1 ? '' : content.slice(nextSectionIdx);

  // Insert at end of this section (trim trailing whitespace from before)
  return before.trimEnd() + '\n\n' + rendered.trimEnd() + '\n' + after;
}

// ─── Statistics Update ────────────────────────────────────────────────────────

/**
 * Update the statistics block in the glossary.
 * Counts all ### entries and updates the header metadata.
 *
 * @param {string} content
 * @param {number} runNumber
 * @returns {string}
 */
function updateStatistics(content, runNumber) {
  // Count total terms
  const termCount = (content.match(/^### /gm) || []).length;

  // Count domains
  const domainMatches = content.matchAll(/^\*\*Domain:\*\* (.+)$/gm);
  const domains = new Set();
  for (const m of domainMatches) {
    domains.add(m[1].trim());
  }

  // Count acronyms (entries with expansion in brackets)
  const acronymCount = (content.match(/^### .+\[.+\]/gm) || []).length;
  const businessTermCount = termCount - acronymCount;

  // Update header
  let updated = content.replace(
    /\*\*Last updated:\*\* Run \d+/,
    `**Last updated:** Run ${runNumber}`
  );
  updated = updated.replace(
    /\*\*Total terms:\*\* \d+/,
    `**Total terms:** ${termCount}`
  );
  updated = updated.replace(
    /\*\*Coverage:\*\* \d+ domains/,
    `**Coverage:** ${domains.size} domains`
  );

  // Update statistics section counts
  updated = updated.replace(
    /- Acronyms: \d+/,
    `- Acronyms: ${acronymCount}`
  );
  updated = updated.replace(
    /- Business terms: \d+/,
    `- Business terms: ${businessTermCount}`
  );

  return updated;
}

// ─── Main Merge Logic ─────────────────────────────────────────────────────────

/**
 * Perform the merge operation.
 *
 * @param {{ run: number, newTerms: string, glossary: string, template: string }} opts
 * @returns {{ added: number, updated: number, glossaryPath: string }}
 */
function mergeGlossary(opts) {
  validateOpts(opts);

  const { run } = opts;
  const newTermsPath = path.resolve(opts.newTerms);
  const glossaryPath = path.resolve(opts.glossary);
  const templatePath = path.resolve(opts.template);

  // Read new-terms.md
  if (!fs.existsSync(newTermsPath)) {
    throw new Error(`new-terms file not found: ${newTermsPath}`);
  }
  const newTermsContent = fs.readFileSync(newTermsPath, 'utf-8');
  const newTerms = parseNewTerms(newTermsContent, run);

  // Read or initialize glossary
  let glossaryContent;
  if (fs.existsSync(glossaryPath)) {
    glossaryContent = fs.readFileSync(glossaryPath, 'utf-8');
  } else {
    // Bootstrap from template
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Glossary not found and template not found: ${templatePath}`);
    }
    glossaryContent = fs.readFileSync(templatePath, 'utf-8');
    // Ensure output directory exists
    const dir = path.dirname(glossaryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Parse existing terms
  const existingTerms = parseExistingGlossary(glossaryContent);

  let added = 0;
  let updated = 0;
  const runLabel = `Run ${run}`;

  for (const term of newTerms) {
    const key = term.name.toLowerCase();

    if (existingTerms.has(key)) {
      // Update existing term
      const existing = existingTerms.get(key);
      const newFiles = term.files.filter(f => !existing.files.includes(f));
      if (newFiles.length > 0 || true) {
        // Always update lastUpdated even with no new files
        glossaryContent = updateExistingTerm(
          glossaryContent,
          existing.originalName,
          newFiles,
          runLabel
        );
        updated++;
      }
    } else {
      // Insert new term
      term.lastUpdated = runLabel;
      glossaryContent = insertNewTerm(glossaryContent, term);
      existingTerms.set(key, { originalName: term.name, files: term.files });
      added++;
    }
  }

  // Update statistics and header
  glossaryContent = updateStatistics(glossaryContent, run);

  // Write atomically
  const tmpPath = glossaryPath + '.tmp';
  fs.writeFileSync(tmpPath, glossaryContent, 'utf-8');
  fs.renameSync(tmpPath, glossaryPath);

  return { added, updated, glossaryPath };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

if (require.main === module) {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes('--help')) {
    console.log(
      'Usage: merge-glossary.js --run <N> --new-terms <path> [--glossary <path>] [--template <path>]'
    );
    process.exit(0);
  }

  try {
    const opts = parseArgs(argv);
    const result = mergeGlossary(opts);
    console.log(`Glossary updated: ${result.glossaryPath}`);
    console.log(`  Added:   ${result.added} new terms`);
    console.log(`  Updated: ${result.updated} existing terms`);
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  mergeGlossary,
  parseArgs,
  validateOpts,
  parseNewTerms,
  parseExistingGlossary,
  renderTermEntry,
  insertNewTerm,
  updateExistingTerm,
  updateStatistics,
};
