import { Command } from 'commander';
import { pathExists, readJson } from 'fs-extra';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createBackup } from '../utils/backup.js';

// CJS interop for migration modules (not TypeScript)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getRequiredMigrations, runMigrations, ALL_MIGRATIONS } = require('../../migrations/index.js');

/**
 * Get current CLI version from package.json
 */
function getCliVersion(): string {
  try {
    const pkgPath = join(dirname(dirname(__filename)), 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf-8')).version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Read deepfieldVersion from project.config.json (defaults to '0.0.0')
 */
async function getProjectVersion(projectPath: string): Promise<string> {
  const configPath = join(projectPath, 'deepfield', 'project.config.json');
  if (!(await pathExists(configPath))) return '0.0.0';
  try {
    const config = await readJson(configPath);
    return config.deepfieldVersion ?? config.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createUpgradeCommand(): Command {
  return new Command('upgrade')
    .description('Upgrade the deepfield project to the latest version')
    .option('--dry-run', 'Show what would change without applying', false)
    .option('--to <version>', 'Upgrade to a specific version (default: latest)')
    .option('--skip-backup', 'Skip backup creation (not recommended)', false)
    .option('--force', 'Skip confirmation prompts', false)
    .option('--list-migrations', 'Show all available migrations and exit', false)
    .action(async (options) => {
      try {
        await upgradeCommand(options);
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Upgrade failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

async function upgradeCommand(options: {
  dryRun?: boolean;
  to?: string;
  skipBackup?: boolean;
  force?: boolean;
  listMigrations?: boolean;
}): Promise<void> {
  const cwd = process.cwd();

  // --list-migrations: print registry and exit
  if (options.listMigrations) {
    console.log(chalk.blue('Available migrations:\n'));
    for (const m of ALL_MIGRATIONS) {
      console.log(`  ${chalk.cyan(`v${m.from}`)} → ${chalk.cyan(`v${m.to}`)}`);
      console.log(`    ${chalk.gray(m.description)}`);
    }
    return;
  }

  const cliVersion = getCliVersion();
  const targetVersion = options.to ?? cliVersion;
  const projectVersion = await getProjectVersion(cwd);

  // Detect migrations needed
  let migrations: Array<{ from: string; to: string; description: string }> = [];
  try {
    migrations = getRequiredMigrations(projectVersion, targetVersion);
  } catch (err) {
    console.error(chalk.red('❌'), err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (migrations.length === 0) {
    console.log(chalk.green('✅ Already up to date'));
    console.log(chalk.gray(`   Project version: v${projectVersion}`));
    return;
  }

  // Header
  console.log(chalk.blue('\n⚠️  Project Upgrade Available\n'));
  console.log(`  Your project: ${chalk.yellow('v' + projectVersion)}`);
  console.log(`  Target version: ${chalk.green('v' + targetVersion)}`);
  console.log(`\n  Required migrations (${migrations.length}):`);
  migrations.forEach((m, i) => {
    console.log(`    ${i + 1}. ${chalk.cyan(`v${m.from}`)} → ${chalk.cyan(`v${m.to}`)}  ${chalk.gray(m.description)}`);
  });

  // Dry run
  if (options.dryRun) {
    console.log(chalk.yellow('\n  (dry run — no changes made)'));
    return;
  }

  // Confirm
  if (!options.force) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue with upgrade?',
        default: true,
      },
    ]);
    if (!proceed) {
      console.log(chalk.gray('\nUpgrade cancelled'));
      return;
    }
  }

  // Backup
  let backupPath: string | undefined;
  if (!options.skipBackup) {
    console.log(chalk.blue('\n📦 Creating backup...'));
    try {
      backupPath = await createBackup(cwd);
      console.log(chalk.green(`✓ Backup created: ${backupPath}`));
    } catch (err) {
      console.error(chalk.red('❌ Backup failed:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  } else {
    console.log(chalk.yellow('\n⚠️  Skipping backup (--skip-backup)'));
  }

  // Run migrations
  console.log(chalk.blue('\n🔧 Running migrations...\n'));
  let results: Array<{ migration: { from: string; to: string }; success: boolean; changes?: string[] }> = [];
  try {
    results = await runMigrations(cwd, migrations, {});
  } catch (err) {
    console.error(chalk.red('\n❌ Upgrade failed:'), err instanceof Error ? err.message : String(err));
    if (backupPath) {
      console.error(chalk.yellow(`\n💡 Your backup is at: ${backupPath}`));
      console.error(chalk.yellow('   Run `deepfield rollback` to restore it.'));
    }
    process.exit(1);
  }

  // Print per-migration results
  results.forEach((r, i) => {
    console.log(`[${i + 1}/${results.length}] ${chalk.cyan(`v${r.migration.from}`)} → ${chalk.cyan(`v${r.migration.to}`)}`);
    (r.changes ?? []).forEach(c => console.log(`  ${chalk.green('✓')} ${c}`));
  });

  // Summary
  const totalCreated = results.reduce((sum, r) => sum + (r.changes?.length ?? 0), 0);
  console.log(chalk.green('\n✅ Upgrade Complete!\n'));
  console.log(`  Upgraded from ${chalk.yellow('v' + projectVersion)} to ${chalk.green('v' + targetVersion)}`);
  console.log(`  Changes: ${totalCreated} files created/updated`);
  if (backupPath) {
    console.log(`  Backup: ${chalk.gray(backupPath)}`);
  }
  console.log(chalk.blue('\n💡 Next steps:'));
  console.log('  • Run `deepfield status` to verify your project');
  console.log('  • Review DEEPFIELD.md to customize preferences (if added)');
}
