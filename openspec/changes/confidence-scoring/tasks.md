## 1. Script: calculate-confidence.js

- [ ] 1.1 Create `plugin/scripts/calculate-confidence.js` with four-component formula implementation
- [ ] 1.2 Implement `questionsAnswered(answered, unanswered, unknowns)` helper returning 0.0–1.0
- [ ] 1.3 Implement `evidenceStrength(evidenceByStrength)` helper with strong=1.0, medium=0.5, weak=0.2 weighted average; untagged defaults to weak
- [ ] 1.4 Implement `sourceCoverage(analyzed, required)` helper capped at 1.0; return 0.0 if required is 0
- [ ] 1.5 Implement `contradictionResolution(unresolved, total)` helper; return 1.0 if total is 0
- [ ] 1.6 Implement `calculateConfidence(inputs)` combining four components with weights 0.40/0.30/0.20/0.10
- [ ] 1.7 Add CLI interface: accepts domain inputs JSON file path, writes results to wip/confidence-scores.md
- [ ] 1.8 Ensure output score is clamped to [0.0, 1.0]

## 2. State Management: run config schema update

- [ ] 2.1 Update `plugin/scripts/create-run-config.js` to initialize `confidenceScores: {}` on run start
- [ ] 2.2 Update `plugin/scripts/update-json.js` (or equivalent) to support merging per-domain confidence score records into run config
- [ ] 2.3 Add `previousAggregate` lookup: when writing a domain's score for run N, read run N-1 config for that domain's aggregate (null if not found)

## 3. wip/confidence-scores.md generation

- [ ] 3.1 Add `writeConfidenceReport(domains, outputPath)` function to calculate-confidence.js that formats the per-domain markdown breakdown
- [ ] 3.2 Markdown format per domain: section header, inputs table, component sub-scores, aggregate score (decimal and %), delta from previous run with sign
- [ ] 3.3 Ensure file is fully overwritten each run (not appended)

## 4. Agent prompt updates

- [ ] 4.1 Update learning agent prompt template to emit structured confidence inputs instead of a raw percentage
- [ ] 4.2 Define allowed evidence strength tags in agent prompt: `[strong]`, `[medium]`, `[weak]`; document that untagged evidence = weak
- [ ] 4.3 Update plan agent (if it emits confidence) to use the same input format

## 5. Run review guide integration

- [ ] 5.1 Update run review guide generation to read wip/confidence-scores.md after calculate-confidence.js runs
- [ ] 5.2 Add confidence summary section to run review guide template showing per-domain score, percentage, and signed delta
- [ ] 5.3 Verify delta shows negative values when confidence decreases

## 6. Integration and wiring

- [ ] 6.1 Call calculate-confidence.js at end of each learning run cycle (after agents complete, before run review guide is generated)
- [ ] 6.2 Write resulting per-domain scores into run-N.config.json confidenceScores field
- [ ] 6.3 Remove or deprecate any code path that writes raw subjective confidence percentages to knowledge-state.md

## 7. Tests and validation

- [ ] 7.1 Add unit tests for all four component helpers in calculate-confidence.js (edge cases: zero denominators, empty inputs)
- [ ] 7.2 Add integration test: run calculate-confidence.js with known inputs, assert wip/confidence-scores.md content and run config output
- [ ] 7.3 Manually verify a run where new unknowns decrease the score
