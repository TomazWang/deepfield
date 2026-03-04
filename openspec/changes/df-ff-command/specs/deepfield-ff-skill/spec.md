## ADDED Requirements

### Requirement: deepfield-ff skill runs multiple iterations without user prompts
The `deepfield-ff` skill SHALL execute multiple learning iterations by invoking the `deepfield-iterate` skill logic in single-run (`--once`) mode repeatedly, without pausing for user feedback between runs.

#### Scenario: Multiple runs executed sequentially
- **WHEN** skill starts with max-runs=5 and confidence threshold not yet met
- **THEN** skill executes Run N, evaluates stop conditions, increments run counter, and executes Run N+1 until a stop condition fires or max-runs is reached

#### Scenario: No feedback prompts between runs
- **WHEN** a single run completes mid-loop
- **THEN** skill immediately begins the next run without asking user for input or feedback

### Requirement: deepfield-ff skill evaluates stop conditions after each run
After each completed run, the skill SHALL evaluate all stop conditions in order and stop if any condition is met.

Stop conditions in evaluation order:
1. **CONFIDENCE_REACHED**: All HIGH-priority topics (in selected domains) have confidence >= min-confidence
2. **MAX_RUNS_HIT**: Number of runs executed in this ff session >= max-runs parameter
3. **DIMINISHING_RETURNS**: Last 2 completed runs each had net confidence change < 5% across all focus topics
4. **BLOCKED**: All HIGH-priority topics in selected domains have status "blocked" AND `--stop-on-blocked` flag is set
5. **DOMAIN_RESTRUCTURE**: Domain count changed by more than 3 compared to session start

#### Scenario: Confidence threshold reached
- **WHEN** after a run, all HIGH-priority topics in scope have confidence >= min-confidence
- **THEN** skill stops with stop reason CONFIDENCE_REACHED and reports success

#### Scenario: Max runs hit
- **WHEN** the skill has executed max-runs iterations in this session
- **THEN** skill stops with stop reason MAX_RUNS_HIT even if confidence threshold not met

#### Scenario: Diminishing returns detected
- **WHEN** the last 2 consecutive runs each produced < 5% net confidence change across focus topics
- **THEN** skill stops with stop reason DIMINISHING_RETURNS

#### Scenario: Blocked with stop-on-blocked enabled
- **WHEN** all HIGH-priority topics are blocked AND --stop-on-blocked was specified
- **THEN** skill stops with stop reason BLOCKED

#### Scenario: Domain restructure detected
- **WHEN** domain count at end of a run differs from session-start domain count by more than 3
- **THEN** skill stops with stop reason DOMAIN_RESTRUCTURE

### Requirement: deepfield-ff skill reports per-run progress
After each individual run completes, the skill SHALL print a compact progress line showing: run number, topics focused, and confidence changes for those topics.

#### Scenario: Per-run progress line
- **WHEN** Run N completes within the ff loop
- **THEN** skill prints: "Run N complete | <topic>: X%→Y% | <topic>: X%→Y% | ..."

### Requirement: deepfield-ff skill prints a final summary report on stop
When the loop exits for any stop reason, the skill SHALL print a comprehensive final report including: total runs executed, stop reason with explanation, per-topic confidence table (before session → after session), questions answered/raised, and next step suggestions appropriate to the stop reason.

#### Scenario: Final report on confidence reached
- **WHEN** stop reason is CONFIDENCE_REACHED
- **THEN** report celebrates completion and suggests `/df-output` or `/df-status`

#### Scenario: Final report on max runs
- **WHEN** stop reason is MAX_RUNS_HIT
- **THEN** report shows progress made and prompts user to add feedback to staging area, then run `/df-continue`

#### Scenario: Final report on diminishing returns
- **WHEN** stop reason is DIMINISHING_RETURNS
- **THEN** report suggests adding new sources or reviewing unknowns.md

#### Scenario: Final report on blocked
- **WHEN** stop reason is BLOCKED
- **THEN** report lists which sources are needed for which blocked topics

#### Scenario: Final report on domain restructure
- **WHEN** stop reason is DOMAIN_RESTRUCTURE
- **THEN** report prompts user to review domain-index.md and confirm structure

### Requirement: deepfield-ff skill creates staging area on stop
After the loop exits (any stop reason), the skill SHALL create the next run's staging area directory with README and feedback template, identical to the staging area created by `deepfield-iterate`.

#### Scenario: Staging area created
- **WHEN** the ff loop exits after completing Run N
- **THEN** `deepfield/source/run-{N+1}-staging/` is created with `README.md` and `feedback.md` populated with current open questions

### Requirement: deepfield-ff skill optionally collects feedback at end
If `--feedback-at-end` is true (the default), after printing the final report and creating the staging area, the skill SHALL prompt the user to review the output and add feedback before the session ends.

#### Scenario: Feedback prompt shown by default
- **WHEN** ff loop completes and feedback-at-end is true
- **THEN** skill prints instructions to review `deepfield/drafts/` and add feedback to the staging directory, then run `/df-continue`

#### Scenario: Feedback prompt suppressed
- **WHEN** `--feedback-at-end false` was passed
- **THEN** skill completes without any feedback prompt

### Requirement: deepfield-ff skill validates domain filter against known domains
If `--domains` filter is provided, the skill SHALL validate the specified domain names against the domain index and warn if any specified domain does not match a known domain.

#### Scenario: Unknown domain in filter
- **WHEN** user specifies `--domains xyz` and "xyz" is not in `deepfield/wip/domain-index.md`
- **THEN** skill prints a warning "Domain 'xyz' not found in domain index. Known domains: <list>" but continues with other valid domains

#### Scenario: All specified domains unknown
- **WHEN** all domains in filter are unknown
- **THEN** skill stops with error "No valid domains found matching filter. Check /df-status for domain list."
