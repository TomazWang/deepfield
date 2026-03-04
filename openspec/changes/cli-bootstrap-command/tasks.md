## 1. Create Bootstrap Command File

- [x] 1.1 Create `cli/src/commands/bootstrap.ts` with `createBootstrapCommand()` factory function
- [x] 1.2 Add `--force`, `--yes`, and `--debug` options to the command
- [x] 1.3 Implement `validatePrerequisites()` — check deepfield/ directory exists
- [x] 1.4 Implement `validatePrerequisites()` — check project.config.json exists and has non-empty projectName
- [x] 1.5 Implement `validatePrerequisites()` — check deepfield/source/baseline/brief.md exists
- [x] 1.6 Implement `validatePrerequisites()` — check Run 0 not already completed (run-0.config.json with status "completed")
- [x] 1.7 Implement `confirmBootstrap()` — show what bootstrap will do and prompt for confirmation using inquirer
- [x] 1.8 Implement `runBootstrap()` — placeholder that logs "not yet implemented" warning
- [x] 1.9 Wire up action handler: validatePrerequisites → confirmBootstrap (unless --yes/--force) → runBootstrap → success message

## 2. Register Command in CLI

- [x] 2.1 Import `createBootstrapCommand` in `cli/src/cli.ts`
- [x] 2.2 Call `program.addCommand(createBootstrapCommand())` in `cli/src/cli.ts`

## 3. Error Handling

- [x] 3.1 Ensure all StateErrors thrown in bootstrap.ts use `core/errors.ts` StateError (not core/state.ts)
- [x] 3.2 Verify exit code 3 is used for all prerequisite failures (StateError has exitCode 3)
- [x] 3.3 Verify cancellation exits with code 0 cleanly
