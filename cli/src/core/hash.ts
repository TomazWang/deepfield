import { pathExists, readdir, stat } from 'fs-extra';
import { join } from 'path';
import { createHash } from 'crypto';
import { readFile } from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Hash map: filepath -> hash
 */
export type HashMap = Record<string, string>;

/**
 * Check if directory is a git repository
 */
async function isGitRepo(dirPath: string): Promise<boolean> {
  const gitDir = join(dirPath, '.git');
  return await pathExists(gitDir);
}

/**
 * Get git blob hashes for all files in a git repository
 * Uses `git ls-tree` to get the blob hash for each file
 */
async function getGitHashes(dirPath: string): Promise<HashMap> {
  const hashes: HashMap = {};

  try {
    // Get all files with their blob hashes
    const { stdout } = await execAsync('git ls-tree -r HEAD --name-only', {
      cwd: dirPath,
    });

    const files = stdout.trim().split('\n').filter(Boolean);

    for (const file of files) {
      try {
        // Get the blob hash for this file
        const { stdout: hashOutput } = await execAsync(
          `git hash-object "${file}"`,
          { cwd: dirPath }
        );
        hashes[file] = hashOutput.trim();
      } catch (error) {
        // Skip files that can't be hashed (deleted, etc.)
        continue;
      }
    }
  } catch (error) {
    // If git command fails, return empty hash map
    // This could happen if the repo is empty or has no commits
  }

  return hashes;
}

/**
 * Compute MD5 hash for a file
 */
async function computeMD5(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('md5').update(content).digest('hex');
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dirPath: string, baseDir: string = dirPath): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      // Skip .git directory
      if (entry === '.git') continue;

      // Recursively get files from subdirectories
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (stats.isFile()) {
      // Add relative path from base directory
      const relativePath = fullPath.substring(baseDir.length + 1);
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Get MD5 hashes for all files in a directory (non-git)
 */
async function getMD5Hashes(dirPath: string): Promise<HashMap> {
  const hashes: HashMap = {};
  const files = await getAllFiles(dirPath);

  for (const file of files) {
    try {
      const fullPath = join(dirPath, file);
      hashes[file] = await computeMD5(fullPath);
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return hashes;
}

/**
 * Hash all files in a directory
 *
 * If the directory is a git repository, uses git blob hashes (git hash-object).
 * Otherwise, computes MD5 hashes for all files.
 *
 * @param dirPath Path to directory to hash
 * @returns HashMap with relative file paths as keys and hashes as values
 */
export async function hashFiles(dirPath: string): Promise<HashMap> {
  // Check if directory exists
  if (!(await pathExists(dirPath))) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  // Check if it's a git repo
  const isGit = await isGitRepo(dirPath);

  // Use appropriate hashing method
  if (isGit) {
    return await getGitHashes(dirPath);
  } else {
    return await getMD5Hashes(dirPath);
  }
}

/**
 * Compare two hash maps and return files that changed
 */
export function getChangedFiles(
  oldHashes: HashMap,
  newHashes: HashMap
): string[] {
  const changed: string[] = [];

  // Check for new or modified files
  for (const [file, hash] of Object.entries(newHashes)) {
    if (!oldHashes[file] || oldHashes[file] !== hash) {
      changed.push(file);
    }
  }

  // Check for deleted files
  for (const file of Object.keys(oldHashes)) {
    if (!newHashes[file]) {
      changed.push(file);
    }
  }

  return changed;
}
