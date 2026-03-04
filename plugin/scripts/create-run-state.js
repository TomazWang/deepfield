#!/usr/bin/env node
/**
 * create-run-state.js - Create run-0.config.json with status, timestamps, and file hashes
 *
 * Usage: node create-run-state.js [--repos-dir <dir>] [--output-dir <dir>] [--started-at <iso>]
 *
 * Creates:
 *   deepfield/wip/run-0/run-0.config.json
 *
 * Calls hash-files.js for each cloned repo and merges results into fileHashes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_REPOS_DIR = './deepfield/source/baseline/repos';
const DEFAULT_RUN_DIR = './deepfield/wip/run-0';
const HASH_SCRIPT = path.join(__dirname, 'hash-files.js');

/**
 * Compute file hashes for a repository using hash-files.js.
 * Returns { "relative/path": "sha256hash", ... }
 */
function computeRepoHashes(repoPath) {
  if (!fs.existsSync(repoPath)) return {};

  try {
    const result = execSync(`node "${HASH_SCRIPT}" "${repoPath}"`, {
      encoding: 'utf-8',
      timeout: 120000, // 2 minutes max per repo
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(result);
    return parsed.files || {};
  } catch (error) {
    console.error(`  Warning: Could not hash ${path.basename(repoPath)}: ${error.message}`);
    return {};
  }
}

/**
 * Compute hashes for all cloned repositories and merge into a single object.
 * Keys are prefixed with repo name: "repo-name/path/to/file.js"
 */
function computeAllHashes(reposDir) {
  const resolvedDir = path.resolve(reposDir || DEFAULT_REPOS_DIR);

  if (!fs.existsSync(resolvedDir)) {
    return {};
  }

  const allHashes = {};

  let entries;
  try {
    entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  } catch {
    return {};
  }

  const repoDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

  for (const repoEntry of repoDirs) {
    const repoPath = path.join(resolvedDir, repoEntry.name);
    console.log(`  Computing hashes for ${repoEntry.name}...`);
    const hashes = computeRepoHashes(repoPath);
    const count = Object.keys(hashes).length;

    // Prefix each hash key with the repo name
    for (const [filePath, hash] of Object.entries(hashes)) {
      allHashes[`${repoEntry.name}/${filePath}`] = hash;
    }

    console.log(`  Hashed ${count} files in ${repoEntry.name}`);
  }

  return allHashes;
}

/**
 * Create the run-0 directory and write run-0.config.json.
 */
function createRunState(options) {
  const {
    reposDir = DEFAULT_REPOS_DIR,
    runDir = DEFAULT_RUN_DIR,
    startedAt = new Date().toISOString(),
    skipHashing = false,
  } = options || {};

  const resolvedRunDir = path.resolve(runDir);

  // Create directory structure
  fs.mkdirSync(resolvedRunDir, { recursive: true });
  fs.mkdirSync(path.join(resolvedRunDir, 'domains'), { recursive: true });

  // Compute file hashes
  let fileHashes = {};
  if (!skipHashing) {
    fileHashes = computeAllHashes(reposDir);
  }

  const completedAt = new Date().toISOString();

  const state = {
    runNumber: 0,
    status: 'completed',
    startedAt,
    completedAt,
    fileHashes,
    focusTopics: [],
    confidenceChanges: {},
    changesDetected: false,
    learningGenerated: true,
  };

  // Write atomically
  const configPath = path.join(resolvedRunDir, 'run-0.config.json');
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, configPath);

  // Also write initial findings.md
  const findingsPath = path.join(resolvedRunDir, 'findings.md');
  const findingsContent = generateFindings(fileHashes);
  const findingsTmp = findingsPath + '.tmp';
  fs.writeFileSync(findingsTmp, findingsContent, 'utf-8');
  fs.renameSync(findingsTmp, findingsPath);

  return {
    configPath,
    findingsPath,
    fileCount: Object.keys(fileHashes).length,
    state,
  };
}

/**
 * Generate initial findings.md content.
 */
function generateFindings(fileHashes) {
  const now = new Date().toISOString().split('T')[0];
  const fileCount = Object.keys(fileHashes).length;

  let content = `# Run 0 - Bootstrap Findings\n\n`;
  content += `*Date: ${now}*\n\n`;

  content += `## Structural Understanding\n\n`;
  content += `### Project Organization\n\n`;
  content += `*Determined from directory structure scan. See project-map.md for details.*\n\n`;

  content += `### Files Indexed\n\n`;
  content += `- **Total files hashed:** ${fileCount}\n`;
  content += `- **Purpose:** Baseline for incremental scanning in Run 1+\n\n`;

  content += `### Domains Detected\n\n`;
  content += `*See domain-index.md for detected domains and confidence levels.*\n\n`;

  content += `### Open Questions\n\n`;
  content += `*See learning-plan.md for the full question list.*\n\n`;

  content += `## Next Focus\n\n`;
  content += `Run 1 will deep-read key files to understand:\n`;
  content += `- Core architecture and entry points\n`;
  content += `- Domain boundaries and service interactions\n`;
  content += `- Data models and key abstractions\n\n`;

  content += `---\n\n`;
  content += `*This findings file is updated after each learning run.*\n`;

  return content;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repos-dir' && args[i + 1]) options.reposDir = args[++i];
    else if (args[i] === '--output-dir' && args[i + 1]) options.runDir = args[++i];
    else if (args[i] === '--started-at' && args[i + 1]) options.startedAt = args[++i];
    else if (args[i] === '--skip-hashing') options.skipHashing = true;
  }

  try {
    const result = createRunState(options);
    console.log(`Created: ${result.configPath}`);
    console.log(`Created: ${result.findingsPath}`);
    console.log(`Files hashed: ${result.fileCount}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { createRunState, computeAllHashes, computeRepoHashes };
