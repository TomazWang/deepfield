import { pathExists, ensureDir, copy, readJson, remove, readdir } from 'fs-extra';
import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';

export interface BackupMeta {
  id: string;
  timestamp: string;
  version: string;
  size: number;
}

/**
 * Format an ISO timestamp into a filesystem-safe string (replace : and . with -)
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').split('.')[0];
}

/**
 * Recursively estimate folder size in bytes (best-effort, not precise)
 */
async function estimateFolderSize(dirPath: string): Promise<number> {
  const { readdirSync, statSync } = require('fs');
  let total = 0;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await estimateFolderSize(full);
      } else {
        try {
          total += statSync(full).size;
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return total;
}

/**
 * Create a timestamped backup of the deepfield/ directory.
 *
 * Backup is placed at: <projectRoot>/.deepfield-backups/backup-<timestamp>/
 *
 * @param projectPath - Root of the user's project (where deepfield/ lives)
 * @returns Full path to the created backup directory
 */
export async function createBackup(projectPath: string): Promise<string> {
  const deepfieldDir = join(projectPath, 'deepfield');
  const backupsDir = join(projectPath, '.deepfield-backups');
  const timestamp = formatTimestamp(new Date());
  const backupId = `backup-${timestamp}`;
  const backupPath = join(backupsDir, backupId);

  await ensureDir(backupsDir);

  // Full recursive copy of deepfield/
  await copy(deepfieldDir, backupPath, { overwrite: true });

  // Read version from config
  let version = '0.0.0';
  try {
    const config = await readJson(join(deepfieldDir, 'project.config.json'));
    version = config.deepfieldVersion ?? config.version ?? '0.0.0';
  } catch {
    // use default
  }

  // Estimate size
  const size = await estimateFolderSize(backupPath);

  // Write metadata
  const meta: BackupMeta = { id: backupId, timestamp, version, size };
  await writeFile(join(backupPath, '.backup-meta.json'), JSON.stringify(meta, null, 2));

  return backupPath;
}

/**
 * List all available backups, sorted newest first.
 *
 * @param projectPath - Root of the user's project
 * @returns Array of BackupMeta sorted by timestamp descending
 */
export async function listBackups(projectPath: string): Promise<BackupMeta[]> {
  const backupsDir = join(projectPath, '.deepfield-backups');

  if (!(await pathExists(backupsDir))) {
    return [];
  }

  const entries = await readdir(backupsDir, { withFileTypes: true });
  const results: BackupMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('backup-')) continue;
    const metaPath = join(backupsDir, entry.name, '.backup-meta.json');
    try {
      const meta: BackupMeta = await readJson(metaPath);
      results.push(meta);
    } catch {
      // Backup without metadata — create a stub entry
      results.push({
        id: entry.name,
        timestamp: entry.name.replace('backup-', ''),
        version: 'unknown',
        size: 0,
      });
    }
  }

  // Sort newest first
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return results;
}

/**
 * Restore a backup by ID, replacing the current deepfield/ directory.
 *
 * @param projectPath - Root of the user's project
 * @param backupId - ID of the backup to restore (e.g. "backup-2026-03-04T15-30-00")
 */
export async function restoreBackup(projectPath: string, backupId: string): Promise<void> {
  const backupsDir = join(projectPath, '.deepfield-backups');
  const backupPath = join(backupsDir, backupId);
  const deepfieldDir = join(projectPath, 'deepfield');

  if (!(await pathExists(backupPath))) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  // Remove current deepfield/ and replace with backup
  await remove(deepfieldDir);
  await copy(backupPath, deepfieldDir, { overwrite: true });

  // Remove the .backup-meta.json that was copied into deepfield/
  const metaInTarget = join(deepfieldDir, '.backup-meta.json');
  if (await pathExists(metaInTarget)) {
    await remove(metaInTarget);
  }
}
