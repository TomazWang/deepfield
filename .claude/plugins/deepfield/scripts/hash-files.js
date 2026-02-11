#!/usr/bin/env node
/**
 * hash-files.js - Compute SHA-256 hashes for files in a directory
 *
 * Usage: hash-files.js <directory> [--output <file>] [--batch-size <n>]
 *
 * Features:
 * - SHA-256 hashing
 * - Ignore patterns (node_modules, .git, build/, etc.)
 * - Batch processing for large file sets
 * - JSON output format with stats
 *
 * Output format:
 * {
 *   "files": {
 *     "path/to/file.js": "sha256hash...",
 *     "path/to/other.md": "sha256hash..."
 *   },
 *   "stats": {
 *     "total": 150,
 *     "hashed": 145,
 *     "ignored": 5,
 *     "errors": 0
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default ignore patterns
const DEFAULT_IGNORE_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.git$/,
  /build\//,
  /dist\//,
  /\.next\//,
  /out\//,
  /target\//,  // Rust/Java
  /vendor\//,  // Go/PHP
  /\.egg-info\//,  // Python
  /__pycache__\//,
  /\.pytest_cache\//,
  /\.venv\//,
  /\.env$/,
  /\.DS_Store$/,
  /\.swp$/,
  /\.swo$/,
  /~$/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /Gemfile\.lock$/,
  /Cargo\.lock$/,
];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: hash-files.js <directory> [--output <file>] [--batch-size <n>]');
    console.error('');
    console.error('Options:');
    console.error('  --output <file>      Write JSON output to file (default: stdout)');
    console.error('  --batch-size <n>     Process files in batches of N (default: 100)');
    process.exit(args[0] === '--help' || args[0] === '-h' ? 0 : 1);
  }

  const config = {
    directory: args[0],
    output: null,
    batchSize: 100,
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (args[i] === '--batch-size' && i + 1 < args.length) {
      config.batchSize = parseInt(args[++i], 10);
      if (isNaN(config.batchSize) || config.batchSize < 1) {
        console.error('Error: Invalid batch size');
        process.exit(1);
      }
    }
  }

  return config;
}

const config = parseArgs();

// Check if path should be ignored
function shouldIgnore(filePath) {
  return DEFAULT_IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

// Compute SHA-256 hash of a file
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Recursively find all files in directory
function findFiles(dir, baseDir = dir) {
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...findFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      throw error;
    }
  }

  return files;
}

// Process files in batches
async function processBatch(files, baseDir, batchSize) {
  const results = {};
  const stats = {
    total: files.length,
    hashed: 0,
    ignored: 0,
    errors: 0,
  };

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    await Promise.all(batch.map(async (file) => {
      try {
        const fullPath = path.join(baseDir, file);
        const hash = await hashFile(fullPath);
        results[file] = hash;
        stats.hashed++;
      } catch (error) {
        // File might have been deleted or is inaccessible
        stats.errors++;
      }
    }));
  }

  return { files: results, stats };
}

// Main function
async function main() {
  // Validate directory
  if (!fs.existsSync(config.directory)) {
    console.error(`Error: Directory not found: ${config.directory}`);
    process.exit(1);
  }

  if (!fs.statSync(config.directory).isDirectory()) {
    console.error(`Error: Not a directory: ${config.directory}`);
    process.exit(1);
  }

  try {
    // Find all files
    const files = findFiles(config.directory);

    if (files.length === 0) {
      console.error('Warning: No files found to hash');
    }

    // Process files in batches
    const result = await processBatch(files, config.directory, config.batchSize);

    // Output results
    const output = JSON.stringify(result, null, 2);

    if (config.output) {
      // Write to file atomically
      const tempFile = config.output + '.tmp';
      fs.writeFileSync(tempFile, output, 'utf8');
      fs.renameSync(tempFile, config.output);
    } else {
      // Write to stdout
      console.log(output);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
