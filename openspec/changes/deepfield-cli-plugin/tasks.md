## 1. Project Setup

- [x] 1.1 Create monorepo root with package.json and npm workspaces config
- [x] 1.2 Set up TypeScript configuration at root level
- [x] 1.3 Create cli/ directory structure (src/, templates/, package.json)
- [x] 1.4 Create plugin/ directory structure (.claude-plugin/, commands/, skills/)
- [x] 1.5 Configure tsconfig.json for cli/ extending root config
- [x] 1.6 Add dependencies to cli/package.json (commander, inquirer, chalk, zod, fs-extra)
- [x] 1.7 Configure build scripts (tsup/tsx) for CLI compilation
- [x] 1.8 Set up .gitignore (node_modules, dist, .DS_Store)

## 2. CLI Core Architecture

- [x] 2.1 Create cli/src/cli.ts main entry point
- [x] 2.2 Set up Commander.js program with name, description, version
- [x] 2.3 Configure binary in package.json pointing to compiled CLI
- [x] 2.4 Add version command using package.json version
- [x] 2.5 Add help command generation
- [x] 2.6 Test CLI loads and displays help correctly

## 3. CLI Templates

- [x] 3.1 Create cli/templates/project.config.json template
- [x] 3.2 Create cli/templates/run.config.json template
- [x] 3.3 Create cli/templates/brief.md comprehensive template
- [x] 3.4 Create cli/templates/project-map.md template
- [x] 3.5 Create cli/templates/domain-index.md template
- [x] 3.6 Create cli/templates/unknowns.md template
- [x] 3.7 Create cli/templates/_changelog.md template
- [x] 3.8 Configure template bundling in build process

## 4. CLI Core Logic - State Management

- [x] 4.1 Create Zod schemas for ProjectConfig in cli/src/core/schemas.ts
- [x] 4.2 Create Zod schemas for RunConfig
- [x] 4.3 Implement readState() function with Zod validation
- [x] 4.4 Implement writeState() function with atomic writes (temp-then-rename)
- [x] 4.5 Add error handling for missing/corrupted state files
- [x] 4.6 Test state read/write with valid and invalid data

## 5. CLI Core Logic - Scaffolding

- [x] 5.1 Create scaffold() function in cli/src/core/scaffold.ts
- [x] 5.2 Implement four-space directory creation (source/, wip/, drafts/, output/)
- [x] 5.3 Implement nested subdirectory creation (baseline/repos, etc.)
- [x] 5.4 Add template file copying with fs-extra
- [x] 5.5 Add permission checking before scaffolding
- [x] 5.6 Add idempotency (skip existing files)
- [x] 5.7 Return detailed result object (created files, skipped files)

## 6. CLI Core Logic - File Operations

- [x] 6.1 Create atomicWrite() utility function
- [x] 6.2 Implement write-to-temp-then-rename pattern
- [x] 6.3 Add cleanup of .tmp files on failure
- [x] 6.4 Test atomic writes with simulated failures

## 7. CLI Core Logic - File Hashing

- [x] 7.1 Create hashFiles() function in cli/src/core/hash.ts
- [x] 7.2 Implement git repo detection (check for .git/)
- [x] 7.3 Add git blob hash computation via git ls-tree
- [x] 7.4 Add MD5 hash computation for non-git files
- [x] 7.5 Return hash map (filepath -> hash)
- [x] 7.6 Test with git repos and non-git directories

## 8. CLI Command - init

- [x] 8.1 Create cli/src/commands/init.ts
- [x] 8.2 Implement deepfield/ existence checking
- [x] 8.3 Add user confirmation prompt if deepfield/ exists (inquirer)
- [x] 8.4 Call scaffold() function
- [x] 8.5 Display success message with created structure
- [x] 8.6 Display next steps (suggest `deepfield start`)
- [x] 8.7 Handle permission errors with helpful messages
- [x] 8.8 Register command with Commander in cli.ts

## 9. CLI Command - start

- [x] 9.1 Create cli/src/commands/start.ts
- [x] 9.2 Check deepfield/ existence (require init first)
- [x] 9.3 Check for existing brief.md (resumability)
- [x] 9.4 Implement Q&A with Inquirer.js (project type question)
- [x] 9.5 Add project goal question
- [x] 9.6 Add focus areas question (checkbox/multi-select)
- [x] 9.7 Generate brief.md from template with prefilled sections
- [x] 9.8 Create project.config.json with answers via writeState()
- [x] 9.9 Set timestamps (createdAt, lastModified)
- [x] 9.10 Display completion message with brief.md location
- [x] 9.11 Show next steps (fill out brief, run bootstrap in Phase 2)
- [x] 9.12 Register command with Commander in cli.ts

## 10. CLI Command - status

- [x] 10.1 Create cli/src/commands/status.ts
- [x] 10.2 Implement state detection logic (EMPTY, INITIALIZED, etc.)
- [x] 10.3 Read project.config.json via readState()
- [x] 10.4 Display project name and goal
- [x] 10.5 Display current workflow state
- [x] 10.6 Count run directories (future: Phase 2+)
- [x] 10.7 Display last modified timestamp
- [x] 10.8 Add --verbose flag handling
- [x] 10.9 In verbose mode, display all config fields
- [x] 10.10 Handle missing state files gracefully
- [x] 10.11 Suggest next action based on state
- [x] 10.12 Format output with chalk (colors, sections)
- [x] 10.13 Register command with Commander in cli.ts

## 11. CLI Error Handling

- [x] 11.1 Create custom error classes (PermissionError, StateError, etc.)
- [x] 11.2 Implement global error handler in cli.ts
- [x] 11.3 Map errors to appropriate exit codes (0, 1, 2, 3, 4)
- [x] 11.4 Add user-friendly error messages
- [x] 11.5 Hide stack traces by default (show with --debug flag)
- [x] 11.6 Test error handling for each error type

## 12. CLI Build and Package

- [x] 12.1 Configure tsup/tsx for build process
- [x] 12.2 Build CLI and verify output in dist/
- [x] 12.3 Test compiled CLI runs correctly
- [x] 12.4 Make bin/deepfield executable (chmod +x)
- [x] 12.5 Test global installation (npm link)
- [x] 12.6 Verify `deepfield --help` works globally

## 13. Plugin Structure

- [x] 13.1 Create plugin/.claude-plugin/ directory
- [x] 13.2 Create plugin.json manifest with name, version, description
- [x] 13.3 Add author information to manifest
- [x] 13.4 Create plugin/commands/ directory
- [x] 13.5 Create plugin/skills/ directory
- [x] 13.6 Add plugin/package.json (if needed for metadata)

## 14. Plugin Commands

- [x] 14.1 Create plugin/commands/df-init.md with frontmatter
- [x] 14.2 Implement wrapper calling `deepfield init`
- [x] 14.3 Add success/failure handling and Claude-friendly output
- [x] 14.4 Create plugin/commands/df-start.md
- [x] 14.5 Implement wrapper calling `deepfield start`
- [x] 14.6 Add guidance about filling brief.md
- [x] 14.7 Create plugin/commands/df-status.md
- [x] 14.8 Implement wrapper calling `deepfield status`
- [x] 14.9 Add state interpretation for Claude
- [x] 14.10 Test all commands verify CLI is available

## 15. Plugin Skill - KB Management

- [x] 15.1 Create plugin/skills/kb-management/ directory
- [x] 15.2 Create SKILL.md with frontmatter (third-person description)
- [x] 15.3 Add trigger phrases (knowledge base, kb setup, deepfield)
- [x] 15.4 Write lean skill body explaining Deepfield workflow
- [x] 15.5 Create examples/ subdirectory with usage examples
- [x] 15.6 Add init→start→status workflow example
- [x] 15.7 Add brief.md filling example
- [x] 15.8 Keep SKILL.md under 2000 words (progressive disclosure)

## 16. Documentation

- [x] 16.1 Update root README.md with monorepo structure
- [x] 16.2 Document CLI installation (npm install -g deepfield)
- [x] 16.3 Document plugin installation (link to ~/.claude/plugins/)
- [x] 16.4 Add CLI command documentation (init, start, status)
- [x] 16.5 Add examples for each command
- [x] 16.6 Document requirements (Node.js 18+, npm)
- [x] 16.7 Add troubleshooting section
- [x] 16.8 Document monorepo development (npm workspaces)
- [x] 16.9 Create cli/README.md for CLI-specific docs
- [x] 16.10 Create plugin/README.md for plugin-specific docs

## 17. Testing - CLI

- [x] 17.1 Test `deepfield init` in clean directory
- [x] 17.2 Test `deepfield init` with existing deepfield/ (idempotency)
- [x] 17.3 Test `deepfield init` with permission errors
- [x] 17.4 Test `deepfield start` after init (complete flow)
- [x] 17.5 Test `deepfield start` with existing brief.md
- [x] 17.6 Test `deepfield start` without deepfield/ (error case)
- [x] 17.7 Test `deepfield status` at each workflow state
- [x] 17.8 Test `deepfield status --verbose`
- [x] 17.9 Test error handling (missing files, corrupt JSON)
- [x] 17.10 Test atomic writes (interrupt during update)

## 18. Testing - Plugin

- [x] 18.1 Install plugin in Claude Code test environment
- [x] 18.2 Test /df-init command works
- [x] 18.3 Test /df-start command works with Q&A
- [x] 18.4 Test /df-status command works
- [x] 18.5 Verify kb-management skill loads
- [x] 18.6 Test skill triggers on knowledge base questions
- [x] 18.7 Verify plugin commands call CLI correctly
- [x] 18.8 Test error messages are Claude-friendly

## 19. Integration

- [x] 19.1 Test complete workflow: init → start → fill brief → status
- [x] 19.2 Verify CLI works standalone (without plugin)
- [x] 19.3 Verify plugin works with CLI bundled
- [x] 19.4 Test on multiple platforms (macOS, Linux)
- [x] 19.5 Verify npm workspaces setup works correctly

## 20. Polish and Cleanup

- [x] 20.1 Remove old deepfield-foundation implementation files
- [x] 20.2 Clean up any duplicate code
- [x] 20.3 Add license file (MIT)
- [x] 20.4 Add .npmignore for CLI package
- [x] 20.5 Add package keywords for npm discoverability
- [x] 20.6 Verify all error messages are helpful
- [x] 20.7 Add code comments for complex logic
- [x] 20.8 Run linter and fix issues
- [x] 20.9 Format code consistently (prettier)
- [x] 20.10 Final review of all documentation
