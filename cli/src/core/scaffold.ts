import { ensureDir, pathExists, copy, access, constants } from 'fs-extra';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

/**
 * Custom error for permission issues
 */
export class PermissionError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Result object from scaffold operation
 */
export interface ScaffoldResult {
  created: string[];
  skipped: string[];
  errors: Array<{ path: string; error: string }>;
}

/**
 * Check if we have write permission for a directory
 */
async function checkWritePermission(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the templates directory path
 * Handles both development (src) and production (dist) paths
 */
function getTemplatesDir(): string {
  // In built version, templates are in dist/templates
  const distTemplates = join(dirname(dirname(__filename)), 'templates');
  // In dev version, templates are in cli/templates
  const devTemplates = join(dirname(dirname(dirname(__filename))), 'templates');

  // Try dist path first (production), fall back to dev path
  return distTemplates;
}

/**
 * Scaffold the deepfield/ directory structure
 *
 * Creates:
 * - deepfield/
 *   - source/
 *     - baseline/
 *       - repos/
 *   - wip/
 *   - drafts/
 *   - output/
 *   - project.config.json (template)
 *   - brief.md (template)
 *   - project-map.md (template)
 *   - behavior-index.md (template)
 *   - tech-index.md (template)
 *   - domain-links.md (template)
 *   - unknowns.md (template)
 *   - _changelog.md (template)
 *
 * @param targetDir Directory where deepfield/ should be created (usually cwd)
 * @param options Options for scaffolding
 * @returns ScaffoldResult with created/skipped/errors
 */
export async function scaffold(
  targetDir: string,
  options: { force?: boolean } = {}
): Promise<ScaffoldResult> {
  const deepfieldDir = join(targetDir, 'deepfield');
  const result: ScaffoldResult = {
    created: [],
    skipped: [],
    errors: [],
  };

  // Check write permission on target directory
  if (await pathExists(targetDir)) {
    if (!(await checkWritePermission(targetDir))) {
      throw new PermissionError(
        `No write permission for directory: ${targetDir}`,
        targetDir
      );
    }
  }

  // Define directory structure (four-space architecture)
  const directories = [
    'deepfield',
    'deepfield/source',
    'deepfield/source/baseline',
    'deepfield/source/baseline/repos',
    'deepfield/wip',
    'deepfield/drafts',
    'deepfield/drafts/behavior',
    'deepfield/drafts/tech',
    'deepfield/drafts/cross-cutting',
    'deepfield/output',
  ];

  // Create directories
  for (const dir of directories) {
    const dirPath = join(targetDir, dir);
    try {
      if (await pathExists(dirPath)) {
        result.skipped.push(dirPath);
      } else {
        await ensureDir(dirPath);
        result.created.push(dirPath);
      }
    } catch (error) {
      result.errors.push({
        path: dirPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Copy template files (source template name → destination relative to deepfield/)
  const templatesDir = getTemplatesDir();
  const templateMappings: Array<{ src: string; dest: string }> = [
    { src: 'project.config.json', dest: 'project.config.json' },
    { src: 'brief.md', dest: 'brief.md' },
    { src: 'project-map.md', dest: 'project-map.md' },
    { src: 'behavior-index.md', dest: 'behavior-index.md' },
    { src: 'tech-index.md', dest: 'tech-index.md' },
    { src: 'domain-links.md', dest: 'domain-links.md' },
    { src: 'unknowns.md', dest: 'drafts/cross-cutting/unknowns.md' },
    { src: '_changelog.md', dest: 'drafts/_changelog.md' },
  ];

  for (const { src, dest } of templateMappings) {
    const sourcePath = join(templatesDir, src);
    const destPath = join(deepfieldDir, dest);

    try {
      // Skip if file exists and force is not enabled
      if ((await pathExists(destPath)) && !options.force) {
        result.skipped.push(destPath);
        continue;
      }

      // Check if template exists
      if (!(await pathExists(sourcePath))) {
        result.errors.push({
          path: destPath,
          error: `Template not found: ${sourcePath}`,
        });
        continue;
      }

      // Copy template
      await copy(sourcePath, destPath, { overwrite: options.force });
      result.created.push(destPath);
    } catch (error) {
      result.errors.push({
        path: destPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Format scaffold result for display
 */
export function formatScaffoldResult(result: ScaffoldResult): string {
  const lines: string[] = [];

  if (result.created.length > 0) {
    lines.push(chalk.green('✓ Created:'));
    result.created.forEach(path => {
      lines.push(`  ${path}`);
    });
  }

  if (result.skipped.length > 0) {
    lines.push(chalk.yellow('\n⊘ Skipped (already exists):'));
    result.skipped.forEach(path => {
      lines.push(`  ${path}`);
    });
  }

  if (result.errors.length > 0) {
    lines.push(chalk.red('\n✗ Errors:'));
    result.errors.forEach(({ path, error }) => {
      lines.push(`  ${path}: ${error}`);
    });
  }

  return lines.join('\n');
}
