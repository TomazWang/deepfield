import fsExtra from 'fs-extra';
const { pathExists, readFile } = fsExtra;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);

/**
 * Get the current CLI version. Reads from Claude Code's installed_plugins.json first
 * (authoritative source when installed via marketplace), falling back to package.json.
 */
function getCliVersion(): string {
  try {
    const installedPath = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
    const data = JSON.parse(readFileSync(installedPath, 'utf-8'));
    const entry = data?.plugins?.['deepfield@deepfield'];
    if (Array.isArray(entry) && entry.length > 0 && entry[0].version) {
      return entry[0].version;
    }
  } catch {
    // fall through to package.json
  }
  try {
    // Handles both dist/ and src/ paths
    const pkgPath = join(dirname(dirname(__filename)), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export interface MigrationInfo {
  from: string;
  to: string;
  description: string;
}

export interface VersionCheckResult {
  compatible: boolean;
  version?: string;
  projectVersion?: string;
  currentVersion?: string;
  needsUpgrade?: boolean;
  needsDowngrade?: boolean;
  migrations?: MigrationInfo[];
}

/**
 * Check if the project at projectPath is compatible with the current CLI version.
 *
 * Returns:
 *  - { compatible: true } when versions match or no project found
 *  - { compatible: false, needsUpgrade: true, migrations: [...] } when project is behind
 *  - { compatible: false, needsDowngrade: true } when project is ahead
 */
export async function checkProjectVersion(projectPath: string): Promise<VersionCheckResult> {
  const configPath = join(projectPath, 'deepfield', 'project.config.json');

  // No project — skip version check
  if (!(await pathExists(configPath))) {
    return { compatible: true };
  }

  let projectVersion = '0.0.0';
  try {
    const raw = await readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);
    projectVersion = config.deepfieldVersion ?? '0.0.0';
  } catch {
    // Unreadable config — skip version check
    return { compatible: true };
  }

  const currentVersion = getCliVersion();

  // Identical versions
  if (semver.eq(projectVersion, currentVersion)) {
    return { compatible: true, version: projectVersion };
  }

  // Project needs upgrading
  if (semver.lt(projectVersion, currentVersion)) {
    // Dynamically load migration list to avoid circular deps at import time
    let migrations: MigrationInfo[] = [];
    try {
      const { getRequiredMigrations } = await import('../../migrations/index.js');
      const migs = getRequiredMigrations(projectVersion, currentVersion);
      migrations = migs.map((m: { from: string; to: string; description: string }) => ({
        from: m.from,
        to: m.to,
        description: m.description,
      }));
    } catch {
      // If migrations can't be loaded, still report mismatch
    }
    return {
      compatible: false,
      projectVersion,
      currentVersion,
      needsUpgrade: true,
      migrations,
    };
  }

  // Project is newer than CLI
  return {
    compatible: false,
    projectVersion,
    currentVersion,
    needsDowngrade: true,
  };
}
