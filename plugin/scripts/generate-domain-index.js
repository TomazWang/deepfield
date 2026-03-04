#!/usr/bin/env node
/**
 * generate-domain-index.js - Generate deepfield/wip/domain-index.md
 *
 * Usage: node generate-domain-index.js <brief-json-file> <repos-json-file> [output-path]
 *
 * Detects domains from:
 * - Repository top-level folder names matching known patterns
 * - Monorepo module names
 * - Brief focus areas
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OUTPUT_PATH = './deepfield/wip/domain-index.md';

// Folders that are clearly domains vs infrastructure/tooling
const DOMAIN_FOLDER_PATTERNS = [
  'api', 'apis',
  'frontend', 'front-end', 'fe',
  'backend', 'back-end', 'be',
  'web', 'webapp', 'website',
  'mobile', 'app',
  'ios', 'android',
  'services', 'service',
  'core', 'kernel',
  'shared', 'common', 'commons',
  'lib', 'libs', 'library',
  'auth', 'authentication', 'authorization', 'identity',
  'database', 'db', 'data', 'storage', 'persistence',
  'payments', 'billing', 'subscription',
  'orders', 'cart', 'checkout',
  'notifications', 'messaging', 'events', 'queue',
  'admin', 'dashboard',
  'ui', 'design-system', 'components',
  'cli', 'cmd',
  'worker', 'workers', 'jobs',
  'gateway', 'proxy',
  'analytics', 'reporting', 'metrics',
  'search', 'indexing',
  'email', 'sms',
  'cache', 'redis',
  'graphql', 'rest',
];

/**
 * Detect domains from repo structures and brief data.
 * Returns array of domain objects.
 */
function detectDomains(repos, brief) {
  const domains = new Map();

  function addDomain(key, name, source, fileCount) {
    if (!domains.has(key)) {
      domains.set(key, { name, source, fileCount: fileCount || '—', confidence: 20 });
    }
  }

  // From top-level repo directories
  repos.forEach(repo => {
    if (!repo.topLevelDirs) return;
    repo.topLevelDirs.forEach(dir => {
      const lower = dir.toLowerCase();
      if (DOMAIN_FOLDER_PATTERNS.includes(lower)) {
        addDomain(lower, dir, `${repo.name}/ top-level folder`, null);
      }
    });

    // From monorepo modules — each module is a potential domain
    if (repo.modules && repo.modules.length > 0) {
      repo.modules.forEach(mod => {
        const key = mod.name.toLowerCase();
        addDomain(key, mod.name, `${repo.name}/${mod.parent}/${mod.name}`, null);
      });
    }
  });

  // From brief focus areas
  if (brief.focusAreas) {
    brief.focusAreas.forEach(area => {
      const key = area.toLowerCase().replace(/[\s/]+/g, '-');
      addDomain(key, area, 'Brief focus area', null);
    });
  }

  return Array.from(domains.values());
}

/**
 * Generate domain-index.md content.
 */
function generateDomainIndexContent(brief, repos) {
  const now = new Date().toISOString().split('T')[0];
  const domains = detectDomains(repos, brief);

  let content = `# Domain Index\n\n`;
  content += `> This file tracks how the AI decomposes the project into domains. Domains help focus learning and prevent overwhelming context.\n\n`;
  content += `*Generated: Run 0 (Bootstrap) — ${now}*\n\n`;

  content += `## What is a Domain?\n\n`;
  content += `A domain is a cohesive area of the codebase, typically:\n`;
  content += `- 200-1000 files\n`;
  content += `- Clear boundaries (service, module, feature area)\n`;
  content += `- Can be understood in one focused learning session\n\n`;

  content += `## Current Domains\n\n`;
  content += `*Auto-detected from repository structure and brief. Refine before Run 1.*\n\n`;
  content += `| Domain | Confidence | File Count | Status | Notes |\n`;
  content += `|--------|-----------|------------|--------|-------|\n`;

  if (domains.length === 0) {
    content += `| (none detected) | — | — | Unscanned | No repos cloned or no known patterns found |\n`;
  } else {
    domains.forEach(domain => {
      content += `| ${domain.name} | ${domain.confidence}% | ${domain.fileCount} | Detected | ${domain.source} |\n`;
    });
  }
  content += `\n`;

  content += `## Domain Detection Signals\n\n`;
  content += `**How domains are identified (Run 0 — structural only):**\n`;
  content += `- Directory structure (e.g., \`src/auth/\`, \`services/payment/\`)\n`;
  content += `- Monorepo module names (packages/, services/, apps/, libs/)\n`;
  content += `- Brief focus areas provided by user\n\n`;
  content += `**Future runs add:**\n`;
  content += `- Service boundaries (microservices architecture)\n`;
  content += `- API route grouping\n`;
  content += `- Database ownership\n`;
  content += `- CODEOWNERS file entries\n\n`;

  content += `## Domain Relationships\n\n`;
  content += `*Not yet mapped. Will be established during Run 1.*\n\n`;
  content += `\`\`\`\n`;
  content += `[Domain A] <-- depends on --> [Domain B]\n`;
  content += `\`\`\`\n\n`;

  content += `## Split/Merge History\n\n`;
  content += `**Run 0:** Initial structural detection — ${domains.length} domain(s) identified\n\n`;

  content += `---\n\n`;
  content += `*This index is automatically updated by the AI during each learning run.*\n`;

  return content;
}

/**
 * Write domain-index.md atomically.
 */
function generateDomainIndex(brief, repos, outputPath) {
  const outPath = path.resolve(outputPath || DEFAULT_OUTPUT_PATH);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const content = generateDomainIndexContent(brief, repos);

  const tmpPath = outPath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, outPath);

  return outPath;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: generate-domain-index.js <brief-json-file> <repos-json-file> [output-path]');
    process.exit(1);
  }

  try {
    const brief = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
    const repos = JSON.parse(fs.readFileSync(args[1], 'utf-8'));
    const outputPath = args[2] || DEFAULT_OUTPUT_PATH;
    const written = generateDomainIndex(brief, repos, outputPath);
    console.log(`Written: ${written}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generateDomainIndex, generateDomainIndexContent, detectDomains };
