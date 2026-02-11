## 1. Scripts - File Operations

- [x] 1.1 Create `scripts/clone-repos.sh` for git operations
- [x] 1.2 Add branch/tag checkout support to clone script
- [x] 1.3 Add error handling and validation to clone script
- [x] 1.4 Create `scripts/hash-files.js` for SHA-256 file hashing
- [x] 1.5 Add ignore patterns (node_modules, .git, build/) to hash script
- [x] 1.6 Add batch processing for large file sets to hash script
- [ ] 1.7 Test scripts independently with sample repos

## 2. Templates - Learning Plan

- [x] 2.1 Create `templates/learning-plan.md` template
- [x] 2.2 Add sections: Topics, Confidence Tracking, Priorities, Open Questions
- [x] 2.3 Create `templates/staging-readme.md` for run-N-staging areas
- [x] 2.4 Create `templates/feedback.md` template for user input
- [x] 2.5 Update `templates/brief.md` to include maxRuns explanation
- [x] 2.6 Update `scripts/scaffold-kb.sh` to create learning-plan.md

## 3. State Management - Configuration

- [x] 3.1 Update project.config.json template to include maxRuns field
- [x] 3.2 Update run-N.config.json template to include focusTopics
- [x] 3.3 Update run-N.config.json template to include confidenceChanges
- [x] 3.4 Add validation for new fields in read-state.js
- [ ] 3.5 Test JSON updates preserve all fields

## 4. Agent - Classifier

- [x] 4.1 Create `agents/deepfield-classifier.md`
- [x] 4.2 Implement source type classification (code/doc/config/schema/conversation/spec)
- [x] 4.3 Implement trust level classification (trusted/reference/exploratory)
- [x] 4.4 Implement domain relevance suggestions
- [x] 4.5 Add output format for classification results (JSON)
- [ ] 4.6 Test classifier with diverse source types

## 5. Agent - Scanner

- [x] 5.1 Create `agents/deepfield-scanner.md`
- [x] 5.2 Implement shallow structural scan logic
- [x] 5.3 Implement file tree analysis
- [x] 5.4 Implement entry point detection (main, index, package.json, etc.)
- [x] 5.5 Implement configuration file identification
- [x] 5.6 Add scope limiting based on domains
- [ ] 5.7 Test scanner on sample repositories

## 6. Agent - Domain Detector

- [ ] 6.1 Create `agents/deepfield-domain-detector.md`
- [ ] 6.2 Implement pattern recognition for common domains (auth, api, data, deploy)
- [ ] 6.3 Implement file path analysis for domain hints
- [ ] 6.4 Implement naming convention analysis
- [ ] 6.5 Add domain suggestion confidence scores
- [ ] 6.6 Generate domain-index.md structure
- [ ] 6.7 Test detector on various project types

## 7. Agent - Plan Generator

- [ ] 7.1 Create `agents/deepfield-plan-generator.md`
- [ ] 7.2 Implement initial plan generation from brief + scan
- [ ] 7.3 Implement priority setting based on user focus areas
- [ ] 7.4 Implement initial confidence estimation
- [ ] 7.5 Generate open questions from scan findings
- [ ] 7.6 Identify needed sources per topic
- [ ] 7.7 Write learning-plan.md in standard format
- [ ] 7.8 Test plan generation with various briefs

## 8. Skill - Bootstrap

- [ ] 8.1 Create `skills/deepfield-bootstrap.md`
- [ ] 8.2 Implement brief.md parsing
- [ ] 8.3 Orchestrate classifier agent invocation
- [ ] 8.4 Orchestrate clone-repos script for each repository
- [ ] 8.5 Organize sources into baseline/trusted-docs based on classification
- [ ] 8.6 Orchestrate scanner agent invocation
- [ ] 8.7 Orchestrate domain-detector agent invocation
- [ ] 8.8 Generate initial project-map.md
- [ ] 8.9 Orchestrate plan-generator agent invocation
- [ ] 8.10 Create run-0/ directory and initial findings.md
- [ ] 8.11 Write run-0.config.json with initial hashes
- [ ] 8.12 Create initial draft documents (skeletons)
- [ ] 8.13 Test bootstrap workflow end-to-end

## 9. Agent - Learner

- [ ] 9.1 Create `agents/deepfield-learner.md`
- [ ] 9.2 Implement context loading (domain notes, previous findings)
- [ ] 9.3 Implement focus topic selection from learning plan
- [ ] 9.4 Implement deep file reading based on focus
- [ ] 9.5 Implement cross-reference identification
- [ ] 9.6 Implement pattern recognition across files
- [ ] 9.7 Implement contradiction detection
- [ ] 9.8 Write findings.md for current run
- [ ] 9.9 Link findings to source files with line numbers
- [ ] 9.10 Test learner with focused topics

## 10. Agent - Knowledge Synthesizer

- [ ] 10.1 Create `agents/deepfield-knowledge-synth.md`
- [ ] 10.2 Implement draft document creation from findings
- [ ] 10.3 Implement draft document updates (preserve + integrate)
- [ ] 10.4 Maintain standard document structure (Overview, Architecture, Patterns, etc.)
- [ ] 10.5 Generate natural prose from observations
- [ ] 10.6 Add cross-references between related drafts
- [ ] 10.7 Update unknowns.md (add/remove gaps)
- [ ] 10.8 Append to _changelog.md with run summary
- [ ] 10.9 Mark low-confidence sections appropriately
- [ ] 10.10 Test synthesis with multiple runs

## 11. Skill - Iterate

- [ ] 11.1 Create `skills/deepfield-iterate.md`
- [ ] 11.2 Implement run number tracking and incrementing
- [ ] 11.3 Load previous run config and learning plan
- [ ] 11.4 Orchestrate hash-files script for incremental scanning
- [ ] 11.5 Compare hashes to identify changed/new files
- [ ] 11.6 Orchestrate learner agent with focus topics
- [ ] 11.7 Orchestrate knowledge-synth agent with findings
- [ ] 11.8 Update learning plan (confidence, priorities, questions)
- [ ] 11.9 Write run-N.config.json with new hashes and metadata
- [ ] 11.10 Implement stop condition evaluation logic
- [ ] 11.11 Implement autonomous loop (continue if conditions allow)
- [ ] 11.12 Create run-N+1-staging area after each run
- [ ] 11.13 Generate progress report after execution
- [ ] 11.14 Test single run mode (--once flag)
- [ ] 11.15 Test autonomous multi-run execution
- [ ] 11.16 Test all stop conditions

## 12. Command - Continue (Context-Aware Routing)

- [ ] 12.1 Update `commands/df-continue.md` with state detection
- [ ] 12.2 Implement routing: EMPTY → error
- [ ] 12.3 Implement routing: INITIALIZED → invoke start-interactive-setup
- [ ] 12.4 Implement routing: BRIEF_CREATED → prompt to fill brief
- [ ] 12.5 Implement routing: BRIEF_READY → invoke bootstrap
- [ ] 12.6 Implement routing: LEARNING + new input → invoke iterate
- [ ] 12.7 Implement routing: LEARNING + no input → prompt for sources
- [ ] 12.8 Implement routing: COMPLETE → suggest next actions
- [ ] 12.9 Add --once flag support for single-run mode
- [ ] 12.10 Test routing logic for all states

## 13. Command - Init (Optional Start)

- [ ] 13.1 Update `commands/df-init.md` to ask about starting setup
- [ ] 13.2 Use AskUserQuestion: "Yes, let's start" or "Skip for now"
- [ ] 13.3 If "Yes", invoke start-interactive-setup skill
- [ ] 13.4 If "Skip", display next steps message
- [ ] 13.5 Test both paths

## 14. Command - Start (Max Runs Configuration)

- [ ] 14.1 Update `commands/df-start.md` to ask about max runs
- [ ] 14.2 Add AskUserQuestion for max runs (3, 5, 10, Until plan complete)
- [ ] 14.3 Store maxRuns in project.config.json
- [ ] 14.4 Default to 5 if user skips question
- [ ] 14.5 Test max runs configuration

## 15. Command - Status (Learning Progress)

- [ ] 15.1 Update `commands/df-status.md` to read learning-plan.md
- [ ] 15.2 Display confidence levels per topic
- [ ] 15.3 Display open questions count
- [ ] 15.4 Display run count and last run timestamp
- [ ] 15.5 Suggest next action based on state
- [ ] 15.6 Test status display in various states

## 16. Integration Testing

- [ ] 16.1 Test full workflow: init → start → fill brief → bootstrap
- [ ] 16.2 Test autonomous iteration with sample codebase
- [ ] 16.3 Test user adding sources in staging area
- [ ] 16.4 Test all stop conditions trigger correctly
- [ ] 16.5 Test resume after interruption (Ctrl+C)
- [ ] 16.6 Test with large repository (1000+ files)
- [ ] 16.7 Verify incremental scanning efficiency
- [ ] 16.8 Verify draft accumulation across runs

## 17. Spec Sync

- [ ] 17.1 Archive core-learning-system change
- [ ] 17.2 Sync all delta specs to main specs
- [ ] 17.3 Verify no spec regressions
- [ ] 17.4 Update CLAUDE.md if needed
