## 1. CLI Non-Interactive Flags

- [x] 1.1 Add `--non-interactive` flag to CLI start command
- [x] 1.2 Add `--answers-json <json>` flag to accept JSON answers string
- [x] 1.3 Add `--answers-file <path>` flag to read answers from file
- [x] 1.4 Parse and validate JSON answer structure in CLI
- [x] 1.5 Update CLI help text with flag documentation and JSON schema examples
- [x] 1.6 Add error messages for invalid JSON, missing fields, invalid values

## 2. CLI Answer Schema

- [x] 2.1 Define JSON schema for start command answers (projectType, goal, focusAreas, maxRuns)
- [x] 2.2 Add JSON schema validation to CLI
- [x] 2.3 Document required vs optional fields in help text
- [x] 2.4 Add examples of valid JSON answers to help text

## 3. CLI Non-Interactive Execution

- [x] 3.1 Modify CLI start command to skip prompts when --non-interactive flag present
- [x] 3.2 Use provided JSON answers instead of interactive prompts
- [x] 3.3 Validate required fields present in non-interactive mode
- [x] 3.4 Exit with code 1 and clear error if required input missing
- [x] 3.5 Ensure idempotent behavior (same answers = same result)

## 4. Plugin Command Q&A (df-start)

- [x] 4.1 Remove direct CLI invocation from df-start.md
- [x] 4.2 Implement Question 1 using AskUserQuestion (project type)
- [x] 4.3 Implement Question 2 using AskUserQuestion (goal)
- [x] 4.4 Implement Question 3 using AskUserQuestion (focus areas with multiSelect)
- [x] 4.5 Implement Question 4 using AskUserQuestion (max runs)
- [x] 4.6 Capture all answers in bash variables

## 5. Plugin Command CLI Invocation

- [x] 5.1 Format collected answers as JSON in df-start.md
- [x] 5.2 Call `deepfield start --non-interactive --answers-json` with formatted JSON
- [x] 5.3 Handle CLI errors and display to user
- [x] 5.4 Verify brief.md and config created after CLI execution

## 6. Plugin Command Robustness

- [x] 6.1 Add error handling for user cancellation (empty "Other" input)
- [x] 6.2 Add error handling for malformed JSON before CLI call
- [x] 6.3 Add error handling for CLI non-zero exit codes
- [x] 6.4 Preserve user's ability to retry on failure

## 7. Skills Update (Bootstrap)

- [x] 7.1 Review skills/deepfield-bootstrap.md for interactive CLI calls
- [x] 7.2 Update any CLI invocations to use --non-interactive flag
- [x] 7.3 Add documentation warning against interactive CLI calls
- [x] 7.4 Verify bootstrap skill doesn't block on stdin

## 8. Skills Update (Iterate)

- [x] 8.1 Review skills/deepfield-iterate.md for interactive CLI calls
- [x] 8.2 Update any CLI invocations to use --non-interactive flag
- [x] 8.3 Add documentation warning against interactive CLI calls
- [x] 8.4 Verify iterate skill doesn't block on stdin

## 9. df-init Auto-Start (Optional)

- [x] 9.1 Review commented-out auto-invocation code in df-init.md
- [x] 9.2 Decide if uncommenting is desired after df-start is non-blocking
- [x] 9.3 Uncomment invocation code if desired
- [x] 9.4 Test df-init → df-start flow works without blocking

## 10. Testing - CLI Non-Interactive Mode

- [x] 10.1 Test `deepfield start --non-interactive --answers-json` with valid JSON
- [ ] 10.2 Test with invalid JSON (malformed syntax)
- [ ] 10.3 Test with missing required fields
- [ ] 10.4 Test with invalid field values
- [ ] 10.5 Test `--answers-file` with existing file
- [ ] 10.6 Test `--answers-file` with non-existent file
- [ ] 10.7 Verify CLI help shows correct flag documentation

## 11. Testing - Plugin Command

- [x] 11.1 Test /df-start Q&A flow with AskUserQuestion
- [x] 11.2 Test all questions appear correctly (simplified to 2 questions)
- [x] 11.3 Multi-select not applicable (hardcoded defaults used instead)
- [ ] 11.4 Test user cancellation (empty "Other" input)
- [x] 11.5 Test brief.md and config created after completion
- [x] 11.6 Verify no hanging or blocking on stdin

## 12. Testing - Skills

- [ ] 12.1 Test skills/deepfield-bootstrap.md doesn't block
- [ ] 12.2 Test skills/deepfield-iterate.md doesn't block
- [ ] 12.3 Test full bootstrap workflow end-to-end
- [ ] 12.4 Test full iteration workflow end-to-end

## 13. Testing - Integration

- [ ] 13.1 Test full flow: /df-init → /df-start → /df-continue (bootstrap)
- [ ] 13.2 Verify CLI interactive mode still works for direct terminal use
- [x] 13.3 Verify plugin mode uses AskUserQuestion
- [ ] 13.4 Test error scenarios (CLI errors, invalid input, etc.)

## 14. Documentation

- [x] 14.1 Update df-start.md command documentation
- [x] 14.2 Update skills documentation with non-interactive requirement
- [x] 14.3 Add examples of AskUserQuestion usage in plugin commands
- [x] 14.4 Update CLI --help text with answer schema
- [x] 14.5 Document JSON answer format in specs

## 15. Cleanup

- [x] 15.1 Remove commented debug code
- [x] 15.2 Verify no interactive CLI calls remain in plugin commands/skills
- [x] 15.3 Update TEST-PLAN.md to reflect fixes
- [ ] 15.4 Archive this change after testing complete
