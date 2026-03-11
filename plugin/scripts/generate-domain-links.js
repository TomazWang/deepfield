#!/usr/bin/env node
/**
 * generate-domain-links.js — Generate cross-cutting/domain-links.md from domain-manifest.json
 *
 * Usage:
 *   generate-domain-links.js --manifest <path> --output <path> [--workspace-root <path>]
 *
 * Arguments:
 *   --manifest <path>         Path to deepfield/wip/domain-manifest.json (required)
 *   --output   <path>         Path to write domain-links.md (required)
 *   --workspace-root <path>   Absolute path to workspace root (deepfield/).
 *                             Used to produce relative links. Defaults to dirname of --output.
 *
 * Output:
 *   domain-links.md written atomically to --output.
 *   Existing file is overwritten (the script is re-run each time the manifest changes).
 *
 * Exit codes:
 *   0 — success
 *   1 — argument / IO error
 *   2 — JSON parse error
 *   3 — validation error
 *
 * Inline validation mirrors cli/src/core/schemas.ts DomainManifestSchema.
 * CJS scripts cannot import TypeScript — keep this in sync with the Zod schema.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Inline validation (mirrors DomainManifestSchema in cli/src/core/schemas.ts)
// ---------------------------------------------------------------------------
function validateManifest(manifest) {
  if (typeof manifest !== 'object' || manifest === null) {
    throw new Error('Manifest must be a JSON object');
  }
  if (!Array.isArray(manifest.domains)) {
    throw new Error('manifest.domains must be an array');
  }
  for (const domain of manifest.domains) {
    if (typeof domain.slug !== 'string' || domain.slug.trim() === '') {
      throw new Error(`Each domain entry must have a non-empty "slug" string (got: ${JSON.stringify(domain.slug)})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--manifest':       opts.manifest      = args[++i]; break;
      case '--output':         opts.output        = args[++i]; break;
      case '--workspace-root': opts.workspaceRoot = args[++i]; break;
      case '--help': case '-h':
        printUsage();
        process.exit(0);
      default:
        console.error(`Unknown argument: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  if (!opts.manifest) { console.error('Error: --manifest is required'); process.exit(1); }
  if (!opts.output)   { console.error('Error: --output is required');   process.exit(1); }

  // Default workspace root = directory containing the output file
  if (!opts.workspaceRoot) {
    opts.workspaceRoot = path.dirname(opts.output);
  }

  return opts;
}

function printUsage() {
  console.log(`
Usage: generate-domain-links.js --manifest <path> --output <path> [--workspace-root <path>]

  --manifest <path>         Path to deepfield/wip/domain-manifest.json
  --output   <path>         Where to write cross-cutting/domain-links.md
  --workspace-root <path>   Workspace root for relative link generation (default: dirname of --output)
  --help                    Show this help
`.trim());
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------
function relLink(workspaceRoot, filePath) {
  if (!filePath) return null;
  // filePath is stored relative to workspace root
  // domain-links.md lives in cross-cutting/ (one level inside workspace)
  // We'll render a relative link from workspace root for clarity (absolute from WS root)
  return filePath.startsWith('/') ? filePath : path.join(workspaceRoot, filePath);
}

function mdOptionalRow(label, value, workspaceRoot) {
  if (!value) return '';
  const absPath = relLink(workspaceRoot, value);
  return `- **${label}**: \`${value}\`\n`;
}

function generateMarkdown(manifest, workspaceRoot) {
  const now = new Date().toISOString();
  const domains = manifest.domains;

  const lines = [
    '# Domain Links',
    '',
    '> Auto-generated from `wip/domain-manifest.json`. Do not edit manually.',
    `> Last updated: ${now}`,
    '',
    '---',
    '',
  ];

  if (domains.length === 0) {
    lines.push('_No domains registered yet. Run `/df-bootstrap` to detect domains._');
    lines.push('');
    return lines.join('\n');
  }

  for (const domain of domains) {
    lines.push(`## ${domain.slug}`);
    lines.push('');

    if (domain.notes) {
      lines.push(`> ${domain.notes}`);
      lines.push('');
    }

    // Tier paths
    const tiers = [];
    if (domain.productSpec) tiers.push(`- **product-spec**: \`${domain.productSpec}\``);
    if (domain.techSpec)    tiers.push(`- **tech-spec**: \`${domain.techSpec}\``);
    if (domain.featureSpecs && domain.featureSpecs.length > 0) {
      for (const fp of domain.featureSpecs) {
        tiers.push(`- **feature-spec**: \`${fp}\``);
      }
    }

    if (tiers.length > 0) {
      lines.push(...tiers);
    } else {
      lines.push('_No tier paths registered yet._');
    }

    // Languages
    const langs = domain.languages && domain.languages.length > 0
      ? domain.languages.join(', ')
      : 'en';
    lines.push(`- **languages**: ${langs}`);

    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`_Total domains: ${domains.length}_`);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const opts = parseArgs();

// Read manifest
if (!fs.existsSync(opts.manifest)) {
  console.error(`Error: Manifest not found at ${opts.manifest}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(opts.manifest, 'utf8'));
} catch (err) {
  console.error(`Error: Failed to parse manifest JSON — ${err.message}`);
  process.exit(2);
}

try {
  validateManifest(manifest);
} catch (err) {
  console.error(`Validation error: ${err.message}`);
  process.exit(3);
}

// Generate markdown
const markdown = generateMarkdown(manifest, opts.workspaceRoot);

// Ensure output directory exists
const outputDir = path.dirname(opts.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Atomic write
const tempPath = `${opts.output}.tmp`;
try {
  fs.writeFileSync(tempPath, markdown, 'utf8');
  fs.renameSync(tempPath, opts.output);
} catch (err) {
  console.error(`Error writing output: ${err.message}`);
  if (fs.existsSync(tempPath)) {
    try { fs.unlinkSync(tempPath); } catch (_) {}
  }
  process.exit(1);
}

console.log(`Generated ${opts.output} (${manifest.domains.length} domains)`);
process.exit(0);
