## ADDED Requirements

### Requirement: Confidence score SHALL be calculated from a deterministic four-component formula

The system MUST compute domain confidence using:
```
confidence = (0.40 × questions_answered) + (0.30 × evidence_strength) + (0.20 × source_coverage) + (0.10 × contradiction_resolution)
```

Where:
- `questions_answered` = answered_questions / (answered_questions + unanswered_questions + unknowns); defaults to 0.0 if denominator is 0
- `evidence_strength` = weighted average of evidence items tagged strong (1.0), medium (0.5), or weak (0.2); untagged items count as weak; defaults to 0.0 if no evidence
- `source_coverage` = analyzed_source_types / required_source_types, capped at 1.0; defaults to 0.0 if required_source_types is 0
- `contradiction_resolution` = 1 - (unresolved_contradictions / total_contradictions); defaults to 1.0 if total_contradictions is 0

Result MUST be in range [0.0, 1.0].

#### Scenario: All components present and non-zero
- **WHEN** a domain has 8 answered questions, 2 unanswered, 0 unknowns, 3 strong and 2 weak evidence items, 4 of 5 required source types analyzed, and 1 unresolved of 2 total contradictions
- **THEN** questions_answered = 8/10 = 0.80
- **THEN** evidence_strength = (3×1.0 + 2×0.2) / 5 = 3.4/5 = 0.68
- **THEN** source_coverage = 4/5 = 0.80
- **THEN** contradiction_resolution = 1 - 1/2 = 0.50
- **THEN** confidence = (0.40×0.80) + (0.30×0.68) + (0.20×0.80) + (0.10×0.50) = 0.32 + 0.204 + 0.16 + 0.05 = 0.734

#### Scenario: No contradictions defaults contradiction_resolution to 1.0
- **WHEN** a domain has zero total contradictions
- **THEN** contradiction_resolution component is 1.0
- **THEN** contradiction component contributes full 0.10 weight to score

#### Scenario: No evidence defaults evidence_strength to 0.0
- **WHEN** a domain has no evidence items tagged
- **THEN** evidence_strength component is 0.0
- **THEN** evidence component contributes 0.0 to score

#### Scenario: Untagged evidence counts as weak
- **WHEN** an evidence item has no strength tag
- **THEN** it is treated as weak (0.2) in the weighted average

### Requirement: Confidence score SHALL be able to decrease between runs

The system MUST write the newly calculated confidence score unconditionally each run, with no minimum floor based on previous run scores.

#### Scenario: New unknowns discovered in a run decrease confidence
- **WHEN** a run discovers 3 new unknowns for a domain that previously had 0 unknowns
- **THEN** questions_answered component decreases
- **THEN** the new aggregate confidence score is lower than the previous run's score
- **THEN** the decrease is reflected in wip/confidence-scores.md

#### Scenario: Confidence can increase in the same run that adds unknowns
- **WHEN** a run adds 3 new unknowns but also answers 10 previously unanswered questions
- **THEN** net questions_answered may increase
- **THEN** the formula result reflects the net change

### Requirement: Confidence breakdown SHALL be stored in wip/confidence-scores.md

The system MUST write a `wip/confidence-scores.md` file containing per-domain sections with:
- Aggregate confidence score (0.0–1.0 and percentage)
- Each component's raw inputs and computed sub-score
- Previous run's aggregate score and delta

The file MUST be overwritten (not appended) each run to reflect current state.

#### Scenario: File is created on first run
- **WHEN** calculate-confidence.js runs and wip/confidence-scores.md does not exist
- **THEN** the file is created with sections for all active domains

#### Scenario: File is overwritten on subsequent runs
- **WHEN** calculate-confidence.js runs and wip/confidence-scores.md already exists
- **THEN** the file is fully overwritten with current-run data
- **THEN** previous run's aggregate score is preserved in each domain's delta line

#### Scenario: File format includes per-domain breakdown
- **WHEN** wip/confidence-scores.md is written for a domain named "authentication"
- **THEN** it includes a section header for "authentication"
- **THEN** it shows questions_answered inputs (answered, unanswered, unknowns counts)
- **THEN** it shows evidence_strength inputs (count per tag type)
- **THEN** it shows source_coverage inputs (analyzed types, required types)
- **THEN** it shows contradiction_resolution inputs (unresolved, total counts)
- **THEN** it shows each component's sub-score and weight
- **THEN** it shows aggregate confidence as decimal and percentage
- **THEN** it shows delta from previous run with sign (e.g., "+0.05" or "-0.12")

### Requirement: Run review guides SHALL surface confidence changes

The system MUST include a confidence summary section in run review guides showing:
- Per-domain confidence score for the current run
- Delta from previous run (positive or negative)

#### Scenario: Run review guide shows confidence increase
- **WHEN** a domain's confidence increased from 0.60 to 0.72
- **THEN** run review guide shows current score 0.72 (72%)
- **THEN** run review guide shows delta +0.12

#### Scenario: Run review guide shows confidence decrease
- **WHEN** a domain's confidence decreased from 0.72 to 0.61
- **THEN** run review guide shows current score 0.61 (61%)
- **THEN** run review guide shows delta -0.11

#### Scenario: Run review guide shows no change
- **WHEN** a domain's confidence is unchanged from previous run
- **THEN** run review guide shows current score
- **THEN** run review guide shows delta 0.00
