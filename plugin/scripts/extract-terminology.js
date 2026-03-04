#!/usr/bin/env node
/**
 * extract-terminology.js - Orchestrate terminology extraction for a single run
 *
 * Usage: node extract-terminology.js --run <N> --files-json <path> [--output <path>] [--glossary <path>]
 *
 * Reads the file list JSON, constructs agent input context, and writes a
 * new-terms.md file to the run's wip directory.
 *
 * The actual AI-driven term extraction is performed by the deepfield-term-extractor
 * agent (launched by the iterate/bootstrap skill). This script:
 *   1. Validates inputs
 *   2. Reads the file list
 *   3. Checks for an existing glossary
 *   4. Writes the agent input manifest (agent-input.json) to wip/run-N/
 *   5. Writes an empty new-terms.md placeholder (the agent will overwrite it)
 *
 * The calling skill is responsible for:
 *   - Launching the deepfield-term-extractor agent with the input manifest
 *   - Calling merge-glossary.js after the agent completes
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_GLOSSARY_PATH = './deepfield/drafts/cross-cutting/terminology.md';
const DEFAULT_WIP_DIR = './deepfield/wip';

/**
 * Parse CLI arguments into an options object.
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {{ run: number, filesJson: string, output: string|null, glossary: string }}
 */
function parseArgs(argv) {
  const opts = {
    run: null,
    filesJson: null,
    output: null,
    glossary: DEFAULT_GLOSSARY_PATH,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--run':
        opts.run = parseInt(argv[++i], 10);
        break;
      case '--files-json':
        opts.filesJson = argv[++i];
        break;
      case '--output':
        opts.output = argv[++i];
        break;
      case '--glossary':
        opts.glossary = argv[++i];
        break;
      default:
        // ignore unknown flags
    }
  }

  return opts;
}

/**
 * Validate that required options are present.
 * @param {{ run: number|null, filesJson: string|null }} opts
 * @throws {Error} if any required option is missing or invalid
 */
function validateOpts(opts) {
  if (opts.run === null || isNaN(opts.run)) {
    throw new Error('--run <N> is required and must be a number');
  }
  if (!opts.filesJson) {
    throw new Error('--files-json <path> is required');
  }
}

/**
 * Read the file list JSON. Supports two formats:
 *   - Array of strings: ["path/to/file.js", ...]
 *   - Object with a "files" key: { "files": ["path/to/file.js", ...] }
 *
 * @param {string} filesJsonPath
 * @returns {string[]} array of file paths
 */
function readFileList(filesJsonPath) {
  const raw = fs.readFileSync(path.resolve(filesJsonPath), 'utf-8');
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.files)) {
    return parsed.files;
  }

  throw new Error(
    `files-json must be an array of paths or an object with a "files" array. Got: ${typeof parsed}`
  );
}

/**
 * Check whether the glossary file exists.
 * @param {string} glossaryPath
 * @returns {boolean}
 */
function glossaryExists(glossaryPath) {
  return fs.existsSync(path.resolve(glossaryPath));
}

/**
 * Write the agent input manifest atomically.
 * @param {string} manifestPath
 * @param {object} manifest
 */
function writeManifest(manifestPath, manifest) {
  const resolved = path.resolve(manifestPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = resolved + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.renameSync(tmp, resolved);
}

/**
 * Write an empty placeholder new-terms.md so the agent has a target path to overwrite.
 * If the file already exists (e.g., from a retry), it is left as-is so partial
 * agent results are not discarded.
 * @param {string} newTermsPath
 * @param {number} runNumber
 */
function writePlaceholder(newTermsPath, runNumber) {
  const resolved = path.resolve(newTermsPath);
  if (fs.existsSync(resolved)) {
    // Already exists — agent may have partially written; don't overwrite.
    return;
  }
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = [
    `# New Terms — Run ${runNumber}`,
    '',
    '> Terms discovered during this run. Merged into `drafts/cross-cutting/terminology.md` automatically.',
    '',
    `**Run:** ${runNumber}`,
    '**Discovered:** 0 terms',
    '',
    'Extraction in progress...',
    '',
  ].join('\n');

  const tmp = resolved + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, resolved);
}

/**
 * Main entry point.
 * @param {string[]} argv
 * @returns {{ manifestPath: string, newTermsPath: string, fileCount: number }}
 */
function extractTerminology(argv) {
  const opts = parseArgs(argv);
  validateOpts(opts);

  const { run, filesJson, glossary } = opts;
  const wipDir = path.resolve(DEFAULT_WIP_DIR, `run-${run}`);

  // Determine output path for new-terms.md
  const newTermsPath = opts.output
    ? path.resolve(opts.output)
    : path.join(wipDir, 'new-terms.md');

  // Read file list
  const files = readFileList(filesJson);

  // Check for existing glossary
  const hasGlossary = glossaryExists(glossary);
  const glossaryAbsPath = hasGlossary ? path.resolve(glossary) : null;

  // Build agent input manifest
  const manifest = {
    runNumber: run,
    filesToScan: files,
    previousGlossaryPath: glossaryAbsPath,
    outputPath: newTermsPath,
    agentName: 'deepfield-term-extractor',
    instructions: [
      `Extract domain-specific terms from ${files.length} file(s) analyzed during Run ${run}.`,
      hasGlossary
        ? `Existing glossary is at: ${glossaryAbsPath} — skip terms already defined there.`
        : 'No existing glossary yet — extract all domain terms found.',
      `Write results to: ${newTermsPath}`,
    ].join('\n'),
  };

  // Write agent input manifest
  const manifestPath = path.join(wipDir, 'term-extraction-input.json');
  writeManifest(manifestPath, manifest);

  // Write placeholder (agent will overwrite)
  writePlaceholder(newTermsPath, run);

  return { manifestPath, newTermsPath, fileCount: files.length };
}

// CLI entry point
if (require.main === module) {
  try {
    const argv = process.argv.slice(2);
    if (argv.length === 0 || argv.includes('--help')) {
      console.log(
        'Usage: extract-terminology.js --run <N> --files-json <path> [--output <path>] [--glossary <path>]'
      );
      process.exit(0);
    }

    const result = extractTerminology(argv);
    console.log(`Agent input manifest: ${result.manifestPath}`);
    console.log(`New-terms placeholder: ${result.newTermsPath}`);
    console.log(`Files to scan: ${result.fileCount}`);
    console.log('Ready for deepfield-term-extractor agent.');
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { extractTerminology, parseArgs, validateOpts, readFileList, glossaryExists };
