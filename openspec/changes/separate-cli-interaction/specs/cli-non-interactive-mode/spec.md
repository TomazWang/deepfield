## ADDED Requirements

### Requirement: CLI SHALL support --non-interactive flag

All CLI commands that normally prompt for user input SHALL support a `--non-interactive` flag that disables interactive prompts.

#### Scenario: Run command with --non-interactive flag
- **WHEN** user runs `deepfield start --non-interactive`
- **THEN** command executes without prompting for stdin
- **THEN** command uses default values or provided answers
- **THEN** command completes or exits with error if required input missing

#### Scenario: Non-interactive mode without required input
- **WHEN** command runs with --non-interactive but lacks required answers
- **THEN** command exits with code 1
- **THEN** error message lists required inputs
- **THEN** error message explains how to provide inputs (--answers-json flag)

### Requirement: CLI SHALL support --answers-json flag

CLI commands SHALL accept structured answers via `--answers-json` flag for non-interactive execution.

#### Scenario: Provide answers as JSON string
- **WHEN** user runs `deepfield start --non-interactive --answers-json '{"projectType":"legacy","goal":"understand","maxRuns":5}'`
- **THEN** CLI parses JSON string
- **THEN** CLI uses provided answers instead of prompting
- **THEN** CLI validates answer format and values
- **THEN** CLI proceeds with answers if valid

#### Scenario: Invalid JSON format
- **WHEN** user provides malformed JSON to --answers-json
- **THEN** CLI exits with code 1
- **THEN** error message shows JSON parsing error
- **THEN** error message shows expected JSON structure example

#### Scenario: Missing required fields in JSON
- **WHEN** JSON lacks required answer fields
- **THEN** CLI exits with code 1
- **THEN** error message lists missing required fields
- **THEN** error message shows complete JSON structure example

#### Scenario: Invalid values in JSON
- **WHEN** JSON has invalid values (e.g., maxRuns: -1)
- **THEN** CLI exits with code 1
- **THEN** error message describes validation error
- **THEN** error message shows valid value options

### Requirement: CLI SHALL support --answers-file flag

CLI commands SHALL accept answers from a JSON file via `--answers-file` flag.

#### Scenario: Provide answers from file
- **WHEN** user runs `deepfield start --non-interactive --answers-file answers.json`
- **THEN** CLI reads JSON from file
- **THEN** CLI parses and validates file content
- **THEN** CLI uses file answers instead of prompting
- **THEN** CLI proceeds with answers if valid

#### Scenario: Answers file does not exist
- **WHEN** specified answers file path doesn't exist
- **THEN** CLI exits with code 1
- **THEN** error message shows file not found error
- **THEN** error message shows expected file path

#### Scenario: Answers file is not readable
- **WHEN** answers file exists but lacks read permissions
- **THEN** CLI exits with code 1
- **THEN** error message shows permission error
- **THEN** error message suggests checking file permissions

### Requirement: CLI SHALL document JSON answer schema

CLI commands SHALL provide clear documentation of the JSON answer schema expected by --answers-json.

#### Scenario: Show help with answer schema
- **WHEN** user runs `deepfield start --help`
- **THEN** help text includes --answers-json flag description
- **THEN** help text shows example JSON structure
- **THEN** help text lists required and optional fields
- **THEN** help text shows valid values for each field

#### Scenario: Show answer schema on validation error
- **WHEN** CLI rejects answers due to validation error
- **THEN** error message includes correct JSON schema
- **THEN** schema shows all required fields
- **THEN** schema shows valid value examples

### Requirement: Non-interactive mode SHALL be idempotent

CLI commands in non-interactive mode SHALL produce consistent results when run with same answers.

#### Scenario: Repeat non-interactive command with same answers
- **WHEN** user runs command twice with identical answers
- **THEN** both executions produce same result
- **THEN** no prompts appear in either execution
- **THEN** exit codes are consistent

### Requirement: CLI interactive mode SHALL remain unchanged

Running CLI without --non-interactive flag SHALL preserve existing interactive behavior for direct terminal use.

#### Scenario: Run command without --non-interactive flag
- **WHEN** user runs `deepfield start` (no flags)
- **THEN** CLI prompts for input using interactive prompts
- **THEN** user interaction works as before
- **THEN** backward compatibility maintained

#### Scenario: Terminal user experience unchanged
- **WHEN** terminal user runs interactive CLI
- **THEN** prompt UI shows as before (inquirer/readline)
- **THEN** all interactive features work (arrow keys, validation)
- **THEN** no behavioral changes from user perspective
