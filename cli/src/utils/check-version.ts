import { pathExists, readFile } from 'fs-extra';
import { join, dirname } from 'path';
import semver from 'semver';

/**
 * Get the current CLI version from package.json
 */
function getCliVersion(): string {
  try {
    // Handles both dist/ and src/ paths
    const pkgPath = join(dirname(dirname(__filename)), 'package.json');
    const pkg = JSON.parse(require('fs').readFileSync(pkgPath, 'utf-8'));
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
      const { getRequiredMigrations } = require('../../migrations/index.js');
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
