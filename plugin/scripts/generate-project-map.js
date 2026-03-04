#!/usr/bin/env node
/**
 * generate-project-map.js - Generate deepfield/wip/project-map.md from scan data
 *
 * Usage: node generate-project-map.js <brief-json> <repos-json> [output-path]
 *
 * Arguments:
 *   brief-json   Path to JSON file with parsed brief data
 *   repos-json   Path to JSON file with scanned repo structures
 *   output-path  Where to write project-map.md (default: deepfield/wip/project-map.md)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_TEMPLATE_PATH = './plugin/templates/project-map.md';
const DEFAULT_OUTPUT_PATH = './deepfield/wip/project-map.md';

/**
 * Generate project-map.md content from brief and repo scan data.
 */
function generateProjectMapContent(brief, repos) {
  const now = new Date().toISOString().split('T')[0];
  const projectName = brief.projectName || 'Unknown Project';

  let content = `# Project Map\n\n`;
  content += `> This file provides a living overview of the entire project. The AI reads this first and updates it last during each learning run to maintain the big picture.\n\n`;
  content += `*Generated: Run 0 (Bootstrap) — ${now}*\n\n`;

  // System Overview
  content += `## System Overview\n\n`;
  content += `**Project:** ${projectName}\n\n`;
  if (brief.focusAreas && brief.focusAreas.length > 0) {
    content += `**Focus Areas:**\n`;
    brief.focusAreas.forEach(area => { content += `- ${area}\n`; });
    content += `\n`;
  }
  content += `*Initial understanding from structural scan. Deep exploration begins in Run 1.*\n\n`;

  // Architecture
  content += `## Architecture\n\n`;
  if (repos.length === 0) {
    content += `*No repositories cloned yet. Add repository URLs to brief.md and re-run bootstrap.*\n\n`;
  } else if (repos.length === 1) {
    const repo = repos[0];
    const hasMonorepoMarkers = repo.modules && repo.modules.length > 0;
    content += `**Organization:** ${hasMonorepoMarkers ? 'Monorepo' : 'Single repository'}\n`;
    if (repo.language) content += `**Primary Language:** ${repo.language}\n`;
    content += `\n`;
  } else {
    content += `**Organization:** Multi-repository (${repos.length} repos)\n\n`;
  }

  // Domain Decomposition table
  content += `## Domain Decomposition\n\n`;
  content += `*Detected from structural analysis. Refine manually before Run 1.*\n\n`;
  content += `| Domain | Confidence | Description | Key Files |\n`;
  content += `|--------|-----------|-------------|----------|\n`;

  const detectedDomains = detectDomains(repos, brief);
  if (detectedDomains.length === 0) {
    content += `| (none detected) | — | — | — |\n`;
  } else {
    detectedDomains.forEach(domain => {
      content += `| ${domain.name} | 20% | ${domain.source} | — |\n`;
    });
  }
  content += `\n`;

  // Repositories section
  content += `## Repositories\n\n`;
  if (repos.length === 0) {
    content += `*No repositories scanned.*\n\n`;
  } else {
    repos.forEach(repo => {
      if (repo.error) {
        content += `### ${repo.name} (error)\n\n`;
        content += `*Error scanning: ${repo.error}*\n\n`;
        return;
      }

      content += `### ${repo.name}\n\n`;

      if (repo.buildFiles && repo.buildFiles.length > 0) {
        content += `**Build files:** ${repo.buildFiles.join(', ')}\n`;
      }
      if (repo.language) {
        content += `**Language:** ${repo.language}\n`;
      }
      content += `\n`;

      if (repo.topLevelDirs && repo.topLevelDirs.length > 0) {
        content += `**Top-level directories:**\n`;
        repo.topLevelDirs.forEach(dir => { content += `- \`${dir}/\`\n`; });
        content += `\n`;
      }

      if (repo.modules && repo.modules.length > 0) {
        content += `**Modules:**\n`;
        repo.modules.forEach(mod => { content += `- \`${mod.parent}/${mod.name}\`\n`; });
        content += `\n`;
      }

      if (repo.readmes && repo.readmes.length > 0) {
        content += `**README:** ${repo.readmes[0]}\n\n`;
      }
    });
  }

  // Coverage Status
  content += `## Coverage Status\n\n`;
  content += `**Explored:**\n- Repository structure (top-level)\n\n`;
  content += `**Partially understood:**\n- Domain boundaries (from folder names)\n\n`;
  content += `**Unexplored:**\n- Internal code logic\n- Cross-service dependencies\n- Data models\n- API contracts\n\n`;

  // Open Questions
  content += `## Open Questions\n\n`;
  if (brief.topics && brief.topics.length > 0) {
    brief.topics.forEach(topic => { content += `- ${topic}\n`; });
  } else {
    content += `- How are the major components connected?\n`;
    content += `- What are the primary entry points?\n`;
    content += `- What are the key data flows?\n`;
  }
  content += `\n`;

  content += `---\n\n`;
  content += `*This map is automatically updated by the AI during each learning run.*\n`;

  return content;
}

/**
 * Detect domains from repo structure and brief focus areas.
 */
function detectDomains(repos, brief) {
  const domains = new Map();

  // Known domain folder patterns
  const knownDomainFolders = [
    'api', 'frontend', 'backend', 'web', 'mobile', 'ios', 'android',
    'services', 'core', 'shared', 'common', 'lib', 'libs',
    'auth', 'authentication', 'authorization',
    'database', 'db', 'data', 'storage',
    'payments', 'billing', 'orders',
    'notifications', 'messaging', 'events',
    'admin', 'dashboard', 'ui',
    'cli', 'cmd', 'scripts', 'tools',
    'infra', 'infrastructure', 'deploy', 'k8s', 'terraform',
    'docs', 'documentation',
  ];

  // From repo top-level dirs
  repos.forEach(repo => {
    if (!repo.topLevelDirs) return;
    repo.topLevelDirs.forEach(dir => {
      const lower = dir.toLowerCase();
      if (knownDomainFolders.includes(lower)) {
        if (!domains.has(lower)) {
          domains.set(lower, { name: dir, source: `Folder in ${repo.name}` });
        }
      }
    });

    // From module names
    if (repo.modules) {
      repo.modules.forEach(mod => {
        const key = mod.name.toLowerCase();
        if (!domains.has(key)) {
          domains.set(key, { name: mod.name, source: `Module in ${repo.name}/${mod.parent}` });
        }
      });
    }
  });

  // From brief focus areas
  if (brief.focusAreas) {
    brief.focusAreas.forEach(area => {
      const key = area.toLowerCase().replace(/\s+/g, '-');
      if (!domains.has(key)) {
        domains.set(key, { name: area, source: 'Brief focus area' });
      }
    });
  }

  return Array.from(domains.values());
}

/**
 * Write project-map.md atomically.
 */
function generateProjectMap(brief, repos, outputPath) {
  const outPath = path.resolve(outputPath || DEFAULT_OUTPUT_PATH);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const content = generateProjectMapContent(brief, repos);

  // Atomic write
  const tmpPath = outPath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, outPath);

  return outPath;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: generate-project-map.js <brief-json-file> <repos-json-file> [output-path]');
    process.exit(1);
  }

  try {
    const brief = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
    const repos = JSON.parse(fs.readFileSync(args[1], 'utf-8'));
    const outputPath = args[2] || DEFAULT_OUTPUT_PATH;
    const written = generateProjectMap(brief, repos, outputPath);
    console.log(`Written: ${written}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generateProjectMap, generateProjectMapContent, detectDomains };
