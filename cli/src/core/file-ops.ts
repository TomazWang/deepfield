import { writeFile, rename, unlink, pathExists } from 'fs-extra';
import { join, dirname } from 'path';
import { ensureDir } from 'fs-extra';

/**
 * Custom error for file operation issues
 */
export class FileOperationError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'FileOperationError';
  }
}

/**
 * Atomically write content to a file using temp-then-rename pattern
 * This prevents corruption if the write is interrupted
 *
 * @param filePath Target file path
 * @param content Content to write
 * @throws FileOperationError if write fails
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;

  try {
    // Ensure directory exists
    await ensureDir(dirname(filePath));

    // Write to temporary file
    await writeFile(tmpPath, content, 'utf-8');

    // Atomically rename temp file to target
    // This operation is atomic on most filesystems
    await rename(tmpPath, filePath);
  } catch (error) {
    // Cleanup temp file if it exists
    try {
      if (await pathExists(tmpPath)) {
        await unlink(tmpPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    throw new FileOperationError(
      `Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      'write'
    );
  }
}

/**
 * Clean up all .tmp files in a directory
 *
 * @param dirPath Directory to clean
 */
export async function cleanupTmpFiles(dirPath: string): Promise<void> {
  const { readdir } = await import('fs-extra');

  try {
    if (!(await pathExists(dirPath))) {
      return;
    }

    const files = await readdir(dirPath);
    const tmpFiles = files.filter(f => f.endsWith('.tmp'));

    for (const tmpFile of tmpFiles) {
      try {
        await unlink(join(dirPath, tmpFile));
      } catch (error) {
        // Ignore errors for individual files
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}
