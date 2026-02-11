## ADDED Requirements

### Requirement: Generate initial learning plan

The system SHALL generate a learning plan during bootstrap (Run 0) that identifies topics to explore, sets initial priorities, and establishes baseline confidence levels.

#### Scenario: Generate plan from brief
- **WHEN** bootstrap reads filled brief.md with project context and focus areas
- **THEN** system generates learning plan with topics derived from brief and project structure

#### Scenario: Set initial priorities
- **WHEN** generating initial plan
- **THEN** system sets priorities (HIGH/MEDIUM/LOW) based on user-specified focus areas in brief.md

#### Scenario: Establish baseline confidence
- **WHEN** generating initial plan after shallow scan
- **THEN** system sets initial confidence levels (0-100%) based on structural understanding

### Requirement: Track topic confidence levels

The system SHALL track confidence levels (0-100%) for each topic in the learning plan and update them after each learning run.

#### Scenario: Update confidence after learning
- **WHEN** run completes with new findings about a topic
- **THEN** system increases confidence level based on depth of understanding gained

#### Scenario: Maintain confidence on unchanged topics
- **WHEN** run does not focus on a specific topic
- **THEN** system maintains previous confidence level for that topic

#### Scenario: Decrease confidence on contradictions
- **WHEN** run discovers contradictions in previous understanding
- **THEN** system decreases confidence level and documents contradiction

### Requirement: Maintain open questions per topic

The system SHALL maintain a list of open questions for each topic that drives focus selection and identifies knowledge gaps.

#### Scenario: Add questions during bootstrap
- **WHEN** bootstrap scan reveals unknowns
- **THEN** system adds open questions to relevant topics in learning plan

#### Scenario: Answer questions during learning
- **WHEN** run resolves an open question
- **THEN** system marks question as answered and updates confidence

#### Scenario: Generate new questions during learning
- **WHEN** run discovers new complexity or contradictions
- **THEN** system adds new questions to learning plan

### Requirement: Track required sources per topic

The system SHALL track which sources are needed to complete each topic and identify blocking gaps.

#### Scenario: List needed sources
- **WHEN** topic has open questions
- **THEN** system lists which sources would answer those questions

#### Scenario: Mark sources as available
- **WHEN** user adds a needed source
- **THEN** system marks that source as available for next run

#### Scenario: Identify blocking gaps
- **WHEN** all HIGH priority topics need unavailable sources
- **THEN** system reports as blocked and suggests which sources to add

### Requirement: Reprioritize topics across runs

The system SHALL reprioritize topics after each run based on findings, confidence levels, and dependencies discovered.

#### Scenario: Promote dependent topics
- **WHEN** learning one topic reveals it depends on another
- **THEN** system increases priority of dependency topic

#### Scenario: Deprioritize completed topics
- **WHEN** topic reaches high confidence (>80%) and has no open questions
- **THEN** system lowers priority to allow focus on other topics

#### Scenario: Maintain user priorities
- **WHEN** user explicitly set topic priority in brief.md
- **THEN** system respects user priority unless dependency requires change

### Requirement: Evolve plan structure as understanding grows

The system SHALL add newly discovered topics and decompose overly broad topics as understanding deepens.

#### Scenario: Add discovered topics
- **WHEN** learning reveals new architectural concern not in initial plan
- **THEN** system adds new topic to plan with appropriate priority

#### Scenario: Decompose broad topics
- **WHEN** topic proves too large after exploration (e.g., "backend" splits into "auth", "api", "data")
- **THEN** system decomposes into focused sub-topics

#### Scenario: Merge narrow topics
- **WHEN** multiple topics prove to be same concern
- **THEN** system merges topics and combines confidence/questions

### Requirement: Determine plan completion

The system SHALL determine when learning plan is complete based on confidence thresholds and open questions.

#### Scenario: Plan complete on HIGH priority confidence
- **WHEN** all HIGH priority topics reach >80% confidence
- **THEN** system reports plan complete

#### Scenario: Plan incomplete with low confidence
- **WHEN** any HIGH priority topic remains below 80% confidence
- **THEN** system continues learning focused on low-confidence topics

#### Scenario: Plan complete with acceptable gaps
- **WHEN** remaining open questions are for LOW priority topics only
- **THEN** system reports plan complete and documents acceptable gaps
