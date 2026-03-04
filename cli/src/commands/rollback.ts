import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { listBackups, restoreBackup, BackupMeta } from '../utils/backup.js';

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createRollbackCommand(): Command {
  return new Command('rollback')
    .description('Restore a deepfield project backup')
    .argument('[backup-id]', 'ID of the backup to restore (e.g. backup-2026-03-04T15-30-00)')
    .option('--force', 'Skip confirmation prompts', false)
    .action(async (backupId: string | undefined, options: { force?: boolean }) => {
      try {
        await rollbackCommand(backupId, options);
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Rollback failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

async function rollbackCommand(
  backupId: string | undefined,
  options: { force?: boolean }
): Promise<void> {
  const cwd = process.cwd();

  // List available backups
  const backups = await listBackups(cwd);

  if (backups.length === 0) {
    console.error(chalk.red('❌ No backups found'));
    console.error(chalk.gray('   Backups are created automatically when you run `deepfield upgrade`'));
    process.exit(1);
  }

  let selectedBackup: BackupMeta;

  if (!backupId) {
    // Interactive selection
    console.log(chalk.blue('Available backups:\n'));
    backups.forEach((b, i) => {
      console.log(
        `  ${chalk.cyan(String(i + 1))}.  ${chalk.bold(b.id)}`
        + `  ${chalk.gray(`(v${b.version}, ${formatBytes(b.size)})`)}`
      );
    });
    console.log('');

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Which backup to restore?',
        choices: backups.map(b => ({
          name: `${b.id}  (v${b.version}, ${formatBytes(b.size)})`,
          value: b.id,
        })),
      },
    ]);
    backupId = selected as string;
    selectedBackup = backups.find(b => b.id === backupId)!;
  } else {
    const found = backups.find(b => b.id === backupId);
    if (!found) {
      console.error(chalk.red(`❌ Backup not found: ${backupId}`));
      console.error(chalk.gray('   Run `deepfield rollback` (no args) to list available backups'));
      process.exit(1);
    }
    selectedBackup = found;
  }

  // Show what will happen and confirm
  console.log(chalk.yellow('\n⚠️  Warning: This will replace your current deepfield/ with the backup\n'));
  console.log(`  Backup: ${chalk.bold(selectedBackup.id)}`);
  console.log(`  Backup version: ${chalk.yellow('v' + selectedBackup.version)}`);
  console.log(`  Backup size: ${chalk.gray(formatBytes(selectedBackup.size))}`);
  console.log('');

  if (!options.force) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue with restore?',
        default: false,
      },
    ]);
    if (!proceed) {
      console.log(chalk.gray('\nRollback cancelled'));
      return;
    }
  }

  // Restore
  console.log(chalk.blue(`\n📦 Restoring from ${selectedBackup.id}...`));
  await restoreBackup(cwd, selectedBackup.id);
  console.log(chalk.green(`\n✅ Backup restored`));
  console.log(chalk.gray(`   Your project has been rolled back to v${selectedBackup.version}`));
}
