#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import {
  DeepfieldError,
  PermissionError,
  StateError,
  ArgumentError,
  formatErrorMessage,
  getSuggestedFix
} from './core/errors.js';

// Get package.json for version
const packageJsonPath = join(dirname(__filename), '../package.json');
let version = '1.0.0';
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  version = packageJson.version;
} catch (error) {
  // Use default version if package.json not found
}

const program = new Command();

// Global options
let debugMode = false;

program
  .name('deepfield')
  .description('AI-driven knowledge base builder for understanding brownfield projects')
  .version(version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information')
  .option('--debug', 'Show debug information including stack traces', false)
  .hook('preAction', (thisCommand) => {
    debugMode = thisCommand.opts().debug;
  });

// Import commands
import { createInitCommand } from './commands/init.js';
import { createStartCommand } from './commands/start.js';
import { createStatusCommand } from './commands/status.js';

// Register commands
program.addCommand(createInitCommand());
program.addCommand(createStartCommand());
program.addCommand(createStatusCommand());

// Global error handler
process.on('uncaughtException', (error: Error) => {
  handleError(error);
});

process.on('unhandledRejection', (reason: unknown) => {
  handleError(reason instanceof Error ? reason : new Error(String(reason)));
});

function handleError(error: unknown): void {
  console.error('');

  // Determine exit code
  let exitCode = 1;
  if (error instanceof DeepfieldError) {
    exitCode = error.exitCode;
  }

  // Format error message with appropriate icon
  const errorIcon = exitCode === 4 ? '🔒' : exitCode === 3 ? '📄' : exitCode === 2 ? '⚠️' : '❌';
  console.error(chalk.red(`${errorIcon} Error:`), formatErrorMessage(error));

  // Show suggested fix
  const suggestedFix = getSuggestedFix(error);
  if (suggestedFix) {
    console.error(chalk.yellow('\n💡 Suggestion:'), suggestedFix);
  }

  // Show stack trace in debug mode
  if (debugMode && error instanceof Error && error.stack) {
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error.stack));
  }

  process.exit(exitCode);
}

program.parse(process.argv);
