import chalk from 'chalk';
import inquirer from 'inquirer';
import { checkProjectVersion } from './check-version.js';

/**
 * Run a version compatibility check before a project-operating command.
 *
 * - If project is behind: warn, list pending migrations, and prompt to upgrade (or skip).
 * - If project is ahead: print error and exit with code 1.
 * - If compatible or no project: do nothing.
 *
 * @param projectPath - Root of the user's project (usually process.cwd())
 */
export async function enforceVersionCompatibility(projectPath: string): Promise<void> {
  let result;
  try {
    result = await checkProjectVersion(projectPath);
  } catch {
    // Version check failure is non-fatal — let the command proceed
    return;
  }

  if (result.compatible) return;

  if (result.needsDowngrade) {
    console.error(chalk.red('\n⚠️  Version Mismatch — project is newer than this plugin\n'));
    console.error(`  Project version:  ${chalk.yellow('v' + result.projectVersion)}`);
    console.error(`  Plugin version:   ${chalk.cyan('v' + result.currentVersion)}`);
    console.error(chalk.gray('\n  Please upgrade your deepfield plugin to continue.'));
    process.exit(1);
  }

  if (result.needsUpgrade) {
    console.warn(chalk.yellow('\n⚠️  Project needs upgrade\n'));
    console.warn(`  Project version:  ${chalk.yellow('v' + result.projectVersion)}`);
    console.warn(`  Plugin version:   ${chalk.cyan('v' + result.currentVersion)}`);

    if (result.migrations && result.migrations.length > 0) {
      console.warn(`\n  Pending migrations (${result.migrations.length}):`);
      result.migrations.forEach(m => {
        console.warn(`    • v${m.from} → v${m.to}  ${chalk.gray(m.description)}`);
      });
    }

    console.warn(chalk.gray('\n  Run `deepfield upgrade` to upgrade your project.\n'));

    // Prompt user to continue anyway or abort
    let continueAnyway = false;
    try {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue without upgrading? (some features may not work correctly)',
          default: false,
        },
      ]);
      continueAnyway = proceed;
    } catch {
      // Non-interactive env — abort
    }

    if (!continueAnyway) {
      console.log(chalk.gray('Command cancelled. Run `deepfield upgrade` first.'));
      process.exit(0);
    }
  }
}
