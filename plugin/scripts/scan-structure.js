#!/usr/bin/env node
/**
 * scan-structure.js - Scan repository directory structure
 *
 * Usage: node scan-structure.js [repos-dir]
 *
 * Output format: JSON array of repository structures
 * [
 *   {
 *     "name": "my-repo",
 *     "path": "./deepfield/source/baseline/repos/my-repo",
 *     "topLevelDirs": ["src", "tests", "docs"],
 *     "modules": [{ "parent": "packages", "name": "core" }],
 *     "buildFiles": ["package.json"],
 *     "readmes": ["README.md"],
 *     "language": "node"
 *   }
 * ]
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_REPOS_DIR = './deepfield/source/baseline/repos';

// Build files mapped to language hints
const BUILD_FILE_PATTERNS = {
  'package.json': 'node',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'build.gradle.kts': 'kotlin',
  'Cargo.toml': 'rust',
  'go.mod': 'go',
  'requirements.txt': 'python',
  'setup.py': 'python',
  'pyproject.toml': 'python',
  'Gemfile': 'ruby',
  'composer.json': 'php',
  'CMakeLists.txt': 'cpp',
  'Makefile': 'make',
};

const README_PATTERNS = ['README.md', 'README.txt', 'README.rst', 'README'];

// Directories that indicate monorepo module organization
const MONOREPO_DIRS = ['packages', 'services', 'apps', 'libs', 'modules', 'components'];

// Common directories to skip (not meaningful for analysis)
const SKIP_DIRS = ['.git', '.github', 'node_modules', '.venv', '__pycache__', '.pytest_cache', 'vendor', 'target', 'dist', 'build', '.next', 'out', '.idea', '.vscode'];

/**
 * Scan a single repository directory.
 */
function scanRepository(repoPath) {
  const resolvedPath = path.resolve(repoPath);
  const name = path.basename(resolvedPath);

  if (!fs.existsSync(resolvedPath)) {
    return { name, path: repoPath, error: `Directory not found: ${resolvedPath}` };
  }

  const structure = {
    name,
    path: repoPath,
    topLevelDirs: [],
    modules: [],
    buildFiles: [],
    readmes: [],
    language: null,
  };

  let entries;
  try {
    entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
  } catch (error) {
    return { ...structure, error: `Cannot read directory: ${error.message}` };
  }

  // Collect top-level directories (excluding hidden and noise)
  structure.topLevelDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.includes(e.name))
    .map(e => e.name)
    .sort();

  // Detect build files
  for (const [buildFile, lang] of Object.entries(BUILD_FILE_PATTERNS)) {
    if (entries.some(e => e.isFile() && e.name === buildFile)) {
      structure.buildFiles.push(buildFile);
      if (!structure.language) {
        structure.language = lang;
      }
    }
  }

  // Detect README files
  for (const readme of README_PATTERNS) {
    if (entries.some(e => e.isFile() && e.name === readme)) {
      structure.readmes.push(readme);
    }
  }

  // Detect monorepo modules
  for (const monoDir of MONOREPO_DIRS) {
    const monoDirPath = path.join(resolvedPath, monoDir);
    if (fs.existsSync(monoDirPath)) {
      try {
        const moduleEntries = fs.readdirSync(monoDirPath, { withFileTypes: true });
        const subModules = moduleEntries
          .filter(e => e.isDirectory() && !e.name.startsWith('.'))
          .map(e => ({ parent: monoDir, name: e.name }));
        structure.modules.push(...subModules);
      } catch {
        // Skip if unreadable
      }
    }
  }

  return structure;
}

/**
 * Scan all repositories in the repos directory.
 */
function scanAllRepos(reposDir) {
  const resolvedDir = path.resolve(reposDir || DEFAULT_REPOS_DIR);

  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  let entries;
  try {
    entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  } catch (error) {
    console.error(`Warning: Cannot read repos directory: ${error.message}`);
    return [];
  }

  const repoDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

  return repoDirs.map(e => scanRepository(path.join(resolvedDir, e.name)));
}

// CLI entrypoint
if (require.main === module) {
  const reposDir = process.argv[2] || DEFAULT_REPOS_DIR;
  try {
    const data = scanAllRepos(reposDir);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { scanRepository, scanAllRepos };
