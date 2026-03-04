## ADDED Requirements

### Requirement: Multi-repository domain merging
`generate-domain-index.js` SHALL accept a list of repository paths and a brief object, call `analyzeDomains` for each repository, and merge all detected domains into a unified map — summing scores and collecting sources and repo names for domains that appear across multiple repositories.

#### Scenario: Same domain found in two repos
- **WHEN** both `repo-a` and `repo-b` contain a `frontend` domain signal
- **THEN** the merged entry has `repos: ['repo-a', 'repo-b']` and a combined score

#### Scenario: Single repository provided
- **WHEN** only one repository path is given
- **THEN** the output includes all domains from that repository with `repos: ['<repo-name>']`

### Requirement: Brief hints integration
`generate-domain-index.js` SHALL extract focus areas from the brief object and add each as a domain entry with `source: 'brief-hint'` and weight 0.5, merging with any already-detected domain of the same normalized key.

#### Scenario: Brief area matches detected domain
- **WHEN** brief lists `"auth"` and the repo also has an `auth/` folder (score 0.7)
- **THEN** the merged entry has `score: 1.2` and `sources: ['folder-pattern', 'brief-hint']`

#### Scenario: Brief-only area (no repos)
- **WHEN** no repository paths are provided and brief lists `"payments"`
- **THEN** a domain entry is created with `source: 'brief-hint'`, `confidence: 'low'`

### Requirement: Domain index file generation
`generate-domain-index.js` SHALL render domain data into `domain-index.md` using the template at `plugin/templates/domain-index.md`, writing the file atomically (temp file + rename) to the output path specified by the caller.

#### Scenario: Atomic write on success
- **WHEN** domain data is ready and output path is writable
- **THEN** the file is first written to `<output-path>.tmp` then renamed to `<output-path>`

#### Scenario: Output includes detection sources
- **WHEN** a domain was detected from both `folder-pattern` and `framework-dependency`
- **THEN** the domain row in the generated markdown cites both sources

### Requirement: CLI interface
`generate-domain-index.js` SHALL accept arguments `--repos <json-array-or-path>`, `--brief <path-to-brief-json>`, and `--output <path>`, validate all inputs, and exit with code 1 on error with a descriptive message to stderr.

#### Scenario: Missing output path
- **WHEN** `--output` is not provided
- **THEN** the script exits with code 1 and prints "Error: --output is required"

#### Scenario: Repos file not found
- **WHEN** `--repos` points to a non-existent file
- **THEN** the script exits with code 1 and prints an error describing the missing file
