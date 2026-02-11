## ADDED Requirements

### Requirement: Execute multiple runs autonomously

The system SHALL execute multiple learning runs (N, N+1, N+2...) in a single command invocation without user intervention until a stop condition is met.

#### Scenario: Multi-run execution
- **WHEN** user runs `/df-continue` in LEARNING state
- **THEN** system executes Run N, evaluates continuation, and automatically proceeds to Run N+1 if conditions allow

#### Scenario: Sequential run execution
- **WHEN** Run N completes successfully
- **THEN** system immediately begins Run N+1 without returning control to user

#### Scenario: Single run mode
- **WHEN** user runs `/df-continue --once`
- **THEN** system executes single run and stops regardless of continuation conditions

### Requirement: Select focus topics from learning plan

The system SHALL select HIGH priority topics with lowest confidence from the learning plan to focus each run.

#### Scenario: Focus on lowest confidence HIGH priority
- **WHEN** selecting topics for run
- **THEN** system prioritizes HIGH priority topics with confidence <80%

#### Scenario: Multiple topic focus
- **WHEN** multiple HIGH priority topics have similar low confidence
- **THEN** system selects up to 3 related topics to explore together

#### Scenario: Dependency-driven focus
- **WHEN** topic depends on another low-confidence topic
- **THEN** system focuses on dependency first

### Requirement: Load context before deep reading

The system SHALL load relevant context (domain notes, previous findings, current drafts) before performing deep reads to maintain continuity.

#### Scenario: Load domain notes
- **WHEN** focusing on topics in specific domain
- **THEN** system reads `wip/domains/<domain>-notes.md` for prior knowledge

#### Scenario: Load previous findings
- **WHEN** continuing topic from previous run
- **THEN** system reads relevant sections from `wip/run-N-1/findings.md`

#### Scenario: Load current drafts
- **WHEN** updating existing documentation
- **THEN** system reads current state of `drafts/<topic>.md`

### Requirement: Perform deep reads on focused files

The system SHALL deeply read files relevant to focus topics, connecting concepts across sources and identifying patterns.

#### Scenario: Deep read relevant files
- **WHEN** focusing on authentication topic
- **THEN** system deeply reads all files classified as relevant to authentication

#### Scenario: Cross-reference findings
- **WHEN** reading multiple files for same topic
- **THEN** system connects related concepts and identifies patterns or contradictions

#### Scenario: Limit deep read scope
- **WHEN** repository has thousands of files
- **THEN** system limits deep reads to files relevant to current focus topics

### Requirement: Write findings for current run only

The system SHALL write findings from current run to `wip/run-N/findings.md` containing only new discoveries from this run.

#### Scenario: Document new discoveries
- **WHEN** run identifies new understanding
- **THEN** system writes to `wip/run-N/findings.md` with topic, discovery, and source references

#### Scenario: Separate run findings
- **WHEN** multiple runs execute
- **THEN** system maintains separate findings.md file per run (not cumulative)

#### Scenario: Link to sources
- **WHEN** writing findings
- **THEN** system includes file paths and line numbers as evidence

### Requirement: Evaluate stop conditions after each run

The system SHALL evaluate stop conditions after each run to determine if autonomous execution should continue or pause.

#### Scenario: Continue on progress
- **WHEN** run produces meaningful findings and HIGH priority topics remain <80% confidence
- **THEN** system continues to next run

#### Scenario: Stop on plan completion
- **WHEN** all HIGH priority topics reach >80% confidence
- **THEN** system stops and reports learning plan complete

#### Scenario: Stop on max runs
- **WHEN** configured max consecutive runs is reached
- **THEN** system pauses and prompts user to review before continuing

#### Scenario: Stop on missing sources
- **WHEN** all HIGH priority topics are blocked by unavailable sources
- **THEN** system pauses and lists needed sources

#### Scenario: Stop on diminishing returns
- **WHEN** 2+ consecutive runs produce minimal new findings
- **THEN** system pauses and suggests reviewing plan or adding sources

#### Scenario: Pause on major domain changes
- **WHEN** domain structure changes significantly (topics added/decomposed)
- **THEN** system pauses and asks user to confirm new structure

### Requirement: Create staging area after each run

The system SHALL automatically create `source/run-N+1-staging/` directory with templates after each run to collect user feedback and new sources.

#### Scenario: Create staging directory
- **WHEN** Run N completes
- **THEN** system creates `source/run-N+1-staging/` with README, feedback.md template, and sources/ subfolder

#### Scenario: Populate staging README
- **WHEN** creating staging area
- **THEN** system writes README with instructions for adding feedback and sources

#### Scenario: Generate feedback template
- **WHEN** creating staging area with open questions
- **THEN** system populates feedback.md with specific questions from learning plan

### Requirement: Report progress after autonomous execution

The system SHALL report comprehensive summary after autonomous execution completes, showing runs executed, confidence changes, and next steps.

#### Scenario: Report runs completed
- **WHEN** autonomous execution stops
- **THEN** system reports number of runs executed and stop reason

#### Scenario: Show confidence changes
- **WHEN** reporting progress
- **THEN** system shows before/after confidence levels for each topic

#### Scenario: Highlight open questions
- **WHEN** paused on missing sources
- **THEN** system lists specific questions and which sources would help

#### Scenario: Suggest next actions
- **WHEN** reporting completion
- **THEN** system suggests `/df-distill`, `/df-continue`, or `/df-restart` based on state
