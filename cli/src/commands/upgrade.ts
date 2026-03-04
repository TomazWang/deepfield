import { Command } from 'commander';
import { pathExists, readJson } from 'fs-extra';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createBackup } from '../utils/backup.js';

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

export function createUpgradeCommand(): Command {
  return new Command('upgrade')
    .description('Detect project version and create a backup (use /df-upgrade in Claude Code for AI-driven upgrade)')
    .option('--dry-run', 'Show version diff without applying any changes', false)
    .option('--to <version>', 'Target version to compare against (default: latest CLI version)')
    .option('--skip-backup', 'Skip backup creation (not recommended)', false)
    .option('--force', 'Skip confirmation prompts', false)
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
}): Promise<void> {
  const cwd = process.cwd();

  const cliVersion = getCliVersion();
  const targetVersion = options.to ?? cliVersion;
  const projectVersion = await getProjectVersion(cwd);

  // Already up to date
  if (projectVersion === targetVersion) {
    console.log(chalk.green('✅ Already up to date'));
    console.log(chalk.gray(`   Project version: v${projectVersion}`));
    return;
  }

  // Show version diff
  console.log(chalk.blue('\n⚠️  Project Upgrade Available\n'));
  console.log(`  Your project: ${chalk.yellow('v' + projectVersion)}`);
  console.log(`  Target version: ${chalk.green('v' + targetVersion)}`);

  // Dry run — just show diff, no side effects
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
        message: 'Create a backup of deepfield/ workspace?',
        default: true,
      },
    ]);
    if (!proceed) {
      console.log(chalk.gray('\nCancelled'));
      return;
    }
  }

  // Backup
  if (!options.skipBackup) {
    console.log(chalk.blue('\n📦 Creating backup...'));
    try {
      const backupPath = await createBackup(cwd);
      console.log(chalk.green(`✓ Backup created: ${backupPath}`));
      console.log('');
      console.log(chalk.blue('💡 Next step:'));
      console.log('  Open Claude Code and run:');
      console.log(chalk.cyan('    /df-upgrade'));
      console.log('');
      console.log(chalk.gray('  /df-upgrade will perform the AI-driven workspace upgrade using the backup above.'));
    } catch (err) {
      console.error(chalk.red('❌ Backup failed:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  } else {
    console.log(chalk.yellow('\n⚠️  Skipping backup (--skip-backup)'));
    console.log('');
    console.log(chalk.blue('💡 To upgrade:'));
    console.log('  Open Claude Code and run:');
    console.log(chalk.cyan('    /df-upgrade'));
    console.log('');
    console.log(chalk.red('  ⚠️  No backup was created. Upgrade at your own risk.'));
  }

  // The CLI never invokes the plugin or any AI — exit with non-zero to signal upgrade is needed
  process.exit(2);
}
