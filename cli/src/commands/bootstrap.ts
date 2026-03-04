import { Command } from 'commander';
import { pathExists, readJson } from 'fs-extra';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { StateError } from '../core/errors.js';
import { enforceVersionCompatibility } from '../utils/version-guard.js';

// Internal type for prerequisite errors with suggestions
interface PrerequisiteError {
  message: string;
  suggestion: string;
}

/**
 * Create the bootstrap command
 */
export function createBootstrapCommand(): Command {
  return new Command('bootstrap')
    .description('Run initial bootstrap (Run 0) - classify sources, scan structure, detect domains')
    .option('-f, --force', 'Skip confirmation prompts', false)
    .option('-y, --yes', 'Answer yes to all prompts', false)
    .option('--debug', 'Show debug output', false)
    .action(async (options) => {
      await enforceVersionCompatibility(process.cwd());
      try {
        await bootstrapCommand(options);
        process.exit(0);
      } catch (error) {
        if (error instanceof BootstrapStateError) {
          console.error(chalk.red('❌ Error:'), error.message);
          console.error(chalk.yellow('\n💡 Suggestion:'), error.suggestion);
          process.exit(3);
        }
        if (options.debug && error instanceof Error && error.stack) {
          console.error(chalk.gray('\nStack trace:'));
          console.error(chalk.gray(error.stack));
        }
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * Extended StateError that carries a user-facing suggestion
 */
class BootstrapStateError extends StateError {
  constructor(message: string, public readonly suggestion: string) {
    super(message, 'MISSING');
    this.name = 'BootstrapStateError';
  }
}

/**
 * Bootstrap command implementation
 */
async function bootstrapCommand(options: { force?: boolean; yes?: boolean; debug?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const deepfieldDir = join(cwd, 'deepfield');

  // 1. Validate prerequisites
  await validatePrerequisites(deepfieldDir);

  // 2. Show confirmation prompt (unless --yes or --force)
  if (!options.yes && !options.force) {
    const confirmed = await confirmBootstrap();
    if (!confirmed) {
      console.log(chalk.yellow('Bootstrap cancelled'));
      return;
    }
  }

  // 3. Run bootstrap
  await runBootstrap(options);

  // 4. Show completion
  console.log(chalk.green('\n✅ Bootstrap (Run 0) completed!'));
  console.log(chalk.blue('Next: Review findings in deepfield/wip/run-0/'));
}

/**
 * Validate all prerequisites before running bootstrap
 */
async function validatePrerequisites(deepfieldDir: string): Promise<void> {
  // Check deepfield/ directory exists
  if (!(await pathExists(deepfieldDir))) {
    throw new BootstrapStateError(
      'deepfield/ directory not found',
      'Run "deepfield init" first to create the directory structure'
    );
  }

  // Check project.config.json exists and has non-empty projectName
  const configPath = join(deepfieldDir, 'project.config.json');
  if (!(await pathExists(configPath))) {
    throw new BootstrapStateError(
      'Project not configured',
      'Run "deepfield start" to configure your project'
    );
  }

  let config: Record<string, unknown>;
  try {
    config = await readJson(configPath);
  } catch {
    throw new BootstrapStateError(
      'Project configuration is corrupted',
      'Check deepfield/project.config.json for syntax errors'
    );
  }

  if (!config.projectName || String(config.projectName).trim().length === 0) {
    throw new BootstrapStateError(
      'Project not configured',
      'Run "deepfield start" to configure your project'
    );
  }

  // Check deepfield/source/baseline/brief.md exists
  const briefPath = join(deepfieldDir, 'source', 'baseline', 'brief.md');
  if (!(await pathExists(briefPath))) {
    throw new BootstrapStateError(
      'Brief not found',
      'Fill out deepfield/source/baseline/brief.md with your project details'
    );
  }

  // Check Run 0 is not already completed
  const run0ConfigPath = join(deepfieldDir, 'wip', 'run-0', 'run-0.config.json');
  if (await pathExists(run0ConfigPath)) {
    let run0Config: Record<string, unknown>;
    try {
      run0Config = await readJson(run0ConfigPath);
    } catch {
      // If it can't be read, assume not completed — allow bootstrap to proceed
      return;
    }
    if (run0Config.status === 'completed') {
      throw new BootstrapStateError(
        'Bootstrap already completed',
        'Use "deepfield iterate" or "deepfield continue" to continue learning'
      );
    }
  }
}

/**
 * Show what bootstrap will do and prompt for confirmation
 */
async function confirmBootstrap(): Promise<boolean> {
  console.log(chalk.blue('\n📋 Bootstrap will:'));
  console.log('  1. Read your project brief');
  console.log('  2. Classify and organize sources');
  console.log('  3. Scan project structure');
  console.log('  4. Detect domains');
  console.log('  5. Generate initial learning plan\n');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Continue with bootstrap?',
      default: true,
    },
  ]);

  return confirm;
}

/**
 * Execute bootstrap logic (placeholder — Task 002 implements the actual skill)
 */
async function runBootstrap(_options: { force?: boolean; yes?: boolean; debug?: boolean }): Promise<void> {
  console.log(chalk.yellow('\n⚠️  Bootstrap skill not yet implemented'));
  console.log(chalk.blue('See Task 002 for full implementation'));
}
