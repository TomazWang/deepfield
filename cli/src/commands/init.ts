import { Command } from 'commander';
import { pathExists } from 'fs-extra';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { scaffold, formatScaffoldResult, PermissionError } from '../core/scaffold.js';

/**
 * Create the init command
 */
export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize deepfield/ directory structure')
    .option('-f, --force', 'Overwrite existing files', false)
    .option('-y, --yes', 'Skip confirmation prompts', false)
    .action(async (options) => {
      try {
        await initCommand(options);
        process.exit(0);
      } catch (error) {
        if (error instanceof PermissionError) {
          console.error(chalk.red('❌ Permission denied:'), error.message);
          console.error(chalk.yellow('\n💡 Try running with sudo or check directory permissions'));
          process.exit(4);
        }
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * Init command implementation
 */
async function initCommand(options: { force?: boolean; yes?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const deepfieldDir = join(cwd, 'deepfield');

  console.log(chalk.blue('🚀 Deepfield Initialization\n'));

  // Check if deepfield/ already exists
  if (await pathExists(deepfieldDir)) {
    console.log(chalk.yellow('⚠️  deepfield/ directory already exists'));

    if (!options.yes) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Do you want to continue? (existing files will be preserved)',
          default: false,
        },
      ]);

      if (!proceed) {
        console.log(chalk.gray('\nOperation cancelled'));
        return;
      }
    }

    console.log('');
  }

  // Run scaffold
  console.log(chalk.gray('Creating directory structure...\n'));

  const result = await scaffold(cwd, { force: options.force });

  // Display result
  console.log(formatScaffoldResult(result));

  // Check for errors
  if (result.errors.length > 0) {
    console.log(chalk.red(`\n❌ Initialization completed with ${result.errors.length} error(s)`));
    process.exit(1);
  }

  // Success message
  console.log(chalk.green('\n✅ Deepfield initialized successfully!'));

  console.log(chalk.blue('\n📋 Directory structure created:'));
  console.log('  deepfield/');
  console.log('  ├── source/          # Source materials and baselines');
  console.log('  ├── wip/             # Work in progress (active runs)');
  console.log('  ├── drafts/          # Draft documents and notes');
  console.log('  └── output/          # Final knowledge base artifacts');

  console.log(chalk.blue('\n📝 Template files created:'));
  console.log('  • project.config.json  # Project configuration');
  console.log('  • brief.md            # Project brief and context');
  console.log('  • project-map.md      # Structural map');
  console.log('  • domain-index.md     # Domain organization');
  console.log('  • unknowns.md         # Questions and uncertainties');
  console.log('  • _changelog.md       # Run history');

  console.log(chalk.green('\n🎯 Next steps:'));
  console.log(chalk.white('  1. Run'), chalk.cyan('deepfield start'), chalk.white('to begin interactive setup'));
  console.log(chalk.white('  2. Fill out the'), chalk.cyan('brief.md'), chalk.white('with project context'));
  console.log(chalk.white('  3. Use'), chalk.cyan('deepfield status'), chalk.white('to check your progress'));

  console.log(chalk.gray('\n💡 Tip: The deepfield/ directory is your knowledge base workspace'));
}
