# Task 001: CLI Bootstrap Command

**Feature:** Add `bootstrap` command to CLI
**Priority:** 🔴 Critical
**Status:** Not Started
**Estimated Time:** 2-4 hours
**OpenSpec Change:** `feat/cli-bootstrap-command`

---

## Objective

Add `deepfield bootstrap` command to the CLI that validates prerequisites and triggers the bootstrap skill.

---

## Current State

- CLI has: `init`, `start`, `status` commands
- CLI does NOT have: `bootstrap` command
- User gets error: `unknown command 'bootstrap'`
- Bootstrap skill exists as design doc but not implemented

---

## What to Implement

### 1. Create Bootstrap Command

**File:** `cli/src/commands/bootstrap.ts`

**Command Spec:**
```typescript
deepfield bootstrap [options]

Options:
  -f, --force     Skip confirmation prompts
  -y, --yes       Answer yes to all prompts
  --debug         Show debug output
  -h, --help      Show help
```

### 2. Prerequisites Validation

Before executing, check:
- [ ] `deepfield/` directory exists
- [ ] `deepfield/project.config.json` exists and is valid
- [ ] `deepfield/source/baseline/brief.md` exists
- [ ] Brief is filled (projectName not empty)
- [ ] Run 0 has NOT been completed (no `deepfield/wip/run-0/run-0.config.json` with status "completed")

### 3. Error Handling

**If prerequisites fail:**
- Show clear error message
- Suggest next action
- Exit with appropriate code

**Example errors:**
```
❌ Error: deepfield/ directory not found
💡 Suggestion: Run 'deepfield init' first

❌ Error: Project not configured
💡 Suggestion: Run 'deepfield start' to configure your project

❌ Error: Brief not filled out
💡 Suggestion: Fill out deepfield/source/baseline/brief.md with your project details

❌ Error: Bootstrap already completed
💡 Suggestion: Use 'deepfield iterate' or 'deepfield continue' to continue learning
```

### 4. Execution

**When prerequisites pass:**
1. Show confirmation prompt (unless --yes)
2. Display what will happen
3. Invoke bootstrap skill (Phase 2A: call script, Phase 2B: call AI skill)
4. Show progress/status
5. Report completion or errors

---

## Files to Create/Modify

### New Files
- `cli/src/commands/bootstrap.ts` - Bootstrap command implementation

### Modified Files
- `cli/src/cli.ts` - Register bootstrap command
- `cli/package.json` - Update if needed

---

## Implementation Details

### bootstrap.ts Structure

```typescript
import { Command } from 'commander';
import { checkDeepfieldExists, readProjectConfig } from '../core/state.js';
import { DeepfieldError, StateError } from '../core/errors.js';
import chalk from 'chalk';

export function createBootstrapCommand(): Command {
  const bootstrap = new Command('bootstrap')
    .description('Run initial bootstrap (Run 0) - classify sources, scan structure, detect domains')
    .option('-f, --force', 'Skip confirmation prompts', false)
    .option('-y, --yes', 'Answer yes to all prompts', false)
    .action(async (options) => {
      try {
        // 1. Check prerequisites
        await validatePrerequisites();

        // 2. Show what will happen
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
        console.log(chalk.green('✅ Bootstrap (Run 0) completed!'));
        console.log(chalk.blue('Next: Review findings in deepfield/wip/run-0/'));

      } catch (error) {
        throw error;
      }
    });

  return bootstrap;
}

async function validatePrerequisites(): Promise<void> {
  // Check deepfield/ exists
  if (!checkDeepfieldExists()) {
    throw new StateError(
      'deepfield/ directory not found',
      'Run "deepfield init" first to create the directory structure'
    );
  }

  // Check project.config.json exists and is valid
  const config = await readProjectConfig();
  if (!config.projectName) {
    throw new StateError(
      'Project not configured',
      'Run "deepfield start" to configure your project'
    );
  }

  // Check brief.md exists
  const briefPath = './deepfield/source/baseline/brief.md';
  if (!fs.existsSync(briefPath)) {
    throw new StateError(
      'Brief not found',
      'Fill out deepfield/source/baseline/brief.md with your project details'
    );
  }

  // Check Run 0 not already complete
  const run0ConfigPath = './deepfield/wip/run-0/run-0.config.json';
  if (fs.existsSync(run0ConfigPath)) {
    const run0Config = JSON.parse(fs.readFileSync(run0ConfigPath, 'utf-8'));
    if (run0Config.status === 'completed') {
      throw new StateError(
        'Bootstrap already completed',
        'Use "deepfield iterate" or "deepfield continue" to continue learning'
      );
    }
  }
}

async function confirmBootstrap(): Promise<boolean> {
  console.log(chalk.blue('\n📋 Bootstrap will:'));
  console.log('  1. Read your project brief');
  console.log('  2. Classify and organize sources');
  console.log('  3. Scan project structure');
  console.log('  4. Detect domains');
  console.log('  5. Generate initial learning plan\n');

  // Use inquirer for confirmation
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Continue with bootstrap?',
    default: true
  }]);

  return confirm;
}

async function runBootstrap(options: any): Promise<void> {
  // Phase 2A: Call bootstrap script
  // Phase 2B: Call bootstrap skill via Claude Code

  // For now, placeholder:
  console.log(chalk.yellow('⚠️  Bootstrap skill not yet implemented'));
  console.log(chalk.blue('See Task 002 for implementation'));

  // TODO: Implement actual bootstrap logic
  // - Call plugin skill
  // - Or call standalone script
  // - Handle errors
  // - Show progress
}
```

### Registering Command

**File:** `cli/src/cli.ts`

```typescript
// Add import
import { createBootstrapCommand } from './commands/bootstrap.js';

// Register command
program.addCommand(createBootstrapCommand());
```

---

## Acceptance Criteria

- [ ] `deepfield bootstrap` command exists
- [ ] `deepfield bootstrap --help` shows correct help
- [ ] Validates deepfield/ directory exists
- [ ] Validates project.config.json exists and is valid
- [ ] Validates brief.md exists
- [ ] Checks if Run 0 already completed
- [ ] Shows clear error messages with suggestions
- [ ] Prompts for confirmation (unless --yes)
- [ ] Shows what will happen before executing
- [ ] Calls bootstrap skill (or shows placeholder)
- [ ] Reports completion status
- [ ] Handles errors gracefully

---

## Testing Checklist

### Manual Testing

1. **Without deepfield/ directory:**
   ```bash
   deepfield bootstrap
   # Should error: "deepfield/ directory not found"
   ```

2. **Without project.config.json:**
   ```bash
   deepfield init
   deepfield bootstrap
   # Should error: "Project not configured"
   ```

3. **Without brief.md:**
   ```bash
   deepfield init
   deepfield start
   deepfield bootstrap
   # Should error: "Brief not found"
   ```

4. **Happy path:**
   ```bash
   deepfield init
   deepfield start
   # Fill out brief.md
   deepfield bootstrap
   # Should prompt and execute
   ```

5. **Already bootstrapped:**
   ```bash
   # After successful bootstrap
   deepfield bootstrap
   # Should error: "Bootstrap already completed"
   ```

6. **With flags:**
   ```bash
   deepfield bootstrap --yes
   # Should skip confirmation

   deepfield bootstrap --debug
   # Should show debug output
   ```

---

## Dependencies

- **Blocks:** Task 002 (Bootstrap Skill)
- **Depends on:** None (uses existing CLI infrastructure)

---

## Notes

- This task adds the CLI command only
- Actual bootstrap logic is in Task 002
- For now, command can show "not yet implemented" message
- Can be developed in parallel with Task 002
- Once Task 002 is complete, wire them together

---

## Exit Codes

- 0: Success
- 1: General error
- 2: Invalid arguments
- 3: State error (missing config, already done, etc.)
- 4: Permission error

---

## References

- Existing commands: `cli/src/commands/init.ts`, `start.ts`, `status.ts`
- Error handling: `cli/src/core/errors.ts`
- State management: `cli/src/core/state.ts`
- Design doc: `plugin/commands/df-bootstrap.md`
