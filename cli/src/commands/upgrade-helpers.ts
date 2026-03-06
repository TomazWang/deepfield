import { Command } from 'commander';
import { pathExists, readJson } from 'fs-extra';
import { join, dirname } from 'path';
import { readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import { createBackup } from '../utils/backup.js';

/**
 * Get current CLI version from package.json
 */
function getCliVersion(): string {
  try {
    const pkgPath = join(dirname(dirname(__filename)), 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf-8')).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Read deepfieldVersion from project.config.json (defaults to '0.0.0')
 *
 * Special handling: Treats 1.0.0 as a legacy pre-0.2.0 version (0.1.0)
 * because the version numbering scheme changed during development.
 */
async function getProjectVersion(projectPath: string): Promise<string> {
  const configPath = join(projectPath, 'deepfield', 'project.config.json');
  if (!(await pathExists(configPath))) return '0.0.0';
  try {
    const config = await readJson(configPath);
    const rawVersion = config.deepfieldVersion ?? config.version ?? '0.0.0';

    // Legacy version mapping: 1.0.0 was used before version numbering change
    // Treat it as 0.1.0 (older than current 0.2.0) to trigger upgrades
    if (rawVersion === '1.0.0') {
      return '0.1.0';
    }

    return rawVersion;
  } catch {
    return '0.0.0';
  }
}

/**
 * upgrade:detect-version — outputs {projectVersion, targetVersion} as JSON
 */
export function createDetectVersionCommand(): Command {
  return new Command('upgrade:detect-version')
    .description('Detect project version and CLI target version (outputs JSON)')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const projectVersion = await getProjectVersion(cwd);
        const targetVersion = getCliVersion();
        const result = { projectVersion, targetVersion };
        process.stdout.write(JSON.stringify(result) + '\n');
        process.exit(0);
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ detect-version failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}

/**
 * upgrade:backup — creates a backup of deepfield/ and prints the backup path
 */
export function createBackupCommand(): Command {
  return new Command('upgrade:backup')
    .description('Create a timestamped backup of deepfield/ and print backup path')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const backupPath = await createBackup(cwd);
        process.stdout.write(backupPath + '\n');
        process.exit(0);
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ backup failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}

/**
 * upgrade:apply-op — applies a single atomic file operation within deepfield/
 * Supported types: create, update, delete, rename
 */
export function createApplyOpCommand(): Command {
  return new Command('upgrade:apply-op')
    .description('Apply a single atomic file operation within deepfield/ workspace')
    .requiredOption('--type <type>', 'Operation type: create, update, delete, rename')
    .requiredOption('--path <path>', 'Relative path within deepfield/ (e.g. "wip/notes.md")')
    .option('--content <content>', 'File content (required for create/update)')
    .option('--to <newPath>', 'New relative path within deepfield/ (required for rename)')
    .action((options) => {
      try {
        const cwd = process.cwd();
        const deepfieldDir = join(cwd, 'deepfield');
        const { type, path: relPath, content, to: toRelPath } = options;

        // Resolve absolute paths within deepfield/
        const absPath = join(deepfieldDir, relPath);

        switch (type) {
          case 'create':
          case 'update': {
            if (content === undefined) {
              process.stderr.write(chalk.red(`❌ --content is required for --type ${type}\n`));
              process.exit(1);
            }
            // Ensure parent directory exists
            mkdirSync(dirname(absPath), { recursive: true });
            // Atomic write: write to .tmp, then rename
            const tmpPath = absPath + '.tmp';
            writeFileSync(tmpPath, content, 'utf-8');
            renameSync(tmpPath, absPath);
            process.stdout.write(`${type === 'create' ? 'Created' : 'Updated'}: ${relPath}\n`);
            process.exit(0);
            break;
          }
          case 'delete': {
            if (!require('fs').existsSync(absPath)) {
              process.stderr.write(chalk.red(`❌ File not found: ${relPath}\n`));
              process.exit(1);
            }
            unlinkSync(absPath);
            process.stdout.write(`Deleted: ${relPath}\n`);
            process.exit(0);
            break;
          }
          case 'rename': {
            if (!toRelPath) {
              process.stderr.write(chalk.red('❌ --to is required for --type rename\n'));
              process.exit(1);
            }
            const absToPath = join(deepfieldDir, toRelPath);
            mkdirSync(dirname(absToPath), { recursive: true });
            // Atomic rename (same filesystem, no tmp needed)
            renameSync(absPath, absToPath);
            process.stdout.write(`Renamed: ${relPath} → ${toRelPath}\n`);
            process.exit(0);
            break;
          }
          default: {
            process.stderr.write(
              chalk.red(`❌ Unknown operation type: "${type}". Use create, update, delete, or rename.\n`)
            );
            process.exit(1);
          }
        }
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ apply-op failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}

/**
 * upgrade:validate — checks deepfield/ directory structure and config schema
 */
export function createValidateCommand(): Command {
  return new Command('upgrade:validate')
    .description('Validate deepfield/ workspace structure and config schema')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const deepfieldDir = join(cwd, 'deepfield');
        const errors: string[] = [];

        // Check deepfield/ exists
        if (!(await pathExists(deepfieldDir))) {
          errors.push('deepfield/ directory does not exist');
        } else {
          // Check required subdirectories
          const requiredDirs = ['source', 'wip', 'drafts', 'output'];
          for (const d of requiredDirs) {
            if (!(await pathExists(join(deepfieldDir, d)))) {
              errors.push(`Missing required directory: deepfield/${d}/`);
            }
          }

          // Check project.config.json exists and has required fields
          const configPath = join(deepfieldDir, 'project.config.json');
          if (!(await pathExists(configPath))) {
            errors.push('Missing required file: deepfield/project.config.json');
          } else {
            try {
              const config = await readJson(configPath);
              if (!config.deepfieldVersion && !config.version) {
                errors.push('project.config.json is missing deepfieldVersion field');
              }
            } catch {
              errors.push('project.config.json is not valid JSON');
            }
          }
        }

        if (errors.length === 0) {
          process.stdout.write(JSON.stringify({ valid: true, errors: [] }) + '\n');
          process.exit(0);
        } else {
          process.stdout.write(JSON.stringify({ valid: false, errors }) + '\n');
          process.exit(1);
        }
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ validate failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}

/**
 * upgrade:scaffold-cross-cutting — checks and creates missing cross-cutting files from templates
 */
export function createScaffoldCrossCuttingCommand(): Command {
  return new Command('upgrade:scaffold-cross-cutting')
    .description('Check and create missing cross-cutting files (terminology.md, unknowns.md) from templates')
    .option('--deepfield-dir <path>', 'Path to deepfield workspace directory', './deepfield')
    .option('--templates-dir <path>', 'Path to plugin templates directory')
    .action((options) => {
      try {
        const cwd = process.cwd();
        const deepfieldDir = require('path').resolve(cwd, options.deepfieldDir);
        const crossCuttingDir = join(deepfieldDir, 'drafts', 'cross-cutting');

        // Determine templates directory
        const templatesDir = options.templatesDir
          ? require('path').resolve(cwd, options.templatesDir)
          : join(dirname(dirname(__filename)), 'plugin', 'templates');

        const filesToScaffold = ['terminology.md', 'unknowns.md'];

        // Ensure cross-cutting directory exists
        mkdirSync(crossCuttingDir, { recursive: true });

        for (const filename of filesToScaffold) {
          const targetPath = join(crossCuttingDir, filename);
          const relativePath = `drafts/cross-cutting/${filename}`;

          if (require('fs').existsSync(targetPath)) {
            process.stdout.write(`Already exists: ${relativePath}\n`);
          } else {
            const templatePath = join(templatesDir, filename);
            if (!require('fs').existsSync(templatePath)) {
              process.stderr.write(chalk.red(`❌ Template not found: ${templatePath}\n`));
              process.exit(1);
            }
            const content = readFileSync(templatePath, 'utf-8');
            const tmpPath = targetPath + '.tmp';
            writeFileSync(tmpPath, content, 'utf-8');
            renameSync(tmpPath, targetPath);
            process.stdout.write(`Created: ${relativePath}\n`);
          }
        }

        process.exit(0);
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ scaffold-cross-cutting failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}

/**
 * upgrade:set-version — atomically updates deepfieldVersion in project.config.json
 */
export function createSetVersionCommand(): Command {
  return new Command('upgrade:set-version')
    .description('Set deepfieldVersion in deepfield/project.config.json atomically')
    .requiredOption('--to-version <semver>', 'New version to set (e.g. 2.1.0)')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const configPath = join(cwd, 'deepfield', 'project.config.json');

        if (!(await pathExists(configPath))) {
          process.stderr.write(chalk.red('❌ deepfield/project.config.json not found\n'));
          process.exit(1);
        }

        const config = await readJson(configPath);
        config.deepfieldVersion = options.toVersion;

        // Atomic write: write to .tmp then rename
        const tmpPath = configPath + '.tmp';
        writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
        renameSync(tmpPath, configPath);

        process.stdout.write(`Version set to ${options.toVersion}\n`);
        process.exit(0);
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ set-version failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}
