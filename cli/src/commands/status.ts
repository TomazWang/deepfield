import { Command } from 'commander';
import { pathExists, readdir, readFile } from 'fs-extra';
import { join } from 'path';
import chalk from 'chalk';
import { readProjectConfig, StateError } from '../core/state.js';
import { WorkflowState } from '../core/schemas.js';
import { enforceVersionCompatibility } from '../utils/version-guard.js';

/**
 * CLI Classification (see CLAUDE.md § "Plugin vs CLI Guidelines")
 * This command belongs in the CLI layer, not the Plugin, because:
 * - It reads filesystem state deterministically (JSON config, directory listing).
 * - It must work headlessly (CI, terminal) without Claude Code running.
 * - No AI reasoning is required; all output is derived from on-disk state.
 * The Plugin has a separate /df-status command that adds AI-driven commentary.
 * Call direction for any future hybrid status feature: Plugin → CLI. Never CLI → Plugin.
 */

/**
 * Create the status command
 */
export function createStatusCommand(): Command {
  return new Command('status')
    .description('Display current project state')
    .option('-v, --verbose', 'Show detailed information', false)
    .action(async (options) => {
      await enforceVersionCompatibility(process.cwd());
      try {
        await statusCommand(options);
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * Detect current workflow state
 */
async function detectWorkflowState(deepfieldDir: string): Promise<WorkflowState> {
  // Check if deepfield/ exists
  if (!(await pathExists(deepfieldDir))) {
    return WorkflowState.EMPTY;
  }

  // Check if project.config.json exists
  const configPath = join(deepfieldDir, 'project.config.json');
  if (!(await pathExists(configPath))) {
    return WorkflowState.INITIALIZED;
  }

  // Check if brief has been filled out
  const briefPath = join(deepfieldDir, 'brief.md');
  if (await pathExists(briefPath)) {
    const briefContent = await readFile(briefPath, 'utf-8');

    // Check if brief still has template placeholders
    if (briefContent.includes('{{') || briefContent.length < 500) {
      return WorkflowState.CONFIGURED;
    }
  }

  // Check for runs
  const wipDir = join(deepfieldDir, 'wip');
  if (await pathExists(wipDir)) {
    const runs = await readdir(wipDir);
    const runDirs = runs.filter(r => r.startsWith('run-'));

    if (runDirs.length > 0) {
      // Check if any run is in progress
      // For now, if there are runs, consider it completed
      // In Phase 2+, we'll check run status from config files
      return WorkflowState.COMPLETED;
    }
  }

  return WorkflowState.READY;
}

/**
 * Format workflow state for display
 */
function formatWorkflowState(state: WorkflowState): { emoji: string; text: string; color: ((...text: unknown[]) => string) } {
  switch (state) {
    case WorkflowState.EMPTY:
      return { emoji: '⭕', text: 'Not initialized', color: chalk.gray };
    case WorkflowState.INITIALIZED:
      return { emoji: '🏗️', text: 'Initialized (no configuration)', color: chalk.yellow };
    case WorkflowState.CONFIGURED:
      return { emoji: '⚙️', text: 'Configured (brief needs filling)', color: chalk.blue };
    case WorkflowState.READY:
      return { emoji: '✅', text: 'Ready for exploration', color: chalk.green };
    case WorkflowState.IN_PROGRESS:
      return { emoji: '🔄', text: 'Exploration in progress', color: chalk.cyan };
    case WorkflowState.COMPLETED:
      return { emoji: '🎉', text: 'Completed', color: chalk.green };
    default:
      return { emoji: '❓', text: 'Unknown', color: chalk.gray };
  }
}

/**
 * Get suggested next action based on state
 */
function getSuggestedAction(state: WorkflowState): string {
  switch (state) {
    case WorkflowState.EMPTY:
      return `Run ${chalk.cyan('deepfield init')} to create the directory structure`;
    case WorkflowState.INITIALIZED:
      return `Run ${chalk.cyan('deepfield start')} to configure your project`;
    case WorkflowState.CONFIGURED:
      return `Fill out ${chalk.cyan('deepfield/brief.md')} with project context`;
    case WorkflowState.READY:
      return `Your knowledge base is ready! (Phase 2+ will add exploration commands)`;
    case WorkflowState.IN_PROGRESS:
      return `Exploration is running. Check back later for results.`;
    case WorkflowState.COMPLETED:
      return `Exploration complete. Check ${chalk.cyan('deepfield/output/')} for results.`;
    default:
      return 'Check your setup';
  }
}

/**
 * Status command implementation
 */
async function statusCommand(options: { verbose?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const deepfieldDir = join(cwd, 'deepfield');

  console.log(chalk.blue('📊 Deepfield Status\n'));

  // Detect workflow state
  const state = await detectWorkflowState(deepfieldDir);
  const stateInfo = formatWorkflowState(state);

  console.log(chalk.bold('Current State:'), stateInfo.color(stateInfo.emoji, stateInfo.text));

  // If not initialized, show simple message
  if (state === WorkflowState.EMPTY) {
    console.log(chalk.gray('\nNo deepfield/ directory found'));
    console.log(chalk.blue('\n💡 Next step:'), getSuggestedAction(state));
    return;
  }

  // Try to read project config
  let config;
  try {
    config = await readProjectConfig(deepfieldDir);

    console.log(chalk.blue('\n📁 Project Information:'));
    console.log(`  ${chalk.bold('Name:')} ${config.projectName}`);
    console.log(`  ${chalk.bold('Goal:')} ${config.goal}`);

    if (config.projectType) {
      console.log(`  ${chalk.bold('Type:')} ${config.projectType}`);
    }

    if (config.focusAreas.length > 0) {
      console.log(`  ${chalk.bold('Focus Areas:')} ${config.focusAreas.length}`);
    }

    // Show last modified
    const lastModified = new Date(config.lastModified);
    console.log(`  ${chalk.bold('Last Modified:')} ${lastModified.toLocaleString()}`);

    // Verbose mode: show all fields
    if (options.verbose) {
      console.log(chalk.blue('\n📋 Detailed Configuration:'));
      console.log(`  ${chalk.bold('Version:')} ${config.version}`);
      console.log(`  ${chalk.bold('Created:')} ${new Date(config.createdAt).toLocaleString()}`);

      if (config.focusAreas.length > 0) {
        console.log(`  ${chalk.bold('Focus Areas:')}`);
        config.focusAreas.forEach(area => {
          console.log(`    • ${area}`);
        });
      }

      if (config.repositories.length > 0) {
        console.log(`  ${chalk.bold('Repositories:')}`);
        config.repositories.forEach(repo => {
          console.log(`    • ${repo.name} (${repo.isGit ? 'git' : 'non-git'})`);
        });
      }
    }
  } catch (error) {
    if (error instanceof StateError) {
      console.log(chalk.yellow('\n⚠️  Configuration issue:'), error.message);
    }
  }

  // Count runs (Phase 2+)
  const wipDir = join(deepfieldDir, 'wip');
  if (await pathExists(wipDir)) {
    const runs = await readdir(wipDir);
    const runDirs = runs.filter(r => r.startsWith('run-'));

    if (runDirs.length > 0) {
      console.log(chalk.blue('\n🔄 Exploration Runs:'));
      console.log(`  ${chalk.bold('Total Runs:')} ${runDirs.length}`);

      if (options.verbose) {
        console.log(`  ${chalk.bold('Run Directories:')}`);
        runDirs.forEach(run => {
          console.log(`    • ${run}`);
        });
      }
    }
  }

  // Show next action
  console.log(chalk.blue('\n💡 Next step:'));
  console.log(`  ${getSuggestedAction(state)}`);

  // Directory info
  console.log(chalk.gray('\n📂 Working Directory:'), chalk.white(cwd));
  console.log(chalk.gray('📂 Knowledge Base:'), chalk.white(deepfieldDir));
}
