'use strict';

/**
 * scan-source-docs.js
 *
 * Discovers user-provided source files under deepfield/source/ (excluding
 * baseline/repos/ and run-*-staging directories), extracts text from
 * supported document formats, and writes the content as markdown files
 * to <run-dir>/source-docs/.
 *
 * Usage:
 *   node scan-source-docs.js \
 *     --source-dir <path-to-deepfield/source> \
 *     --run-dir    <path-to-deepfield/wip/run-N> \
 *     --output-index <path-to-output-index.json>
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--source-dir') args.sourceDir = argv[++i];
    else if (argv[i] === '--run-dir') args.runDir = argv[++i];
    else if (argv[i] === '--output-index') args.outputIndex = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

const EXCLUDED_DIR_PATTERNS = [
  /^baseline[/\\]repos([/\\]|$)/,  // baseline/repos/...
  /^run-\d+-staging([/\\]|$)/,     // run-N-staging/...
];

function shouldExclude(relPath) {
  return EXCLUDED_DIR_PATTERNS.some(re => re.test(relPath));
}

function discoverFiles(sourceDir) {
  const results = [];

  function walk(dir, relBase) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      return; // unreadable directory — skip silently
    }
    for (const entry of entries) {
      const relPath = relBase ? path.join(relBase, entry.name) : entry.name;
      if (shouldExclude(relPath)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        results.push({ fullPath, relPath });
      }
    }
  }

  walk(sourceDir, '');
  return results;
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

const MAX_CHARS = 50000;

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.rst']);
const PDF_EXTENSION = '.pdf';
const DOCX_EXTENSION = '.docx';
const PPTX_EXTENSION = '.pptx';

const SUPPORTED_EXTENSIONS = new Set([
  ...TEXT_EXTENSIONS,
  PDF_EXTENSION,
  DOCX_EXTENSION,
  PPTX_EXTENSION,
]);

function truncate(text, filePath) {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  return {
    text: text.slice(0, MAX_CHARS),
    truncated: true,
  };
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // --- Plain text ---
  if (TEXT_EXTENSIONS.has(ext)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return { type: 'text', text: raw };
  }

  // --- PDF ---
  if (ext === PDF_EXTENSION) {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return { type: 'pdf', text: data.text, pages: data.numpages };
  }

  // --- DOCX ---
  if (ext === DOCX_EXTENSION) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return { type: 'docx', text: result.value };
  }

  // --- PPTX ---
  if (ext === PPTX_EXTENSION) {
    const pptxParser = require('pptx-parser');
    // pptx-parser may expose different APIs depending on version;
    // try the most common patterns defensively.
    let slides = [];
    if (typeof pptxParser.parseFile === 'function') {
      const parsed = await pptxParser.parseFile(filePath);
      slides = parsed.slides || [];
    } else if (typeof pptxParser === 'function') {
      const parsed = await pptxParser(filePath);
      slides = parsed.slides || [];
    } else {
      throw new Error('pptx-parser: no recognised API (parseFile or default function)');
    }

    // Build slide text — handle both {text} and {content} shapes
    const parts = slides.map((slide, i) => {
      const slideText =
        (slide.text || '') ||
        (Array.isArray(slide.content)
          ? slide.content.map(c => c.text || c.value || '').join('\n')
          : '');
      return `### Slide ${i + 1}\n\n${slideText}`;
    });
    return { type: 'pptx', text: parts.join('\n\n'), slides: slides.length };
  }

  // Should not reach here for supported extensions
  throw new Error(`Unsupported extension: ${ext}`);
}

// ---------------------------------------------------------------------------
// Markdown output builders
// ---------------------------------------------------------------------------

function buildMarkdown(filePath, extraction, truncated) {
  const lines = [];
  lines.push(`# Extracted Source Document`);
  lines.push('');
  lines.push(`**Original file:** \`${filePath}\``);

  if (extraction.pages != null) {
    lines.push(`**Pages:** ${extraction.pages}`);
  }
  if (extraction.slides != null) {
    lines.push(`**Slides:** ${extraction.slides}`);
  }
  if (truncated) {
    lines.push(`**Note:** Content truncated to ${MAX_CHARS.toLocaleString()} characters.`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(extraction.text);

  return lines.join('\n');
}

function buildWarningStub(filePath, reason, suggestion) {
  const lines = [];
  lines.push(`# Source Document — Extraction Warning`);
  lines.push('');
  lines.push(`**Original file:** \`${filePath}\``);
  lines.push(`**Status:** Could not extract content`);
  lines.push(`**Reason:** ${reason}`);
  if (suggestion) {
    lines.push(`**Suggestion:** ${suggestion}`);
  }
  return lines.join('\n');
}

function suggestionForExtension(ext) {
  switch (ext) {
    case '.ppt':
      return 'Open in PowerPoint or LibreOffice and save as .pptx or export as PDF.';
    case '.xls':
    case '.xlsx':
      return 'Open in Excel or LibreOffice and export as .csv or .md.';
    case '.odt':
      return 'Open in LibreOffice and save as .docx or export as PDF.';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.bmp':
      return 'This is an image file. Export text content as .md or .txt, or use an OCR tool to extract text.';
    default:
      return 'Convert to a supported format: .md, .txt, .pdf, .docx, or .pptx.';
  }
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

async function processFiles(sourceDir, runDir) {
  const outputDir = path.join(runDir, 'source-docs');
  fs.mkdirSync(outputDir, { recursive: true });

  const files = discoverFiles(sourceDir);
  const successPaths = [];
  const report = [];

  for (const { fullPath, relPath } of files) {
    const ext = path.extname(fullPath).toLowerCase();
    const baseName = path.basename(fullPath, ext);
    // Sanitise for use as a filename
    const safeName = relPath.replace(/[/\\]/g, '--').replace(/[^a-zA-Z0-9._-]/g, '_');
    const outFile = path.join(outputDir, `${safeName}.md`);

    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      // Write warning stub
      const suggestion = suggestionForExtension(ext);
      const stub = buildWarningStub(fullPath, `Unsupported file format (${ext})`, suggestion);
      fs.writeFileSync(outFile, stub, 'utf8');
      report.push({ file: relPath, status: 'skipped', reason: `Unsupported format ${ext}` });
      continue;
    }

    try {
      const extraction = await extractText(fullPath);
      const { text: finalText, truncated } = truncate(extraction.text, fullPath);
      const md = buildMarkdown(fullPath, { ...extraction, text: finalText }, truncated);
      fs.writeFileSync(outFile, md, 'utf8');
      successPaths.push(outFile);
      report.push({
        file: relPath,
        status: 'extracted',
        truncated,
        extra: extraction.pages != null
          ? `${extraction.pages} pages`
          : extraction.slides != null
          ? `${extraction.slides} slides`
          : undefined,
      });
    } catch (err) {
      const stub = buildWarningStub(fullPath, err.message, null);
      fs.writeFileSync(outFile, stub, 'utf8');
      report.push({ file: relPath, status: 'warning', reason: err.message });
    }
  }

  return { successPaths, report };
}

function printSummary(report) {
  const extracted = report.filter(r => r.status === 'extracted');
  const warned    = report.filter(r => r.status === 'warning');
  const skipped   = report.filter(r => r.status === 'skipped');

  console.log('\nScanning source documents...\n');

  if (report.length === 0) {
    console.log('  (no user-provided source files found)');
  } else {
    for (const entry of report) {
      const icon = entry.status === 'extracted' ? '✓' : entry.status === 'warning' ? '⚠' : '–';
      let line = `  ${icon} ${entry.file}`;
      if (entry.status === 'extracted') {
        if (entry.extra) line += ` (${entry.extra})`;
        if (entry.truncated) line += ' [truncated]';
      } else {
        line += ` — ${entry.reason}`;
      }
      console.log(line);
    }
  }

  console.log('');
  console.log(`Source docs: ${extracted.length} extracted, ${warned.length} warnings, ${skipped.length} skipped`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  if (!args.sourceDir || !args.runDir) {
    console.error('Usage: scan-source-docs.js --source-dir <path> --run-dir <path> [--output-index <path>]');
    process.exit(1);
  }

  if (!fs.existsSync(args.sourceDir)) {
    // No source directory at all — nothing to do
    console.log('\nNo deepfield/source/ directory found — skipping source doc scan.\n');
    if (args.outputIndex) {
      fs.writeFileSync(args.outputIndex, '[]', 'utf8');
    }
    return;
  }

  const { successPaths, report } = await processFiles(args.sourceDir, args.runDir);

  printSummary(report);

  if (args.outputIndex) {
    fs.writeFileSync(args.outputIndex, JSON.stringify(successPaths, null, 2), 'utf8');
  }
}

main().catch(err => {
  console.error('scan-source-docs: fatal error:', err.message);
  process.exit(1);
});
