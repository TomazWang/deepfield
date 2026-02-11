#!/usr/bin/env node
/**
 * hash-files.js - Compute file hashes using git blob hash (for git repos) or MD5 (for others)
 * Usage: hash-files.js <directory_path> [--output=json|text]
 *
 * Example: hash-files.js ./source/baseline/repos/myrepo --output=json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Parse command line arguments
if (process.argv.length < 3) {
  console.error('Error: Missing required arguments');
  console.error('Usage: hash-files.js <directory_path> [--output=json|text]');
  process.exit(1);
}

const targetDir = process.argv[2];
const outputFormat = process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'json';

try {
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory not found: ${targetDir}`);
    process.exit(2);
  }

  const hashes = computeHashes(targetDir);

  // Output results
  if (outputFormat === 'json') {
    console.log(JSON.stringify(hashes, null, 2));
  } else {
    for (const [filePath, hash] of Object.entries(hashes)) {
      console.log(`${hash}  ${filePath}`);
    }
  }

  process.exit(0);

} catch (error) {
  console.error(`Error computing hashes: ${error.message}`, { error: error.stack });
  process.exit(1);
}

/**
 * Compute hashes for all files in directory
 */
function computeHashes(dirPath) {
  const hashes = {};
  const isGitRepo = isGitRepository(dirPath);

  if (isGitRepo) {
    // Use git ls-tree for git repositories
    try {
      const output = execSync('git ls-tree -r HEAD --full-name', {
        cwd: dirPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
      });

      output.split('\n').forEach(line => {
        if (!line.trim()) return;

        // Parse: <mode> <type> <hash> <file>
        const parts = line.split(/\s+/);
        if (parts.length >= 4 && parts[1] === 'blob') {
          const hash = parts[2];
          const filePath = parts.slice(3).join(' ');
          hashes[filePath] = hash;
        }
      });

    } catch (error) {
      console.error('Warning: Failed to read git hashes, falling back to MD5', { error: error.message });
      return computeMD5Hashes(dirPath);
    }
  } else {
    // Use MD5 for non-git files
    return computeMD5Hashes(dirPath);
  }

  return hashes;
}

/**
 * Check if directory is a git repository
 */
function isGitRepository(dirPath) {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: dirPath,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute MD5 hashes for all files
 */
function computeMD5Hashes(dirPath) {
  const hashes = {};

  function walkDir(dir, baseDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip .git, node_modules, etc.
        if (['.git', 'node_modules', '.DS_Store'].includes(entry.name)) {
          continue;
        }
        walkDir(fullPath, baseDir);
      } else if (entry.isFile()) {
        // Compute MD5 hash
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('md5').update(content).digest('hex');

        // Store relative path
        const relativePath = path.relative(baseDir, fullPath);
        hashes[relativePath] = hash;
      }
    }
  }

  walkDir(dirPath, dirPath);
  return hashes;
}
