## 1. Plugin Structure Setup

- [x] 1.1 Create .claude/plugins/deepfield/ directory structure
- [x] 1.2 Create plugin.json manifest with metadata, version, and commands list
- [x] 1.3 Create commands/ directory for command markdown files
- [x] 1.4 Create scripts/ directory for utility scripts
- [x] 1.5 Create templates/ directory for config and markdown templates
- [x] 1.6 Verify CLAUDE_PLUGIN_ROOT variable usage in all paths

## 2. Core Scripts - File Operations

- [x] 2.1 Implement scripts/mkdir-recursive.sh for directory creation
- [x] 2.2 Add permission checking to mkdir-recursive.sh
- [x] 2.3 Implement scripts/update-json.js with atomic write pattern (temp-then-rename)
- [x] 2.4 Implement scripts/read-state.js with default value support
- [x] 2.5 Add JSON schema validation to read-state.js
- [x] 2.6 Implement scripts/hash-files.js with git blob hash support
- [x] 2.7 Add MD5 hashing support to hash-files.js for non-git files
- [x] 2.8 Add error handling and exit codes to all scripts
- [x] 2.9 Add stderr output for error messages in all scripts

## 3. Core Scripts - Scaffolding

- [x] 3.1 Implement scripts/scaffold-kb.sh to create kb/ directory structure
- [x] 3.2 Add four-space directory creation (source/, wip/, drafts/, output/)
- [x] 3.3 Create nested subdirectories (baseline/repos, baseline/trusted-docs, etc.)
- [x] 3.4 Add idempotency checks (don't overwrite existing files)
- [x] 3.5 Add permission verification before scaffolding
- [x] 3.6 Return meaningful status codes from scaffold-kb.sh

## 4. Templates

- [x] 4.1 Create templates/project.config.json with schema structure and field descriptions
- [x] 4.2 Create templates/run.config.json with run metadata structure
- [x] 4.3 Create templates/brief.md with all sections and placeholders
- [x] 4.4 Create templates/project-map.md with usage instructions
- [x] 4.5 Create templates/domain-index.md with decomposition explanation
- [x] 4.6 Create templates/unknowns.md with purpose header
- [x] 4.7 Create templates/_changelog.md (empty with header)

## 5. Command: /df-init

- [x] 5.1 Create commands/df-init.md with command frontmatter
- [x] 5.2 Add state validation (check if kb/ already exists)
- [x] 5.3 Implement user confirmation prompt for existing kb/
- [x] 5.4 Call scaffold-kb.sh script for directory creation
- [x] 5.5 Copy template files to kb/ directory
- [x] 5.6 Display initialization summary with created structure
- [x] 5.7 Show next steps (suggest /df-start)
- [x] 5.8 Add error handling for permission issues

## 6. Command: /df-start

- [x] 6.1 Create commands/df-start.md with command frontmatter
- [x] 6.2 Add kb/ existence check (require /df-init first)
- [x] 6.3 Implement interactive Q&A using AskUserQuestion tool
- [x] 6.4 Ask: "What is this project?"
- [x] 6.5 Ask: "What's your goal for this knowledge base?"
- [x] 6.6 Ask: "Any specific areas of concern?"
- [x] 6.7 Generate brief.md with Q&A answers prefilled
- [x] 6.8 Create project.config.json with user's answers via update-json.js
- [x] 6.9 Set timestamps (createdAt, lastModified) in config
- [x] 6.10 Add resumability check (detect existing brief.md)
- [x] 6.11 Prompt user for overwrite/keep/update if brief exists
- [x] 6.12 Display completion message with brief.md location
- [x] 6.13 Show next steps (fill out brief, mention /df-bootstrap for Phase 2)

## 7. Command: /df-status

- [x] 7.1 Create commands/df-status.md with command frontmatter
- [x] 7.2 Implement state detection logic (EMPTY, INITIALIZED, BRIEF_CREATED, etc.)
- [x] 7.3 Read project.config.json using read-state.js
- [x] 7.4 Display project name and goal
- [x] 7.5 Display current workflow state
- [x] 7.6 Display run count (count run-N directories in wip/)
- [x] 7.7 Display last modified timestamp
- [x] 7.8 Add --verbose flag support for detailed output
- [x] 7.9 In verbose mode, display all config fields
- [x] 7.10 In verbose mode, list source files
- [x] 7.11 Handle missing state files gracefully (show error + suggestion)
- [x] 7.12 Suggest next action based on current state
- [x] 7.13 Format output with clear sections and alignment

## 8. State Management Utilities

- [x] 8.1 Implement state file schema validation in read-state.js
- [x] 8.2 Add version field handling in all JSON operations
- [x] 8.3 Add automatic lastModified timestamp updates in update-json.js
- [x] 8.4 Ensure 2-space JSON formatting in all writes
- [x] 8.5 Test atomic write operations (verify temp-then-rename)

## 9. Documentation

- [x] 9.1 Update README.md with Phase 1 implementation status
- [x] 9.2 Document /df-init command usage and options
- [x] 9.3 Document /df-start command usage and interactive flow
- [x] 9.4 Document /df-status command usage and flags
- [x] 9.5 Document script dependencies (Node.js v16+)
- [x] 9.6 Document kb/ directory structure and file purposes
- [x] 9.7 Add troubleshooting section for common errors
- [x] 9.8 Document workflow states and transitions

## 10. Testing and Validation

- [ ] 10.1 Test /df-init in clean directory (happy path)
- [ ] 10.2 Test /df-init with existing kb/ (idempotency)
- [ ] 10.3 Test /df-init with permission errors
- [ ] 10.4 Test /df-start after /df-init (complete flow)
- [ ] 10.5 Test /df-start with cancellation during Q&A
- [ ] 10.6 Test /df-start with existing brief.md (resumability)
- [ ] 10.7 Test /df-status at each workflow state
- [ ] 10.8 Test /df-status with missing state files
- [ ] 10.9 Test /df-status --verbose mode
- [ ] 10.10 Test script error handling (permission denied, disk full, etc.)
- [ ] 10.11 Verify atomic writes (interrupt during update)
- [ ] 10.12 Test file hashing for git and non-git files
- [ ] 10.13 Verify JSON schema validation catches malformed state
- [ ] 10.14 Test complete workflow: init → start → fill brief → status

## 11. Polish and Refinement

- [ ] 11.1 Add helpful error messages for all failure scenarios
- [ ] 11.2 Improve output formatting (colors, alignment, clarity)
- [ ] 11.3 Add progress indicators for long operations
- [ ] 11.4 Optimize script performance (avoid unnecessary file reads)
- [ ] 11.5 Add validation for edge cases (empty answers, special characters)
- [ ] 11.6 Review all user-facing messages for clarity
- [ ] 11.7 Ensure consistent terminology across commands and docs
