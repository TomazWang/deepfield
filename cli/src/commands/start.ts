import { Command } from 'commander';
import { pathExists, readFile, readJson, writeFile } from 'fs-extra';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { writeProjectConfig, StateError } from '../core/state.js';
import { ProjectConfig, StartAnswersSchema, StartAnswers } from '../core/schemas.js';
import { z } from 'zod';

/**
 * Create the start command
 */
export function createStartCommand(): Command {
  return new Command('start')
    .description('Start interactive project setup')
    .option('--non-interactive', 'Run without prompts (requires --answers-json or --answers-file)')
    .option('--answers-json <json>', 'Provide answers as JSON string')
    .option('--answers-file <path>', 'Read answers from JSON file')
    .action(async (options) => {
      try {
        await startCommand(options);
        process.exit(0);
      } catch (error) {
        if (error instanceof StateError) {
          console.error(chalk.red('❌ State error:'), error.message);
          if (error.code === 'MISSING') {
            console.error(chalk.yellow('\n💡 Hint: Run'), chalk.cyan('deepfield init'), chalk.yellow('first'));
          }
          process.exit(3);
        }
        if (error instanceof z.ZodError) {
          console.error(chalk.red('❌ Validation error:'));
          for (const err of error.errors) {
            console.error(chalk.red(`  • ${err.path.join('.')}: ${err.message}`));
          }
          console.error(chalk.yellow('\n💡 Expected JSON format:'));
          console.error(chalk.gray(JSON.stringify({
            projectName: 'My Project',
            projectType: 'legacy-brownfield',
            goal: 'Understand architecture',
            focusAreas: ['architecture', 'apis'],
            maxRuns: 5
          }, null, 2)));
          process.exit(1);
        }
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * Start command implementation
 */
async function startCommand(options: { nonInteractive?: boolean; answersJson?: string; answersFile?: string }): Promise<void> {
  const cwd = process.cwd();
  const deepfieldDir = join(cwd, 'deepfield');
  const briefPath = join(deepfieldDir, 'brief.md');

  // Check if deepfield/ exists
  if (!(await pathExists(deepfieldDir))) {
    throw new StateError(
      'deepfield/ directory not found. Run "deepfield init" first.',
      'MISSING'
    );
  }

  // Parse answers (interactive or non-interactive)
  let answers: StartAnswers;

  if (options.nonInteractive) {
    // Non-interactive mode: require answers
    if (!options.answersJson && !options.answersFile) {
      throw new Error(
        '--non-interactive requires either --answers-json or --answers-file\n' +
        'Example: deepfield start --non-interactive --answers-json \'{"projectName":"MyApp","goal":"Understand"}\'  '
      );
    }

    // Load answers from file or JSON string
    let rawAnswers: unknown;
    if (options.answersFile) {
      if (!(await pathExists(options.answersFile))) {
        throw new Error(`Answers file not found: ${options.answersFile}`);
      }
      try {
        rawAnswers = await readJson(options.answersFile);
      } catch (err) {
        throw new Error(`Failed to parse answers file: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (options.answersJson) {
      try {
        rawAnswers = JSON.parse(options.answersJson);
      } catch (err) {
        throw new Error(`Invalid JSON in --answers-json: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Validate answers
    answers = StartAnswersSchema.parse(rawAnswers);

  } else {
    // Interactive mode
    if (!process.stdin.isTTY) {
      throw new Error('Interactive mode requires a TTY. Use --non-interactive for scripting.');
    }

    console.log(chalk.blue('🎯 Deepfield Project Setup\n'));

    // Check if brief.md already has content (resumability)
    let existingBrief = false;
    if (await pathExists(briefPath)) {
      const briefContent = await readFile(briefPath, 'utf-8');
      // Check if brief has been filled out (more than just template)
      existingBrief = briefContent.length > 500 && !briefContent.includes('{{projectName}}');

      if (existingBrief) {
        console.log(chalk.yellow('⚠️  Project brief already exists'));
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Do you want to reconfigure? (This will update project.config.json)',
            default: false,
          },
        ]);

        if (!proceed) {
          console.log(chalk.gray('\nSetup cancelled. Your existing configuration is preserved.'));
          return;
        }
        console.log('');
      }
    }

    // Interactive Q&A
    console.log(chalk.gray('Please answer a few questions about your project:\n'));

    const responses = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the project name?',
        validate: (input: string) => input.trim().length > 0 || 'Project name is required',
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project is this?',
        choices: [
          { name: 'Legacy codebase (brownfield)', value: 'legacy-brownfield' },
          { name: 'New team onboarding', value: 'team-onboarding' },
          { name: 'Technical documentation', value: 'documentation' },
          { name: 'Code modernization', value: 'modernization' },
          { name: 'System integration', value: 'integration' },
          { name: 'Other', value: 'other' },
        ],
      },
      {
        type: 'input',
        name: 'goal',
        message: 'What is the main goal of this knowledge base?',
        validate: (input: string) => input.trim().length > 0 || 'Goal is required',
      },
      {
        type: 'checkbox',
        name: 'focusAreas',
        message: 'Select focus areas (use space to select):',
        choices: [
          { name: 'Architecture and design patterns', value: 'architecture' },
          { name: 'Data models and schemas', value: 'data-models' },
          { name: 'Business logic and workflows', value: 'business-logic' },
          { name: 'API endpoints and integrations', value: 'apis' },
          { name: 'Security and authentication', value: 'security' },
          { name: 'Performance and scalability', value: 'performance' },
          { name: 'Testing strategy', value: 'testing' },
          { name: 'Deployment and operations', value: 'deployment' },
        ],
      },
    ]);

    answers = responses as StartAnswers;
    console.log('');
  }

  // Create project config
  const now = new Date().toISOString();
  const config: ProjectConfig = {
    version: '1.0.0',
    projectName: answers.projectName,
    goal: answers.goal,
    projectType: answers.projectType,
    focusAreas: answers.focusAreas,
    repositories: [],
    createdAt: now,
    lastModified: now,
  };

  // Write config
  if (!options.nonInteractive) {
    console.log(chalk.gray('Saving configuration...\n'));
  }
  await writeProjectConfig(deepfieldDir, config);

  // Update brief.md with answers
  let briefTemplate = await readFile(briefPath, 'utf-8');
  briefTemplate = briefTemplate.replace(/\{\{projectName\}\}/g, answers.projectName);
  briefTemplate = briefTemplate.replace(/\{\{projectType\}\}/g, answers.projectType);
  briefTemplate = briefTemplate.replace(/\{\{goal\}\}/g, answers.goal);
  briefTemplate = briefTemplate.replace(/\{\{createdAt\}\}/g, now);

  // Replace focus areas section
  const focusAreasText = answers.focusAreas.map((area: string) => `- ${area}`).join('\n');
  briefTemplate = briefTemplate.replace(
    /\{\{#each focusAreas\}\}[\s\S]*?\{\{\/each\}\}/,
    focusAreasText
  );

  await writeFile(briefPath, briefTemplate, 'utf-8');

  // Success message
  if (options.nonInteractive) {
    // Minimal output in non-interactive mode
    console.log(JSON.stringify({ success: true, config }, null, 2));
  } else {
    console.log(chalk.green('✅ Project setup complete!'));

    console.log(chalk.blue('\n📄 Configuration saved:'));
    console.log(`  • Project: ${chalk.white(config.projectName)}`);
    console.log(`  • Type: ${chalk.white(config.projectType)}`);
    console.log(`  • Goal: ${chalk.white(config.goal)}`);
    console.log(`  • Focus: ${chalk.white(config.focusAreas.length)} area(s)`);

    console.log(chalk.blue('\n📝 Next steps:'));
    console.log(chalk.white('  1. Open'), chalk.cyan('deepfield/brief.md'), chalk.white('and fill in the details'));
    console.log(chalk.white('  2. Add context about your project, architecture, and pain points'));
    console.log(chalk.white('  3. When ready, future commands will use this brief to guide exploration'));

    console.log(chalk.blue('\n🔍 Check your progress:'));
    console.log(chalk.white('  Run'), chalk.cyan('deepfield status'), chalk.white('to see current state'));

    console.log(chalk.gray('\n💡 Tip: The brief.md is your guide for AI exploration'));
    console.log(chalk.gray('   The more context you provide, the better the knowledge base will be'));
  }
}
