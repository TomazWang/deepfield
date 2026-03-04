## ADDED Requirements

### Requirement: Review guide generated after each run
The system SHALL generate `deepfield/wip/run-N/review-guide.md` at the end of every run. A new review guide file is created per run and is never overwritten.

#### Scenario: Review guide created after bootstrap
- **WHEN** Run 0 (bootstrap) completes
- **THEN** `deepfield/wip/run-0/review-guide.md` is created

#### Scenario: Review guide created after iterate run
- **WHEN** Iterate run N completes
- **THEN** `deepfield/wip/run-N/review-guide.md` is created

### Requirement: Review guide contains what was learned summary
The review guide SHALL include a "What Was Learned" section that lists the focus topics for the run, key findings per topic, and the number of files scanned.

#### Scenario: Learned summary reflects run activity
- **WHEN** run 2 focused on authentication and API structure
- **THEN** `wip/run-2/review-guide.md` "What Was Learned" section lists authentication and API structure with their key findings

### Requirement: Review guide contains tiered review priorities
The review guide SHALL include a "Review Priorities" section with HIGH, MEDIUM, and LOW tiers. HIGH = new findings that contradict existing knowledge or resolve long-standing unknowns. MEDIUM = new facts with confidence delta > 20%. LOW = minor additions or confidence bumps ≤ 20%.

#### Scenario: Contradiction flagged as HIGH priority
- **WHEN** a finding contradicts a previously documented fact
- **THEN** it appears under HIGH priority in the review guide

#### Scenario: Moderate confidence gain is MEDIUM
- **WHEN** a domain's confidence increases by 25% in a run
- **THEN** it appears under MEDIUM priority in the review guide

#### Scenario: Small confidence bump is LOW
- **WHEN** a domain's confidence increases by 10% in a run
- **THEN** it appears under LOW priority in the review guide

### Requirement: Review guide contains questions needing user input
The review guide SHALL include a "Questions for You" section listing open questions that cannot be resolved from available sources, sourced from the run's findings and the current unknowns.

#### Scenario: Open questions surfaced
- **WHEN** the learning agent logged an unresolved question during run N
- **THEN** that question appears in the "Questions for You" section of `wip/run-N/review-guide.md`

### Requirement: Review guide contains next steps
The review guide SHALL include a "Next Steps" section recommending whether to continue iterating, add new sources, or review specific drafts before continuing.

#### Scenario: Next steps recommendation present
- **WHEN** `wip/run-N/review-guide.md` is generated
- **THEN** it contains a "Next Steps" section with at least one recommended action
