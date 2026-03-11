#!/usr/bin/env node
/**
 * update-domain-manifest.js — Atomically upsert a domain entry in domain-manifest.json
 *
 * Usage:
 *   update-domain-manifest.js <manifest_path> <domain_json>
 *
 * <domain_json> must match DomainEntry shape (see cli/src/core/schemas.ts):
 *   {
 *     "slug": "auth-and-authorization",
 *     "displayName":  "Auth and Authorization",                          // optional
 *     "domainType":   "product",                                         // optional: product|tech|infra|cross-cutting
 *     "productSpec": "drafts/en/product-spec/auth-and-authorization",   // optional
 *     "techSpec":    "drafts/en/tech-spec/auth-and-authorization",      // optional
 *     "featureSpecs": [],                                                // optional
 *     "languages": ["en"],                                               // optional
 *     "notes": "..."                                                     // optional
 *   }
 *
 * Behaviour:
 *   - If manifest does not exist, creates it with a single domain entry.
 *   - If the slug already exists, deep-merges the new fields.
 *     Array fields (languages, featureSpecs) are merged additively (union), not replaced.
 *   - Atomic write: write to temp file then rename.
 *
 * Exit codes:
 *   0 — success
 *   1 — argument / IO error
 *   2 — JSON parse error
 *   3 — validation error
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Inline validation (mirrors cli/src/core/schemas.ts DomainManifestSchema)
// CJS scripts cannot import TypeScript — keep this in sync with the Zod schema.
// ---------------------------------------------------------------------------
const DOMAIN_ENTRY_REQUIRED = ['slug'];
const MANIFEST_REQUIRED = ['domains'];
const DOMAIN_TYPE_VALUES = ['product', 'tech', 'infra', 'cross-cutting'];

function validateDomainEntry(entry) {
  for (const field of DOMAIN_ENTRY_REQUIRED) {
    if (entry[field] === undefined || entry[field] === null) {
      throw new Error(`DomainEntry missing required field: "${field}"`);
    }
  }
  if (typeof entry.slug !== 'string' || entry.slug.trim() === '') {
    throw new Error('DomainEntry.slug must be a non-empty string');
  }
  if (entry.displayName !== undefined && typeof entry.displayName !== 'string') {
    throw new Error('DomainEntry.displayName must be a string');
  }
  if (entry.domainType !== undefined && !DOMAIN_TYPE_VALUES.includes(entry.domainType)) {
    throw new Error(`DomainEntry.domainType must be one of: ${DOMAIN_TYPE_VALUES.join(', ')}`);
  }
  if (entry.featureSpecs !== undefined && !Array.isArray(entry.featureSpecs)) {
    throw new Error('DomainEntry.featureSpecs must be an array');
  }
  if (entry.languages !== undefined && !Array.isArray(entry.languages)) {
    throw new Error('DomainEntry.languages must be an array');
  }
}

// ---------------------------------------------------------------------------
// Array helpers
// ---------------------------------------------------------------------------
/**
 * Return a new array containing all unique elements from both arrays.
 * Preserves insertion order (existing elements first, then new additions).
 */
function unionArray(existing, incoming) {
  if (!Array.isArray(existing)) return Array.isArray(incoming) ? [...incoming] : [];
  if (!Array.isArray(incoming)) return [...existing];
  const result = [...existing];
  for (const item of incoming) {
    if (!result.includes(item)) result.push(item);
  }
  return result;
}

function validateManifest(manifest) {
  for (const field of MANIFEST_REQUIRED) {
    if (manifest[field] === undefined) {
      throw new Error(`DomainManifest missing required field: "${field}"`);
    }
  }
  if (!Array.isArray(manifest.domains)) {
    throw new Error('DomainManifest.domains must be an array');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
if (process.argv.length < 4) {
  console.error('Error: Missing required arguments');
  console.error('Usage: update-domain-manifest.js <manifest_path> <domain_json>');
  process.exit(1);
}

const manifestPath = process.argv[2];
const domainJson = process.argv[3];

let domainEntry;
try {
  domainEntry = JSON.parse(domainJson);
} catch (err) {
  console.error(`Error: Invalid JSON for domain entry — ${err.message}`);
  process.exit(2);
}

try {
  validateDomainEntry(domainEntry);
} catch (err) {
  console.error(`Validation error: ${err.message}`);
  process.exit(3);
}

// Read or initialise manifest
let manifest = { version: '1.0', domains: [] };
if (fs.existsSync(manifestPath)) {
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading manifest at ${manifestPath}: ${err.message}`);
    process.exit(2);
  }
  try {
    validateManifest(manifest);
  } catch (err) {
    console.error(`Validation error in existing manifest: ${err.message}`);
    process.exit(3);
  }
} else {
  // Ensure parent directory exists
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Upsert domain entry by slug
const existingIndex = manifest.domains.findIndex(d => d.slug === domainEntry.slug);
if (existingIndex >= 0) {
  const existing = manifest.domains[existingIndex];
  // Merge scalar fields: new values overwrite existing, absent fields are preserved.
  // Array fields (languages, featureSpecs) are merged additively (union) so that
  // passing {"slug":"x","languages":["ko"]} does NOT discard existing ["en","zh-tw"].
  manifest.domains[existingIndex] = Object.assign({}, existing, domainEntry, {
    languages:    unionArray(existing.languages,    domainEntry.languages),
    featureSpecs: unionArray(existing.featureSpecs, domainEntry.featureSpecs),
  });
} else {
  // Apply defaults for optional arrays
  manifest.domains.push({
    featureSpecs: [],
    languages: ['en'],
    ...domainEntry,
  });
}

manifest.lastModified = new Date().toISOString();

// Atomic write
const tempPath = `${manifestPath}.tmp`;
try {
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, manifestPath);
} catch (err) {
  console.error(`Error writing manifest: ${err.message}`);
  // Clean up temp if it exists
  if (fs.existsSync(tempPath)) {
    try { fs.unlinkSync(tempPath); } catch (_) {}
  }
  process.exit(1);
}

console.log(`Updated ${manifestPath}: domain "${domainEntry.slug}" upserted (${manifest.domains.length} total domains)`);
process.exit(0);
